# App 路由目录约定

本目录按 **Next.js App Router** 组织页面。业务代码优先放在对应路由下，**不要**随意放进 `src/components/`。

## 目录前缀（下划线 = 不参与路由）

| 目录 | 用途 | 何时提升为全局 |
|------|------|----------------|
| `_components/` | 仅本路由使用的 React 组件 | 被 ≥2 个路由复用时 → `src/components/` |
| `_config/` | 配置表、常量、纯数据（无 UI） | 同上 → `src/config/` |
| `_types/` | 本业务的 TS 类型 / 接口 | 同上 → `src/types/` |
| `_stores/` | 本业务的 Zustand 等状态 | 同上 → `src/stores/` |
| `_services/` | 本业务专属的 API 封装 | 同上 → `src/services/` |
| `_utils/` | 本业务专属工具函数 | 同上 → `src/utils/` |

## 全局层（`src/` 根下）

- `components/`：`site-header`、`auth/*`、`ui/*` 等全站共用
- `types/market.ts`、`lib/web-worker/`：行情 Worker、WS 等跨页面基础设施
- `services/api-client.ts`：通用 HTTP 客户端

## 各路由说明

- [`trade/README.md`](./trade/README.md) — 交易页 / TV 图表 / 指标面板
- [`dashboard/README.md`](./dashboard/README.md) — 数据大盘

占位页（`onchain`、`alert`、`sentiment`、`vip`、`api-docs`）文案在各自 `_config/page.ts`。
