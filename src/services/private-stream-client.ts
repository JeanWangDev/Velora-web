"use client";

import { getPrivateWsUrl } from "@/config/api";
import { getAccessTokenCookie } from "@/utils/auth-cookie";

type Handler = (payload: { type: string; data: unknown }) => void;

let socket: WebSocket | null = null;
let handlers = new Set<Handler>();
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function connect() {
  const token = getAccessTokenCookie();
  if (!token || typeof window === "undefined") return;

  const url = getPrivateWsUrl();
  socket?.close();
  socket = new WebSocket(url);

  socket.onmessage = (ev) => {
    try {
      const frame = JSON.parse(String(ev.data)) as { type: string; data: unknown };
      if (frame.type === "pong") return;
      for (const h of handlers) h(frame);
    } catch {
      /* noop */
    }
  };

  socket.onclose = () => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connect, 3000);
  };

  socket.onopen = () => {
    socket?.send(JSON.stringify({ op: "ping" }));
  };
}

export function subscribePrivateStream(handler: Handler): () => void {
  handlers.add(handler);
  if (!socket || socket.readyState === WebSocket.CLOSED) {
    connect();
  }
  return () => {
    handlers.delete(handler);
    if (handlers.size === 0) {
      socket?.close();
      socket = null;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    }
  };
}

export function disconnectPrivateStream() {
  handlers.clear();
  socket?.close();
  socket = null;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}
