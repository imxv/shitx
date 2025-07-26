import { NextRequest, NextResponse } from 'next/server';
import * as mock from '@/lib/mockImplementation';

export async function GET(request: NextRequest) {
  try {
    // 获取补贴统计信息
    const subsidyStats = await mock.getSubsidyStats();
    
    // 计算平均金额
    const averageAmount = subsidyStats.totalRecipients > 0 
      ? (subsidyStats.totalDistributed / subsidyStats.totalRecipients).toFixed(2)
      : '0';
    
    return NextResponse.json({
      implementation: 'mock',
      totalDistributed: subsidyStats.totalDistributed.toString(),
      totalRecipients: subsidyStats.totalRecipients,
      averageAmount,
    });
  } catch (error) {
    console.error('Error getting grant stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}