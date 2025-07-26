import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';

dotenv.config({ path: path.join(__dirname, '../..', '.env.local') });

interface TestData {
  userId: string;
  evmAddress: string;
  username: string;
  fingerprint: string;
}

interface ClaimResponse {
  success: boolean;
  nft?: {
    tokenId: string;
    owner: string;
    metadata: {
      name: string;
      attributes: Array<{
        trait_type: string;
        value: string | number;
      }>;
    };
    claimedAt: number;
    txHash: string;
  };
  txHash?: string;
  explorerUrl?: string;
  subsidy?: {
    amount: string;
    txHash: string;
    message: string;
  };
  error?: string;
  message?: string;
}

async function testClaimAPI(): Promise<void> {
  console.log('测试 NFT Claim API...\n');
  
  // 生成一个新的测试地址
  const randomAddress = '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  const testData: TestData = {
    userId: `test-user-${Date.now()}`,
    evmAddress: randomAddress,
    username: 'TestUser',
    fingerprint: `test-fingerprint-${Date.now()}`,
  };
  
  console.log('测试数据:');
  console.log(`- User ID: ${testData.userId}`);
  console.log(`- EVM 地址: ${testData.evmAddress}`);
  console.log(`- 用户名: ${testData.username}`);
  console.log(`- Fingerprint: ${testData.fingerprint}`);
  
  try {
    console.log('\n发送 claim 请求...');
    let response;
    let data: ClaimResponse;
    try {
      response = await axios.post('http://localhost:3000/api/claim-nft', testData);
      data = response.data;
      console.log(`\n响应状态: ${response.status} ${response.statusText}`);
    } catch (error: any) {
      if (error.response) {
        response = error.response;
        data = error.response.data;
        console.log(`\n响应状态: ${response.status} ${response.statusText}`);
      } else {
        throw error;
      }
    }
    
    if (response.status === 200) {
      console.log('\n✅ NFT 领取成功！');
      console.log('响应数据:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.nft) {
        console.log('\nNFT 详情:');
        console.log(`- Token ID: ${data.nft.tokenId}`);
        console.log(`- 所有者: ${data.nft.owner}`);
        console.log(`- 交易哈希: ${data.txHash}`);
        console.log(`- 区块链浏览器: ${data.explorerUrl}`);
      }
      
      if (data.subsidy) {
        console.log('\n💰 补贴信息:');
        console.log(`- 金额: ${data.subsidy.amount} SHIT`);
        console.log(`- 消息: ${data.subsidy.message}`);
      }
    } else {
      console.error('\n❌ NFT 领取失败:');
      console.error('错误信息:', data.error);
      
      if (data.nft) {
        console.log('\n已经领取的 NFT:');
        console.log(`- Token ID: ${data.nft.tokenId}`);
        console.log(`- 领取时间: ${new Date(data.nft.claimedAt).toLocaleString()}`);
      }
    }
    
    // 再次尝试领取同一个地址，测试重复领取保护
    console.log('\n\n测试重复领取保护...');
    let response2;
    let data2: ClaimResponse;
    try {
      response2 = await axios.post('http://localhost:3000/api/claim-nft', testData);
      data2 = response2.data;
    } catch (error: any) {
      if (error.response) {
        response2 = error.response;
        data2 = error.response.data;
      } else {
        throw error;
      }
    }
    
    if (response2.status === 400 && data2.error === 'NFT already claimed for this address') {
      console.log('✅ 重复领取保护正常工作');
    } else {
      console.error('❌ 重复领取保护失败！');
      console.error('响应:', data2);
    }
    
  } catch (error) {
    console.error('\n❌ 请求失败:', error instanceof Error ? error.message : error);
    console.log('\n请确保:');
    console.log('1. 开发服务器正在运行 (pnpm dev)');
    console.log('2. API 端点可访问: http://localhost:3000/api/claim-nft');
  }
}

// 运行测试
if (require.main === module) {
  testClaimAPI();
}