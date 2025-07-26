# ShitNFT 部署指南

## 准备工作

1. 安装依赖：
```bash
cd injective
npm install
```

2. 配置环境变量：
```bash
cp .env.example .env
# 编辑 .env 文件，填入你的私钥
```

3. 获取测试网 INJ：
- 访问 [Injective Testnet Faucet](https://testnet.faucet.injective.network/)
- 输入你的钱包地址获取测试币

## 部署步骤

### 1. 编译合约
```bash
npm run compile
```

### 2. 部署到 Injective 测试网
```bash
npm run deploy
```

这会：
- 部署 ShitNFT 合约
- 保存部署信息到 `deployment-info.json`
- 显示合约地址

### 3. 批量 mint NFT
```bash
npm run mint-all
```

这会：
- 将所有 8000 个 NFT mint 到你的地址
- 分批进行避免 gas 限制
- 每批 100 个

### 4. 配置前端

将合约地址添加到前端的 `.env.local`：
```
NEXT_PUBLIC_NFT_CONTRACT=你的合约地址
INJECTIVE_PRIVATE_KEY=你的私钥
```

## 合约功能

- **名称**: Shit NFT
- **符号**: SHIT
- **总供应量**: 8000
- **起始 ID**: 1
- **标准**: ERC721 + Enumerable

## 验证合约（可选）

```bash
npm run verify -- --contract-address 你的合约地址
```

## 注意事项

1. 确保钱包有足够的测试 INJ 用于 gas
2. 批量 mint 可能需要几分钟
3. 合约部署后不可更改总供应量
4. Base URI 可以通过 `setBaseURI` 更新