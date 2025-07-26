import { ethers } from 'ethers';

// Injective 测试网配置
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://k8s.testnet.json-rpc.injective.network/';
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const SHITX_COIN_CONTRACT = process.env.NEXT_PUBLIC_SHITX_COIN_CONTRACT!;

// ERC20 ABI
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function hasClaimedSubsidy(address) view returns (bool)',
  'function claimSubsidy() returns ()',
  'function batchDistributeSubsidy(address[] recipients, uint256[] amounts) returns ()',
  'event SubsidyClaimed(address indexed recipient, uint256 amount)',
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

// 获取合约实例
function getContract(signer?: ethers.Signer) {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const contractSigner = signer || new ethers.Wallet(PRIVATE_KEY, provider);
  return new ethers.Contract(SHITX_COIN_CONTRACT, ERC20_ABI, contractSigner);
}

// 检查是否已经领取过补贴
export async function hasClaimedSubsidy(address: string): Promise<boolean> {
  try {
    const contract = getContract();
    return await contract.hasClaimedSubsidy(address);
  } catch (error) {
    console.error('Error checking subsidy claim status:', error);
    return false;
  }
}

// 获取账户余额
export async function getBalance(address: string): Promise<string> {
  try {
    const contract = getContract();
    const balance = await contract.balanceOf(address);
    return ethers.utils.formatEther(balance);
  } catch (error) {
    console.error('Error getting balance:', error);
    return '0';
  }
}

// 为新用户发放补贴
export async function distributeSubsidy(recipientAddress: string): Promise<{
  success: boolean;
  amount?: string;
  txHash?: string;
  error?: string;
}> {
  try {
    const contract = getContract();
    
    // 检查是否已经领取过
    const hasClaimed = await contract.hasClaimedSubsidy(recipientAddress);
    if (hasClaimed) {
      return { success: false, error: 'Already claimed subsidy' };
    }
    
    // 生成随机补贴金额（1-5000 SHIT）
    const randomAmount = Math.floor(Math.random() * 5000) + 1;
    const amountWei = ethers.utils.parseEther(randomAmount.toString());
    
    // 批量发放（只有一个接收者）
    const tx = await contract.batchDistributeSubsidy([recipientAddress], [amountWei]);
    const receipt = await tx.wait();
    
    return {
      success: true,
      amount: randomAmount.toString(),
      txHash: receipt.transactionHash
    };
  } catch (error) {
    console.error('Error distributing subsidy:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to distribute subsidy'
    };
  }
}

// 获取代币信息
export async function getTokenInfo() {
  try {
    const contract = getContract();
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

// 主钱包地址
export function getMainWalletAddress(): string {
  const wallet = new ethers.Wallet(PRIVATE_KEY);
  return wallet.address;
}