require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY;

console.log('API Key check:');
console.log('- Key exists:', !!apiKey);
console.log('- Key length:', apiKey ? apiKey.length : 0);
console.log('- Key format:', apiKey ? `${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 4)}` : 'N/A');
console.log('- Has spaces:', apiKey ? apiKey.includes(' ') : false);
console.log('- Has quotes:', apiKey ? (apiKey.includes('"') || apiKey.includes("'")) : false);

// Clean the key
if (apiKey) {
  const cleanKey = apiKey.trim().replace(/["']/g, '');
  console.log('\nCleaned key:');
  console.log('- Original length:', apiKey.length);
  console.log('- Cleaned length:', cleanKey.length);
  console.log('- Different:', apiKey !== cleanKey);
}