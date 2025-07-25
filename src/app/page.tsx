'use client';

import { GameBoardV3 } from '@/components/GameBoardV3';
import { ROLE_CONFIGS } from '@/types/game';
import { useState } from 'react';

export default function Home() {
  const [showGame, setShowGame] = useState(false);

  if (showGame) {
    return <GameBoardV3 />;
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
            <p>• 尿瓶子的人知道拉屎的人是谁，需要暗中帮助拉屎的人</p>
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
            onClick={() => setShowGame(true)}
            className="px-8 py-4 bg-blue-600 text-white text-xl font-bold rounded-xl hover:bg-blue-700 hover:scale-105 transition-all shadow-lg"
          >
            开始游戏
          </button>
        </div>
      </div>
    </main>
  );
}