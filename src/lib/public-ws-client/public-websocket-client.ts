import EventEmitter from 'eventemitter3';
import pako from 'pako';
import { TextBinaryConverter } from './text-binary-converter';

export enum WsEventTypeEnum {
  Message = 'message',
  StatusChange = 'statusChange',
  Reconnect = 'reconnect',
}

export const getWsEventMessageSubName = (name: string): string => `${WsEventTypeEnum.Message}:${name}`;

export const getWsConnectStatusChangeSubName = (name: string): string => `${WsEventTypeEnum.StatusChange}:${name}`;

export const getWsEventReconnectSubName = (name: string): string => `${WsEventTypeEnum.Reconnect}:${name}`;

export type WebSocketOptions = {
  name: string;
  url: string;
  protocols?: string | string[];
  heartbeatMessage?: null | string | (() => unknown);
  heartbeatInterval?: number;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  connectTimeout?: number;
  bufferMessages?: boolean;
  maxBufferedMessages?: number;
};

type IWebSocketWorkerMessage = {
  type: 'heartbeat';
  name: string;
};

declare let MozWebSocket: typeof WebSocket;

export type PublicWsTelemetryEvent = 'connected' | 'disconnected' | 'parse_error' | 'ws_error';

export type PublicWsTelemetryPayload = {
  name: string;
  /** 附加信息，由上层（如 Sentry）消费 */
  detail?: Record<string, unknown>;
};

export type PublicWsTelemetryFn = (event: PublicWsTelemetryEvent, payload: PublicWsTelemetryPayload) => void;

let telemetry: PublicWsTelemetryFn | undefined;

/** 业务项目可接入 Sentry / 日志；拷贝本目录到其他仓库时可选不配 */
export function configurePublicWsTelemetry(fn: PublicWsTelemetryFn | undefined) {
  telemetry = fn;
}

export const publicWebSocketEmitter = new EventEmitter();

let networkCleanup: Array<() => void> = [];

/**
 * 与业务侧 `WebSocketClient` 行为对齐的公共实现（无 Sentry / 无自定义 windowEventBus，使用原生 online/offline/visibilitychange）。
 * 本仓库通过 `src/utils/web-socket/websocket-client.ts` 薄封装接入 Sentry。
 */
export class PublicWebSocketClient {
  static worker?: Worker;

  static sockets: Map<WebSocketOptions['name'], WebSocket> = new Map();
  static reconnectFlags: Map<WebSocketOptions['name'], boolean> = new Map();
  static reconnectAttempts: Map<WebSocketOptions['name'], number> = new Map();
  static messageBuffers: Map<WebSocketOptions['name'], string[]> = new Map();
  static optionsMap: Map<WebSocketOptions['name'], WebSocketOptions> = new Map();

  static init() {
    if (typeof window === 'undefined') {
      return;
    }
    if (PublicWebSocketClient.worker) {
      return;
    }

    PublicWebSocketClient.worker = new Worker(new URL('./websocket-worker.ts', import.meta.url));
    PublicWebSocketClient.worker.onmessage = PublicWebSocketClient.workerOnMessage;

    const onOnline = () => PublicWebSocketClient.handleNetworkOnline();
    const onOffline = () => PublicWebSocketClient.handleNetworkOffline();
    const onVisibility = () => PublicWebSocketClient.handleVisibilitychange();

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    document.addEventListener('visibilitychange', onVisibility);

    networkCleanup = [
      () => window.removeEventListener('online', onOnline),
      () => window.removeEventListener('offline', onOffline),
      () => document.removeEventListener('visibilitychange', onVisibility),
    ];
  }

  /** 单测或卸载时移除全局监听与 Worker */
  static disposeInit() {
    networkCleanup.forEach(fn => fn());
    networkCleanup = [];
    PublicWebSocketClient.worker?.terminate();
    PublicWebSocketClient.worker = undefined;
  }

