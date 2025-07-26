'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserIdentity } from '@/utils/userIdentity';
import { generateEVMAddress } from '@/utils/web3Utils';
import { partners } from '@/config/partners';

interface NFTCollection {
  partnerId: string;
  partnerName: string;
  nftName: string;
  owned: boolean;
  tokenId?: string;
  claimedAt?: number;
  rarity?: string;
}

export default function MyToiletPage() {
  const router = useRouter();
  const [userIdentity, setUserIdentity] = useState<{ username?: string } | null>(null);
  const [evmAddress, setEvmAddress] = useState<string>('');
  const [collections, setCollections] = useState<NFTCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const identity = getUserIdentity();
    setUserIdentity(identity);
    const address = generateEVMAddress(identity.fingerprint);
    setEvmAddress(address);
    
    // 获取用户的 NFT 收藏状态
    fetchUserNFTs(address);
  }, []);

  const fetchUserNFTs = async (address: string) => {
    try {
      // 获取主 NFT 状态
      const mainNFTResponse = await fetch(`/api/v1/nft-status/${address}`);
      const mainNFTData = await mainNFTResponse.json();

      // 初始化收藏列表
      const collectionList: NFTCollection[] = [
        {
          partnerId: 'default',
          partnerName: 'ShitX',
          nftName: 'Shit NFT',
          owned: mainNFTData.hasClaimed || false,
          tokenId: mainNFTData.nft?.tokenId,
          claimedAt: mainNFTData.nft?.claimedAt,
          rarity: mainNFTData.nft?.metadata?.attributes?.find((a: { trait_type: string; value: string | number }) => a.trait_type === 'Rarity')?.value,
        }
      ];

      // 检查每个合作方 NFT
      for (const partner of partners) {
        const partnerNFTResponse = await fetch(`/api/v1/partner-nft-status/${partner.id}/${address}`);
        const partnerNFTData = await partnerNFTResponse.json();

        collectionList.push({
          partnerId: partner.id,
          partnerName: partner.displayName,
          nftName: partner.nftName,
          owned: partnerNFTData.hasClaimed || false,
          tokenId: partnerNFTData.nft?.tokenId,
          claimedAt: partnerNFTData.nft?.claimedAt,
          rarity: partnerNFTData.nft?.metadata?.attributes?.find((a: { trait_type: string; value: string | number }) => a.trait_type === 'Rarity')?.value,
        });
      }

      setCollections(collectionList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      setLoading(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(evmAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRarityColor = (rarity?: string) => {
    if (!rarity) return 'text-gray-500';
    if (rarity.includes('Legendary')) return 'text-yellow-400';
    if (rarity.includes('Epic')) return 'text-purple-400';
    if (rarity.includes('Rare')) return 'text-blue-400';
    if (rarity.includes('Uncommon')) return 'text-green-400';
    return 'text-gray-400';
  };

  const collectedCount = collections.filter(c => c.owned).length;
  const totalCount = collections.length;
  const completionPercentage = (collectedCount / totalCount) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">加载厕所数据中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 返回按钮 */}
        <button
          onClick={() => router.push('/')}
          className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          ← 返回首页
        </button>

        {/* 用户信息 */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 mb-6 text-white">
          <h1 className="text-3xl font-bold mb-4">🚽 我的厕所</h1>
          
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 mb-1">用户名</p>
              <p className="text-xl font-mono">{userIdentity?.username || '未知用户'}</p>
            </div>
            
            <div>
              <p className="text-gray-400 mb-1">EVM 地址</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono break-all">{evmAddress}</p>
                <button
                  onClick={copyAddress}
                  className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
            </div>

            <div>
              <p className="text-gray-400 mb-1">收集进度</p>
              <div className="bg-gray-700 rounded-full h-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <p className="text-sm mt-1">{collectedCount} / {totalCount} ({completionPercentage.toFixed(0)}%)</p>
            </div>
          </div>
        </div>

        {/* NFT 收藏 */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-4 text-white">💩 NFT 收藏</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {collections.map((collection) => (
              <div
                key={collection.partnerId}
                className={`border-2 rounded-xl p-4 transition-all ${
                  collection.owned 
                    ? 'border-yellow-400 bg-yellow-400/10' 
                    : 'border-gray-600 bg-gray-700/30'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-white">{collection.nftName}</h3>
                    <p className="text-sm text-gray-400">{collection.partnerName}</p>
                  </div>
                  {collection.owned && (
                    <span className="text-2xl">✅</span>
                  )}
                </div>

                {collection.owned && collection.claimedAt ? (
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-300">Token ID: #{collection.tokenId}</p>
                    <p className={getRarityColor(collection.rarity as string | undefined)}>
                      稀有度: {collection.rarity}
                    </p>
                    <p className="text-gray-400">
                      获得时间: {new Date(collection.claimedAt!).toLocaleString('zh-CN')}
                    </p>
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">
                    <p>未获得</p>
                    <p className="text-xs mt-1">
                      {collection.partnerId === 'default' 
                        ? '访问首页即可获得' 
                        : '扫描合作方二维码获得'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 成就提示 */}
          {completionPercentage === 100 && (
            <div className="mt-6 p-4 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl text-black text-center">
              <p className="text-xl font-bold">🏆 恭喜！你已经集齐所有 NFT！</p>
              <p className="text-sm mt-1">你是真正的厕所收藏家！</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}