import { NextRequest, NextResponse } from 'next/server';
import { nftRedis } from '@/lib/redis';
import { getPartnerById } from '@/config/partners';

interface TreeNode {
  address: string;
  nftData: any;
  children: TreeNode[];
  depth: number;
  username?: string;
  rarity?: string;
  claimedAt?: number;
}

interface TreeStats {
  totalNodes: number;
  maxDepth: number;
  totalByDepth: Record<number, number>;
  averageReferrals: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  try {
    const { partnerId } = await params;
    const { searchParams } = new URL(request.url);
    const searchAddress = searchParams.get('address')?.toLowerCase();
    
    // 根据partnerId确定是主NFT还是合作方NFT
    const isMainNFT = partnerId === 'default';
    let rootAddress: string | null = null;
    
    if (isMainNFT) {
      // 主NFT的根地址
      rootAddress = await nftRedis.getAncestorHolder('default');
    } else {
      // 合作方NFT的根地址
      const partner = getPartnerById(partnerId);
      if (!partner) {
        return NextResponse.json(
          { error: 'Partner not found' },
          { status: 404 }
        );
      }
      rootAddress = await nftRedis.getAncestorHolder(partnerId);
    }
    
    if (!rootAddress) {
      // 如果没有根地址，尝试找到第一个NFT持有者作为临时根
      let temporaryRoot = null;
      
      if (isMainNFT) {
        // 查找第一个主NFT持有者
        const nftKeys = await nftRedis.keys('nft:claimed:*');
        if (nftKeys.length > 0) {
          // 提取地址
          temporaryRoot = nftKeys[0].replace('nft:claimed:', '');
        }
      } else {
        // 查找第一个合作方NFT持有者
        const partnerNftKeys = await nftRedis.keys(`partner_nft:${partnerId}:claimed:*`);
        if (partnerNftKeys.length > 0) {
          // 提取地址
          temporaryRoot = partnerNftKeys[0].replace(`partner_nft:${partnerId}:claimed:`, '');
        }
      }
      
      if (!temporaryRoot) {
        // 真的没有任何NFT，返回空树
        return NextResponse.json({
          tree: null,
          stats: {
            totalNodes: 0,
            maxDepth: 0,
            totalByDepth: {},
            averageReferrals: 0
          },
          message: '该NFT类型还没有任何持有者'
        });
      }
      
      rootAddress = temporaryRoot;
    }
    
    // 构建分发树
    const tree = await buildDistributionTree(rootAddress, partnerId, searchAddress);
    
    // 计算统计信息
    const stats = calculateTreeStats(tree);
    
    return NextResponse.json({
      tree,
      stats
    });
  } catch (error) {
    console.error('Error getting NFT tree:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function buildDistributionTree(
  address: string,
  partnerId: string,
  searchAddress?: string | null,
  depth = 0,
  visited = new Set<string>()
): Promise<TreeNode | null> {
  // 防止循环引用
  if (visited.has(address)) {
    return null;
  }
  visited.add(address);
  
  // 如果指定了搜索地址且当前节点不是搜索地址，检查是否在其子树中
  if (searchAddress && address !== searchAddress) {
    const hasSearchAddressInSubtree = await checkAddressInSubtree(address, searchAddress, partnerId, visited);
    if (!hasSearchAddressInSubtree) {
      return null;
    }
  }
  
  // 获取NFT数据
  let nftData;
  let username = '未知用户';
  let rarity = 'Common';
  let claimedAt: number | undefined;
  
  if (partnerId === 'default') {
    nftData = await nftRedis.getNFT(address);
  } else {
    nftData = await nftRedis.getPartnerNFT(partnerId, address);
  }
  
  if (nftData && (nftData as any).metadata?.attributes) {
    const usernameAttr = (nftData as any).metadata.attributes.find((a: any) => a.trait_type === 'Username');
    const rarityAttr = (nftData as any).metadata.attributes.find((a: any) => a.trait_type === 'Rarity');
    const claimedAtAttr = (nftData as any).metadata.attributes.find((a: any) => a.trait_type === 'Claimed At');
    
    username = usernameAttr?.value || '未知用户';
    rarity = rarityAttr?.value || 'Common';
    claimedAt = claimedAtAttr?.value ? new Date(claimedAtAttr.value).getTime() : undefined;
  }
  
  // 获取下级地址
  const referrals = await nftRedis.getReferrals(address);
  const children: TreeNode[] = [];
  
  // 递归构建子节点
  for (const referralAddress of referrals) {
    // 检查子节点是否有对应的NFT
    let hasNFT = false;
    if (partnerId === 'default') {
      const childNFT = await nftRedis.getNFT(referralAddress);
      hasNFT = !!childNFT;
    } else {
      const childNFT = await nftRedis.getPartnerNFT(partnerId, referralAddress);
      hasNFT = !!childNFT;
    }
    
    // 只包含拥有该类型NFT的节点
    if (hasNFT) {
      const childNode = await buildDistributionTree(referralAddress, partnerId, searchAddress, depth + 1, visited);
      if (childNode) {
        children.push(childNode);
      }
    }
  }
  
  return {
    address,
    nftData,
    children,
    depth,
    username,
    rarity,
    claimedAt
  };
}

async function checkAddressInSubtree(
  rootAddress: string,
  searchAddress: string,
  partnerId: string,
  visited: Set<string>
): Promise<boolean> {
  if (rootAddress === searchAddress) {
    return true;
  }
  
  const referrals = await nftRedis.getReferrals(rootAddress);
  for (const referralAddress of referrals) {
    if (!visited.has(referralAddress)) {
      // 检查是否有对应NFT
      let hasNFT = false;
      if (partnerId === 'default') {
        const nft = await nftRedis.getNFT(referralAddress);
        hasNFT = !!nft;
      } else {
        const nft = await nftRedis.getPartnerNFT(partnerId, referralAddress);
        hasNFT = !!nft;
      }
      
      if (hasNFT) {
        visited.add(referralAddress);
        if (await checkAddressInSubtree(referralAddress, searchAddress, partnerId, visited)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

function calculateTreeStats(tree: TreeNode | null): TreeStats {
  if (!tree) {
    return {
      totalNodes: 0,
      maxDepth: 0,
      totalByDepth: {},
      averageReferrals: 0
    };
  }
  
  let totalNodes = 0;
  let maxDepth = 0;
  let totalReferrals = 0;
  let nodesWithReferrals = 0;
  const totalByDepth: Record<number, number> = {};
  
  function traverse(node: TreeNode) {
    totalNodes++;
    maxDepth = Math.max(maxDepth, node.depth);
    
    // 统计每层的节点数
    totalByDepth[node.depth] = (totalByDepth[node.depth] || 0) + 1;
    
    // 统计推荐关系
    if (node.children.length > 0) {
      totalReferrals += node.children.length;
      nodesWithReferrals++;
    }
    
    // 递归遍历子节点
    for (const child of node.children) {
      traverse(child);
    }
  }
  
  traverse(tree);
  
  return {
    totalNodes,
    maxDepth,
    totalByDepth,
    averageReferrals: nodesWithReferrals > 0 ? totalReferrals / nodesWithReferrals : 0
  };
}