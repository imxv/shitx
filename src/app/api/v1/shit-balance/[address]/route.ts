import { NextRequest, NextResponse } from 'next/server';
import * as mock from '@/lib/mockImplementation';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    
    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // 从mock实现获取余额
    const balance = await mock.getBalance(address);
    
    return NextResponse.json({
      address,
      balance,
      success: true
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}