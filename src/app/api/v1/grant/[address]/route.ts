import { NextRequest, NextResponse } from 'next/server';
import * as mock from '@/lib/mockImplementation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address: rawAddress } = await params;
    const address = rawAddress.toLowerCase();
    
    // 获取余额
    const balance = await mock.getBalance(address);
    
    // 检查是否已领取补贴
    const hasClaimedSubsidy = await mock.hasClaimedSubsidy(address);
    
    // 获取补贴信息
    let subsidyAmount = undefined;
    let claimedAt = undefined;
    
    if (hasClaimedSubsidy) {
      // 从 Redis 获取补贴详细信息
      const subsidyKey = `mock:subsidy:${address}`;
      const subsidyData = await mock.nftRedis.get(subsidyKey);
      if (subsidyData) {
        const parsed = JSON.parse(subsidyData);
        subsidyAmount = parsed.amount;
        claimedAt = parsed.timestamp;
      }
    }
    
    return NextResponse.json({
      implementation: 'mock',
      address,
      balance,
      hasClaimedSubsidy,
      subsidyAmount,
      claimedAt,
    });
  } catch (error) {
    console.error('Error getting grant info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}