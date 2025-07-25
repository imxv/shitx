import { Player, GameStateV3 } from '../types/gameV3';

// AI 投票逻辑
export function getAIVoteTargetV3(voter: Player, gameState: GameStateV3): string | null {
  const alivePlayers = gameState.players.filter(p => p.isAlive && p.id !== voter.id);
  if (alivePlayers.length === 0) return null;
  
  // 邪恶阵营不会投自己人
  if (voter.role === 'pooper' || voter.role === 'peebottler') {
    const goodGuys = alivePlayers.filter(p => 
      p.role !== 'pooper' && p.role !== 'peebottler'
    );
    if (goodGuys.length > 0) {
      // 优先投票给被验出的好人
      const checkedGoodGuy = goodGuys.find(p => p.checkedByDog && !p.lastCheckedResult);
      if (checkedGoodGuy) return checkedGoodGuy.id;
      
      // 随机选择一个好人
      return goodGuys[Math.floor(Math.random() * goodGuys.length)].id;
    }
  }
  
  // 好人阵营的投票逻辑
  if (voter.role === 'pregnant' || voter.role === 'dog' || voter.role === 'cleaner') {
    // 查看历史记录，找出被验证是拉屎的人
    const knownPooper = alivePlayers.find(p => p.checkedByDog && p.lastCheckedResult === true);
    if (knownPooper) return knownPooper.id;
    
    // 如果是警犬，不会投自己验过是好人的
    if (voter.role === 'dog') {
      const verifiedGood = alivePlayers.filter(p => p.checkedByDog && p.lastCheckedResult === false);
      const suspects = alivePlayers.filter(p => !verifiedGood.includes(p));
      if (suspects.length > 0) {
        return suspects[Math.floor(Math.random() * suspects.length)].id;
      }
    }
    
    // 分析投票历史，找出可疑的人
    if (gameState.lastDaySettlement) {
      const lastVotes = gameState.lastDaySettlement.voteCount;
      // 找出上轮得票最少的人（可能是拉屎的人和尿在瓶子的人互相保护）
      let minVotes = Infinity;
      let suspiciousPlayers: string[] = [];
      
      lastVotes.forEach((count, playerId) => {
        if (alivePlayers.find(p => p.id === playerId)) {
          if (count < minVotes) {
            minVotes = count;
            suspiciousPlayers = [playerId];
          } else if (count === minVotes) {
            suspiciousPlayers.push(playerId);
          }
        }
      });
      
      if (suspiciousPlayers.length > 0) {
        return suspiciousPlayers[Math.floor(Math.random() * suspiciousPlayers.length)];
      }
    }
  }
  
  // 默认随机投票
  return alivePlayers[Math.floor(Math.random() * alivePlayers.length)].id;
}

// AI 夜晚行动逻辑
export function getAINightActionV3(
  actor: Player, 
  gameState: GameStateV3
): { targetId: string; type: string } | null {
  const alivePlayers = gameState.players.filter(p => p.isAlive && p.id !== actor.id);
  if (alivePlayers.length === 0) return null;
  
  switch (actor.role) {
    case 'cleaner': {
      // 保洁员优先保护重要角色
      const importantRoles = alivePlayers.filter(p => p.role === 'dog');
      if (importantRoles.length > 0) {
        return { 
          targetId: importantRoles[Math.floor(Math.random() * importantRoles.length)].id, 
          type: 'protect' 
        };
      }
      
      // 否则随机保护
      const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
      return { targetId: target.id, type: 'protect' };
    }
    
    case 'dog': {
      // 警犬优先检查没检查过的人
      const unchecked = alivePlayers.filter(p => !p.checkedByDog);
      if (unchecked.length > 0) {
        const target = unchecked[Math.floor(Math.random() * unchecked.length)];
        return { targetId: target.id, type: 'check' };
      }
      
      // 都检查过了就随机
      const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
      return { targetId: target.id, type: 'check' };
    }
    
    case 'pooper': {
      // 拉屎的人优先恶心好人
      const goodGuys = alivePlayers.filter(p => 
        p.role !== 'pooper' && p.role !== 'peebottler'
      );
      
      // 优先恶心警犬（威胁最大）
      const dogs = goodGuys.filter(p => p.role === 'dog');
      if (dogs.length > 0) {
        return { 
          targetId: dogs[Math.floor(Math.random() * dogs.length)].id, 
          type: 'disgust' 
        };
      }
      
      // 否则随机恶心好人
      if (goodGuys.length > 0) {
        const target = goodGuys[Math.floor(Math.random() * goodGuys.length)];
        return { targetId: target.id, type: 'disgust' };
      }
      
      // 实在没有好人了就随机
      const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
      return { targetId: target.id, type: 'disgust' };
    }
    
    default:
      return null;
  }
}