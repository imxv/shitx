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
}

// API 配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Claim NFT
export async function claimShitNFT(userIdentity: {
  id: string;
  fingerprint: string;
  username: string;
}): Promise<{ success: boolean; nft?: ShitNFT; error?: string }> {
  try {
    const evmAddress = generateEVMAddress(userIdentity.fingerprint);
    
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
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to claim NFT');
    }

    return { success: true, nft: data.nft };
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

// Injective 链配置
export const INJECTIVE_CONFIG = {
  chainId: '0x1', // Injective mainnet
  chainName: 'Injective',
  nativeCurrency: {
    name: 'INJ',
    symbol: 'INJ',
    decimals: 18,
  },
  rpcUrls: ['https://injective-rpc.publicnode.com'],
  blockExplorerUrls: ['https://explorer.injective.network'],
};

// NFT 合约地址（需要部署后填入）
export const SHIT_NFT_CONTRACT = process.env.NEXT_PUBLIC_NFT_CONTRACT || '';