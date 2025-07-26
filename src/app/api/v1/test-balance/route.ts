import { NextRequest, NextResponse } from 'next/server';
import * as mock from '@/lib/mockImplementation';
import { getUserIdentity } from '@/utils/userIdentity';
import { generateEVMAddress } from '@/utils/web3Utils';

export async function GET(request: NextRequest) {
  try {
    // 获取当前用户地址
    const identity = getUserIdentity();
    const address = generateEVMAddress(identity.fingerprint).toLowerCase();
    
    // 从多个来源获取余额
    const mockBalance = await mock.getBalance(address);
    
    // 获取grant信息
    const grantResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/v1/grant/${address}`);
    const grantData = await grantResponse.json();
    
    // 获取shit-balance信息
    const balanceResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/v1/shit-balance/${address}`);
    const balanceData = await balanceResponse.json();
    
    return NextResponse.json({
      address,
      test: {
        directMockBalance: mockBalance,
        grantApiBalance: grantData.balance,
        shitBalanceApiBalance: balanceData.balance,
        allEqual: mockBalance === grantData.balance && mockBalance === balanceData.balance
      },
      apis: {
        grant: grantData,
        shitBalance: balanceData
      }
    });
  } catch (error) {
    console.error('Error testing balance:', error);
    return NextResponse.json(
      { error: 'Failed to test balance', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}