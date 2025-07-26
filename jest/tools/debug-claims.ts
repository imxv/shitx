#!/usr/bin/env node

import Redis from 'ioredis';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../..', '.env.local') });

async function debugClaims(): Promise<void> {
  const redis = new Redis(process.env.REDIS_URL!);
  
  try {
    console.log('🔍 调试 NFT Claims...\n');
    
    // 获取总 claims
    const totalClaims = await redis.get('nft:total_claims');
    console.log(`总 claims 数量: ${totalClaims || 0}`);
    
    // 获取所有 claim 相关的 keys
    const claimKeys = await redis.keys('nft:claimed:*');
    console.log(`\n找到 ${claimKeys.length} 个已领取记录:`);
    
    // 显示每个 claim 的详情
    for (const key of claimKeys.slice(0, 10)) { // 只显示前10个
      const data = await redis.get(key);
      const address = key.replace('nft:claimed:', '');
      const nft = JSON.parse(data!);
      
      console.log(`\n地址: ${address}`);
      console.log(`Token ID: ${nft.tokenId}`);
      console.log(`领取时间: ${new Date(nft.claimedAt).toLocaleString()}`);
      console.log(`交易哈希: ${nft.txHash}`);
    }
    
    // 检查最近的 claims
    const recentClaims = await redis.lrange('nft:claim_list', 0, 4);
    console.log(`\n\n最近的 5 个 claims:`);
    
    for (const claimStr of recentClaims) {
      const claim = JSON.parse(claimStr);
      console.log(`\n时间: ${new Date(claim.timestamp).toLocaleString()}`);
      console.log(`地址: ${claim.address}`);
      console.log(`Token ID: ${claim.nftData.tokenId}`);
    }
    
    // 检查 referral 关系
    const referralKeys = await redis.keys('nft:referral:*');
    console.log(`\n\n找到 ${referralKeys.length} 个 referral 关系`);
    
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await redis.quit();
  }
}

if (require.main === module) {
  debugClaims();
}