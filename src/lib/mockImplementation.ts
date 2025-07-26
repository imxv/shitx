import { nftRedis } from './redis';
import { getPartnerById } from '@/lib/partnersService';

// 导出 nftRedis 以便其他模块使用
export { nftRedis };

// 模拟配置
const MOCK_CONFIG = {
  NFT: {
    TOTAL_SUPPLY: 10000,
    INITIAL_MINTED: 1000,
    MAIN_WALLET: '0xmock000000000000000000000000000000admin',
  },
  TOKEN: {
    DECIMALS: 18,
    SUBSIDY_MIN: 1000,
    SUBSIDY_MAX: 5000,
    INITIAL_SUPPLY: '10000000000', // 100亿
  }
};

// Redis 键前缀
const REDIS_KEYS = {
  BALANCE: 'mock:balance:',
  SUBSIDY: 'mock:subsidy:',
  NFT_OWNER: 'mock:nft:owner:',
  NFT_METADATA: 'mock:nft:metadata:',
  NEXT_TOKEN_ID: 'mock:nft:nextTokenId',
};

// ========== NFT 功能 ==========

export function getMainWalletAddress(): string {
  return MOCK_CONFIG.NFT.MAIN_WALLET;
}

export async function getNextAvailableTokenId(): Promise<string | null> {
  try {
    // 获取总领取数
    const totalClaims = await nftRedis.getTotalClaims() || 0;
    
    if (totalClaims >= MOCK_CONFIG.NFT.INITIAL_MINTED) {
      console.log(`[Mock] 没有可用的 NFT，已分发: ${totalClaims}/${MOCK_CONFIG.NFT.INITIAL_MINTED}`);
      return null;
    }
    
    // 返回下一个 token ID
    return (totalClaims + 1).toString();
  } catch (error) {
    console.error('[Mock] 获取下一个 Token ID 失败:', error);
    return null;
  }
}

export async function getAvailableTokenIds(): Promise<string[]> {
  try {
    const totalClaims = await nftRedis.getTotalClaims() || 0;
    const available = MOCK_CONFIG.NFT.INITIAL_MINTED - totalClaims;
    
    if (available <= 0) return [];
    
    const tokenIds: string[] = [];
    const start = totalClaims + 1;
    const end = Math.min(start + 99, MOCK_CONFIG.NFT.INITIAL_MINTED);
    
    for (let i = start; i <= end; i++) {
      tokenIds.push(i.toString());
    }
    
    return tokenIds;
  } catch (error) {
    console.error('[Mock] 获取可用 NFT 失败:', error);
    return [];
  }
}

export async function transferNFT(
  toAddress: string,
  tokenId: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    // 生成模拟交易哈希
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const txHash = `0xmock${timestamp}${random}`;
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
    
    console.log(`[Mock] 转移 NFT #${tokenId} 到 ${toAddress}, tx: ${txHash}`);
    
    return {
      success: true,
      txHash
    };
  } catch (error: any) {
    console.error('[Mock] NFT 转移失败:', error);
    return {
      success: false,
      error: error.message || 'Transfer failed'
    };
  }
}

export function getNFTMetadata(tokenId: string): any {
  const id = parseInt(tokenId);
  let rarity = 'Common Toilet';
  
  if (id <= 10) rarity = 'Legendary Golden Throne';
  else if (id <= 50) rarity = 'Epic Diamond Toilet';
  else if (id <= 150) rarity = 'Rare Silver Toilet';
  else if (id <= 300) rarity = 'Uncommon Bronze Toilet';
  
  return {
    name: `ShitX NFT #${tokenId}`,
    description: 'A unique ShitX NFT - Mock Version',
    image: `https://api.dicebear.com/7.x/shapes/svg?seed=${tokenId}`,
    attributes: [
      {
        trait_type: 'Rarity',
        value: rarity,
      },
      {
        trait_type: 'Type',
        value: 'Mock NFT',
      },
      {
        trait_type: 'Chain',
        value: 'Redis Mock',
      }
    ],
  };
}

export async function getPartnerNFTMetadata(partnerId: string, tokenId: string): Promise<any> {
  const partner = await getPartnerById(partnerId);
  if (!partner) {
    return getNFTMetadata(tokenId); // 回退到默认元数据
  }
  
  const id = parseInt(tokenId);
  let rarity = 'Common Toilet';
  
  // 合作方 NFT 稀有度分配可能不同
  if (id <= 5) rarity = 'Legendary Golden Throne';
  else if (id <= 25) rarity = 'Epic Diamond Toilet';
  else if (id <= 75) rarity = 'Rare Silver Toilet';
  else if (id <= 150) rarity = 'Uncommon Bronze Toilet';
  
  return {
    name: `${partner.nftName} #${tokenId}`,
    description: partner.description,
    image: `/api/v1/nft-image/${partnerId}/${tokenId}`,
    external_url: `https://shitx.top/nft/${partnerId}/${tokenId}`,
    attributes: [
      {
        trait_type: 'Rarity',
        value: rarity,
      },
      {
        trait_type: 'Partner',
        value: partner.displayName,
      },
      {
        trait_type: 'Collection',
        value: partner.nftName,
      },
      {
        trait_type: 'Type',
        value: 'Partner NFT',
      }
    ],
  };
}

