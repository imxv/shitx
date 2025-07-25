// ==========================================
// 游戏核心类型定义 - 以天为单位组织
// ==========================================

// 游戏阶段 - 每天的完整流程
export type GamePhaseV3 = 
  | 'gameStart'           // 游戏开始
  | 'dayBegin'            // 天亮了（展示昨晚结果）
  | 'dayDiscussion'       // 白天讨论阶段
  | 'dayVoting'           // 白天投票阶段（所有人同时投票）
  | 'daySettlement'       // 白天结算（统计票数，宣布结果）
  | 'nightBegin'          // 夜晚降临
  | 'nightAction'         // 夜晚行动阶段（所有特殊角色同时行动）
  | 'nightSettlement'     // 夜晚结算（统一处理所有行动结果）
  | 'gameOver';           // 游戏结束

// 角色定义
export type PlayerRole = 
  | 'pooper'      // 💩 拉屎的人
  | 'peebottler'  // 🍯 尿瓶子的人
  | 'pregnant'    // 🤰 孕妇
  | 'dog'         // 🐕‍🦺 警犬
  | 'cleaner';    // 🧹 保洁员

// 死亡原因
export type DeathCause = 
  | 'voted'      // 被投票淘汰
  | 'disgusted'  // 被恶心死
  | 'tied-vote'; // 平票被随机淘汰

// 玩家状态
export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  isAI: boolean;
  isAlive: boolean;
  // 状态标记（在结算时使用）
  markedForDeath: boolean;      // 被标记为死亡（投票或恶心）
  markedForProtection: boolean; // 被标记为保护
  checkedByDog: boolean;        // 被警犬检查过
  lastCheckedResult?: boolean;  // 最后一次被检查的结果
  // 死亡信息
  deathCause?: DeathCause;      // 死亡原因
  deathDay?: number;            // 死亡的天数
  votesReceived?: number;       // 被投票时收到的票数
}

// 行动类型
export type ActionType = 'vote' | 'protect' | 'check' | 'disgust';

// 玩家行动（收集阶段）
export interface PlayerAction {
  actorId: string;
  targetId: string;
  actionType: ActionType;
  timestamp: number;
}

// 白天投票收集
export interface DayVoteCollection {
  votes: Map<string, string>;          // voterId -> targetId
  submittedVoters: Set<string>;       // 已提交投票的玩家
  requiredVoters: Set<string>;        // 需要投票的玩家
}

// 夜晚行动收集
export interface NightActionCollection {
  protectActions: Map<string, string>;   // cleanerId -> targetId
  checkActions: Map<string, string>;     // dogId -> targetId
  disgustActions: Map<string, string>;   // pooperId -> targetId
  submittedActors: Set<string>;          // 已提交行动的玩家
  requiredActors: Set<string>;           // 需要行动的玩家
}

// 白天结算结果
export interface DaySettlementResult {
  voteCount: Map<string, number>;      // targetId -> 票数
  eliminatedPlayerId: string | null;   // 被投票淘汰的玩家
  tiedPlayers: string[];               // 平票的玩家（如果有）
  wasTiedVote: boolean;                // 是否是平票随机淘汰
  settlementLog: string[];             // 结算日志
  voteDetails: Map<string, string[]>;  // targetId -> 投票给他的人的列表
}

// 夜晚结算结果
export interface NightSettlementResult {
  protectedPlayers: Set<string>;       // 被保护的玩家
  checkedResults: Map<string, boolean>; // dogId -> 检查结果
  disgustedPlayers: Set<string>;       // 被恶心的玩家（未被保护）
  actualDeaths: string[];              // 实际死亡的玩家
  settlementLog: string[];             // 结算日志
}

// 游戏状态
export interface GameStateV3 {
  // 基础信息
  gameId: string;
  gameMode: 'classic' | 'battle-royale';
  
  // 时间信息
  currentDay: number;           // 当前是第几天
  currentPhase: GamePhaseV3;    // 当前阶段
  
  // 玩家信息
  players: Player[];
  humanPlayerId: string;
  
  // 当前回合的行动收集
  currentDayVotes: DayVoteCollection | null;
  currentNightActions: NightActionCollection | null;
  
  // 最近的结算结果（用于展示）
  lastDaySettlement: DaySettlementResult | null;
  lastNightSettlement: NightSettlementResult | null;
  
  // 游戏历史
  actionHistory: string[];      // 显示给玩家的历史记录
  dayLogs: DayLog[];           // 每天的详细记录
  
  // 游戏结果
  winner: 'pooper' | 'good' | null;
  gameEndReason: string | null;
}

// 每天的记录
export interface DayLog {
  day: number;
  dayVoteResult: DaySettlementResult;
  nightActionResult: NightSettlementResult;
  survivors: string[];         // 这一天结束后的幸存者
}

// 游戏配置
export interface GameConfig {
  playerCount: number;
  showDetailedVotes: boolean;
  enableDeathAnimation: boolean;
  actionTimeout: number;        // 行动超时时间
  settlementDelay: number;      // 结算展示时间
}

// 游戏事件
export type GameEventV3 =
  | { type: 'START_GAME'; config: GameConfig }
  | { type: 'NEXT_PHASE' }
  | { type: 'SUBMIT_VOTE'; voterId: string; targetId: string }
  | { type: 'SUBMIT_NIGHT_ACTION'; action: PlayerAction }
  | { type: 'TIMEOUT_PHASE' }    // 阶段超时，自动进入下一阶段
  | { type: 'SETTLE_DAY' }       // 结算白天
  | { type: 'SETTLE_NIGHT' };    // 结算夜晚

// ==========================================
// 工具函数
// ==========================================

