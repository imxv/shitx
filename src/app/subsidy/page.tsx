'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateEVMAddress } from '@/utils/web3Utils';
import { getUserIdentity } from '@/utils/userIdentity';

interface TreeNode {
  address: string;
  nftData: any;
  children: TreeNode[];
  depth: number;
}

interface TreeStats {
  totalNodes: number;
  maxDepth: number;
  totalByDepth: Record<number, number>;
  averageReferrals: number;
}

export default function SubsidyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [stats, setStats] = useState<TreeStats | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    // 获取当前用户地址
    const identity = getUserIdentity();
    const address = generateEVMAddress(identity.fingerprint);
    setUserAddress(address);
    
    // 加载分发树
    loadDistributionTree();
  }, []);

  const loadDistributionTree = async (address?: string) => {
    try {
      setLoading(true);
      const url = address ? `/api/subsidy?address=${address}` : '/api/subsidy';
      const response = await fetch(url);
      const data = await response.json();
      
      setTreeData(data.tree);
      setStats(data.stats);
      setLoading(false);
    } catch (error) {
      console.error('Error loading distribution tree:', error);
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchAddress) {
      loadDistributionTree(searchAddress);
    } else {
      loadDistributionTree();
    }
  };

  const toggleNode = (address: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(address)) {
      newExpanded.delete(address);
    } else {
      newExpanded.add(address);
    }
    setExpandedNodes(newExpanded);
  };

  const renderTreeNode = (node: TreeNode, isRoot = false) => {
    if (!node) return null;
    
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.address);
    const nft = node.nftData;
    
    return (
      <div className={`${isRoot ? '' : 'ml-8'} mb-2`}>
        <div 
          className={`flex items-center gap-2 p-3 rounded-lg bg-gray-800/50 border ${
            node.address === userAddress ? 'border-yellow-500' : 'border-gray-700'
          } hover:border-gray-600 transition-colors`}
        >
          {hasChildren && (
            <button
              onClick={() => toggleNode(node.address)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-400">
                {node.address.slice(0, 6)}...{node.address.slice(-4)}
              </span>
              {node.address === userAddress && (
                <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded">你</span>
              )}
              {isRoot && (
                <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded">根节点</span>
              )}
            </div>
            
            {nft && (
              <div className="text-xs text-gray-500 mt-1">
                <span>Token #{nft.tokenId}</span>
                {nft.metadata?.attributes?.find((a: any) => a.trait_type === 'Rarity') && (
                  <span className="ml-2">
                    {nft.metadata.attributes.find((a: any) => a.trait_type === 'Rarity').value}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {hasChildren && (
            <div className="text-sm text-gray-400">
              {node.children.length} 个下级
            </div>
          )}
        </div>
        
        {isExpanded && hasChildren && (
          <div className="mt-2">
            {node.children.map((child) => (
              <div key={child.address}>
                {renderTreeNode(child)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">加载分发树...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* 返回按钮 */}
        <button
          onClick={() => router.push('/')}
          className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          ← 返回首页
        </button>

        {/* 标题 */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 mb-6 text-white">
          <h1 className="text-3xl font-bold mb-4">💰 ShitX 补贴查询</h1>
          
          {/* 搜索框 */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              placeholder="输入地址查询分发关系（留空显示全部）"
              className="flex-1 px-4 py-2 bg-gray-700 rounded text-white placeholder-gray-400"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-green-600 rounded hover:bg-green-700 transition-colors"
            >
              查询
            </button>
          </div>

          {/* 统计信息 */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-gray-400 text-sm">总节点数</p>
                <p className="text-2xl font-bold">{stats.totalNodes}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">最大深度</p>
                <p className="text-2xl font-bold">{stats.maxDepth}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">平均下级数</p>
                <p className="text-2xl font-bold">{stats.averageReferrals.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">你的地址</p>
                <p className="text-xs font-mono">
                  {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 分发树 */}
        <div className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">分发关系树</h2>
          
          {treeData ? (
            <div className="overflow-x-auto">
              {renderTreeNode(treeData, true)}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              暂无分发数据
            </div>
          )}
          
          {/* 深度分布 */}
          {stats && stats.totalByDepth && Object.keys(stats.totalByDepth).length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h3 className="text-lg font-bold text-white mb-3">深度分布</h3>
              <div className="space-y-2">
                {Object.entries(stats.totalByDepth).map(([depth, count]) => (
                  <div key={depth} className="flex items-center gap-3">
                    <span className="text-gray-400 w-20">第 {depth} 层:</span>
                    <div className="flex-1 bg-gray-700 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-full flex items-center justify-end pr-2"
                        style={{ width: `${(count / stats.totalNodes) * 100}%` }}
                      >
                        <span className="text-xs text-white">{count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 说明 */}
        <div className="mt-6 bg-gray-800/50 backdrop-blur-md rounded-xl p-4 text-gray-400 text-sm">
          <p>💡 说明：</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>分发树显示了 NFT 通过二维码分享的传播路径</li>
            <li>根节点是管理员钱包，所有 NFT 最初都从这里分发</li>
            <li>点击节点可以展开/收起下级</li>
            <li>黄色边框表示你的地址</li>
          </ul>
        </div>
      </div>
    </div>
  );
}