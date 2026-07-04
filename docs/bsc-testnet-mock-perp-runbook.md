# BSC Testnet MockPerp Runbook

This runbook explains how to move from wallet dry-run signing to a real BSC Testnet transaction flow.

## Current State

The frontend supports two modes:

1. Dry-run signing mode: no contract address configured. The wallet signs a `TradeIntent` only.
2. MockPerp testnet mode: `NEXT_PUBLIC_BSC_TESTNET_MOCK_PERP_ADDRESS` is configured. The wallet sends a real BSC Testnet transaction to `MockPerpTrading.openPosition`.

## 1. Deploy MockPerpTrading

Contract file:

`contracts/MockPerpTrading.sol`

Deploy it to BSC Testnet with Remix, Hardhat, Foundry, or any deployment tool.

BSC Testnet parameters:

```text
Chain ID: 97
Hex Chain ID: 0x61
RPC: https://data-seed-prebsc-1-s1.bnbchain.org:8545
Explorer: https://testnet.bscscan.com
Gas token: tBNB
```

You need tBNB in the deploying wallet. Use the official BNB Chain testnet faucet.

## 2. Configure Frontend

Create `.env.local` locally. Do not commit it.

```bash
NEXT_PUBLIC_BSC_TESTNET_MOCK_PERP_ADDRESS=0xYourDeployedContractAddress

API_PROXY_TARGET=https://api.aipassly.com
NEXT_PUBLIC_API_BASE_URL=https://api.aipassly.com
NEXT_PUBLIC_API_WS_URL=wss://api.aipassly.com/ws/market
NEXT_PUBLIC_EVENTS_WS_URL=wss://api.aipassly.com/ws/events
```

Restart dev server:

```bash
npm run dev
```

## 3. Test an Order

1. Open `http://localhost:3000/trade`.
2. Open the right-side `链上交易` panel.
3. Select MetaMask.
4. Connect wallet.
5. Switch to BSC Testnet.
6. Make sure wallet has tBNB.
7. Fill order params.
8. Click `提交测试网订单`.
9. Confirm transaction in MetaMask.
10. Copy tx hash from the panel.
11. Open the BscScan Testnet link and verify transaction status is success.

## 4. Verify Data Correctness

Check these fields:

| Field | Frontend | BscScan event | TiDB |
|---|---|---|---|
| wallet | selected wallet address | `PositionOpened.user` | `wallet_address` |
| symbol | `BTCUSDT` | `PositionOpened.symbol` | `symbol` |
| side | long/short | `1`/`2` | `side` |
| margin | `50` | `50000000` for 6 decimals | `margin_usdc_raw` |
| leverage | `3` | `300` | `leverage_x100` |
| tx hash | panel result | transaction hash | `tx_hash` |
| status | confirmed | success receipt | `confirmed` |

## 5. TiDB Cloud Integration

Run schema:

`docs/sql/chain_trading_tidb.sql`

Backend API and event worker contract:

`docs/backend/chain-trading-api-contract.md`

Recommended flow:

1. Frontend submits tx.
2. Frontend receives tx hash.
3. Frontend calls backend `POST /api/v1/chain-trading/orders` with `submitted` status.
4. Event worker listens to `PositionOpened`.
5. Worker confirms order and inserts position.
6. Frontend queries backend orders/positions and displays persisted data.

## 6. Mainnet Migration

Mainnet is not a simple chain ID switch. Migration checklist:

1. Replace `MockPerpTrading` with a real protocol adapter.
2. Use protocol execution price, not fixed mock price.
3. Add real slippage handling.
4. Add max order size, max leverage, and risk confirmation.
5. Add production API event worker with idempotent log processing.
6. Add environment-specific config:

```text
testnet adapter: mock-perp
testnet chainId: 97
testnet contract: MockPerpTrading

mainnet adapter: real-perp-v1
mainnet chainId: 56 or another target chain
mainnet contract/router: real protocol address
```

7. Run at least 100 successful testnet orders before first mainnet transaction.
8. Start mainnet with whitelist users and low size limits.

