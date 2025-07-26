import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn('REDIS_URL not found, using in-memory fallback');
}

// 创建 Redis 客户端
export const redis = redisUrl ? new Redis(redisUrl) : null;

// NFT claim 相关的 Redis 操作
export const nftRedis = {
  // 检查地址是否已经 claim 过
  async hasClaimed(evmAddress: string): Promise<boolean> {
    if (!redis) return false;
    const result = await redis.get(`nft:claimed:${evmAddress}`);
    return !!result;
  },

  // 记录 NFT claim
  async recordClaim(evmAddress: string, nftData: unknown): Promise<void> {
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
  }
};