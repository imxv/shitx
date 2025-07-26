#!/usr/bin/env node

/**
 * ShitX 测试工具集
 * 
 * 使用方法:
 * npx ts-node jest/tools/index.ts <command> [options]
 * 
 * 可用命令:
 * - test-claim: 测试 NFT 领取 API
 * - verify-tx <txHash>: 验证交易是否上链
 * - check-balance <address>: 检查 SHIT 代币余额
 * - debug-claims: 调试 Redis 中的 claims 数据
 * - test-nft: 测试 NFT 领取流程
 */

import path from 'path';

const command = process.argv[2];
const args = process.argv.slice(3);

// 显示帮助信息
function showHelp(): void {
  console.log(`
ShitX 测试工具集

使用方法:
  npx ts-node jest/tools/index.ts <command> [options]

可用命令:
  test-claim          测试 NFT 领取 API
  verify-tx <txHash>  验证交易是否上链
  check-balance <address>  检查 SHIT 代币余额
  debug-claims        调试 Redis 中的 claims 数据
  test-nft           测试 NFT 领取流程
  help               显示此帮助信息

示例:
  npx ts-node jest/tools/index.ts test-claim
  npx ts-node jest/tools/index.ts verify-tx 0x123...
  npx ts-node jest/tools/index.ts check-balance 0xabc...
`);
}

// 执行对应的测试工具
async function runCommand(): Promise<void> {
  switch (command) {
    case 'test-claim':
      await import('./test-claim-api');
      break;
      
    case 'verify-tx':
      process.argv = ['node', 'verify-tx.ts', ...args];
      await import('./verify-tx');
      break;
      
    case 'check-balance':
      process.argv = ['node', 'check-shit-balance.ts', ...args];
      await import('./check-shit-balance');
      break;
      
    case 'debug-claims':
      await import('./debug-claims');
      break;
      
    case 'test-nft':
      await import('./test-nft-claim');
      break;
      
    case 'help':
    case '--help':
    case '-h':
    case undefined:
      showHelp();
      break;
      
    default:
      console.error(`未知命令: ${command}\n`);
      showHelp();
      process.exit(1);
  }
}

runCommand().catch(console.error);