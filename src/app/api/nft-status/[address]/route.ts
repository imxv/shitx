import { NextRequest, NextResponse } from 'next/server';
import { nftRedis } from '@/lib/redis';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    const hasClaimed = await nftRedis.hasClaimed(address);
    const nft = hasClaimed ? await nftRedis.getNFT(address) : null;
    const totalClaims = await nftRedis.getTotalClaims();

    return NextResponse.json({
      hasClaimed,
      nft,
      address,
      totalClaims,
    });
  } catch (error) {
    console.error('Error checking NFT status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}