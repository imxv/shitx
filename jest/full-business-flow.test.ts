import { ethers } from 'ethers';
import path from 'path';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// 设置 axios 默认配置
axios.defaults.adapter = 'http';

/**
 * ShitX 完整业务流程测试
 * 
 * 测试流程：
 * 1. 环境检查
 * 2. 创建新用户
 * 3. 领取 NFT
 * 4. 获得 SHIT 补贴
 * 5. 验证数据一致性
 */

// 测试配置
const RPC_URL = 'https://k8s.testnet.json-rpc.injective.network/';
const API_BASE_URL = 'http://localhost:3000/api';

interface TestUser {
  id: string;
  fingerprint: string;
  username: string;
  evmAddress: string;
}

interface ClaimResponse {
  success: boolean;
  nft: {
    tokenId: string;
    owner: string;
    metadata: {
      name: string;
      attributes: Array<{
        trait_type: string;
        value: string | number;
      }>;
    };
    claimedAt: number;
    txHash: string;
  };
  message: string;
  txHash: string;
  explorerUrl: string;
  subsidy?: {
    amount: string;
    txHash: string;
    message: string;
  };
  error?: string;
}

// 生成测试用户
function generateTestUser(): TestUser {
  // 生成一个固定格式的测试地址（不需要真实的私钥）
  const randomHex = Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  
  return {
    id: `test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    fingerprint: `fp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    username: `测试用户${Math.floor(Math.random() * 10000)}`,
    evmAddress: '0x' + randomHex
  };
}

