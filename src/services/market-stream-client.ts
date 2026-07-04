import type {
  CanonicalInterval,
  IKlineTick,
  ITicker24h,
  ITradeTick,
} from "@/types/market";
import { getMarketWsUrl } from "@/config/api";
import {
  PublicWebSocketClient,
  getWsConnectStatusChangeSubName,
  getWsEventMessageSubName,
  publicWebSocketEmitter,
} from "@/lib/public-ws-client";
import { toast } from "@/services/toast";
import { resolveNetworkErrorMessage } from "@/utils/network-error";

/**
 * Singleton WebSocket client for the unified market data hub.
 *
 * Built on top of `PublicWebSocketClient` (public-Jean pattern):
 * - Heartbeat runs in a dedicated Worker thread
 * - Auto-reconnect with exponential backoff
 * - online/offline + visibilitychange handling
 *
 * Wire protocol matches `trading-api/src/ws/market-hub.ts`.
 * Channels: kline, aggTrade, ticker.
 */

const WS_CONNECTION_NAME = "market";
const SUBSCRIBE_TIMEOUT_MS = 20_000;

type Listener = {
  kind: "kline";
  onTick: (tick: IKlineTick) => void;
};

type TradeListener = {
  kind: "trade";
  onTrade: (trade: ITradeTick) => void;
};

type TickerListener = {
  kind: "ticker";
  onTicker: (ticker: ITicker24h) => void;
};

type AnyListener = Listener | TradeListener | TickerListener;

interface PendingSubscription {
  clientId: string;
  request: SubscribeRequest;
  listener: AnyListener;
  resolve: (subscriptionId: string) => void;
  reject: (error: Error) => void;
}

interface ActiveSubscription {
  clientId: string;
  subscriptionId: string;
  request: SubscribeRequest;
  listener: AnyListener;
}

type SubscribeRequest =
  | {
      channel: "kline";
      exchange: string;
      symbol: string;
      interval: CanonicalInterval;
    }
  | {
      channel: "aggTrade";
      exchange: string;
      symbol: string;
    }
  | {
      channel: "ticker";
      exchange: string;
      symbol: string;
    };

function resolveWsUrl(): string {
  return getMarketWsUrl();
}

class MarketStreamClient {
  private clientCounter = 0;
  private requestCounter = 0;
  private initialized = false;

  private pending = new Map<string, PendingSubscription>();
  private active = new Map<string, ActiveSubscription>();
  private serverToClient = new Map<string, string>();
  private requestIdToClient = new Map<string, string>();
  private subscribeTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
  private outbox: PendingSubscription[] = [];
  private wsErrorToastShown = false;
  private suppressErrorToasts = 0;

  private messageHandler = (frame: unknown) => {
    this.handleMessage(frame);
  };

  private statusHandler = (payload: { isConnected?: boolean }) => {
    if (payload.isConnected) {
      this.wsErrorToastShown = false;
      this.replaySubscriptions();
      return;
    }

    if (
      !this.shouldShowErrorToasts() ||
      this.wsErrorToastShown ||
      (this.pending.size === 0 && this.active.size === 0 && this.outbox.length === 0)
    ) {
      return;
    }

    this.wsErrorToastShown = true;
    toast.error(resolveNetworkErrorMessage(new Error("WebSocket disconnected"), "ws"));
  };

  pushSuppressErrorToasts(): void {
    this.suppressErrorToasts += 1;
  }

  popSuppressErrorToasts(): void {
    this.suppressErrorToasts = Math.max(0, this.suppressErrorToasts - 1);
  }

  private shouldShowErrorToasts(): boolean {
    return this.suppressErrorToasts === 0;
  }

  subscribeKline(
    exchange: string,
    symbol: string,
    interval: CanonicalInterval,
    onTick: (tick: IKlineTick) => void,
  ): () => void {
    return this.subscribe(
      { channel: "kline", exchange, symbol, interval },
      { kind: "kline", onTick },
    );
  }

  subscribeTrades(
    exchange: string,
    symbol: string,
    onTrade: (trade: ITradeTick) => void,
  ): () => void {
    return this.subscribe(
      { channel: "aggTrade", exchange, symbol },
      { kind: "trade", onTrade },
    );
  }

  subscribeTicker(
    exchange: string,
    symbol: string,
    onTicker: (ticker: ITicker24h) => void,
  ): () => void {
    return this.subscribe(
      { channel: "ticker", exchange, symbol },
      { kind: "ticker", onTicker },
    );
  }

