import { generateText, streamText, generateObject } from 'ai';
import { z } from 'zod';
import { createKimiProvider, getKimiModel } from './kimi-provider';

// Example 1: Basic text generation
export async function generateSimpleText() {
  const kimi = createKimiProvider(process.env.KIMI_API_KEY!);
  
  const { text } = await generateText({
    model: getKimiModel(kimi),
    prompt: 'Write a haiku about coding',
  });
  
  return text;
}

// Example 2: Chat with messages
export async function chatWithKimi() {
  const kimi = createKimiProvider(process.env.KIMI_API_KEY!);
  
  const { text } = await generateText({
    model: getKimiModel(kimi),
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'What is the capital of France?' },
      { role: 'assistant', content: 'The capital of France is Paris.' },
      { role: 'user', content: 'What is its population?' },
    ],
  });
  
  return text;
}

// Example 3: Streaming in API route
export async function streamingAPIRoute(prompt: string) {
  const kimi = createKimiProvider(process.env.KIMI_API_KEY!);
  
  const result = await streamText({
    model: getKimiModel(kimi),
    prompt,
  });
  
  return result.toDataStreamResponse();
}

// Example 4: Structured output with zod schema
export async function generateStructuredData() {
  const kimi = createKimiProvider(process.env.KIMI_API_KEY!);
  
  const { object } = await generateObject({
    model: getKimiModel(kimi),
    schema: z.object({
      recipe: z.object({
        name: z.string(),
        ingredients: z.array(z.string()),
        steps: z.array(z.string()),
        cookingTime: z.number(),
      }),
    }),
    prompt: 'Generate a simple recipe for chocolate chip cookies',
  });
  
  return object;
}

// Example 5: Using in Next.js App Router API route
// app/api/chat/route.ts
/*
import { streamText } from 'ai';
import { createKimiProvider, getKimiModel } from '@/lib/ai-providers/kimi-provider';

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  const kimi = createKimiProvider(process.env.KIMI_API_KEY!);
  
  const result = await streamText({
    model: getKimiModel(kimi),
    messages,
  });
  
  return result.toDataStreamResponse();
}
*/

// Example 6: Using different model variants
export async function useModelVariants() {
  const kimi = createKimiProvider(process.env.KIMI_API_KEY!);
  
  // Use 32k context model
  const { text: text32k } = await generateText({
    model: getKimiModel(kimi, 'kimi-k2-32k'),
    prompt: 'Summarize this long document...',
  });
  
  // Use 128k context model for very long content
  const { text: text128k } = await generateText({
    model: getKimiModel(kimi, 'kimi-k2-128k'),
    prompt: 'Analyze this book chapter...',
  });
  
  return { text32k, text128k };
}