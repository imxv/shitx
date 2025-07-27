require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.KIMI_API_KEY;

console.log('Debug API Key:');
console.log('1. Raw key exists:', !!apiKey);
console.log('2. Key starts with "sk-":', apiKey && apiKey.startsWith('sk-'));
console.log('3. Key length:', apiKey ? apiKey.length : 0);
console.log('4. First 10 chars:', apiKey ? apiKey.substring(0, 10) : 'N/A');
console.log('5. Last 4 chars:', apiKey ? apiKey.substring(apiKey.length - 4) : 'N/A');

// 检查是否有隐藏字符
if (apiKey) {
  console.log('\n6. Character codes of first 10 chars:');
  for (let i = 0; i < Math.min(10, apiKey.length); i++) {
    console.log(`   [${i}]: '${apiKey[i]}' = ${apiKey.charCodeAt(i)}`);
  }
  
  // 检查是否有非ASCII字符
  const hasNonAscii = /[^\x00-\x7F]/.test(apiKey);
  console.log('\n7. Has non-ASCII characters:', hasNonAscii);
  
  // 尝试其他可能的问题
  console.log('8. Has newline:', apiKey.includes('\n'));
  console.log('9. Has carriage return:', apiKey.includes('\r'));
  console.log('10. Has tab:', apiKey.includes('\t'));
}