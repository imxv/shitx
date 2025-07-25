'use client';

import { GameBoardV3 } from '@/components/GameBoardV3';
import { ROLE_CONFIGS, PlayerRole } from '@/types/game';
import { useState } from 'react';
import { getRoleDistribution, roleEmojis, roleNames } from '@/utils/gameUtilsV3';

export default function Home() {
  const [currentView, setCurrentView] = useState<'home' | 'config' | 'game'>('home');
  const [gameConfig, setGameConfig] = useState({
    playerCount: 6,
    selectedRole: 'random' as PlayerRole | 'random'
  });

  if (currentView === 'game') {
    return <GameBoardV3 onReturnHome={() => setCurrentView('home')} gameConfig={gameConfig} />;
  }

  if (currentView === 'config') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* 返回按钮 */}
          <button
            onClick={() => setCurrentView('home')}
            className="mb-6 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
          >
            ← 返回
          </button>

          {/* 游戏配置 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">游戏配置</h2>
            
            {/* 玩家数量选择 */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">玩家数量</h3>
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
                  className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="min-w-[60px] text-center">
                  <span className="text-2xl font-bold text-blue-600">{gameConfig.playerCount}</span>
                  <div className="text-sm text-gray-500">人</div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>5人</span>
                <span>50人</span>
                <span>100人</span>
              </div>
              
              {/* 角色分配实时显示 */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex flex-wrap gap-2 justify-center">
                  {Object.entries(getRoleDistribution(gameConfig.playerCount)).map(([role, count]) => (
                    <div 
                      key={role} 
                      className="flex items-center gap-1 bg-white px-3 py-1 rounded-full text-sm shadow-sm"
                    >
                      <span className="text-lg">{roleEmojis[role as PlayerRole]}</span>
                      <span className="font-medium text-gray-700">{roleNames[role as PlayerRole]}</span>
                      <span className="font-bold text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
                {gameConfig.playerCount > 10 && (
                  <div className="mt-3 text-center text-sm">
                    <span className="text-red-600 font-medium">邪恶阵营 {Math.floor(gameConfig.playerCount * 0.15)}人</span>
                    <span className="mx-2 text-gray-400">vs</span>
                    <span className="text-blue-600 font-medium">好人阵营 {gameConfig.playerCount - Math.floor(gameConfig.playerCount * 0.15)}人</span>
                  </div>
                )}
              </div>
            </div>

            {/* 角色选择 */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">选择你的角色</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* 随机角色选项 */}
                <div
                  onClick={() => setGameConfig({...gameConfig, selectedRole: 'random'})}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    gameConfig.selectedRole === 'random'
                      ? 'bg-purple-100 border-2 border-purple-500 scale-105 shadow-lg'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">🎲</div>
                    <h4 className="font-bold text-gray-800">随机角色</h4>
                    <p className="text-sm text-gray-600 mt-1">让游戏随机分配</p>
                  </div>
                </div>

                {/* 具体角色选项 */}
                {Object.entries(ROLE_CONFIGS).map(([role, config]) => (
                  <div
                    key={role}
                    onClick={() => setGameConfig({...gameConfig, selectedRole: role as PlayerRole})}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${
                      gameConfig.selectedRole === role
                        ? 'bg-blue-100 border-2 border-blue-500 scale-105 shadow-lg'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2">{config.emoji}</div>
                      <h4 className="font-bold text-gray-800">{config.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{config.description.split('：')[0]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 开始游戏按钮 */}
            <div className="text-center">
              <button
                onClick={() => setCurrentView('game')}
                className="px-8 py-4 bg-blue-600 text-white text-xl font-bold rounded-xl hover:bg-blue-700 hover:scale-105 transition-all shadow-lg"
              >
                开始游戏
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 标题 */}
        <div className="text-center py-8">
          <h1 className="text-6xl font-bold text-gray-800 mb-4">💩 找屎游戏</h1>
          <p className="text-xl text-gray-600">创造失眠</p>
        </div>

        {/* 游戏规则 */}
        <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">游戏规则</h2>
          <div className="space-y-3 text-gray-600">
            <p>• 拉屎的人会在夜晚行动，让孕妇们感到恶心</p>
            <p>• 孕妇们需要通过投票找出拉屎的人</p>
            <p>• 警犬可以在夜晚检查其他玩家的身份</p>
            <p>• 保洁员可以保护孕妇不被恶心</p>
            <p>• 尿在瓶子的人知道拉屎的人是谁，需要暗中帮助拉屎的人</p>
          </div>
        </div>

        {/* 角色介绍 */}
        <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">角色介绍</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(ROLE_CONFIGS).map(([role, config]) => (
              <div key={role} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="text-4xl">{config.emoji}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-1">{config.name}</h3>
                  <p className="text-gray-600">{config.description}</p>
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

        {/* 开始游戏按钮 */}
        <div className="text-center">
          <button
            onClick={() => setCurrentView('config')}
            className="px-8 py-4 bg-blue-600 text-white text-xl font-bold rounded-xl hover:bg-blue-700 hover:scale-105 transition-all shadow-lg"
          >
            开始游戏
          </button>
        </div>
      </div>
    </main>
  );
}