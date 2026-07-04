# 币圈 Agent 交易网站技术方案

本文面向个人起步阶段，目标是做一个提供币圈 Agent、策略/指标售卖，并允许用户在网站内下单交易的产品。这里比较两条主要路线：

- 路线 A：非托管 Web3 钱包连接，用户资产仍在用户钱包里。
- 路线 B：托管式 USDC 充值账户，用户把 USDC 充到平台地址后在站内交易。

结论先行：个人或早期团队建议优先做路线 A，并把“卖策略和指标 + Agent 辅助下单 + 用户自己签名”作为 MVP。路线 B 技术上能做，体验更像交易所，但它会把你推向托管、资金账户、风控、合规、钱包安全和对账系统，成本和风险显著更高。

## 1. 业务目标

你的业务可以拆成三个产品层：

1. Agent 层：给用户提供币圈 Agent，能读行情、新闻、链上数据、技术指标，并给出交易建议或执行建议。
2. 交易层：用户可以在网站内下单交易，优先合约，后续考虑现货。
3. 内容/工具层：售卖策略、指标、模板、Agent 套餐、会员权限。

最重要的是区分“建议”和“代客执行”：

- 只卖指标/策略/工具：风险最低。
- 给用户生成下单建议，用户自己确认：风险中等。
- Agent 自动替用户下单：风险较高。
- 用户资产充值到你平台，由你保管和交易：风险最高。

## 2. 路线 A：连接 Web3 钱包，非托管交易

### 2.1 产品流程

用户流程：

1. 用户注册网站账号。
2. 用户连接钱包，例如 MetaMask、OKX Wallet、Binance Web3 Wallet。
3. 网站读取钱包地址和网络。
4. 用户选择 Agent、策略或指标模板。
5. Agent 生成交易计划，例如做多 BTC、保证金 100 USDC、杠杆 3x、止损价、止盈价。
6. 前端构造链上交易或签名意图。
7. 用户在钱包里确认签名或交易。
8. 交易进入链上协议，例如 DEX、perp protocol、vault contract。
9. 网站读取链上仓位、订单、余额、PnL 并展示。

关键原则：用户私钥不进入你的网站，资产不进入你的托管钱包。

### 2.2 技术实现

前端：

- 钱包连接：EIP-1193 Provider、EIP-6963 多钱包发现、WalletConnect/Reown AppKit。
- 网络：第一阶段建议先支持 EVM 链，比如 Arbitrum、Base、BSC、Polygon。
- 交易 UI：右侧交易面板，包括多空、数量、杠杆、滑点、止盈止损。
- 策略 UI：指标模板、Agent 建议、回测结果、风险提示。

后端：

- 保存用户账号、会员权限、策略订阅关系。
- 保存 Agent 输出的交易计划。
- 保存用户确认后的交易哈希。
- 同步链上订单、仓位、资金变化。
- 风控和审计日志。

链上：

- 现货交易：接 Uniswap、PancakeSwap、1inch、0x 等聚合器。
- 合约交易：接现成链上永续合约协议，或先做 paper trading。
- 自动交易：后续可以用 session key、account abstraction、Safe module、智能合约 vault 实现受限授权。

### 2.3 自动 Agent 的实现方式

如果想让 Agent 自动下单，非托管也能做，但要分阶段：

第一阶段：用户每次确认

- Agent 生成订单。
- 用户点击确认。
- 钱包弹窗签名。
- 优点是最安全、最容易上线。

第二阶段：受限授权

- 用户授权一个策略合约或 session key。
- 只能交易指定币种、最大仓位、最大杠杆、最大亏损。
- 用户随时撤销授权。
- 适合成熟后做自动化。

第三阶段：策略 vault

- 用户把资金存入非托管智能合约。
- Agent 只能按合约规则操作。
- 合约约束最大风险。
- 需要智能合约审计，成本会上升。

### 2.4 优点

