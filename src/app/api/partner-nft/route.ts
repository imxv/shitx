import { NextRequest, NextResponse } from 'next/server';
import { nftRedis } from '@/lib/redis';
import { batchTransferNFT, getAvailableTokenIds } from '@/lib/injectiveNFT';

// 合作方地址列表（可以从环境变量或数据库读取）
const PARTNER_ADDRESSES = process.env.PARTNER_ADDRESSES?.split(',') || [];

export async function POST(request: NextRequest) {
  try {
    // 验证请求来源（简单的 API key 验证）
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { partners } = body; // [{ address: string, name: string }]

    // 获取可用的 tokenIds
    const availableTokenIds = await getAvailableTokenIds();
    
    if (availableTokenIds.length < partners.length) {
      return NextResponse.json(
        { error: `Not enough NFTs available. Need ${partners.length}, have ${availableTokenIds.length}` },
        { status: 400 }
      );
    }

    // 准备转账数据
    const transfers = partners.map((partner: { address: string; name: string }, index: number) => ({
      toAddress: partner.address,
      tokenId: availableTokenIds[index],
    }));

    // 批量转账
    const results = await batchTransferNFT(transfers);

    // 记录到 Redis
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const partner = partners[i];
      
      if (result.success) {
        const nft = {
          tokenId: result.tokenId,
          owner: result.toAddress,
          metadata: {
            name: `Shit NFT #${result.tokenId}`,
            description: `${partner.name} 的合作方专属厕所通行证。感谢在那个难忘的夏天一起创造历史。`,
            image: `https://shitx.top/api/nft-image/${result.tokenId}`,
            attributes: [
              {
                trait_type: 'Type',
                value: 'Partner NFT',
              },
              {
                trait_type: 'Partner Name',
                value: partner.name,
              },
              {
                trait_type: 'Rarity',
                value: 'Legendary Partner Edition',
              },
              {
                trait_type: 'Issue Date',
                value: new Date().toLocaleDateString('zh-CN'),
              },
            ],
          },
          claimedAt: Date.now(),
          txHash: result.txHash,
          chainId: 6126,
          contractAddress: process.env.NEXT_PUBLIC_NFT_CONTRACT,
          isPartner: true,
        };

        await nftRedis.recordClaim(result.toAddress, nft);
      }
    }

    // 返回结果
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Successfully transferred ${successful} NFTs, ${failed} failed`,
      results,
      explorerBaseUrl: 'https://testnet.explorer.injective.network/transaction/',
    });
  } catch (error) {
    console.error('Error in partner-nft:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - 获取合作方 NFT 发放记录
export async function GET(request: NextRequest) {
  // 验证请求
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // TODO: 从 Redis 获取合作方 NFT 记录
  return NextResponse.json({
    partners: PARTNER_ADDRESSES,
    message: 'Partner NFT distribution endpoint',
  });
}