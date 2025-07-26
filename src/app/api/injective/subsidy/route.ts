import { NextRequest, NextResponse } from 'next/server';
import { nftRedis } from '@/lib/redis';

const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET || '0x53021a66d9cf6Dff7aD234B32FE2d6E5C07f5E4f';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    
    if (!address) {
      // 获取整个分发树（从管理员钱包开始）
      const tree = await nftRedis.getDistributionTree(ADMIN_WALLET.toLowerCase());
      
      // 计算统计信息
      const stats = calculateTreeStats(tree);
      
      return NextResponse.json({
        tree,
        stats,
        rootAddress: ADMIN_WALLET
      });
    } else {
      // 获取特定地址的分发树
      const tree = await nftRedis.getDistributionTree(address.toLowerCase());
      const referrer = await nftRedis.getReferrer(address.toLowerCase());
      
      return NextResponse.json({
        tree,
        referrer,
        address: address.toLowerCase()
      });
    }
  } catch (error) {
    console.error('Error getting subsidy data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 计算分发树的统计信息
function calculateTreeStats(tree: any): any {
  if (!tree) return { totalNodes: 0, maxDepth: 0, totalByDepth: {} };
  
  let totalNodes = 0;
  let maxDepth = 0;
  const totalByDepth: Record<number, number> = {};
  
  const traverse = (node: any) => {
    if (!node) return;
    
    totalNodes++;
    maxDepth = Math.max(maxDepth, node.depth);
    totalByDepth[node.depth] = (totalByDepth[node.depth] || 0) + 1;
    
    if (node.children && node.children.length > 0) {
      node.children.forEach(traverse);
    }
  };
  
  traverse(tree);
  
  return {
    totalNodes,
    maxDepth,
    totalByDepth,
    averageReferrals: totalNodes > 0 ? (totalNodes - 1) / (totalByDepth[0] || 1) : 0
  };
}