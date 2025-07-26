'use client';

import Link from 'next/link';
import { UserBadge } from '@/components/UserBadge';
import './hackathon.css';

export default function Home() {
  return (
    <main className="h-screen cyber-gradient relative overflow-hidden flex items-center justify-center">
      <UserBadge />
      <div className="scan-line absolute inset-0"></div>
      
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500 rounded-full blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500 rounded-full blur-3xl opacity-10 animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center h-full w-full max-w-6xl mx-auto px-4">
        {/* Logo 和标语 */}
        <div className="text-center mb-8">
          <img src="/shitx.png" alt="ShitX Logo" className="w-24 h-24 mx-auto mb-4 object-contain hackathon-logo animate-float" />
          {/* <h1 className="text-5xl font-bold text-green-400 mb-2 neon-glow tracking-wider">ShitX</h1>
          <p className="text-lg text-green-400 terminal-cursor opacity-80">创造失眠，在那个难忘的夏天</p> */}
        </div>

        {/* 中央内容区 */}
        <div className="relative w-full max-w-4xl">
          {/* 宣言卡片 */}
          <div className="bg-gray-900/80 backdrop-blur-md border border-yellow-500/50 rounded-2xl p-8 shadow-2xl shadow-yellow-500/20 mb-10">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-green-500/5 rounded-2xl"></div>
            <div className="relative">
              <h2 className="text-2xl font-bold text-yellow-400 mb-4 text-center neon-glow">ShitX 宣言</h2>
              <div className="space-y-3 text-center">
                <p className="text-xl text-green-400 italic font-light">&ldquo;中国有史以来最大的厕所革命，就在这个难忘的夏天&rdquo;</p>
                <div className="h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent my-4"></div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  当其他人还在探索星辰大海的冒险时，我们已经深入马桶内部的宇宙。
                  72小时不眠不休，只为让每一次如厕都成为一次体验。
                </p>
                <p className="text-sm text-gray-400 italic">
                  真正的创新不需要 X，只需要 Shit。
                  因为生活的本质，就是一场充满味道的冒险。
                </p>
              </div>
            </div>
          </div>

          {/* 中央按钮组 */}
          <div className="flex justify-center items-center gap-8">
            <Link
              href="/game"
              className="group relative"
            >
              <div className="absolute inset-0 bg-green-500 rounded-xl blur-lg opacity-50 group-hover:opacity-70 transition-opacity animate-pulse"></div>
              <button className="relative px-10 py-5 bg-gray-900/90 text-green-400 text-xl font-bold rounded-xl hover:bg-gray-800/90 transition-all shadow-2xl border border-green-500/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎮</span>
                  <span>进入 ShitX 游戏</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-50"></div>
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
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .delay-500 {
          animation-delay: 500ms;
        }
        .delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </main>
  );
}