// 获取需要在当前阶段行动的玩家
export function getRequiredActors(phase: GamePhaseV3, players: Player[]): Set<string> {
  const alivePlayers = players.filter(p => p.isAlive);
  
  switch (phase) {
    case 'dayVoting':
      // 所有活着的玩家都需要投票
      return new Set(alivePlayers.map(p => p.id));
      
    case 'nightAction':
      // 只有特殊角色需要行动
      return new Set(
        alivePlayers
          .filter(p => ['cleaner', 'dog', 'pooper'].includes(p.role))
          .map(p => p.id)
      );
      
    default:
      return new Set();
  }
}

// 检查行动收集是否完成
export function isActionCollectionComplete(
  phase: GamePhaseV3,
  state: GameStateV3
): boolean {
  switch (phase) {
    case 'dayVoting':
      if (!state.currentDayVotes) return false;
      return state.currentDayVotes.submittedVoters.size >= 
             state.currentDayVotes.requiredVoters.size;
      
    case 'nightAction':
      if (!state.currentNightActions) return false;
      return state.currentNightActions.submittedActors.size >= 
             state.currentNightActions.requiredActors.size;
      
    default:
      return true;
  }
}

// 结算白天投票
export function settleDayVotes(
  votes: DayVoteCollection,
  players: Player[]
): DaySettlementResult {
  const voteCount = new Map<string, number>();
  const voteDetails = new Map<string, string[]>();
  const settlementLog: string[] = [];
  
  // 统计票数和投票详情
  votes.votes.forEach((targetId, voterId) => {
    voteCount.set(targetId, (voteCount.get(targetId) || 0) + 1);
    
    // 记录谁投了这个人
    if (!voteDetails.has(targetId)) {
      voteDetails.set(targetId, []);
    }
    voteDetails.get(targetId)!.push(voterId);
    
    const voter = players.find(p => p.id === voterId);
    const target = players.find(p => p.id === targetId);
    settlementLog.push(`${voter?.name} 投票给 ${target?.name}`);
  });
  
  // 找出最高票
  let maxVotes = 0;
  let eliminatedPlayerId: string | null = null;
  const tiedPlayers: string[] = [];
  
  voteCount.forEach((count, playerId) => {
    if (count > maxVotes) {
      maxVotes = count;
      eliminatedPlayerId = playerId;
      tiedPlayers.length = 0;
      tiedPlayers.push(playerId);
    } else if (count === maxVotes) {
      tiedPlayers.push(playerId);
    }
  });
  
  // 处理平票情况
  let wasTiedVote = false;
  if (tiedPlayers.length > 1) {
    wasTiedVote = true;
    // 随机选择一个
    eliminatedPlayerId = tiedPlayers[Math.floor(Math.random() * tiedPlayers.length)];
    settlementLog.push(`平票！随机选择淘汰玩家`);
  }
  
  return {
    voteCount,
    eliminatedPlayerId,
    tiedPlayers: tiedPlayers.length > 1 ? tiedPlayers : [],
    wasTiedVote,
    settlementLog,
    voteDetails
  };
}

// 结算夜晚行动
export function settleNightActions(
  actions: NightActionCollection,
  players: Player[]
): NightSettlementResult {
  const protectedPlayers = new Set<string>();
  const checkedResults = new Map<string, boolean>();
  const disgustedPlayers = new Set<string>();
  const actualDeaths: string[] = [];
  const settlementLog: string[] = [];
  
  // 1. 先处理保护
  actions.protectActions.forEach((targetId, cleanerId) => {
    protectedPlayers.add(targetId);
    const cleaner = players.find(p => p.id === cleanerId);
    const target = players.find(p => p.id === targetId);
    settlementLog.push(`${cleaner?.name} 保护了 ${target?.name}`);
  });
  
  // 2. 处理检查
  actions.checkActions.forEach((targetId, dogId) => {
    const target = players.find(p => p.id === targetId);
    const result = target?.role === 'pooper';
    checkedResults.set(dogId, result);
    const dog = players.find(p => p.id === dogId);
    settlementLog.push(`${dog?.name} 检查了 ${target?.name}`);
  });
  
  // 3. 处理恶心（考虑保护）
  actions.disgustActions.forEach((targetId) => {
    if (!protectedPlayers.has(targetId)) {
      disgustedPlayers.add(targetId);
      actualDeaths.push(targetId);
      const target = players.find(p => p.id === targetId);
      settlementLog.push(`${target?.name} 被恶心了！`);
    } else {
      const target = players.find(p => p.id === targetId);
      settlementLog.push(`${target?.name} 被保护，免受恶心！`);
    }
  });
  
  return {
    protectedPlayers,
    checkedResults,
    disgustedPlayers,
    actualDeaths,
    settlementLog
  };
}

// 检查游戏是否结束
export function checkGameOver(players: Player[]): {
  isOver: boolean;
  winner: 'pooper' | 'good' | null;
  reason: string;
} {
  const alivePlayers = players.filter(p => p.isAlive);
  const alivePooper = alivePlayers.find(p => p.role === 'pooper');
  const aliveGood = alivePlayers.filter(p => 
    p.role !== 'pooper' && p.role !== 'peebottler'
  );
  
  if (!alivePooper) {
    return {
      isOver: true,
      winner: 'good',
      reason: '拉屎的人被淘汰！好人获胜！'
    };
  }
  
  if (aliveGood.length === 0) {
    return {
      isOver: true,
      winner: 'pooper',
      reason: '所有好人都被恶心走了！邪恶阵营获胜！'
    };
  }
  
  if (alivePlayers.length <= 2 && alivePooper) {
    return {
      isOver: true,
      winner: 'pooper',
      reason: '只剩两人，拉屎的人获胜！'
    };
  }
  
  return { isOver: false, winner: null, reason: '' };
}