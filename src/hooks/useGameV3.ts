import { useReducer, useCallback, useEffect } from 'react';
import {
  GameStateV3,
  GameEventV3,
  GamePhaseV3,
  ActionType,
  getRequiredActors,
  isActionCollectionComplete,
  settleDayVotes,
  settleNightActions,
  checkGameOver
} from '../types/gameV3';
import { initializePlayersV3 } from '../utils/gameUtilsV3';
import { getAIVoteTargetV3, getAINightActionV3 } from '../utils/aiLogicV3';

// 初始状态
const initialState: GameStateV3 = {
  gameId: '',
  gameMode: 'classic',
  currentDay: 0,
  currentPhase: 'gameStart',
  players: [],
  humanPlayerId: 'player-0',
  currentDayVotes: null,
  currentNightActions: null,
  lastDaySettlement: null,
  lastNightSettlement: null,
  actionHistory: [],
  dayLogs: [],
  winner: null,
  gameEndReason: null
};

// Reducer
function gameReducer(state: GameStateV3, event: GameEventV3): GameStateV3 {
  console.log('🎮 Game Event:', event.type, event);
  
  switch (event.type) {
    case 'START_GAME': {
      const players = initializePlayersV3(event.config.playerCount, event.config.selectedRole);
      return {
        ...initialState,
        gameId: `game-${Date.now()}`,
        gameMode: event.config.playerCount > 10 ? 'battle-royale' : 'classic',
        currentDay: 1,
        currentPhase: 'nightBegin',
        players,
        actionHistory: ['游戏开始！', '第1天 - 夜晚降临...']
      };
    }
    
    case 'NEXT_PHASE': {
      const phaseTransitions: Record<GamePhaseV3, GamePhaseV3> = {
        gameStart: 'nightBegin',
        nightBegin: 'nightAction',
        nightAction: 'nightSettlement',
        nightSettlement: 'dayBegin',
        dayBegin: 'dayDiscussion',
        dayDiscussion: 'dayVoting',
        dayVoting: 'daySettlement',
        daySettlement: 'nightBegin',
        gameOver: 'gameOver'
      };
      
      const nextPhase = phaseTransitions[state.currentPhase];
      if (!nextPhase || nextPhase === state.currentPhase) return state;
      
      const updates: Partial<GameStateV3> = { currentPhase: nextPhase };
      
      // 根据新阶段初始化数据
      switch (nextPhase) {
        case 'nightBegin':
          // 如果是从白天结算过来，增加天数
          if (state.currentPhase === 'daySettlement') {
            updates.currentDay = state.currentDay + 1;
            updates.actionHistory = [
              ...state.actionHistory,
              `\n第${state.currentDay + 1}天 - 夜晚降临...`
            ];
          }
          break;
          
        case 'nightAction':
          // 初始化夜晚行动收集
          const nightActors = getRequiredActors('nightAction', state.players);
          updates.currentNightActions = {
            protectActions: new Map(),
            checkActions: new Map(),
            disgustActions: new Map(),
            submittedActors: new Set(),
            requiredActors: nightActors
          };
          updates.actionHistory = [
            ...state.actionHistory,
            '🌙 特殊角色开始行动...'
          ];
          break;
          
        case 'dayBegin':
          updates.actionHistory = [
            ...state.actionHistory,
            '☀️ 天亮了...'
          ];
          // 显示昨晚的结果
          if (state.lastNightSettlement) {
            updates.actionHistory = [
              ...updates.actionHistory,
              ...state.lastNightSettlement.settlementLog
            ];
          }
          break;
          
        case 'dayVoting':
          // 初始化投票收集
          const voters = getRequiredActors('dayVoting', state.players);
          updates.currentDayVotes = {
            votes: new Map(),
            submittedVoters: new Set(),
            requiredVoters: voters
          };
          updates.actionHistory = [
            ...state.actionHistory,
            '🗳️ 开始投票...'
          ];
          break;
      }
      
      return { ...state, ...updates };
    }
    
    case 'SUBMIT_VOTE': {
      if (!state.currentDayVotes) return state;
      
      const newVotes = {
        ...state.currentDayVotes,
        votes: new Map(state.currentDayVotes.votes),
        submittedVoters: new Set(state.currentDayVotes.submittedVoters)
      };
      
      newVotes.votes.set(event.voterId, event.targetId);
      newVotes.submittedVoters.add(event.voterId);
      
      // 如果是玩家投票，记录到历史
      if (event.voterId === state.humanPlayerId) {
        const target = state.players.find(p => p.id === event.targetId);
        return {
          ...state,
          currentDayVotes: newVotes,
          actionHistory: [...state.actionHistory, `你投票给了 ${target?.name}`]
        };
      }
      
      return { ...state, currentDayVotes: newVotes };
    }
    
    case 'SUBMIT_NIGHT_ACTION': {
      if (!state.currentNightActions) return state;
      
      const { action } = event;
      const newActions = {
        ...state.currentNightActions,
        protectActions: new Map(state.currentNightActions.protectActions),
        checkActions: new Map(state.currentNightActions.checkActions),
        disgustActions: new Map(state.currentNightActions.disgustActions),
        submittedActors: new Set(state.currentNightActions.submittedActors)
      };
      
      // 根据行动类型记录
      switch (action.actionType) {
        case 'protect':
          newActions.protectActions.set(action.actorId, action.targetId);
          break;
        case 'check':
          newActions.checkActions.set(action.actorId, action.targetId);
          break;
        case 'disgust':
          newActions.disgustActions.set(action.actorId, action.targetId);
          break;
      }
      
      newActions.submittedActors.add(action.actorId);
      
      // 如果是玩家行动，记录到历史
      if (action.actorId === state.humanPlayerId) {
        const target = state.players.find(p => p.id === action.targetId);
        const actionText: Record<string, string> = {
          protect: `你选择保护 ${target?.name}`,
          check: `你选择检查 ${target?.name}`,
          disgust: `你选择恶心 ${target?.name}`
        };
        return {
          ...state,
          currentNightActions: newActions,
          actionHistory: [...state.actionHistory, actionText[action.actionType] || '']
        };
      }
      
      return { ...state, currentNightActions: newActions };
    }
    
    case 'SETTLE_DAY': {
      if (!state.currentDayVotes) return state;
      
      // 结算投票
      const settlement = settleDayVotes(state.currentDayVotes, state.players);
      
      // 更新玩家状态
      const newPlayers = state.players.map(p => ({
        ...p,
        isAlive: p.id === settlement.eliminatedPlayerId ? false : p.isAlive,
        deathCause: p.id === settlement.eliminatedPlayerId 
          ? (settlement.wasTiedVote ? 'tied-vote' : 'voted')
          : p.deathCause,
        deathDay: p.id === settlement.eliminatedPlayerId ? state.currentDay : p.deathDay,
        votesReceived: settlement.voteCount.get(p.id) || p.votesReceived
      }));
      
      // 记录结算结果
      const eliminatedPlayer = state.players.find(p => p.id === settlement.eliminatedPlayerId);
      const actionHistory = [
        ...state.actionHistory,
        '\n📊 投票结果：',
        ...Array.from(settlement.voteCount.entries())
          .sort(([,a], [,b]) => b - a)
          .map(([playerId, count]) => {
            const player = state.players.find(p => p.id === playerId);
            const voters = settlement.voteDetails.get(playerId) || [];
            const voterNames = voters.map(vid => 
              state.players.find(p => p.id === vid)?.name
            ).filter(Boolean).join('、');
            return `  ${player?.name}: ${count}票 (${voterNames})`;
          }),
        eliminatedPlayer ? `\n❌ ${eliminatedPlayer.name} 被投票淘汰！${settlement.wasTiedVote ? '（平票随机）' : ''}` : ''
      ];
      
      // 检查游戏是否结束
      const gameOverCheck = checkGameOver(newPlayers);
      if (gameOverCheck.isOver) {
        return {
          ...state,
          currentPhase: 'gameOver',
          players: newPlayers,
          lastDaySettlement: settlement,
          currentDayVotes: null,
          actionHistory,
          winner: gameOverCheck.winner,
          gameEndReason: gameOverCheck.reason
        };
      }
      
      return {
        ...state,
        players: newPlayers,
        lastDaySettlement: settlement,
        currentDayVotes: null,
        actionHistory,
        currentPhase: 'daySettlement' // 进入结算阶段，会自动转到 nightBegin
      };
    }
    
    case 'SETTLE_NIGHT': {
      if (!state.currentNightActions) return state;
      
      // 结算夜晚行动
      const settlement = settleNightActions(state.currentNightActions, state.players);
      
      // 更新玩家状态
      const newPlayers = state.players.map(p => ({
        ...p,
        isAlive: settlement.actualDeaths.includes(p.id) ? false : p.isAlive,
        checkedByDog: settlement.checkedResults.has(p.id) || p.checkedByDog,
        lastCheckedResult: settlement.checkedResults.get(p.id) ?? p.lastCheckedResult,
        deathCause: settlement.actualDeaths.includes(p.id) ? 'disgusted' : p.deathCause,
        deathDay: settlement.actualDeaths.includes(p.id) ? state.currentDay : p.deathDay
      }));
      
      // 记录结算结果（但不立即显示给玩家）
      const actionHistory = [...state.actionHistory];
      
      // 如果玩家是警犬，显示检查结果
      const humanPlayer = state.players.find(p => p.id === state.humanPlayerId);
      if (humanPlayer?.role === 'dog') {
        const checkResult = settlement.checkedResults.get(state.humanPlayerId);
        if (checkResult !== undefined) {
          const target = state.players.find(p => 
            state.currentNightActions?.checkActions.get(state.humanPlayerId) === p.id
          );
          actionHistory.push(
            `🐕‍🦺 检查结果：${target?.name} ${checkResult ? '是拉屎的人！' : '不是拉屎的人'}`
          );
        }
      }
      
      // 检查游戏是否结束
      const gameOverCheck = checkGameOver(newPlayers);
      if (gameOverCheck.isOver) {
        return {
          ...state,
          currentPhase: 'gameOver',
          players: newPlayers,
          lastNightSettlement: settlement,
          currentNightActions: null,
          actionHistory: [
            ...actionHistory,
            ...settlement.settlementLog,
            gameOverCheck.reason
          ],
          winner: gameOverCheck.winner,
          gameEndReason: gameOverCheck.reason
        };
      }
      
      return {
        ...state,
        players: newPlayers,
        lastNightSettlement: settlement,
        currentNightActions: null,
        actionHistory,
        currentPhase: 'nightSettlement' // 进入结算阶段，会自动转到 dayBegin
      };
    }
    
    default:
      return state;
  }
}

