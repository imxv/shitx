'use client';

import Link from 'next/link';
import { UserBadge } from '@/components/UserBadge';
import { NFTClaim } from '@/components/NFTClaim';
import { useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { getUserIdentity } from '@/utils/userIdentity';
import './hackathon.css';

function HomeContent() {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // 获取 URL 中的 ref 参数
    const ref = searchParams.get('ref');
    if (ref) {
      // 记录 referral 来源
      getUserIdentity(ref);
    } else {
      // 没有 ref 参数也要调用，确保生成用户身份
      getUserIdentity();
    }
  }, [searchParams]);

  return (
    <main className="min-h-screen cyber-gradient flex items-center justify-center p-6 relative overflow-hidden">
      <UserBadge />
      <NFTClaim />
      
      {/* 科技感背景元素 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-10"></div>
      </div>
      
      {/* 主要内容区域 */}
      <div className="relative max-w-5xl mx-auto w-full">
        {/* ShitX 标题和描述 */}
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
            <p className="text-xl text-gray-400 font-light tracking-wider">
              创造失眠，在那个有味道的夏天
            </p>
          </div>

          {/* 讽刺性介绍 */}
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-yellow-400 mb-3">中国有史以来最大的💩</h2>
              <p className="text-gray-300 leading-relaxed">
                在那个难忘的夏天，当所有人都在追求 Adventure 的时候，
                我们选择了更真实的道路——拥抱生活的本质。
              </p>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400 italic">
                  真正的创新不需要 X，只需要 Shit。
                  因为生活的本质，就是一场充满味道的冒险。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 中央按钮组 */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-6">
          <Link
            href="/game"
            className="group relative"
          >
            <div className="absolute inset-0 bg-green-500 rounded-xl blur-lg opacity-50 group-hover:opacity-70 transition-opacity animate-pulse"></div>
            <button className="relative px-10 py-5 bg-gray-900/90 text-green-400 text-xl font-bold rounded-xl hover:bg-gray-800/90 transition-all shadow-2xl border border-green-500/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎮</span>
                <span>ShitX 的献身</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-50"></div>
            </button>
          </Link>

          <Link
            href="/my-toilet"
            className="group relative"
          >
            <div className="absolute inset-0 bg-purple-500 rounded-xl blur-lg opacity-50 group-hover:opacity-70 transition-opacity animate-pulse delay-300"></div>
            <button className="relative px-10 py-5 bg-gray-900/90 text-purple-400 text-xl font-bold rounded-xl hover:bg-gray-800/90 transition-all shadow-2xl border border-purple-500/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💩</span>
                <span>My Toilet</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-50"></div>
            </button>
          </Link>

          <Link
            href="/toilet"
            className="group relative"
          >
            <div className="absolute inset-0 bg-yellow-500 rounded-xl blur-lg opacity-50 group-hover:opacity-70 transition-opacity animate-pulse delay-500"></div>
            <button className="relative px-10 py-5 bg-gray-900/90 text-yellow-400 text-xl font-bold rounded-xl hover:bg-gray-800/90 transition-all shadow-2xl border border-yellow-500/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚽</span>
                <span>United Toilet</span>
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