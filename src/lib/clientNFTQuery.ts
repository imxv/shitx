import { ethers } from 'ethers';

// ERC721 ABI - 只读函数
const ERC721_READ_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
];

const RPC_URL = 'https://k8s.testnet.json-rpc.injective.network/';

// 浏览器端查询 NFT 状态（只读，不需要私钥）
export async function queryNFTStatus(contractAddress: string, walletAddress: string) {
  try {
    // 创建只读 provider
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(contractAddress, ERC721_READ_ABI, provider);
    
    // 并行查询
    const [totalSupply, balance] = await Promise.all([
      contract.totalSupply(),
      contract.balanceOf(walletAddress),
    ]);
    
    return {
      success: true,
      totalSupply: totalSupply.toString(),
      balance: balance.toString(),
    };
  } catch (error) {
    console.error('Error querying NFT status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      totalSupply: '0',
      balance: '0',
    };
  }
}

// 批量查询多个 NFT 合约
export async function batchQueryNFTStatus(
  contracts: Array<{ address: string; walletAddress: string }>
) {
  const results = await Promise.all(
    contracts.map(({ address, walletAddress }) => 
      queryNFTStatus(address, walletAddress)
    )
  );
  return results;
}