import { NextRequest, NextResponse } from 'next/server';
import { nftRedis } from '@/lib/redis';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string; evmAddress: string }> }
) {
  try {
    const { partnerId, evmAddress } = await params;
    
    // 检查是否已经 claim 过合作方 NFT
    const hasClaimed = await nftRedis.hasPartnerClaimed(partnerId, evmAddress);
    
    if (hasClaimed) {
      const nft = await nftRedis.getPartnerNFT(partnerId, evmAddress);
      return NextResponse.json({
        hasClaimed: true,
        nft,
      });
    }
    
    return NextResponse.json({
      hasClaimed: false,
    });
  } catch (error) {
    console.error('Error checking partner NFT status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}