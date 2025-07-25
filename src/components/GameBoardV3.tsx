'use client';

import { useGameV3 } from '@/hooks/useGameV3';
import { PlayerCardV3 } from './PlayerCardV3';
import { ROLE_CONFIGS, PlayerRole } from '@/types/game';
import { useState } from 'react';

interface GameBoardV3Props {
  onReturnHome?: () => void;
  gameConfig?: {
    playerCount: number;
    selectedRole: PlayerRole | 'random';
  };
}

export const GameBoardV3 = ({ onReturnHome, gameConfig }: GameBoardV3Props) => {
  const { 
    gameState, 
    startGame, 
    submitVote, 
    submitNightAction,
    humanPlayer,
    canAct,
    isGameOver,
    currentDay,
    alivePlayers,
    voteProgress,
    nightActionProgress
  } = useGameV3();
  
  const [selectedAction, setSelectedAction] = useState<'vote' | 'protect' | 'check' | 'disgust' | null>(null);
  const [playerCount, setPlayerCount] = useState<number>(gameConfig?.playerCount || 6);
  
  const pooperPlayer = gameState.players.find(p => p.role === 'pooper');
  
  // 处理玩家选择目标
  const handlePlayerSelect = (playerId: string) => {
    if (!selectedAction || !canAct) return;
    
    switch (selectedAction) {
      case 'vote':
        submitVote(playerId);
        break;
      case 'protect':
      case 'check':
      case 'disgust':
        submitNightAction(playerId, selectedAction as 'protect' | 'check' | 'disgust');
        break;
    }
    setSelectedAction(null);
  };
  
  // 获取当前阶段的中文描述
  const getPhaseDescription = () => {
    const phaseDescriptions = {
      gameStart: '准备开始',
      nightBegin: '夜晚降临',
      nightAction: '夜晚行动',
      nightSettlement: '夜晚结算',
      dayBegin: '天亮了',
      dayDiscussion: '白天讨论',
      dayVoting: '投票阶段',
      daySettlement: '投票结算',
      gameOver: '游戏结束'
    };
    return phaseDescriptions[gameState.currentPhase] || gameState.currentPhase;
  };
  
  // 获取行动按钮配置
  const getActionButtons = () => {
    if (!humanPlayer?.isAlive || !canAct) return [];
    
    if (gameState.currentPhase === 'dayVoting') {
      return [{
        id: 'vote',
        label: '🗳️ 投票取消参赛资格',
        enabled: true
      }];
    }
    
    if (gameState.currentPhase === 'nightAction') {
      switch (humanPlayer.role) {
        case 'dog':
          return [{
            id: 'check',
            label: '🔍 检查身份',
            enabled: true
          }];
        case 'cleaner':
          return [{
            id: 'protect',
            label: '🛡️ 保护玩家',
            enabled: true
          }];
        case 'pooper':
          return [{
            id: 'disgust',
            label: '💩 恶心玩家',
            enabled: true
          }];
        default:
          return [];
      }
    }
    
    return [];
  };
  
  // 游戏未开始的界面
  if (gameState.currentPhase === 'gameStart') {
    const actualPlayerCount = gameConfig?.playerCount || playerCount;
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-yellow-100 p-4">
        <div className="max-w-2xl mx-auto">
          {/* 返回按钮 */}
          {onReturnHome && (
            <button
              onClick={onReturnHome}
              className="mb-6 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
            >
              ← 返回主页
            </button>
          )}
          
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <h1 className="text-5xl font-bold text-center mb-4">💩 找屎游戏 💩</h1>
            <p className="text-xl text-gray-600 text-center mb-8">百人大逃杀版</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  玩家数量：{actualPlayerCount}人
                </label>
                {!gameConfig && (
                  <>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={playerCount}
                      onChange={(e) => setPlayerCount(Number(e.target.value))}
                      className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>5人</span>
                      <span>50人</span>
                      <span>100人</span>
                    </div>
                  </>
                )}
              </div>
              
              {/* 显示选中的角色 */}
              {gameConfig?.selectedRole && gameConfig.selectedRole !== 'random' && (
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">你选择的角色：</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl">{ROLE_CONFIGS[gameConfig.selectedRole].emoji}</span>
                    <span className="font-bold">{ROLE_CONFIGS[gameConfig.selectedRole].name}</span>
                  </div>
                </div>
              )}
              
              <button
                onClick={() => startGame(actualPlayerCount, gameConfig?.selectedRole)}
                className="w-full py-4 px-6 bg-yellow-500 hover:bg-yellow-600 text-white text-xl font-bold rounded-2xl transform hover:scale-105 transition-all shadow-lg"
              >
                开始游戏
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // 游戏进行中的界面
  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-yellow-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 返回按钮 */}
        {onReturnHome && (
          <button
            onClick={onReturnHome}
            className="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
          >
            ← 返回主页
          </button>
        )}
        
        {/* 顶部状态栏 */}
        <div className="bg-white rounded-2xl p-4 mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold">第 {currentDay} 天</h2>
              <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {getPhaseDescription()}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              剩余 {alivePlayers.length} / {gameState.players.length} 人
            </div>
          </div>
          
          {/* 进度条 */}
          {voteProgress && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>投票进度</span>
                <span>{voteProgress.submitted}/{voteProgress.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${(voteProgress.submitted / voteProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
          
          {nightActionProgress && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>夜晚行动进度</span>
                <span>{nightActionProgress.submitted}/{nightActionProgress.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all"
                  style={{ width: `${(nightActionProgress.submitted / nightActionProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧 - 游戏主区域 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 玩家网格 */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4">游戏参与者</h3>
              
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
                    <PlayerCardV3 
                      key={player.id}
                      player={player}
                      isSelectable={!!selectedAction && player.isAlive && player.id !== gameState.humanPlayerId}
                      onSelect={handlePlayerSelect}
                      showRole={isGameOver || player.id === gameState.humanPlayerId}
                      isCurrentPlayer={player.id === gameState.humanPlayerId}
                      compact={gameState.players.length > 20}
                    />
                  ))}
                </div>
              </div>
              
              {/* 尿在瓶子的人特殊信息 */}
              {humanPlayer?.role === 'peebottler' && pooperPlayer && (
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
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4">行动面板</h3>
              
              {/* 行动按钮 */}
              <div className="space-y-3">
                {getActionButtons().map(button => (
                  <button
                    key={button.id}
                    onClick={() => setSelectedAction(button.id as 'vote' | 'protect' | 'check' | 'disgust')}
                    disabled={!button.enabled || selectedAction === button.id}
                    className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${
                      selectedAction === button.id
                        ? 'bg-blue-600 text-white scale-105 shadow-lg'
                        : button.enabled
                        ? 'bg-blue-500 hover:bg-blue-600 text-white hover:scale-105 hover:shadow-lg'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {button.label}
                  </button>
                ))}
              </div>
              
              {/* 等待其他玩家 */}
              {!canAct && humanPlayer?.isAlive && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl text-center">
                  <div className="text-3xl mb-2">⏳</div>
                  <p className="text-gray-600">等待其他玩家行动...</p>
                </div>
              )}
              
              {/* 观战模式 */}
              {!humanPlayer?.isAlive && !isGameOver && (
                <div className="text-center">
                  <div className="text-6xl mb-4">👻</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">观战模式</h3>
                  <p className="text-gray-600">你已被取消参赛资格，正在观看游戏进行...</p>
                </div>
              )}
            </div>
          </div>
          
          {/* 右侧 - 信息面板 */}
          <div className="space-y-6">
            {/* 角色信息 */}
            {humanPlayer && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4">你的角色</h3>
                <div className="text-center">
                  <div className="text-6xl mb-3">{ROLE_CONFIGS[humanPlayer.role].emoji}</div>
                  <h4 className="text-xl font-bold text-gray-800 mb-2">{ROLE_CONFIGS[humanPlayer.role].name}</h4>
                  <p className="text-sm text-gray-600">{ROLE_CONFIGS[humanPlayer.role].description}</p>
                  
                  {!humanPlayer.isAlive && (
                    <div className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded-xl">
                      <div className="text-3xl mb-2">💀</div>
                      <p className="text-gray-700 font-bold">已取消参赛资格</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* 阵亡名单 */}
            {gameState.players.filter(p => !p.isAlive).length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>💀 阵亡名单</span>
                  <span className="text-sm text-gray-500">({gameState.players.filter(p => !p.isAlive).length}人)</span>
                </h3>
                <div className="max-h-48 overflow-y-auto pr-2 space-y-2">
                  {gameState.players
                    .filter(p => !p.isAlive)
                    .sort((a, b) => (b.deathDay || 0) - (a.deathDay || 0))
                    .map(player => {
                      const deathCauseText = {
                        'voted': `被投票淘汰 (${player.votesReceived || 0}票)`,
                        'tied-vote': `平票随机淘汰 (${player.votesReceived || 0}票)`,
                        'disgusted': '被恶心死'
                      };
                      
                      return (
                        <div 
                          key={player.id} 
                          className="flex items-center justify-between p-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="opacity-50">{ROLE_CONFIGS[player.role].emoji}</span>
                            <span className="text-gray-600 line-through">{player.name}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            <span>第{player.deathDay}天</span>
                            <span className="mx-1">·</span>
                            <span>{deathCauseText[player.deathCause || 'voted']}</span>
                          </div>
                        </div>
                      );
                    })}
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
        {isGameOver && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-bounce-in">
              <div className="text-center">
                <div className="text-6xl mb-4">
                  {gameState.winner === 'good' ? '🎉' : '💩'}
                </div>
                <h2 className="text-3xl font-bold mb-4">
                  {gameState.winner === 'good' ? '好人获胜！' : '邪恶阵营获胜！'}
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  {gameState.gameEndReason}
                </p>
                
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl transform hover:scale-105 transition-all"
                >
                  再来一局
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};