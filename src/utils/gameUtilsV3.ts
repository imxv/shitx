import { Player, PlayerRole } from '../types/gameV3';
import { generateUniqueNames } from './nameGenerator';

// 角色分配配置
const ROLE_DISTRIBUTION: Record<number, Record<PlayerRole, number>> = {
  5: { pooper: 1, peebottler: 0, pregnant: 2, dog: 1, cleaner: 1 },
  6: { pooper: 1, peebottler: 1, pregnant: 2, dog: 1, cleaner: 1 },
  7: { pooper: 1, peebottler: 1, pregnant: 3, dog: 1, cleaner: 1 },
  8: { pooper: 1, peebottler: 1, pregnant: 3, dog: 1, cleaner: 2 },
  9: { pooper: 1, peebottler: 1, pregnant: 4, dog: 1, cleaner: 2 },
  10: { pooper: 1, peebottler: 1, pregnant: 5, dog: 1, cleaner: 2 },
};

// 获取角色分配
function getRoleDistribution(playerCount: number): Record<PlayerRole, number> {
  if (playerCount <= 10) {
    return ROLE_DISTRIBUTION[playerCount] || ROLE_DISTRIBUTION[10];
  }
  
  // 百人大逃杀模式的角色分配
  const distribution: Record<PlayerRole, number> = {
    pooper: Math.max(1, Math.floor(playerCount * 0.1)), // 10% 拉屎的人
    peebottler: Math.max(1, Math.floor(playerCount * 0.05)), // 5% 尿在瓶子的人
    pregnant: 0, // 先设为0，剩余的都是孕妇
    dog: Math.max(2, Math.floor(playerCount * 0.1)), // 10% 警犬
    cleaner: Math.max(2, Math.floor(playerCount * 0.15)), // 15% 保洁员
  };
  
  // 剩余的都是孕妇
  const assignedCount = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  distribution.pregnant = playerCount - assignedCount;
  
  return distribution;
}

// 初始化玩家（V3版本）
export function initializePlayersV3(playerCount: number, selectedRole?: string): Player[] {
  const players: Player[] = [];
  const roleDistribution = getRoleDistribution(playerCount);
  
  // 创建角色池
  const rolePool: PlayerRole[] = [];
  Object.entries(roleDistribution).forEach(([role, count]) => {
    for (let i = 0; i < count; i++) {
      rolePool.push(role as PlayerRole);
    }
  });
  
  // 处理用户角色选择
  let humanRole: PlayerRole;
  if (selectedRole && selectedRole !== 'random' && rolePool.includes(selectedRole as PlayerRole)) {
    // 用户选择了特定角色
    humanRole = selectedRole as PlayerRole;
    // 从角色池中移除用户选择的角色
    const roleIndex = rolePool.indexOf(humanRole);
    rolePool.splice(roleIndex, 1);
  } else {
    // 随机分配或选择随机
    const randomIndex = Math.floor(Math.random() * rolePool.length);
    humanRole = rolePool[randomIndex];
    rolePool.splice(randomIndex, 1);
  }
  
  // 随机打乱剩余角色池
  for (let i = rolePool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rolePool[i], rolePool[j]] = [rolePool[j], rolePool[i]];
  }
  
  // 生成AI玩家的随机名字
  const aiNames = generateUniqueNames(playerCount - 1);
  
  // 创建玩家
  for (let i = 0; i < playerCount; i++) {
    const player: Player = {
      id: `player-${i}`,
      name: i === 0 ? '你' : aiNames[i - 1],
      role: i === 0 ? humanRole : rolePool[i - 1],
      isAI: i !== 0,
      isAlive: true,
      // V3新增字段
      markedForDeath: false,
      markedForProtection: false,
      checkedByDog: false,
      lastCheckedResult: undefined,
      // 死亡信息
      deathCause: undefined,
      deathDay: undefined,
      votesReceived: undefined
    };
    players.push(player);
  }
  
  return players;
}

// 角色图标映射
export const roleEmojis: Record<PlayerRole, string> = {
  pooper: '💩',
  peebottler: '🍯',
  pregnant: '🤰',
  dog: '🐕‍🦺',
  cleaner: '🧹'
};

// 角色名称映射
export const roleNames: Record<PlayerRole, string> = {
  pooper: '拉屎的人',
  peebottler: '尿在瓶子的人',
  pregnant: '孕妇',
  dog: '警犬',
  cleaner: '保洁员'
};

// 计算行动延迟（根据玩家数量）
export function getActionDelay(playerCount: number): number {
  if (playerCount <= 10) {
    return 1000; // 1秒
  } else if (playerCount <= 50) {
    return 500; // 0.5秒
  } else {
    return 200; // 0.2秒
  }
}