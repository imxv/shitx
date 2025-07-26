export interface Partner {
  id: string;
  name: string;
  displayName: string;
  nftName: string;
  description: string;
  logo?: string; // 合作方 logo 文件名
  website?: string; // 合作方官网链接
  contractAddress: string | null;
  totalSupply: number;
  deployed: boolean;
}

// 合作方清单
export const partners: Partner[] = [
  
  {
    id: 'djteddy',
    name: 'DJ Teddy',
    displayName: 'DJ Teddy',
    nftName: 'Shit X DJ Teddy',
    description: '你的AI视觉骑士 (Your Personal AI Visual Jockey)',
    logo: 'teddy.png',
    contractAddress: null,
    totalSupply: 2000,
    deployed: false,
  },

  {
    id: 'snakemaster',
    name: 'Snake Master',
    displayName: 'SnakeMaster',
    nftName: 'Shit X Snake Master',
    description: '过去懂蛇才养蛇，现在不懂也能养，还安全',
    logo:"snake.png",
    contractAddress: null,
    totalSupply: 1500,
    deployed: false,
  },{
    id: 'twila',
    name: 'Twila',
    displayName: 'Twila',
    nftName: 'Shit X Twila',
    description: '我的房里有很多蟑螂，我身边的舟批没有很多',
    logo:"twila.png",
    contractAddress: null,
    totalSupply: 1500,
    deployed: false,
  },  {
    id: 'wanderpaw',
    name: 'WanderPaw',
    displayName: 'WanderPaw',
    logo:'wanderpaw.png',
    nftName: 'Shit X WanderPaw',
    description: '让灵魂先行，肉身随后跟上',
    website: 'https://wanderpaw.cn',
    contractAddress: null,
    totalSupply: 1000,
    deployed: false,
  },
  {
    id: 'shitx',
    name: 'ShitX',
    displayName: 'ShitX 的献身',
    nftName: 'ShitX 创世 NFT',
    description: '所以到底是谁拉的',
    website: '/game',
    contractAddress: null,
    totalSupply: 10000,
    deployed: true,
  },
  {
    id: 'echoesofus',
    name: 'Echoes of Us',
    displayName: 'Echoes of Us',
    nftName: 'Shit X Echoes of Us',
    description: '「我们的回响」，让记忆再次发出原本的声音',
    logo:'echoesofus.png',
    website: 'https://advx-project.pages.dev',
    contractAddress: null,
    totalSupply: 1000,
    deployed: false,
  },
];

// 获取已部署的合作方
export function getDeployedPartners(): Partner[] {
  return partners.filter(p => p.deployed && p.contractAddress);
}

// 获取未部署的合作方
export function getUndeployedPartners(): Partner[] {
  return partners.filter(p => !p.deployed || !p.contractAddress);
}

// 根据 ID 获取合作方
export function getPartnerById(id: string): Partner | undefined {
  return partners.find(p => p.id === id);
}

// 更新合作方合约地址
export function updatePartnerContract(id: string, contractAddress: string): void {
  const partner = partners.find(p => p.id === id);
  if (partner) {
    partner.contractAddress = contractAddress;
    partner.deployed = true;
  }
}