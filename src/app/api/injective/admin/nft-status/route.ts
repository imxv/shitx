import { NextRequest, NextResponse } from 'next/server';
import { checkNFTContractStatus } from '@/lib/injectiveNFT';
import { partners } from '@/config/partners';
import { nftRedis } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    // 简单的权限检查
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== process.env.ADMIN_API_KEY && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 获取主 NFT 状态
    const mainStatus = await checkNFTContractStatus();
    
    // 获取 Redis 中的 claim 数据
    const mainNFTClaims = await nftRedis.getTotalClaims();

    // 获取各合作方的 claim 统计
    const partnerClaims: Record<string, number> = {};
    for (const partner of partners) {
      partnerClaims[partner.id] = await nftRedis.getPartnerTotalClaims(partner.id);
    }

    const nftStatuses = [
      {
        name: 'ShitX NFT (主系列)',
        contractAddress: mainStatus.contractAddress,
        totalSupply: parseInt(mainStatus.totalSupply),
        adminBalance: parseInt(mainStatus.mainWalletBalance),
        totalClaimed: mainNFTClaims,
        isDeployed: true,
      }
    ];

    // 添加合作方 NFT 状态
    for (const partner of partners) {
      if (partner.contractAddress) {
        // TODO: 从链上获取合作方 NFT 状态
        nftStatuses.push({
          name: partner.nftName,
          contractAddress: partner.contractAddress,
          totalSupply: partner.totalSupply,
          adminBalance: 0, // TODO: 从链上获取
          totalClaimed: partnerClaims[partner.id] || 0,
          isDeployed: true,
        });
      } else {
        nftStatuses.push({
          name: partner.nftName,
          contractAddress: '未部署',
          totalSupply: partner.totalSupply,
          adminBalance: 0,
          totalClaimed: 0,
          isDeployed: false,
        });
      }
    }

    return NextResponse.json({
      adminWallet: mainStatus.mainWalletAddress,
      nftStatuses,
      totalStats: {
        totalNFTs: nftStatuses.reduce((sum, nft) => sum + (nft.isDeployed ? nft.totalSupply : 0), 0),
        totalInventory: nftStatuses.reduce((sum, nft) => sum + nft.adminBalance, 0),
        totalDistributed: nftStatuses.reduce((sum, nft) => sum + nft.totalClaimed, 0),
      }
    });
  } catch (error) {
    console.error('Error getting NFT status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}