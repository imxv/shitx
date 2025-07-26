'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserIdentity } from '@/utils/userIdentity';
import { generateEVMAddress } from '@/utils/web3Utils';
import { partners } from '@/config/partners';
import Link from 'next/link';

interface NFTCollection {
  partnerId: string;
  partnerName: string;
  nftName: string;
  owned: boolean;
  tokenId?: string;
  claimedAt?: number;
  rarity?: string;
  isAncestor?: boolean;
  totalSupply?: number;
  currentSupply?: number;
  description?: string;
  partnerLogo?: string;
}

export default function AllNFTPage() {
  const router = useRouter();
  const [collections, setCollections] = useState<NFTCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [evmAddress, setEvmAddress] = useState<string>('');
  const [selectedNFT, setSelectedNFT] = useState<string | null>(null);

  useEffect(() => {
    const identity = getUserIdentity();
    const address = generateEVMAddress(identity.fingerprint);
    setEvmAddress(address);
    
    // 获取所有 NFT 信息和用户收藏状态
    fetchAllNFTs(address);
  }, []);

  const fetchAllNFTs = async (address: string) => {
    try {
      const collectionList: NFTCollection[] = [];
      
      // 获取主 NFT 状态
      const mainNFTResponse = await fetch(`/api/v1/nft-status/${address}`);
      const mainNFTData = await mainNFTResponse.json();
      
      collectionList.push({
        partnerId: 'default',
        partnerName: 'ShitX',
        nftName: 'Shit NFT',
        owned: mainNFTData.hasClaimed || false,
        tokenId: mainNFTData.nft?.tokenId,
        claimedAt: mainNFTData.nft?.claimedAt,
        rarity: mainNFTData.nft?.metadata?.attributes?.find((a: any) => a.trait_type === 'Rarity')?.value,
        isAncestor: mainNFTData.nft?.isAncestor || false,
        totalSupply: 10000,
        currentSupply: mainNFTData.totalMinted || 0,
        description: 'ShitX 平台原生 NFT',
        partnerLogo: 'shitx.png'
      });

      // 获取所有合作方 NFT
      for (const partner of partners) {
        const partnerResponse = await fetch(`/api/v1/partner-nft-status/${partner.id}/${address}`);
        const partnerData = await partnerResponse.json();
        
        collectionList.push({
          partnerId: partner.id,
          partnerName: partner.displayName,
          nftName: partner.nftName,
          owned: partnerData.hasClaimed || false,
          tokenId: partnerData.nft?.tokenId,
          claimedAt: partnerData.nft?.claimedAt,
          rarity: partnerData.nft?.metadata?.attributes?.find((a: any) => a.trait_type === 'Rarity')?.value,
          isAncestor: partnerData.nft?.isAncestor || false,
          totalSupply: partner.totalSupply || 10000,
          currentSupply: partnerData.totalMinted || 0,
          description: partner.description || `${partner.displayName} 合作款 NFT`,
          partnerLogo: partner.logo
        });
      }

      setCollections(collectionList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      setLoading(false);
    }
  };

  const getRarityColor = (rarity?: string) => {
    if (!rarity) return 'text-gray-500';
    if (rarity.includes('Legendary')) return 'text-yellow-400';
    if (rarity.includes('Epic')) return 'text-purple-400';
    if (rarity.includes('Rare')) return 'text-blue-400';
    if (rarity.includes('Uncommon')) return 'text-green-400';
    return 'text-gray-400';
  };

  const getProgressPercentage = (current?: number, total?: number) => {
    if (!current || !total || total === 0) return 0;
    return Math.min((current / total) * 100, 100);
  };

  const collectedCount = collections.filter(c => c.owned).length;
  const totalCount = collections.length;
  const completionPercentage = (collectedCount / totalCount) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">加载 NFT 收藏册...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 返回按钮 */}
        <button
          onClick={() => router.push('/')}
          className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          ← 返回首页
        </button>

        {/* 标题和总体进度 */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 mb-6 text-white">
          <h1 className="text-3xl font-bold mb-4">📚 Shit NFT 收藏册</h1>
          
          <div className="mb-4">
            <div className="flex justify-between items-end mb-2">
              <span className="text-lg">总收藏进度</span>
              <span className="text-2xl font-bold text-yellow-400">
                {collectedCount} / {totalCount}
              </span>
            </div>
            <div className="bg-gray-700 rounded-full h-6 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-full transition-all duration-500 flex items-center justify-center"
                style={{ width: `${completionPercentage}%` }}
              >
                <span className="text-sm text-black font-bold">
                  {completionPercentage.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* 成就提示 */}
          {completionPercentage === 100 && (
            <div className="mt-4 p-3 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg text-black text-center">
              <p className="text-lg font-bold">🏆 恭喜！你已经集齐所有 NFT！</p>
              <p className="text-sm">你是真正的 Shit NFT 收藏大师！</p>
            </div>
          )}
        </div>

        {/* NFT 收藏网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <div
              key={collection.partnerId}
              className={`bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border-2 transition-all cursor-pointer hover:scale-105 ${
                collection.owned 
                  ? 'border-yellow-400 shadow-lg shadow-yellow-400/20' 
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              onClick={() => {
                router.push(`/nft-tree/${collection.partnerId}`);
              }}
            >
              {/* NFT 图片区域 */}
              <div className="relative mb-4">
                <div className={`aspect-square rounded-xl overflow-hidden bg-gray-700 ${
                  collection.owned ? '' : 'opacity-50'
                }`}>
                  {collection.partnerLogo ? (
                    // 显示logo图片
                    <div className="w-full h-full flex items-center justify-center p-8">
                      <img 
                        src={collection.partnerId === 'default' ? '/shitx.png' : `/partner/${collection.partnerLogo}`} 
                        alt={collection.partnerName}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    // 没有logo时显示默认内容
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      <span className="text-gray-500">❓</span>
                    </div>
                  )}
                </div>
                
                {/* 稀有度标签 */}
                {collection.owned && collection.rarity && (
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${
                    collection.rarity.includes('Legendary') ? 'bg-yellow-400 text-black' :
                    collection.rarity.includes('Epic') ? 'bg-purple-400 text-white' :
                    collection.rarity.includes('Rare') ? 'bg-blue-400 text-white' :
                    collection.rarity.includes('Uncommon') ? 'bg-green-400 text-white' :
                    'bg-gray-400 text-white'
                  }`}>
                    {collection.rarity}
                  </div>
                )}

                {/* 始祖标记 */}
                {collection.isAncestor && (
                  <div className="absolute top-2 left-2 text-yellow-400 text-2xl" title="始祖 NFT">
                    👑
                  </div>
                )}
              </div>

              {/* NFT 信息 */}
              <div className="space-y-2">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {collection.nftName}
                    {collection.owned && (
                      <span className="text-green-400 text-sm">✓ 已拥有</span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-400">{collection.partnerName}</p>
                </div>

                {/* 描述 */}
                <p className="text-xs text-gray-500">{collection.description}</p>

                {/* 发行进度 */}
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>发行进度</span>
                    <span>{collection.currentSupply || 0} / {collection.totalSupply || 10000}</span>
                  </div>
                  <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-400 to-blue-600 h-full"
                      style={{ width: `${getProgressPercentage(collection.currentSupply, collection.totalSupply)}%` }}
                    />
                  </div>
                </div>

                {/* 拥有详情 */}
                {collection.owned && (
                  <div className="pt-2 border-t border-gray-700 space-y-1">
                    <p className="text-xs text-gray-400">
                      Token ID: #{collection.tokenId}
                    </p>
                    {collection.claimedAt && (
                      <p className="text-xs text-gray-400">
                        获得时间: {new Date(collection.claimedAt).toLocaleDateString('zh-CN')}
                      </p>
                    )}
                  </div>
                )}

                {/* 未拥有提示 */}
                {!collection.owned && (
                  <div className="pt-2 border-t border-gray-700">
                    <p className="text-xs text-gray-500 text-center">
                      {collection.partnerId === 'default' 
                        ? '访问首页即可获得' 
                        : '扫描合作方二维码获得'}
                    </p>
                  </div>
                )}
                
                {/* 查看分发树按钮 - 所有NFT都显示 */}
                <button className="mt-2 w-full px-3 py-1 bg-purple-600 rounded hover:bg-purple-700 transition-colors text-sm text-white">
                  查看分发树 →
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 说明 */}
        <div className="mt-8 bg-gray-800/50 backdrop-blur-md rounded-xl p-4 text-gray-400 text-sm">
          <p className="font-bold mb-2">💡 收藏说明：</p>
          <ul className="list-disc list-inside space-y-1">
            <li>每个 NFT 都有独特的分发树，显示其传播路径</li>
            <li>点击已拥有的 NFT 可查看其完整的分发树</li>
            <li>稀有度从低到高：Common → Uncommon → Rare → Epic → Legendary</li>
            <li>👑 标记表示你是该 NFT 类型的始祖，拥有特殊分发权限</li>
          </ul>
        </div>
      </div>
    </div>
  );
}