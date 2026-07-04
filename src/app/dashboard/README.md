# `/dashboard` 数据大盘

本路由自包含大盘 UI、类型、接口与状态。

```
dashboard/
├── page.tsx                          # 布局容器（max-w-7xl）
├── _components/dashboard-page-client.tsx  # 客户端图表与卡片
├── _types/dashboard.ts               # Overview API 响应类型
├── _services/dashboard-overview-service.ts
└── _stores/use-dashboard-store.ts
```

接口：`GET /api/v1/dashboard/overview`（经 `apiClient`）。
