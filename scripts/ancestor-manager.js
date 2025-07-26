#!/usr/bin/env node

/**
 * 始祖NFT管理工具
 * 
 * 功能:
 * 1. 扫描所有NFT类型的持有情况
 * 2. 为无人持有的NFT类型生成始祖码
 * 3. 查看现有始祖码状态
 * 4. 挂失始祖码(删除始祖码和始祖持有者记录)
 */

const Redis = require('ioredis');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { register } = require('ts-node');

// 注册 ts-node 以支持导入 TypeScript 文件
register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    target: 'es2015',
    moduleResolution: 'node',
    esModuleInterop: true,
    allowSyntheticDefaultImports: true
  }
});

// 加载环境变量
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
  });
}

// 配置
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
console.log('🔗 连接到 Redis:', REDIS_URL.replace(/:[^:@]+@/, ':****@'));

// 动态导入合作方配置 - 需要在async函数中使用
let NFT_TYPES = [];

// 初始化NFT类型列表（包括云端合作方）
async function initNFTTypes() {
  // 导入本地合作方
  const { localPartners } = require('../src/config/partners');
  
  // 直接从Redis获取云端合作方
  const redis = new Redis(REDIS_URL);
  const partnerIds = await redis.smembers('partners:list');
  
  const redisPartners = [];
  for (const id of partnerIds) {
    const partnerData = await redis.hgetall(`partner:${id}`);
    if (partnerData && Object.keys(partnerData).length > 0) {
      redisPartners.push(partnerData);
    }
  }
  
  await redis.disconnect();
  
  // 合并本地和云端合作方
  const partnerMap = new Map();
  
  // 先添加本地合作方
  localPartners.forEach(partner => {
    partnerMap.set(partner.id, partner);
  });
  
  // 添加云端合作方
  redisPartners.forEach(partner => {
    partnerMap.set(partner.id, partner);
  });
  
  const allPartners = Array.from(partnerMap.values());
  
  NFT_TYPES = [
    {
      id: 'default',
      name: 'Shit NFT',
      displayName: 'ShitX'
    },
    ...allPartners.map(partner => ({
      id: partner.id,
      name: partner.nftName,
      displayName: partner.displayName
    }))
  ];
}

class AncestorManager {
  constructor() {
    this.redis = new Redis(REDIS_URL);
  }

  async disconnect() {
    await this.redis.disconnect();
  }

  // 生成64位随机码
  generateCode() {
    return crypto.randomBytes(32).toString('hex');
  }

  // 扫描所有NFT类型的持有情况
  async scanNFTTypes() {
    // 确保NFT类型已初始化
    if (NFT_TYPES.length === 0) {
      await initNFTTypes();
    }
    
    console.log('🔍 扫描所有NFT类型的持有情况...\n');
    
    const results = [];
    
    for (const nftType of NFT_TYPES) {
      const ancestorHolder = await this.redis.get(`ancestor_holder:${nftType.id}`);
      
      // 根据NFT类型获取持有者数量
      let holderCount = 0;
      if (nftType.id === 'default') {
        // 主NFT
        const totalClaims = await this.redis.get('nft:total_claims');
        holderCount = parseInt(totalClaims || '0', 10);
      } else {
        // 合作方NFT
        const totalClaims = await this.redis.get(`partner_nft:${nftType.id}:total_claims`);
        holderCount = parseInt(totalClaims || '0', 10);
      }
      
      const result = {
        type: nftType,
        hasAncestor: !!ancestorHolder,
        ancestorHolder: ancestorHolder,
        holderCount: holderCount,
        needsAncestor: !ancestorHolder && holderCount === 0
      };
      
      results.push(result);
      
      const status = result.hasAncestor ? 
        `👑 始祖: ${result.ancestorHolder}` : 
        (result.needsAncestor ? '❌ 需要始祖' : '⏳ 等待中');
      
      console.log(`${nftType.displayName.padEnd(12)} | 持有者: ${holderCount.toString().padEnd(3)} | ${status}`);
    }
    
    console.log();
    return results;
  }

  // 为指定NFT类型生成始祖码
  async generateAncestorCode(nftTypeId, force = false) {
    const nftType = NFT_TYPES.find(t => t.id === nftTypeId);
    if (!nftType) {
      throw new Error(`未找到NFT类型: ${nftTypeId}`);
    }

    // 检查是否已有始祖
    const existingAncestor = await this.redis.get(`ancestor_holder:${nftTypeId}`);
    if (existingAncestor && !force) {
      throw new Error(`${nftType.displayName} 已有始祖: ${existingAncestor}。使用 --force 强制重新生成。`);
    }

    // 生成始祖码
    const code = this.generateCode();
    const ancestorData = {
      code,
      nftType: nftTypeId,
      createdAt: Date.now(),
      isUsed: false
    };

    await this.redis.set(
      `ancestor_code:${code}`,
      JSON.stringify(ancestorData),
      'EX',
      60 * 60 * 24 * 30 // 30天过期
    );

    console.log(`✅ 已为 ${nftType.displayName} 生成始祖码:`);
    console.log(`📋 始祖码: ${code}`);
    console.log(`⏰ 有效期: 30天`);
    console.log(`🔗 NFT类型: ${nftTypeId} (${nftType.name})`);
    
    return { code, nftType };
  }

