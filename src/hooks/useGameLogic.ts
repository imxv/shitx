import { useState, useCallback } from 'react';
import { GameState, Player, PlayerRole, GamePhase } from '@/types/game';

const PLAYER_NAMES = [
  '艾莉娅·星月',
  '塞琳娜·紫薇', 
  '露西亚·梦幻',
  '伊莎贝拉·天使',
  '薇薇安·玫瑰',
  '奥菲莉亚·水晶',
  '安吉丽娜·彩虹',
  '克莉丝汀·雪花',
  '莉莉丝·蝴蝶',
  '黛安娜·月光'
];

export const useGameLogic = () => {
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    phase: 'day',
    currentRound: 1,
    currentPlayerId: null,
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
  const initGame = useCallback((playerCount: number = 6) => {
    // 根据玩家数量动态分配角色
    const generateRoles = (count: number): PlayerRole[] => {
      const roles: PlayerRole[] = ['pooper']; // 至少有一个拉屎的人
      
      // 添加隐藏角色：尿瓶子的人 (6人以上才出现)
      if (count >= 6) roles.push('peebottler');
      
      // 添加功能角色
      if (count >= 4) roles.push('dog'); // 4人以上有警犬
      if (count >= 5) roles.push('cleaner'); // 5人以上有保洁员
      
      // 剩余位置都是孕妇
      while (roles.length < count) {
        roles.push('pregnant');
      }
      
      return roles;
    };
    
    const roles = generateRoles(playerCount);
    const shuffledRoles = [...roles].sort(() => Math.random() - 0.5);
    
    const players: Player[] = PLAYER_NAMES.slice(0, playerCount).map((name, index) => ({
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

  // 投票取消参赛资格
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
        actionHistory: [...prev.actionHistory, `${votedPlayer?.name} 被投票取消参赛资格！`]
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
        actionText = `${target?.name} 被恶心得孕吐取消参赛资格了！`;
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
      const alivePeebottler = alivePlayers.find(p => p.role === 'peebottler');
      const aliveGoodGuys = alivePlayers.filter(p => p.role === 'pregnant' || p.role === 'dog' || p.role === 'cleaner');
      
      let gameResult: 'pooperWin' | 'goodWin' | null = null;
      
      // 如果拉屎的人被投票取消参赛资格，好人获胜
      if (!alivePooper) {
        gameResult = 'goodWin';
      } 
      // 如果所有好人都取消参赛资格了，拉屎的人和尿瓶子的人获胜
      else if (aliveGoodGuys.length === 0) {
        gameResult = 'pooperWin';
      }
      
      if (gameResult) {
        return {
          ...prev,
          phase: 'gameOver' as GamePhase,
          gameResult,
                  actionHistory: [...prev.actionHistory, 
          gameResult === 'goodWin' ? '好人获胜！拉屎的人被找出来了！' : '邪恶阵营获胜！拉屎的人和尿瓶子的人笑到了最后！'
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