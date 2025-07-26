#!/usr/bin/env node

const Redis = require('ioredis');
const readline = require('readline');
const path = require('path');

// 加载环境变量
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// 从环境变量获取 Redis URL
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function clearRedis() {
  const redis = new Redis(redisUrl);

  try {
    console.log('🚽 ShitX Redis 清理工具');
    console.log('========================\n');
    console.log(`连接到 Redis: ${redisUrl}\n`);

    // 获取所有相关的 keys
    const nftKeys = await redis.keys('nft:*');
    const partnerKeys = await redis.keys('partner_nft:*');
    const userKeys = await redis.keys('user:*');
    
    const totalKeys = nftKeys.length + partnerKeys.length + userKeys.length;
    
    console.log('找到以下数据:');
    console.log(`- NFT 相关: ${nftKeys.length} 条`);
    console.log(`- 合作方 NFT: ${partnerKeys.length} 条`);
    console.log(`- 用户数据: ${userKeys.length} 条`);
    console.log(`- 总计: ${totalKeys} 条\n`);

    if (totalKeys === 0) {
      console.log('✅ Redis 已经是干净的，没有需要清理的数据！');
      await redis.quit();
      process.exit(0);
    }

    // 询问用户确认
    rl.question('⚠️  确定要清除所有数据吗？这个操作不可恢复！(yes/no): ', async (answer) => {
      if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        console.log('\n开始清理...');
        
        let deleted = 0;
        
        // 删除 NFT 相关数据
        if (nftKeys.length > 0) {
          deleted += await redis.del(...nftKeys);
          console.log(`✓ 已清除 ${nftKeys.length} 条 NFT 数据`);
        }
        
        // 删除合作方 NFT 数据
        if (partnerKeys.length > 0) {
          deleted += await redis.del(...partnerKeys);
          console.log(`✓ 已清除 ${partnerKeys.length} 条合作方 NFT 数据`);
        }
        
        // 删除用户数据
        if (userKeys.length > 0) {
          deleted += await redis.del(...userKeys);
          console.log(`✓ 已清除 ${userKeys.length} 条用户数据`);
        }
        
        console.log(`\n🚽 清理完成！共删除 ${deleted} 条数据`);
        console.log('💩 ShitX 的 Redis 现在像新厕所一样干净！');
      } else {
        console.log('\n❌ 操作已取消');
      }
      
      await redis.quit();
      rl.close();
    });

  } catch (error) {
    console.error('\n❌ 发生错误:', error.message);
    await redis.quit();
    rl.close();
    process.exit(1);
  }
}

// 处理 Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n👋 再见！');
  process.exit(0);
});

// 运行清理程序
clearRedis();