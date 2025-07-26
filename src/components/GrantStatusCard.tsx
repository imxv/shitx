'use client';

import { useState, useEffect } from 'react';
import { getUserIdentity } from '@/utils/userIdentity';
import { generateEVMAddress } from '@/utils/web3Utils';
import Link from 'next/link';

interface GrantInfo {
  balance: string;
  hasClaimedSubsidy: boolean;
  subsidyAmount?: string;
}

export function GrantStatusCard() {
  const [grantInfo, setGrantInfo] = useState<GrantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchGrantInfo();
  }, []);
  
  const fetchGrantInfo = async () => {
    try {
      const identity = getUserIdentity();
      const address = generateEVMAddress(identity.fingerprint);
      
      const response = await fetch(`/api/v1/grant/${address}`);
      const data = await response.json();
      
      setGrantInfo({
        balance: data.balance || '0',
        hasClaimedSubsidy: data.hasClaimedSubsidy || false,
        subsidyAmount: data.subsidyAmount
      });
    } catch (error) {
      console.error('Error fetching grant info:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-32 mb-2"></div>
        <div className="h-8 bg-gray-700 rounded w-48"></div>
      </div>
    );
  }
  
  if (!grantInfo) return null;
  
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/30 shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm text-gray-400 mb-1">SHITX Grant 状态</h3>
          {grantInfo.hasClaimedSubsidy ? (
            <div>
              <p className="text-2xl font-bold text-yellow-400">
                {parseFloat(grantInfo.balance).toLocaleString()} SHIT
              </p>
              <p className="text-sm text-green-400 mt-1">
                ✅ 已领取 {grantInfo.subsidyAmount} SHIT 补贴
              </p>
            </div>
          ) : (
            <div>
              <p className="text-lg text-gray-300">未领取补贴</p>
              <p className="text-sm text-gray-500 mt-1">
                领取 NFT 时自动发放
              </p>
            </div>
          )}
        </div>
        <Link 
          href="/grant"
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          查看详情 →
        </Link>
      </div>
    </div>
  );
}