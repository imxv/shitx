'use client';

import { useState, useEffect } from 'react';
import { generateEVMAddress } from '@/utils/web3Utils';
import { getUserIdentity } from '@/utils/userIdentity';

interface ReferralData {
  referralStats: {
    totalReferrals: number;
    level1Count: number;
    level2Count: number;
    level3Count: number;
    totalRewards: number;
  };
  balance: string;
  referralChain: Array<{
    level: number;
    address: string;
    displayAddress: string;
  }>;
  directReferrals: Array<{
    address: string;
    displayAddress: string;
  }>;
}

export function ReferralStats() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchReferralStats();
  }, []);

  const fetchReferralStats = async () => {
    try {
      const identity = getUserIdentity();
      const evmAddress = generateEVMAddress(identity.fingerprint);
      
      const response = await fetch(`/api/v1/referral-stats/${evmAddress}`);
      const result = await response.json();
      
      if (response.ok) {
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching referral stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900/90 backdrop-blur-sm border border-purple-500/50 rounded-xl p-4 animate-pulse">
        <div className="h-6 bg-gray-800 rounded w-1/2 mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-800 rounded"></div>
          <div className="h-4 bg-gray-800 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!data || data.referralStats.totalReferrals === 0) {
    return null;
  }

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm border border-purple-500/50 rounded-xl p-4 shadow-lg">
      <h3 className="text-purple-400 font-bold mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="text-2xl">👥</span>
          推荐奖励系统
        </span>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-gray-400 hover:text-purple-400 transition-colors"
        >
          {showDetails ? '收起' : '详情'}
        </button>
      </h3>

      <div className="space-y-3">
        {/* 余额和奖励 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-xs text-gray-400">SHIT 余额</div>
            <div className="text-lg font-bold text-yellow-400">{data.balance}</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-xs text-gray-400">推荐奖励</div>
            <div className="text-lg font-bold text-green-400">+{data.referralStats.totalRewards}</div>
          </div>
        </div>

        {/* 推荐统计 */}
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-2">推荐网络</div>
          <div className="flex items-center justify-between text-sm">
            <div className="text-center">
              <div className="text-white font-bold">{data.referralStats.level1Count}</div>
              <div className="text-xs text-gray-500">一级</div>
            </div>
            <div className="text-gray-600">→</div>
            <div className="text-center">
              <div className="text-gray-300 font-bold">{data.referralStats.level2Count}</div>
              <div className="text-xs text-gray-500">二级</div>
            </div>
            <div className="text-gray-600">→</div>
            <div className="text-center">
              <div className="text-gray-400 font-bold">{data.referralStats.level3Count}</div>
              <div className="text-xs text-gray-500">三级</div>
            </div>
          </div>
        </div>

        {/* 详细信息 */}
        {showDetails && (
          <div className="space-y-3 pt-3 border-t border-gray-700">
            {/* 推荐链 */}
            {data.referralChain.length > 0 && (
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-2">我的推荐人</div>
                <div className="space-y-1">
                  {data.referralChain.map((referrer) => (
                    <div key={referrer.address} className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">{referrer.level}级推荐人</span>
                      <span className="text-gray-300 font-mono">{referrer.displayAddress}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 直接推荐 */}
            {data.directReferrals.length > 0 && (
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-2">
                  直接推荐 ({data.referralStats.totalReferrals}人)
                </div>
                <div className="space-y-1">
                  {data.directReferrals.map((referral, index) => (
                    <div key={referral.address} className="text-xs text-gray-300 font-mono">
                      {index + 1}. {referral.displayAddress}
                    </div>
                  ))}
                  {data.referralStats.totalReferrals > 10 && (
                    <div className="text-xs text-gray-500 text-center pt-1">
                      ... 还有 {data.referralStats.totalReferrals - 10} 人
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 奖励说明 */}
            <div className="bg-gray-800/50 rounded-lg p-3 text-xs text-gray-400">
              <div className="font-bold text-purple-400 mb-1">奖励规则</div>
              <div className="space-y-1">
                <div>• 新用户获得 1-5000 随机 SHIT</div>
                <div>• 一级推荐人获得 50%</div>
                <div>• 二级推荐人获得 20%</div>
                <div>• 三级推荐人获得 5%</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}