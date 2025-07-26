# API 结构说明

## 目录结构

```
api/
├── v1/              # 基于 Redis 的模拟实现（当前使用）
│   ├── claim-nft/   # NFT 领取
│   ├── nft-status/  # NFT 状态查询
│   └── stats/       # 统计信息
│
├── injective/       # 基于 Injective 区块链的实现（未来实现）
│   ├── claim-nft/   # NFT 领取
│   ├── nft-status/  # NFT 状态查询
│   ├── partner-nft/ # 合作伙伴 NFT
│   ├── admin/       # 管理接口
│   └── ...
│
└── debug/           # 调试接口（通用）
    └── redis-data/  # Redis 数据查询
```

## 当前实现：V1 (Redis 模拟)

### 优势
- ✅ 响应速度快（毫秒级）
- ✅ 无需区块链交互
- ✅ 适合快速迭代
- ✅ 用户体验流畅

### 功能
- NFT 领取和分发
- SHIT 代币补贴
- 余额查询
- 统计信息

### API 前缀配置
通过 `NEXT_PUBLIC_API_URL` 环境变量配置 API 前缀：
```env
# 默认配置
NEXT_PUBLIC_API_URL=/api/v1
```