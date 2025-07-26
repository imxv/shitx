'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateEVMAddress } from '@/utils/web3Utils';
import { getUserIdentity } from '@/utils/userIdentity';

interface GrantInfo {
  address: string;
  balance: string;
  hasClaimedSubsidy: boolean;
  subsidyAmount?: string;
  claimedAt?: number;
}

interface GrantStats {
  totalDistributed: string;
  totalRecipients: number;
  averageAmount: string;
}

export default function GrantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userGrant, setUserGrant] = useState<GrantInfo | null>(null);
  const [stats, setStats] = useState<GrantStats | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [searchResult, setSearchResult] = useState<GrantInfo | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadGrantInfo();
  }, []);

  const loadGrantInfo = async () => {
    try {
      setLoading(true);
      
      // 获取当前用户地址
      const identity = getUserIdentity();
      const address = generateEVMAddress(identity.fingerprint);
      
      // 获取用户的 grant 信息
      const grantResponse = await fetch(`/api/v1/grant/${address}`);
      const grantData = await grantResponse.json();
      setUserGrant(grantData);
      
      // 获取全局统计信息
      const statsResponse = await fetch('/api/v1/grant/stats');
      const statsData = await statsResponse.json();
      setStats(statsData);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading grant info:', error);
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchAddress) return;
    
    try {
      setSearching(true);
      const response = await fetch(`/api/v1/grant/${searchAddress}`);
      const data = await response.json();
      setSearchResult(data);
      setSearching(false);
    } catch (error) {
      console.error('Error searching grant:', error);
      setSearching(false);
    }
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.01) return '<0.01';
    return num.toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">加载 Grant 信息...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 返回按钮 */}
        <button
          onClick={() => router.push('/')}
          className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          ← 返回首页
        </button>

        {/* 标题 */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 mb-6 text-white">
          <h1 className="text-3xl font-bold mb-4">💰 SHITX Grant 查询</h1>
          
          {/* 你的 Grant 信息 */}
          {userGrant && (
            <div className="bg-gray-700/50 rounded-xl p-4 mb-6">
              <h2 className="text-xl font-semibold mb-3">你的 Grant 信息</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">地址</p>
                  <p className="font-mono text-xs">{userGrant.address}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">SHIT 余额</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {formatBalance(userGrant.balance)} SHIT
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Grant 状态</p>
                  <p className={userGrant.hasClaimedSubsidy ? 'text-green-400' : 'text-gray-400'}>
                    {userGrant.hasClaimedSubsidy ? '已领取' : '未领取'}
                  </p>
                </div>
                {userGrant.hasClaimedSubsidy && userGrant.subsidyAmount && (
                  <div>
                    <p className="text-gray-400 text-sm">Grant 金额</p>
                    <p className="text-lg font-semibold">{userGrant.subsidyAmount} SHIT</p>
                  </div>
                )}
              </div>
              {userGrant.hasClaimedSubsidy && userGrant.claimedAt && (
                <div className="mt-3 text-sm text-gray-400">
                  领取时间：{new Date(userGrant.claimedAt).toLocaleString('zh-CN')}
                </div>
              )}
            </div>
          )}

          {/* 全局统计 */}
          {stats && (
            <div className="bg-gray-700/50 rounded-xl p-4 mb-6">
              <h2 className="text-xl font-semibold mb-3">全局统计</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-gray-400 text-sm">总发放量</p>
                  <p className="text-xl font-bold text-green-400">
                    {formatBalance(stats.totalDistributed)} SHIT
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-sm">领取人数</p>
                  <p className="text-xl font-bold">{stats.totalRecipients}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-sm">平均金额</p>
                  <p className="text-xl font-bold">
                    {formatBalance(stats.averageAmount)} SHIT
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 地址查询 */}
          <div>
            <h2 className="text-xl font-semibold mb-3">查询其他地址</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                placeholder="输入 EVM 地址"
                className="flex-1 px-4 py-2 bg-gray-700 rounded text-white placeholder-gray-400"
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                className="px-6 py-2 bg-green-600 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {searching ? '查询中...' : '查询'}
              </button>
            </div>
            
            {searchResult && (
              <div className="mt-4 bg-gray-700/50 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">地址</p>
                    <p className="font-mono text-xs">{searchResult.address}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">SHIT 余额</p>
                    <p className="text-xl font-bold text-yellow-400">
                      {formatBalance(searchResult.balance)} SHIT
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Grant 状态</p>
                    <p className={searchResult.hasClaimedSubsidy ? 'text-green-400' : 'text-gray-400'}>
                      {searchResult.hasClaimedSubsidy ? '已领取' : '未领取'}
                    </p>
                  </div>
                  {searchResult.hasClaimedSubsidy && searchResult.subsidyAmount && (
                    <div>
                      <p className="text-gray-400 text-sm">Grant 金额</p>
                      <p className="text-lg font-semibold">{searchResult.subsidyAmount} SHIT</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 说明 */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 text-gray-400 text-sm">
          <p>💡 说明：</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Grant 是 SHITX 代币的一次性补贴</li>
            <li>每个地址只能领取一次 Grant</li>
            <li>Grant 会在首次领取 NFT 时自动发放</li>
            <li>Grant 金额根据分发策略动态调整</li>
          </ul>
        </div>
      </div>
    </div>
  );
}