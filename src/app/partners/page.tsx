'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { TopBar } from '@/components/TopBar';
import { partners } from '@/config/partners';
import '../hackathon.css';

export default function PartnersPage() {
  const [hoveredPartner, setHoveredPartner] = useState<string | null>(null);

  return (
    <main className="min-h-screen cyber-gradient pt-20 p-6 relative overflow-hidden">
      <TopBar />
      
      {/* 科技感背景元素 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-10"></div>
      </div>
      
      <div className="relative max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold mb-4">
            <span className="text-yellow-400 neon-glow">友情</span>
            <span className="text-green-400 neon-glow">合作</span>
          </h1>
          <p className="text-xl text-gray-400">
            携手共建厕所革命的伟大事业
          </p>
        </div>

        {/* ShitX 的献身游戏入口 */}
        <div className="mb-12">
          <div className="bg-gray-900/70 backdrop-blur-sm rounded-2xl p-8 border border-green-500/30">
            <h2 className="text-2xl font-bold text-green-400 mb-4 text-center">🎮 ShitX 的献身</h2>
            <p className="text-gray-300 text-center mb-6">
              在马桶上拉屎的同时，体验 Web3 游戏的终极形态
            </p>
            <Link
              href="/game"
              className="block max-w-md mx-auto group"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-green-500 rounded-xl blur-lg opacity-50 group-hover:opacity-70 transition-opacity animate-pulse"></div>
                <button className="relative w-full px-10 py-5 bg-gray-900/90 text-green-400 text-xl font-bold rounded-xl hover:bg-gray-800/90 transition-all shadow-2xl border border-green-500/50 backdrop-blur-sm">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-3xl">🎮</span>
                    <span>进入游戏</span>
                  </div>
                </button>
              </div>
            </Link>
          </div>
        </div>

        {/* 合作方列表 */}
        <div className="bg-gray-900/70 backdrop-blur-sm rounded-2xl p-8 border border-yellow-500/30">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6 text-center">🤝 合作方</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className="relative group"
                onMouseEnter={() => setHoveredPartner(partner.id)}
                onMouseLeave={() => setHoveredPartner(null)}
              >
                <div className={`
                  bg-gray-800/50 rounded-xl p-6 border transition-all duration-300
                  ${hoveredPartner === partner.id 
                    ? 'border-yellow-500 shadow-lg shadow-yellow-500/20 transform -translate-y-1' 
                    : 'border-gray-700 hover:border-gray-600'
                  }
                `}>
                  {/* Logo 或 emoji */}
                  <div className="flex items-center justify-center mb-4 h-24">
                    {partner.logo ? (
                      <img 
                        src={`/partner/${partner.logo}`} 
                        alt={partner.displayName}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-6xl">💩</span>
                    )}
                  </div>
                  
                  {/* 合作方信息 */}
                  <h3 className="text-xl font-bold text-white mb-2 text-center">
                    {partner.displayName}
                  </h3>
                  
                  <p className="text-sm text-gray-400 text-center mb-4">
                    {partner.description}
                  </p>
                  
                  {/* NFT 信息 */}
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 text-center">
                      专属 NFT: <span className="text-yellow-400">{partner.nftName}</span>
                    </p>
                    <p className="text-xs text-gray-500 text-center mt-1">
                      限量: <span className="text-green-400">{partner.totalSupply} 个</span>
                    </p>
                  </div>
                  
                  {/* 悬浮效果 */}
                  {hoveredPartner === partner.id && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-yellow-500/10 to-transparent pointer-events-none"></div>
                  )}
                </div>
              </div>
            ))}
            
            {/* 添加更多合作方提示 */}
            <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700 border-dashed flex items-center justify-center">
              <div className="text-center">
                <span className="text-4xl mb-3 block opacity-50">➕</span>
                <p className="text-gray-500 text-sm">更多合作方</p>
                <p className="text-gray-600 text-xs mt-1">敬请期待</p>
              </div>
            </div>
          </div>
        </div>

        {/* 合作说明 */}
        <div className="mt-8 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 text-center">
          <p className="text-gray-400">
            想要成为 ShitX 合作方？让我们一起创造历史！
          </p>
          <p className="text-sm text-gray-500 mt-2">
            合作方将获得专属 NFT 系列，共同见证厕所革命的伟大时刻
          </p>
        </div>
      </div>
    </main>
  );
}