// Hook
export function useGameV3() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  // 开始游戏
  const startGame = useCallback((playerCount: number, selectedRole?: string) => {
    dispatch({
      type: 'START_GAME',
      config: {
        playerCount,
        selectedRole,
        showDetailedVotes: true,
        enableDeathAnimation: true,
        actionTimeout: 30000,
        settlementDelay: 3000
      }
    });
  }, []);
  
  // 提交投票
  const submitVote = useCallback((targetId: string) => {
    if (state.currentPhase !== 'dayVoting') return;
    dispatch({
      type: 'SUBMIT_VOTE',
      voterId: state.humanPlayerId,
      targetId
    });
  }, [state.currentPhase, state.humanPlayerId]);
  
  // 提交夜晚行动
  const submitNightAction = useCallback((targetId: string, actionType: 'protect' | 'check' | 'disgust') => {
    if (state.currentPhase !== 'nightAction') return;
    dispatch({
      type: 'SUBMIT_NIGHT_ACTION',
      action: {
        actorId: state.humanPlayerId,
        targetId,
        actionType,
        timestamp: Date.now()
      }
    });
  }, [state.currentPhase, state.humanPlayerId]);
  
  // 进入下一阶段
  const nextPhase = useCallback(() => {
    dispatch({ type: 'NEXT_PHASE' });
  }, []);
  
  // 自动进入下一阶段（非交互阶段）
  useEffect(() => {
    const autoAdvancePhases: GamePhaseV3[] = [
      'nightBegin', 'nightSettlement', 'dayBegin', 'dayDiscussion', 'daySettlement'
    ];
    
    if (autoAdvancePhases.includes(state.currentPhase)) {
      const delay = ['nightSettlement', 'daySettlement'].includes(state.currentPhase) ? 3000 : 2000;
      const timer = setTimeout(() => nextPhase(), delay);
      return () => clearTimeout(timer);
    }
  }, [state.currentPhase, nextPhase]);
  
  // 检查是否需要结算
  useEffect(() => {
    if (state.currentPhase === 'dayVoting' && isActionCollectionComplete('dayVoting', state)) {
      setTimeout(() => dispatch({ type: 'SETTLE_DAY' }), 1000);
    } else if (state.currentPhase === 'nightAction' && isActionCollectionComplete('nightAction', state)) {
      setTimeout(() => dispatch({ type: 'SETTLE_NIGHT' }), 1000);
    }
  }, [state]);
  
  // AI自动行动
  useEffect(() => {
    if (state.currentPhase === 'dayVoting' && state.currentDayVotes) {
      const aiVoters = state.players.filter(p => 
        p.isAI && 
        p.isAlive && 
        !state.currentDayVotes!.submittedVoters.has(p.id)
      );
      
      aiVoters.forEach((voter, index) => {
        setTimeout(() => {
          const target = getAIVoteTargetV3(voter, state);
          if (target) {
            dispatch({
              type: 'SUBMIT_VOTE',
              voterId: voter.id,
              targetId: target
            });
          }
        }, 1000 + index * 500);
      });
    } else if (state.currentPhase === 'nightAction' && state.currentNightActions) {
      const aiActors = state.players.filter(p => 
        p.isAI && 
        p.isAlive && 
        state.currentNightActions!.requiredActors.has(p.id) &&
        !state.currentNightActions!.submittedActors.has(p.id)
      );
      
      aiActors.forEach((actor, index) => {
        setTimeout(() => {
          const action = getAINightActionV3(actor, state);
          if (action) {
            dispatch({
              type: 'SUBMIT_NIGHT_ACTION',
              action: {
                actorId: actor.id,
                targetId: action.targetId,
                actionType: action.type as ActionType,
                timestamp: Date.now()
              }
            });
          }
        }, 1000 + index * 500);
      });
    }
  }, [state.currentPhase, state.currentDayVotes, state.currentNightActions, state.players, state]);
  
  // 返回接口
  const humanPlayer = state.players.find(p => p.id === state.humanPlayerId);
  const canAct = (
    (state.currentPhase === 'dayVoting' && state.currentDayVotes?.requiredVoters.has(state.humanPlayerId)) ||
    (state.currentPhase === 'nightAction' && state.currentNightActions?.requiredActors.has(state.humanPlayerId))
  ) && !state.currentDayVotes?.submittedVoters.has(state.humanPlayerId) &&
    !state.currentNightActions?.submittedActors.has(state.humanPlayerId);
  
  return {
    gameState: state,
    startGame,
    submitVote,
    submitNightAction,
    nextPhase,
    
    // 便利属性
    humanPlayer,
    canAct,
    isGameOver: state.currentPhase === 'gameOver',
    currentDay: state.currentDay,
    alivePlayers: state.players.filter(p => p.isAlive),
    
    // 进度信息
    voteProgress: state.currentDayVotes ? {
      submitted: state.currentDayVotes.submittedVoters.size,
      total: state.currentDayVotes.requiredVoters.size
    } : null,
    nightActionProgress: state.currentNightActions ? {
      submitted: state.currentNightActions.submittedActors.size,
      total: state.currentNightActions.requiredActors.size
    } : null
  };
}