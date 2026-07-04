# `/trade` 交易页

本路由下的代码 **仅服务交易工作台**，不要提升到 `src/components/trade` 或 `src/config/trade-*`。

## 结构

```
trade/
├── page.tsx                 # 页面入口：工具栏 + 图表区 + 右侧面板
├── _types/
│   ├── chart.ts             # TV 周期、侧栏 Tab 等页面级类型
│   ├── indicators.ts        # 指标定义类型（与 TV study 映射相关）
│   ├── kline.ts             # 自研 K 线（lightweight-charts）类型
│   └── drawing.ts           # 画线工具类型
├── _config/
│   ├── intervals.ts         # 主周期按钮 +「更多」下拉选项
│   ├── panels.ts            # 右侧竖条 Tab（模板 / 研报 / 指标）
│   └── indicators.ts        # 指标目录数据 + getIndicatorById 等
├── _components/
│   ├── indicator-panel.tsx  # 右侧「指标」抽屉
│   ├── tv-chart/            # TradingView Charting Library 封装
│   └── kline/               # 自研 K 线组件（预留，当前页用 TV）
├── _stores/
│   └── use-drawing-store.ts # 画线状态（kline 模块用）
└── _utils/
    └── sma.ts               # 简单均线计算（kline 用）
```

## 数据流（K 线）

`page` → `tv-chart/datafeed` → `MarketWorkerManager` → `trading-api` `/api/v1/market/klines`  
实时：`MarketStreamClient` → `ws://.../ws/market`

全局类型 `types/market.ts` 表示后端 canonical 行情结构，本路由 datafeed 负责 TV resolution ↔ canonical 映射。