  // 查看所有始祖码状态
  async listAncestorCodes() {
    console.log('📋 查看所有始祖码状态...\n');
    
    const keys = await this.redis.keys('ancestor_code:*');
    
    if (keys.length === 0) {
      console.log('❌ 没有找到任何始祖码');
      return [];
    }
    
    const codes = [];
    
    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const ancestorData = JSON.parse(data);
        const nftType = NFT_TYPES.find(t => t.id === ancestorData.nftType);
        
        codes.push({
          ...ancestorData,
          nftTypeInfo: nftType
        });
        
        const status = ancestorData.isUsed ? 
          `✅ 已使用 (${ancestorData.usedBy})` : 
          '⏳ 未使用';
        
        const createdTime = new Date(ancestorData.createdAt).toLocaleString('zh-CN');
        const usedTime = ancestorData.usedAt ? 
          new Date(ancestorData.usedAt).toLocaleString('zh-CN') : 
          'N/A';
        
        console.log(`代码: ${ancestorData.code}`);
        console.log(`类型: ${nftType?.displayName || 'Unknown'} (${ancestorData.nftType})`);
        console.log(`状态: ${status}`);
        console.log(`创建: ${createdTime}`);
        console.log(`使用: ${usedTime}`);
        console.log('---');
      }
    }
    
    return codes;
  }

  // 挂失始祖码(删除始祖码和始祖持有者记录)
  async reportLostAncestor(identifier) {
    let deletedCode = false;
    let deletedHolder = false;
    
    // 如果identifier是64位hex字符串，当作始祖码处理
    if (/^[a-f0-9]{64}$/i.test(identifier)) {
      const codeKey = `ancestor_code:${identifier}`;
      const codeData = await this.redis.get(codeKey);
      
      if (codeData) {
        const ancestorData = JSON.parse(codeData);
        const nftType = ancestorData.nftType;
        
        // 删除始祖码
        await this.redis.del(codeKey);
        deletedCode = true;
        
        // 删除始祖持有者记录
        const holderKey = `ancestor_holder:${nftType}`;
        const holderResult = await this.redis.del(holderKey);
        deletedHolder = holderResult > 0;
        
        const nftTypeInfo = NFT_TYPES.find(t => t.id === nftType);
        console.log(`✅ 已挂失 ${nftTypeInfo?.displayName || nftType} 的始祖码: ${identifier}`);
        
        return { deletedCode, deletedHolder, nftType };
      } else {
        throw new Error(`未找到始祖码: ${identifier}`);
      }
    } else {
      // 当作NFT类型ID处理
      const nftType = NFT_TYPES.find(t => t.id === identifier);
      if (!nftType) {
        throw new Error(`未找到NFT类型: ${identifier}`);
      }
      
      // 查找并删除该类型的所有始祖码
      const allKeys = await this.redis.keys('ancestor_code:*');
      for (const key of allKeys) {
        const data = await this.redis.get(key);
        if (data) {
          const ancestorData = JSON.parse(data);
          if (ancestorData.nftType === identifier) {
            await this.redis.del(key);
            deletedCode = true;
            console.log(`🗑️  删除始祖码: ${ancestorData.code}`);
          }
        }
      }
      
      // 删除始祖持有者记录
      const holderKey = `ancestor_holder:${identifier}`;
      const holderResult = await this.redis.del(holderKey);
      deletedHolder = holderResult > 0;
      
      console.log(`✅ 已挂失 ${nftType.displayName} 的所有始祖记录`);
      
      return { deletedCode, deletedHolder, nftType: identifier };
    }
  }
}

// 命令行接口
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  // 初始化NFT类型（包括云端合作方）
  await initNFTTypes();
  
  const manager = new AncestorManager();
  
  try {
    switch (command) {
      case 'scan':
        await manager.scanNFTTypes();
        break;
        
      case 'generate':
        if (!args[1]) {
          console.log('❌ 请指定NFT类型ID');
          console.log('可用类型:', NFT_TYPES.map(t => t.id).join(', '));
          process.exit(1);
        }
        const force = args.includes('--force');
        await manager.generateAncestorCode(args[1], force);
        break;
        
      case 'list':
        await manager.listAncestorCodes();
        break;
        
      case 'report-lost':
        if (!args[1]) {
          console.log('❌ 请指定始祖码或NFT类型ID');
          process.exit(1);
        }
        await manager.reportLostAncestor(args[1]);
        break;
        
      default:
        console.log(`
始祖NFT管理工具

使用方法:
  node ancestor-manager.js <command> [options]

命令:
  scan                     扫描所有NFT类型的持有情况
  generate <type>          为指定NFT类型生成始祖码
  generate <type> --force  强制重新生成(即使已有始祖)
  list                     查看所有始祖码状态
  report-lost <id>         挂失始祖码或NFT类型的所有记录

NFT类型:
${NFT_TYPES.map(t => `  ${t.id.padEnd(12)} - ${t.displayName}`).join('\n')}

示例:
  node ancestor-manager.js scan
  node ancestor-manager.js generate snake
  node ancestor-manager.js list
  node ancestor-manager.js report-lost abc123...
  node ancestor-manager.js report-lost snake
        `);
        break;
    }
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  } finally {
    await manager.disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = AncestorManager;