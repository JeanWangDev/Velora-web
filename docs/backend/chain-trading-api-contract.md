# Chain Trading Backend Contract

This backend contract is for the BSC Testnet MockPerp flow. The current repo is the frontend client, so these APIs should be implemented in the backend service that connects to TiDB Cloud.

## Environment

```bash
TIDB_HOST=...
TIDB_PORT=4000
TIDB_USER=...
TIDB_PASSWORD=...
TIDB_DATABASE=...
TIDB_SSL=true

BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.bnbchain.org:8545
BSC_TESTNET_MOCK_PERP_ADDRESS=0x...
CHAIN_TRADING_ENV=testnet
```

Frontend environment:

```bash
NEXT_PUBLIC_BSC_TESTNET_MOCK_PERP_ADDRESS=0x...
```

When `NEXT_PUBLIC_BSC_TESTNET_MOCK_PERP_ADDRESS` is present, the frontend submits a real `eth_sendTransaction` to the BSC Testnet mock contract. Otherwise it falls back to dry-run signing.

## API: Create Local Order Record

The frontend can call this after `eth_sendTransaction` returns a tx hash. It records the pending order before the worker sees the event.

`POST /api/v1/chain-trading/orders`

Request:

```json
{
  "walletAddress": "0x1111111111111111111111111111111111111111",
  "chain": "bsc",
  "chainId": 97,
  "environment": "testnet",
  "adapter": "mock-perp",
  "contractAddress": "0x...",
  "txHash": "0x...",
  "symbol": "BTCUSDT",
  "contractPair": "BTCB/USDT Perpetual",
  "side": "long",
  "orderType": "market",
  "marginUsdcRaw": "50000000",
  "marginUsdcDisplay": "50",
  "leverageX100": 300,
  "slippagePercent": "0.5"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": 123,
    "status": "submitted"
  }
}
```

## API: List Orders

`GET /api/v1/chain-trading/orders?walletAddress=0x...&environment=testnet`

Response:

```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "txHash": "0x...",
      "symbol": "BTCUSDT",
      "side": "long",
      "marginUsdcDisplay": "50",
      "leverageX100": 300,
      "status": "confirmed",
      "blockNumber": 12345678,
      "submittedAt": "2026-06-09T10:00:00.000Z",
      "confirmedAt": "2026-06-09T10:00:18.000Z"
    }
  ]
}
```

## API: List Positions

`GET /api/v1/chain-trading/positions?walletAddress=0x...&environment=testnet&status=open`

Response:

```json
{
  "success": true,
  "data": [
    {
      "contractPositionId": "1",
      "openTxHash": "0x...",
      "symbol": "BTCUSDT",
      "side": "long",
      "marginUsdcRaw": "50000000",
      "leverageX100": 300,
      "entryPriceE8": "6500000000000",
      "status": "open",
      "openedAt": "2026-06-09T10:00:18.000Z"
    }
  ]
}
```

## Event Worker

The worker listens to `MockPerpTrading` logs and writes to TiDB Cloud.

Events:

```solidity
event PositionOpened(
  uint256 indexed positionId,
  address indexed user,
  bytes32 indexed symbol,
  uint8 side,
  uint256 marginUsdc,
  uint256 leverageX100,
  uint256 entryPriceE8,
  uint256 stopLossPriceE8,
  uint256 takeProfitPriceE8
);

event PositionClosed(
  uint256 indexed positionId,
  address indexed user,
  bytes32 indexed symbol,
  uint256 exitPriceE8
);
```

Worker loop:

1. Read `chain_event_checkpoints` for the contract and event.
2. Query RPC `eth_getLogs` from `last_block_number + 1` to current safe block.
3. Decode logs.
4. Insert into `chain_event_logs` using `(chain, chain_id, tx_hash, log_index)` as idempotency key.
5. Upsert `chain_trade_orders` status to `confirmed`.
6. Insert or update `chain_trade_positions`.
7. Advance checkpoint only after all logs are committed.

Safe block rule for testnet:

- Use current block minus 1 or 2 blocks.
- On mainnet, use a larger confirmation window depending on chain conditions.

## Data Correctness Checklist

For every order, these must match:

| Source | Required match |
|---|---|
| Frontend | tx hash, wallet, symbol, side, margin, leverage |
| BscScan Testnet | transaction to mock contract, method `openPosition`, successful status |
| Contract event | `PositionOpened` args match frontend order |
| TiDB order | tx hash and order fields match event |
| TiDB position | `contract_position_id`, entry price, margin, leverage match event |

## Mainnet Migration

Do not change UI code directly for mainnet. Add a new adapter config:

```ts
testnet: MockPerpAdapter -> MockPerpTrading address
mainnet: RealPerpAdapter -> real protocol router/adapter address
```

Before mainnet:

1. Replace mock fixed price with oracle/protocol execution price.
2. Add user-facing risk confirmation.
3. Limit first production users by whitelist.
4. Set max order size and max leverage.
5. Monitor failed transaction rate.
6. Keep chain event worker idempotent.
7. Reconcile frontend, backend, and chain data daily.

