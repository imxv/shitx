import { NextRequest, NextResponse } from 'next/server';
import { nftRedis } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, evmAddress, username } = body;

    // 检查是否已经 claim 过
    const hasClaimed = await nftRedis.hasClaimed(evmAddress);
    if (hasClaimed) {
      const existingNFT = await nftRedis.getNFT(evmAddress);
      return NextResponse.json(
        { 
          error: 'NFT already claimed for this address',
          nft: existingNFT 
        },
        { status: 400 }
      );
    }

    // 获取当前总 claim 数作为 tokenId
    const totalClaims = await nftRedis.getTotalClaims();
    const tokenId = (totalClaims + 1).toString();

    // 生成 NFT 数据
    const rarity = Math.random();
    let rarityTier = 'Common Toilet';
    if (rarity > 0.95) rarityTier = 'Legendary Golden Throne';
    else if (rarity > 0.85) rarityTier = 'Epic Diamond Toilet';
    else if (rarity > 0.70) rarityTier = 'Rare Silver Toilet';
    else if (rarity > 0.50) rarityTier = 'Uncommon Bronze Toilet';

    const nft = {
      tokenId,
      owner: evmAddress,
      metadata: {
        name: `Shit NFT #${tokenId}`,
        description: `${username} 的专属厕所通行证。在那个创造失眠的难忘夏天，见证了中国有史以来最大的厕所革命。`,
        image: `https://shitx.top/api/nft-image/${tokenId}`, // 动态生成的图片
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
            trait_type: 'Rarity',
            value: rarityTier,
          },
          {
            trait_type: 'Claim Date',
            value: new Date().toLocaleDateString('zh-CN'),
          },
          {
            trait_type: 'Claim Time',
            value: new Date().toLocaleTimeString('zh-CN'),
          },
          {
            trait_type: 'Serial Number',
            value: parseInt(tokenId),
          },
        ],
      },
      claimedAt: Date.now(),
      txHash: `0x${Buffer.from(`shitx_${tokenId}_${Date.now()}`).toString('hex')}`, // 模拟交易哈希
    };

    // 记录到 Redis
    await nftRedis.recordClaim(evmAddress, nft);

    // TODO: 实际实现中这里应该调用 Injective 链上的合约来 mint NFT

    return NextResponse.json({
      success: true,
      nft,
      message: `恭喜获得 ${rarityTier}！`,
      totalClaims: totalClaims + 1,
    });
  } catch (error) {
    console.error('Error in claim-nft:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 检查 NFT 状态的 GET 端点
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const address = url.searchParams.get('address');

  if (!address) {
    return NextResponse.json(
      { error: 'Address parameter required' },
      { status: 400 }
    );
  }

  const hasClaimed = await nftRedis.hasClaimed(address);
  const nft = hasClaimed ? await nftRedis.getNFT(address) : null;
  const totalClaims = await nftRedis.getTotalClaims();

  return NextResponse.json({
    hasClaimed,
    nft,
    address,
    totalClaims,
  });
}