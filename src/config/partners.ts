export interface Partner {
  id: string;
  name: string;
  displayName: string;
  nftName: string;
  description: string;
  logo?: string; // 合作方 logo 文件名
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