// ========== Token 功能 ==========

export async function getBalance(address: string): Promise<string> {
  try {
    const balance = await nftRedis.get(`${REDIS_KEYS.BALANCE}${address}`);
    return balance || '0';
  } catch (error) {
    console.error('[Mock] 获取余额失败:', error);
    return '0';
  }
}

export async function setBalance(address: string, amount: string): Promise<void> {
  await nftRedis.set(`${REDIS_KEYS.BALANCE}${address}`, amount);
}

export async function hasClaimedSubsidy(address: string): Promise<boolean> {
  try {
    const claimed = await nftRedis.get(`${REDIS_KEYS.SUBSIDY}${address}`);
    return !!claimed;
  } catch (error) {
    console.error('[Mock] 检查补贴状态失败:', error);
    return false;
  }
}

export async function distributeSubsidy(
  recipient: string
): Promise<{ 
  success: boolean; 
  amount?: string; 
  txHash?: string; 
  error?: string 
}> {
  try {
    // 检查是否已领取
    const claimed = await hasClaimedSubsidy(recipient);
    if (claimed) {
      return {
        success: false,
        error: 'Subsidy already claimed',
      };
    }

    // 生成随机补贴金额
    const { SUBSIDY_MIN, SUBSIDY_MAX } = MOCK_CONFIG.TOKEN;
    const amount = Math.floor(Math.random() * (SUBSIDY_MAX - SUBSIDY_MIN + 1)) + SUBSIDY_MIN;
    
    // 获取当前余额并更新
    const currentBalance = await getBalance(recipient);
    const newBalance = (parseInt(currentBalance) + amount).toString();
    await setBalance(recipient, newBalance);
    
    // 生成模拟交易哈希
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const txHash = `0xmocktoken${timestamp}${random}`;
    
    // 记录补贴领取
    await nftRedis.set(`${REDIS_KEYS.SUBSIDY}${recipient}`, JSON.stringify({
      amount: amount.toString(),
      txHash,
      claimedAt: timestamp
    }));
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 100));
    
    console.log(`[Mock] 发放 ${amount} SHIT 补贴给 ${recipient}, tx: ${txHash}`);
    
    return {
      success: true,
      amount: amount.toString(),
      txHash,
    };
  } catch (error: any) {
    console.error('[Mock] 发放补贴失败:', error);
    return {
      success: false,
      error: error.message || 'Subsidy distribution failed',
    };
  }
}

// ========== 统计功能 ==========

export async function getNFTStats() {
  const totalClaims = await nftRedis.getTotalClaims() || 0;
  const available = Math.max(0, MOCK_CONFIG.NFT.INITIAL_MINTED - totalClaims);
  
  return {
    totalSupply: MOCK_CONFIG.NFT.TOTAL_SUPPLY,
    totalMinted: MOCK_CONFIG.NFT.INITIAL_MINTED,
    totalClaimed: totalClaims,
    available,
    percentageClaimed: ((totalClaims / MOCK_CONFIG.NFT.INITIAL_MINTED) * 100).toFixed(2)
  };
}

export async function getSubsidyStats() {
  try {
    const subsidyKeys = await nftRedis.keys(`${REDIS_KEYS.SUBSIDY}*`);
    let totalDistributed = 0;
    const totalRecipients = subsidyKeys.length;
    
    for (const key of subsidyKeys) {
      const data = await nftRedis.get(key);
      if (data) {
        const subsidy = JSON.parse(data);
        totalDistributed += parseInt(subsidy.amount);
      }
    }
    
    return {
      totalRecipients,
      totalDistributed,
      averageSubsidy: totalRecipients > 0 ? Math.floor(totalDistributed / totalRecipients) : 0,
      minSubsidy: MOCK_CONFIG.TOKEN.SUBSIDY_MIN,
      maxSubsidy: MOCK_CONFIG.TOKEN.SUBSIDY_MAX,
    };
  } catch (error) {
    console.error('[Mock] 获取补贴统计失败:', error);
    return {
      totalRecipients: 0,
      totalDistributed: 0,
      averageSubsidy: 0,
      minSubsidy: MOCK_CONFIG.TOKEN.SUBSIDY_MIN,
      maxSubsidy: MOCK_CONFIG.TOKEN.SUBSIDY_MAX,
    };
  }
}