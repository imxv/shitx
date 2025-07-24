export type PlayerRole = 'pooper' | 'pregnant' | 'dog' | 'cleaner';

export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  isAlive: boolean;
  isProtected: boolean; // 被保洁员保护
  wasChecked: boolean; // 被警犬检查过
}

export type GamePhase = 'day' | 'night' | 'voting' | 'gameOver';

export interface GameState {
  players: Player[];
  phase: GamePhase;
  currentRound: number;
  votedOutPlayer: string | null;
  nightActions: {
    dogCheck: string | null; // 警犬检查的玩家ID
    cleanerProtect: string | null; // 保洁员保护的玩家ID
    pooperTarget: string | null; // 拉屎的人的目标
  };
  gameResult: 'pooperWin' | 'goodWin' | null;
  actionHistory: string[]; // 游戏历史记录
}

export interface RoleConfig {
  name: string;
  emoji: string;
  description: string;
  color: string;
}

export const ROLE_CONFIGS: Record<PlayerRole, RoleConfig> = {
  pooper: {
    name: '拉屎的人',
    emoji: '💩',
    description: '目标：隐藏身份，让所有孕妇出局',
    color: 'bg-red-500'
  },
  pregnant: {
    name: '孕妇',
    emoji: '🤰',
    description: '目标：找出拉屎的人',
    color: 'bg-pink-500'
  },
  dog: {
    name: '警犬',
    emoji: '🐕‍🦺',
    description: '每晚可以检查一个人的身份',
    color: 'bg-blue-500'
  },
  cleaner: {
    name: '保洁员',
    emoji: '🧹',
    description: '每晚可以保护一个孕妇不被恶心',
    color: 'bg-green-500'
  }
}; 