/**
 * 集成测试脚本 - 测试 AI 分析功能
 */

async function testAIAnalysis() {
  console.log('🧪 Testing AI Analysis Integration...\n');
  
  const testAddress = '0x1234567890123456789012345678901234567890';
  const apiUrl = 'http://localhost:3000/api/v1/ai-analysis';
  
  try {
    // Test 1: Grant Analysis
    console.log('1️⃣ Testing Grant Analysis...');
    const grantResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'grant',
        userAddress: testAddress,
        forceRefresh: false
      })
    });
    
    const grantData = await grantResponse.json();
    console.log('Grant Analysis Response:', grantResponse.status);
    console.log('Data:', JSON.stringify(grantData, null, 2));
    console.log('');
    
    // Test 2: NFT Analysis
    console.log('2️⃣ Testing NFT Analysis...');
    const nftResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'nft',
        userAddress: testAddress,
        forceRefresh: false
      })
    });
    
    const nftData = await nftResponse.json();
    console.log('NFT Analysis Response:', nftResponse.status);
    console.log('Data:', JSON.stringify(nftData, null, 2));
    console.log('');
    
    // Test 3: Insufficient Balance
    console.log('3️⃣ Testing Insufficient Balance...');
    const poorAddress = '0x0000000000000000000000000000000000000000';
    const poorResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'grant',
        userAddress: poorAddress,
        forceRefresh: false
      })
    });
    
    const poorData = await poorResponse.json();
    console.log('Poor User Response:', poorResponse.status);
    console.log('Data:', JSON.stringify(poorData, null, 2));
    
    console.log('\n✅ Integration test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  console.log('⚠️  Make sure the Next.js dev server is running on http://localhost:3000');
  console.log('⚠️  Also ensure KIMI_API_KEY is set in your .env file\n');
  
  setTimeout(() => {
    testAIAnalysis();
  }, 2000);
}