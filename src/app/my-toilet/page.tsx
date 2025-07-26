'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserIdentity, importAccount, updateUsername, UserIdentity } from '@/utils/userIdentity';
import { generateEVMAddress } from '@/utils/web3Utils';
import { usePartners } from '@/hooks/usePartners';

interface NFTCollection {
  partnerId: string;
  partnerName: string;
  nftName: string;
  owned: boolean;
  tokenId?: string;
  claimedAt?: number;
  rarity?: string;
  isAncestor?: boolean;
}

export default function MyToiletPage() {
  const router = useRouter();
  const [userIdentity, setUserIdentity] = useState<UserIdentity | null>(null);
  const [evmAddress, setEvmAddress] = useState<string>('');
  const [collections, setCollections] = useState<NFTCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [transferCode, setTransferCode] = useState<string>('');
  const [showTransferCode, setShowTransferCode] = useState(false);
  const [importTransferCode, setImportTransferCode] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const { partners } = usePartners();
  const [importError, setImportError] = useState<string>('');
  const [generateLoading, setGenerateLoading] = useState(false);
  const [ancestorCode, setAncestorCode] = useState<string>('');
  const [ancestorLoading, setAncestorLoading] = useState(false);
  const [ancestorError, setAncestorError] = useState<string>('');
  const [ancestorSuccess, setAncestorSuccess] = useState<string>('');
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState<string>('');

  useEffect(() => {
    const identity = getUserIdentity();
    setUserIdentity(identity);
    const address = generateEVMAddress(identity.fingerprint);
    setEvmAddress(address);
    
    // 获取用户的 NFT 收藏状态
    if (partners && partners.length > 0) {
      fetchUserNFTs(address);
    }
    
    // 获取现有的转移码
    fetchTransferCode(identity);
  }, [partners]);

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
          isAncestor: mainNFTData.nft?.isAncestor || false,
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
          isAncestor: partnerNFTData.nft?.isAncestor || false,
        });
      }

      setCollections(collectionList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      setLoading(false);
    }
  };

  // 获取转移码
  const fetchTransferCode = async (identity: any) => {
    try {
      const response = await fetch(`/api/v1/account/transfer-code?fingerprint=${identity.fingerprint}&userId=${identity.id}`);
      const data = await response.json();
      if (data.hasCode) {
        setTransferCode(data.transferCode);
      }
    } catch (error) {
      console.error('Error fetching transfer code:', error);
    }
  };

  // 生成转移码
  const generateTransferCode = async () => {
    if (!userIdentity) return;
    
    setGenerateLoading(true);
    try {
      const response = await fetch('/api/v1/account/transfer-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fingerprint: userIdentity.fingerprint,
          userId: userIdentity.id,
          username: userIdentity.username
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setTransferCode(data.transferCode);
        setShowTransferCode(true);
      }
    } catch (error) {
      console.error('Error generating transfer code:', error);
    } finally {
      setGenerateLoading(false);
    }
  };

  // 导入账户
  const handleImportAccount = async () => {
    if (!importTransferCode.trim()) return;
    
    setImporting(true);
    setImportError('');
    
    try {
      const result = await importAccount(importTransferCode.trim());
      if (result.success) {
        // 刷新页面以使用新账户
        window.location.reload();
      } else {
        setImportError(result.error || '导入失败');
      }
    } catch (error) {
      setImportError('导入失败，请重试');
    } finally {
      setImporting(false);
    }
  };

  // 保存用户名
  const handleSaveUsername = () => {
    if (!newUsername.trim() || !userIdentity) return;
    
    const success = updateUsername(newUsername.trim());
    if (success) {
      setUserIdentity({
        ...userIdentity,
        username: newUsername.trim()
      });
      setEditingUsername(false);
    }
  };

  // 使用始祖码
  const handleUseAncestorCode = async () => {
    if (!ancestorCode.trim() || !userIdentity) return;
    
    setAncestorLoading(true);
    setAncestorError('');
    setAncestorSuccess('');
    
    try {
      const response = await fetch('/api/v1/ancestor-code/use', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: ancestorCode.trim(),
          fingerprint: userIdentity.fingerprint,
          userId: userIdentity.id,
          username: userIdentity.username
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAncestorSuccess(data.message);
        setAncestorCode('');
        // 刷新NFT列表
        fetchUserNFTs(evmAddress);
      } else {
        setAncestorError(data.error || '使用始祖码失败');
      }
    } catch (error) {
      setAncestorError('使用始祖码失败，请重试');
    } finally {
      setAncestorLoading(false);
    }
  };

  // 复制转移码
  const copyTransferCode = () => {
    navigator.clipboard.writeText(transferCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <div className="text-white text-2xl animate-pulse">加载ShitX数据中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-3 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {/* 返回按钮 */}
        <button
          onClick={() => router.push('/')}
          className="mb-4 sm:mb-6 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
        >
          ← 返回首页
        </button>

        {/* 用户信息 */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 text-white">
          <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">🚽 我的ShitX</h1>
          
          <div className="space-y-3 sm:space-y-4">
            <div>
              <p className="text-gray-400 mb-1 text-sm sm:text-base">用户名</p>
              <div className="flex items-center gap-2">
                {editingUsername ? (
                  <>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="flex-1 px-3 py-1 bg-gray-700 rounded text-white text-lg sm:text-xl"
                      maxLength={20}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveUsername}
                      className="px-3 py-1 bg-green-600 rounded hover:bg-green-700 transition-colors text-sm"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => {
                        setEditingUsername(false);
                        setNewUsername(userIdentity?.username || '');
                      }}
                      className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-700 transition-colors text-sm"
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-lg sm:text-xl font-mono flex-1">{userIdentity?.username || '未知用户'}</p>
                    <button
                      onClick={() => {
                        setEditingUsername(true);
                        setNewUsername(userIdentity?.username || '');
                      }}
                      className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 transition-colors text-sm"
                    >
                      编辑
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div>
              <p className="text-gray-400 mb-1 text-sm sm:text-base">EVM 地址</p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <p className="text-xs sm:text-sm font-mono break-all flex-1">{evmAddress}</p>
                <button
                  onClick={copyAddress}
                  className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 transition-colors text-sm self-start sm:self-auto"
                >
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
            </div>

            <div>
              <p className="text-gray-400 mb-1 text-sm sm:text-base">收集进度</p>
              <div className="bg-gray-700 rounded-full h-3 sm:h-4 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-full transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <p className="text-xs sm:text-sm mt-1">{collectedCount} / {totalCount} ({completionPercentage.toFixed(0)}%)</p>
            </div>
          </div>
        </div>

        {/* 账户管理 */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 text-white">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">🔑 账户管理</h2>
          
          {/* 转移码管理 */}
          <div className="space-y-3 sm:space-y-4">
            <div>
              <p className="text-gray-400 mb-2 text-sm sm:text-base">转移码（账户私钥）</p>
              {transferCode ? (
                <div className="space-y-2">
                  <div className="bg-gray-700/50 rounded-lg p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="text-xs font-mono break-all flex-1">{transferCode}</span>
                      <button
                        onClick={copyTransferCode}
                        className="px-3 py-1 bg-green-600 rounded hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
                      >
                        {copied ? '已复制' : '复制'}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={generateTransferCode}
                    disabled={generateLoading}
                    className="px-4 py-2 bg-yellow-600 rounded hover:bg-yellow-700 transition-colors text-sm disabled:opacity-50"
                  >
                    {generateLoading ? '生成中...' : '重新生成'}
                  </button>
                  <p className="text-xs text-gray-400">
                    ⚠️ 重新生成将使旧转移码失效，请妥善保管新转移码
                  </p>
                </div>
              ) : (
                <div>
                  <button
                    onClick={generateTransferCode}
                    disabled={generateLoading}
                    className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {generateLoading ? '生成中...' : '生成转移码'}
                  </button>
                  <p className="text-xs text-gray-400 mt-1">
                    转移码可用于在其他设备上导入此账户
                  </p>
                </div>
              )}
            </div>

            {/* 导入其他账户 */}
            <div className="border-t border-gray-700 pt-3 sm:pt-4">
              <p className="text-gray-400 mb-2 text-sm sm:text-base">导入其他账户</p>
              <div className="space-y-2">
                <input
                  type="text"
                  value={importTransferCode}
                  onChange={(e) => setImportTransferCode(e.target.value)}
                  placeholder="输入64位转移码"
                  className="w-full px-3 py-2 bg-gray-700 rounded text-white placeholder-gray-400 text-sm font-mono"
                />
                {importError && (
                  <p className="text-red-400 text-xs">{importError}</p>
                )}
                <button
                  onClick={handleImportAccount}
                  disabled={importing || !importTransferCode.trim()}
                  className="w-full sm:w-auto px-4 py-2 bg-purple-600 rounded hover:bg-purple-700 transition-colors text-sm disabled:opacity-50"
                >
                  {importing ? '导入中...' : '导入账户'}
                </button>
                <p className="text-xs text-gray-400">
                  💡 导入账户后将切换到新账户，当前设备将绑定新账户
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 始祖码 */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 text-white">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">👑 始祖码</h2>
          
          <div className="space-y-3 sm:space-y-4">
            <div>
              <p className="text-gray-400 mb-2 text-sm sm:text-base">使用始祖码成为NFT始祖</p>
              <p className="text-xs text-gray-500 mb-3">
                始祖是某个NFT类型的第一个持有者，拥有该类型NFT的分发权限。始祖码只能使用一次。
              </p>
              
              <div className="space-y-2">
                <input
                  type="text"
                  value={ancestorCode}
                  onChange={(e) => setAncestorCode(e.target.value)}
                  placeholder="输入64位始祖码"
                  className="w-full px-3 py-2 bg-gray-700 rounded text-white placeholder-gray-400 text-sm font-mono"
                />
                
                {ancestorError && (
                  <p className="text-red-400 text-xs">{ancestorError}</p>
                )}
                
                {ancestorSuccess && (
                  <p className="text-green-400 text-xs">{ancestorSuccess}</p>
                )}
                
                <button
                  onClick={handleUseAncestorCode}
                  disabled={ancestorLoading || !ancestorCode.trim()}
                  className="w-full sm:w-auto px-4 py-2 bg-yellow-600 rounded hover:bg-yellow-700 transition-colors text-sm disabled:opacity-50"
                >
                  {ancestorLoading ? '使用中...' : '使用始祖码'}
                </button>
                
                <p className="text-xs text-gray-400">
                  👑 成为始祖后，你将获得该NFT类型的特殊标识和分发权限
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* NFT 收藏 */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white">💩 NFT 收藏</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {collections.map((collection) => (
              <div
                key={collection.partnerId}
                className={`border-2 rounded-xl p-3 sm:p-4 transition-all ${
                  collection.owned 
                    ? 'border-yellow-400 bg-yellow-400/10' 
                    : 'border-gray-600 bg-gray-700/30'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <h3 className="font-bold text-white text-sm sm:text-base truncate">{collection.nftName}</h3>
                      {collection.isAncestor && (
                        <span className="text-yellow-400 text-xs" title="始祖NFT">👑</span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-400 truncate">{collection.partnerName}</p>
                  </div>
                  {collection.owned && (
                    <span className="text-xl sm:text-2xl ml-2 flex-shrink-0">✅</span>
                  )}
                </div>

                {collection.owned && collection.claimedAt ? (
                  <div className="space-y-1 text-xs sm:text-sm">
                    <p className="text-gray-300 break-all">Token ID: #{collection.tokenId}</p>
                    <p className={getRarityColor(collection.rarity as string | undefined)}>
                      稀有度: {collection.rarity}
                    </p>
                    {collection.isAncestor && (
                      <p className="text-yellow-400 text-xs font-bold">
                        👑 始祖NFT - 拥有分发权限
                      </p>
                    )}
                    <p className="text-gray-400 text-xs">
                      获得时间: {new Date(collection.claimedAt!).toLocaleString('zh-CN')}
                    </p>
                  </div>
                ) : (
                  <div className="text-gray-500 text-xs sm:text-sm">
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
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl text-black text-center">
              <p className="text-lg sm:text-xl font-bold">🏆 恭喜！你已经集齐所有 NFT！</p>
              <p className="text-xs sm:text-sm mt-1">你是真正的ShitX收藏家！</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}