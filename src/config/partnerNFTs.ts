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
  
  // DJ Teddy 合作方
  djteddy: {
    partnerId: 'djteddy',
    partnerName: 'DJ Teddy',
    nftName: 'Shit X DJ Teddy',
    description: '你的AI视觉骑士 (Your Personal AI Visual Jockey)',
    image: 'https://shitx.top/api/nft-image/djteddy',
    maxSupply: 2000,
    attributes: [
      {
        trait_type: 'Collection',
        value: 'DJ Teddy Collection'
      },
      {
        trait_type: 'Partner',
        value: 'DJ Teddy'
      }
    ]
  },
  
  // Snake Master 养蛇大师合作方
  snakemaster: {
    partnerId: 'snakemaster',
    partnerName: '养蛇大师',
    nftName: 'Shit X Snake Master',
    description: '过去懂蛇才养蛇，有了这个项目，不懂也能养，还安全',
    image: 'https://shitx.top/api/nft-image/snakemaster',
    maxSupply: 1500,
    attributes: [
      {
        trait_type: 'Collection',
        value: 'Snake Master Collection'
      },
      {
        trait_type: 'Partner',
        value: '养蛇大师'
      },
      {
        trait_type: 'Special',
        value: '安全养蛇认证'
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