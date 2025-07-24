import { GameState, Player } from '@/types/game';

// AI投票逻辑
export const getAIVoteTarget = (
  voter: Player,
  gameState: GameState
): string | null => {
  const alivePlayers = gameState.players.filter(p => p.isAlive && p.id !== voter.id);
  if (alivePlayers.length === 0) return null;

  // 邪恶阵营不会投自己人
  if (voter.role === 'pooper' || voter.role === 'peebottler') {
    const goodGuys = alivePlayers.filter(p => 
      p.role !== 'pooper' && p.role !== 'peebottler'
    );
    if (goodGuys.length > 0) {
      // 优先投票给被验出的好人
      const checkedGoodGuy = goodGuys.find(p => p.wasChecked);
      if (checkedGoodGuy) return checkedGoodGuy.id;
      
      // 随机选择一个好人
      return goodGuys[Math.floor(Math.random() * goodGuys.length)].id;
    }
  }

  // 好人阵营的投票逻辑
  if (voter.role === 'pregnant' || voter.role === 'dog' || voter.role === 'cleaner') {
    // 查看历史记录，找出被验证是拉屎的人
    const pooperRegex = /警犬检查了(.+)：是拉屎的人！/;
    for (const action of gameState.actionHistory) {
      const match = action.match(pooperRegex);
      if (match) {
        const pooperName = match[1];
        const pooper = alivePlayers.find(p => p.name === pooperName);
        if (pooper) return pooper.id;
      }
    }

    // 如果是警犬，不会投自己验过是好人的
    if (voter.role === 'dog') {
      const goodRegex = /警犬检查了(.+)：不是拉屎的人/;
      const verifiedGood: string[] = [];
      for (const action of gameState.actionHistory) {
        const match = action.match(goodRegex);
        if (match) {
          verifiedGood.push(match[1]);
        }
      }
      
      const suspects = alivePlayers.filter(p => !verifiedGood.includes(p.name));
      if (suspects.length > 0) {
        return suspects[Math.floor(Math.random() * suspects.length)].id;
      }
    }

    // 随机投票
    return alivePlayers[Math.floor(Math.random() * alivePlayers.length)].id;
  }

  return null;
};

// AI夜晚行动逻辑
export const getAINightAction = (
  actor: Player,
  gameState: GameState
): string | null => {
  const alivePlayers = gameState.players.filter(p => p.isAlive && p.id !== actor.id);
  if (alivePlayers.length === 0) return null;

  switch (actor.role) {
    case 'pooper':
      // 拉屎的人优先选择特殊角色
      const specialRoles = alivePlayers.filter(p => 
        p.role === 'dog' || p.role === 'cleaner'
      );
      if (specialRoles.length > 0) {
        return specialRoles[Math.floor(Math.random() * specialRoles.length)].id;
      }
      // 否则随机选择
      return alivePlayers[Math.floor(Math.random() * alivePlayers.length)].id;

    case 'dog':
      // 警犬优先检查没检查过的人
      const unchecked = alivePlayers.filter(p => !p.wasChecked);
      if (unchecked.length > 0) {
        return unchecked[Math.floor(Math.random() * unchecked.length)].id;
      }
      return null;

    case 'cleaner':
      // 保洁员优先保护警犬
      const dog = alivePlayers.find(p => p.role === 'dog');
      if (dog && Math.random() > 0.3) return dog.id;
      
      // 否则保护孕妇
      const pregnant = alivePlayers.filter(p => p.role === 'pregnant');
      if (pregnant.length > 0) {
        return pregnant[Math.floor(Math.random() * pregnant.length)].id;
      }
      return alivePlayers[Math.floor(Math.random() * alivePlayers.length)].id;

    default:
      return null;
  }
};

// 根据玩家数量获取动作延迟
const getActionDelay = (playerCount: number): number => {
  if (playerCount > 50) return 100; // 百人模式：0.1秒
  if (playerCount > 20) return 200; // 大型游戏：0.2秒
  if (playerCount > 10) return 300; // 中型游戏：0.3秒
  return 500; // 小型游戏：0.5秒
};

