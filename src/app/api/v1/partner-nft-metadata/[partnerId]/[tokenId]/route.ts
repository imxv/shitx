import { NextRequest, NextResponse } from 'next/server';
import { getPartnerNFTMetadata } from '@/lib/mockImplementation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string; tokenId: string }> }
) {
  try {
    const { partnerId, tokenId } = await params;
    
    // 获取合作方 NFT 元数据
    const metadata = await getPartnerNFTMetadata(partnerId, tokenId);
    
    return NextResponse.json(metadata, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=31536000', // 缓存1年
      },
    });
  } catch (error) {
    console.error('Error getting partner NFT metadata:', error);
    return NextResponse.json(
      { error: 'Failed to get NFT metadata' },
      { status: 500 }
    );
  }
}