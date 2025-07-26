import { NextRequest, NextResponse } from 'next/server';
import { nftRedis } from '@/lib/redis';
import { getPartnerById } from '@/lib/partnersService';
import crypto from 'crypto';

// QR Code 有效期（5分钟）
const QR_CODE_VALIDITY = 5 * 60 * 1000;

// 加密密钥（生产环境应该从环境变量读取）
const ENCRYPTION_KEY = process.env.QR_ENCRYPTION_KEY || 'shitx-qr-secret-key-2025';

// 验证QR Code签名
function verifyQRCode(params: {
  t: string;
  id: string;
  user: string;
  ref?: string;
  nft?: string;
  sig: string;
}): boolean {
  const { sig, ...data } = params;
  
  // 检查时间戳
  const timestamp = parseInt(params.t);
  if (isNaN(timestamp) || Date.now() - timestamp > QR_CODE_VALIDITY) {
    return false;
  }
  
  // 验证签名
  const dataString = Object.keys(data)
    .sort()
    .map(key => `${key}=${data[key as keyof typeof data]}`)
    .join('&');
    
  const expectedSig = crypto
    .createHmac('sha256', ENCRYPTION_KEY)
    .update(dataString)
    .digest('hex');
    
  return sig === expectedSig;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      // QR Code 参数
      qrParams,
      // 扫描者信息
      claimerUserId,
      claimerUsername,
      claimerFingerprint,
      claimerAddress
    } = body;
    
    // 验证必填参数
    if (!qrParams || !claimerUserId || !claimerUsername || !claimerAddress) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // 验证QR Code
    if (!verifyQRCode(qrParams)) {
      return NextResponse.json(
        { error: 'Invalid or expired QR code' },
        { status: 400 }
      );
    }
    
    const { user: sharerUserId, ref: partnerId, nft: sharerNFTId } = qrParams;
    
    // 获取分享者地址
    const sharerAddress = await nftRedis.getAddressByUserId(sharerUserId);
    if (!sharerAddress) {
      return NextResponse.json(
        { error: 'Invalid sharer' },
        { status: 400 }
      );
    }
    
    // 如果有partnerId，验证分享者是否拥有对应的NFT
    if (partnerId && partnerId !== 'default') {
      const partner = await getPartnerById(partnerId);
      if (!partner) {
        return NextResponse.json(
          { error: 'Invalid partner' },
          { status: 400 }
        );
      }
      
      // 检查分享者是否拥有该合作方NFT或是始祖
      const hasPartnerNFT = await nftRedis.hasPartnerClaimed(partnerId, sharerAddress);
      const isAncestor = await nftRedis.isAncestorHolder(sharerAddress, partnerId);
      
      if (!hasPartnerNFT && !isAncestor) {
        return NextResponse.json(
          { error: 'Sharer does not own this NFT type' },
          { status: 403 }
        );
      }
      
      // 检查扫描者是否已经拥有该合作方NFT
      const claimerHasNFT = await nftRedis.hasPartnerClaimed(partnerId, claimerAddress);
      if (claimerHasNFT) {
        return NextResponse.json({
          success: false,
          alreadyOwned: true,
          message: `你已经拥有 ${partner.nftName}`
        });
      }
      
      // 返回可以领取合作方NFT的信息
      return NextResponse.json({
        success: true,
        canClaim: true,
        nftType: 'partner',
        partnerId: partnerId,
        partnerName: partner.displayName,
        nftName: partner.nftName,
        sharerUserId: sharerUserId,
        sharerAddress: sharerAddress,
        sharerNFTId: sharerNFTId,
        isAncestorShare: isAncestor
      });
    } else {
      // 主NFT的分享
      const claimerHasNFT = await nftRedis.hasClaimed(claimerAddress);
      if (claimerHasNFT) {
        return NextResponse.json({
          success: false,
          alreadyOwned: true,
          message: '你已经拥有 Shit NFT'
        });
      }
      
      return NextResponse.json({
        success: true,
        canClaim: true,
        nftType: 'default',
        partnerId: 'default',
        nftName: 'Shit NFT',
        sharerUserId: sharerUserId,
        sharerAddress: sharerAddress
      });
    }
  } catch (error) {
    console.error('Error in qr-claim:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - 生成签名的QR Code URL
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const params: Record<string, string> = {};
    
    // 收集所有参数
    ['t', 'id', 'user', 'ref', 'nft'].forEach(key => {
      const value = url.searchParams.get(key);
      if (value) params[key] = value;
    });
    
    // 生成签名
    const dataString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
      
    const sig = crypto
      .createHmac('sha256', ENCRYPTION_KEY)
      .update(dataString)
      .digest('hex');
    
    // 构建完整URL
    const qrUrl = `https://shitx.top?${dataString}&sig=${sig}`;
    
    return NextResponse.json({
      url: qrUrl,
      expiresIn: QR_CODE_VALIDITY / 1000, // 秒
      params: { ...params, sig }
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}