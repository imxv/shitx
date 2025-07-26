import { NextRequest, NextResponse } from 'next/server';
import { nftRedis } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transferCode, currentFingerprint } = body;
    
    if (!transferCode || !currentFingerprint) {
      return NextResponse.json(
        { error: 'Missing transfer code or current fingerprint' },
        { status: 400 }
      );
    }
    
    // 验证转移码格式（64位十六进制）
    if (!/^[a-f0-9]{64}$/i.test(transferCode)) {
      return NextResponse.json(
        { error: 'Invalid transfer code format' },
        { status: 400 }
      );
    }
    
    // 查找转移码对应的账户
    const accountDataStr = await nftRedis.get(`transfer_code_lookup:${transferCode.toLowerCase()}`);
    
    if (!accountDataStr) {
      return NextResponse.json(
        { error: 'Invalid transfer code' },
        { status: 404 }
      );
    }
    
    const accountData = JSON.parse(accountDataStr);
    
    // 记录账户迁移映射
    await nftRedis.set(
      `account:migration:${currentFingerprint}`,
      JSON.stringify({
        originalFingerprint: accountData.fingerprint,
        migratedAt: Date.now(),
        migratedFrom: currentFingerprint
      })
    );
    
    // 记录迁移历史
    await nftRedis.lpush(
      `account:migration_history:${accountData.fingerprint}`,
      JSON.stringify({
        fromFingerprint: currentFingerprint,
        toFingerprint: accountData.fingerprint,
        timestamp: Date.now(),
        action: 'import'
      })
    );
    
    return NextResponse.json({
      success: true,
      account: {
        userId: accountData.userId,
        fingerprint: accountData.fingerprint,
        username: accountData.username,
        evmAddress: accountData.evmAddress
      },
      message: '账户导入成功'
    });
  } catch (error) {
    console.error('Error importing account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}