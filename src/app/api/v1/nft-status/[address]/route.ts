import { NextRequest, NextResponse } from 'next/server';
import { nftRedis } from '@/lib/redis';
import * as mock from '@/lib/mockImplementation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address: rawAddress } = await params;
    const address = rawAddress.toLowerCase();
    
    // 检查是否已经领取
    const hasClaimed = await nftRedis.hasClaimed(address);
    const nft = hasClaimed ? await nftRedis.getNFT(address) : null;
    
    // 获取余额
    const balance = await mock.getBalance(address);
    
    // 检查补贴状态
    const hasClaimedSubsidy = await mock.hasClaimedSubsidy(address);
    
    return NextResponse.json({
      implementation: 'mock',
      address,
      hasClaimed,
      nft,
      balance,
      hasClaimedSubsidy,
    });
  } catch (error) {
    console.error('Error checking NFT status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}