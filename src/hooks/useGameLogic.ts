import { useState, useCallback } from 'react';
import { GameState, Player, PlayerRole, GamePhase, ROLE_CONFIGS } from '@/types/game';
import { generateUniqueNames } from '@/utils/nameGenerator';
import { collectAIVotes } from '@/utils/aiLogic';

export const useGameLogic = () => {
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    phase: 'day',
    currentRound: 1,
    currentPlayerId: null,
    currentActingPlayer: null,
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
  const initGame = useCallback((playerCount: number = 6, selectedRole: PlayerRole | 'random' = 'random') => {
    // 根据玩家数量动态分配角色
    const generateRoles = (count: number): PlayerRole[] => {
      const roles: PlayerRole[] = [];
      
      if (count <= 10) {
        // 小规模游戏：原有逻辑
        roles.push('pooper');
        if (count >= 6) roles.push('peebottler');
        if (count >= 4) roles.push('dog');
        if (count >= 5) roles.push('cleaner');
        while (roles.length < count) {
          roles.push('pregnant');
        }
      } else {
        // 大规模游戏（百人模式）：调整角色分配
        const pooperCount = Math.max(2, Math.floor(count * 0.15)); // 15%拉屎的人
        const peebottlerCount = Math.max(1, Math.floor(count * 0.1)); // 10%尿瓶子的人
        const dogCount = Math.max(2, Math.floor(count * 0.1)); // 10%警犬
        const cleanerCount = Math.max(2, Math.floor(count * 0.1)); // 10%保洁员
        
        // 添加角色
        for (let i = 0; i < pooperCount; i++) roles.push('pooper');
        for (let i = 0; i < peebottlerCount; i++) roles.push('peebottler');
        for (let i = 0; i < dogCount; i++) roles.push('dog');
        for (let i = 0; i < cleanerCount; i++) roles.push('cleaner');
        
        // 剩余都是孕妇
        while (roles.length < count) {
          roles.push('pregnant');
        }
      }
      
      return roles;
    };
    
    const roles = generateRoles(playerCount);
    
    // 处理玩家选择的角色
    let playerRoleIndex = 0;
    let actualPlayerRole: PlayerRole;
    
    if (selectedRole === 'random') {
      playerRoleIndex = Math.floor(Math.random() * playerCount);
      actualPlayerRole = roles[playerRoleIndex];
    } else {
      // 确保选择的角色在当前配置中存在
      const roleIndex = roles.indexOf(selectedRole);
      if (roleIndex !== -1) {
        playerRoleIndex = roleIndex;
        actualPlayerRole = selectedRole;
      } else {
        // 如果选择的角色不可用，随机分配
        playerRoleIndex = Math.floor(Math.random() * playerCount);
        actualPlayerRole = roles[playerRoleIndex];
      }
    }
    
    // 为其他玩家分配剩余角色
    const remainingRoles = [...roles];
    remainingRoles.splice(playerRoleIndex, 1);
    const shuffledRemainingRoles = remainingRoles.sort(() => Math.random() - 0.5);
    
    // 生成唯一的名字（排除第一个玩家）
    const aiNames = generateUniqueNames(playerCount - 1);
    
    // 创建玩家列表，第一个是玩家控制的角色
    const players: Player[] = [];
    let remainingRoleIndex = 0;
    
    for (let i = 0; i < playerCount; i++) {
      if (i === 0) {
        // 玩家控制的角色
        players.push({
          id: `player-0`,
          name: '你',
          role: actualPlayerRole,
          isAlive: true,
          isProtected: false,
          wasChecked: false
        });
      } else {
        // AI控制的角色
        players.push({
          id: `player-${i}`,
          name: aiNames[i-1],
          role: shuffledRemainingRoles[remainingRoleIndex++],
          isAlive: true,
          isProtected: false,
          wasChecked: false
        });
      }
    }
    
    const currentPlayerId = 'player-0'; // 玩家始终是 player-0

    setGameState({
      players,
      phase: 'night', // 从夜晚开始
      currentRound: 1,
      currentPlayerId,
      currentActingPlayer: null,
      votedOutPlayer: null,
      nightActions: {
        dogCheck: null,
        cleanerProtect: null,
        pooperTarget: null
      },
      gameResult: null,
      actionHistory: [`游戏开始！厕所外发现了💩，要找出是谁拉的！\n你扮演的是：${ROLE_CONFIGS[actualPlayerRole].name}`]
    });
  }, []);

  // 投票取消参赛资格
  const voteOut = useCallback((playerId: string) => {
    setGameState(prev => {
      const newPlayers = prev.players.map(p => 
        p.id === playerId ? { ...p, isAlive: false } : p
      );
      const votedPlayer = prev.players.find(p => p.id === playerId);
      
      // 判断是玩家投票还是AI投票结果
      const isPlayerVote = prev.players.find(p => p.id === prev.currentPlayerId)?.isAlive;
      const voteMessage = isPlayerVote 
        ? `你投票给了${votedPlayer?.name}，其他玩家也纷纷投票...`
        : `经过激烈的讨论...`;
      
      return {
        ...prev,
        players: newPlayers,
        votedOutPlayer: playerId,
        phase: 'night' as GamePhase,
        actionHistory: [...prev.actionHistory, voteMessage, `${votedPlayer?.name} 被投票取消参赛资格！`]
      };
    });
  }, []);

  // 玩家投票并收集AI投票
  const playerVoteWithAI = useCallback((playerId: string) => {
    setGameState(prev => {
      // 收集AI投票
      const voteResult = collectAIVotes(prev);
      
      // 将玩家的投票加入统计
      const playerVote = prev.currentPlayerId;
      if (playerVote) {
        voteResult.voteCounts[playerId] = (voteResult.voteCounts[playerId] || 0) + 1;
      }
      
      // 重新计算获胜者
      let maxVotes = 0;
      let winner: string | null = null;
      Object.entries(voteResult.voteCounts).forEach(([targetId, count]) => {
        if (count > maxVotes) {
          maxVotes = count;
          winner = targetId;
        }
      });
      
      // 生成投票记录
      const votedPlayer = prev.players.find(p => p.id === playerId);
      const actionHistory = [...prev.actionHistory];
      
      // 记录玩家投票
      actionHistory.push(`你投票给了${votedPlayer?.name}`);
      
      // 如果玩家多，只显示汇总信息
      if (prev.players.filter(p => p.isAlive).length > 10) {
        actionHistory.push(`\n📊 投票统计：`);
        
        // 按得票数排序显示
        const sortedVotes = Object.entries(voteResult.voteCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5); // 只显示前5名
        
        sortedVotes.forEach(([targetId, count]) => {
          const target = prev.players.find(p => p.id === targetId);
          if (target) {
            actionHistory.push(`  ${target.name}: ${count}票`);
          }
        });
        
        if (Object.keys(voteResult.voteCounts).length > 5) {
          actionHistory.push(`  ...还有其他${Object.keys(voteResult.voteCounts).length - 5}人获得票数`);
        }
      } else {
        // 人少时显示详细投票过程
        actionHistory.push(`\n其他玩家投票：`);
        
        Object.entries(voteResult.votes).forEach(([voterId, targetId]) => {
          const voter = prev.players.find(p => p.id === voterId);
          const target = prev.players.find(p => p.id === targetId);
          if (voter && target) {
            actionHistory.push(`  ${voter.name} → ${target.name}`);
          }
        });
        
        actionHistory.push(`\n📊 最终统计：`);
        Object.entries(voteResult.voteCounts).forEach(([targetId, count]) => {
          const target = prev.players.find(p => p.id === targetId);
          if (target) {
            actionHistory.push(`  ${target.name}: ${count}票`);
          }
        });
      }
      
      // 执行投票结果
      const finalWinner = winner || playerId; // 如果没有AI投票，就用玩家的选择
      const finalTarget = prev.players.find(p => p.id === finalWinner);
      const newPlayers = prev.players.map(p => 
        p.id === finalWinner ? { ...p, isAlive: false } : p
      );
      
      actionHistory.push(`\n${finalTarget?.name} 被投票取消参赛资格！`);
      
      return {
        ...prev,
        players: newPlayers,
        votedOutPlayer: finalWinner,
        phase: 'night' as GamePhase,
        actionHistory
      };
    });
  }, []);

  // 警犬检查
  const dogCheck = useCallback((playerId: string) => {
    setGameState(prev => {
      const target = prev.players.find(p => p.id === playerId);
      const checkResult = target?.role === 'pooper' ? '是拉屎的人！' : '不是拉屎的人';
      // 判断是玩家警犬还是AI警犬
      const isPlayerDog = prev.currentPlayerId === 'player-0' && prev.players[0].role === 'dog';
      
      // 如果是AI警犬检查，模糊化信息
      const publicMessage = !isPlayerDog 
        ? `警犬检查了${target?.name}`
        : `警犬检查了${target?.name}：${checkResult}`;
      
      return {
        ...prev,
        nightActions: {
          ...prev.nightActions,
          dogCheck: playerId
        },
        players: prev.players.map(p => 
          p.id === playerId ? { ...p, wasChecked: true } : p
        ),
        actionHistory: [...prev.actionHistory, publicMessage]
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
      
      return {
        ...prev,
        nightActions: {
          ...prev.nightActions,
          pooperTarget: playerId
        },
        actionHistory: [...prev.actionHistory, `拉屎的人选择了${target?.name}作为目标`]
      };
    });
  }, []);

  // 进入下一阶段
  const nextPhase = useCallback(() => {
    setGameState(prev => {
      let newPlayers = [...prev.players];
      const newActionHistory = [...prev.actionHistory];
      
      // 如果是夜晚结束，结算夜晚行动
      if (prev.phase === 'night') {
        // 结算拉屎的人的行动
        if (prev.nightActions.pooperTarget) {
          const target = newPlayers.find(p => p.id === prev.nightActions.pooperTarget);
          if (target && target.isAlive) {
            if (target.isProtected) {
              newActionHistory.push(`天亮了！${target.name}被恶心了，但被保洁员保护，安然无恙！`);
            } else {
              target.isAlive = false;
              newActionHistory.push(`天亮了！${target.name}被恶心得孕吐取消参赛资格了！`);
            }
          }
        } else {
          newActionHistory.push(`天亮了！昨晚是个平安夜。`);
        }
        
        // 清除保护状态
        newPlayers = newPlayers.map(p => ({ ...p, isProtected: false }));
      }
      
      // 检查游戏结束条件
      const alivePlayers = newPlayers.filter(p => p.isAlive);
      const alivePooper = alivePlayers.find(p => p.role === 'pooper');
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
        newActionHistory.push(
          gameResult === 'goodWin' ? '好人获胜！拉屎的人被找出来了！' : '邪恶阵营获胜！拉屎的人和尿瓶子的人笑到了最后！'
        );
        return {
          ...prev,
          players: newPlayers,
          phase: 'gameOver' as GamePhase,
          gameResult,
          actionHistory: newActionHistory
        };
      }
      
      const nextPhase: GamePhase = prev.phase === 'day' ? 'night' : 'day';
      const nextRound = prev.phase === 'night' ? prev.currentRound + 1 : prev.currentRound;
      
      return {
        ...prev,
        players: newPlayers,
        phase: nextPhase,
        currentRound: nextRound,
        nightActions: {
          dogCheck: null,
          cleanerProtect: null,
          pooperTarget: null
        },
        actionHistory: newActionHistory
      };
    });
  }, []);

  return {
    gameState,
    initGame,
    voteOut,
    playerVoteWithAI,
    dogCheck,
    cleanerProtect,
    pooperAction,
    nextPhase
  };
}; 