import { NextRequest, NextResponse } from 'next/server';
import { nftRedis } from '@/lib/redis';
import { generateEVMAddress } from '@/utils/web3Utils';
import crypto from 'crypto';

// 生成转移码
function generateTransferCode(fingerprint: string): string {
  const salt = crypto.randomBytes(32).toString('hex');
  const timestamp = Date.now().toString();
  const data = fingerprint + salt + timestamp;
  return crypto.createHash('sha256').update(data).digest('hex');
}

// 获取当前账户的转移码
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fingerprint = searchParams.get('fingerprint');
    const userId = searchParams.get('userId');
    
    if (!fingerprint || !userId) {
      return NextResponse.json(
        { error: 'Missing fingerprint or userId' },
        { status: 400 }
      );
    }
    
    // 检查是否已有转移码
    const existingCode = await nftRedis.get(`account:transfer_code:${userId}`);
    
    if (existingCode) {
      return NextResponse.json({
        transferCode: existingCode,
        hasCode: true
      });
    }
    
    return NextResponse.json({
      hasCode: false
    });
  } catch (error) {
    console.error('Error getting transfer code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 生成新的转移码
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fingerprint, userId, username } = body;
    
    if (!fingerprint || !userId || !username) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    const evmAddress = generateEVMAddress(fingerprint);
    
    // 生成新的转移码
    const transferCode = generateTransferCode(fingerprint);
    
    // 删除旧的转移码映射（如果存在）
    const oldCode = await nftRedis.get(`account:transfer_code:${userId}`);
    if (oldCode) {
      await nftRedis.del(`transfer_code_lookup:${oldCode}`);
    }
    
    // 存储账户信息到转移码映射
    const accountData = {
      userId,
      fingerprint,
      username,
      evmAddress,
      createdAt: Date.now()
    };
    
    // 设置双向映射
    await nftRedis.set(`account:transfer_code:${userId}`, transferCode);
    await nftRedis.set(`transfer_code_lookup:${transferCode}`, JSON.stringify(accountData));
    
    return NextResponse.json({
      transferCode,
      success: true,
      message: '转移码生成成功'
    });
  } catch (error) {
    console.error('Error generating transfer code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}