  static workerOnMessage = (event: MessageEvent) => {
    const { type, name } = TextBinaryConverter.decode(event.data) as IWebSocketWorkerMessage;

    try {
      switch (type) {
        case 'heartbeat': {
          const socket = PublicWebSocketClient.sockets.get(name)!;
          const options = PublicWebSocketClient.optionsMap.get(name)!;
          const message =
            typeof options.heartbeatMessage === 'function' ? JSON.stringify(options.heartbeatMessage()) : options.heartbeatMessage;

          PublicWebSocketClient.log(`【WebSocket】info：【${name}】 心跳已发送`, 'info');

          if (message) {
            socket.send(message);
          }
          break;
        }
      }
    } catch (error) {
      PublicWebSocketClient.log(`WebSocket: 【${name}】 无法解析消息: ${error}`, 'error');
    }
  };

  static handleNetworkOnline = () => {
    PublicWebSocketClient.optionsMap.forEach(value => {
      PublicWebSocketClient.connect(value);
    });
  };

  static handleNetworkOffline = () => {
    PublicWebSocketClient.optionsMap.forEach((_value, name) => {
      PublicWebSocketClient.disconnect(name, false);
    });
  };

  static handleVisibilitychange = () => {
    if (document.visibilityState === 'hidden') {
      PublicWebSocketClient.optionsMap.forEach((_value, name) => {
        PublicWebSocketClient.reconnectFlags.set(name, false);
      });
    }

    if (document.visibilityState === 'visible') {
      PublicWebSocketClient.optionsMap.forEach((_value, name) => {
        PublicWebSocketClient.reconnectFlags.set(name, true);
      });

      PublicWebSocketClient.optionsMap.forEach((value, name) => {
        const socket = PublicWebSocketClient.sockets.get(name);
        if (socket?.readyState !== WebSocket.OPEN) {
          PublicWebSocketClient.connect(value);
        }
      });
    }
  };

  static connect(options: WebSocketOptions): void {
    const merged: WebSocketOptions = {
      heartbeatInterval: 10000,
      reconnectInterval: 1000,
      maxReconnectAttempts: Infinity,
      connectTimeout: 10000,
      bufferMessages: true,
      maxBufferedMessages: 50,
      ...options,
    };

    const {
      name,
      url,
      protocols,
      heartbeatMessage = null,
      heartbeatInterval,
      maxReconnectAttempts,
      connectTimeout,
      bufferMessages,
    } = merged;

    const reconnectInterval = merged.reconnectInterval ?? 1000;

    if (PublicWebSocketClient.sockets.has(name)) {
      const readyState = PublicWebSocketClient.sockets.get(name)!.readyState;
      if ([+WebSocket.OPEN, WebSocket.CONNECTING, WebSocket.CLOSING].includes(readyState)) {
        return;
      }
      PublicWebSocketClient.disconnect(name);
    }

    const WebSocketConstructor = typeof WebSocket !== 'undefined' ? WebSocket : MozWebSocket;
    const socket = new WebSocketConstructor(url, protocols);
    PublicWebSocketClient.sockets.set(name, socket);
    PublicWebSocketClient.reconnectFlags.set(name, true);
    PublicWebSocketClient.reconnectAttempts.set(name, 0);
    PublicWebSocketClient.optionsMap.set(name, merged);
    if (bufferMessages) {
      PublicWebSocketClient.messageBuffers.set(name, []);
    }

    const connectTimer = setTimeout(() => {
      if (socket.readyState === WebSocket.CONNECTING) {
        PublicWebSocketClient.log(`连接超时: ${name}`, 'error');
        socket.close();
      }
    }, connectTimeout!);

    socket.onopen = () => {
      clearTimeout(connectTimer);
      PublicWebSocketClient.startHeartbeat(name, heartbeatMessage, heartbeatInterval);
      PublicWebSocketClient.flushBufferedMessages(name);
      publicWebSocketEmitter.emit(getWsConnectStatusChangeSubName(name), {
        wsEventType: WsEventTypeEnum.StatusChange,
        isConnected: true,
      });
      telemetry?.('connected', { name });
    };

    socket.onmessage = (event: MessageEvent) => {
      PublicWebSocketClient.handleMessage(name, event.data);
    };

    socket.onclose = event => {
      PublicWebSocketClient.worker?.postMessage(
        TextBinaryConverter.encode({
          type: 'clearHeartbeat',
          name,
        }),
      );

      publicWebSocketEmitter.emit(getWsConnectStatusChangeSubName(name), {
        wsEventType: WsEventTypeEnum.StatusChange,
        isConnected: false,
      });

      if (PublicWebSocketClient.reconnectFlags.get(name)) {
        const attempts = PublicWebSocketClient.reconnectAttempts.get(name) ?? 0;
        if (attempts < maxReconnectAttempts!) {
          const currentAttempts = attempts + 1;
          PublicWebSocketClient.reconnectAttempts.set(name, currentAttempts);
          PublicWebSocketClient.log(`WebSocket 正在进行重连中....: ${name}`, 'info');
          setTimeout(() => PublicWebSocketClient.connect(merged), reconnectInterval);
        } else {
          PublicWebSocketClient.log(`已达到最大重连次数: ${name}`, 'error');
        }
      }
      PublicWebSocketClient.log(
        `WebSocket: 【${name}】 已断开 —— onclose 事件触发, 代码: ${event.code};time:${new Date().toISOString()}`,
        'warn',
      );
      telemetry?.('disconnected', {
        name,
        detail: {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        },
      });
    };

    socket.onerror = error => {
      publicWebSocketEmitter.emit(getWsConnectStatusChangeSubName(name), {
        wsEventType: WsEventTypeEnum.StatusChange,
        isConnected: false,
      });
      PublicWebSocketClient.log(
        `WebSocket: 【${name}】 已断开 —— onerror 事件触发, 错误: ${JSON.stringify(error, null, 2)};time:${new Date().toISOString()}`,
        'error',
      );
      telemetry?.('ws_error', { name, detail: { error } });

      try {
        socket.close();
      } catch (closeErr) {
        PublicWebSocketClient.log(
          `WebSocket: 【${name}】 onerror 后 socket.close() 失败: ${closeErr};${new Date().toISOString()}`,
          'error',
        );
      }
    };
  }

