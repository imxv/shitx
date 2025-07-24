import { useState, useCallback } from 'react';
import { GameState, Player, PlayerRole, GamePhase } from '@/types/game';

const PLAYER_NAMES = ['小王', '小李', '小张', '小刘', '小陈', '小赵'];

export const useGameLogic = () => {
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    phase: 'day',
    currentRound: 1,
    votedOutPlayer: null,
    nightActions: {
      dogCheck: null,
      cleanerProtect: null,
      pooperTarget: null
    },
    gameResult: null,
    actionHistory: []
  });

  // 初始化游戏
  const initGame = useCallback(() => {
    const roles: PlayerRole[] = ['pooper', 'pregnant', 'pregnant', 'dog', 'cleaner', 'pregnant'];
    const shuffledRoles = [...roles].sort(() => Math.random() - 0.5);
    
    const players: Player[] = PLAYER_NAMES.slice(0, 6).map((name, index) => ({
      id: `player-${index}`,
      name,
      role: shuffledRoles[index],
      isAlive: true,
      isProtected: false,
      wasChecked: false
    }));

    setGameState({
      players,
      phase: 'day',
      currentRound: 1,
      votedOutPlayer: null,
      nightActions: {
        dogCheck: null,
        cleanerProtect: null,
        pooperTarget: null
      },
      gameResult: null,
      actionHistory: ['游戏开始！厕所外发现了💩，要找出是谁拉的！']
    });
  }, []);

  // 投票出局
  const voteOut = useCallback((playerId: string) => {
    setGameState(prev => {
      const newPlayers = prev.players.map(p => 
        p.id === playerId ? { ...p, isAlive: false } : p
      );
      const votedPlayer = prev.players.find(p => p.id === playerId);
      
      return {
        ...prev,
        players: newPlayers,
        votedOutPlayer: playerId,
        phase: 'night' as GamePhase,
        actionHistory: [...prev.actionHistory, `${votedPlayer?.name} 被投票出局！`]
      };
    });
  }, []);

  // 警犬检查
  const dogCheck = useCallback((playerId: string) => {
    setGameState(prev => {
      const target = prev.players.find(p => p.id === playerId);
      const checkResult = target?.role === 'pooper' ? '是拉屎的人！' : '不是拉屎的人';
      
      return {
        ...prev,
        nightActions: {
          ...prev.nightActions,
          dogCheck: playerId
        },
        players: prev.players.map(p => 
          p.id === playerId ? { ...p, wasChecked: true } : p
        ),
        actionHistory: [...prev.actionHistory, `警犬检查了${target?.name}：${checkResult}`]
      };
    });
  }, []);

  // 保洁员保护
  const cleanerProtect = useCallback((playerId: string) => {
    setGameState(prev => {
      const target = prev.players.find(p => p.id === playerId);
      
      return {
        ...prev,
        nightActions: {
          ...prev.nightActions,
          cleanerProtect: playerId
        },
        players: prev.players.map(p => 
          p.id === playerId ? { ...p, isProtected: true } : { ...p, isProtected: false }
        ),
        actionHistory: [...prev.actionHistory, `保洁员保护了${target?.name}`]
      };
    });
  }, []);

  // 拉屎的人行动
  const pooperAction = useCallback((playerId: string) => {
    setGameState(prev => {
      const target = prev.players.find(p => p.id === playerId);
      const isProtected = target?.isProtected;
      
      let newPlayers = prev.players;
      let actionText = '';
      
      if (isProtected) {
        actionText = `拉屎的人试图恶心${target?.name}，但被保洁员保护了！`;
      } else {
        newPlayers = prev.players.map(p => 
          p.id === playerId ? { ...p, isAlive: false } : p
        );
        actionText = `${target?.name} 被恶心得孕吐出局了！`;
      }
      
      return {
        ...prev,
        nightActions: {
          ...prev.nightActions,
          pooperTarget: playerId
        },
        players: newPlayers,
        actionHistory: [...prev.actionHistory, actionText]
      };
    });
  }, []);

  // 进入下一阶段
  const nextPhase = useCallback(() => {
    setGameState(prev => {
      // 检查游戏结束条件
      const alivePlayers = prev.players.filter(p => p.isAlive);
      const alivePooper = alivePlayers.find(p => p.role === 'pooper');
      const alivePregnant = alivePlayers.filter(p => p.role === 'pregnant');
      
      let gameResult: 'pooperWin' | 'goodWin' | null = null;
      
      if (!alivePooper) {
        gameResult = 'goodWin';
      } else if (alivePregnant.length === 0) {
        gameResult = 'pooperWin';
      }
      
      if (gameResult) {
        return {
          ...prev,
          phase: 'gameOver' as GamePhase,
          gameResult,
          actionHistory: [...prev.actionHistory, 
            gameResult === 'goodWin' ? '好人获胜！拉屎的人被找出来了！' : '拉屎的人获胜！所有孕妇都出局了！'
          ]
        };
      }
      
      const nextPhase: GamePhase = prev.phase === 'day' ? 'night' : 'day';
      const nextRound = prev.phase === 'night' ? prev.currentRound + 1 : prev.currentRound;
      
      return {
        ...prev,
        phase: nextPhase,
        currentRound: nextRound,
        nightActions: {
          dogCheck: null,
          cleanerProtect: null,
          pooperTarget: null
        }
      };
    });
  }, []);

  return {
    gameState,
    initGame,
    voteOut,
    dogCheck,
    cleanerProtect,
    pooperAction,
    nextPhase
  };
}; 