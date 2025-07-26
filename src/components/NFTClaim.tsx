'use client';

import { useState, useEffect } from 'react';
import { getUserIdentity } from '@/utils/userIdentity';
import { generateEVMAddress, claimShitNFT, checkNFTStatus, ShitNFT } from '@/utils/web3Utils';
import { getClaimableNFTs, PartnerNFT } from '@/config/partnerNFTs';

interface ClaimStatus {
  [partnerId: string]: {
    hasClaimed: boolean;
    nft?: ShitNFT;
  };
}

export function NFTClaim() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>({});
  const [evmAddress, setEvmAddress] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successNFT, setSuccessNFT] = useState<ShitNFT | null>(null);
  const [error, setError] = useState<string>('');
  const [claimableNFTs, setClaimableNFTs] = useState<PartnerNFT[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [subsidyInfo, setSubsidyInfo] = useState<{ amount: string; txHash: string; message: string } | null>(null);
  const [copySuccess, setCopySuccess] = useState<string>('');

  useEffect(() => {
    initializeClaimStatus();
  }, []);

  const initializeClaimStatus = async () => {
    const identity = getUserIdentity();
    const address = generateEVMAddress(identity.fingerprint);
    setEvmAddress(address);

    // 获取可领取的 NFT 列表
    const claimable = getClaimableNFTs(identity.referralSource);
    setClaimableNFTs(claimable);

    // 检查每个 NFT 的领取状态
    const status: ClaimStatus = {};
    for (const nft of claimable) {
      // TODO: 实际应该根据不同的 partnerId 检查不同的状态
      const result = await checkNFTStatus(identity.fingerprint);
      status[nft.partnerId] = {
        hasClaimed: result.hasClaimed,
        nft: result.nft as ShitNFT
      };
    }
    setClaimStatus(status);
  };

  const handleClaim = async (partnerNFT: PartnerNFT) => {
    setIsLoading(partnerNFT.partnerId);
    setError('');

    try {
      const identity = getUserIdentity();
      const result = await claimShitNFT(identity, partnerNFT.partnerId);

      if (result.success && result.nft) {
        setClaimStatus(prev => ({
          ...prev,
          [partnerNFT.partnerId]: {
            hasClaimed: true,
            nft: result.nft
          }
        }));
        setSuccessNFT(result.nft);
        // 检查是否有补贴信息
        if (result.subsidy) {
          setSubsidyInfo(result.subsidy);
        }
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setSuccessNFT(null);
          setSubsidyInfo(null);
        }, 5000);
      } else {
        setError(result.error || '领取失败，请稍后重试');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setIsLoading(null);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // 计算已领取数量
  const claimedCount = Object.values(claimStatus).filter(s => s.hasClaimed).length;
  const totalCount = claimableNFTs.length;

  // 如果所有 NFT 都已领取，不显示弹窗
  if (totalCount > 0 && claimedCount === totalCount) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-gray-900/90 backdrop-blur-sm border border-yellow-500/50 rounded-xl p-4 shadow-lg max-w-sm">
        <h3 className="text-yellow-400 font-bold mb-2 flex items-center gap-2">
          <span className="text-2xl">💎</span>
          Shit NFT Collection
          {totalCount > 1 && (
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
              {claimedCount}/{totalCount}
            </span>
          )}
        </h3>
        
        <div className="text-xs text-gray-400 mb-3">
          你的钱包地址: {formatAddress(evmAddress)}
        </div>

        {/* NFT 列表 */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {claimableNFTs.slice(0, showAll ? undefined : 2).map((nft) => {
            const status = claimStatus[nft.partnerId];
            const hasClaimed = status?.hasClaimed || false;
            const isLoadingThis = isLoading === nft.partnerId;

            return (
              <div key={nft.partnerId} className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-green-400">{nft.nftName}</h4>
                    <p className="text-xs text-gray-400">{nft.partnerName}</p>
                  </div>
                  {nft.partnerId !== 'default' && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                      合作款
                    </span>
                  )}
                </div>

                {!hasClaimed ? (
                  <button
                    onClick={() => handleClaim(nft)}
                    disabled={isLoadingThis}
                    className="w-full px-3 py-1.5 bg-yellow-500 text-black text-sm font-bold rounded hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingThis ? '领取中...' : '立即领取'}
                  </button>
                ) : status?.nft ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-green-400">✅ 已领取</span>
                    <span className="text-xs text-gray-400">
                      #{status.nft.tokenId}
                    </span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* 显示更多按钮 */}
        {claimableNFTs.length > 2 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full mt-2 text-xs text-gray-400 hover:text-gray-300"
          >
            {showAll ? '收起' : `查看全部 (${claimableNFTs.length} 个)`}
          </button>
        )}

        {error && (
          <p className="text-red-400 text-xs mt-2">{error}</p>
        )}
      </div>

      {/* 复制成功提示 */}
      {copySuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-green-500 text-black px-4 py-2 rounded-lg shadow-lg animate-fade-in-out">
            <p className="text-sm font-medium">
              ✅ 已复制{copySuccess === 'nft' ? 'NFT' : 'SHIT补贴'}交易哈希
            </p>
          </div>
        </div>
      )}

      {/* 成功动画 */}
      {showSuccess && successNFT && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-gray-900 border border-green-500 rounded-2xl p-6 shadow-2xl shadow-green-500/50 animate-bounce-in">
            <div className="text-center">
              <span className="text-6xl">🚽</span>
              <h3 className="text-2xl font-bold text-green-400 mt-2">领取成功！</h3>
              <p className="text-gray-300 mt-1">{successNFT.metadata.name}</p>
              <p className="text-yellow-400 text-sm mt-2">
                {successNFT.metadata.attributes.find((a) => a.trait_type === 'Rarity')?.value}
              </p>
              {subsidyInfo && (
                <div className="mt-3 p-2 bg-green-500/20 rounded-lg">
                  <p className="text-green-400 font-bold">🎉 {subsidyInfo.message}</p>
                  <p className="text-xs text-gray-400 mt-1">首次领取 NFT 专属福利</p>
                </div>
              )}
              {successNFT.txHash && (
                <div className="mt-3 space-y-2">
                  <div className="bg-gray-800/50 rounded p-2 text-xs">
                    <div className="text-gray-400 mb-1">NFT 交易哈希:</div>
                    <div className="flex items-center gap-2">
                      <code className="text-green-400 break-all flex-1">
                        {successNFT.txHash.slice(0, 10)}...{successNFT.txHash.slice(-8)}
                      </code>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(successNFT.txHash);
                          setCopySuccess('nft');
                          setTimeout(() => setCopySuccess(''), 2000);
                        }}
                        className="text-gray-400 hover:text-white transition-colors"
                        title="复制完整哈希"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {subsidyInfo && subsidyInfo.txHash && (
                    <div className="bg-gray-800/50 rounded p-2 text-xs">
                      <div className="text-gray-400 mb-1">SHIT 补贴交易哈希:</div>
                      <div className="flex items-center gap-2">
                        <code className="text-yellow-400 break-all flex-1">
                          {subsidyInfo.txHash.slice(0, 10)}...{subsidyInfo.txHash.slice(-8)}
                        </code>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(subsidyInfo.txHash);
                            setCopySuccess('subsidy');
                            setTimeout(() => setCopySuccess(''), 2000);
                          }}
                          className="text-gray-400 hover:text-white transition-colors"
                          title="复制完整哈希"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                  <a
                    href={`https://testnet.explorer.injective.network/transaction/${successNFT.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>在区块链浏览器中查看</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}
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
        
        @keyframes fade-in-out {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          20% {
            opacity: 1;
            transform: translateY(0);
          }
          80% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-10px);
          }
        }
        .animate-fade-in-out {
          animation: fade-in-out 2s ease-in-out;
        }
      `}</style>
    </div>
  );
}