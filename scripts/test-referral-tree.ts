#!/usr/bin/env tsx

/**
 * 测试脚本：为指定地址创建多级推荐用户和收益记录
 * 使用方法：npm run test:referral [地址]
 */

import Redis from 'ioredis';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载环境变量
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Redis 连接
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  console.error('❌ 错误: 未找到 REDIS_URL 环境变量');
  console.log('请确保 .env.local 文件中设置了 REDIS_URL');
  process.exit(1);
}

console.log('📡 连接到 Redis...');
const redis = new Redis(redisUrl);

// 生成随机地址
function generateRandomAddress(): string {
  return '0x' + crypto.randomBytes(20).toString('hex');
}

// 生成随机用户名
function generateRandomUsername(): string {
  const adjectives = ['快乐的', '疯狂的', '优雅的', '神秘的', '活跃的', '勤奋的'];
  const nouns = ['马桶', '厕纸', '清洁剂', '冲水者', '思考者', '哲学家'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return adj + noun + Math.floor(Math.random() * 1000);
}

// 创建NFT数据
async function createNFTData(address: string, username: string, tokenId: string) {
  const nftData = {
    tokenId,
    tokenURI: `ipfs://QmTest${tokenId}`,
    claimedAt: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000), // 随机30天内
    metadata: {
      name: `Shit NFT #${tokenId}`,
      description: "Test NFT for referral tree",
      image: `ipfs://QmTest${tokenId}/image.png`,
      attributes: [
        { trait_type: "User ID", value: `toilet_${address.slice(2, 10)}` },
        { trait_type: "Username", value: username },
        { trait_type: "Rarity", value: ["Common", "Uncommon", "Rare", "Epic", "Legendary"][Math.floor(Math.random() * 5)] },
        { trait_type: "Power", value: Math.floor(Math.random() * 100) + 1 },
        { trait_type: "Claimed At", value: new Date().toISOString() }
      ]
    }
  };

  // 保存NFT数据
  await redis.set(
    `nft:claimed:${address}`,
    JSON.stringify(nftData),
    'EX',
    60 * 60 * 24 * 365 // 1年
  );

  return nftData;
}

// 创建推荐关系
async function createReferral(referrerAddress: string, referredAddress: string) {
  // 添加到推荐列表
  await redis.sadd(`nft:referrals:${referrerAddress}`, referredAddress);
  
  // 设置推荐人
  await redis.set(
    `nft:referral:${referredAddress}`,
    referrerAddress,
    'EX',
    60 * 60 * 24 * 365
  );
}

// 创建收益记录
async function createRewardRecords(address: string, level: number, count: number) {
  const records = [];
  
  // 创建直接补贴记录
  if (Math.random() > 0.3) { // 70%概率有直接补贴
    const directSubsidy = {
      amount: Math.floor(Math.random() * 500) + 100,
      type: 'direct_subsidy' as const,
      timestamp: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
      partnerId: 'default'
    };
    records.push(JSON.stringify(directSubsidy));
  }
  
  // 创建推荐奖励记录
  for (let i = 0; i < count; i++) {
    const sourceAddress = generateRandomAddress();
    const rewardAmount = level === 1 ? 
      Math.floor(Math.random() * 200) + 50 : // 一级奖励 50-250
      level === 2 ? 
      Math.floor(Math.random() * 100) + 20 : // 二级奖励 20-120
      Math.floor(Math.random() * 50) + 10;   // 三级奖励 10-60
    
    const reward = {
      amount: rewardAmount,
      type: 'referral_reward' as const,
      level,
      sourceAddress,
      timestamp: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
      partnerId: 'default'
    };
    records.push(JSON.stringify(reward));
  }
  
  // 批量写入
  if (records.length > 0) {
    await redis.lpush(`nft:referral_rewards:${address}`, ...records);
  }
  
  // 计算并更新总奖励
  const totalRewards = records.reduce((sum, record) => {
    const data = JSON.parse(record);
    return data.type === 'referral_reward' ? sum + data.amount : sum;
  }, 0);
  
  if (totalRewards > 0) {
    await redis.incrby(`nft:referral_rewards_total:${address}`, totalRewards);
  }
}

