#!/usr/bin/env node

import { ethers } from 'ethers';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../..', '.env.local') });

async function checkShitBalance(address: string): Promise<void> {
  console.log(`检查 SHIT 代币余额...\n`);
  
  const RPC_URL = 'https://k8s.testnet.json-rpc.injective.network/';
  const SHITX_COIN_CONTRACT = process.env.NEXT_PUBLIC_SHITX_COIN_CONTRACT;
  
  if (!SHITX_COIN_CONTRACT) {
    console.error('❌ NEXT_PUBLIC_SHITX_COIN_CONTRACT 未设置');
    return;
  }
  
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  // ERC20 ABI
  const ERC20_ABI = [
    'function balanceOf(address) view returns (uint256)',
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function hasClaimedSubsidyFor(address) view returns (bool)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event SubsidyClaimed(address indexed recipient, uint256 amount)'
  ];
  
  try {
    const contract = new ethers.Contract(SHITX_COIN_CONTRACT, ERC20_ABI, provider);
    
    // 获取代币信息
    const name = await contract.name();
    const symbol = await contract.symbol();
    console.log(`代币: ${name} (${symbol})`);
    console.log(`合约地址: ${SHITX_COIN_CONTRACT}\n`);
    
    // 检查余额
    const balance = await contract.balanceOf(address);
    const hasClaimed = await contract.hasClaimedSubsidyFor(address);
    
    console.log(`地址: ${address}`);
    console.log(`余额: ${ethers.formatEther(balance)} ${symbol}`);
    console.log(`已领取补贴: ${hasClaimed ? '✅ 是' : '❌ 否'}`);
    
    // 获取最近的 Transfer 事件
    console.log('\n查询最近的转账记录...');
    const filter = contract.filters.Transfer(null, address);
    const events = await contract.queryFilter(filter, -1000, 'latest');
    
    if (events.length > 0) {
      console.log(`\n找到 ${events.length} 条转入记录:`);
      for (const event of events.slice(-5)) { // 只显示最近5条
        const block = await event.getBlock();
        console.log(`\n- 区块: ${event.blockNumber}`);
        console.log(`  时间: ${new Date(block.timestamp * 1000).toLocaleString()}`);
        console.log(`  From: ${event.args[0]}`);
        console.log(`  金额: ${ethers.formatEther(event.args[2])} ${symbol}`);
        console.log(`  交易: ${event.transactionHash}`);
      }
    } else {
      console.log('未找到转入记录');
    }
    
    // 检查主钱包余额
    const MAIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET;
    if (MAIN_WALLET) {
      console.log('\n主钱包信息:');
      const mainBalance = await contract.balanceOf(MAIN_WALLET);
      console.log(`地址: ${MAIN_WALLET}`);
      console.log(`余额: ${ethers.formatEther(mainBalance)} ${symbol}`);
    }
    
  } catch (error) {
    console.error('❌ 查询失败:', error instanceof Error ? error.message : error);
  }
}

// 从命令行参数获取地址，或使用测试地址
const address = process.argv[2] || '0x01a687250392c2753e9cab3dc015e0c070ebf403';

if (require.main === module) {
  checkShitBalance(address);
}