- 不托管用户资产，合规和安全压力低很多。
- 适合个人或小团队快速做 MVP。
- 可以先把核心商业价值放在 Agent、策略、指标、会员。
- 用户信任门槛低，不需要把钱转给你。
- 出问题时，资金主要仍在用户钱包或第三方链上协议。

### 2.5 缺点

- 用户体验比交易所复杂，需要钱包、Gas、网络切换。
- 自动交易难度比托管账户高。
- 每笔交易需要签名，频繁策略会影响体验。
- 链上合约品种和流动性有限，不一定有所有币对。
- 移动端钱包兼容要额外处理。

### 2.6 成本估算

个人 MVP 成本最低：

- 前端钱包连接和交易面板：低到中。
- 策略/指标/会员系统：中。
- 链上数据同步：中。
- 真实合约交易接入：中到高，取决于协议。
- 合约审计：如果不自写资金合约，可以暂时不做。

推荐个人阶段成本控制：

- 先不自研交易协议。
- 先不自建托管钱包。
- 先不开放自动扣用户资金。
- 用现成 DEX/perp 协议或 paper trading 跑通闭环。

## 3. 路线 B：USDC 充值到账户，托管式交易

你截图里的模式属于这种。用户不是连接钱包下单，而是把 USDC 充到平台指定地址，平台给用户记账。

### 3.1 产品流程

用户流程：

1. 用户注册网站账号。
2. 系统给用户显示一个充值地址和二维码。
3. 用户向该地址充值 USDC，例如 Arbitrum One USDC。
4. 后端监听链上 USDC Transfer 事件。
5. 达到确认数后，平台给用户资金账户增加余额。
6. 用户把资金账户划转到交易账户。
7. 用户或 Agent 在平台内下单。
8. 平台内部更新保证金、仓位、冻结金额、PnL。
9. 用户提现时，平台从热钱包或提现钱包转 USDC 给用户。

这里用户看到的是“网站余额”，不是钱包余额。

### 3.2 技术架构

核心模块：

- 用户系统：账号、登录、2FA、设备管理、风控等级。
- 充值系统：充值地址、二维码、链上监听、入账确认。
- 账本系统：资金账户、交易账户、冻结余额、可用余额、流水。
- 交易系统：订单、仓位、成交、手续费、保证金、PnL。
- 提现系统：提现地址、审核、风控、链上转账。
- 钱包系统：地址生成、私钥管理、热钱包、冷钱包、多签或 MPC。
- 对账系统：链上余额、平台账本、交易账户每日对账。
- 风控系统：反洗钱、异常充值、异常提现、亏损限制、爆仓规则。
- 后台管理：用户、资金、订单、提现、风控、审计日志。

### 3.3 充值地址设计

方案 1：每个用户一个独立地址

- 优点：入账识别简单。
- 缺点：地址多，私钥管理复杂，归集成本高。

方案 2：所有用户共享地址 + memo/tag

- EVM 链通常没有 memo/tag，不适合普通用户。
- 不推荐。

方案 3：智能合约充值

- 用户充值到合约，合约记录用户地址。
- 优点：透明、可审计。
- 缺点：用户必须连接钱包；如果用户从交易所直接转账，合约无法知道平台账号是谁，除非做唯一地址或专属充值合约。

个人阶段如果做路线 B，建议每个用户一个充值地址，但必须严控私钥安全。

### 3.4 只支持 USDC 的好处

只支持 USDC 会明显降低复杂度：

- 不用处理多币种估值。
- 不用处理 USDT、ETH、BTC 等不同精度和合约差异。
- 内部账本可以以 USD/USDC 为单位。
- 用户充值、交易保证金、会员余额可以统一。

但必须严格区分：

- Arbitrum One 原生 USDC。
- Arbitrum 上的 USDC.e。
- 其他网络的 USDC。

Circle 文档显示 Arbitrum 上原生 USDC 合约地址为 `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`；Arbitrum 官方说明 USDC.e 是桥接版本，不是 Circle 原生发行。错误网络或错误 token 可能导致资产损失。

### 3.5 交易执行方式

托管式充值后，下单有三种实现：

