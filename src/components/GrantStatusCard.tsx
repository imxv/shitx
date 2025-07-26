'use client';

import { useState, useEffect } from 'react';
import { getUserIdentity } from '@/utils/userIdentity';
import { generateEVMAddress } from '@/utils/web3Utils';
import Link from 'next/link';

interface GrantInfo {
  balance: string;
  hasClaimedSubsidy: boolean;
  subsidyAmount?: string;
  referralRewardsTotal?: number;
  directSubsidyTotal?: number;
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
      
      // 获取 grant 信息
      const response = await fetch(`/api/v1/grant/${address}`);
      const data = await response.json();
      
      // 获取推荐奖励统计
      const referralResponse = await fetch(`/api/v1/referral-stats/${address}`);
      const referralData = await referralResponse.json();
      
      // 获取收益历史以计算真实的直接补贴总额
      const historyResponse = await fetch(`/api/v1/grant/history/${address}`);
      const historyData = await historyResponse.json();
      
      // 计算真实的直接补贴总额
      const directSubsidyTotal = historyData.stats?.totalDirectSubsidy || 0;
      const referralRewardsTotal = historyData.stats?.totalReferralRewards || 0;
      
      setGrantInfo({
        balance: data.balance || '0',
        hasClaimedSubsidy: data.hasClaimedSubsidy || false,
        subsidyAmount: data.subsidyAmount,
        referralRewardsTotal: referralRewardsTotal,
        directSubsidyTotal: directSubsidyTotal
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
          <h3 className="text-sm text-gray-400 mb-2">SHITX Grant 状态</h3>
          
          {/* 总余额 */}
          <div className="mb-3">
            <p className="text-2xl font-bold text-yellow-400">
              {parseFloat(grantInfo.balance).toLocaleString()} SHIT
            </p>
            <p className="text-xs text-gray-500">当前余额</p>
          </div>
          
          {/* 收益明细 */}
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">直接补贴:</span>
              <span className={`font-medium ${grantInfo.directSubsidyTotal && grantInfo.directSubsidyTotal > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                +{grantInfo.directSubsidyTotal || 0} SHIT
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">推荐奖励:</span>
              <span className={`font-medium ${grantInfo.referralRewardsTotal && grantInfo.referralRewardsTotal > 0 ? 'text-orange-400' : 'text-gray-500'}`}>
                +{grantInfo.referralRewardsTotal || 0} SHIT
              </span>
            </div>
            
            {/* 总计 */}
            <div className="pt-1 mt-1 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">总收益:</span>
                <span className="text-yellow-400 font-bold">
                  {((grantInfo.directSubsidyTotal || 0) + (grantInfo.referralRewardsTotal || 0)).toLocaleString()} SHIT
                </span>
              </div>
            </div>
          </div>
        </div>
        <Link 
          href="/grant"
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors ml-4"
        >
          详情 →
        </Link>
      </div>
    </div>
  );
}