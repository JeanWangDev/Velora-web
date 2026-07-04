# Velora-web

Velora 交易所前端 — 基于 `trading-client` 脚手架迁移。

## 技术栈

- Next.js 16 App Router + React 19
- Tailwind CSS v4 + next-themes
- Zustand + 自研 i18n（zh/en）
- TradingView Charting Library
- OpenNext Cloudflare 部署

## 本地启动

```bash
cp .env.example .env.local   # 首次
yarn install
yarn dev                     # http://localhost:3000
```

需同时启动 `Velora-api`（**必须** `http://localhost:4000`），Next 通过 rewrite 代理 `/api/v1/*`。

## 常见问题

| 现象 | 原因 | 处理 |
|------|------|------|
| 页面 API 报 `500 Internal Server Error` | 后端未在 **4000** 端口运行 | 先 `cd Velora-api && yarn dev`，确认 `curl localhost:4000/health` 正常 |
| `EADDRINUSE :4000` | 端口被占用 | `lsof -i :4000` 查进程并结束，或改 `PORT=4002` 且同步改 `.env.local` 的 `API_PROXY_TARGET` |
| `Another next dev server is already running` | 3000 已有 dev 进程 | `kill <PID>` 或直接用已有 `localhost:3000` |
| 登录/注册失败「数据库未启用」 | `DB_ENABLED=false` | 正常；配置 MySQL 后 `DB_ENABLED=true` 并 `yarn db:init` |
| `yarn lint` 报错 | 继承 trading-web 的 ESLint 规则 | **不影响** `yarn build`，可后续统一修 |

## 部署

```bash
yarn deploy        # Cloudflare Workers 生产
yarn deploy:test   # 测试环境
```

## 文档

产品与技术文档见 `../velora-prd/`。
