#!/usr/bin/env node

const Redis = require('ioredis');
const readline = require('readline');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(redisUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function showStats() {
  console.log('\n📊 Redis 统计信息');
  console.log('================\n');

  const nftClaims = await redis.keys('nft:claimed:*');
  const totalClaims = await redis.get('nft:total_claims') || '0';
  const partnerNFTs = await redis.keys('partner_nft:*:claimed:*');
  
  console.log(`主 NFT Claims: ${nftClaims.length} 个地址`);
  console.log(`总 Claim 计数: ${totalClaims}`);
  console.log(`合作方 NFT Claims: ${partnerNFTs.length} 个`);
  
  // 显示一些具体的 claim 信息
  if (nftClaims.length > 0) {
    console.log('\n最近的 NFT Claims:');
    for (let i = 0; i < Math.min(5, nftClaims.length); i++) {
      const data = await redis.get(nftClaims[i]);
      if (data) {
        const nft = JSON.parse(data);
        const address = nftClaims[i].replace('nft:claimed:', '');
        console.log(`- ${address.slice(0, 6)}...${address.slice(-4)}: Token #${nft.tokenId}`);
      }
    }
  }
}

async function clearSpecific() {
  console.log('\n🧹 选择性清理');
  console.log('=============\n');
  console.log('1. 清除所有 NFT claim 记录');
  console.log('2. 清除所有合作方 NFT 记录');
  console.log('3. 重置 claim 计数器');
  console.log('4. 清除特定地址的记录');
  console.log('5. 返回主菜单');
  
  const choice = await question('\n选择操作 (1-5): ');
  
  switch (choice) {
    case '1':
      const nftKeys = await redis.keys('nft:claimed:*');
      if (nftKeys.length > 0) {
        const confirm = await question(`\n确定要删除 ${nftKeys.length} 条 NFT claim 记录吗？(y/n): `);
        if (confirm.toLowerCase() === 'y') {
          await redis.del(...nftKeys);
          console.log(`✅ 已删除 ${nftKeys.length} 条记录`);
        }
      } else {
        console.log('没有找到 NFT claim 记录');
      }
      break;
      
    case '2':
      const partnerKeys = await redis.keys('partner_nft:*');
      if (partnerKeys.length > 0) {
        const confirm = await question(`\n确定要删除 ${partnerKeys.length} 条合作方 NFT 记录吗？(y/n): `);
        if (confirm.toLowerCase() === 'y') {
          await redis.del(...partnerKeys);
          console.log(`✅ 已删除 ${partnerKeys.length} 条记录`);
        }
      }
      break;
      
    case '3':
      await redis.set('nft:total_claims', '0');
      console.log('✅ 计数器已重置');
      break;
      
    case '4':
      const address = await question('\n输入要清除的地址: ');
      const keys = await redis.keys(`*${address}*`);
      if (keys.length > 0) {
        console.log(`找到 ${keys.length} 条相关记录:`);
        keys.forEach(key => console.log(`- ${key}`));
        const confirm = await question('\n确定要删除这些记录吗？(y/n): ');
        if (confirm.toLowerCase() === 'y') {
          await redis.del(...keys);
          console.log('✅ 记录已删除');
        }
      } else {
        console.log('没有找到相关记录');
      }
      break;
  }
}

async function main() {
  console.log('🚽 ShitX Redis 管理工具');
  console.log('======================');
  console.log(`连接到: ${redisUrl}\n`);

  while (true) {
    console.log('\n📋 主菜单');
    console.log('=========');
    console.log('1. 查看统计信息');
    console.log('2. 选择性清理数据');
    console.log('3. 清空所有数据 (危险！)');
    console.log('4. 退出');
    
    const choice = await question('\n选择操作 (1-4): ');
    
    switch (choice) {
      case '1':
        await showStats();
        break;
        
      case '2':
        await clearSpecific();
        break;
        
      case '3':
        console.log('\n⚠️  警告：这将删除所有 Redis 数据！');
        const confirm = await question('输入 "DELETE ALL" 确认: ');
        if (confirm === 'DELETE ALL') {
          const allKeys = await redis.keys('*');
          if (allKeys.length > 0) {
            await redis.del(...allKeys);
            console.log(`✅ 已删除 ${allKeys.length} 条数据`);
          }
          console.log('💩 Redis 现在干净如新！');
        } else {
          console.log('❌ 操作已取消');
        }
        break;
        
      case '4':
        console.log('\n👋 再见！保持厕所清洁！');
        await redis.quit();
        rl.close();
        process.exit(0);
        
      default:
        console.log('❌ 无效选择');
    }
  }
}

// 错误处理
process.on('unhandledRejection', (error) => {
  console.error('\n❌ 错误:', error.message);
  redis.quit();
  rl.close();
  process.exit(1);
});

// Ctrl+C 处理
process.on('SIGINT', () => {
  console.log('\n\n👋 再见！');
  redis.quit();
  rl.close();
  process.exit(0);
});

// 运行主程序
main().catch(error => {
  console.error('❌ 启动失败:', error.message);
  process.exit(1);
});