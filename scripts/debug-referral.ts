#!/usr/bin/env tsx

/**
 * 调试脚本：检查推荐关系数据
 */

import Redis from 'ioredis';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载环境变量
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const redis = new Redis(process.env.REDIS_URL!);

async function debugReferral(address: string) {
  console.log(`\n🔍 调试地址: ${address}\n`);
  
  // 1. 检查 NFT 数据
  const nftData = await redis.get(`nft:claimed:${address}`);
  if (nftData) {
    const nft = JSON.parse(nftData);
    console.log('✅ NFT 数据:');
    console.log(`  - Token ID: ${nft.tokenId}`);
    console.log(`  - Username: ${nft.metadata?.attributes?.find((a: any) => a.trait_type === 'Username')?.value}`);
  } else {
    console.log('❌ 未找到 NFT 数据');
  }
  
  // 2. 检查推荐人
  const referrer = await redis.get(`nft:referral:${address}`);
  console.log(`\n👤 推荐人: ${referrer || '无'}`);
  
  // 3. 检查推荐的用户
  const referrals = await redis.smembers(`nft:referrals:${address}`);
  console.log(`\n👥 推荐的用户 (${referrals.length}个):`);
  for (const ref of referrals.slice(0, 5)) {
    console.log(`  - ${ref}`);
  }
  if (referrals.length > 5) {
    console.log(`  ... 还有 ${referrals.length - 5} 个`);
  }
  
  // 4. 检查收益记录
  const rewards = await redis.lrange(`nft:referral_rewards:${address}`, 0, 10);
  console.log(`\n💰 收益记录 (${rewards.length}条):`);
  let totalAmount = 0;
  for (const reward of rewards.slice(0, 5)) {
    const data = JSON.parse(reward);
    totalAmount += data.amount;
    console.log(`  - ${data.type === 'direct_subsidy' ? '直接补贴' : `${data.level}级推荐`}: ${data.amount} SHIT`);
  }
  
  // 5. 检查总收益
  const totalRewards = await redis.get(`nft:referral_rewards_total:${address}`);
  console.log(`\n💎 推荐奖励总额: ${totalRewards || '0'} SHIT`);
  
  redis.disconnect();
}

// 运行
const address = process.argv[2]?.toLowerCase();
if (!address) {
  console.error('❌ 请提供地址参数');
  console.log('使用方法: npm run debug:referral <地址>');
  process.exit(1);
}

debugReferral(address).catch(console.error);