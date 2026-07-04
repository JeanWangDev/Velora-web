import { encodeFunctionData, parseAbi, parseUnits, stringToHex } from "viem";
import type {
  ChainTxReceipt,
  MockPerpOrderInput,
  MockPerpOrderResult,
} from "@/app/trade/_types/chain-trading";

type EthereumProvider = {
  request<T = unknown>(args: {
    method: string;
    params?: unknown[] | Record<string, unknown>;
  }): Promise<T>;
};

const BSC_TESTNET_EXPLORER = "https://testnet.bscscan.com";

export const BSC_TESTNET_MOCK_PERP_ADDRESS =
  process.env.NEXT_PUBLIC_BSC_TESTNET_MOCK_PERP_ADDRESS ?? "";

const MOCK_PERP_ABI = parseAbi([
  "function openPosition(bytes32 symbol,uint8 side,uint256 marginUsdc,uint256 leverageX100,uint256 stopLossPriceE8,uint256 takeProfitPriceE8) returns (uint256 positionId)",
]);

function assertConfiguredAddress(address: string): asserts address is `0x${string}` {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error("NEXT_PUBLIC_BSC_TESTNET_MOCK_PERP_ADDRESS is not configured");
  }
}

function toBytes32Symbol(symbol: string): `0x${string}` {
  return stringToHex(symbol.toUpperCase(), { size: 32 });
}

function toLeverageX100(value: string): bigint {
  const leverage = Number(value);
  if (!Number.isFinite(leverage) || leverage <= 0) {
    throw new Error("Invalid leverage");
  }
  return BigInt(Math.round(leverage * 100));
}

function buildOpenPositionData(order: MockPerpOrderInput) {
  return encodeFunctionData({
    abi: MOCK_PERP_ABI,
    functionName: "openPosition",
    args: [
      toBytes32Symbol(order.chartSymbol),
      order.side === "long" ? 1 : 2,
      parseUnits(order.marginUsdt, 6),
      toLeverageX100(order.leverage),
      BigInt(0),
      BigInt(0),
    ],
  });
}

export function isMockPerpConfigured() {
  return /^0x[a-fA-F0-9]{40}$/.test(BSC_TESTNET_MOCK_PERP_ADDRESS);
}

export async function submitMockPerpOrder(options: {
  provider: EthereumProvider;
  from: string;
  order: MockPerpOrderInput;
}): Promise<MockPerpOrderResult> {
  assertConfiguredAddress(BSC_TESTNET_MOCK_PERP_ADDRESS);

  const txHash = await options.provider.request<string>({
    method: "eth_sendTransaction",
    params: [
      {
        from: options.from,
        to: BSC_TESTNET_MOCK_PERP_ADDRESS,
        data: buildOpenPositionData(options.order),
      },
    ],
  });

  return {
    txHash,
    explorerUrl: `${BSC_TESTNET_EXPLORER}/tx/${txHash}`,
    mode: "mock-perp-testnet",
  };
}

export async function waitForTransactionReceipt(options: {
  provider: EthereumProvider;
  txHash: string;
  attempts?: number;
  intervalMs?: number;
}): Promise<ChainTxReceipt | null> {
  const attempts = options.attempts ?? 30;
  const intervalMs = options.intervalMs ?? 2000;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const receipt = await options.provider.request<ChainTxReceipt | null>({
      method: "eth_getTransactionReceipt",
      params: [options.txHash],
    });

    if (receipt) return receipt;
    await new Promise((resolve) => window.setTimeout(resolve, intervalMs));
  }

  return null;
}
