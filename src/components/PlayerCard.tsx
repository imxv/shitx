import { Player, ROLE_CONFIGS } from '@/types/game';

interface PlayerCardProps {
  player: Player;
  isSelectable?: boolean;
  onSelect?: (playerId: string) => void;
  showRole?: boolean;
  isCurrentPlayer?: boolean;
  className?: string;
}

export const PlayerCard = ({ 
  player, 
  isSelectable = false, 
  onSelect, 
  showRole = false,
  isCurrentPlayer = false,
  className = '' 
}: PlayerCardProps) => {
  const roleConfig = ROLE_CONFIGS[player.role];
  
  return (
    <div 
      className={`
        relative p-4 rounded-lg border-2 transition-all duration-200
        ${player.isAlive ? 'bg-white' : 'bg-gray-200 opacity-60'}
        ${isSelectable && player.isAlive ? 'cursor-pointer hover:shadow-lg hover:scale-105' : ''}
        ${player.isProtected ? 'ring-2 ring-green-400' : ''}
        ${player.wasChecked ? 'ring-2 ring-blue-400' : ''}
        ${isCurrentPlayer ? 'border-purple-500 border-4 shadow-lg' : ''}
        ${className}
      `}
      onClick={() => isSelectable && player.isAlive && onSelect?.(player.id)}
    >
      {/* 取消参赛资格标记 */}
      {!player.isAlive && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
          <span className="text-4xl">❌</span>
        </div>
      )}
      
      {/* 保护标记 */}
      {player.isProtected && (
        <div className="absolute -top-2 -right-2 text-xl">🛡️</div>
      )}
      
      {/* 被检查标记 */}
      {player.wasChecked && (
        <div className="absolute -top-2 -left-2 text-xl">🔍</div>
      )}
      
      {/* 当前玩家标记 */}
      {isCurrentPlayer && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white text-xs px-2 py-1 rounded">
          你
        </div>
      )}
      
      <div className="text-center">
        <div className="text-4xl mb-2">
          {showRole ? roleConfig.emoji : '👤'}
        </div>
        
        <div className="font-bold text-lg mb-1">
          {player.name}
        </div>
        
        {showRole && (
          <div className={`text-sm px-2 py-1 rounded text-white ${roleConfig.color}`}>
            {roleConfig.name}
          </div>
        )}
      </div>
    </div>
  );
}; 