  dispose() {
    for (const sub of this.active.values()) {
      this.sendUnsubscribe(sub.subscriptionId);
    }

    this.pending.clear();
    this.active.clear();
    this.serverToClient.clear();
    this.requestIdToClient.clear();
    for (const timer of this.subscribeTimeouts.values()) {
      clearTimeout(timer);
    }
    this.subscribeTimeouts.clear();
    this.outbox.length = 0;
    this.wsErrorToastShown = false;

    publicWebSocketEmitter.off(
      getWsEventMessageSubName(WS_CONNECTION_NAME),
      this.messageHandler,
    );
    publicWebSocketEmitter.off(
      getWsConnectStatusChangeSubName(WS_CONNECTION_NAME),
      this.statusHandler,
    );

    PublicWebSocketClient.disconnect(WS_CONNECTION_NAME, false);
    this.initialized = false;
  }

  private ensureInitialized() {
    if (this.initialized || typeof window === "undefined") {
      return;
    }

    PublicWebSocketClient.init();
    PublicWebSocketClient.connect({
      name: WS_CONNECTION_NAME,
      url: resolveWsUrl(),
      heartbeatMessage: () => ({ op: "ping" }),
      heartbeatInterval: 25_000,
      reconnectInterval: 1_000,
      maxReconnectAttempts: Infinity,
      bufferMessages: true,
      maxBufferedMessages: 100,
    });

    publicWebSocketEmitter.on(
      getWsEventMessageSubName(WS_CONNECTION_NAME),
      this.messageHandler,
    );
    publicWebSocketEmitter.on(
      getWsConnectStatusChangeSubName(WS_CONNECTION_NAME),
      this.statusHandler,
    );

    this.initialized = true;
  }

  private subscribe(
    request: SubscribeRequest,
    listener: AnyListener,
  ): () => void {
    this.ensureInitialized();

    this.clientCounter += 1;
    const clientId = `c_${this.clientCounter}`;

    const subscriptionPromise = new Promise<string>((resolve, reject) => {
      const pending: PendingSubscription = {
        clientId,
        request,
        listener,
        resolve,
        reject,
      };
      this.pending.set(clientId, pending);

      const timeoutId = setTimeout(() => {
        this.subscribeTimeouts.delete(clientId);
        const entry = this.pending.get(clientId);
        if (!entry) return;
        this.pending.delete(clientId);
        entry.reject(
          new Error(
            "行情订阅超时，请确认 trading-api 已启动且 NEXT_PUBLIC_API_WS_URL 配置正确",
          ),
        );
      }, SUBSCRIBE_TIMEOUT_MS);
      this.subscribeTimeouts.set(clientId, timeoutId);

      if (PublicWebSocketClient.getWsIsConnect(WS_CONNECTION_NAME)) {
        this.sendSubscribe(pending);
      } else {
        this.outbox.push(pending);
      }
    });

    let cancelled = false;

    const cancel = () => {
      if (cancelled) return;
      cancelled = true;

      const timer = this.subscribeTimeouts.get(clientId);
      if (timer) {
        clearTimeout(timer);
        this.subscribeTimeouts.delete(clientId);
      }

      this.pending.delete(clientId);
      this.outbox = this.outbox.filter((item) => item.clientId !== clientId);

      subscriptionPromise
        .then((subscriptionId) => {
          this.active.delete(clientId);
          this.serverToClient.delete(subscriptionId);
          this.sendUnsubscribe(subscriptionId);
        })
        .catch(() => {
          /* subscription never completed */
        });
    };

    return cancel;
  }

  private replaySubscriptions() {
    for (const pending of this.outbox.splice(0)) {
      this.sendSubscribe(pending);
    }

    for (const sub of this.active.values()) {
      this.serverToClient.delete(sub.subscriptionId);
      this.pending.set(sub.clientId, {
        clientId: sub.clientId,
        request: sub.request,
        listener: sub.listener,
        resolve: () => {},
        reject: () => {},
      });
      this.sendSubscribe(this.pending.get(sub.clientId)!);
    }
    this.active.clear();
  }

