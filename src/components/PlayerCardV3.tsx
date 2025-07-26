import { Player } from '@/types/gameV3';
import { ROLE_CONFIGS } from '@/types/game';

interface PlayerCardV3Props {
  player: Player;
  isSelectable?: boolean;
  onSelect?: (playerId: string) => void;
  showRole?: boolean;
  isCurrentPlayer?: boolean;
  compact?: boolean;
  voteCount?: number; // 新增：当前收到的投票数
  showVoteCount?: boolean; // 新增：是否显示投票数
  isNightPhase?: boolean;
}

export const PlayerCardV3: React.FC<PlayerCardV3Props> = ({
  player,
  isSelectable = false,
  onSelect,
  showRole = false,
  isCurrentPlayer = false,
  compact = false,
  voteCount = 0,
  showVoteCount = false,
  isNightPhase = false
}) => {
  const handleClick = () => {
    if (isSelectable && onSelect) {
      onSelect(player.id);
    }
  };
  
  const roleConfig = ROLE_CONFIGS[player.role];
  
  // 紧凑模式（50人以上）
  if (compact) {
    return (
      <div
        onClick={handleClick}
        className={`
          relative p-2 rounded-lg transition-all duration-200 cursor-pointer
          ${isCurrentPlayer ? 'ring-2 ring-blue-500' : ''}
          ${isSelectable ? 'hover:scale-110 hover:z-10' : ''}
          ${player.isAlive ? (isNightPhase ? 'bg-gray-600' : 'bg-white') : 'bg-gray-200 opacity-50'}
          ${isSelectable && player.isAlive ? 'hover:shadow-lg' : ''}
        `}
      >
        <div className="text-center">
          <div className="text-2xl mb-1">
            {showRole ? roleConfig.emoji : '👤'}
          </div>
          <div className={`text-xs font-medium truncate ${isNightPhase ? 'text-gray-100' : 'text-gray-800'}`}>
            {player.name}
          </div>
          {!player.isAlive && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl">💀</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // 正常模式
  return (
    <div
      onClick={handleClick}
      className={`
        relative p-4 rounded-xl shadow-md transition-all duration-200
        ${isNightPhase ? 'bg-gray-600' : 'bg-white'}
        ${isCurrentPlayer ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        ${isSelectable ? 'hover:scale-105 hover:shadow-xl cursor-pointer' : ''}
        ${!player.isAlive ? 'opacity-50 grayscale' : ''}
      `}
    >
      {/* 玩家标识 */}
      {isCurrentPlayer && (
        <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
          你
        </div>
      )}
      
      {/* 投票数显示 */}
      {showVoteCount && voteCount > 0 && !isCurrentPlayer && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
          {voteCount}票
        </div>
      )}
      
      {/* 检查标记 */}
      {player.checkedByDog && showRole && (
        <div className="absolute -top-2 -left-2">
          <span className="text-sm" title="已被警犬检查">🔍</span>
        </div>
      )}
      
      <div className="text-center">
        {/* 角色图标 */}
        <div className="text-4xl mb-2">
          {showRole ? roleConfig.emoji : '👤'}
        </div>
        
        {/* 玩家名称 */}
        <h3 className={`font-bold truncate ${isNightPhase ? 'text-gray-100' : 'text-gray-800'}`}>
          {player.name}
        </h3>
        
        {/* 角色名称 */}
        {showRole && (
          <p className={`text-xs mt-1 ${isNightPhase ? 'text-gray-300' : 'text-gray-600'}`}>
            {roleConfig.name}
          </p>
        )}
        
        {/* 死亡状态 */}
        {!player.isAlive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
            <span className="text-5xl">💀</span>
          </div>
        )}
        
        {/* 保护状态（调试用，实际游戏中不应显示） */}
        {player.markedForProtection && process.env.NODE_ENV === 'development' && (
          <div className="absolute top-0 right-0 text-xs">🛡️</div>
        )}
      </div>
    </div>
  );
};
