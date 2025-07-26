'use client';

import { useState, useEffect } from 'react';
import { getUserIdentity } from '@/utils/userIdentity';
import { generateEVMAddress, claimShitNFT, checkNFTStatus, ShitNFT } from '@/utils/web3Utils';

export function NFTClaim() {
  const [isLoading, setIsLoading] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [nftData, setNftData] = useState<ShitNFT | null>(null);
  const [evmAddress, setEvmAddress] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    checkClaimStatus();
  }, []);

  const checkClaimStatus = async () => {
    const identity = getUserIdentity();
    const address = generateEVMAddress(identity.fingerprint);
    setEvmAddress(address);

    const status = await checkNFTStatus(identity.fingerprint);
    setHasClaimed(status.hasClaimed);
    if (status.nft) {
      setNftData(status.nft as ShitNFT);
    }
  };

  const handleClaim = async () => {
    setIsLoading(true);
    setError('');

    try {
      const identity = getUserIdentity();
      const result = await claimShitNFT(identity);

      if (result.success && result.nft) {
        setHasClaimed(true);
        setNftData(result.nft);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
      } else {
        setError(result.error || '领取失败，请稍后重试');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-gray-900/90 backdrop-blur-sm border border-yellow-500/50 rounded-xl p-4 shadow-lg max-w-sm">
        <h3 className="text-yellow-400 font-bold mb-2 flex items-center gap-2">
          <span className="text-2xl">💎</span>
          Shit NFT on Injective
        </h3>
        
        <div className="text-xs text-gray-400 mb-3">
          你的钱包地址: {formatAddress(evmAddress)}
        </div>

        {!hasClaimed ? (
          <>
            <p className="text-sm text-gray-300 mb-3">
              免费领取你的专属厕所通行证 NFT！
            </p>
            <button
              onClick={handleClaim}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '领取中...' : '立即领取 Shit NFT'}
            </button>
          </>
        ) : nftData ? (
          <div className="space-y-2">
            <p className="text-sm text-green-400">✅ 已领取 NFT</p>
            <div className="text-xs space-y-1">
              <p className="text-gray-300">{nftData.metadata.name}</p>
              <p className="text-yellow-400">
                稀有度: {nftData.metadata.attributes.find((a) => a.trait_type === 'Rarity')?.value}
              </p>
            </div>
          </div>
        ) : null}

        {error && (
          <p className="text-red-400 text-sm mt-2">{error}</p>
        )}
      </div>

      {/* 成功动画 */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-gray-900 border border-green-500 rounded-2xl p-6 shadow-2xl shadow-green-500/50 animate-bounce-in">
            <div className="text-center">
              <span className="text-6xl">🚽</span>
              <h3 className="text-2xl font-bold text-green-400 mt-2">领取成功！</h3>
              <p className="text-gray-300 mt-1">{nftData?.metadata.name}</p>
              <p className="text-yellow-400 text-sm mt-2">
                {nftData?.metadata.attributes.find((a) => a.trait_type === 'Rarity')?.value}
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}