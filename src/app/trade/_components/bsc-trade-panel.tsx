"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FlaskConical,
  Link2,
  Loader2,
  RefreshCw,
  Send,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useTranslation } from "@/i18n/use-translation";
import { toast } from "@/services/toast";
import type { ChainTxReceipt, MockPerpOrderResult } from "@/app/trade/_types/chain-trading";
import {
  isMockPerpConfigured,
  submitMockPerpOrder,
  waitForTransactionReceipt,
} from "@/app/trade/_utils/mock-perp-adapter";

type EthereumProvider = {
  request<T = unknown>(args: {
    method: string;
    params?: unknown[] | Record<string, unknown>;
  }): Promise<T>;
  on?: (event: string, handler: (payload: unknown) => void) => void;
  removeListener?: (event: string, handler: (payload: unknown) => void) => void;
  providers?: EthereumProvider[];
  isMetaMask?: boolean;
  isPhantom?: boolean;
  isOkxWallet?: boolean;
  isOKExWallet?: boolean;
  isBinance?: boolean;
};

type WalletProvider = {
  id: string;
  label: string;
  provider: EthereumProvider;
  rdns?: string;
  source?: "eip6963" | "legacy";
};

type Eip6963Detail = {
  info?: {
    uuid?: string;
    name?: string;
    rdns?: string;
  };
  provider?: EthereumProvider;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
    okxwallet?: EthereumProvider | { ethereum?: EthereumProvider };
    BinanceChain?: EthereumProvider;
  }
}

type Side = "long" | "short";
type OrderType = "market" | "limit";

type ContractPair = {
  id: string;
  label: string;
  marketType: string;
  adapter: string;
};

type DryRunIntent = {
  protocol: string;
  version: string;
  mode: "dry-run";
  chain: string;
  chartSymbol: string;
  contractPair: string;
  side: Side;
  orderType: OrderType;
  marginUsdt: string;
  leverage: string;
  slippagePercent: string;
  adapter: string;
  createdAt: string;
};

const BSC_TESTNET = {
  chainId: "0x61",
  chainName: "BNB Smart Chain Testnet",
  nativeCurrency: {
    name: "tBNB",
    symbol: "tBNB",
    decimals: 18,
  },
  rpcUrls: ["https://data-seed-prebsc-1-s1.bnbchain.org:8545"],
  blockExplorerUrls: ["https://testnet.bscscan.com"],
};

const CONTRACT_PAIRS: ContractPair[] = [
  {
    id: "btcb-usdt-perp",
    label: "BTCB/USDT Perpetual",
    marketType: "Perp dry-run",
    adapter: "TODO_BSC_PERP_ADAPTER",
  },
  {
    id: "bnb-usdt-perp",
    label: "BNB/USDT Perpetual",
    marketType: "Perp dry-run",
    adapter: "TODO_BSC_PERP_ADAPTER",
  },
  {
    id: "cake-usdt-spot",
    label: "CAKE/USDT Spot",
    marketType: "Spot TODO",
    adapter: "TODO_PANCAKESWAP_ROUTER",
  },
];

function isProvider(value: unknown): value is EthereumProvider {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof (value as EthereumProvider).request === "function"
  );
}

function walletLabel(provider: EthereumProvider, fallback: string): string {
  if (provider.isPhantom) return "Phantom";
  if (provider.isMetaMask) return "MetaMask";
  if (provider.isOkxWallet || provider.isOKExWallet) return "OKX Wallet";
  if (provider.isBinance) return "Binance Web3 Wallet";
  return fallback;
}

function walletKind(wallet: Pick<WalletProvider, "label" | "provider" | "rdns">): string {
  const rdns = wallet.rdns?.toLowerCase() ?? "";
  const label = wallet.label.toLowerCase();

  if (rdns === "io.metamask" || label.includes("metamask")) return "metamask";
  if (rdns.includes("phantom") || label.includes("phantom") || wallet.provider.isPhantom) {
    return "phantom";
  }
  if (wallet.provider.isMetaMask) return "metamask";
  if (
    rdns.includes("okx") ||
    label.includes("okx") ||
    wallet.provider.isOkxWallet ||
    wallet.provider.isOKExWallet
  ) {
    return "okx";
  }
  if (rdns.includes("binance") || label.includes("binance") || wallet.provider.isBinance) {
    return "binance";
  }
  return "injected";
}

