'use client';

import { useState, useEffect } from 'react';
import { getUserIdentity } from '@/utils/userIdentity';
import { generateEVMAddress } from '@/utils/web3Utils';
import { checkSubsidyStatus } from '@/lib/clientShitxCoin';

export function ShitXBalance() {
  const [balance, setBalance] = useState<string>('0');
  const [hasClaimed, setHasClaimed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    checkBalance();
    // 每30秒刷新一次余额
    const interval = setInterval(checkBalance, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const checkBalance = async () => {
    try {
      const identity = getUserIdentity();
      const address = generateEVMAddress(identity.fingerprint);
      const status = await checkSubsidyStatus(address);
      
      setBalance(status.balance);
      setHasClaimed(status.hasClaimed);
    } catch (error) {
      console.error('Error checking balance:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-gray-900/90 backdrop-blur-sm border border-yellow-500/50 rounded-lg px-4 py-2 shadow-lg">
          <div className="animate-pulse text-gray-400">加载中...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-gray-900/90 backdrop-blur-sm border border-yellow-500/50 rounded-lg px-4 py-2 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💰</span>
          <div>
            <div className="text-yellow-400 font-bold">
              {parseFloat(balance).toLocaleString()} SHIT
            </div>
            {hasClaimed && (
              <div className="text-xs text-gray-400">Shit补贴已领取</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}