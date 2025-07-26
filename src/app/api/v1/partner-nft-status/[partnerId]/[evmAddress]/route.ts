import { NextRequest, NextResponse } from 'next/server';
import { nftRedis } from '@/lib/redis';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string; evmAddress: string }> }
) {
  try {
    const { partnerId, evmAddress: rawAddress } = await params;
    const evmAddress = rawAddress.toLowerCase();
    
    // 检查是否已经领取
    const hasClaimed = await nftRedis.hasPartnerClaimed(partnerId, evmAddress);
    const nft = hasClaimed ? await nftRedis.getPartnerNFT(partnerId, evmAddress) : null;
    
    return NextResponse.json({
      implementation: 'mock',
      partnerId,
      evmAddress,
      hasClaimed,
      nft,
    });
  } catch (error) {
    console.error('Error checking partner NFT status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}