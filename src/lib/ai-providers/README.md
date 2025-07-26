# AI Provider for ShitX

## 概述

这个模块为 ShitX 平台提供 AI 分析功能，使用 Kimi K2 模型通过 Vercel AI SDK 实现。

## 功能特性

### 1. Kimi K2 Provider
- OpenAI API 兼容接口
- 支持多种模型变体（auto, 32k, 128k）
- 完全集成 Vercel AI SDK

### 2. AI 分析功能

#### Grant 分析
- 分析用户的 SHIT 代币分发情况
- 评估推荐网络健康度
- 提供增长策略建议
- 与顶级玩家对比分析

#### NFT 收藏分析
- 评估极速卡片收藏品味
- 稀有度分析
- NFT 分发网络影响力评估
- 收藏策略建议

### 3. 消耗机制
- 每次分析消耗 100 SHIT
- 24小时缓存机制
- 支持强制刷新

## 使用方法

### 环境配置
```bash
# .env 文件
KIMI_API_KEY=sk-your-kimi-api-key
# 或
MOONSHOT_API_KEY=sk-your-moonshot-api-key
```

### 代码示例

```typescript
import { generateText } from 'ai';
import { createKimiProvider, getKimiModel } from '@/lib/ai-providers/kimi-provider';

const kimi = createKimiProvider(process.env.KIMI_API_KEY!);

const { text } = await generateText({
  model: getKimiModel(kimi, 'kimi-k2'),
  prompt: 'Your prompt here',
});
```

### API 端点

```typescript
// AI 分析 API
POST /api/v1/ai-analysis
{
  "type": "grant" | "nft",
  "forceRefresh": boolean // 可选，强制刷新缓存
}
```

## 页面集成

### Grant 页面
- 位置：页面顶部按钮区域
- 按钮文本：🤖 AI分析 (100 SHIT)
- 显示分析结果、缓存状态、更新时间

### My Toilet 页面
- 位置：收集进度下方
- 按钮文本：🤖 AI收藏分析 (100 SHIT)
- 显示个性化的 NFT 收藏分析

## 测试

```bash
# 运行测试脚本
pnpm test:kimi

# 运行演示
pnpm tsx src/lib/ai-providers/demo.ts
```

## 注意事项

1. API Key 安全：确保 API Key 只在服务器端使用
2. 消耗限制：用户必须有足够的 SHIT 余额才能使用
3. 缓存策略：合理利用缓存减少 API 调用成本
4. 错误处理：妥善处理余额不足、API 故障等情况