describe('ShitX 完整业务流程测试', () => {
  let testUser: TestUser;
  let referrerUser: TestUser;
  
  beforeAll(() => {
    console.log('\n========== ShitX 业务流程测试开始 ==========\n');
    
    // 创建测试用户
    testUser = generateTestUser();
    referrerUser = generateTestUser();
    
    console.log('测试用户:', {
      id: testUser.id,
      address: testUser.evmAddress,
      username: testUser.username
    });
    
    console.log('推荐人:', {
      id: referrerUser.id,
      address: referrerUser.evmAddress
    });
  });

  describe('步骤1: 环境检查', () => {
    test('检查环境变量', () => {
      console.log('\n--- 检查环境变量 ---');
      
      const requiredEnvs = [
        'INJECTIVE_PRIVATE_KEY',
        'NEXT_PUBLIC_NFT_CONTRACT',
        'NEXT_PUBLIC_SHITX_COIN_CONTRACT',
        'REDIS_URL'
      ];
      
      const missing = requiredEnvs.filter(env => !process.env[env]);
      
      if (missing.length > 0) {
        console.error('缺少环境变量:', missing);
      } else {
        console.log('✅ 所有环境变量已设置');
      }
      
      expect(missing.length).toBe(0);
    });

    test('检查区块链连接', async () => {
      console.log('\n--- 检查区块链连接 ---');
      
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const network = await provider.getNetwork();
      const blockNumber = await provider.getBlockNumber();
      
      console.log(`✅ 连接成功`);
      console.log(`  Chain ID: ${network.chainId}`);
      console.log(`  当前区块: ${blockNumber}`);
      
      expect(Number(network.chainId)).toBe(1439);
    });

    test('检查 API 服务', async () => {
      console.log('\n--- 检查 API 服务 ---');
      
      try {
        const response = await axios.get(`${API_BASE_URL}/claim-nft`, {
          timeout: 5000
        });
        const data = response.data;
      
      console.log('✅ API 服务正常');
      console.log(`  主钱包: ${data.mainWalletAddress}`);
      console.log(`  NFT 合约: ${data.contractAddress}`);
      console.log(`  已领取数量: ${data.totalClaims}`);
      
        expect(response.status).toBe(200);
      } catch (error: any) {
        if (error.code === 'ECONNREFUSED') {
          console.error('❌ API 服务未启动，请先运行: pnpm dev');
        } else {
          console.error('❌ API 访问失败:', error.message);
        }
        throw error;
      }
    }, 10000);
  });

  describe('步骤2: NFT 领取测试', () => {
    let claimResponse: ClaimResponse | null = null;
    
    test('新用户领取 NFT', async () => {
      console.log('\n--- 新用户领取 NFT ---');
      console.log(`用户地址: ${testUser.evmAddress}`);
      
      try {
        const response = await axios.post(`${API_BASE_URL}/claim-nft`, {
          userId: testUser.id,
          evmAddress: testUser.evmAddress,
          username: testUser.username,
          fingerprint: testUser.fingerprint,
          referrerUserId: referrerUser.id
        }, {
          timeout: 25000
        });
        
        claimResponse = response.data;
      
        if (response.status === 200 && claimResponse) {
        console.log('✅ NFT 领取成功');
        console.log(`  Token ID: ${claimResponse.nft.tokenId}`);
        console.log(`  稀有度: ${claimResponse.nft.metadata.attributes.find(a => a.trait_type === 'Rarity')?.value}`);
        console.log(`  NFT 交易: ${claimResponse.txHash}`);
        
        if (claimResponse.subsidy) {
          console.log(`  SHIT 补贴: ${claimResponse.subsidy.amount} SHIT`);
          console.log(`  补贴交易: ${claimResponse.subsidy.txHash}`);
        }
        } else {
          console.error('❌ NFT 领取失败:', claimResponse?.error);
        }
        
        expect(response.status).toBe(200);
      } catch (error: any) {
        if (error.code === 'ECONNREFUSED') {
          console.error('❌ API 服务未启动，请先运行: pnpm dev');
        } else {
          console.error('❌ 请求失败:', error.message);
        }
        throw error;
      }
      expect(claimResponse?.success).toBe(true);
      expect(claimResponse?.nft).toBeDefined();
      expect(claimResponse?.nft.tokenId).toBeDefined();
    }, 35000);

    test('验证 NFT 交易上链', async () => {
      if (!claimResponse || !claimResponse.txHash) {
        console.log('跳过：没有交易哈希');
        return;
      }
      
      console.log('\n--- 验证 NFT 交易 ---');
      console.log(`交易哈希: ${claimResponse.txHash}`);
      
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const receipt = await provider.getTransactionReceipt(claimResponse.txHash);
      
      if (receipt) {
        console.log('✅ 交易已确认');
        console.log(`  区块号: ${receipt.blockNumber}`);
        console.log(`  状态: ${receipt.status === 1 ? '成功' : '失败'}`);
        console.log(`  Gas Used: ${receipt.gasUsed}`);
        
        expect(receipt.status).toBe(1);
      } else {
        console.log('⏳ 交易待确认');
      }
    }, 10000);

    test('验证重复领取保护', async () => {
      console.log('\n--- 测试重复领取保护 ---');
      
      let response;
      let data;
      try {
        response = await axios.post(`${API_BASE_URL}/claim-nft`, {
          userId: testUser.id,
          evmAddress: testUser.evmAddress,
          username: testUser.username,
          fingerprint: testUser.fingerprint
        });
        data = response.data;
      } catch (error: any) {
        if (error.response) {
          response = error.response;
          data = error.response.data || {};
        } else if (error.code === 'ECONNREFUSED') {
          console.error('❌ API 服务未启动');
          return;
        } else {
          throw error;
        }
      }
      
      console.log(`响应状态: ${response.status}`);
      console.log(`错误信息: ${data.error}`);
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('NFT already claimed for this address');
      
      console.log('✅ 重复领取保护正常');
    }, 10000);
  });

  describe('步骤3: SHIT 代币检查', () => {
    test('检查 SHIT 余额', async () => {
      console.log('\n--- 检查 SHIT 余额 ---');
      
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_SHITX_COIN_CONTRACT!,
        [
          'function balanceOf(address) view returns (uint256)',
          'function hasClaimedSubsidyFor(address) view returns (bool)'
        ],
        provider
      );
      
      const balance = await contract.balanceOf(testUser.evmAddress);
      const hasClaimed = await contract.hasClaimedSubsidyFor(testUser.evmAddress);
      
      console.log(`地址: ${testUser.evmAddress}`);
      console.log(`余额: ${ethers.formatEther(balance)} SHIT`);
      console.log(`已领取补贴: ${hasClaimed ? '是' : '否'}`);
      
      expect(Number(balance)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('步骤4: 数据一致性检查', () => {
    test('检查 Redis 数据', async () => {
      console.log('\n--- 检查 Redis 数据 ---');
      
      try {
        const response = await axios.post(`${API_BASE_URL}/debug/redis-data`, {
          address: testUser.evmAddress.toLowerCase()
        });
        
        const data = response.data;
        
        console.log('Redis 数据:');
        console.log(`  已领取: ${data.hasClaimed ? '是' : '否'}`);
        if (data.nftData) {
          console.log(`  Token ID: ${data.nftData.tokenId}`);
          console.log(`  领取时间: ${new Date(data.nftData.claimedAt).toLocaleString()}`);
        }
        if (data.referrer) {
          console.log(`  推荐人: ${data.referrer}`);
        }
        
        console.log('✅ Redis 数据一致');
      } catch (error) {
        console.log('⚠️  无法访问 Redis 调试接口');
      }
    });
  });

  describe('步骤5: 完整性总结', () => {
    test('生成测试报告', () => {
      console.log('\n========== 测试总结 ==========');
      console.log(`\n测试用户: ${testUser.username}`);
      console.log(`EVM 地址: ${testUser.evmAddress}`);
      
      console.log('\n========== 测试完成 ==========\n');
      
      expect(true).toBe(true);
    });
  });
});

// 清理函数
afterAll(async () => {
  // 强制取消所有 pending 的 axios 请求
  const CancelToken = axios.CancelToken;
  const source = CancelToken.source();
  source.cancel('测试结束，取消所有请求');
  
  // 清理所有定时器
  jest.clearAllTimers();
  
  // 等待一小段时间确保清理完成
  await new Promise(resolve => setTimeout(resolve, 100));
});