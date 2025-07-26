import { NextRequest, NextResponse } from 'next/server';
import { nftRedis } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');
    
    // 如果提供了地址，获取该地址的分发树
    const rootAddress = address || 'mock-root-address';
    const tree = await nftRedis.getDistributionTree(rootAddress);
    
    // 计算统计信息
    let totalNodes = 0;
    let maxDepth = 0;
    const totalByDepth: Record<number, number> = {};
    let totalReferrals = 0;
    
    const calculateStats = (node: any) => {
      if (!node) return;
      
      totalNodes++;
      maxDepth = Math.max(maxDepth, node.depth);
      totalByDepth[node.depth] = (totalByDepth[node.depth] || 0) + 1;
      
      if (node.children && node.children.length > 0) {
        totalReferrals += node.children.length;
        node.children.forEach(calculateStats);
      }
    };
    
    if (tree) {
      calculateStats(tree);
    }
    
    const averageReferrals = totalNodes > 0 ? totalReferrals / totalNodes : 0;
    
    return NextResponse.json({
      implementation: 'mock',
      tree,
      stats: {
        totalNodes,
        maxDepth,
        totalByDepth,
        averageReferrals
      }
    });
  } catch (error) {
    console.error('Error getting subsidy data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}