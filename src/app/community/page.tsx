'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePartners } from '@/hooks/usePartners';
import { getPartnerLogoUrl } from '@/utils/partnerUtils';

export default function CommunityPage() {
  const router = useRouter();
  const { partners } = usePartners();
  const [communityPartners, setCommunityPartners] = useState<any[]>([]);

  useEffect(() => {
    if (partners) {
      // 只显示社区创建的系列
      const community = partners.filter(p => p.isUserCreated);
      setCommunityPartners(community);
    }
  }, [partners]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* 返回按钮 */}
        <button
          onClick={() => router.push('/')}
          className="mb-6 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          ← 返回首页
        </button>

        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3">
            <span className="text-purple-400">社区</span>
            <span className="text-white">创作</span>
          </h1>
          <p className="text-xl text-gray-400">
            探索由社区创造者带来的精彩ShitX极速卡片系列
          </p>
          <div className="mt-4">
            <span className="inline-block bg-purple-600/30 text-purple-300 px-4 py-2 rounded-full text-sm">
              🌟 From Community
            </span>
          </div>
        </div>

        {/* 创建按钮 */}
        <div className="mb-8 text-center">
          <button
            onClick={() => router.push('/create-series')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
          >
            ✨ 创建我的卡片系列
          </button>
        </div>

        {/* 社区系列列表 */}
        {communityPartners.length > 0 ? (
          <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-purple-400 mb-6 text-center">
              🎨 社区卡片系列
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communityPartners.map((partner) => (
                <div
                  key={partner.id}
                  className="bg-gray-900/70 border-2 border-purple-500/50 rounded-xl p-5 hover:border-purple-400 transition-all cursor-pointer"
                  onClick={() => router.push(`/partners/${partner.id}`)}
                >
                  <div className="flex items-start gap-4">
                    {partner.logo && (
                      <img 
                        src={getPartnerLogoUrl(partner.logo)}
                        alt={partner.displayName}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-lg mb-1">{partner.displayName}</h3>
                      <p className="text-sm text-purple-300 mb-2">{partner.nftName}</p>
                      <p className="text-xs text-gray-400 line-clamp-2">{partner.description}</p>
                      
                      <div className="mt-3 flex items-center gap-2 text-xs">
                        <span className="bg-purple-600/30 px-2 py-1 rounded">
                          供应量: {partner.totalSupply}
                        </span>
                        {partner.creatorName && (
                          <span className="text-gray-500">
                            by {partner.creatorName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-8 text-center">
            <p className="text-gray-400 mb-4">还没有社区创建的卡片系列</p>
            <button
              onClick={() => router.push('/create-series')}
              className="px-6 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-all"
            >
              成为第一个创造者
            </button>
          </div>
        )}

        {/* 说明信息 */}
        <div className="mt-8 bg-purple-900/30 border border-purple-500/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-purple-300 mb-3">💡 关于社区创作</h3>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>• 任何人都可以创建自己的ShitX极速卡片系列</li>
            <li>• 创建者自动获得系列的第一张始祖卡片</li>
            <li>• 始祖卡片拥有该系列的分发权限</li>
            <li>• 通过二维码快速分享和传播您的卡片</li>
            <li>• 每个卡片都是独一无二的数字收藏品</li>
          </ul>
        </div>
      </div>
    </main>
  );
}