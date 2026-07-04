# `/news` Event Feed（MVP Lite）

与交易对绑定的事件时间线：`rss_coindesk` / `rss_odaily` + Binance 爆仓 WS。

- `_services/events-service.ts` — list / detail / chart
- `_hooks/use-events-ws.ts` — `ws://host:4000/ws/events`
- 品种列表：`GET /api/v1/market/trading-pairs`

```bash
cd trading-api
yarn db:cleanup    # 清理历史脏数据（已有库执行一次）
yarn ingest:news
```

图表：`/trade?symbol=BTCUSDT`
