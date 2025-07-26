import { NextRequest, NextResponse } from 'next/server';
import { nftRedis } from '@/lib/redis';

// 仅在开发环境启用
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }
  
  try {
    const { address } = await request.json();
    const lowerAddress = address.toLowerCase();
    
    // 获取 NFT 数据
    const hasClaimed = await nftRedis.hasClaimed(lowerAddress);
    const nftData = await nftRedis.getNFT(lowerAddress);
    const referrer = await nftRedis.getReferrer(lowerAddress);
    const referrals = await nftRedis.getReferrals(lowerAddress);
    
    return NextResponse.json({
      address: lowerAddress,
      hasClaimed,
      nftData,
      referrer,
      referrals,
      referralCount: referrals.length
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}