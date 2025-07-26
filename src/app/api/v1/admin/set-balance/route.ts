import { NextRequest, NextResponse } from 'next/server';
import * as mock from '@/lib/mockImplementation';
import { nftRedis } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    // 简单的权限检查（生产环境应该使用更安全的方式）
    const authHeader = request.headers.get('authorization');
    if (authHeader !== 'Bearer admin-secret') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { address, amount } = body;
    
    if (!address || amount === undefined || amount === null) {
      return NextResponse.json(
        { error: 'Missing required fields: address, amount' },
        { status: 400 }
      );
    }
    
    const normalizedAddress = address.toLowerCase();
    const numericAmount = parseInt(amount.toString());
    
    if (isNaN(numericAmount) || numericAmount < 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }
    
    // 设置余额
    await mock.setBalance(normalizedAddress, numericAmount.toString());
    
    // 记录管理员操作
    await nftRedis.recordDirectSubsidy(
      normalizedAddress,
      numericAmount,
      'admin',
      'manual_adjustment'
    );
    
    // 获取更新后的余额
    const newBalance = await mock.getBalance(normalizedAddress);
    
    return NextResponse.json({
      success: true,
      address: normalizedAddress,
      previousBalance: '未知',
      newBalance,
      message: `成功设置 ${normalizedAddress} 的余额为 ${numericAmount} SHIT`
    });
    
  } catch (error) {
    console.error('Error setting balance:', error);
    return NextResponse.json(
      { error: 'Failed to set balance' },
      { status: 500 }
    );
  }
}