'use client';

import Link from 'next/link';
import { NFTClaim } from '@/components/NFTClaim';
import { GrantStatusCard } from '@/components/GrantStatusCard';
import { NFTCollectionCard } from '@/components/NFTCollectionCard';
import { TopBar } from '@/components/TopBar';
import { ReferralStats } from '@/components/ReferralStats';
import { useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { getUserIdentity } from '@/utils/userIdentity';
import './hackathon.css';

function HomeContent() {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // 获取 URL 中的参数
    const ref = searchParams.get('ref');
    const referrerUserId = searchParams.get('user');
    const referrerNFTId = searchParams.get('nft');
    
    if (ref) {
      // 记录 referral 来源（合作方）
      getUserIdentity(ref);
    } else {
      // 没有 ref 参数也要调用，确保生成用户身份
      getUserIdentity();
    }
    
    // 保存分享者信息
    if (referrerUserId) {
      sessionStorage.setItem('referrerUserId', referrerUserId);
    }
    
    // 保存推荐人NFT ID（用于合作方NFT）
    if (referrerNFTId) {
      sessionStorage.setItem('referrerNFTId', referrerNFTId);
    }
  }, [searchParams]);

  return (
    <main className="min-h-screen cyber-gradient flex items-center justify-center p-6 pt-20 relative overflow-hidden">
      <TopBar />
      <NFTClaim />
      
      {/* 科技感背景元素 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-10"></div>
      </div>
      
      
      
     <div className="relative max-w-5xl mx-auto w-full">
        <div className="text-center mb-10 space-y-6">
          <div className="relative inline-block">
            <img 
              src="/shitx.png" 
              alt="ShitX Logo" 
              className="w-32 h-32 mx-auto mb-4 animate-float"
            />
            <h1 className="text-6xl font-bold terminal-cursor mb-3">
              <span className="text-yellow-400 neon-glow">Shit</span>
              <span className="text-green-400 neon-glow">X</span>
            </h1>
            {/* <p className="text-xl text-gray-400 font-light tracking-wider">
              创造失眠，在那个有味道的夏天
            </p> */}
          </div>
{/* 
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-yellow-400 mb-3">黑客松有史以来最大的💩</h2>
              <p className="text-gray-300 leading-relaxed">
                在那个难忘的夏天，当所有人都在追求创造的时候，
                我们选择了更优雅的道路——变废为宝
              </p>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400 italic">
                  其实创新不需要 X，只需要 Shit
                </p>
              </div>
            </div>
          </div> */}
        </div>




        {/* 状态卡片组 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto mb-8">
          <GrantStatusCard />
          <NFTCollectionCard />
        </div>
        
        {/* 推荐奖励统计 */}
        <div className="max-w-md mx-auto mb-8">
          <ReferralStats />
        </div>

        {/* 主要功能按钮 - United Toilet */}
        <div className="mb-8">
          <Link
            href="/toilet"
            className="group relative block max-w-md mx-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity animate-pulse"></div>
            <button className="relative w-full px-12 py-8 bg-gray-900/90 text-yellow-400 text-2xl font-bold rounded-2xl hover:bg-gray-800/90 transition-all shadow-2xl border-2 border-yellow-500/50 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <span className="text-6xl">🚽</span>
                <span className="text-3xl">United Toilet</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-50"></div>
            </button>
          </Link>
        </div>


      </div>

      {/* 底部信息 */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-gray-500 text-xs tracking-wider">© 2024 ShitX - 中国有史以来最臭的创新</p>
        <p className="text-gray-600 text-xs mt-1 opacity-70">献给那个让我们失眠的夏天</p>
      </div>

      {/* 科技感装饰线 */}
      <div className="absolute top-10 left-10 right-10 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent"></div>
      <div className="absolute bottom-10 left-10 right-10 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent"></div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="min-h-screen cyber-gradient flex items-center justify-center">
        <div className="text-green-400 text-2xl animate-pulse">Loading...</div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  );
}