  private sendSubscribe(pending: PendingSubscription) {
    if (!PublicWebSocketClient.getWsIsConnect(WS_CONNECTION_NAME)) {
      if (!this.outbox.includes(pending)) {
        this.outbox.push(pending);
      }
      return;
    }

    const requestId = this.nextRequestId();
    const payload =
      pending.request.channel === "kline"
        ? {
            op: "subscribe",
            channel: "kline",
            exchange: pending.request.exchange,
            symbol: pending.request.symbol,
            interval: pending.request.interval,
            id: requestId,
          }
        : pending.request.channel === "aggTrade"
          ? {
              op: "subscribe",
              channel: "aggTrade",
              exchange: pending.request.exchange,
              symbol: pending.request.symbol,
              id: requestId,
            }
          : {
              op: "subscribe",
              channel: "ticker",
              exchange: pending.request.exchange,
              symbol: pending.request.symbol,
              id: requestId,
            };

    this.requestIdToClient.set(requestId, pending.clientId);
    PublicWebSocketClient.sendMessage(WS_CONNECTION_NAME, payload);
  }

  private sendUnsubscribe(subscriptionId: string) {
    if (!PublicWebSocketClient.getWsIsConnect(WS_CONNECTION_NAME)) {
      return;
    }

    const requestId = this.nextRequestId();
    PublicWebSocketClient.sendMessage(WS_CONNECTION_NAME, {
      op: "unsubscribe",
      subscriptionId,
      id: requestId,
    });
  }

  private nextRequestId(): string {
    this.requestCounter += 1;
    return `req_${this.requestCounter}`;
  }

  private handleMessage(raw: unknown) {
    const frame = raw as Record<string, unknown>;
    const type = frame.type as string | undefined;

    if (type === "ack" && frame.op === "subscribe") {
      const requestId = frame.id as string | undefined;
      const subscriptionId = frame.subscriptionId as string | undefined;
      if (!requestId || !subscriptionId) return;

      const clientId = this.requestIdToClient.get(requestId);
      this.requestIdToClient.delete(requestId);
      if (!clientId) return;

      const pending = this.pending.get(clientId);
      if (!pending) return;

      const timer = this.subscribeTimeouts.get(clientId);
      if (timer) {
        clearTimeout(timer);
        this.subscribeTimeouts.delete(clientId);
      }

      this.pending.delete(clientId);
      this.active.set(clientId, {
        clientId,
        subscriptionId,
        request: pending.request,
        listener: pending.listener,
      });
      this.serverToClient.set(subscriptionId, clientId);
      pending.resolve(subscriptionId);
      return;
    }

    if (type === "error") {
      const requestId = frame.id as string | undefined;
      const rawMessage = (frame.message as string | undefined) ?? "stream error";
      const message =
        rawMessage.length > 120 ? `${rawMessage.slice(0, 120)}…` : rawMessage;

      if (requestId) {
        const clientId = this.requestIdToClient.get(requestId);
        this.requestIdToClient.delete(requestId);

        if (clientId) {
          const pending = this.pending.get(clientId);
          if (pending) {
            const timer = this.subscribeTimeouts.get(clientId);
            if (timer) {
              clearTimeout(timer);
              this.subscribeTimeouts.delete(clientId);
            }
            this.pending.delete(clientId);
            pending.reject(new Error(message));
            if (this.shouldShowErrorToasts()) {
              toast.error(`行情订阅失败：${message}`);
            }
            return;
          }
        }
      }

      if (this.shouldShowErrorToasts()) {
        toast.error(`行情通道错误：${message}`);
      }
      console.warn("[market-stream]", rawMessage);
      return;
    }

    if (type === "kline") {
      const subscriptionId = frame.subscriptionId as string | undefined;
      if (!subscriptionId) return;
      const clientId = this.serverToClient.get(subscriptionId);
      if (!clientId) return;
      const sub = this.active.get(clientId);
      if (!sub || sub.listener.kind !== "kline") return;
      sub.listener.onTick(frame.data as IKlineTick);
      return;
    }

    if (type === "trade") {
      const subscriptionId = frame.subscriptionId as string | undefined;
      if (!subscriptionId) return;
      const clientId = this.serverToClient.get(subscriptionId);
      if (!clientId) return;
      const sub = this.active.get(clientId);
      if (!sub || sub.listener.kind !== "trade") return;
      sub.listener.onTrade(frame.data as ITradeTick);
      return;
    }

    if (type === "ticker") {
      const subscriptionId = frame.subscriptionId as string | undefined;
      if (!subscriptionId) return;
      const clientId = this.serverToClient.get(subscriptionId);
      if (!clientId) return;
      const sub = this.active.get(clientId);
      if (!sub || sub.listener.kind !== "ticker") return;
      sub.listener.onTicker(frame.data as ITicker24h);
    }
  }
}

let singleton: MarketStreamClient | null = null;

export function getMarketStreamClient(): MarketStreamClient {
  if (!singleton) {
    singleton = new MarketStreamClient();
  }
  return singleton;
}

export type { MarketStreamClient };
