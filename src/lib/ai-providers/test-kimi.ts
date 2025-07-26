import { config } from 'dotenv';
import { generateText, streamText } from 'ai';
import { createKimiProvider, getKimiModel } from './kimi-provider';

// Load .env.local file
config({ path: '.env.local' });

async function testKimiProvider() {
  const apiKey = process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Error: Please set KIMI_API_KEY or MOONSHOT_API_KEY in your .env file');
    process.exit(1);
  }

  console.log('🚀 Testing Kimi K2 Provider...\n');

  try {
    const kimi = createKimiProvider(apiKey);
    
    console.log('1️⃣ Testing text generation (non-streaming)...');
    const { text } = await generateText({
      model: getKimiModel(kimi, 'kimi-k2'),
      prompt: '用一句话解释什么是人工智能。',
      maxTokens: 100,
    });
    console.log('✅ Response:', text);
    console.log('');

    console.log('2️⃣ Testing streaming text generation...');
    const { textStream } = await streamText({
      model: getKimiModel(kimi, 'kimi-k2'),
      prompt: '写一个关于程序员的笑话。',
      maxTokens: 200,
    });

    console.log('✅ Streaming response:');
    for await (const chunk of textStream) {
      process.stdout.write(chunk);
    }
    console.log('\n');

    console.log('3️⃣ Testing with system message...');
    const { text: systemText } = await generateText({
      model: getKimiModel(kimi, 'kimi-k2'),
      system: '你是一个幽默的助手，总是用押韵的方式回答问题。',
      prompt: '今天天气怎么样？',
      maxTokens: 100,
    });
    console.log('✅ Response with system message:', systemText);
    console.log('');

    console.log('4️⃣ Testing different model variants...');
    for (const modelId of ['kimi-k2', 'kimi-k2-32k', 'kimi-k2-128k'] as const) {
      const { text: variantText } = await generateText({
        model: getKimiModel(kimi, modelId),
        prompt: `Say "Hello from ${modelId}!"`,
        maxTokens: 50,
      });
      console.log(`✅ ${modelId}:`, variantText);
    }

    console.log('\n✨ All tests passed successfully!');
    console.log('🎉 Kimi K2 provider is working correctly with Vercel AI SDK');

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  testKimiProvider();
}