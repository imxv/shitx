import { ethers } from 'ethers';
import { nftRedis, redis } from '../../lib/redis';
import { getNextAvailableTokenId, transferNFT } from '../../lib/injectiveNFT';
import { distributeSubsidy, hasClaimedSubsidy, getBalance } from '../../lib/shitxCoin';

/**
 * 完整业务流程测试
 * 测试一个新用户从注册到领取 NFT 和补贴的完整流程
 */
describe('ShitX 完整业务流程测试', () => {
  // 测试配置
  const TEST_USER = {
    id: `test-user-${Date.now()}`,
    fingerprint: `test-fp-${Date.now()}`,
    username: '测试马桶刷',
    evmAddress: ethers.Wallet.createRandom().address.toLowerCase()
  };

  const TEST_REFERRER = {
    id: `referrer-${Date.now()}`,
    evmAddress: ethers.Wallet.createRandom().address.toLowerCase()
  };

  // 清理函数
  afterAll(async () => {
    // 清理测试数据
    if (redis) {
      await redis.del(`nft:claimed:${TEST_USER.evmAddress}`);
      await redis.del(`user:id:${TEST_USER.id}`);
      await redis.del(`nft:referral:${TEST_USER.evmAddress}`);
      await redis.quit();
    }
  });

  describe('1. 环境检查', () => {
    it('应该有正确的环境变量', () => {
      expect(process.env.INJECTIVE_PRIVATE_KEY).toBeDefined();
      expect(process.env.NEXT_PUBLIC_NFT_CONTRACT).toBeDefined();
      expect(process.env.NEXT_PUBLIC_SHITX_COIN_CONTRACT).toBeDefined();
      expect(process.env.REDIS_URL).toBeDefined();
    });

    it('应该能连接到区块链', async () => {
      const provider = new ethers.JsonRpcProvider('https://k8s.testnet.json-rpc.injective.network/');
      const network = await provider.getNetwork();
      expect(network.chainId).toBe(1439n);
    });

    it('应该能连接到 Redis', async () => {
      const ping = await redis?.ping();
      expect(ping).toBe('PONG');
    });
  });

  describe('2. 用户注册流程', () => {
    it('应该生成唯一的 EVM 地址', () => {
      console.log('测试用户信息:');
      console.log(`- ID: ${TEST_USER.id}`);
      console.log(`- EVM 地址: ${TEST_USER.evmAddress}`);
      console.log(`- 用户名: ${TEST_USER.username}`);
      
      expect(TEST_USER.evmAddress).toMatch(/^0x[a-f0-9]{40}$/);
    });

    it('新用户不应该有 NFT 记录', async () => {
      const hasClaimed = await nftRedis.hasClaimed(TEST_USER.evmAddress);
      expect(hasClaimed).toBe(false);
    });

    it('新用户不应该有 SHIT 补贴记录', async () => {
      const hasSubsidy = await hasClaimedSubsidy(TEST_USER.evmAddress);
      expect(hasSubsidy).toBe(false);
    });
  });

  describe('3. NFT 领取流程', () => {
    let tokenId: string | null;
    let nftTxHash: string | undefined;

    it('应该能获取下一个可用的 Token ID', async () => {
      tokenId = await getNextAvailableTokenId();
      console.log(`下一个可用 Token ID: ${tokenId}`);
      expect(tokenId).toBeTruthy();
      expect(Number(tokenId)).toBeGreaterThan(0);
    });

    it('应该能成功转移 NFT', async () => {
      if (!tokenId) {
        throw new Error('No token ID available');
      }

      console.log(`\n转移 NFT #${tokenId} 到 ${TEST_USER.evmAddress}...`);
      
      const result = await transferNFT(TEST_USER.evmAddress, tokenId);
      
      expect(result.success).toBe(true);
      expect(result.txHash).toBeTruthy();
      
      nftTxHash = result.txHash;
      console.log(`✅ NFT 转移成功`);
      console.log(`交易哈希: ${nftTxHash}`);
    }, 30000); // 30秒超时

    it('应该正确记录 NFT 领取信息到 Redis', async () => {
      if (!tokenId || !nftTxHash) {
        throw new Error('Previous test failed');
      }

      // 模拟 API 记录数据
      const nftData = {
        tokenId,
        owner: TEST_USER.evmAddress,
        metadata: {
          name: `Shit NFT #${tokenId}`,
          description: `${TEST_USER.username} 的专属厕所通行证`,
          image: `https://shitx.top/api/nft-image/${tokenId}`,
          attributes: [
            { trait_type: 'Username', value: TEST_USER.username },
            { trait_type: 'User ID', value: TEST_USER.id },
            { trait_type: 'Rarity', value: 'Common Toilet' },
            { trait_type: 'Claim Date', value: new Date().toLocaleDateString('zh-CN') },
            { trait_type: 'Serial Number', value: parseInt(tokenId) }
          ]
        },
        claimedAt: Date.now(),
        txHash: nftTxHash,
        chainId: 1439,
        contractAddress: process.env.NEXT_PUBLIC_NFT_CONTRACT
      };

      // 记录 claim（包括 referral）
      await nftRedis.recordClaim(
        TEST_USER.evmAddress,
        nftData,
        TEST_REFERRER.evmAddress
      );

      // 验证记录
      const hasClaimed = await nftRedis.hasClaimed(TEST_USER.evmAddress);
      expect(hasClaimed).toBe(true);

      const savedNFT = await nftRedis.getNFT(TEST_USER.evmAddress);
      expect(savedNFT).toBeTruthy();
      expect(savedNFT.tokenId).toBe(tokenId);

      // 验证 referral 关系
      const referrer = await nftRedis.getReferrer(TEST_USER.evmAddress);
      expect(referrer).toBe(TEST_REFERRER.evmAddress);

      // 验证用户 ID 映射
      const addressByUserId = await nftRedis.getAddressByUserId(TEST_USER.id);
      expect(addressByUserId).toBe(TEST_USER.evmAddress);

      console.log('✅ Redis 记录成功');
    });

    it('应该不能重复领取 NFT', async () => {
      const hasClaimed = await nftRedis.hasClaimed(TEST_USER.evmAddress);
      expect(hasClaimed).toBe(true);
      
      // 尝试获取下一个 token ID
      const nextTokenId = await getNextAvailableTokenId();
      const totalClaims = await nftRedis.getTotalClaims();
      
      // 下一个 token ID 应该比已领取的更大
      expect(Number(nextTokenId)).toBeGreaterThan(Number(tokenId));
      
      console.log(`✅ 重复领取保护正常`);
      console.log(`总领取数: ${totalClaims}`);
    });
  });

  describe('4. SHIT 补贴发放流程', () => {
    let subsidyAmount: string;
    let subsidyTxHash: string | undefined;

    it('应该能成功发放 SHIT 补贴', async () => {
      console.log(`\n发放 SHIT 补贴到 ${TEST_USER.evmAddress}...`);
      
      const result = await distributeSubsidy(TEST_USER.evmAddress);
      
      expect(result.success).toBe(true);
      expect(result.amount).toBeTruthy();
      expect(Number(result.amount)).toBeGreaterThanOrEqual(1);
      expect(Number(result.amount)).toBeLessThanOrEqual(5000);
      
      subsidyAmount = result.amount!;
      subsidyTxHash = result.txHash;
      
      console.log(`✅ 补贴发放成功`);
      console.log(`金额: ${subsidyAmount} SHIT`);
      console.log(`交易哈希: ${subsidyTxHash}`);
    }, 30000);

    it('应该不能重复领取补贴', async () => {
      const result = await distributeSubsidy(TEST_USER.evmAddress);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Already claimed subsidy');
      
      console.log('✅ 补贴重复领取保护正常');
    });

    it('应该能查询到正确的 SHIT 余额', async () => {
      const balance = await getBalance(TEST_USER.evmAddress);
      
      expect(balance).toBe(subsidyAmount);
      
      console.log(`✅ 余额查询正常: ${balance} SHIT`);
    });
  });

  describe('5. 完整 API 调用测试', () => {
    const API_URL = 'http://localhost:3000/api/claim-nft';
    const NEW_USER = {
      id: `api-test-${Date.now()}`,
      fingerprint: `api-fp-${Date.now()}`,
      username: 'API测试用户',
      evmAddress: ethers.Wallet.createRandom().address
    };

    it('应该通过 API 成功领取 NFT 和补贴', async () => {
      console.log(`\n测试完整 API 流程...`);
      console.log(`测试地址: ${NEW_USER.evmAddress}`);

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: NEW_USER.id,
          evmAddress: NEW_USER.evmAddress,
          username: NEW_USER.username,
          fingerprint: NEW_USER.fingerprint,
          referrerUserId: TEST_USER.id
        })
      });

      expect(response.ok).toBe(true);
      
      const data = await response.json();
      
      // 验证 NFT
      expect(data.success).toBe(true);
      expect(data.nft).toBeTruthy();
      expect(data.nft.tokenId).toBeTruthy();
      expect(data.txHash).toBeTruthy();
      
      // 验证补贴
      expect(data.subsidy).toBeTruthy();
      expect(data.subsidy.amount).toBeTruthy();
      expect(Number(data.subsidy.amount)).toBeGreaterThanOrEqual(1);
      expect(Number(data.subsidy.amount)).toBeLessThanOrEqual(5000);
      
      console.log(`✅ API 调用成功`);
      console.log(`- NFT Token ID: ${data.nft.tokenId}`);
      console.log(`- NFT 交易: ${data.txHash}`);
      console.log(`- SHIT 补贴: ${data.subsidy.amount}`);
      console.log(`- 补贴交易: ${data.subsidy.txHash}`);

      // 清理
      await redis?.del(`nft:claimed:${NEW_USER.evmAddress.toLowerCase()}`);
    }, 30000);

    it('应该通过 API 阻止重复领取', async () => {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: TEST_USER.id,
          evmAddress: TEST_USER.evmAddress,
          username: TEST_USER.username,
          fingerprint: TEST_USER.fingerprint
        })
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBe('NFT already claimed for this address');
      expect(data.nft).toBeTruthy();
      
      console.log('✅ API 重复领取保护正常');
    });
  });

  describe('6. 数据一致性验证', () => {
    it('应该在 Redis 中有正确的数据结构', async () => {
      // 检查总领取数
      const totalClaims = await nftRedis.getTotalClaims();
      expect(totalClaims).toBeGreaterThan(0);
      
      // 检查 referral 关系
      const referrals = await nftRedis.getReferrals(TEST_REFERRER.evmAddress);
      expect(referrals).toContain(TEST_USER.evmAddress);
      
      // 检查分发树
      const tree = await nftRedis.getDistributionTree(TEST_REFERRER.evmAddress, 2);
      expect(tree).toBeTruthy();
      expect(tree.children).toBeTruthy();
      
      console.log('✅ 数据结构验证通过');
      console.log(`总领取数: ${totalClaims}`);
      console.log(`推荐人的下级数: ${referrals.length}`);
    });
  });
});