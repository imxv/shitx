import { NextRequest, NextResponse } from 'next/server';
import { nftRedis } from '@/lib/redis';
import * as mock from '@/lib/mockImplementation';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const evmAddress = params.address.toLowerCase();
    
    // 获取推荐统计
    const referrals = await nftRedis.getReferrals(evmAddress);
    const referralRewardsTotal = await nftRedis.getReferralRewardsTotal(evmAddress);
    const balance = await mock.getBalance(evmAddress);
    
    // 获取推荐链（查看自己的上级）
    const referralChain = await nftRedis.getReferralChain(evmAddress, 3);
    
    // 计算各级推荐人数
    let level1Count = 0;
    let level2Count = 0;
    let level3Count = 0;
    
    // 遍历直接推荐人
    for (const referral of referrals) {
      level1Count++;
      
      // 获取二级推荐人
      const level2Referrals = await nftRedis.getReferrals(referral);
      level2Count += level2Referrals.length;
      
      // 获取三级推荐人
      for (const level2Referral of level2Referrals) {
        const level3Referrals = await nftRedis.getReferrals(level2Referral);
        level3Count += level3Referrals.length;
      }
    }
    
    return NextResponse.json({
      address: evmAddress,
      referralStats: {
        totalReferrals: referrals.length,
        level1Count,
        level2Count,
        level3Count,
        totalRewards: referralRewardsTotal,
      },
      balance,
      referralChain: referralChain.map((addr, index) => ({
        level: index + 1,
        address: addr,
        displayAddress: `${addr.slice(0, 6)}...${addr.slice(-4)}`
      })),
      directReferrals: referrals.slice(0, 10).map(addr => ({
        address: addr,
        displayAddress: `${addr.slice(0, 6)}...${addr.slice(-4)}`
      })),
    });
  } catch (error) {
    console.error('Error getting referral stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}