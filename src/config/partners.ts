export interface Partner {
  id: string;
  name: string;
  displayName: string;
  nftName: string;
  description: string;
  contractAddress: string | null;
  totalSupply: number;
  deployed: boolean;
}

// 合作方清单
export const partners: Partner[] = [
  {
    id: 'adventurex',
    name: 'AdventureX',
    displayName: 'AdventureX 黑客松',
    nftName: 'Shit X AdventureX',
    description: '见证那个创造失眠的难忘夏天，中国有史以来最大的黑客松',
    contractAddress: null,
    totalSupply: 2000,
    deployed: false,
  },
  {
    id: 'injective',
    name: 'Injective',
    displayName: 'Injective',
    nftName: 'Shit X Injective',
    description: '在 Injective 上拉屎，Web3 的终极体验',
    contractAddress: null,
    totalSupply: 1500,
    deployed: false,
  },
  {
    id: 'claude',
    name: 'Claude',
    displayName: 'Claude AI',
    nftName: 'Shit X Claude',
    description: '由 AI 驱动的厕所革命，让拉屎更智能',
    contractAddress: null,
    totalSupply: 1000,
    deployed: false,
  },
  {
    id: 'doge',
    name: 'Doge',
    displayName: '狗狗币社区',
    nftName: 'Shit X Doge',
    description: 'Much shit, very toilet, wow',
    contractAddress: null,
    totalSupply: 3000,
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