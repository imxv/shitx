'use client';

import { useState, useEffect } from 'react';
import { getUserIdentity } from '@/utils/userIdentity';
import { generateEVMAddress } from '@/utils/web3Utils';
import { usePartners } from '@/hooks/usePartners';
import Link from 'next/link';

interface CollectionStatus {
  totalNFTs: number;
  collectedNFTs: number;
  collectionRate: number;
  recentNFT?: {
    name: string;
    rarity: string;
    claimedAt: number;
  };
}

export function NFTCollectionCard() {
  const [status, setStatus] = useState<CollectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { partners } = usePartners();
  
  useEffect(() => {
    if (partners && partners.length > 0) {
      fetchCollectionStatus();
    }
  }, [partners]);
  
  const fetchCollectionStatus = async () => {
    try {
      const identity = getUserIdentity();
      const evmAddress = generateEVMAddress(identity.fingerprint);
      
      let collectedCount = 0;
      let recentNFT = null;
      let latestClaimTime = 0;
      
      // 检查主 NFT
      const mainNFTResponse = await fetch(`/api/v1/nft-status/${evmAddress}`);
      const mainNFTData = await mainNFTResponse.json();
      
      if (mainNFTData.hasClaimed) {
        collectedCount++;
        if (mainNFTData.nft?.claimedAt && mainNFTData.nft.claimedAt > latestClaimTime) {
          latestClaimTime = mainNFTData.nft.claimedAt;
          recentNFT = {
            name: 'ShitX NFT',
            rarity: mainNFTData.nft?.metadata?.attributes?.find((a: any) => a.trait_type === 'Rarity')?.value || 'Common',
            claimedAt: mainNFTData.nft.claimedAt
          };
        }
      }
      
      // 检查合作方 NFT
      for (const partner of partners) {
        const partnerResponse = await fetch(`/api/v1/partner-nft-status/${partner.id}/${evmAddress}`);
        const partnerData = await partnerResponse.json();
        
        if (partnerData.hasClaimed) {
          collectedCount++;
          if (partnerData.nft?.claimedAt && partnerData.nft.claimedAt > latestClaimTime) {
            latestClaimTime = partnerData.nft.claimedAt;
            recentNFT = {
              name: partner.nftName,
              rarity: partnerData.nft?.metadata?.attributes?.find((a: any) => a.trait_type === 'Rarity')?.value || 'Common',
              claimedAt: partnerData.nft.claimedAt
            };
          }
        }
      }
      
      const totalNFTs = 1 + partners.length; // 主 NFT + 合作方 NFT
      
      setStatus({
        totalNFTs,
        collectedNFTs: collectedCount,
        collectionRate: (collectedCount / totalNFTs) * 100,
        recentNFT: recentNFT || undefined
      });
    } catch (error) {
      console.error('Error fetching collection status:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getRarityColor = (rarity: string) => {
    if (rarity.includes('Legendary')) return 'text-yellow-400';
    if (rarity.includes('Epic')) return 'text-purple-400';
    if (rarity.includes('Rare')) return 'text-blue-400';
    if (rarity.includes('Uncommon')) return 'text-green-400';
    return 'text-gray-400';
  };
  
  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-32 mb-2"></div>
        <div className="h-8 bg-gray-700 rounded w-48"></div>
      </div>
    );
  }
  
  if (!status) return null;
  
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30 shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm text-gray-400 mb-1">ShitX NFT 收藏进度</h3>
          <div>
            <p className="text-2xl font-bold text-purple-400">
              {status.collectedNFTs} / {status.totalNFTs}
            </p>
            <div className="mt-2">
              <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-400 to-purple-600 h-full transition-all duration-500"
                  style={{ width: `${status.collectionRate}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-1">
                收藏率: {status.collectionRate.toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
        <Link 
          href="/all-nft"
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          查看收藏 →
        </Link>
      </div>
    </div>
  );
}