  static disconnect(name: string, needReconnect = true): void {
    const socket = PublicWebSocketClient.sockets.get(name);
    if (socket) {
      PublicWebSocketClient.reconnectFlags.set(name, needReconnect);
      socket.close();
      PublicWebSocketClient.sockets.delete(name);
      PublicWebSocketClient.reconnectAttempts.delete(name);
      PublicWebSocketClient.messageBuffers.delete(name);
      PublicWebSocketClient.log(`WebSocket: 【${name}】 已断开 —— 手动断开;time:${new Date().toISOString()}`, 'info');
    }
  }

  static startHeartbeat(name: string, heartbeatMessage?: WebSocketOptions['heartbeatMessage'], interval?: number): void {
    const socket = PublicWebSocketClient.sockets.get(name);
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    const message = typeof heartbeatMessage === 'function' ? JSON.stringify(heartbeatMessage()) : heartbeatMessage;
    if (message) {
      PublicWebSocketClient.worker?.postMessage(
        TextBinaryConverter.encode({
          type: 'heartbeat',
          name,
          interval,
        }),
      );
    }
  }

  static handleMessage(name: string, data: string | Blob): void {
    const emitParsed = (parsed: unknown) => {
      try {
        publicWebSocketEmitter.emit(getWsEventMessageSubName(name), parsed);
      } catch (error) {
        PublicWebSocketClient.log(`ws emit 处理错误，错误 ws 名为：${name}，错误消息: ${error};time:${new Date().toISOString()}`, 'error');
      }
    };

    if (typeof data === 'string') {
      try {
        const parsedData = JSON.parse(data as string);
        emitParsed(parsedData);
      } catch (error) {
        PublicWebSocketClient.log(`WebSocket: 【${name}】 无法解析消息: ${error};time`, 'error');
        telemetry?.('parse_error', { name, detail: { error } });
      }
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      PublicWebSocketClient.log(`WebSocket: 【${name}】 Blob 读取失败`, 'error');
      telemetry?.('parse_error', { name, detail: { phase: 'file_reader' } });
    };
    reader.onload = () => {
      try {
        const text = pako.inflate(reader.result as pako.Data, { to: 'string' });
        const parsedData = JSON.parse(text);
        emitParsed(parsedData);
      } catch (error) {
        PublicWebSocketClient.log(`WebSocket: 【${name}】 无法解析消息: ${error};time`, 'error');
        telemetry?.('parse_error', { name, detail: { error } });
      }
    };
    reader.readAsArrayBuffer(data as Blob);
  }

