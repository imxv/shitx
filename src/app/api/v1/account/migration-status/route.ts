import { NextRequest, NextResponse } from 'next/server';
import { nftRedis } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fingerprint = searchParams.get('fingerprint');
    
    if (!fingerprint) {
      return NextResponse.json(
        { error: 'Missing fingerprint' },
        { status: 400 }
      );
    }
    
    // 检查是否有迁移记录
    const migrationData = await nftRedis.get(`account:migration:${fingerprint}`);
    
    if (!migrationData) {
      return NextResponse.json({
        hasMigration: false
      });
    }
    
    const migration = JSON.parse(migrationData);
    
    // 获取原账户信息
    const originalFingerprint = migration.originalFingerprint;
    
    // 查找原账户的转移码来获取完整信息
    const transferCodesPattern = 'transfer_code_lookup:*';
    const keys = await nftRedis.keys(transferCodesPattern);
    
    for (const key of keys) {
      const accountDataStr = await nftRedis.get(key);
      if (accountDataStr) {
        const accountData = JSON.parse(accountDataStr);
        if (accountData.fingerprint === originalFingerprint) {
          return NextResponse.json({
            hasMigration: true,
            account: {
              userId: accountData.userId,
              fingerprint: accountData.fingerprint,
              username: accountData.username,
              evmAddress: accountData.evmAddress,
              createdAt: accountData.createdAt
            }
          });
        }
      }
    }
    
    return NextResponse.json({
      hasMigration: false
    });
  } catch (error) {
    console.error('Error checking migration status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}