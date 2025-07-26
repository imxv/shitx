export interface Partner {
  id: string;
  name: string;
  displayName: string;
  nftName: string;
  description: string;
  longDescription?:string;
  logo?: string; // 合作方 logo 文件名
  website?: string; // 合作方官网链接
  contractAddress: string | null;
  totalSupply: number;
  deployed: boolean;
}

// 本地静态合作方清单
export const localPartners: Partner[] = [
  
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
    nftName: 'ShitX OG NFT',
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
  {
    id: 'starsAmongUs',
    name: 'Stars Among Us',
    displayName: '人间星辰',
    nftName: 'Shit X 人间星辰',
    description: '在聆听后，你可以留下跨越时空的回应，也可以记录下此刻真实的memory。',
    longDescription:"人生中失败多于成功，伴随的伤痛却常无处安放，更鲜有人教导我们如何面对与转化它。我们相信，当个体能通过真实分享失败经历获得深刻共鸣时，便能更快走出阴霾，重拾勇气。这并非简单的倾诉，而是通过富含情感的真人音频故事，让用户沉浸于他人真挚的叙述。在聆听后，你可以留下跨越时空的回应，也可以记录下此刻真实的memory。",
    logo: 'starsAmongUs.png',
    contractAddress: null,
    totalSupply: 1000,
    deployed: false,
  },
  {
    id: 'cyberTwinTails',
    name: 'Cyber Twin Tails',
    displayName: '赛博双马尾',
    nftName: 'Shit X 赛博双马尾',
    description: '飞起来的时候感觉天都塌了',
    logo: 'cyberTwinTails.png',
    contractAddress: null,
    totalSupply: 1000,
    deployed: false,
  },
  
];

// 云端合作方将通过 partnersService 从 Redis 获取
// 统一的 partners 导出在使用时通过 partnersService 获取

// 这些函数已移至 partnersService.ts
// 注意：这些函数只能在服务端使用
// 客户端应该使用 usePartners hook

// 更新合作方合约地址
export function updatePartnerContract(id: string, contractAddress: string): void {
  const partner = localPartners.find(p => p.id === id);
  if (partner) {
    partner.contractAddress = contractAddress;
    partner.deployed = true;
  }
}