// 主函数
async function main() {
  console.log('🚀 开始创建测试数据...\n');
  
  // 获取目标地址（可以从命令行参数获取，或使用默认值）
  const targetAddress = process.argv[2]?.toLowerCase() || '0x742d35cc6634c0532925a3b844bc9e7c1f0c3e3d';
  console.log(`📍 目标地址: ${targetAddress}\n`);
  
  // 先检查目标地址是否有 NFT
  const targetNFT = await redis.get(`nft:claimed:${targetAddress}`);
  if (!targetNFT) {
    console.log('⚠️  警告: 目标地址还没有领取 NFT');
    console.log('📌 请先在首页领取 NFT，然后再运行此脚本\n');
  }
  
  // 配置 - 减少数量避免卡顿
  const config = {
    level1Count: 3,     // 一级推荐用户数
    level2Count: 2,     // 每个一级用户的二级推荐数
    level3Count: 1,     // 每个二级用户的三级推荐数
    rewardRecords: {
      level1: 2,        // 每个一级用户产生的奖励记录数
      level2: 2,        // 每个二级用户产生的奖励记录数
      level3: 1         // 每个三级用户产生的奖励记录数
    }
  };
  
  let tokenIdCounter = 1000;
  let totalUsers = 0;
  let totalRecords = 0;
  
  // 创建一级推荐用户
  console.log(`📊 创建 ${config.level1Count} 个一级推荐用户...`);
  const level1Users = [];
  
  for (let i = 0; i < config.level1Count; i++) {
    const address = generateRandomAddress();
    const username = generateRandomUsername();
    const tokenId = (tokenIdCounter++).toString();
    
    // 创建NFT数据
    await createNFTData(address, username, tokenId);
    
    // 创建推荐关系
    await createReferral(targetAddress, address);
    
    // 创建收益记录
    await createRewardRecords(address, 1, config.rewardRecords.level1);
    
    level1Users.push({ address, username });
    totalUsers++;
    totalRecords += config.rewardRecords.level1;
    
    console.log(`  ✅ 一级用户 ${i + 1}: ${username} (${address.slice(0, 10)}...)`);
  }
  
  // 创建二级推荐用户
  console.log(`\n📊 为每个一级用户创建 ${config.level2Count} 个二级推荐用户...`);
  const level2Users = [];
  
  for (const level1User of level1Users) {
    for (let i = 0; i < config.level2Count; i++) {
      const address = generateRandomAddress();
      const username = generateRandomUsername();
      const tokenId = (tokenIdCounter++).toString();
      
      await createNFTData(address, username, tokenId);
      await createReferral(level1User.address, address);
      await createRewardRecords(address, 2, config.rewardRecords.level2);
      
      level2Users.push({ address, username, referrer: level1User.address });
      totalUsers++;
      totalRecords += config.rewardRecords.level2;
    }
    console.log(`  ✅ 为 ${level1User.username} 创建了 ${config.level2Count} 个二级用户`);
  }
  
  // 创建三级推荐用户
  console.log(`\n📊 为每个二级用户创建 ${config.level3Count} 个三级推荐用户...`);
  
  for (const level2User of level2Users) {
    for (let i = 0; i < config.level3Count; i++) {
      const address = generateRandomAddress();
      const username = generateRandomUsername();
      const tokenId = (tokenIdCounter++).toString();
      
      await createNFTData(address, username, tokenId);
      await createReferral(level2User.address, address);
      await createRewardRecords(address, 3, config.rewardRecords.level3);
      
      totalUsers++;
      totalRecords += config.rewardRecords.level3;
    }
  }
  
  console.log(`\n✅ 创建完成！`);
  console.log(`📊 统计信息:`);
  console.log(`  - 总用户数: ${totalUsers}`);
  console.log(`  - 一级用户: ${level1Users.length}`);
  console.log(`  - 二级用户: ${level2Users.length}`);
  console.log(`  - 三级用户: ${level2Users.length * config.level3Count}`);
  console.log(`  - 总收益记录: ${totalRecords}+`);
  
  // 验证数据
  console.log(`\n🔍 验证数据...`);
  
  // 检查一级推荐关系
  const referrals = await redis.smembers(`nft:referrals:${targetAddress}`);
  console.log(`  - 目标地址的推荐用户数: ${referrals.length}`);
  
  // 检查收益记录
  const rewardHistory = await redis.lrange(`nft:referral_rewards:${targetAddress}`, 0, 10);
  console.log(`  - 目标地址的收益记录数: ${rewardHistory.length}`);
  
  // 显示第一个一级用户的信息
  if (level1Users.length > 0) {
    const firstUser = level1Users[0];
    const nftData = await redis.get(`nft:claimed:${firstUser.address}`);
    console.log(`  - 第一个一级用户 ${firstUser.username}: ${nftData ? '✅ NFT数据已创建' : '❌ NFT数据未找到'}`);
    
    const referrer = await redis.get(`nft:referral:${firstUser.address}`);
    console.log(`  - 推荐人验证: ${referrer === targetAddress ? '✅ 正确' : '❌ 错误'}`);
  }
  
  console.log(`\n🎯 现在可以访问 /referral-tree 页面查看效果了！`);
  console.log(`📝 或访问 /grant 页面查看收益历史`);
  
  // 关闭Redis连接
  redis.disconnect();
}

// 测试 Redis 连接
redis.ping().then(() => {
  console.log('✅ Redis 连接成功！\n');
  // 运行主函数
  main().catch(error => {
    console.error('❌ 错误:', error);
    redis.disconnect();
    process.exit(1);
  });
}).catch(error => {
  console.error('❌ 无法连接到 Redis:', error.message);
  console.log('\n请检查:');
  console.log('1. REDIS_URL 是否正确');
  console.log('2. Redis 服务是否正在运行');
  console.log('3. 网络连接是否正常');
  process.exit(1);
});