  static getReconnectInterval(): number {
    const connection = (
      globalThis.navigator as Navigator & {
        connection?: { effectiveType?: string };
      }
    )?.connection;

    if (connection?.effectiveType) {
      switch (connection.effectiveType) {
        case '4g':
        case '5g':
          return 1000;
        case '3g':
          return 3000;
        case '2g':
          return 5000;
        default:
          return 5000;
      }
    }
    return 5000;
  }

  static _sendMessage({
    socket,
    options,
    name,
    message,
  }: {
    socket: WebSocket;
    options: WebSocketOptions;
    name: string;
    message: string | object;
  }): void {
    const data = typeof message === 'string' ? message : JSON.stringify(message);

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(data);
      PublicWebSocketClient.log(`消息已发送到 ${name}: ${data};time:${new Date().toISOString()}`, 'info');
    } else {
      PublicWebSocketClient.log(`WebSocket 未连接，消息已缓存: ${name};time:${new Date().toISOString()}`, 'warn');
      const buffer = PublicWebSocketClient.messageBuffers.get(name);
      if (buffer) {
        const max = options.maxBufferedMessages ?? 50;
        if (buffer.length < max) {
          buffer.push(data);
        } else {
          PublicWebSocketClient.log(`消息缓冲区已满，无法缓存更多消息: ${name};time:${new Date().toISOString()}`, 'warn');
        }
      }
    }
  }

  static sendMessage(name: string, message: (string | object) | (string | object)[]): void {
    const socket = PublicWebSocketClient.sockets.get(name);
    const options = PublicWebSocketClient.optionsMap.get(name);

    if (!socket || !options) {
      return;
    }

    if (Array.isArray(message)) {
      message.forEach(messageItem => {
        PublicWebSocketClient._sendMessage({ socket, options, message: messageItem, name });
      });
    } else {
      PublicWebSocketClient._sendMessage({ socket, options, message, name });
    }
  }

  static flushBufferedMessages(name: string): void {
    const socket = PublicWebSocketClient.sockets.get(name);
    if (socket && socket.readyState === WebSocket.OPEN) {
      const buffer = PublicWebSocketClient.messageBuffers.get(name);
      if (buffer) {
        while (buffer.length > 0) {
          const message = buffer.shift();
          if (message) {
            socket.send(message);
          }
        }
      }
    }
  }

  static getWsIsConnect(name: string): boolean {
    const socket = PublicWebSocketClient.sockets.get(name);
    if (!socket) {
      return false;
    }
    return socket.readyState === WebSocket.OPEN;
  }

  static log(message: string, level: 'info' | 'warn' | 'error' | 'success' = 'info'): void {
    const prefix = '%cws:';
    let style = 'color: white; background: gray; padding: 2px 4px; border-radius: 2px';

    switch (level) {
      case 'info':
        style = 'color: white; background: blue; padding: 2px 4px; border-radius: 2px';
        break;
      case 'warn':
        style = 'color: black; background: yellow; padding: 2px 4px; border-radius: 2px';
        break;
      case 'error':
        style = 'color: white; background: red; padding: 2px 4px; border-radius: 2px';
        break;
      case 'success':
        style = 'color: white; background: green; padding: 2px 4px; border-radius: 2px';
        break;
    }
    console.log(`${prefix} ${message}`, style);
  }
}
