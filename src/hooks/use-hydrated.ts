"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

/**
 * 返回是否已完成客户端挂载（用于避免依赖 `Math.random()` / `Date.now()` /
 * `localStorage` 等易变数据在 SSR 与 CSR 首次渲染不一致导致的 hydration 警告）。
 *
 * 用 `useSyncExternalStore` 实现，而非 `useEffect` 里 `setState`，
 * 以规避 React Compiler 的 `set-state-in-effect` 校验。
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
