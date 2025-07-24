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

  // 按照行动顺序执行：保洁员 -> 警犬 -> 拉屎的人
  const cleaner = aliveAIPlayers.find(p => p.role === 'cleaner');
  if (cleaner && !gameState.nightActions.cleanerProtect) {
    const target = getAINightAction(cleaner, gameState);
    if (target) {
      setTimeout(() => cleanerProtect(target), 1000);
    }
  }

  const dog = aliveAIPlayers.find(p => p.role === 'dog');
  if (dog && !gameState.nightActions.dogCheck) {
    const target = getAINightAction(dog, gameState);
    if (target) {
      setTimeout(() => dogCheck(target), 2000);
    }
  }

  const pooper = aliveAIPlayers.find(p => p.role === 'pooper');
  if (pooper && !gameState.nightActions.pooperTarget) {
    const target = getAINightAction(pooper, gameState);
    if (target) {
      setTimeout(() => pooperAction(target), 3000);
    }
  }
};

// 执行所有AI的投票
export const executeAIVotes = (
  gameState: GameState,
  voteOut: (playerId: string) => void
): void => {
  const aliveAIPlayers = gameState.players.filter(p => 
    p.isAlive && p.id !== gameState.currentPlayerId
  );

  // 收集所有AI的投票
  const votes: { [key: string]: number } = {};
  
  aliveAIPlayers.forEach(player => {
    const target = getAIVoteTarget(player, gameState);
    if (target) {
      votes[target] = (votes[target] || 0) + 1;
    }
  });

  // 找出得票最多的玩家
  let maxVotes = 0;
  let targetId: string | null = null;
  
  Object.entries(votes).forEach(([playerId, voteCount]) => {
    if (voteCount > maxVotes) {
      maxVotes = voteCount;
      targetId = playerId;
    }
  });

  // 如果有人得到超过半数票，执行投票
  if (targetId && maxVotes >= Math.ceil(aliveAIPlayers.length / 2)) {
    setTimeout(() => {
      const target = gameState.players.find(p => p.id === targetId);
      if (target && targetId) {
        voteOut(targetId);
      }
    }, 2000);
  }
};