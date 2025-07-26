// 使用 v1 mock API 实现

// 检查是否已经领取过补贴（浏览器端）
export async function checkSubsidyStatus(address: string): Promise<{
  hasClaimed: boolean;
  balance: string;
}> {
  try {
    const response = await fetch(`/api/v1/grant/${address}`);
    const data = await response.json();
    
    return {
      hasClaimed: data.hasClaimedSubsidy || false,
      balance: data.balance || '0'
    };
  } catch (error) {
    console.error('Error checking subsidy status:', error);
    return { hasClaimed: false, balance: '0' };
  }
}

// 获取代币信息（浏览器端）
export async function getTokenInfo() {
  // Mock 实现返回固定的代币信息
  return {
    name: 'ShitX Coin',
    symbol: 'SHIT',
    decimals: 18
  };
}