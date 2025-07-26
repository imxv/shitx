import { createKimiProvider, getKimiModel, kimiModels } from './kimi-provider';

console.log('🚀 Kimi K2 Provider Demo\n');

console.log('✅ Provider successfully imported');
console.log('✅ Available models:', Object.keys(kimiModels));
console.log('✅ Model mappings:', kimiModels);

console.log('\n📝 Usage example:');
console.log(`
import { generateText } from 'ai';
import { createKimiProvider, getKimiModel } from './kimi-provider';

const kimi = createKimiProvider(process.env.KIMI_API_KEY!);

const { text } = await generateText({
  model: getKimiModel(kimi, 'kimi-k2'),
  prompt: 'Hello, Kimi!',
});
`);

console.log('\n💡 To run the full test:');
console.log('1. Get your API key from https://platform.moonshot.cn/');
console.log('2. Create a .env file with: KIMI_API_KEY=your-api-key');
console.log('3. Run: pnpm test:kimi');

console.log('\n✨ The Kimi K2 provider is ready to use with Vercel AI SDK!');