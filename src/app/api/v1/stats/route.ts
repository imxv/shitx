import { NextRequest, NextResponse } from 'next/server';
import { nftRedis } from '@/lib/redis';
import * as mock from '@/lib/mockImplementation';

export async function GET() {
  try {
    // 获取 NFT 统计
    const nftStats = await mock.getNFTStats();
    
    // 获取补贴统计
    const subsidyStats = await mock.getSubsidyStats();
    
    // 获取最近的领取记录
    const recentClaimsKeys = await nftRedis.keys('nft:claim:*');
    const recentClaims = [];
    
    // 获取最近 10 个领取记录
    for (const key of recentClaimsKeys.slice(-10).reverse()) {
      const claim = await nftRedis.get(key);
      if (claim) {
        const claimData = JSON.parse(claim);
        recentClaims.push({
          address: key.replace('nft:claim:', ''),
          tokenId: claimData.tokenId,
          username: claimData.metadata?.attributes?.find((a: any) => a.trait_type === 'Username')?.value,
          rarity: claimData.metadata?.attributes?.find((a: any) => a.trait_type === 'Rarity')?.value,
          claimedAt: claimData.claimedAt,
        });
      }
    }
    
    // 获取推荐关系统计
    const referralKeys = await nftRedis.keys('nft:referral:*');
    const topReferrers = new Map<string, number>();
    
    for (const key of referralKeys) {
      const referrer = await nftRedis.get(key);
      if (referrer) {
        const count = topReferrers.get(referrer) || 0;
        topReferrers.set(referrer, count + 1);
      }
    }
    
    // 转换为数组并排序
    const referrerStats = Array.from(topReferrers.entries())
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return NextResponse.json({
      implementation: 'mock',
      timestamp: Date.now(),
      nft: nftStats,
      subsidy: subsidyStats,
      recentClaims,
      topReferrers: referrerStats,
      message: 'Mock statistics from Redis',
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}