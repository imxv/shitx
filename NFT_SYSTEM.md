# ShitX NFT System Documentation

## Overview

ShitX NFT 系统是一个多层级的 NFT 生态系统，通过预铸造和转移机制实现高效分发。

## NFT 类型

### 1. ShitX NFT (主 NFT)
- **合约地址**: `0x3a4DDe2f8ac852858b956EBBC0CC5D2C4205CCcE`
- **总供应量**: 8000
- **分发方式**: 所有用户首次访问时自动获得
- **作用**: 基础身份认证，解锁基本功能

### 2. Shit X [Partner] 系列 (合作方 NFT)
- **命名规范**: `Shit X [合作方名称]`
- **总供应量**: 每个系列独立设定
- **分发方式**: 通过合作方生成的专属二维码
- **作用**: 特殊权益，收集成就

## 技术架构

### 预铸造机制
1. 所有 NFT 在部署时全部铸造到管理员钱包
2. 用户 claim 时从管理员钱包转移到用户地址
3. 无需用户支付 gas 费用

### 地址生成
```typescript
// 用户 EVM 地址从浏览器指纹确定性生成
const evmAddress = generateEVMAddress(fingerprint);
```

### 分发流程
1. **ShitX NFT**: 新用户自动获得
2. **合作方 NFT**: 扫描对应二维码后获得

## 合作方管理

### 合作方清单
存储在 `/src/config/partners.ts`:
```typescript
export const partners = [
  {
    id: 'partner1',
    name: 'Example Partner',
    nftName: 'Shit X Example',
    contractAddress: null, // 待部署
  },
  // ...
];
```

### 合作方 NFT 部署流程
1. 扫描合作方清单，找出未部署的 NFT
2. 使用标准化合约部署
3. 预铸造所有 NFT 到管理员钱包
4. 更新合作方清单中的合约地址

## 用户功能

### My ShitX (我的ShitX)
- 显示用户 EVM 地址
- 展示已拥有的 NFT
- 显示收集进度
- NFT 稀有度信息

### ShitX United (ShitX联合)
- 选择已拥有的 NFT 生成二维码
- 二维码包含 referral 信息
- 扫码者可获得相同类型的 NFT

## 二维码系统

### 二维码 URL 格式
```
https://shitx.top?ref=[partner_id]&t=[timestamp]&id=[random]&user=[user_id]
```

### 权限控制
- 用户只能分享自己拥有的 NFT
- ShitX NFT 所有人都有，都可以分享
- 合作方 NFT 只有特定用户拥有

## Redis 数据结构

### NFT Claims
```
nft_claims:[evm_address] = {
  tokenId: string,
  metadata: {...},
  claimedAt: number,
  partnerId?: string
}
```

### Partner NFT Claims
```
partner_nft_claims:[partner_id]:[evm_address] = {
  tokenId: string,
  metadata: {...},
  claimedAt: number
}
```

## 安全考虑

1. **防止重复 claim**: Redis 记录已 claim 地址
2. **防止未授权分享**: 检查用户是否拥有对应 NFT
3. **防止合约耗尽**: 预铸造机制确保供应充足

## 部署检查清单

- [ ] 部署 ShitX NFT 合约
- [ ] 铸造 8000 个 NFT 到管理员钱包
- [ ] 设置环境变量 `NEXT_PUBLIC_NFT_CONTRACT`
- [ ] 部署合作方 NFT 合约
- [ ] 更新合作方清单
- [ ] 测试 claim 流程
- [ ] 测试二维码分享流程