import { ethers } from 'ethers';
import { nftRedis } from './redis';

// ERC721 ABI - 只包含我们需要的函数
const ERC721_ABI = [
  'function transferFrom(address from, address to, uint256 tokenId)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
];

// 从环境变量获取配置
const PRIVATE_KEY = process.env.INJECTIVE_PRIVATE_KEY!;
const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT!;
const RPC_URL = 'https://k8s.testnet.json-rpc.injective.network/';

// 创建 provider 和 signer
let provider: ethers.JsonRpcProvider;
let signer: ethers.Wallet;
let nftContract: ethers.Contract;

// 初始化连接
function initializeConnection() {
  if (!PRIVATE_KEY || !NFT_CONTRACT_ADDRESS) {
    throw new Error('Missing INJECTIVE_PRIVATE_KEY or NEXT_PUBLIC_NFT_CONTRACT environment variables');
  }

  provider = new ethers.JsonRpcProvider(RPC_URL);
  signer = new ethers.Wallet(PRIVATE_KEY, provider);
  nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, ERC721_ABI, signer);
}

// 获取主钱包地址
export function getMainWalletAddress(): string {
  if (!signer) initializeConnection();
  return signer.address;
}

// 获取可用的 token IDs（从主钱包）
export async function getAvailableTokenIds(): Promise<string[]> {
  try {
    if (!nftContract) initializeConnection();
    
    const balance = await nftContract.balanceOf(signer.address);
    const tokenIds: string[] = [];
    
    // 获取前 100 个 token（避免太多请求）
    const limit = Math.min(Number(balance), 100);
    for (let i = 0; i < limit; i++) {
      const tokenId = await nftContract.tokenOfOwnerByIndex(signer.address, i);
      tokenIds.push(tokenId.toString());
    }
    
    return tokenIds;
  } catch (error) {
    console.error('Error getting available token IDs:', error);
    return [];
  }
}

// 获取下一个可用的 tokenId
export async function getNextAvailableTokenId(): Promise<string | null> {
  try {
    if (!nftContract) initializeConnection();
    
    // 先从 Redis 获取已分配的 tokenIds
    const totalClaims = await nftRedis.getTotalClaims();
    
    // 假设 tokenId 从 1 开始递增
    const nextTokenId = (totalClaims + 1).toString();
    
    // 验证这个 tokenId 是否真的属于主钱包
    const owner = await nftContract.ownerOf(nextTokenId);
    if (owner.toLowerCase() === signer.address.toLowerCase()) {
      return nextTokenId;
    }
    
    // 如果不是，尝试获取实际可用的
    const availableIds = await getAvailableTokenIds();
    return availableIds[0] || null;
  } catch (error) {
    console.error('Error getting next available token ID:', error);
    return null;
  }
}

// 转移 NFT
export async function transferNFT(
  toAddress: string,
  tokenId: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    if (!nftContract) initializeConnection();
    
    console.log(`Transferring NFT #${tokenId} to ${toAddress}...`);
    
    // 发送交易
    const tx = await nftContract.transferFrom(
      signer.address,
      toAddress,
      tokenId
    );
    
    // 等待交易确认
    const receipt = await tx.wait();
    console.log(`NFT transferred successfully. TX: ${receipt.hash}`);
    
    return {
      success: true,
      txHash: receipt.hash,
    };
  } catch (error) {
    console.error('Error transferring NFT:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// 批量转移 NFT（给合作方使用）
export async function batchTransferNFT(
  transfers: Array<{ toAddress: string; tokenId: string }>
): Promise<Array<{ toAddress: string; tokenId: string; success: boolean; txHash?: string; error?: string }>> {
  const results = [];
  
  for (const transfer of transfers) {
    const result = await transferNFT(transfer.toAddress, transfer.tokenId);
    results.push({
      ...transfer,
      ...result,
    });
    
    // 添加延迟，避免 RPC 限制
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

// 检查 NFT 合约状态
export async function checkNFTContractStatus(): Promise<{
  contractAddress: string;
  mainWalletAddress: string;
  mainWalletBalance: string;
  totalSupply: string;
}> {
  try {
    if (!nftContract) initializeConnection();
    
    const [balance, totalSupply] = await Promise.all([
      nftContract.balanceOf(signer.address),
      nftContract.totalSupply(),
    ]);
    
    return {
      contractAddress: NFT_CONTRACT_ADDRESS,
      mainWalletAddress: signer.address,
      mainWalletBalance: balance.toString(),
      totalSupply: totalSupply.toString(),
    };
  } catch (error) {
    console.error('Error checking NFT contract status:', error);
    throw error;
  }
}