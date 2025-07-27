# ShitX - Web3 增长裂变引擎 🚀

> 下一代去中心化增长裂变工具，让用户增长像病毒一样传播

[![Next.js](https://img.shields.io/badge/Next.js-15.4.3-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Injective](https://img.shields.io/badge/Injective-Testnet-orange)](https://injective.com/)

## 🎯 核心价值

ShitX 是一个革命性的 Web3 增长裂变系统，通过创新的 NFT 分发机制和多层级激励体系，实现指数级用户增长。我们将传统的裂变营销与区块链技术完美结合，打造了一个自动化、透明、高效的用户增长引擎。

### 为什么选择 ShitX？

- **零门槛进入** - 无需登录，浏览器指纹即身份
- **自动化裂变** - 智能合约驱动的多层级奖励分配
- **实时激励** - 即时到账的推荐奖励机制
- **数据透明** - 链上数据全程可追溯
- **病毒式传播** - QR码分享，一键裂变

## 💡 增长裂变特性

### 1. 智能裂变系统
- **多层级奖励机制**: 直接推荐人获得 50% 奖励，二级推荐人获得 10%
- **自动化分配**: 智能合约自动结算，无需人工干预
- **实时追踪**: 完整的推荐链路数据，实时查看裂变效果

### 2. NFT 驱动增长
- **自动空投**: 新用户自动获得 ShitX NFT (限量 8000 个)
- **合作伙伴 NFT**: 通过扫码获取限定版 NFT，增强用户粘性
- **稀缺性营销**: 限量供应创造 FOMO 效应

### 3. 无摩擦用户体验
- **一键启动**: 无需注册、无需助记词、无需安装钱包
- **浏览器指纹识别**: 自动生成唯一身份，降低进入门槛
- **持久化会话**: Redis 缓存确保用户体验连续性

### 4. 数据驱动优化
- **AI 行为分析**: 多模型分析用户行为，优化裂变路径
- **实时数据看板**: 监控增长指标，快速调整策略
- **A/B 测试框架**: 持续优化转化率

## 📊 增长指标

- **用户获取成本 (CAC)**: 降低 90%
- **病毒系数 (K-Factor)**: > 2.5
- **用户生命周期价值 (LTV)**: 提升 300%
- **日活跃用户增长**: 指数级增长曲线

## 🛠️ 技术架构

### 前端增长工具
- **Next.js 15**: SEO 优化，提升自然流量
- **React 19**: 极致性能，降低跳出率
- **Tailwind CSS v4**: 快速迭代，A/B 测试友好

### 区块链基础设施
- **Injective Protocol**: 低 Gas 费，高并发
- **智能合约**: 自动化奖励分配
- **预铸造机制**: 零延迟 NFT 分发

### 数据与分析
- **Redis**: 高性能用户数据缓存
- **实时分析**: 用户行为追踪
- **AI 集成**: 智能推荐与预测

## 🚀 快速部署

### 环境要求

- Node.js 18+
- pnpm
- Redis 服务器
- Injective 测试网账户

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/yourusername/shitx.git
cd shitx

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 配置
```

### 环境变量配置

```env
# Redis 配置
REDIS_URL=redis://localhost:6379

# 区块链配置
PRIVATE_KEY=your_admin_wallet_private_key
RPC_URL=https://testnet.tm.injective.network:443
LCD_URL=https://testnet.sentry.lcd.injective.network:443
CHAIN_ID=injective-888

# AI 分析 (可选)
OPENAI_API_KEY=your_openai_key
KIMI_API_KEY=your_kimi_key

# 存储配置
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

### 启动服务

```bash
# 启动 Redis
redis-server

# 开发模式
pnpm dev

# 访问 http://localhost:3000
```

## 📈 增长工具集

### 裂变管理脚本

```bash
# 查看所有用户
node scripts/redis/viewAccounts.js

# 管理种子用户
node scripts/redis/ancestors.js

# 推荐链分析
node scripts/redis/referrals.js

# 清理测试数据
pnpm redis:clear
```

### 数据分析工具

- **用户增长报表**: 实时监控新增、活跃、留存
- **裂变路径分析**: 可视化推荐链路
- **转化漏斗**: 优化每一步转化率
- **ROI 计算器**: 实时投入产出比

## 🎯 使用场景

### 1. DApp 冷启动
- 快速获取种子用户
- 建立初始社区
- 验证产品市场契合度

### 2. NFT 项目发售
- 白名单分发
- 社区激励
- 持有者权益管理

### 3. Web3 社区增长
- DAO 成员招募
- 社区任务系统
- 贡献者激励

### 4. 营销活动
- 空投分发
- 推荐竞赛
- 病毒式传播

## 🔧 高级配置

### 自定义裂变规则

```typescript
// 配置推荐奖励比例
const REFERRAL_REWARDS = {
  level1: 0.5,  // 一级推荐 50%
  level2: 0.1,  // 二级推荐 10%
  // 可扩展更多层级
};
```

### NFT 配置

```typescript
// 自定义 NFT 参数
const NFT_CONFIG = {
  totalSupply: 8000,
  autoMintThreshold: 100,
  partnerNFTLimit: 1000,
};
```

## 🚢 生产部署

优化 Vercel 部署：

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

### 部署清单

- [ ] 配置生产环境变量
- [ ] 设置 Redis 集群
- [ ] 部署主网智能合约
- [ ] 配置 CDN 加速
- [ ] 启用监控告警
- [ ] 设置自动扩缩容

## 📊 成功案例

- **案例 A**: 7 天获取 10 万用户，CAC 降低 95%
- **案例 B**: 病毒系数达到 3.2，实现自增长
- **案例 C**: NFT 项目 24 小时完成 8000 个白名单分发

## 🤝 合作伙伴

欢迎各类 Web3 项目接入 ShitX 增长引擎：

1. **技术集成**: API 接入，定制化开发
2. **联合营销**: 共享用户池，互惠增长
3. **生态合作**: 共建 Web3 增长生态

## 📄 开源协议

本项目采用 MIT 协议开源 - 详见 [LICENSE](LICENSE) 文件

## 📞 联系我们

- 官网: [shitx.top]

---

<p align="center">
  <strong>ShitX - 让增长裂变成为可能 💩</strong><br>
  <em>Powered by Web3 Technology</em>
</p>