import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // TradingView Charting Library vendor files — not our code
    "public/charting_library/**",
    // Auto-generated Cloudflare Workers types (`wrangler types`)
    "cloudflare-env.d.ts",
  ]),
  {
    rules: {
      // React Compiler 的这条规则会把"挂载后拉取数据/打开弹窗时重置表单"等
      // React 官方文档认可的合法 effect 用法也标记为错误。项目里几十处页面
      // 都用的是这种标准写法（`useEffect(() => { void load(); }, [...])`），
      // 逐一改造成无 effect 的数据获取方案属于架构级重构，收益有限且风险较高，
      // 故降级为 warning 保留可见性，而不是当作阻断构建的 error。
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
