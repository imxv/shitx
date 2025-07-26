import { createOpenAI } from '@ai-sdk/openai';

export function createKimiProvider(apiKey: string) {
  return createOpenAI({
    baseURL: 'https://api.moonshot.cn/v1',
    apiKey,
    name: 'kimi',
    compatibility: 'compatible',
  });
}

export const kimiModels = {
  'kimi-k2': 'moonshot-v1-auto',
  'kimi-k2-32k': 'moonshot-v1-32k',
  'kimi-k2-128k': 'moonshot-v1-128k',
} as const;

export type KimiModelId = keyof typeof kimiModels;

export function getKimiModel(provider: ReturnType<typeof createKimiProvider>, modelId: KimiModelId = 'kimi-k2') {
  const actualModelId = kimiModels[modelId];
  return provider(actualModelId);
}