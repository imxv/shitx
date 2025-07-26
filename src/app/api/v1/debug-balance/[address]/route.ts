import { NextRequest, NextResponse } from 'next/server';
import * as mock from '@/lib/mockImplementation';
import { nftRedis } from '@/lib/redis';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    const normalizedAddress = address.toLowerCase();
    
    // 获取所有相关数据
    const mockBalance = await mock.getBalance(normalizedAddress);
    const hasClaimedSubsidy = await mock.hasClaimedSubsidy(normalizedAddress);
    
    // 获取收入历史
    const grantHistory = await nftRedis.getGrantHistory(normalizedAddress);
    
    // 获取支出历史
    const expenseHistory = await nftRedis.getExpenseHistory(normalizedAddress);
    
    // 获取财务摘要
    const financialSummary = await nftRedis.getFinancialSummary(normalizedAddress);
    
    // 直接从Redis获取原始余额数据
    const rawBalance = await nftRedis.get(`mock:balance:${normalizedAddress}`);
    
    // 获取补贴详情
    const subsidyData = await nftRedis.get(`mock:subsidy:${normalizedAddress}`);
    
    return NextResponse.json({
      address: normalizedAddress,
      debug: {
        mockBalance,
        rawBalance,
        hasClaimedSubsidy,
        subsidyData: subsidyData ? JSON.parse(subsidyData) : null
      },
      income: {
        history: grantHistory,
        breakdown: financialSummary.incomeBreakdown
      },
      expense: {
        history: expenseHistory,
        breakdown: financialSummary.expenseBreakdown
      },
      summary: financialSummary
    });
  } catch (error) {
    console.error('Error debugging balance:', error);
    return NextResponse.json(
      { error: 'Failed to debug balance', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}