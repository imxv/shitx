'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateEVMAddress } from '@/utils/web3Utils';
import { getUserIdentity } from '@/utils/userIdentity';

interface ReferralUser {
  address: string;
  username: string;
  displayAddress: string;
  totalEarnings: number;
  directEarnings: number;
  level: number;
  joinedAt?: number;
  nftCount: number;
  lastActiveAt?: number;
}

interface LevelStats {
  level: number;
  userCount: number;
  totalEarnings: number;
  avgEarnings: number;
  topEarner?: ReferralUser;
}

interface TotalStats {
  totalUsers: number;
  totalEarnings: number;
  totalDirectEarnings: number;
  avgEarningsPerUser: number;
}

interface ReferralTreeData {
  address: string;
  referrals: ReferralUser[];
  levelStats: LevelStats[];
  totalStats: TotalStats;
}

export default function ReferralTreePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReferralTreeData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'level1' | 'level2' | 'level3' | 'ranking'>('overview');
  const [userAddress, setUserAddress] = useState<string>('');

  useEffect(() => {
    loadReferralTree();
  }, []);

  const loadReferralTree = async () => {
    try {
      setLoading(true);
      
      // 获取当前用户地址
      const identity = getUserIdentity();
      const address = generateEVMAddress(identity.fingerprint);
      setUserAddress(address);
      
      // 获取推荐树数据
      const response = await fetch(`/api/v1/referral-tree/${address}`);
      const treeData = await response.json();
      setData(treeData);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading referral tree:', error);
      setLoading(false);
    }
  };

  const formatEarnings = (amount: number) => {
    if (amount === 0) return '0';
    if (amount < 0.01) return '<0.01';
    return amount.toFixed(2);
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '未知';
    return new Date(timestamp).toLocaleDateString('zh-CN');
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 2: return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
      case 3: return 'text-red-400 bg-red-400/10 border-red-400/30';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  const getLevelBadgeColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-yellow-500';
      case 2: return 'bg-orange-500';
      case 3: return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const renderUserCard = (user: ReferralUser, rank?: number) => (
    <div key={user.address} className={`rounded-xl p-4 border-2 transition-all hover:shadow-lg ${getLevelColor(user.level)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold truncate">{user.username}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full text-white font-medium ${getLevelBadgeColor(user.level)}`}>
              {user.level}级
            </span>
            {rank && (
              <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300">
                #{rank}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 font-mono">{user.displayAddress}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">{formatEarnings(user.totalEarnings)} SHIT</p>
          <p className="text-xs text-gray-400">总收益</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-400 text-xs">直接收益</p>
          <p className="font-semibold">{formatEarnings(user.directEarnings)} SHIT</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">NFT数量</p>
          <p className="font-semibold">{user.nftCount}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">加入时间</p>
          <p className="font-semibold">{formatDate(user.joinedAt)}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">最后活跃</p>
          <p className="font-semibold">{formatDate(user.lastActiveAt)}</p>
        </div>
      </div>
    </div>
  );

  const renderOverview = () => {
    if (!data) return null;

    return (
      <div className="space-y-6">
        {/* 总体统计 */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-4 text-white">📊 总体统计</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-700/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{data.totalStats.totalUsers}</p>
              <p className="text-sm text-gray-400">推荐用户</p>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">{formatEarnings(data.totalStats.totalEarnings)}</p>
              <p className="text-sm text-gray-400">总收益 (SHIT)</p>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">{formatEarnings(data.totalStats.avgEarningsPerUser)}</p>
              <p className="text-sm text-gray-400">人均收益 (SHIT)</p>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-purple-400">{formatEarnings(data.totalStats.totalDirectEarnings)}</p>
              <p className="text-sm text-gray-400">直接收益 (SHIT)</p>
            </div>
          </div>
        </div>

        {/* 各级统计 */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-4 text-white">🎯 分级统计</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {data.levelStats.map((level) => (
              <div key={level.level} className={`rounded-xl p-4 border-2 ${getLevelColor(level.level)}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold">{level.level}级推荐</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full text-white font-medium ${getLevelBadgeColor(level.level)}`}>
                    {level.userCount} 人
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">总收益:</span>
                    <span className="font-semibold">{formatEarnings(level.totalEarnings)} SHIT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">平均收益:</span>
                    <span className="font-semibold">{formatEarnings(level.avgEarnings)} SHIT</span>
                  </div>
                  {level.topEarner && (
                    <div className="pt-2 border-t border-gray-600">
                      <p className="text-xs text-gray-400 mb-1">收益最高:</p>
                      <p className="font-semibold truncate">{level.topEarner.username}</p>
                      <p className="text-xs font-mono text-gray-400">{formatEarnings(level.topEarner.totalEarnings)} SHIT</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 收益排行前5 */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-4 text-white">🏆 收益排行榜 (前5名)</h2>
          <div className="space-y-3">
            {data.referrals.slice(0, 5).map((user, index) => 
              renderUserCard(user, index + 1)
            )}
          </div>
          {data.referrals.length > 5 && (
            <button
              onClick={() => setActiveTab('ranking')}
              className="w-full mt-4 py-2 text-center text-gray-400 hover:text-white transition-colors"
            >
              查看完整排行榜 ({data.referrals.length} 人) →
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderLevelTab = (level: number) => {
    if (!data) return null;

    const levelUsers = data.referrals.filter(user => user.level === level);
    const levelStat = data.levelStats.find(stat => stat.level === level);

    return (
      <div className="space-y-6">
        {/* 级别统计卡片 */}
        {levelStat && (
          <div className={`rounded-2xl p-6 border-2 ${getLevelColor(level)}`}>
            <h2 className="text-2xl font-bold mb-4">{level}级推荐统计</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{levelStat.userCount}</p>
                <p className="text-sm text-gray-400">推荐人数</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{formatEarnings(levelStat.totalEarnings)}</p>
                <p className="text-sm text-gray-400">总收益 (SHIT)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{formatEarnings(levelStat.avgEarnings)}</p>
                <p className="text-sm text-gray-400">平均收益 (SHIT)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {levelStat.topEarner ? formatEarnings(levelStat.topEarner.totalEarnings) : '0'}
                </p>
                <p className="text-sm text-gray-400">最高收益 (SHIT)</p>
              </div>
            </div>
          </div>
        )}

        {/* 用户列表 */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4 text-white">
            {level}级推荐用户 ({levelUsers.length} 人)
          </h3>
          {levelUsers.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {levelUsers.map((user, index) => 
                renderUserCard(user, index + 1)
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">暂无{level}级推荐用户</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderRanking = () => {
    if (!data) return null;

    return (
      <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-4 text-white">🏆 完整收益排行榜</h2>
        {data.referrals.length > 0 ? (
          <div className="space-y-3">
            {data.referrals.map((user, index) => 
              renderUserCard(user, index + 1)
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">暂无推荐用户</p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">加载推荐树数据...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-3 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* 返回按钮 */}
        <button
          onClick={() => router.push('/grant')}
          className="mb-4 sm:mb-6 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
        >
          ← 返回Grant页面
        </button>

        {/* 标题和导航 */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 text-white">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4">🌳 分级推荐树</h1>
          <p className="text-gray-400 text-sm mb-4">
            查看您的推荐网络和每个层级创造的收益情况
          </p>
          
          {/* 标签导航 */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'overview', label: '总览', icon: '📊' },
              { id: 'level1', label: '一级推荐', icon: '🥇' },
              { id: 'level2', label: '二级推荐', icon: '🥈' },
              { id: 'level3', label: '三级推荐', icon: '🥉' },
              { id: 'ranking', label: '完整排行', icon: '🏆' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <span className="hidden sm:inline">{tab.icon} </span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 内容区域 */}
        <div className="min-h-96">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'level1' && renderLevelTab(1)}
          {activeTab === 'level2' && renderLevelTab(2)}
          {activeTab === 'level3' && renderLevelTab(3)}
          {activeTab === 'ranking' && renderRanking()}
        </div>

        {/* 说明 */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 text-gray-400 text-sm mt-6">
          <p>💡 说明：</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>一级推荐：您直接推荐的用户</li>
            <li>二级推荐：您的推荐用户再推荐的用户</li>
            <li>三级推荐：二级推荐用户再推荐的用户</li>
            <li>收益包括直接补贴和推荐奖励</li>
            <li>数据实时更新，展示最新的推荐关系和收益情况</li>
          </ul>
        </div>
      </div>
    </div>
  );
}