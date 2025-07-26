#!/usr/bin/env node

import { ethers } from 'ethers';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../..', '.env.local') });

async function verifyTransaction(txHash: string): Promise<void> {
  console.log(`验证交易: ${txHash}\n`);
  
  const RPC_URL = 'https://k8s.testnet.json-rpc.injective.network/';
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  try {
    // 获取交易信息
    console.log('获取交易信息...');
    const tx = await provider.getTransaction(txHash);
    
    if (!tx) {
      console.log('❌ 交易未找到！可能还未广播或已被丢弃。');
      return;
    }
    
    console.log('✅ 交易已广播到网络');
    console.log(`- From: ${tx.from}`);
    console.log(`- To: ${tx.to}`);
    console.log(`- Value: ${ethers.formatEther(tx.value)} INJ`);
    console.log(`- Gas Price: ${ethers.formatUnits(tx.gasPrice || 0, 'gwei')} Gwei`);
    console.log(`- Nonce: ${tx.nonce}`);
    
    // 获取交易收据
    console.log('\n获取交易收据...');
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      console.log('⏳ 交易尚未确认，请稍后再试');
      return;
    }
    
    console.log('✅ 交易已确认');
    console.log(`- 区块号: ${receipt.blockNumber}`);
    console.log(`- 状态: ${receipt.status === 1 ? '✅ 成功' : '❌ 失败'}`);
    console.log(`- Gas Used: ${receipt.gasUsed.toString()}`);
    
    const currentBlock = await provider.getBlockNumber();
    console.log(`- 确认数: ${currentBlock - receipt.blockNumber}`);
    
    // 解析事件日志
    if (receipt.logs && receipt.logs.length > 0) {
      console.log(`\n事件日志 (${receipt.logs.length} 个):`);
      
      // Transfer 事件 ABI
      const transferEventSignature = ethers.id('Transfer(address,address,uint256)');
      
      for (const log of receipt.logs) {
        if (log.topics[0] === transferEventSignature) {
          const from = '0x' + log.topics[1].slice(26);
          const to = '0x' + log.topics[2].slice(26);
          const tokenId = BigInt(log.topics[3]);
          
          console.log(`\n📦 NFT Transfer 事件:`);
          console.log(`  - From: ${from}`);
          console.log(`  - To: ${to}`);
          console.log(`  - Token ID: ${tokenId.toString()}`);
        }
      }
    }
    
    console.log(`\n🔗 区块链浏览器: https://testnet.explorer.injective.network/transaction/${txHash}`);
    
  } catch (error) {
    console.error('❌ 验证失败:', error instanceof Error ? error.message : error);
  }
}

// 从命令行参数获取交易哈希，或使用最新的测试交易
const txHash = process.argv[2] || '0x674f623b0e878ddec2fe0a8e4c9a424106360836789c24aea84a06ac7a09a953';

if (require.main === module) {
  verifyTransaction(txHash);
}