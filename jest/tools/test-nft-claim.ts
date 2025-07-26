#!/usr/bin/env node

import path from 'path';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config({ path: path.join(__dirname, '../..', '.env.local') });

async function testNFTClaim(): Promise<void> {
  console.log('测试 NFT 领取功能...\n');
  
  const testAddress = '0x1234567890123456789012345678901234567890';
  const testUserId = 'test-user-123';
  const testUsername = 'TestUser';
  
  try {
    // 发送 claim 请求
    let response;
    let data;
    try {
      response = await axios.post('http://localhost:3000/api/claim-nft', {
        userId: testUserId,
        evmAddress: testAddress,
        username: testUsername,
        fingerprint: 'test-fingerprint',
      });
      data = response.data;
    } catch (error: any) {
      if (error.response) {
        response = error.response;
        data = error.response.data;
      } else {
        throw error;
      }
    }
    
    if (response.status === 200) {
      console.log('✅ NFT 领取成功！');
      console.log('NFT 详情:');
      console.log(`- Token ID: ${data.nft.tokenId}`);
      console.log(`- 稀有度: ${data.nft.metadata.attributes.find((a: any) => a.trait_type === 'Rarity').value}`);
      console.log(`- 交易哈希: ${data.txHash}`);
      if (data.subsidy) {
        console.log(`\n💰 获得补贴: ${data.subsidy.amount} SHIT`);
      }
    } else {
      console.error('❌ NFT 领取失败:');
      console.error(data.error);
      
      // 如果是因为已经领取过，显示已有的 NFT
      if (data.nft) {
        console.log('\n已经领取的 NFT:');
        console.log(`- Token ID: ${data.nft.tokenId}`);
        console.log(`- 领取时间: ${new Date(data.nft.claimedAt).toLocaleString()}`);
      }
    }
  } catch (error) {
    console.error('❌ 请求失败:', error instanceof Error ? error.message : error);
    console.log('\n请确保开发服务器正在运行 (pnpm dev)');
  }
}

// 运行测试
if (require.main === module) {
  testNFTClaim();
}