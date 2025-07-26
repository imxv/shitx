import { NextRequest, NextResponse } from 'next/server';
import { nftRedis } from '@/lib/redis';
import * as mock from '@/lib/mockImplementation';
import { getPartnerById } from '@/config/partners';

// 推荐奖励配置
const REFERRAL_REWARDS = {
  SUBSIDY_MIN: 1,
  SUBSIDY_MAX: 5000,
  LEVEL_1_RATE: 0.5,  // 50% 给直接推荐人
  LEVEL_2_RATE: 0.2,  // 20% 给二级推荐人
  LEVEL_3_RATE: 0.05, // 5% 给三级推荐人
};

// 分发推荐奖励
async function distributeReferralRewards(
  claimerAddress: string,
  baseAmount: number,
  partnerId?: string
): Promise<void> {
  try {
    // 获取推荐链
    const referralChain = await nftRedis.getReferralChain(claimerAddress, 3);
    
    if (referralChain.length === 0) return;
    
    // 分发奖励给各级推荐人
    const rewardRates = [REFERRAL_REWARDS.LEVEL_1_RATE, REFERRAL_REWARDS.LEVEL_2_RATE, REFERRAL_REWARDS.LEVEL_3_RATE];
    
    for (let i = 0; i < Math.min(referralChain.length, 3); i++) {
      const referrerAddress = referralChain[i];
      const rewardAmount = Math.floor(baseAmount * rewardRates[i]);
      
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
          claimerAddress,
          partnerId
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
    const { 
      userId, 
      evmAddress: rawEvmAddress, 
      username, 
      fingerprint, 
      partnerId,
      referrerNFTId 
    } = body;
    
    // 验证必填参数
    if (!userId || !username || !partnerId) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId, username, partnerId' },
        { status: 400 }
      );
    }
    
    // 验证合作方
    const partner = getPartnerById(partnerId);
    if (!partner) {
      return NextResponse.json(
        { error: 'Invalid partner ID' },
        { status: 400 }
      );
    }
    
    // 生成或使用提供的地址
    const evmAddress = rawEvmAddress?.toLowerCase() || 
                      `0x${fingerprint?.substring(0, 40).padEnd(40, '0')}`.toLowerCase();

    // 检查是否已经 claim 过该合作方NFT
    const hasClaimed = await nftRedis.hasPartnerClaimed(partnerId, evmAddress);
    if (hasClaimed) {
      const existingNFT = await nftRedis.getPartnerNFT(partnerId, evmAddress);
      return NextResponse.json(
        { 
          error: 'Partner NFT already claimed for this address',
          nft: existingNFT 
        },
        { status: 400 }
      );
    }
    
    // 获取下一个可用的 tokenId
    const totalClaims = await nftRedis.getPartnerTotalClaims(partnerId);
    if (totalClaims >= partner.totalSupply) {
      return NextResponse.json(
        { error: 'No partner NFTs available for distribution' },
        { status: 503 }
      );
    }
    
    const tokenId = (totalClaims + 1).toString();

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
      partnerId,
      metadata: mock.getPartnerNFTMetadata(partnerId, tokenId),
      claimedAt: Date.now(),
      txHash: transferResult.txHash,
      mockData: true,
    };
    
    // 记录到 Redis
    await nftRedis.recordPartnerClaim(partnerId, evmAddress, nft);
    
    // 记录推荐关系（如果有）
    if (referrerNFTId) {
      await nftRedis.recordPartnerReferral(partnerId, evmAddress, referrerNFTId);
    }
    
    // 获取推荐人地址（通过主NFT的推荐关系）
    const referrerAddress = await nftRedis.getReferrer(evmAddress);
    
    // 生成随机补贴金额
    const subsidyAmount = Math.floor(
      Math.random() * (REFERRAL_REWARDS.SUBSIDY_MAX - REFERRAL_REWARDS.SUBSIDY_MIN + 1)
    ) + REFERRAL_REWARDS.SUBSIDY_MIN;
    
    // 发放补贴给领取者
    let subsidyInfo = null;
    const currentBalance = await mock.getBalance(evmAddress);
    const newBalance = (parseInt(currentBalance) + subsidyAmount).toString();
    await mock.setBalance(evmAddress, newBalance);
    
    subsidyInfo = {
      amount: subsidyAmount.toString(),
      message: `获得 ${subsidyAmount} SHIT 补贴！`
    };
    
    // 分发推荐奖励
    if (referrerAddress) {
      await distributeReferralRewards(evmAddress, subsidyAmount, partnerId);
    }
    
    // 获取最新余额
    const finalBalance = await mock.getBalance(evmAddress);

    return NextResponse.json({
      success: true,
      nft,
      message: `恭喜获得 ${partner.nftName} - ${rarityTier}！`,
      txHash: transferResult.txHash,
      mockExplorerUrl: `/api/v1/tx/${transferResult.txHash}`,
      subsidy: subsidyInfo,
      balance: finalBalance,
      implementation: 'mock',
    });
  } catch (error) {
    console.error('Error in claim-partner-nft:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// setBalance 助手函数（内部使用）
async function setBalance(address: string, amount: string): Promise<void> {
  await nftRedis.set(`mock:balance:${address}`, amount);
}