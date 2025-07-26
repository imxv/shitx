import { NextRequest, NextResponse } from 'next/server';
import { nftRedis } from '@/lib/redis';
import { generateEVMAddress } from '@/utils/web3Utils';
import { partners } from '@/config/partners';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, fingerprint, userId, username } = body;
    
    // 验证必填参数
    if (!code || !fingerprint || !userId || !username) {
      return NextResponse.json(
        { error: 'Missing required parameters: code, fingerprint, userId, username' },
        { status: 400 }
      );
    }
    
    // 生成用户EVM地址
    const userAddress = generateEVMAddress(fingerprint).toLowerCase();
    
    // 使用始祖码
    const result = await nftRedis.useAncestorCode(code.trim(), userAddress);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    const ancestorData = result.data;
    const nftType = ancestorData.nftType;
    
    // 获取NFT类型信息
    let nftTypeInfo;
    if (nftType === 'default') {
      nftTypeInfo = {
        name: 'Shit NFT',
        displayName: 'ShitX'
      };
    } else {
      const partner = partners.find(p => p.id === nftType);
      nftTypeInfo = partner ? {
        name: partner.nftName,
        displayName: partner.displayName
      } : {
        name: `Unknown NFT Type: ${nftType}`,
        displayName: 'Unknown'
      };
    }
    
    // 创建始祖NFT数据
    const ancestorNFT = {
      tokenId: `ANCESTOR_${nftType}_${Date.now()}`,
      owner: userAddress,
      metadata: {
        name: `${nftTypeInfo.name} - 始祖`,
        description: `${username} 是 ${nftTypeInfo.displayName} NFT 的始祖持有者，拥有该类型NFT的分发权限。`,
        image: `https://api.dicebear.com/7.x/shapes/svg?seed=ancestor_${nftType}`,
        attributes: [
          {
            trait_type: 'Username',
            value: username,
          },
          {
            trait_type: 'User ID',
            value: userId,
          },
          {
            trait_type: 'Type',
            value: 'Ancestor NFT',
          },
          {
            trait_type: 'NFT Type',
            value: nftType,
          },
          {
            trait_type: 'Rarity',
            value: 'Ancestor (Unique)',
          },
          {
            trait_type: 'Claim Date',
            value: new Date().toLocaleDateString('zh-CN'),
          },
          {
            trait_type: 'Ancestor Code Used',
            value: code,
          },
        ],
      },
      claimedAt: Date.now(),
      isAncestor: true,
      nftType: nftType,
    };
    
    // 记录始祖NFT到对应的存储
    if (nftType === 'default') {
      // 如果是默认类型，存储到主NFT记录
      await nftRedis.recordClaim(userAddress, ancestorNFT);
    } else {
      // 如果是合作方NFT，存储到合作方NFT记录
      await nftRedis.recordPartnerClaim(nftType, userAddress, ancestorNFT);
    }
    
    return NextResponse.json({
      success: true,
      message: `恭喜！你已成为 ${nftTypeInfo.displayName} NFT 的始祖！`,
      nftType: nftType,
      nftTypeName: nftTypeInfo.name,
      ancestorNFT: ancestorNFT,
      ancestorData: ancestorData,
    });
  } catch (error) {
    console.error('Error using ancestor code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - 验证始祖码状态
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    
    if (!code) {
      return NextResponse.json(
        { error: 'Missing code parameter' },
        { status: 400 }
      );
    }
    
    const verification = await nftRedis.verifyAncestorCode(code);
    
    if (!verification.valid) {
      return NextResponse.json({
        valid: false,
        error: verification.error
      });
    }
    
    const ancestorData = verification.data;
    const nftType = ancestorData.nftType;
    
    // 获取NFT类型信息
    let nftTypeInfo;
    if (nftType === 'default') {
      nftTypeInfo = {
        name: 'Shit NFT',
        displayName: 'ShitX'
      };
    } else {
      const partner = partners.find(p => p.id === nftType);
      nftTypeInfo = partner ? {
        name: partner.nftName,
        displayName: partner.displayName
      } : {
        name: `Unknown NFT Type: ${nftType}`,
        displayName: 'Unknown'
      };
    }
    
    return NextResponse.json({
      valid: true,
      nftType: nftType,
      nftTypeName: nftTypeInfo.name,
      nftTypeDisplayName: nftTypeInfo.displayName,
      createdAt: ancestorData.createdAt,
    });
  } catch (error) {
    console.error('Error verifying ancestor code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}