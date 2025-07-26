import { ethers } from 'ethers';

// Injective 测试网配置
const RPC_URL = 'https://k8s.testnet.json-rpc.injective.network/';
const SHITX_COIN_CONTRACT = process.env.NEXT_PUBLIC_SHITX_COIN_CONTRACT || '';

// ERC20 只读 ABI
const ERC20_READ_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function hasClaimedSubsidy(address) view returns (bool)',
  'function hasClaimedSubsidyFor(address) view returns (bool)'
];

// 检查是否已经领取过补贴（浏览器端）
export async function checkSubsidyStatus(address: string): Promise<{
  hasClaimed: boolean;
  balance: string;
}> {
  try {
    if (!SHITX_COIN_CONTRACT) {
      return { hasClaimed: false, balance: '0' };
    }
    
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(SHITX_COIN_CONTRACT, ERC20_READ_ABI, provider);
    
    const [hasClaimed, balance] = await Promise.all([
      contract.hasClaimedSubsidyFor(address),
      contract.balanceOf(address)
    ]);
    
    return {
      hasClaimed,
      balance: ethers.formatEther(balance)
    };
  } catch (error) {
    console.error('Error checking subsidy status:', error);
    return { hasClaimed: false, balance: '0' };
  }
}

// 获取代币信息（浏览器端）
export async function getTokenInfo() {
  try {
    if (!SHITX_COIN_CONTRACT) {
      return null;
    }
    
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(SHITX_COIN_CONTRACT, ERC20_READ_ABI, provider);
    
    const [name, symbol, decimals] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals()
    ]);
    
    return { name, symbol, decimals };
  } catch (error) {
    console.error('Error getting token info:', error);
    return null;
  }
}