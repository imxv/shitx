import { NextRequest, NextResponse } from 'next/server';
import * as mock from '@/lib/mockImplementation';
import { nftRedis } from '@/lib/redis';

// 临时端点：初始化用户余额
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = body;
    
    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }
    
    const normalizedAddress = address.toLowerCase();
    
    // 获取当前余额
    const currentBalance = await mock.getBalance(normalizedAddress);
    
    // 如果余额为0，检查是否有收入历史
    if (currentBalance === '0' || !currentBalance) {
      // 获取财务摘要
      const financialSummary = await nftRedis.getFinancialSummary(normalizedAddress);
      
      // 如果有收入历史但余额为0，说明余额可能丢失了
      if (financialSummary.totalIncome > 0) {
        // 重新计算余额：总收入 - 总支出
        const calculatedBalance = financialSummary.totalIncome - financialSummary.totalExpense;
        
        // 设置正确的余额
        await mock.setBalance(normalizedAddress, calculatedBalance.toString());
        
        return NextResponse.json({
          success: true,
          message: '余额已重新计算并修复',
          previousBalance: currentBalance,
          newBalance: calculatedBalance.toString(),
          calculation: {
            totalIncome: financialSummary.totalIncome,
            totalExpense: financialSummary.totalExpense,
            netBalance: calculatedBalance
          }
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: '余额正常，无需修复',
      currentBalance,
      financialSummary: await nftRedis.getFinancialSummary(normalizedAddress)
    });
    
  } catch (error) {
    console.error('Error initializing balance:', error);
    return NextResponse.json(
      { error: 'Failed to initialize balance' },
      { status: 500 }
    );
  }
}