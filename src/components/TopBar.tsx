'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getUserIdentity } from '@/utils/userIdentity';
import { generateEVMAddress } from '@/utils/web3Utils';

export function TopBar() {
  const [userAddress, setUserAddress] = useState<string>('');
  
  useEffect(() => {
    const identity = getUserIdentity();
    const address = generateEVMAddress(identity.fingerprint);
    setUserAddress(address);
  }, []);
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 左侧 Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img src="/shitx.png" alt="ShitX" className="w-8 h-8" />
            <span className="text-xl font-bold">
              <span className="text-yellow-400">Shit</span>
              <span className="text-green-400">X</span>
            </span>
          </Link>
          
          {/* 右侧按钮组 */}
          <div className="flex items-center gap-4">
            {userAddress && (
              <div className="hidden sm:block text-xs text-gray-400 font-mono">
                {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
              </div>
            )}
            
            <Link
              href="/my-toilet"
              className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-all border border-purple-500/30"
            >
              <span className="text-lg">💩</span>
              <span className="font-medium">My Toilet</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}