function walletRank(wallet: WalletProvider): number {
  switch (walletKind(wallet)) {
    case "metamask":
      return 0;
    case "okx":
      return 1;
    case "binance":
      return 2;
    case "injected":
      return 3;
    case "phantom":
      return 9;
    default:
      return 5;
  }
}

function walletDedupeKey(wallet: WalletProvider): string {
  const kind = walletKind(wallet);
  if (kind !== "injected") return `kind:${kind}`;
  if (wallet.rdns) return `rdns:${wallet.rdns.toLowerCase()}`;
  return `label:${wallet.label.toLowerCase()}`;
}

function shouldReplaceWallet(existing: WalletProvider, next: WalletProvider): boolean {
  if (walletRank(next) < walletRank(existing)) return true;
  if (next.source === "eip6963" && existing.source !== "eip6963") return true;
  return next.label.length < existing.label.length;
}

function addWallet(
  list: WalletProvider[],
  id: string,
  label: string,
  provider: EthereumProvider,
  options: Pick<WalletProvider, "rdns" | "source"> = {},
) {
  const nextWallet: WalletProvider = { id, label, provider, ...options };
  const nextKey = walletDedupeKey(nextWallet);
  const existingIndex = list.findIndex(
    (item) => item.provider === provider || item.id === id || walletDedupeKey(item) === nextKey,
  );

  if (existingIndex >= 0) {
    if (shouldReplaceWallet(list[existingIndex], nextWallet)) {
      list[existingIndex] = nextWallet;
    }
    return;
  }

  list.push(nextWallet);
}

function discoverInjectedWallets(): WalletProvider[] {
  if (typeof window === "undefined") return [];
  const wallets: WalletProvider[] = [];
  const ethereum = window.ethereum;

  if (isProvider(ethereum)) {
    const providers = Array.isArray(ethereum.providers) ? ethereum.providers : [];
    providers.forEach((provider, index) => {
      if (!isProvider(provider)) return;
      addWallet(
        wallets,
        `injected-${index}-${walletLabel(provider, "wallet")}`,
        walletLabel(provider, `Injected Wallet ${index + 1}`),
        provider,
        { source: "legacy" },
      );
    });
    addWallet(wallets, "window-ethereum", walletLabel(ethereum, "Injected Wallet"), ethereum, {
      source: "legacy",
    });
  }

  const okxEthereum =
    isProvider(window.okxwallet) ? window.okxwallet : window.okxwallet?.ethereum;
  if (isProvider(okxEthereum)) {
    addWallet(wallets, "okx-wallet", "OKX Wallet", okxEthereum, { source: "legacy" });
  }

  if (isProvider(window.BinanceChain)) {
    addWallet(wallets, "binance-wallet", "Binance Web3 Wallet", window.BinanceChain, {
      source: "legacy",
    });
  }

  return wallets;
}

