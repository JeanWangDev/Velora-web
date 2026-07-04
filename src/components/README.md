# 全局组件（`src/components`）

仅放 **全站复用** 的 UI 与逻辑。按路由划分的业务组件请放在 `src/app/<route>/_components/`。

| 目录 / 文件 | 说明 |
|-------------|------|
| `site-header.tsx` | 顶栏：导航、语言、主题、登录/账户 |
| `auth/` | 登录弹窗、用户菜单、资料编辑、AuthHydrator |
| `ui/` | Logo、主题切换、语言切换、Toast 容器 |
| `providers/` | ThemeProvider 等根级 Provider |
| `section-placeholder.tsx` | 多路由共用的建设中占位布局；文案在各路由 `_config/page.ts` |

交易页 TV 图表、指标面板等见 `app/trade/README.md`。
