import { NextRequest, NextResponse } from 'next/server';
import { nftRedis } from '@/lib/redis';

// 仅在开发环境启用
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }
  
  try {
    // 获取所有始祖码
    const ancestorCodes = await nftRedis.getAllAncestorCodes();
    
    // 获取指定的始祖码
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    
    let specificCode = null;
    if (code) {
      const verification = await nftRedis.verifyAncestorCode(code);
      specificCode = verification;
    }
    
    return NextResponse.json({
      totalCodes: ancestorCodes.length,
      codes: ancestorCodes,
      specificCode: specificCode,
      redisStatus: ancestorCodes.length > 0 ? 'connected' : 'possibly disconnected or empty'
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ error: 'Internal error', details: error }, { status: 500 });
  }
}