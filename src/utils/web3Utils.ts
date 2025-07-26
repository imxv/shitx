import { ethers } from 'ethers';

// 从用户指纹生成确定性的 EVM 地址
export function generateEVMAddress(fingerprint: string): string {
  // 使用指纹作为种子创建确定性的私钥
  // 注意：这只是演示用途，实际使用中不应该这样生成私钥
  const hash = ethers.keccak256(ethers.toUtf8Bytes(`shitx_${fingerprint}_toilet`));
  const wallet = new ethers.Wallet(hash);
  return wallet.address;
}

// NFT 相关接口
export interface ShitNFT {
  tokenId: string;
  owner: string;
  metadata: {
    name: string;
    description: string;
    image: string;
    attributes: Array<{
      trait_type: string;
      value: string | number;
    }>;
  };
  claimedAt: number;
  txHash?: string;
  chainId?: number;
  contractAddress?: string;
}

// API 配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

// Claim NFT
export async function claimShitNFT(userIdentity: {
  id: string;
  fingerprint: string;
  username: string;
}, partnerId: string = 'default'): Promise<{ 
  success: boolean; 
  nft?: ShitNFT; 
  error?: string;
  subsidy?: {
    amount: string;
    txHash: string;
    message: string;
  };
}> {
  try {
    const evmAddress = generateEVMAddress(userIdentity.fingerprint);
    
    // 获取分享者信息
    const referrerUserId = typeof window !== 'undefined' ? sessionStorage.getItem('referrerUserId') : null;
    
    const response = await fetch(`${API_BASE_URL}/claim-nft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userIdentity.id,
        evmAddress,
        username: userIdentity.username,
        fingerprint: userIdentity.fingerprint,
        partnerId,
        referrerUserId,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to claim NFT');
    }

    return { 
      success: true, 
      nft: data.nft,
      subsidy: data.subsidy 
    };
  } catch (error) {
    console.error('Error claiming NFT:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// 检查是否已经 claim 过
export async function checkNFTStatus(fingerprint: string): Promise<{
  hasClaimed: boolean;
  nft?: ShitNFT;
}> {
  try {
    const evmAddress = generateEVMAddress(fingerprint);
    
    const response = await fetch(`${API_BASE_URL}/nft-status/${evmAddress}`);
    const data = await response.json();
    
    return {
      hasClaimed: data.hasClaimed || false,
      nft: data.nft,
    };
  } catch (error) {
    console.error('Error checking NFT status:', error);
    return { hasClaimed: false };
  }
}

// Injective 测试网配置
export const INJECTIVE_TESTNET_CONFIG = {
  chainId: '0x59f', // 1439 in hex (Injective testnet)
  chainName: 'Injective Testnet',
  nativeCurrency: {
    name: 'INJ',
    symbol: 'INJ',
    decimals: 18,
  },
  rpcUrls: ['https://k8s.testnet.json-rpc.injective.network/'],
  blockExplorerUrls: ['https://testnet.explorer.injective.network'],
};

// NFT 合约地址（需要部署后填入）
export const SHIT_NFT_CONTRACT = process.env.NEXT_PUBLIC_NFT_CONTRACT || '';