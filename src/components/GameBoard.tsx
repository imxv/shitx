'use client';

import { useGameLogic } from '@/hooks/useGameLogic';
import { PlayerCard } from './PlayerCard';
import { ROLE_CONFIGS } from '@/types/game';
import { useState } from 'react';

export const GameBoard = () => {
  const { gameState, initGame, voteOut, dogCheck, cleanerProtect, pooperAction, nextPhase } = useGameLogic();
  const [selectedAction, setSelectedAction] = useState<'vote' | 'dogCheck' | 'cleanerProtect' | 'pooperAction' | null>(null);
  
  const alivePlayers = gameState.players.filter(p => p.isAlive);
  const userPlayer = gameState.players.find(p => p.role !== 'pregnant') || gameState.players[0];
  
  const handlePlayerSelect = (playerId: string) => {
    switch (selectedAction) {
      case 'vote':
        voteOut(playerId);
        setSelectedAction(null);
        break;
      case 'dogCheck':
        dogCheck(playerId);
        setSelectedAction(null);
        break;
      case 'cleanerProtect':
        cleanerProtect(playerId);
        setSelectedAction(null);
        break;
      case 'pooperAction':
        pooperAction(playerId);
        setSelectedAction(null);
        break;
    }
  };

  const canUseAbility = (ability: string) => {
    if (!userPlayer) return false;
    
    switch (ability) {
      case 'dogCheck':
        return userPlayer.role === 'dog' && gameState.phase === 'night' && !gameState.nightActions.dogCheck;
      case 'cleanerProtect':
        return userPlayer.role === 'cleaner' && gameState.phase === 'night' && !gameState.nightActions.cleanerProtect;
      case 'pooperAction':
        return userPlayer.role === 'pooper' && gameState.phase === 'night' && !gameState.nightActions.pooperTarget;
      default:
        return false;
    }
  };

  const allNightActionsComplete = () => {
    if (!userPlayer) return true;
    
    switch (userPlayer.role) {
      case 'dog':
        return !!gameState.nightActions.dogCheck;
      case 'cleaner':
        return !!gameState.nightActions.cleanerProtect;
      case 'pooper':
        return !!gameState.nightActions.pooperTarget;
      default:
        return true; // 孕妇夜晚不需要行动
    }
  };

  if (gameState.players.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 to-orange-200 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-8 text-gray-800">💩 找屎大作战 💩</h1>
          <div className="bg-white rounded-xl p-8 shadow-lg mb-8">
            <h2 className="text-2xl font-bold mb-4">游戏规则</h2>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              {Object.entries(ROLE_CONFIGS).map(([role, config]) => (
                <div key={role} className="flex items-center gap-3">
                  <span className="text-3xl">{config.emoji}</span>
                  <div>
                    <div className="font-bold">{config.name}</div>
                    <div className="text-sm text-gray-600">{config.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button 
            onClick={initGame}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-xl"
          >
            开始游戏
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 to-orange-200 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 游戏标题和状态 */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">💩 找屎大作战 💩</h1>
          <div className="bg-white rounded-lg p-4 inline-block shadow-md">
            <div className="flex items-center gap-4 text-lg">
              <span>第 {gameState.currentRound} 轮</span>
              <span className={`px-3 py-1 rounded-full text-white ${
                gameState.phase === 'day' ? 'bg-yellow-500' : 'bg-blue-500'
              }`}>
                {gameState.phase === 'day' ? '🌅 白天' : '🌙 夜晚'}
              </span>
            </div>
          </div>
        </div>

        {/* 你的角色信息 */}
        {userPlayer && (
          <div className="bg-white rounded-xl p-4 mb-6 shadow-lg">
            <h3 className="text-lg font-bold mb-2">你的角色</h3>
            <PlayerCard player={userPlayer} showRole={true} />
          </div>
        )}

        {/* 游戏结束 */}
        {gameState.gameResult && (
          <div className="bg-white rounded-xl p-6 mb-6 shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4">
              {gameState.gameResult === 'goodWin' ? '🎉 好人获胜！' : '💩 拉屎的人获胜！'}
            </h2>
            <p className="text-lg mb-4">
              {gameState.gameResult === 'goodWin' 
                ? '成功找出了拉屎的人！' 
                : '所有孕妇都被恶心出局了！'
              }
            </p>
            <button 
              onClick={initGame}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              重新开始
            </button>
          </div>
        )}

        {/* 玩家区域 */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
          <h3 className="text-lg font-bold mb-4">所有玩家</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {gameState.players.map((player) => (
              <PlayerCard 
                key={player.id}
                player={player}
                isSelectable={!!selectedAction}
                onSelect={handlePlayerSelect}
                showRole={gameState.gameResult !== null}
              />
            ))}
          </div>
        </div>

        {/* 行动按钮 */}
        {!gameState.gameResult && (
          <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
            <h3 className="text-lg font-bold mb-4">
              {gameState.phase === 'day' ? '白天行动' : '夜晚行动'}
            </h3>
            
            {gameState.phase === 'day' && (
              <div className="flex gap-4">
                <button 
                  onClick={() => setSelectedAction('vote')}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg"
                  disabled={selectedAction === 'vote'}
                >
                  投票出局
                </button>
              </div>
            )}

            {gameState.phase === 'night' && (
              <div className="flex gap-4 flex-wrap">
                {canUseAbility('dogCheck') && (
                  <button 
                    onClick={() => setSelectedAction('dogCheck')}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
                    disabled={selectedAction === 'dogCheck'}
                  >
                    🐕‍🦺 检查身份
                  </button>
                )}
                
                {canUseAbility('cleanerProtect') && (
                  <button 
                    onClick={() => setSelectedAction('cleanerProtect')}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
                    disabled={selectedAction === 'cleanerProtect'}
                  >
                    🧹 保护孕妇
                  </button>
                )}
                
                {canUseAbility('pooperAction') && (
                  <button 
                    onClick={() => setSelectedAction('pooperAction')}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg"
                    disabled={selectedAction === 'pooperAction'}
                  >
                    💩 恶心孕妇
                  </button>
                )}
                
                {allNightActionsComplete() && (
                  <button 
                    onClick={nextPhase}
                    className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg"
                  >
                    进入白天
                  </button>
                )}
              </div>
            )}
            
            {selectedAction && (
              <p className="mt-4 text-gray-600">
                请选择一个玩家来执行行动
              </p>
            )}
          </div>
        )}

        {/* 游戏历史 */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold mb-4">游戏历史</h3>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {gameState.actionHistory.map((action, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                {action}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 