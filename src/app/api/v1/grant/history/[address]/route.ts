import { NextRequest, NextResponse } from 'next/server';
import { nftRedis } from '@/lib/redis';
import { getPartnerById } from '@/lib/partnersService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const evmAddress = address.toLowerCase();
    
    // 获取收益历史记录
    const history = await nftRedis.getRewardHistory(evmAddress, 100);
    
    // 处理历史记录，添加更多信息
    const enrichedHistory = await Promise.all(history.map(async (record) => {
      let sourceInfo = null;
      let partnerInfo = null;
      
      // 获取合作方信息
      if (record.partnerId && record.partnerId !== 'default') {
        const partner = await getPartnerById(record.partnerId);
        partnerInfo = partner ? {
          id: partner.id,
          name: partner.displayName,
          nftName: partner.nftName
        } : null;
      }
      
      // 获取来源用户信息（推荐奖励）
      if (record.type === 'referral_reward' && record.sourceAddress) {
        // 尝试获取来源用户的NFT信息
        const sourceNFT = await nftRedis.getNFT(record.sourceAddress) as any;
        if (sourceNFT && sourceNFT.metadata?.attributes) {
          const usernameAttr = sourceNFT.metadata.attributes.find((a: any) => a.trait_type === 'Username');
          sourceInfo = {
            address: record.sourceAddress,
            displayAddress: `${record.sourceAddress.slice(0, 6)}...${record.sourceAddress.slice(-4)}`,
            username: usernameAttr?.value || '未知用户'
          };
        } else {
          sourceInfo = {
            address: record.sourceAddress,
            displayAddress: `${record.sourceAddress.slice(0, 6)}...${record.sourceAddress.slice(-4)}`,
            username: '未知用户'
          };
        }
      }
      
      return {
        ...record,
        partnerInfo,
        sourceInfo,
        formattedTime: new Date(record.timestamp).toLocaleString('zh-CN'),
        typeDisplay: record.type === 'referral_reward' 
          ? `${record.level}级推荐奖励` 
          : '直接领取补贴'
      };
    }));
    
    // 计算统计信息
    const stats = {
      totalRecords: enrichedHistory.length,
      totalDirectSubsidy: enrichedHistory
        .filter(r => r.type === 'direct_subsidy')
        .reduce((sum, r) => sum + r.amount, 0),
      totalReferralRewards: enrichedHistory
        .filter(r => r.type === 'referral_reward')
        .reduce((sum, r) => sum + r.amount, 0),
      level1Rewards: enrichedHistory
        .filter(r => r.type === 'referral_reward' && r.level === 1)
        .reduce((sum, r) => sum + r.amount, 0),
      level2Rewards: enrichedHistory
        .filter(r => r.type === 'referral_reward' && r.level === 2)
        .reduce((sum, r) => sum + r.amount, 0),
      level3Rewards: enrichedHistory
        .filter(r => r.type === 'referral_reward' && r.level === 3)
        .reduce((sum, r) => sum + r.amount, 0),
    };
    
    return NextResponse.json({
      address: evmAddress,
      history: enrichedHistory,
      stats
    });
  } catch (error) {
    console.error('Error getting grant history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}