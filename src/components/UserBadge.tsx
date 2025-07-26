'use client';

import { useEffect, useState } from 'react';
import { getUserIdentity, getUserTitle, UserIdentity } from '@/utils/userIdentity';

export function UserBadge() {
  const [user, setUser] = useState<UserIdentity | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      const identity = getUserIdentity();
      setUser(identity);
    }
  }, [isClient]);

  if (!isClient || !user) {
    return null;
  }

  const title = getUserTitle(user.toiletVisits);

  return (
    <div className="fixed top-4 right-4 bg-gray-900/90 backdrop-blur-sm border border-green-500/50 rounded-xl p-4 shadow-lg z-50">
      <div className="flex items-center gap-3">
        <div className="text-3xl">🚽</div>
        <div>
          <div className="text-green-400 font-bold">{user.username}</div>
          <div className="text-xs text-gray-500">ID: {user.id}</div>
          <div className="text-xs text-yellow-400">{title} · 第{user.toiletVisits}次访问</div>
        </div>
      </div>
    </div>
  );
}