方案 B1：内部模拟交易 / Paper trading

- 用户充值或购买 Credits 后，平台内部模拟仓位。
- 不接真实市场成交。
- 适合 MVP 和策略验证。
- 风险相对低，但不能声称是真实合约交易。

方案 B2：平台统一账户对接外部流动性

- 平台用自己的 CEX API 或 DeFi 钱包执行真实交易。
- 用户订单先进入平台内部账本，再由平台统一对外执行。
- 技术可行，但你变成类似经纪商/交易平台。
- 对账和风控难度高。

方案 B3：自建撮合/永续合约系统

- 自己做订单簿、保证金、资金费率、强平、做市。
- 难度最高，个人阶段不建议。

个人阶段如果坚持路线 B，建议先做 B1；真实交易等公司、合规、风控、钱包安全成熟后再做 B2。

### 3.6 优点

- 用户体验像中心化交易所，不需要每次签名。
- Agent 自动交易体验最好。
- 平台可以做统一账户、交易账户、Credits、会员余额。
- 可以更容易做策略跟单、Agent 自动执行、内部撮合。

### 3.7 缺点

- 你托管用户资产，安全责任非常重。
- 被攻击、私钥泄露、误转账、链上监听错误都会造成真实损失。
- 需要 KYC/AML、提现风控、黑名单地址筛查、审计日志。
- 法律和监管风险显著增加。
- 用户信任成本高，需要公司主体、条款、客服、风控。
- 后续如果涉及合约杠杆，可能被认为是交易平台、经纪、衍生品服务或投资服务。

### 3.8 成本估算

托管式路线成本最高：

- 充值监听：中。
- 账本系统：高，必须非常严谨。
- 钱包安全：高，不能用普通服务器明文私钥。
- 提现系统：高，要审核、风控、限额、归集。
- 合规成本：高，取决于地区和用户来源。
- 客服成本：高，误充值、不到账、提现失败都会找你。
- 安全审计：高。

个人阶段不建议直接开放真实托管资金交易。

## 4. 两种路线对比

| 维度 | 路线 A：连接钱包 | 路线 B：USDC 充值托管 |
|---|---|---|
| 技术难度 | 中 | 高 |
| 初期成本 | 低到中 | 高 |
| 上线速度 | 快 | 慢 |
| 用户体验 | 中，需要钱包签名 | 好，像交易所 |
| 自动交易 | 中等，需要授权设计 | 容易 |
| 资金安全责任 | 低，用户自管资产 | 高，平台托管资产 |
| 合规风险 | 中 | 高 |
| 适合个人 MVP | 适合 | 不太适合 |
| 适合卖策略指标 | 非常适合 | 也适合但没必要一开始做 |
| 合约交易 | 接链上 perp 或用户 CEX API | 内部账本 + 外部流动性 |
| 现货交易 | 接 DEX 聚合器 | 内部账本 + DEX/CEX 执行 |

## 5. 推荐路线

### 5.1 推荐总路线

建议采用“三阶段路线”：

第一阶段：非托管 MVP

- 用户连接钱包。
- 网站提供 Agent、指标、策略、模板。
- 下单先做 dry-run / paper trading / 用户签名交易。
- 会员收费和策略售卖先跑起来。

第二阶段：受限授权自动交易

- 增加策略授权。
- 用户可以设置最大仓位、最大亏损、最大杠杆。
- Agent 在限制内自动构造交易。
- 用户资产仍不直接托管在平台普通钱包。

第三阶段：公司化后再考虑托管 USDC

- 成立公司。
- 做法律意见、KYC/AML、钱包安全方案。
- 再开放 USDC 充值账户。
- 从小额、白名单、测试用户开始。

### 5.2 为什么这样选

你现在的核心商业价值不是“做一个交易所”，而是：

- Agent 能不能提供有价值的交易辅助。
- 策略和指标有没有人愿意付费。
- 用户是否愿意在你的网站停留并使用工具。

