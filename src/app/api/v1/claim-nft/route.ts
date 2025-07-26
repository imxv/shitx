import { NextRequest, NextResponse } from 'next/server';
import { nftRedis } from '@/lib/redis';
import * as mock from '@/lib/mockImplementation';

// 推荐奖励配置
const REFERRAL_REWARDS = {
  LEVEL_1_RATE: 0.5,  // 50% 给直接推荐人
  LEVEL_2_RATE: 0.2,  // 20% 给二级推荐人
  LEVEL_3_RATE: 0.05, // 5% 给三级推荐人
};

// 分发推荐奖励
async function distributeReferralRewards(
  claimerAddress: string,
  subsidyAmount: number
): Promise<void> {
  try {
    // 获取推荐链
    const referralChain = await nftRedis.getReferralChain(claimerAddress, 3);
    
    if (referralChain.length === 0) return;
    
    // 分发奖励给各级推荐人
    const rewardRates = [REFERRAL_REWARDS.LEVEL_1_RATE, REFERRAL_REWARDS.LEVEL_2_RATE, REFERRAL_REWARDS.LEVEL_3_RATE];
    
    for (let i = 0; i < Math.min(referralChain.length, 3); i++) {
      const referrerAddress = referralChain[i];
      const rewardAmount = Math.floor(subsidyAmount * rewardRates[i]);
      
      if (rewardAmount > 0) {
        // 增加推荐人余额
        const currentBalance = await mock.getBalance(referrerAddress);
        const newBalance = (parseInt(currentBalance) + rewardAmount).toString();
        await mock.setBalance(referrerAddress, newBalance);
        
        // 记录奖励
        await nftRedis.recordReferralReward(
          referrerAddress,
          rewardAmount,
          i + 1,
          claimerAddress
        );
        
        console.log(`[Referral] Level ${i + 1} reward: ${rewardAmount} SHIT to ${referrerAddress}`);
      }
    }
  } catch (error) {
    console.error('Error distributing referral rewards:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, evmAddress: rawEvmAddress, username, fingerprint, referrerUserId } = body;
    
    // 验证必填参数
    if (!userId || !username) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId, username' },
        { status: 400 }
      );
    }
    
    // 生成或使用提供的地址
    const evmAddress = rawEvmAddress?.toLowerCase() || 
                      `0x${fingerprint?.substring(0, 40).padEnd(40, '0')}`.toLowerCase();

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
    const tokenId = await mock.getNextAvailableTokenId();
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

    // 模拟 NFT 转移
    const transferResult = await mock.transferNFT(evmAddress, tokenId);
    
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
        image: `https://api.dicebear.com/7.x/shapes/svg?seed=${tokenId}`,
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
          {
            trait_type: 'Type',
            value: 'Mock NFT',
          },
        ],
      },
      claimedAt: Date.now(),
      txHash: transferResult.txHash,
      mockData: true, // 标记为模拟数据
    };

    // 获取 referrer 的地址（如果有）
    let referrerAddress: string | undefined;
    if (referrerUserId) {
      const referrerEvmAddress = await nftRedis.getAddressByUserId(referrerUserId);
      if (referrerEvmAddress) {
        referrerAddress = referrerEvmAddress.toLowerCase();
      } else {
        referrerAddress = mock.getMainWalletAddress().toLowerCase();
      }
    }
    
    // 记录到 Redis
    await nftRedis.recordClaim(evmAddress, nft, referrerAddress);

    // 尝试发放 SHIT 补贴
    let subsidyInfo = null;
    try {
      const alreadyClaimed = await mock.hasClaimedSubsidy(evmAddress);
      if (!alreadyClaimed) {
        const subsidyResult = await mock.distributeSubsidy(evmAddress);
        if (subsidyResult.success) {
          subsidyInfo = {
            amount: subsidyResult.amount,
            txHash: subsidyResult.txHash,
            message: `获得 ${subsidyResult.amount} SHIT 补贴！`
          };
          
          // 分发推荐奖励
          if (referrerAddress) {
            await distributeReferralRewards(evmAddress, parseInt(subsidyResult.amount));
          }
        }
      }
    } catch (error) {
      console.error('Error distributing subsidy:', error);
    }

    // 获取最新余额
    const balance = await mock.getBalance(evmAddress);

    return NextResponse.json({
      success: true,
      nft,
      message: `恭喜获得 ${rarityTier}！`,
      txHash: transferResult.txHash,
      mockExplorerUrl: `/api/v1/tx/${transferResult.txHash}`, // 模拟浏览器链接
      subsidy: subsidyInfo,
      balance,
      implementation: 'mock', // 标明使用的是模拟实现
    });
  } catch (error) {
    console.error('Error in v1 claim-nft:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - 检查 NFT 状态
export async function GET() {
  try {
    const mainWallet = mock.getMainWalletAddress();
    const totalClaims = await nftRedis.getTotalClaims();
    const stats = await mock.getNFTStats();
    const subsidyStats = await mock.getSubsidyStats();
    
    return NextResponse.json({
      implementation: 'mock',
      mainWalletAddress: mainWallet,
      totalClaims,
      nftStats: stats,
      subsidyStats,
      message: 'Using Redis mock implementation for faster testing',
    });
  } catch (error) {
    console.error('Error checking status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}