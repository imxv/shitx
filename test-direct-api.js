require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY;

async function testDirectAPI() {
  console.log('Testing direct API call to Moonshot...\n');
  
  try {
    // Test 1: List models
    console.log('1. Testing /v1/models endpoint:');
    const modelsResponse = await fetch('https://api.moonshot.cn/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      }
    });
    
    console.log('Status:', modelsResponse.status);
    const modelsData = await modelsResponse.json();
    console.log('Response:', JSON.stringify(modelsData, null, 2));
    
    // Test 2: Chat completions
    console.log('\n2. Testing /v1/chat/completions endpoint:');
    const chatResponse = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        messages: [{
          role: 'user',
          content: 'Say hello'
        }],
        max_tokens: 10
      })
    });
    
    console.log('Status:', chatResponse.status);
    const chatData = await chatResponse.json();
    console.log('Response:', JSON.stringify(chatData, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testDirectAPI();