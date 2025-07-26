'use client';

import { GameBoardV3 } from '@/components/GameBoardV3';
import { ROLE_CONFIGS, PlayerRole } from '@/types/game';
import { useState } from 'react';
import { getRoleDistribution, roleEmojis, roleNames } from '@/utils/gameUtilsV3';
import { useRouter } from 'next/navigation';
import '../hackathon.css';

export default function GamePage() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<'intro' | 'config' | 'game'>('intro');
  const [gameConfig, setGameConfig] = useState({
    playerCount: 6,
    selectedRole: 'random' as PlayerRole | 'random'
  });

  const handleReturnHome = () => {
    router.push('/');
  };

  if (currentView === 'game') {
    return <GameBoardV3 onReturnHome={handleReturnHome} gameConfig={gameConfig} />;
  }

  if (currentView === 'intro') {
    return (
      <main className="min-h-screen cyber-gradient p-4 relative overflow-hidden">
        <div className="scan-line absolute inset-0"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          {/* 返回按钮 */}
          <button
            onClick={handleReturnHome}
            className="mb-6 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-green-400 rounded-lg transition-colors border border-gray-700 hover:border-green-500"
          >
            ← 返回首页
          </button>

          {/* 游戏标题 */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-green-400 neon-glow mb-4">ShitX 游戏</h1>
            <p className="text-xl text-gray-400">一场关于生存与背叛的较量</p>
          </div>

          {/* 游戏规则 */}
          <div className="bg-gray-900 border border-green-500 rounded-2xl p-8 shadow-2xl shadow-green-500/20 mb-8">
            <h2 className="text-3xl font-bold text-green-400 mb-4 neon-glow">游戏规则</h2>
            <div className="space-y-3 text-green-300">
              <p>• 拉屎的人会在夜晚行动，让孕妇们感到恶心</p>
              <p>• 孕妇们需要通过投票找出拉屎的人</p>
              <p>• 警犬可以在夜晚检查其他玩家的身份</p>
              <p>• 保洁员可以保护孕妇不被恶心</p>
              <p>• 尿在瓶子的人知道拉屎的人是谁，需要暗中帮助拉屎的人</p>
            </div>
          </div>

          {/* 角色介绍 */}
          <div className="bg-gray-900 border border-green-500 rounded-2xl p-8 shadow-2xl shadow-green-500/20 mb-8">
            <h2 className="text-3xl font-bold text-green-400 mb-6 neon-glow">角色介绍</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(ROLE_CONFIGS).map(([role, config]) => (
                <div key={role} className="flex items-start gap-4 p-4 bg-gray-800 border border-gray-700 rounded-xl hover:border-green-500 transition-colors">
                  <div className="text-4xl">{config.emoji}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-green-400 mb-1">{config.name}</h3>
                    <p className="text-gray-400">{config.description}</p>
                    {role === 'pooper' && (
                      <p className="text-sm text-red-600 mt-1">坏人阵营：需要隐藏身份，每晚可以恶心一个孕妇</p>
                    )}
                    {role === 'pregnant' && (
                      <p className="text-sm text-blue-600 mt-1">好人阵营：被恶心后会取消参赛资格</p>
                    )}
                    {role === 'dog' && (
                      <p className="text-sm text-blue-600 mt-1">好人阵营：特殊能力 - 夜晚检查</p>
                    )}
                    {role === 'cleaner' && (
                      <p className="text-sm text-blue-600 mt-1">好人阵营：特殊能力 - 夜晚保护</p>
                    )}
                    {role === 'peebottler' && (
                      <p className="text-sm text-yellow-600 mt-1">坏人阵营：知道拉屎的人身份，需要暗中配合</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 开始配置按钮 */}
          <div className="text-center">
            <button
              onClick={() => setCurrentView('config')}
              className="px-8 py-4 bg-gray-900 text-green-400 text-xl font-bold rounded-xl hover:bg-gray-800 hover:scale-105 transition-all shadow-lg border-2 border-green-500 hacker-button"
            >
              开始配置游戏
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen cyber-gradient p-4 relative overflow-hidden">
      <div className="scan-line absolute inset-0"></div>
      <div className="max-w-4xl mx-auto relative z-10">
        {/* 返回按钮 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setCurrentView('intro')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-green-400 rounded-lg transition-colors border border-gray-700 hover:border-green-500"
          >
            ← 返回介绍
          </button>
          <button
            onClick={handleReturnHome}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-green-400 rounded-lg transition-colors border border-gray-700 hover:border-green-500"
          >
            ← 返回首页
          </button>
        </div>

        {/* 游戏配置 */}
        <div className="bg-gray-900 border border-green-500 rounded-2xl p-8 shadow-2xl shadow-green-500/20">
          <h2 className="text-3xl font-bold text-green-400 mb-8 text-center neon-glow">游戏配置</h2>
          
          {/* 玩家数量选择 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-green-400">玩家数量</h3>
              {gameConfig.playerCount > 10 && (
                <span className="text-sm text-yellow-600 font-medium px-2 py-1 bg-yellow-50 rounded-full">
                  ⚡ 百人大逃杀模式
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="5"
                max="100"
                value={gameConfig.playerCount}
                onChange={(e) => setGameConfig({...gameConfig, playerCount: parseInt(e.target.value)})}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="min-w-[60px] text-center">
                <span className="text-2xl font-bold text-green-400">{gameConfig.playerCount}</span>
                <div className="text-sm text-gray-500">人</div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>5人</span>
              <span>50人</span>
              <span>100人</span>
            </div>
            
            {/* 角色分配实时显示 */}
            <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex flex-wrap gap-2 justify-center">
                {Object.entries(getRoleDistribution(gameConfig.playerCount)).map(([role, count]) => (
                  <div 
                    key={role} 
                    className="flex items-center gap-1 bg-gray-800 px-3 py-1 rounded-full text-sm shadow-sm border border-gray-700"
                  >
                    <span className="text-lg">{roleEmojis[role as PlayerRole]}</span>
                    <span className="font-medium text-gray-300">{roleNames[role as PlayerRole]}</span>
                    <span className="font-bold text-gray-100">{count}</span>
                  </div>
                ))}
              </div>
              {gameConfig.playerCount > 10 && (
                <div className="mt-3 text-center text-sm">
                  <span className="text-red-400 font-medium">邪恶阵营 {Math.floor(gameConfig.playerCount * 0.15)}人</span>
                  <span className="mx-2 text-gray-500">vs</span>
                  <span className="text-green-400 font-medium">好人阵营 {gameConfig.playerCount - Math.floor(gameConfig.playerCount * 0.15)}人</span>
                </div>
              )}
            </div>
          </div>

          {/* 角色选择 */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-green-400 mb-4">选择你的角色</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* 随机角色选项 */}
              <div
                onClick={() => setGameConfig({...gameConfig, selectedRole: 'random'})}
                className={`p-4 rounded-xl cursor-pointer transition-all ${
                  gameConfig.selectedRole === 'random'
                    ? 'bg-green-900 border-2 border-green-400 scale-105 shadow-lg shadow-green-400/20'
                    : 'bg-gray-800 hover:bg-gray-700 border-2 border-gray-700 hover:border-green-500'
                }`}
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">🎲</div>
                  <h4 className="font-bold text-green-400">随机角色</h4>
                  <p className="text-sm text-gray-400 mt-1">让游戏随机分配</p>
                </div>
              </div>

              {/* 具体角色选项 */}
              {Object.entries(ROLE_CONFIGS).map(([role, config]) => (
                <div
                  key={role}
                  onClick={() => setGameConfig({...gameConfig, selectedRole: role as PlayerRole})}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    gameConfig.selectedRole === role
                      ? 'bg-green-900 border-2 border-green-400 scale-105 shadow-lg shadow-green-400/20'
                      : 'bg-gray-800 hover:bg-gray-700 border-2 border-gray-700 hover:border-green-500'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">{config.emoji}</div>
                    <h4 className="font-bold text-green-400">{config.name}</h4>
                    <p className="text-sm text-gray-400 mt-1">{config.description.split('：')[0]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 开始游戏按钮 */}
          <div className="text-center">
            <button
              onClick={() => setCurrentView('game')}
              className="px-8 py-4 bg-gray-900 text-green-400 text-xl font-bold rounded-xl hover:bg-gray-800 hover:scale-105 transition-all shadow-lg border-2 border-green-500 hacker-button"
            >
              开始游戏
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}