function mergeWallets(wallets: WalletProvider[]): WalletProvider[] {
  const merged: WalletProvider[] = [];
  for (const wallet of wallets) {
    addWallet(merged, wallet.id, wallet.label, wallet.provider, {
      rdns: wallet.rdns,
      source: wallet.source,
    });
  }
  return merged.sort((a, b) => walletRank(a) - walletRank(b) || a.label.localeCompare(b.label));
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function stringToHex(value: string): string {
  const bytes = new TextEncoder().encode(value);
  return `0x${Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
}

function readProviderError(error: unknown): { code?: number; message: string } {
  if (error && typeof error === "object") {
    const maybe = error as { code?: number; message?: string };
    return {
      code: maybe.code,
      message: maybe.message ?? "Unknown wallet error",
    };
  }
  return { message: "Unknown wallet error" };
}

function isUnsupportedPermissionsError(error: unknown): boolean {
  const { code } = readProviderError(error);
  return code === 4200 || code === -32601;
}

async function requestWalletAccounts(
  provider: EthereumProvider,
  forceAccountSelection: boolean,
): Promise<string[]> {
  if (forceAccountSelection) {
    try {
      await provider.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
    } catch (error) {
      if (!isUnsupportedPermissionsError(error)) {
        throw error;
      }
    }
  }

  return provider.request<string[]>({
    method: "eth_requestAccounts",
  });
}

function isBscTestnet(chainId: string | null): boolean {
  return chainId?.toLowerCase() === BSC_TESTNET.chainId.toLowerCase();
}

type BscTradePanelProps = {
  symbol: string;
};

export function BscTradePanel({ symbol }: BscTradePanelProps) {
  const t = useTranslation();
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [signing, setSigning] = useState(false);
  const [pairId, setPairId] = useState(CONTRACT_PAIRS[0].id);
  const [side, setSide] = useState<Side>("long");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [marginUsdt, setMarginUsdt] = useState("50");
  const [leverage, setLeverage] = useState("3");
  const [slippagePercent, setSlippagePercent] = useState("0.5");
  const [lastIntent, setLastIntent] = useState<DryRunIntent | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [txResult, setTxResult] = useState<MockPerpOrderResult | null>(null);
  const [txReceipt, setTxReceipt] = useState<ChainTxReceipt | null>(null);
  const [wallets, setWallets] = useState<WalletProvider[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>("");
  const [walletManuallySelected, setWalletManuallySelected] = useState(false);

  const activeWallet = useMemo(() => {
    if (wallets.length === 0) return null;
    return wallets.find((wallet) => wallet.id === selectedWalletId) ?? wallets[0];
  }, [selectedWalletId, wallets]);

  const providerAvailable = wallets.length > 0;
  const selectedPair = useMemo(
    () => CONTRACT_PAIRS.find((pair) => pair.id === pairId) ?? CONTRACT_PAIRS[0],
    [pairId],
  );

  const walletReady = Boolean(account);
  const testnetReady = isBscTestnet(chainId);
  const canSign = walletReady && testnetReady && !signing;
  const mockPerpConfigured = isMockPerpConfigured();

  const refreshWallets = useCallback((extraWallets: WalletProvider[] = []) => {
    const nextWallets = mergeWallets([...extraWallets, ...discoverInjectedWallets()]);
    setWallets(nextWallets);
    setSelectedWalletId((current) => {
      const currentWallet = nextWallets.find((wallet) => wallet.id === current);
      if (walletManuallySelected && currentWallet) return current;
      return nextWallets[0]?.id ?? "";
    });
    return nextWallets;
  }, [walletManuallySelected]);

  const resolveProvider = useCallback(() => {
    const nextWallets = refreshWallets();
    const selected =
      walletManuallySelected
        ? nextWallets.find((wallet) => wallet.id === selectedWalletId) ?? activeWallet
        : nextWallets[0] ?? activeWallet;
    return selected?.provider ?? null;
  }, [activeWallet, refreshWallets, selectedWalletId, walletManuallySelected]);

  const refreshChain = useCallback(async (provider?: EthereumProvider | null) => {
    const targetProvider = provider ?? resolveProvider();
    if (!targetProvider) return;
    const nextChainId = await targetProvider.request<string>({ method: "eth_chainId" });
    setChainId(nextChainId);
  }, [resolveProvider]);

  const connectWallet = useCallback(async (forceAccountSelection = false) => {
    const provider = resolveProvider();
    if (!provider) {
      toast.error(t("trade.bscTrade.walletUnavailable"));
      return;
    }

    setConnecting(true);
    try {
      const accounts = await requestWalletAccounts(provider, forceAccountSelection);
      setAccount(accounts[0] ?? null);
      await refreshChain(provider);
      toast.success(t("trade.bscTrade.walletConnected"));
    } catch (error) {
      toast.error(t("trade.bscTrade.connectFailed"), readProviderError(error).message);
    } finally {
      setConnecting(false);
    }
  }, [refreshChain, resolveProvider, t]);

  const switchToBscTestnet = useCallback(async () => {
    const provider = resolveProvider();
    if (!provider) {
      toast.error(t("trade.bscTrade.walletUnavailable"));
      return;
    }

    setSwitching(true);
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BSC_TESTNET.chainId }],
      });
      await refreshChain(provider);
      toast.success(t("trade.bscTrade.networkReady"));
    } catch (error) {
      const providerError = readProviderError(error);
      if (providerError.code === 4902) {
        try {
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [BSC_TESTNET],
          });
          await refreshChain(provider);
          toast.success(t("trade.bscTrade.networkReady"));
        } catch (addError) {
          toast.error(
            t("trade.bscTrade.networkSwitchFailed"),
            readProviderError(addError).message,
          );
        }
      } else {
        toast.error(t("trade.bscTrade.networkSwitchFailed"), providerError.message);
      }
    } finally {
      setSwitching(false);
    }
  }, [refreshChain, resolveProvider, t]);

  const submitOrder = useCallback(async () => {
    const provider = resolveProvider();
    if (!provider || !account) {
      toast.error(t("trade.bscTrade.walletRequired"));
      return;
    }
    if (!testnetReady) {
      toast.error(t("trade.bscTrade.testnetRequired"));
      return;
    }
    if (Number(marginUsdt) <= 0 || Number(leverage) <= 0) {
      toast.error(t("trade.bscTrade.invalidOrder"));
      return;
    }

    const order = {
      chartSymbol: symbol,
      contractPair: selectedPair.label,
      side,
      orderType,
      marginUsdt,
      leverage,
      slippagePercent,
    };

    const intent: DryRunIntent = {
      protocol: "Polaris Chain Trading",
      version: "0.1.0",
      mode: "dry-run",
      chain: "bsc-testnet",
      ...order,
      adapter: selectedPair.adapter,
      createdAt: new Date().toISOString(),
    };

    setSigning(true);
    setSignature(null);
    setLastIntent(null);
    setTxResult(null);
    setTxReceipt(null);
    try {
      if (mockPerpConfigured) {
        const result = await submitMockPerpOrder({ provider, from: account, order });
        setTxResult(result);
        toast.success(t("trade.bscTrade.txSubmitted"));
        const receipt = await waitForTransactionReceipt({ provider, txHash: result.txHash });
        setTxReceipt(receipt);
        if (receipt?.status === "0x1") {
          toast.success(t("trade.bscTrade.txConfirmed"));
        } else if (receipt?.status === "0x0") {
          toast.error(t("trade.bscTrade.txFailed"));
        }
        return;
      }

      const message = JSON.stringify(intent, null, 2);
      const nextSignature = await provider.request<string>({
        method: "personal_sign",
        params: [stringToHex(message), account],
      });
      setLastIntent(intent);
      setSignature(nextSignature);
      toast.success(t("trade.bscTrade.dryRunSuccess"));
    } catch (error) {
      toast.error(t("trade.bscTrade.dryRunFailed"), readProviderError(error).message);
    } finally {
      setSigning(false);
    }
  }, [
    account,
    leverage,
    marginUsdt,
    orderType,
    selectedPair,
    side,
    slippagePercent,
    symbol,
    t,
    testnetReady,
    resolveProvider,
    mockPerpConfigured,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const announcedWallets = new Map<string, WalletProvider>();
    const handleAnnounceProvider = (event: Event) => {
      const detail = (event as CustomEvent<Eip6963Detail>).detail;
      if (!isProvider(detail?.provider)) return;
      const id = detail.info?.uuid ?? detail.info?.rdns ?? `eip6963-${announcedWallets.size}`;
      const label = detail.info?.name ?? walletLabel(detail.provider, "Injected Wallet");
      announcedWallets.set(id, {
        id,
        label,
        provider: detail.provider,
        rdns: detail.info?.rdns,
        source: "eip6963",
      });
      refreshWallets(Array.from(announcedWallets.values()));
    };

    window.addEventListener("eip6963:announceProvider", handleAnnounceProvider);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    const timers = [
      window.setTimeout(() => refreshWallets(Array.from(announcedWallets.values())), 0),
      window.setTimeout(() => refreshWallets(Array.from(announcedWallets.values())), 300),
      window.setTimeout(() => refreshWallets(Array.from(announcedWallets.values())), 1200),
    ];

    return () => {
      window.removeEventListener("eip6963:announceProvider", handleAnnounceProvider);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [refreshWallets]);

  useEffect(() => {
    const provider = activeWallet?.provider;
    if (!provider) return;
    const targetProvider = provider;
    let disposed = false;

    async function syncConnectedWallet() {
      const [accounts, nextChainId] = await Promise.all([
        targetProvider.request<string[]>({ method: "eth_accounts" }).catch(() => []),
        targetProvider.request<string>({ method: "eth_chainId" }).catch(() => null),
      ]);
      if (disposed) return;
      setAccount(typeof accounts[0] === "string" ? accounts[0] : null);
      setChainId(typeof nextChainId === "string" ? nextChainId : null);
    }

    void syncConnectedWallet();

    if (!provider.on) {
      return () => {
        disposed = true;
      };
    }

    const handleAccountsChanged = (payload: unknown) => {
      const accounts = Array.isArray(payload) ? payload : [];
      setAccount(typeof accounts[0] === "string" ? accounts[0] : null);
    };

    const handleChainChanged = (payload: unknown) => {
      setChainId(typeof payload === "string" ? payload : null);
    };

    targetProvider.on?.("accountsChanged", handleAccountsChanged);
    targetProvider.on?.("chainChanged", handleChainChanged);

    return () => {
      disposed = true;
      targetProvider.removeListener?.("accountsChanged", handleAccountsChanged);
      targetProvider.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [activeWallet]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase text-muted">
              {t("trade.bscTrade.dryRunBadge")}
            </p>
            <h4 className="mt-1 text-sm font-semibold text-foreground">
              {t("trade.bscTrade.title")}
            </h4>
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${
              testnetReady
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-amber-500/10 text-amber-600"
            }`}
          >
            {testnetReady ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <AlertTriangle className="h-3 w-3" />
            )}
            {testnetReady ? t("trade.bscTrade.testnet") : t("trade.bscTrade.networkPending")}
          </span>
        </div>
        <p className="mt-2 text-xs leading-5 text-muted">
          {t("trade.bscTrade.subtitle")}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <section className="space-y-3 rounded-md border border-border bg-background/60 p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Wallet className="h-4 w-4 text-accent" />
              {t("trade.bscTrade.wallet")}
            </div>
            {account ? (
              <span className="rounded-full bg-accent/10 px-2 py-1 text-[11px] font-medium text-accent">
                {shortenAddress(account)}
              </span>
            ) : null}
          </div>

          {providerAvailable ? (
            <div className="space-y-2">
              <label className="block text-xs text-muted">
                {t("trade.bscTrade.wallet")}
                <select
                  value={activeWallet?.id ?? ""}
                  onChange={(event) => {
                    setWalletManuallySelected(true);
                    setSelectedWalletId(event.target.value);
                    setAccount(null);
                    setChainId(null);
                    setSignature(null);
                    setLastIntent(null);
                  }}
                  className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-2 text-xs text-foreground outline-none transition focus:border-accent/40"
                >
                  {wallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => void connectWallet()}
                  disabled={connecting}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-accent px-3 text-xs font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {connecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
                  {account ? t("trade.bscTrade.reconnect") : t("trade.bscTrade.connect")}
                </button>
                {account ? (
                  <button
                    type="button"
                    onClick={() => void connectWallet(true)}
                    disabled={connecting}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-foreground transition hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {connecting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    {t("trade.bscTrade.switchAccount")}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => void switchToBscTestnet()}
                  disabled={switching}
                  className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-foreground transition hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-60 ${
                    account ? "col-span-2" : ""
                  }`}
                >
                  {switching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                  {t("trade.bscTrade.switchTestnet")}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs leading-5 text-amber-700">
              {t("trade.bscTrade.walletInstallHint")}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md border border-border bg-surface px-2.5 py-2">
              <p className="text-muted">{t("trade.bscTrade.account")}</p>
              <p className="mt-1 truncate font-medium text-foreground">
                {account ? shortenAddress(account) : t("trade.bscTrade.notConnected")}
              </p>
            </div>
            <div className="rounded-md border border-border bg-surface px-2.5 py-2">
              <p className="text-muted">{t("trade.bscTrade.chain")}</p>
              <p className="mt-1 truncate font-medium text-foreground">
                {chainId ?? t("trade.bscTrade.unknownChain")}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-3 space-y-3 rounded-md border border-border bg-background/60 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FlaskConical className="h-4 w-4 text-accent" />
              {t("trade.bscTrade.orderForm")}
            </div>
            <span className="rounded-full bg-surface-muted px-2 py-1 text-[11px] text-muted">
              {t("trade.bscTrade.chartPair")}: {symbol}
            </span>
          </div>

          <label className="block text-xs text-muted">
            {t("trade.bscTrade.contractPair")}
            <select
              value={pairId}
              onChange={(event) => setPairId(event.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-2 text-xs text-foreground outline-none transition focus:border-accent/40"
            >
              {CONTRACT_PAIRS.map((pair) => (
                <option key={pair.id} value={pair.id}>
                  {pair.label} · {pair.marketType}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md bg-surface-muted p-1">
              {(["long", "short"] as const).map((nextSide) => (
                <button
                  key={nextSide}
                  type="button"
                  onClick={() => setSide(nextSide)}
                  className={`h-8 w-1/2 rounded text-xs font-medium transition ${
                    side === nextSide
                      ? nextSide === "long"
                        ? "bg-emerald-500 text-white"
                        : "bg-rose-500 text-white"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {nextSide === "long" ? t("trade.bscTrade.long") : t("trade.bscTrade.short")}
                </button>
              ))}
            </div>
            <div className="rounded-md bg-surface-muted p-1">
              {(["market", "limit"] as const).map((nextType) => (
                <button
                  key={nextType}
                  type="button"
                  onClick={() => setOrderType(nextType)}
                  className={`h-8 w-1/2 rounded text-xs font-medium transition ${
                    orderType === nextType
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {nextType === "market" ? t("trade.bscTrade.market") : t("trade.bscTrade.limit")}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <label className="block text-xs text-muted">
              {t("trade.bscTrade.margin")}
              <input
                type="number"
                min="0"
                inputMode="decimal"
                value={marginUsdt}
                onChange={(event) => setMarginUsdt(event.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-2 text-xs text-foreground outline-none transition focus:border-accent/40"
              />
            </label>
            <label className="block text-xs text-muted">
              {t("trade.bscTrade.leverage")}
              <input
                type="number"
                min="1"
                max="50"
                inputMode="decimal"
                value={leverage}
                onChange={(event) => setLeverage(event.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-2 text-xs text-foreground outline-none transition focus:border-accent/40"
              />
            </label>
            <label className="block text-xs text-muted">
              {t("trade.bscTrade.slippage")}
              <input
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                value={slippagePercent}
                onChange={(event) => setSlippagePercent(event.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-2 text-xs text-foreground outline-none transition focus:border-accent/40"
              />
            </label>
          </div>

          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs leading-5 text-amber-700">
            {mockPerpConfigured
              ? t("trade.bscTrade.mockPerpNotice")
              : t("trade.bscTrade.dryRunNotice")}
          </div>

          <button
            type="button"
            onClick={() => void submitOrder()}
            disabled={!canSign}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-accent text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {signing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {signing
              ? t("trade.bscTrade.signing")
              : mockPerpConfigured
                ? t("trade.bscTrade.submitTestnetOrder")
                : t("trade.bscTrade.signDryRun")}
          </button>
        </section>

        {txResult ? (
          <section className="mt-3 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              {t("trade.bscTrade.txSubmitted")}
            </div>
            <a
              href={txResult.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 break-all text-xs font-medium text-accent hover:underline"
            >
              {txResult.txHash}
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md border border-border bg-background/70 px-2.5 py-2">
                <p className="text-muted">{t("trade.bscTrade.receiptStatus")}</p>
                <p className="mt-1 font-medium text-foreground">
                  {txReceipt
                    ? txReceipt.status === "0x1"
                      ? t("trade.bscTrade.confirmed")
                      : t("trade.bscTrade.failed")
                    : t("trade.bscTrade.waitingReceipt")}
                </p>
              </div>
              <div className="rounded-md border border-border bg-background/70 px-2.5 py-2">
                <p className="text-muted">{t("trade.bscTrade.blockNumber")}</p>
                <p className="mt-1 truncate font-medium text-foreground">
                  {txReceipt ? Number.parseInt(txReceipt.blockNumber, 16) : "-"}
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {lastIntent && signature ? (
          <section className="mt-3 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              {t("trade.bscTrade.intentSigned")}
            </div>
            <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-background p-2 text-[11px] leading-5 text-foreground">
              {JSON.stringify(lastIntent, null, 2)}
            </pre>
            <p className="mt-2 break-all text-[11px] leading-5 text-muted">
              {t("trade.bscTrade.signature")}: {signature}
            </p>
          </section>
        ) : null}

        <section className="mt-3 rounded-md border border-border bg-background/60 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <ShieldCheck className="h-4 w-4 text-accent" />
            {t("trade.bscTrade.todoTitle")}
          </div>
          <div className="mt-2 space-y-2 text-xs leading-5 text-muted">
            <p>{t("trade.bscTrade.todoRouter")}</p>
            <p>{t("trade.bscTrade.todoAllowance")}</p>
            <p>{t("trade.bscTrade.todoRisk")}</p>
            <p>{t("trade.bscTrade.todoSolana")}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