所以第一阶段不要把成本砸到托管钱包、合规和资金风控上。先用非托管方式验证用户需求，再考虑托管。

## 6. 账号和会员体系

### 6.1 账号体系

用户账号表建议包含：

- user_id
- email / phone
- password_hash / OAuth
- nickname
- avatar
- role
- kyc_status
- risk_level
- created_at
- last_login_at

钱包绑定表：

- user_id
- chain
- wallet_address
- wallet_type
- verified_signature
- bound_at

会员表：

- user_id
- plan
- status
- started_at
- expires_at
- auto_renew

### 6.2 会员等级

Free：

- 看基础行情。
- 使用少量免费指标。
- 每日少量 Agent 问答。
- paper trading。

Pro：

- 解锁高级指标。
- 解锁多 Agent。
- 解锁策略模板。
- 更多回测次数。
- 链上交易面板。

Trader：

- 自动策略提醒。
- 多钱包/多交易对监控。
- 风控模板。
- Webhook / Telegram 通知。

Creator：

- 可以发布策略和指标。
- 策略售卖分成。
- 粉丝订阅数据。

Enterprise / Team：

- 团队账号。
- 权限管理。
- 私有策略库。
- API 接入。

### 6.3 Credits 体系

Credits 适合用于：

- Agent 调用次数。
- 回测次数。
- 高级数据查询。
- 策略报告生成。

注意不要把 Credits 混同于用户交易本金。建议账户分开：

- Membership：会员订阅。
- Credits：平台服务点数。
- Trading balance：交易本金。

如果采用非托管路线，第一阶段可以只有 Membership 和 Credits，不做 Trading balance。

### 6.4 策略和指标售卖

策略市场可以包括：

- 免费策略。
- 一次性购买策略。
- 月订阅策略。
- 官方策略。
- 创作者策略。

策略展示建议包含：

- 适用交易对。
- 时间周期。
- 风险等级。
- 回测区间。
- 最大回撤。
- 胜率。
- 盈亏比。
- 使用人数。
- 最近更新时间。
- 风险声明。

早期不建议做收益分成或跟单抽成，因为这会显著增加监管和纠纷风险。先做软件订阅和信息工具更稳。

## 7. 技术架构建议

### 7.1 非托管 MVP 架构

前端：

- Next.js
- TradingView / lightweight-charts
- WalletConnect / EIP-1193 / EIP-6963
- Agent 面板
- 策略市场
- 指标模板

后端：

- Node.js / NestJS 或 Python / FastAPI
- PostgreSQL
- Redis
- Queue worker
- WebSocket
- Object storage

数据：

- 行情数据：交易所 API 或第三方数据源。
- 链上数据：RPC provider、indexer、subgraph。
- 新闻和情绪：第三方 API。

AI：

- Agent orchestration
- Prompt template
- Strategy explanation
- Risk summary
- Report generation

交易：

- 第一阶段：dry-run / paper trading。
- 第二阶段：接 DEX/perp 协议。
- 第三阶段：受限授权自动交易。

### 7.2 托管 USDC 架构

新增模块：

- Deposit service
- Blockchain listener
- Ledger service
- Withdrawal service
- Wallet service
- Risk engine
- Reconciliation service
- Admin backoffice
- Compliance service

账本必须采用双录或复式记账思想：

- 每一笔充值、划转、冻结、解冻、成交、手续费、盈亏、提现都必须有流水。
- 用户余额不能通过简单 update number 维护。
- 每日要能对账：链上钱包余额 = 用户总余额 + 平台收入 + 手续费 + 待处理差异。

### 7.3 钱包安全

如果做托管：

- 不要把私钥明文放数据库。
- 不要让业务服务器直接持有全部资产私钥。
- 热钱包只放小额。
- 大额放冷钱包或多签。
- 提现需要风控和人工审核阈值。
- 后期考虑 MPC / HSM / Safe 多签。

## 8. 风险点

### 8.1 技术风险

