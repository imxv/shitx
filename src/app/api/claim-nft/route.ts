import { NextRequest, NextResponse } from 'next/server';
import { nftRedis } from '@/lib/redis';
import { transferNFT, getNextAvailableTokenId, getMainWalletAddress } from '@/lib/injectiveNFT';
import { distributeSubsidy, hasClaimedSubsidy } from '@/lib/shitxCoin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, evmAddress, username, referrerUserId } = body;

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

    // 获取下一个可用的 tokenId
    const tokenId = await getNextAvailableTokenId();
    if (!tokenId) {
      return NextResponse.json(
        { error: 'No NFTs available for distribution' },
        { status: 503 }
      );
    }

    // 生成 NFT 数据
    const rarity = Math.random();
    let rarityTier = 'Common Toilet';
    if (rarity > 0.95) rarityTier = 'Legendary Golden Throne';
    else if (rarity > 0.85) rarityTier = 'Epic Diamond Toilet';
    else if (rarity > 0.70) rarityTier = 'Rare Silver Toilet';
    else if (rarity > 0.50) rarityTier = 'Uncommon Bronze Toilet';

    // 在 Injective 测试网上转移 NFT
    const transferResult = await transferNFT(evmAddress, tokenId);
    
    if (!transferResult.success) {
      return NextResponse.json(
        { error: `Failed to transfer NFT: ${transferResult.error}` },
        { status: 500 }
      );
    }

    const nft = {
      tokenId,
      owner: evmAddress,
      metadata: {
        name: `Shit NFT #${tokenId}`,
        description: `${username} 的专属厕所通行证。在那个创造失眠的难忘夏天，见证了中国有史以来最大的厕所革命。`,
        image: `https://shitx.top/api/nft-image/${tokenId}`,
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
      txHash: transferResult.txHash,
      chainId: 1439, // Injective testnet
      contractAddress: process.env.NEXT_PUBLIC_NFT_CONTRACT,
    };

    // 获取 referrer 的 EVM 地址（如果有）
    let referrerAddress: string | undefined;
    if (referrerUserId) {
      // 根据 referrerUserId 查找对应的地址
      const referrerEvmAddress = await nftRedis.getAddressByUserId(referrerUserId);
      if (referrerEvmAddress) {
        referrerAddress = referrerEvmAddress.toLowerCase();
      } else {
        // 如果找不到，使用管理员地址作为 referrer
        referrerAddress = getMainWalletAddress().toLowerCase();
      }
    }
    
    // 记录到 Redis（包含 referral 关系）
    await nftRedis.recordClaim(evmAddress.toLowerCase(), nft, referrerAddress);

    // 尝试发放 ShitX Coin 补贴
    let subsidyInfo = null;
    try {
      // 检查是否已经领取过补贴
      const hasClaimed = await hasClaimedSubsidy(evmAddress);
      if (!hasClaimed) {
        const subsidyResult = await distributeSubsidy(evmAddress);
        if (subsidyResult.success) {
          subsidyInfo = {
            amount: subsidyResult.amount,
            txHash: subsidyResult.txHash,
            message: `获得 ${subsidyResult.amount} SHIT 补贴！`
          };
        }
      }
    } catch (error) {
      console.error('Error distributing subsidy:', error);
      // 补贴分发失败不影响 NFT 领取
    }

    return NextResponse.json({
      success: true,
      nft,
      message: `恭喜获得 ${rarityTier}！`,
      txHash: transferResult.txHash,
      explorerUrl: `https://testnet.explorer.injective.network/transaction/${transferResult.txHash}`,
      subsidy: subsidyInfo
    });
  } catch (error) {
    console.error('Error in claim-nft:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 检查 NFT 合约状态
export async function GET() {
  try {
    const mainWallet = getMainWalletAddress();
    const totalClaims = await nftRedis.getTotalClaims();
    
    return NextResponse.json({
      mainWalletAddress: mainWallet,
      totalClaims,
      contractAddress: process.env.NEXT_PUBLIC_NFT_CONTRACT,
      network: 'Injective Testnet',
    });
  } catch (error) {
    console.error('Error checking status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}