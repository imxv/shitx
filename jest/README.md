# ShitX 测试指南

## 测试结构

```
src/__tests__/
├── tools/              # 测试工具脚本
│   ├── index.js       # 工具入口
│   ├── test-claim-api.js
│   ├── verify-tx.js
│   ├── check-shit-balance.js
│   └── debug-claims.js
└── lib/               # 单元测试和集成测试
    ├── nft-claim.test.ts
    ├── nft-claim.integration.test.ts
    └── nft-claim-detailed.test.ts
```

## 快速开始

### 单元测试
```bash
# 运行所有测试
pnpm test

# 观察模式
pnpm test:watch

# 运行集成测试
pnpm test:integration
```

### 测试工具

```bash
# 查看所有可用工具
pnpm test:tools help

# 测试 NFT 领取 API
pnpm test:claim

# 验证交易是否上链
pnpm test:verify 0x674f623b0e878ddec2fe0a8e4c9a424106360836789c24aea84a06ac7a09a953

# 检查 SHIT 代币余额
pnpm test:balance 0x01a687250392c2753e9cab3dc015e0c070ebf403

# 调试 Redis claims 数据
pnpm test:debug
```

## 测试场景

### 1. NFT 领取流程测试
- 测试新用户领取 NFT
- 测试重复领取保护
- 验证链上交易
- 检查 SHIT 补贴发放

### 2. 诊断问题
- 环境变量检查
- 区块链连接测试
- NFT 合约状态
- Redis 数据完整性
- 私钥格式验证

### 3. 验证交易
- 检查交易是否广播
- 验证交易是否确认
- 解析事件日志
- 查看转账详情

## 常见问题

### Q: NFT 领取失败
运行完整诊断：
```bash
pnpm jest src/lib/__tests__/nft-claim-detailed.test.ts
```

### Q: 交易未上链
验证具体交易：
```bash
pnpm test:verify <交易哈希>
```

### Q: SHIT 代币未收到
检查余额和转账记录：
```bash
pnpm test:balance <钱包地址>
```

### Q: Redis 数据不一致
调试 claims 数据：
```bash
pnpm test:debug
```