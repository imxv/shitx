import { NextRequest, NextResponse } from 'next/server';
import { nftRedis } from '@/lib/redis';
import { partners } from '@/config/partners';

export async function GET(request: NextRequest) {
  try {
    // 简单的权限检查（实际应该更严格）
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== process.env.ADMIN_API_KEY && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 获取主 NFT 的 claim 统计
    const mainNFTClaims = await nftRedis.getTotalClaims();

    // 获取各合作方的 claim 统计
    const partnerClaims: Record<string, number> = {};
    for (const partner of partners) {
      partnerClaims[partner.id] = await nftRedis.getPartnerTotalClaims(partner.id);
    }

    return NextResponse.json({
      mainNFTClaims,
      partnerClaims,
      totalClaims: mainNFTClaims + Object.values(partnerClaims).reduce((sum, count) => sum + count, 0),
    });
  } catch (error) {
    console.error('Error getting admin stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}