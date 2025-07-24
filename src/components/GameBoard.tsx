'use client';

import { useGameLogic } from '@/hooks/useGameLogic';
import { PlayerCard } from './PlayerCard';
import { ROLE_CONFIGS, PlayerRole } from '@/types/game';
import { useState, useEffect } from 'react';
import { executeAINightActions, executeAIVotes } from '@/utils/aiLogic';

export const GameBoard = () => {
  const { gameState, initGame, voteOut, playerVoteWithAI, dogCheck, cleanerProtect, pooperAction, nextPhase } = useGameLogic();
  const [selectedAction, setSelectedAction] = useState<'vote' | 'dogCheck' | 'cleanerProtect' | 'pooperAction' | null>(null);
  const [playerCount, setPlayerCount] = useState<number>(6);
  const [selectedRole, setSelectedRole] = useState<PlayerRole | 'random'>('random');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const alivePlayers = gameState.players.filter(p => p.isAlive);
  const userPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);
  const pooperPlayer = gameState.players.find(p => p.role === 'pooper');
  
  const handlePlayerSelect = (playerId: string) => {
    if (isProcessing) return; // 防止重复点击
    
    setIsProcessing(true);
    
    switch (selectedAction) {
      case 'vote':
        playerVoteWithAI(playerId);
        setSelectedAction(null);
        setTimeout(() => setIsProcessing(false), 1000);
        break;
      case 'dogCheck':
        dogCheck(playerId);
        setSelectedAction(null);
        // 玩家行动后，触发AI行动
        setTimeout(() => {
          executeAINightActions(gameState, dogCheck, cleanerProtect, pooperAction);
          setIsProcessing(false);
        }, 1000);
        break;
      case 'cleanerProtect':
        cleanerProtect(playerId);
        setSelectedAction(null);
        // 玩家行动后，触发AI行动
        setTimeout(() => {
          executeAINightActions(gameState, dogCheck, cleanerProtect, pooperAction);
          setIsProcessing(false);
        }, 1000);
        break;
      case 'pooperAction':
        pooperAction(playerId);
        setSelectedAction(null);
        // 玩家行动后，触发AI行动
        setTimeout(() => {
          executeAINightActions(gameState, dogCheck, cleanerProtect, pooperAction);
          setIsProcessing(false);
        }, 1000);
        break;
    }
  };

  const canUseAbility = (ability: string) => {
    if (!userPlayer || !userPlayer.isAlive) return false;
    
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
    // 检查所有活着的特殊角色是否都完成了行动
    const aliveSpecialPlayers = gameState.players.filter(p => 
      p.isAlive && (p.role === 'dog' || p.role === 'cleaner' || p.role === 'pooper')
    );
    
    for (const player of aliveSpecialPlayers) {
      switch (player.role) {
        case 'dog':
          if (!gameState.nightActions.dogCheck) return false;
          break;
        case 'cleaner':
          if (!gameState.nightActions.cleanerProtect) return false;
          break;
        case 'pooper':
          if (!gameState.nightActions.pooperTarget) return false;
          break;
      }
    }
    
    return true;
  };

  // 触发AI夜晚行动
  useEffect(() => {
    if (gameState.phase === 'night' && gameState.players.length > 0) {
      // 如果玩家不需要在夜晚行动，立即执行AI
      if (!userPlayer || !userPlayer.isAlive || 
          (userPlayer.role !== 'dog' && userPlayer.role !== 'cleaner' && userPlayer.role !== 'pooper')) {
        setIsProcessing(true);
        setTimeout(() => {
          executeAINightActions(gameState, dogCheck, cleanerProtect, pooperAction);
          setTimeout(() => setIsProcessing(false), 3000); // AI行动需要更长时间
        }, 1000);
      }
    }
  }, [gameState.phase, gameState.currentRound]);

  // 触发AI投票
  useEffect(() => {
    if (gameState.phase === 'day' && gameState.players.length > 0) {
      // 给一点延迟，让玩家先看到白天开始
      setTimeout(() => {
        executeAIVotes(gameState, voteOut, nextPhase);
      }, 1500);
    }
  }, [gameState.phase, gameState.currentRound]);

  // 自动进入下一阶段
  useEffect(() => {
    if (gameState.phase === 'night' && allNightActionsComplete() && gameState.players.length > 0) {
      // 所有夜晚行动完成，自动进入白天
      setTimeout(() => {
        nextPhase();
      }, 2000);
    }
  }, [gameState.nightActions, gameState.phase]);

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
          
          {/* 游戏设置 */}
          <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
            <h3 className="text-xl font-bold mb-4">游戏设置</h3>
            
            {/* 玩家数量选择 */}
            <div className="flex items-center gap-4 mb-4">
              <label className="font-semibold">玩家数量：</label>
              <select 
                value={playerCount} 
                onChange={(e) => setPlayerCount(Number(e.target.value))}
                className="px-3 py-2 border rounded-lg"
              >
                <option value={4}>4人局</option>
                <option value={5}>5人局</option>
                <option value={6}>6人局</option>
                <option value={7}>7人局</option>
                <option value={8}>8人局</option>
                <option value={9}>9人局</option>
                <option value={10}>10人局</option>
                <option value={20}>20人局</option>
                <option value={50}>50人局</option>
                <option value={100}>💩 百人大逃杀 💩</option>
              </select>
            </div>
            
            {/* 角色选择 */}
            <div className="mb-4">
              <label className="font-semibold block mb-2">选择你的角色：</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <button
                  onClick={() => setSelectedRole('random')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedRole === 'random' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-2xl mb-1">🎲</div>
                  <div className="text-sm font-semibold">随机分配</div>
                </button>
                
                <button
                  onClick={() => setSelectedRole('pooper')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedRole === 'pooper' 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-2xl mb-1">💩</div>
                  <div className="text-sm font-semibold">拉屎的人</div>
                </button>
                
                {playerCount >= 6 && (
                  <button
                    onClick={() => setSelectedRole('peebottler')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedRole === 'peebottler' 
                        ? 'border-yellow-500 bg-yellow-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-2xl mb-1">🍯</div>
                    <div className="text-sm font-semibold">尿瓶子的人</div>
                  </button>
                )}
                
                {playerCount >= 4 && (
                  <button
                    onClick={() => setSelectedRole('dog')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedRole === 'dog' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-2xl mb-1">🐕‍🦺</div>
                    <div className="text-sm font-semibold">警犬</div>
                  </button>
                )}
                
                {playerCount >= 5 && (
                  <button
                    onClick={() => setSelectedRole('cleaner')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedRole === 'cleaner' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-2xl mb-1">🧹</div>
                    <div className="text-sm font-semibold">保洁员</div>
                  </button>
                )}
                
                <button
                  onClick={() => setSelectedRole('pregnant')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedRole === 'pregnant' 
                      ? 'border-pink-500 bg-pink-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-2xl mb-1">🤰</div>
                  <div className="text-sm font-semibold">孕妇</div>
                </button>
              </div>
            </div>
            
                         {/* 角色配置说明 */}
             <div className="text-sm text-gray-600 mb-4">
               <p className="mb-2">👥 <strong>角色配置：</strong></p>
                              <ul className="list-disc list-inside space-y-1">
                  {playerCount <= 10 ? (
                    <>
                      <li>💩 拉屎的人：1人</li>
                      {playerCount >= 6 && <li>🍯 尿瓶子的人：1人 (6人以上，隐藏角色)</li>}
                      {playerCount >= 4 && <li>🐕‍🦺 警犬：1人 (4人以上)</li>}
                      {playerCount >= 5 && <li>🧹 保洁员：1人 (5人以上)</li>}
                      <li>🤰 孕妇：{playerCount - 1 - (playerCount >= 4 ? 1 : 0) - (playerCount >= 5 ? 1 : 0) - (playerCount >= 6 ? 1 : 0)}人</li>
                    </>
                  ) : (
                    <>
                      <li>💩 拉屎的人：{Math.max(2, Math.floor(playerCount * 0.15))}人 (15%)</li>
                      <li>🍯 尿瓶子的人：{Math.max(1, Math.floor(playerCount * 0.1))}人 (10%，隐藏角色)</li>
                      <li>🐕‍🦺 警犬：{Math.max(2, Math.floor(playerCount * 0.1))}人 (10%)</li>
                      <li>🧹 保洁员：{Math.max(2, Math.floor(playerCount * 0.1))}人 (10%)</li>
                      <li>🤰 孕妇：约{playerCount - Math.max(2, Math.floor(playerCount * 0.15)) - Math.max(1, Math.floor(playerCount * 0.1)) - Math.max(2, Math.floor(playerCount * 0.1)) - Math.max(2, Math.floor(playerCount * 0.1))}人 (55%)</li>
                    </>
                  )}
                </ul>
                
                {playerCount >= 6 && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-xs text-yellow-700">
                      <strong>🤫 隐藏要素：</strong>尿瓶子的人知道拉屎的人是谁，但拉屎的人不知道尿瓶子的人的身份。
                                             他们是同伙，目标是让所有好人取消参赛资格！
                    </p>
                  </div>
                )}
             </div>
          </div>
          
          <button 
            onClick={() => initGame(playerCount, selectedRole)}
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
      {/* 游戏标题 */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">💩 找屎大作战 💩</h1>
      </div>
      
      <div className="max-w-7xl mx-auto">
        {/* 游戏状态栏 */}
        <div className="bg-white/90 backdrop-blur rounded-2xl p-4 mb-4 shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <div className="text-lg font-semibold">
                第 <span className="text-2xl text-orange-600">{gameState.currentRound}</span> 轮
              </div>
              <div className={`px-4 py-2 rounded-full text-white font-bold ${
                gameState.phase === 'day' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gradient-to-r from-blue-600 to-purple-600'
              }`}>
                {gameState.phase === 'day' ? '🌅 白天阶段' : '🌙 夜晚阶段'}
              </div>
            </div>
            {userPlayer && (
              <div className="flex items-center gap-2">
                <span className="text-gray-600">你的角色：</span>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-white ${ROLE_CONFIGS[userPlayer.role].color}`}>
                  <span className="text-xl">{ROLE_CONFIGS[userPlayer.role].emoji}</span>
                  <span className="font-bold">{ROLE_CONFIGS[userPlayer.role].name}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧 - 游戏主区域 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 玩家网格 */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">游戏参与者</h3>
                <div className="text-sm text-gray-500">
                  剩余 {alivePlayers.length} / {gameState.players.length} 人
                </div>
              </div>
              
              <div className={`${
                gameState.players.length > 20 ? 'max-h-96 overflow-y-auto pr-2' : ''
              }`}>
                <div className={`grid gap-4 ${
                  gameState.players.length > 50 
                    ? 'grid-cols-4 md:grid-cols-6 lg:grid-cols-8' 
                    : gameState.players.length > 20 
                    ? 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
                    : 'grid-cols-2 md:grid-cols-3'
                }`}>
                  {gameState.players.map((player) => (
                    <PlayerCard 
                      key={player.id}
                      player={player}
                      isSelectable={!!selectedAction && player.isAlive && player.id !== gameState.currentPlayerId}
                      onSelect={handlePlayerSelect}
                      showRole={gameState.gameResult !== null || player.id === gameState.currentPlayerId}
                      isCurrentPlayer={player.id === gameState.currentPlayerId}
                      compact={gameState.players.length > 20}
                    />
                  ))}
                </div>
              </div>
              
              {/* 尿瓶子的人特殊信息 */}
              {userPlayer?.role === 'peebottler' && pooperPlayer && (
                <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🤫</span>
                    <h4 className="font-bold text-yellow-800">隐藏信息</h4>
                  </div>
                  <p className="text-yellow-700">
                    你知道 <span className="font-bold text-yellow-900">{pooperPlayer.name}</span> 是拉屎的人！
                    你们是同伙，目标是让所有好人取消参赛资格。
                  </p>
                </div>
              )}
            </div>
            
            {/* 行动区域 */}
            {!gameState.gameResult && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                {userPlayer?.isAlive ? (
                  <>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      {gameState.phase === 'day' ? '🌞 白天行动' : '🌙 夜晚行动'}
                    </h3>
                
                {isProcessing && (
                  <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                    <p className="text-yellow-800 font-semibold flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      其他玩家正在行动中...
                    </p>
                  </div>
                )}
                
                {selectedAction && !isProcessing && (
                  <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                    <p className="text-blue-800 font-semibold">
                      👆 请点击上方玩家头像来{
                        selectedAction === 'vote' ? '投票' :
                        selectedAction === 'dogCheck' ? '检查身份' :
                        selectedAction === 'cleanerProtect' ? '保护' :
                        '恶心'
                      }
                    </p>
                  </div>
                )}
                
                {gameState.phase === 'day' && (
                  <div className="space-y-3">
                    <button 
                      onClick={() => !isProcessing && setSelectedAction('vote')}
                      disabled={isProcessing}
                      className={`w-full py-3 px-6 rounded-xl font-bold text-lg transition-all ${
                        isProcessing 
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                          : selectedAction === 'vote' 
                            ? 'bg-red-600 text-white scale-105 shadow-lg' 
                            : 'bg-red-500 hover:bg-red-600 text-white hover:scale-105 hover:shadow-lg'
                      }`}
                    >
                      {isProcessing ? '⏳ 处理中...' : '🗳️ 投票取消参赛资格'}
                    </button>
                  </div>
                )}
                
                {gameState.phase === 'night' && (
                  <div className="space-y-3">
                    {canUseAbility('dogCheck') && (
                      <button 
                        onClick={() => !isProcessing && setSelectedAction('dogCheck')}
                        disabled={isProcessing}
                        className={`w-full py-3 px-6 rounded-xl font-bold text-lg transition-all ${
                          isProcessing 
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            : selectedAction === 'dogCheck'
                              ? 'bg-blue-600 text-white scale-105 shadow-lg'
                              : 'bg-blue-500 hover:bg-blue-600 text-white hover:scale-105 hover:shadow-lg'
                        }`}
                      >
                        {isProcessing ? '⏳ 处理中...' : '🐕‍🦺 检查身份'}
                      </button>
                    )}
                    
                    {canUseAbility('cleanerProtect') && (
                      <button 
                        onClick={() => !isProcessing && setSelectedAction('cleanerProtect')}
                        disabled={isProcessing}
                        className={`w-full py-3 px-6 rounded-xl font-bold text-lg transition-all ${
                          isProcessing 
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            : selectedAction === 'cleanerProtect'
                              ? 'bg-green-600 text-white scale-105 shadow-lg'
                              : 'bg-green-500 hover:bg-green-600 text-white hover:scale-105 hover:shadow-lg'
                        }`}
                      >
                        {isProcessing ? '⏳ 处理中...' : '🧹 保护孕妇'}
                      </button>
                    )}
                    
                    {canUseAbility('pooperAction') && (
                      <button 
                        onClick={() => !isProcessing && setSelectedAction('pooperAction')}
                        disabled={isProcessing}
                        className={`w-full py-3 px-6 rounded-xl font-bold text-lg transition-all ${
                          isProcessing 
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            : selectedAction === 'pooperAction'
                              ? 'bg-red-600 text-white scale-105 shadow-lg'
                              : 'bg-red-500 hover:bg-red-600 text-white hover:scale-105 hover:shadow-lg'
                        }`}
                      >
                        {isProcessing ? '⏳ 处理中...' : '💩 恶心孕妇'}
                      </button>
                    )}
                    
                    {allNightActionsComplete() && (
                      <button 
                        onClick={nextPhase}
                        className="w-full py-3 px-6 rounded-xl font-bold text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-all hover:scale-105 hover:shadow-lg"
                      >
                        ☀️ 进入白天
                      </button>
                    )}
                  </div>
                )}
                  </>
                ) : (
                  // 观战模式
                  <div className="text-center">
                    <div className="text-6xl mb-4">👻</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">观战模式</h3>
                    <p className="text-gray-600">你已被取消参赛资格，正在观看游戏进行...</p>
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500">
                        {gameState.phase === 'day' ? '其他玩家正在投票...' : '夜晚行动进行中...'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* 右侧 - 信息区域 */}
          <div className="space-y-6">
            {/* 角色详情 */}
            {userPlayer && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4">角色信息</h3>
                <div className="text-center">
                  <div className="text-6xl mb-3">{ROLE_CONFIGS[userPlayer.role].emoji}</div>
                  <h4 className="text-xl font-bold text-gray-800 mb-2">{ROLE_CONFIGS[userPlayer.role].name}</h4>
                  <p className="text-sm text-gray-600">{ROLE_CONFIGS[userPlayer.role].description}</p>
                  
                  {/* 死亡状态显示 */}
                  {!userPlayer.isAlive && (
                    <div className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded-xl">
                      <div className="text-3xl mb-2">💀</div>
                      <p className="text-gray-700 font-bold">已取消参赛资格</p>
                      <p className="text-xs text-gray-600 mt-1">请静观其变，等待游戏结束</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            
            {/* 游戏历史 */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-gray-800 mb-4">游戏记录</h3>
              <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                {gameState.actionHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">暂无记录</p>
                ) : (
                  gameState.actionHistory.map((action, index) => (
                    <div 
                      key={index} 
                      className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-gray-400 text-xs mt-0.5">{index + 1}.</span>
                        <span className="flex-1 whitespace-pre-wrap">{action}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* 游戏结束弹窗 */}
        {gameState.gameResult && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-bounce-in">
              <div className="text-center">
                <div className="text-6xl mb-4">
                  {gameState.gameResult === 'goodWin' ? '🎉' : '💩'}
                </div>
                <h2 className="text-3xl font-bold mb-4">
                  {gameState.gameResult === 'goodWin' ? '好人获胜！' : '邪恶阵营获胜！'}
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  {gameState.gameResult === 'goodWin' 
                    ? '成功找出了拉屎的人！' 
                    : '拉屎的人和尿瓶子的人笑到了最后！'
                  }
                </p>
                
                {/* 显示所有角色 */}
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-600 mb-3">角色揭晓</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {gameState.players.map(player => (
                      <div key={player.id} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded-lg">
                        <span className="text-lg">{ROLE_CONFIGS[player.role].emoji}</span>
                        <span className={player.isAlive ? '' : 'line-through text-gray-400'}>
                          {player.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    setSelectedAction(null);
                    initGame(playerCount);
                  }}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-3 px-8 rounded-xl text-lg transition-all hover:scale-105 hover:shadow-lg"
                >
                  🎮 再来一局
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 