- 钱包连接兼容性。
- 用户签错网络。
- 用户误充值 USDC.e 或其他链 USDC。
- RPC 节点不稳定。
- 链上事件漏扫或重复入账。
- 价格源错误。
- 合约漏洞。
- 强平逻辑错误。
- 内部账本不一致。

### 8.2 安全风险

- 私钥泄露。
- 热钱包被盗。
- 管理后台被攻破。
- 提现接口被刷。
- API key 泄露。
- Agent 被 prompt injection 操控。
- 策略 marketplace 上传恶意内容。

### 8.3 合规风险

- 托管用户资产可能触发资金传输、虚拟资产服务商、托管商相关要求。
- 让用户交易合约可能触发衍生品、杠杆交易、经纪、投顾相关风险。
- 卖策略如果承诺收益，容易变成投资建议或资管问题。
- 面向不同国家用户，规则不同。

FinCEN 在虚拟货币指导中讨论了接受和传输可兑换虚拟货币的业务模式，以及 money services business / money transmitter 的适用问题。美国只是一个例子，其他司法辖区也有类似 VASP、CASP、虚拟资产托管规则。

### 8.4 商业风险

- 用户不愿意把资金充给个人网站。
- 没有公司主体时信任成本很高。
- 策略亏损导致投诉。
- Agent 建议不稳定。
- 数据成本高但付费转化低。

## 9. 成本优先级

个人起步最省钱方案：

1. 继续做现有交易工作台。
2. 增加 Agent 解读。
3. 增加策略/指标 marketplace。
4. 增加会员和 Credits。
5. 下单先做 dry-run 和 paper trading。
6. 再接非托管钱包真实交易。
7. 公司化后再考虑托管 USDC。

不建议一开始做：

- 自建交易所。
- 自建永续合约协议。
- 托管用户大额资产。
- 自动提现。
- 无 KYC 的充值提现。
- 收益承诺型策略。

## 10. 最小可行版本 MVP

MVP 1：Agent + 策略指标收费

- 登录注册。
- 会员套餐。
- Credits。
- 策略/指标模板。
- Agent 输出交易观点。
- paper trading。

MVP 2：非托管下单

- 钱包连接。
- 链上交易面板。
- 用户签名下单。
- 支持 1 条链、1 个资产、1 个交易协议。

MVP 3：受限自动交易

- 用户授权策略。
- 风控参数。
- Agent 自动生成订单。
- 用户可暂停/撤销授权。

MVP 4：托管 USDC 小范围测试

- 公司主体。
- KYC/AML。
- Arbitrum USDC 充值。
- 内部账本。
- 提现人工审核。
- 小额白名单测试。

## 11. 推荐最终决策

如果你现在是个人，优先选择路线 A：非托管钱包连接。

原因：

- 成本最低。
- 上线最快。
- 风险最小。
- 适合验证 Agent、策略、指标是否有人付费。
- 不需要立即承担托管用户资产的压力。

路线 B 可以作为未来公司化后的高级功能，但不建议作为第一版核心。

## 12. 参考资料

- Circle USDC on Arbitrum: https://www.circle.com/en/multi-chain-usdc/arbitrum
- Circle USDC contract addresses: https://developers.circle.com/stablecoins/usdc-contract-addresses
- Arbitrum Foundation: native USDC vs USDC.e: https://support.arbitrum.io/hc/en-gb/articles/19478276593179-Why-are-there-2-different-USDC-s-on-Arbitrum
- EIP-1193 Ethereum Provider API: https://eips.ethereum.org/EIPS/eip-1193
- EIP-6963 Multi Injected Provider Discovery: https://eips.ethereum.org/EIPS/eip-6963
- WalletConnect / Reown AppKit overview: https://docs.walletconnect.network/app-sdk/overview
- FinCEN 2013 virtual currency guidance: https://www.fincen.gov/resources/statutes-regulations/guidance/application-fincens-regulations-persons-administering
- FinCEN 2019 CVC business model guidance: https://www.fincen.gov/index.php/resources/statutes-regulations/guidance/application-fincens-regulations-certain-business-models

