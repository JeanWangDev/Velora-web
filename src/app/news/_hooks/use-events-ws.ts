"use client";

import { useEffect, useRef } from "react";
import { getEventsWsUrl } from "@/config/api";
import type { EventListItem } from "@/app/news/_types/event";

type WsMessage =
  | { type: "hello" }
  | { type: "ping" }
  | { type: "pong" }
  | { type: "ack"; channel?: string }
  | { type: "error"; message?: string }
  | { type: "snapshot"; data: EventListItem[] }
  | { type: "event"; data: EventListItem };

const RECONNECT_MS = 5_000;

export function useEventsWs(onEvent?: (event: EventListItem) => void) {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    if (!onEvent) return;

    let ws: WebSocket | null = null;
    let closed = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (closed) return;

      try {
        ws = new WebSocket(getEventsWsUrl());
      } catch {
        scheduleReconnect();
        return;
      }

      ws.onopen = () => {
        ws?.send(JSON.stringify({ op: "subscribe", channel: "feed" }));
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(String(ev.data)) as WsMessage;
          if (msg.type === "ping") {
            ws?.send(JSON.stringify({ op: "ping" }));
            return;
          }
          if (msg.type === "error") {
            console.warn("[events-ws]", msg.message);
            return;
          }
          if (msg.type === "event" && msg.data?.id) {
            handlerRef.current?.(msg.data);
          }
        } catch {
          // ignore malformed
        }
      };

      ws.onerror = () => {
        console.warn("[events-ws] connection error");
      };

      ws.onclose = () => {
        if (!closed) scheduleReconnect();
      };
    };

    const scheduleReconnect = () => {
      if (reconnectTimer) return;
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, RECONNECT_MS);
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
      ws = null;
    };
  }, [onEvent]);
}
