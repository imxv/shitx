import { NextRequest, NextResponse } from 'next/server';
import { nftRedis } from '@/lib/redis';
import { getPartnerById } from '@/config/partners';

interface ReferralUser {
  address: string;
  username: string;
  displayAddress: string;
  totalEarnings: number;
  directEarnings: number;
  level: number;
  joinedAt?: number;
  nftCount: number;
  lastActiveAt?: number;
}

interface LevelStats {
  level: number;
  userCount: number;
  totalEarnings: number;
  avgEarnings: number;
  topEarner?: ReferralUser;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const evmAddress = address.toLowerCase();
    
    // 获取所有层级的推荐用户
    const level1Users = await nftRedis.getReferrals(evmAddress);
    const allReferrals: { [key: string]: ReferralUser } = {};
    const levelStats: LevelStats[] = [];
    
    // 处理一级推荐用户
    for (const userAddress of level1Users) {
      const user = await getUserInfo(userAddress, 1);
      if (user) {
        allReferrals[userAddress] = user;
      }
    }
    
    // 处理二级推荐用户
    for (const level1Address of level1Users) {
      const level2Users = await nftRedis.getReferrals(level1Address);
      for (const userAddress of level2Users) {
        if (!allReferrals[userAddress]) { // 避免重复
          const user = await getUserInfo(userAddress, 2);
          if (user) {
            allReferrals[userAddress] = user;
          }
        }
      }
    }
    
    // 处理三级推荐用户
    for (const level1Address of level1Users) {
      const level2Users = await nftRedis.getReferrals(level1Address);
      for (const level2Address of level2Users) {
        const level3Users = await nftRedis.getReferrals(level2Address);
        for (const userAddress of level3Users) {
          if (!allReferrals[userAddress]) { // 避免重复
            const user = await getUserInfo(userAddress, 3);
            if (user) {
              allReferrals[userAddress] = user;
            }
          }
        }
      }
    }
    
    // 计算各级统计信息
    for (let level = 1; level <= 3; level++) {
      const levelUsers = Object.values(allReferrals).filter(u => u.level === level);
      const totalEarnings = levelUsers.reduce((sum, u) => sum + u.totalEarnings, 0);
      const topEarner = levelUsers.reduce((top, user) => 
        !top || user.totalEarnings > top.totalEarnings ? user : top, 
        null as ReferralUser | null
      );
      
      levelStats.push({
        level,
        userCount: levelUsers.length,
        totalEarnings,
        avgEarnings: levelUsers.length > 0 ? totalEarnings / levelUsers.length : 0,
        topEarner: topEarner || undefined
      });
    }
    
    // 按收益排序
    const sortedReferrals = Object.values(allReferrals)
      .sort((a, b) => b.totalEarnings - a.totalEarnings);
    
    // 计算总统计
    const totalStats = {
      totalUsers: sortedReferrals.length,
      totalEarnings: sortedReferrals.reduce((sum, u) => sum + u.totalEarnings, 0),
      totalDirectEarnings: sortedReferrals.reduce((sum, u) => sum + u.directEarnings, 0),
      avgEarningsPerUser: sortedReferrals.length > 0 
        ? sortedReferrals.reduce((sum, u) => sum + u.totalEarnings, 0) / sortedReferrals.length 
        : 0
    };
    
    return NextResponse.json({
      address: evmAddress,
      referrals: sortedReferrals,
      levelStats,
      totalStats
    });
  } catch (error) {
    console.error('Error getting referral tree:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getUserInfo(address: string, level: number): Promise<ReferralUser | null> {
  try {
    // 获取用户NFT信息
    const nftData = await nftRedis.getNFT(address) as any;
    let username = '未知用户';
    let joinedAt: number | undefined;
    
    if (nftData && nftData.metadata?.attributes) {
      const usernameAttr = nftData.metadata.attributes.find((a: any) => a.trait_type === 'Username');
      const joinedAttr = nftData.metadata.attributes.find((a: any) => a.trait_type === 'Claimed At');
      
      username = usernameAttr?.value || '未知用户';
      joinedAt = joinedAttr?.value ? new Date(joinedAttr.value).getTime() : undefined;
    }
    
    // 获取收益历史
    const history = await nftRedis.getRewardHistory(address, 100);
    const totalEarnings = history.reduce((sum, record) => sum + record.amount, 0);
    const directEarnings = history
      .filter(record => record.type === 'direct_subsidy')
      .reduce((sum, record) => sum + record.amount, 0);
    
    // 获取NFT数量（简单统计）
    const partnerNFTs = await getPartnerNFTCount(address);
    const nftCount = (nftData ? 1 : 0) + partnerNFTs;
    
    // 获取最后活跃时间
    const lastActiveAt = history.length > 0 
      ? Math.max(...history.map(h => h.timestamp))
      : joinedAt;
    
    return {
      address,
      username,
      displayAddress: `${address.slice(0, 6)}...${address.slice(-4)}`,
      totalEarnings,
      directEarnings,
      level,
      joinedAt,
      nftCount,
      lastActiveAt
    };
  } catch (error) {
    console.error(`Error getting user info for ${address}:`, error);
    return null;
  }
}

async function getPartnerNFTCount(address: string): Promise<number> {
  try {
    // 这里可以遍历所有合作方检查NFT数量
    // 简化实现，返回0
    return 0;
  } catch (error) {
    return 0;
  }
}