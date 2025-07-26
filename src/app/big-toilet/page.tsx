'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { queryNFTStatus } from '@/lib/clientNFTQuery';
import { partners } from '@/config/partners';

interface NFTStatus {
  name: string;
  contractAddress: string;
  totalSupply: number;
  adminBalance: number;
  totalClaimed: number;
  isDeployed: boolean;
}

// 从环境变量获取管理员钱包地址
const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET || '0x53021a66d9cf6Dff7aD234B32FE2d6E5C07f5E4f';
const MAIN_NFT_CONTRACT = process.env.NEXT_PUBLIC_NFT_CONTRACT || '';

export default function BigToiletPage() {
  const router = useRouter();
  const [nftStatuses, setNftStatuses] = useState<NFTStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadNFTStatuses();
  }, []);

  const loadNFTStatuses = async () => {
    try {
      setError('');
      setRefreshing(true);

      const statuses: NFTStatus[] = [];

      // 查询主 NFT 状态
      if (MAIN_NFT_CONTRACT) {
        const mainStatus = await queryNFTStatus(MAIN_NFT_CONTRACT, ADMIN_WALLET);
        
        // 获取 claim 统计（从 API）
        const statsResponse = await fetch('/api/admin/stats');
        const stats = await statsResponse.json();

        statuses.push({
          name: 'ShitX NFT (主系列)',
          contractAddress: MAIN_NFT_CONTRACT,
          totalSupply: parseInt(mainStatus.totalSupply),
          adminBalance: parseInt(mainStatus.balance),
          totalClaimed: stats.mainNFTClaims || 0,
          isDeployed: true,
        });
      }

      // 检查合作方 NFT
      for (const partner of partners) {
        if (partner.contractAddress) {
          const partnerStatus = await queryNFTStatus(partner.contractAddress, ADMIN_WALLET);
          
          statuses.push({
            name: partner.nftName,
            contractAddress: partner.contractAddress,
            totalSupply: parseInt(partnerStatus.totalSupply),
            adminBalance: parseInt(partnerStatus.balance),
            totalClaimed: 0, // TODO: 从 stats API 获取
            isDeployed: true,
          });
        } else {
          statuses.push({
            name: partner.nftName,
            contractAddress: '未部署',
            totalSupply: partner.totalSupply,
            adminBalance: 0,
            totalClaimed: 0,
            isDeployed: false,
          });
        }
      }

      setNftStatuses(statuses);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error loading NFT statuses:', error);
      setError('加载失败: ' + (error as Error).message);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusColor = (balance: number, totalSupply: number) => {
    if (totalSupply === 0) return 'text-gray-400';
    const percentage = (balance / totalSupply) * 100;
    if (percentage > 50) return 'text-green-400';
    if (percentage > 20) return 'text-yellow-400';
    if (percentage > 0) return 'text-orange-400';
    return 'text-red-400';
  };

  const getProgressBarColor = (balance: number, totalSupply: number) => {
    if (totalSupply === 0) return 'from-gray-400 to-gray-600';
    const percentage = (balance / totalSupply) * 100;
    if (percentage > 50) return 'from-green-400 to-green-600';
    if (percentage > 20) return 'from-yellow-400 to-yellow-600';
    if (percentage > 0) return 'from-orange-400 to-orange-600';
    return 'from-red-400 to-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">加载厕所数据中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 返回按钮 */}
        <button
          onClick={() => router.push('/')}
          className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          ← 返回首页
        </button>

        {/* 标题 */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 mb-6 text-white">
          <h1 className="text-3xl font-bold mb-4">🚽 Big Toilet - NFT 分发中心</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-gray-400 mb-1">管理员钱包</p>
              <p className="text-sm font-mono break-all">{ADMIN_WALLET}</p>
            </div>
            <div className="text-right">
              <button
                onClick={loadNFTStatuses}
                disabled={refreshing}
                className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {refreshing ? '刷新中...' : '🔄 刷新'}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500 rounded text-red-300">
              {error}
            </div>
          )}
        </div>

        {/* NFT 状态列表 */}
        <div className="space-y-4">
          {nftStatuses.map((nft, index) => (
            <div
              key={index}
              className="bg-gray-800/50 backdrop-blur-md rounded-xl p-6 border border-gray-700"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{nft.name}</h3>
                  <p className="text-sm text-gray-400 font-mono">
                    {nft.isDeployed ? nft.contractAddress : '未部署'}
                  </p>
                </div>
                <div className="text-right">
                  {nft.isDeployed ? (
                    <span className="text-green-400 text-sm">✅ 已部署</span>
                  ) : (
                    <span className="text-gray-500 text-sm">⏳ 待部署</span>
                  )}
                </div>
              </div>

              {nft.isDeployed && (
                <>
                  {/* 统计信息 */}
                  <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                    <div>
                      <p className="text-gray-400 text-sm">总供应量</p>
                      <p className="text-2xl font-bold text-white">{nft.totalSupply}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">管理员余额</p>
                      <p className={`text-2xl font-bold ${getStatusColor(nft.adminBalance, nft.totalSupply)}`}>
                        {nft.adminBalance}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">已分发</p>
                      <p className="text-2xl font-bold text-purple-400">{nft.totalClaimed}</p>
                    </div>
                  </div>

                  {/* 进度条 */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>库存状态</span>
                      <span>
                        {nft.totalSupply > 0 
                          ? `${((nft.adminBalance / nft.totalSupply) * 100).toFixed(1)}%`
                          : '0%'
                        }
                      </span>
                    </div>
                    <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
                      <div
                        className={`bg-gradient-to-r ${getProgressBarColor(nft.adminBalance, nft.totalSupply)} h-full transition-all duration-500`}
                        style={{ 
                          width: nft.totalSupply > 0 
                            ? `${(nft.adminBalance / nft.totalSupply) * 100}%` 
                            : '0%' 
                        }}
                      />
                    </div>
                  </div>

                  {/* 警告信息 */}
                  {nft.adminBalance === 0 && (
                    <div className="p-3 bg-red-500/20 border border-red-500 rounded text-red-300">
                      ⚠️ 库存已耗尽！需要铸造更多 NFT
                    </div>
                  )}
                  {nft.adminBalance > 0 && nft.adminBalance < 100 && (
                    <div className="p-3 bg-yellow-500/20 border border-yellow-500 rounded text-yellow-300">
                      ⚠️ 库存不足 100 个，建议及时补充
                    </div>
                  )}
                </>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-2 mt-4">
                {nft.isDeployed ? (
                  <>
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                      onClick={() => window.open(`https://testnet.explorer.injective.network/account/${nft.contractAddress}`, '_blank')}
                    >
                      查看合约
                    </button>
                    {nft.adminBalance < 100 && (
                      <button
                        className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-sm"
                        onClick={() => alert('请在 injective 目录运行 pnpm run mint-all')}
                      >
                        铸造更多
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                    onClick={() => alert('请在 injective 目录运行 pnpm run deploy-partners')}
                  >
                    部署合约
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 总体统计 */}
        <div className="mt-6 bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 text-white">
          <h2 className="text-xl font-bold mb-4">📊 总体统计</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-gray-400">总 NFT 数量</p>
              <p className="text-3xl font-bold">
                {nftStatuses.reduce((sum, nft) => sum + (nft.isDeployed ? nft.totalSupply : 0), 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400">总库存</p>
              <p className="text-3xl font-bold text-green-400">
                {nftStatuses.reduce((sum, nft) => sum + nft.adminBalance, 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400">总分发量</p>
              <p className="text-3xl font-bold text-purple-400">
                {nftStatuses.reduce((sum, nft) => sum + nft.totalClaimed, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}