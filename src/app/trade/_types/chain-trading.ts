export type ChainTradeSide = "long" | "short";
export type ChainOrderType = "market" | "limit";

export type MockPerpOrderInput = {
  chartSymbol: string;
  contractPair: string;
  side: ChainTradeSide;
  orderType: ChainOrderType;
  marginUsdt: string;
  leverage: string;
  slippagePercent: string;
};

export type MockPerpOrderResult = {
  txHash: string;
  explorerUrl: string;
  mode: "mock-perp-testnet";
};

export type ChainTxReceipt = {
  transactionHash: string;
  blockNumber: string;
  status?: "0x0" | "0x1";
};
