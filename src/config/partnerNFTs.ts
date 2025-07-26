// 合作方 NFT 配置
export interface PartnerNFT {
  partnerId: string;
  partnerName: string;
  nftName: string;
  description: string;
  image: string;
  contractAddress?: string; // 如果是不同的合约
  maxSupply: number;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

// 合作方 NFT 列表
export const PARTNER_NFTS: Record<string, PartnerNFT> = {
  // ShitX 主 NFT（默认）
  default: {
    partnerId: 'default',
    partnerName: 'ShitX',
    nftName: 'Shit NFT',
    description: '专属厕所通行证。在那个创造失眠的难忘夏天，见证了中国有史以来最大的厕所革命。',
    image: 'https://shitx.top/api/nft-image/default',
    maxSupply: 8000,
    attributes: [
      {
        trait_type: 'Collection',
        value: 'ShitX Genesis'
      }
    ]
  },
  
  // 示例：黑客松合作方
  hackathon: {
    partnerId: 'hackathon',
    partnerName: '失眠黑客松',
    nftName: 'Sleepless Hacker NFT',
    description: '72小时不眠不休的见证。献给那些在马桶上写代码的勇士们。',
    image: 'https://shitx.top/api/nft-image/hackathon',
    maxSupply: 500,
    attributes: [
      {
        trait_type: 'Collection',
        value: 'Hackathon Heroes'
      },
      {
        trait_type: 'Special',
        value: '72 Hours No Sleep'
      }
    ]
  },
  
  // 示例：艺术家合作
  artist: {
    partnerId: 'artist',
    partnerName: '厕所艺术家',
    nftName: 'Toilet Art NFT',
    description: '将排泄升华为艺术。每一次冲水都是一次创作。',
    image: 'https://shitx.top/api/nft-image/artist',
    maxSupply: 300,
    attributes: [
      {
        trait_type: 'Collection',
        value: 'Toilet Art Gallery'
      },
      {
        trait_type: 'Artist',
        value: 'Anonymous Shitter'
      }
    ]
  },
  
  // 示例：游戏公会
  guild: {
    partnerId: 'guild',
    partnerName: '蹲坑公会',
    nftName: 'Guild Member NFT',
    description: '蹲坑公会正式成员证明。一起蹲，力量大。',
    image: 'https://shitx.top/api/nft-image/guild',
    maxSupply: 1000,
    attributes: [
      {
        trait_type: 'Collection',
        value: 'Squat Guild'
      },
      {
        trait_type: 'Rank',
        value: 'Elite Squatter'
      }
    ]
  }
};

// 获取用户可以 claim 的 NFT 列表
export function getClaimableNFTs(referralSource?: string): PartnerNFT[] {
  const claimable: PartnerNFT[] = [];
  
  // 默认的 ShitX NFT 所有人都可以领
  claimable.push(PARTNER_NFTS.default);
  
  // 如果有 referral，添加对应的合作方 NFT
  if (referralSource && PARTNER_NFTS[referralSource]) {
    claimable.push(PARTNER_NFTS[referralSource]);
  }
  
  return claimable;
}

// 检查是否可以领取特定的合作方 NFT
export function canClaimPartnerNFT(partnerId: string, referralSource?: string): boolean {
  // 默认 NFT 所有人都可以领
  if (partnerId === 'default') return true;
  
  // 其他 NFT 需要对应的 referral
  return referralSource === partnerId;
}