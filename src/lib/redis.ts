import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn('REDIS_URL not found, using in-memory fallback');
}

// 创建 Redis 客户端
export const redis = redisUrl ? new Redis(redisUrl) : null;

// NFT claim 相关的 Redis 操作
export const nftRedis = {
  // 通用 get 方法
  async get(key: string): Promise<string | null> {
    if (!redis) return null;
    return redis.get(key);
  },

  // 通用 set 方法
  async set(key: string, value: string, expirySeconds?: number): Promise<void> {
    if (!redis) return;
    if (expirySeconds) {
      await redis.set(key, value, 'EX', expirySeconds);
    } else {
      await redis.set(key, value);
    }
  },

  // 获取所有匹配的键
  async keys(pattern: string): Promise<string[]> {
    if (!redis) return [];
    return redis.keys(pattern);
  },

  // List push 方法
  async lpush(key: string, value: string): Promise<number> {
    if (!redis) return 0;
    return redis.lpush(key, value);
  },

  // 删除键
  async del(key: string): Promise<number> {
    if (!redis) return 0;
    return redis.del(key);
  },
  // 检查地址是否已经 claim 过
  async hasClaimed(evmAddress: string): Promise<boolean> {
    if (!redis) return false;
    const result = await redis.get(`nft:claimed:${evmAddress}`);
    return !!result;
  },

  // 记录 NFT claim
  async recordClaim(evmAddress: string, nftData: any, referrerAddress?: string): Promise<void> {
    if (!redis) return;
    
    // 设置 claim 记录
    await redis.set(
      `nft:claimed:${evmAddress}`, 
      JSON.stringify(nftData),
      'EX',
      60 * 60 * 24 * 365 // 1年过期
    );
    
    // 增加总 claim 计数
    await redis.incr('nft:total_claims');
    
    // 记录到 claim 列表
    await redis.lpush('nft:claim_list', JSON.stringify({
      address: evmAddress,
      timestamp: Date.now(),
      nftData
    }));
    
    // 记录 referral 关系
    if (referrerAddress) {
      await redis.set(
        `nft:referral:${evmAddress}`,
        referrerAddress,
        'EX',
        60 * 60 * 24 * 365 // 1年过期
      );
      
      // 记录下级列表
      await redis.sadd(`nft:referrals:${referrerAddress}`, evmAddress);
    }
    
    // 记录用户 ID 到地址的映射
    if (nftData.metadata?.attributes) {
      const userIdAttr = nftData.metadata.attributes.find((a: any) => a.trait_type === 'User ID');
      if (userIdAttr) {
        await redis.set(
          `user:id:${userIdAttr.value}`,
          evmAddress,
          'EX',
          60 * 60 * 24 * 365
        );
      }
    }
  },
  
  // 根据用户 ID 获取 EVM 地址
  async getAddressByUserId(userId: string): Promise<string | null> {
    if (!redis) return null;
    return await redis.get(`user:id:${userId}`);
  },

  // 获取 NFT 信息
  async getNFT(evmAddress: string): Promise<unknown | null> {
    if (!redis) return null;
    const data = await redis.get(`nft:claimed:${evmAddress}`);
    return data ? JSON.parse(data) : null;
  },

  // 获取总 claim 数
  async getTotalClaims(): Promise<number> {
    if (!redis) return 0;
    const count = await redis.get('nft:total_claims');
    return parseInt(count || '0', 10);
  },

  // 合作方 NFT 相关操作
  async hasPartnerClaimed(partnerId: string, evmAddress: string): Promise<boolean> {
    if (!redis) return false;
    const result = await redis.get(`partner_nft:${partnerId}:claimed:${evmAddress}`);
    return !!result;
  },

  async recordPartnerClaim(partnerId: string, evmAddress: string, nftData: unknown): Promise<void> {
    if (!redis) return;
    
    // 设置 claim 记录
    await redis.set(
      `partner_nft:${partnerId}:claimed:${evmAddress}`, 
      JSON.stringify(nftData),
      'EX',
      60 * 60 * 24 * 365 // 1年过期
    );
    
    // 增加合作方 NFT 总 claim 计数
    await redis.incr(`partner_nft:${partnerId}:total_claims`);
  },

  async getPartnerNFT(partnerId: string, evmAddress: string): Promise<unknown | null> {
    if (!redis) return null;
    const data = await redis.get(`partner_nft:${partnerId}:claimed:${evmAddress}`);
    return data ? JSON.parse(data) : null;
  },

  async getPartnerTotalClaims(partnerId: string): Promise<number> {
    if (!redis) return 0;
    const count = await redis.get(`partner_nft:${partnerId}:total_claims`);
    return parseInt(count || '0', 10);
  },

  // 获取 referral 关系
  async getReferrer(evmAddress: string): Promise<string | null> {
    if (!redis) return null;
    return await redis.get(`nft:referral:${evmAddress}`);
  },

  // 获取 referral 链（多级推荐人）
  async getReferralChain(evmAddress: string, maxDepth: number = 3): Promise<string[]> {
    if (!redis) return [];
    
    const chain: string[] = [];
    let currentAddress = evmAddress;
    
    for (let i = 0; i < maxDepth; i++) {
      const referrer = await this.getReferrer(currentAddress);
      if (!referrer) break;
      chain.push(referrer);
      currentAddress = referrer;
    }
    
    return chain;
  },

  // 记录推荐奖励
  async recordReferralReward(
    recipientAddress: string, 
    amount: number, 
    level: number,
    sourceAddress: string,
    partnerId?: string,
    sourceNFTId?: string
  ): Promise<void> {
    if (!redis) return;
    
    const rewardData = {
      amount,
      level,
      sourceAddress,
      partnerId,
      sourceNFTId,
      timestamp: Date.now(),
      type: 'referral_reward' as const
    };
    
    // 记录奖励历史
    await redis.lpush(
      `nft:referral_rewards:${recipientAddress}`,
      JSON.stringify(rewardData)
    );
    
    // 增加总奖励计数
    await redis.incrby(`nft:referral_rewards_total:${recipientAddress}`, amount);
  },
  
  // 记录直接领取补贴
  async recordDirectSubsidy(
    recipientAddress: string,
    amount: number,
    partnerId?: string,
    nftId?: string
  ): Promise<void> {
    if (!redis) return;
    
    const subsidyData = {
      amount,
      partnerId,
      nftId,
      timestamp: Date.now(),
      type: 'direct_subsidy' as const
    };
    
    // 记录到收益历史
    await redis.lpush(
      `nft:referral_rewards:${recipientAddress}`,
      JSON.stringify(subsidyData)
    );
    
    // 不计入referral_rewards_total，因为这是直接补贴
  },
  
  // 获取收益记录历史
  async getRewardHistory(evmAddress: string, limit: number = 50): Promise<any[]> {
    if (!redis) return [];
    
    const history = await redis.lrange(`nft:referral_rewards:${evmAddress}`, 0, limit - 1);
    return history.map(item => JSON.parse(item));
  },

  // 获取推荐奖励总额
  async getReferralRewardsTotal(evmAddress: string): Promise<number> {
    if (!redis) return 0;
    const total = await redis.get(`nft:referral_rewards_total:${evmAddress}`);
    return parseInt(total || '0', 10);
  },

  // 记录合作方NFT的推荐关系
  async recordPartnerReferral(
    partnerId: string,
    claimerAddress: string,
    referrerNFTId: string
  ): Promise<void> {
    if (!redis) return;
    
    await redis.set(
      `partner_nft:${partnerId}:referral:${claimerAddress}`,
      referrerNFTId,
      'EX',
      60 * 60 * 24 * 365 // 1年过期
    );
  },

  async getReferrals(evmAddress: string): Promise<string[]> {
    if (!redis) return [];
    return await redis.smembers(`nft:referrals:${evmAddress}`);
  },

  // 获取完整的分发树
  async getDistributionTree(rootAddress: string, maxDepth: number = 5): Promise<any> {
    if (!redis) return null;
    
    const buildTree = async (address: string, depth: number): Promise<any> => {
      if (depth > maxDepth) return null;
      
      const nftData = await this.getNFT(address);
      const referrals = await this.getReferrals(address);
      
      const children = [];
      for (const referral of referrals) {
        const child = await buildTree(referral, depth + 1);
        if (child) children.push(child);
      }
      
      return {
        address,
        nftData,
        children,
        depth
      };
    };
    
    return await buildTree(rootAddress, 0);
  },

  // 始祖码相关操作
  // 创建始祖码
  async createAncestorCode(nftType: string, code: string): Promise<void> {
    if (!redis) return;
    
    const ancestorData = {
      code,
      nftType,
      createdAt: Date.now(),
      isUsed: false
    };
    
    await redis.set(
      `ancestor_code:${code}`,
      JSON.stringify(ancestorData),
      'EX',
      60 * 60 * 24 * 30 // 30天过期
    );
  },

  // 验证始祖码
  async verifyAncestorCode(code: string): Promise<{ valid: boolean; data?: any; error?: string }> {
    if (!redis) return { valid: false, error: 'Redis not available' };
    
    const data = await redis.get(`ancestor_code:${code}`);
    if (!data) {
      return { valid: false, error: '始祖码不存在或已过期' };
    }
    
    const ancestorData = JSON.parse(data);
    if (ancestorData.isUsed) {
      return { valid: false, error: '始祖码已被使用' };
    }
    
    return { valid: true, data: ancestorData };
  },

  // 使用始祖码
  async useAncestorCode(code: string, userAddress: string): Promise<{ success: boolean; error?: string; data?: any }> {
    if (!redis) return { success: false, error: 'Redis not available' };
    
    // 验证始祖码
    const verification = await this.verifyAncestorCode(code);
    if (!verification.valid) {
      return { success: false, error: verification.error };
    }
    
    const ancestorData = verification.data;
    
    // 检查该NFT类型是否已有始祖
    const existingAncestor = await redis.get(`ancestor_holder:${ancestorData.nftType}`);
    if (existingAncestor) {
      return { success: false, error: '该NFT类型已有始祖' };
    }
    
    // 标记始祖码为已使用
    const updatedData = {
      ...ancestorData,
      isUsed: true,
      usedAt: Date.now(),
      usedBy: userAddress
    };
    
    await redis.set(
      `ancestor_code:${code}`,
      JSON.stringify(updatedData),
      'EX',
      60 * 60 * 24 * 365 // 延长到1年保存记录
    );
    
    // 设置始祖持有者
    await redis.set(
      `ancestor_holder:${ancestorData.nftType}`,
      userAddress,
      'EX',
      60 * 60 * 24 * 365 // 1年过期
    );
    
    return { success: true, data: updatedData };
  },

  // 获取始祖持有者
  async getAncestorHolder(nftType: string): Promise<string | null> {
    if (!redis) return null;
    return await redis.get(`ancestor_holder:${nftType}`);
  },

  // 检查用户是否为某个NFT类型的始祖
  async isAncestorHolder(userAddress: string, nftType: string): Promise<boolean> {
    if (!redis) return false;
    const ancestor = await this.getAncestorHolder(nftType);
    return ancestor === userAddress;
  },

  // 删除始祖码（管理员挂失功能）
  async removeAncestorCode(code: string): Promise<boolean> {
    if (!redis) return false;
    const result = await redis.del(`ancestor_code:${code}`);
    return result > 0;
  },

  // 删除始祖持有者（管理员挂失功能）
  async removeAncestorHolder(nftType: string): Promise<boolean> {
    if (!redis) return false;
    const result = await redis.del(`ancestor_holder:${nftType}`);
    return result > 0;
  },

  // 获取所有始祖码状态
  async getAllAncestorCodes(): Promise<any[]> {
    if (!redis) return [];
    
    const keys = await redis.keys('ancestor_code:*');
    const codes = [];
    
    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        codes.push(JSON.parse(data));
      }
    }
    
    return codes;
  }
};