// 执行所有AI的夜晚行动
export const executeAINightActions = (
  gameState: GameState,
  dogCheck: (playerId: string) => void,
  cleanerProtect: (playerId: string) => void,
  pooperAction: (playerId: string) => void
): void => {
  const aliveAIPlayers = gameState.players.filter(p => 
    p.isAlive && p.id !== gameState.currentPlayerId
  );

  const delay = getActionDelay(gameState.players.length);
  
  // 在大型游戏中，同类角色同时行动
  if (gameState.players.length > 10) {
    // 所有保洁员同时行动
    const cleaners = aliveAIPlayers.filter(p => p.role === 'cleaner');
    cleaners.forEach((cleaner, index) => {
      const target = getAINightAction(cleaner, gameState);
      if (target) {
        setTimeout(() => cleanerProtect(target), index * 50); // 微小延迟避免完全同时
      }
    });

    // 所有警犬同时行动
    const dogs = aliveAIPlayers.filter(p => p.role === 'dog');
    dogs.forEach((dog, index) => {
      const target = getAINightAction(dog, gameState);
      if (target) {
        setTimeout(() => dogCheck(target), delay + index * 50);
      }
    });

    // 所有拉屎的人同时行动
    const poopers = aliveAIPlayers.filter(p => p.role === 'pooper');
    poopers.forEach((pooper, index) => {
      const target = getAINightAction(pooper, gameState);
      if (target) {
        setTimeout(() => pooperAction(target), delay * 2 + index * 50);
      }
    });
  } else {
    // 小型游戏：保持原有逻辑
    let actionCount = 0;
    
    const cleaner = aliveAIPlayers.find(p => p.role === 'cleaner');
    if (cleaner && !gameState.nightActions.cleanerProtect) {
      const target = getAINightAction(cleaner, gameState);
      if (target) {
        setTimeout(() => cleanerProtect(target), delay * actionCount++);
      }
    }

    const dog = aliveAIPlayers.find(p => p.role === 'dog');
    if (dog && !gameState.nightActions.dogCheck) {
      const target = getAINightAction(dog, gameState);
      if (target) {
        setTimeout(() => dogCheck(target), delay * actionCount++);
      }
    }

    const pooper = aliveAIPlayers.find(p => p.role === 'pooper');
    if (pooper && !gameState.nightActions.pooperTarget) {
      const target = getAINightAction(pooper, gameState);
      if (target) {
        setTimeout(() => pooperAction(target), delay * actionCount++);
      }
    }
  }
};

// AI投票结果接口
export interface VoteResult {
  votes: { [voterId: string]: string }; // 谁投给了谁
  voteCounts: { [targetId: string]: number }; // 每个人得了多少票
  winner: string | null; // 得票最多的人
}

// 收集所有AI的投票
export const collectAIVotes = (
  gameState: GameState
): VoteResult => {
  const aliveAIPlayers = gameState.players.filter(p => 
    p.isAlive && p.id !== gameState.currentPlayerId
  );
  
  const votes: { [voterId: string]: string } = {};
  const voteCounts: { [targetId: string]: number } = {};
  
  // 收集每个AI的投票
  aliveAIPlayers.forEach(player => {
    const target = getAIVoteTarget(player, gameState);
    if (target) {
      votes[player.id] = target;
      voteCounts[target] = (voteCounts[target] || 0) + 1;
    }
  });
  
  // 找出得票最多的玩家
  let maxVotes = 0;
  let winner: string | null = null;
  
  Object.entries(voteCounts).forEach(([playerId, voteCount]) => {
    if (voteCount > maxVotes) {
      maxVotes = voteCount;
      winner = playerId;
    }
  });
  
  return { votes, voteCounts, winner };
};

// 执行所有AI的投票
export const executeAIVotes = (
  gameState: GameState,
  voteOut: (playerId: string) => void,
  skipVote?: () => void
): void => {
  const alivePlayer = gameState.players.find(p => p.id === gameState.currentPlayerId && p.isAlive);

  // 如果只剩AI玩家（玩家死亡），自动处理投票
  if (!alivePlayer && gameState.players.filter(p => p.isAlive).length > 0) {
    const voteResult = collectAIVotes(gameState);

    // 执行投票
    const voteDelay = getActionDelay(gameState.players.length) * 2; // 投票延迟稍长一些
    if (voteResult.winner) {
      const finalTargetId = voteResult.winner;
      setTimeout(() => {
        voteOut(finalTargetId);
      }, voteDelay);
    } else if (skipVote) {
      // 如果没有有效投票目标，跳过投票阶段
      setTimeout(() => {
        skipVote();
      }, voteDelay / 2);
    }
  }
};