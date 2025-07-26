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

interface RewardRecord {
  amount: number;
  type: 'direct_subsidy' | 'referral_reward';
  level?: number;
  partnerId?: string;
  sourceNFTId?: string;
  timestamp: number;
  formattedTime: string;
  typeDisplay: string;
  partnerInfo?: {
    id: string;
    name: string;
    nftName: string;
  };
  sourceInfo?: {
    address: string;
    displayAddress: string;
    username: string;
  };
}

interface RewardStats {
  totalRecords: number;
  totalDirectSubsidy: number;
  totalReferralRewards: number;
  level1Rewards: number;
  level2Rewards: number;
  level3Rewards: number;
}

interface AIAnalysis {
  type: 'grant' | 'nft';
  analysis: string;
  updateTime: string;
  cached?: boolean;
  ageInHours?: number;
  nextUpdateCost: number;
}

export default function GrantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userGrant, setUserGrant] = useState<GrantInfo | null>(null);
  const [stats, setStats] = useState<GrantStats | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [searchResult, setSearchResult] = useState<GrantInfo | null>(null);
  const [searching, setSearching] = useState(false);
  const [rewardHistory, setRewardHistory] = useState<RewardRecord[]>([]);
  const [rewardStats, setRewardStats] = useState<RewardStats | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [analyzingGrant, setAnalyzingGrant] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

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
      
      // 获取收益历史
      const historyResponse = await fetch(`/api/v1/grant/history/${address}`);
      const historyData = await historyResponse.json();
      if (historyData.history) {
        setRewardHistory(historyData.history);
        setRewardStats(historyData.stats);
      }
      
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

  const handleAIAnalysis = async (forceRefresh = false) => {
    try {
      setAnalyzingGrant(true);
      
      // 获取当前用户地址
      const identity = getUserIdentity();
      const address = generateEVMAddress(identity.fingerprint);
      
      const response = await fetch('/api/v1/ai-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'grant',
          forceRefresh,
          userAddress: address
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (data.error === 'Insufficient SHIT balance') {
          alert(`余额不足！需要 ${data.required} SHIT，当前余额：${data.current} SHIT`);
        } else {
          alert(data.error || '分析失败');
        }
        return;
      }

      setAiAnalysis(data);
      setShowAnalysis(true);
      
      // 如果消耗了SHIT，更新余额
      if (!data.cached && data.newBalance !== undefined) {
        setUserGrant(prev => prev ? { ...prev, balance: data.newBalance.toString() } : null);
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      alert('AI分析服务暂时不可用');
    } finally {
      setAnalyzingGrant(false);
    }
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h1 className="text-3xl font-bold mb-2 sm:mb-0">💰 SHITX Grant 查询</h1>
            <div className="flex gap-2">
              <button
                onClick={() => handleAIAnalysis(false)}
                disabled={analyzingGrant}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {analyzingGrant ? (
                  <>
                    <span className="animate-spin">🔄</span> 分析中...
                  </>
                ) : (
                  <>
                    🤖 AI分析 (100 SHIT)
                  </>
                )}
              </button>
              <button
                onClick={() => router.push('/referral-tree')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm font-medium"
              >
                🌳 查看分级推荐树
              </button>
            </div>
          </div>
          
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

          {/* 收益历史 */}
          {rewardHistory.length > 0 && (
            <div className="bg-gray-700/50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold">收益详情</h2>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {showHistory ? '收起' : '展开'} ({rewardHistory.length} 条记录)
                </button>
              </div>
              
              {rewardStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                  <div className="bg-gray-800/50 rounded p-2">
                    <p className="text-gray-400 text-xs">直接补贴</p>
                    <p className="font-bold text-green-400">{rewardStats.totalDirectSubsidy}</p>
                  </div>
                  <div className="bg-gray-800/50 rounded p-2">
                    <p className="text-gray-400 text-xs">一级推荐</p>
                    <p className="font-bold text-yellow-400">{rewardStats.level1Rewards}</p>
                  </div>
                  <div className="bg-gray-800/50 rounded p-2">
                    <p className="text-gray-400 text-xs">二级推荐</p>
                    <p className="font-bold text-orange-400">{rewardStats.level2Rewards}</p>
                  </div>
                  <div className="bg-gray-800/50 rounded p-2">
                    <p className="text-gray-400 text-xs">三级推荐</p>
                    <p className="font-bold text-red-400">{rewardStats.level3Rewards}</p>
                  </div>
                </div>
              )}
              
              {showHistory && (
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {rewardHistory.map((record, index) => (
                    <div key={index} className="bg-gray-800/50 rounded p-3 text-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-bold ${
                              record.type === 'direct_subsidy' ? 'text-green-400' : 
                              record.level === 1 ? 'text-yellow-400' :
                              record.level === 2 ? 'text-orange-400' : 'text-red-400'
                            }`}>
                              +{record.amount} SHIT
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-gray-700 rounded">
                              {record.typeDisplay}
                            </span>
                          </div>
                          
                          {record.partnerInfo && (
                            <p className="text-xs text-gray-400">
                              极速卡片: {record.partnerInfo.nftName}
                            </p>
                          )}
                          
                          {record.sourceInfo && (
                            <p className="text-xs text-gray-400">
                              来自: {record.sourceInfo.username} ({record.sourceInfo.displayAddress})
                            </p>
                          )}
                          
                          <p className="text-xs text-gray-500 mt-1">
                            {record.formattedTime}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI 分析结果 */}
          {aiAnalysis && (
            <div className="bg-gray-700/50 rounded-xl p-4 mb-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-xl font-semibold">🤖 AI 数据分析</h2>
                  {aiAnalysis.cached && (
                    <p className="text-xs text-gray-400 mt-1">
                      缓存数据 · {aiAnalysis.ageInHours} 小时前生成 · 
                      <button
                        onClick={() => handleAIAnalysis(true)}
                        className="text-blue-400 hover:text-blue-300 ml-1"
                        disabled={analyzingGrant}
                      >
                        刷新分析 (100 SHIT)
                      </button>
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowAnalysis(!showAnalysis)}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {showAnalysis ? '收起' : '展开'}
                </button>
              </div>
              
              {showAnalysis && (
                <div className="prose prose-invert prose-sm max-w-none">
                  <div className="bg-gray-800/50 rounded-lg p-4 whitespace-pre-wrap text-gray-300 leading-relaxed">
                    {aiAnalysis.analysis}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    更新时间：{new Date(aiAnalysis.updateTime).toLocaleString('zh-CN')}
                  </div>
                </div>
              )}
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
            <li>Grant 会在首次领取极速卡片时自动发放</li>
            <li>Grant 金额根据分发策略动态调整</li>
          </ul>
        </div>
      </div>
    </div>
  );
}