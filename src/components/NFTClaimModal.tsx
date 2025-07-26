'use client';

import { useState, useEffect } from 'react';
import { getUserIdentity } from '@/utils/userIdentity';
import { generateEVMAddress, claimShitNFT, checkNFTStatus, ShitNFT } from '@/utils/web3Utils';
import { getClaimableNFTs, PartnerNFT } from '@/config/partnerNFTs';

interface NFTClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: 'new_user' | 'old_user_scan' | 'new_user_scan';
  partnerNFT?: {
    partnerId: string;
    partnerName: string;
    nftName: string;
  };
}

interface ClaimResult {
  partnerId: string;
  nftName: string;
  partnerName: string;
  success: boolean;
  rarity?: string;
  tokenId?: string;
  error?: string;
  alreadyClaimed?: boolean;
}

export function NFTClaimModal({ isOpen, onClose, scenario, partnerNFT }: NFTClaimModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [claimResults, setClaimResults] = useState<ClaimResult[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      handleClaim();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleClaim = async () => {
    setIsLoading(true);
    setClaimResults([]);

    try {
      const identity = getUserIdentity();
      const results: ClaimResult[] = [];

      // 场景1: 新用户直接访问 - 只领取主NFT
      if (scenario === 'new_user') {
        const mainNFTStatus = await checkNFTStatus(identity.fingerprint);
        
        if (!mainNFTStatus.hasClaimed) {
          const result = await claimShitNFT(identity, 'default');
          results.push({
            partnerId: 'default',
            nftName: 'Shit NFT',
            partnerName: 'ShitX',
            success: result.success,
            rarity: result.nft?.metadata?.attributes?.find((a: any) => a.trait_type === 'Rarity')?.value?.toString(),
            tokenId: result.nft?.tokenId,
            error: result.error
          });
        } else {
          // 不应该发生，因为新用户应该没有NFT
          results.push({
            partnerId: 'default',
            nftName: 'Shit NFT',
            partnerName: 'ShitX',
            success: false,
            alreadyClaimed: true
          });
        }
      }
      
      // 场景2: 老用户扫码 - 只领取合作方NFT
      else if (scenario === 'old_user_scan' && partnerNFT) {
        // 检查合作方NFT状态
        const evmAddress = generateEVMAddress(identity.fingerprint);
        const partnerResponse = await fetch(`/api/v1/partner-nft-status/${partnerNFT.partnerId}/${evmAddress}`);
        const partnerStatus = await partnerResponse.json();
        
        if (!partnerStatus.hasClaimed) {
          const result = await claimShitNFT(identity, partnerNFT.partnerId);
          results.push({
            partnerId: partnerNFT.partnerId,
            nftName: partnerNFT.nftName,
            partnerName: partnerNFT.partnerName,
            success: result.success,
            rarity: result.nft?.metadata?.attributes?.find((a: any) => a.trait_type === 'Rarity')?.value?.toString(),
            tokenId: result.nft?.tokenId,
            error: result.error
          });
        } else {
          results.push({
            partnerId: partnerNFT.partnerId,
            nftName: partnerNFT.nftName,
            partnerName: partnerNFT.partnerName,
            success: false,
            alreadyClaimed: true
          });
        }
      }
      
      // 场景3: 新用户扫码 - 领取主NFT和合作方NFT
      else if (scenario === 'new_user_scan' && partnerNFT) {
        const evmAddress = generateEVMAddress(identity.fingerprint);
        
        // 先领取主NFT
        const mainNFTStatus = await checkNFTStatus(identity.fingerprint);
        if (!mainNFTStatus.hasClaimed) {
          const mainResult = await claimShitNFT(identity, 'default');
          results.push({
            partnerId: 'default',
            nftName: 'Shit NFT',
            partnerName: 'ShitX',
            success: mainResult.success,
            rarity: mainResult.nft?.metadata?.attributes?.find((a: any) => a.trait_type === 'Rarity')?.value?.toString(),
            tokenId: mainResult.nft?.tokenId,
            error: mainResult.error
          });
        }
        
        // 再领取合作方NFT
        const partnerResponse = await fetch(`/api/v1/partner-nft-status/${partnerNFT.partnerId}/${evmAddress}`);
        const partnerStatus = await partnerResponse.json();
        if (!partnerStatus.hasClaimed) {
          const partnerResult = await claimShitNFT(identity, partnerNFT.partnerId);
          results.push({
            partnerId: partnerNFT.partnerId,
            nftName: partnerNFT.nftName,
            partnerName: partnerNFT.partnerName,
            success: partnerResult.success,
            rarity: partnerResult.nft?.metadata?.attributes?.find((a: any) => a.trait_type === 'Rarity')?.value?.toString(),
            tokenId: partnerResult.nft?.tokenId,
            error: partnerResult.error
          });
        }
      }

      setClaimResults(results);
      setShowSuccess(true);
      
      // 5秒后自动关闭
      setTimeout(() => {
        onClose();
      }, 5000);
      
    } catch (error) {
      console.error('Error claiming NFTs:', error);
      setClaimResults([{
        partnerId: 'error',
        nftName: 'Error',
        partnerName: 'Error',
        success: false,
        error: '领取失败，请稍后重试'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getRarityColor = (rarity?: string) => {
    if (!rarity) return 'text-gray-400';
    if (rarity.includes('Legendary')) return 'text-yellow-400';
    if (rarity.includes('Epic')) return 'text-purple-400';
    if (rarity.includes('Rare')) return 'text-blue-400';
    if (rarity.includes('Uncommon')) return 'text-green-400';
    return 'text-gray-400';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 模态框内容 */}
      <div className="relative bg-gray-900/95 border border-yellow-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 标题 */}
        <div className="text-center mb-6">
          <span className="text-4xl mb-2 block">💩</span>
          <h2 className="text-2xl font-bold text-yellow-400">
            {isLoading ? '正在获取 NFT...' : '恭喜获得 NFT！'}
          </h2>
        </div>

        {/* 内容区域 */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
              <p className="text-gray-400 mt-4">正在为您铸造独一无二的 NFT...</p>
            </div>
          ) : (
            <>
              {claimResults.map((result, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.success ? 'bg-green-900/20 border-green-500/50' : 
                    result.alreadyClaimed ? 'bg-yellow-900/20 border-yellow-500/50' :
                    'bg-red-900/20 border-red-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-white">{result.nftName}</h3>
                      <p className="text-sm text-gray-400">{result.partnerName}</p>
                      
                      {result.success && (
                        <>
                          <p className={`text-sm mt-1 ${getRarityColor(result.rarity)}`}>
                            {result.rarity} #{result.tokenId}
                          </p>
                          {result.partnerId === 'default' && (
                            <p className="text-xs text-gray-500 mt-1">
                              首个 ShitX NFT，欢迎加入厕所革命！
                            </p>
                          )}
                        </>
                      )}
                      
                      {result.alreadyClaimed && (
                        <p className="text-sm text-yellow-400 mt-1">
                          您已经拥有此 NFT
                        </p>
                      )}
                      
                      {result.error && (
                        <p className="text-sm text-red-400 mt-1">
                          {result.error}
                        </p>
                      )}
                    </div>
                    
                    <div className="ml-3">
                      {result.success && (
                        <span className="text-2xl">✅</span>
                      )}
                      {result.alreadyClaimed && (
                        <span className="text-2xl">⚠️</span>
                      )}
                      {result.error && (
                        <span className="text-2xl">❌</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* 提示信息 */}
              <div className="mt-6 text-center text-sm text-gray-400">
                <p>NFT 已保存到您的钱包地址</p>
                <p className="mt-2">
                  <a href="/all-nft" className="text-blue-400 hover:text-blue-300">
                    查看我的收藏 →
                  </a>
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          0% {
            transform: scale(0.9);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}