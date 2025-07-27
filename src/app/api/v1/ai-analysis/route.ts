import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createKimiProvider, getKimiModel } from '@/lib/ai-providers/kimi-provider';
import { redis, nftRedis } from '@/lib/redis';
import * as mock from '@/lib/mockImplementation';

const ANALYSIS_COST = 100; // 100 SHIT per analysis
const CACHE_DURATION = 24 * 60 * 60; // 24 hours in seconds

export async function POST(request: Request) {
  try {
    const { type, forceRefresh = false, userAddress } = await request.json();
    
    if (!userAddress) {
      return NextResponse.json({ error: 'User address is required' }, { status: 400 });
    }
    
    if (!type || !['grant', 'nft'].includes(type)) {
      return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 });
    }

    // Normalize address to lowercase
    const normalizedAddress = userAddress.toLowerCase();
    
    // Check if user has enough SHIT (use mock implementation)
    const userBalance = await mock.getBalance(normalizedAddress);
    const balance = parseInt(userBalance) || 0;
    
    console.log('[AI Analysis] Balance check:', {
      originalAddress: userAddress,
      normalizedAddress,
      balance: userBalance,
      parsedBalance: balance
    });
    
    if (balance < ANALYSIS_COST) {
      return NextResponse.json({ 
        error: 'Insufficient SHIT balance', 
        required: ANALYSIS_COST,
        current: balance,
        debug: {
          address: normalizedAddress,
          rawBalance: userBalance
        }
      }, { status: 403 });
    }

    // Check for cached analysis
    const cacheKey = `ai-analysis:${type}:${normalizedAddress}`;
    const cachedAnalysis = redis ? await redis.get(cacheKey) : null;
    
    if (cachedAnalysis && !forceRefresh) {
      const analysis = JSON.parse(cachedAnalysis);
      const now = Date.now();
      const updateTime = new Date(analysis.updateTime).getTime();
      const ageInHours = (now - updateTime) / (1000 * 60 * 60);
      
      return NextResponse.json({
        ...analysis,
        cached: true,
        ageInHours: Math.round(ageInHours * 10) / 10,
        nextUpdateCost: ANALYSIS_COST
      });
    }

    // Deduct SHIT cost (use mock implementation)
    const newBalance = balance - ANALYSIS_COST;
    await mock.setBalance(normalizedAddress, newBalance.toString());
    
    // Record the expense
    await nftRedis.recordExpense(
      normalizedAddress,
      ANALYSIS_COST,
      'ai_analysis',
      `AI ${type === 'grant' ? 'Grant' : 'NFT'} Analysis`,
      { type, forceRefresh }
    );

    // Fetch data for analysis
    let analysisData;
    let prompt;
    
    if (type === 'grant') {
      // Get grant distribution data
      const grantData = await getGrantAnalysisData(normalizedAddress);
      analysisData = grantData;
      prompt = generateGrantAnalysisPrompt(grantData);
    } else {
      // Get NFT distribution data
      const nftData = await getNFTAnalysisData(normalizedAddress);
      analysisData = nftData;
      prompt = generateNFTAnalysisPrompt(nftData);
    }

    // Generate AI analysis
    const apiKey = process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    const kimi = createKimiProvider(apiKey);
    const { text } = await generateText({
      model: getKimiModel(kimi, 'kimi-k2'),
      system: '你是ShitX平台的数据分析专家。你的分析风格幽默风趣，充满黑色幽默，同时保持专业和洞察力。你会用轻松的语气解释复杂的数据关系，让用户在娱乐中获得有价值的信息。',
      prompt,
      maxTokens: 1500,
    });

    // Store analysis result
    const analysisResult = {
      type,
      analysis: text,
      rawData: analysisData,
      updateTime: new Date().toISOString(),
      cost: ANALYSIS_COST,
      userAddress: normalizedAddress
    };

    if (redis) {
      await redis.setex(cacheKey, CACHE_DURATION, JSON.stringify(analysisResult));
    }

    // Record analysis transaction
    if (redis) {
      await redis.zadd(
        `analysis-history:${normalizedAddress}`,
        Date.now(),
        JSON.stringify({
          type,
          cost: ANALYSIS_COST,
          timestamp: new Date().toISOString()
        })
      );
    }

    return NextResponse.json({
      ...analysisResult,
      cached: false,
      newBalance,
      nextUpdateCost: ANALYSIS_COST
    });

  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json({ 
      error: 'Analysis failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

async function getGrantAnalysisData(userAddress: string) {
  // Get user's grant data (use mock implementation)
  const userGrant = await mock.getBalance(userAddress);
  
  // Get referral tree data
  const referrals = redis ? await redis.smembers(`referrals:${userAddress}`) : [];
  const referredBy = redis ? await redis.get(`referred-by:${userAddress}`) : null;
  
  // Get top grant holders
  const topHolders = redis ? await redis.zrevrange('grant-leaderboard', 0, 9, 'WITHSCORES') : [];
  
  // Calculate network effects
  let totalNetworkGrant = 0;
  let networkDepth = 0;
  
  // First level referrals
  for (const ref of referrals) {
    const refGrant = redis ? await redis.get(`grant:${ref}`) || '0' : '0';
    totalNetworkGrant += parseInt(refGrant) * 0.5; // 50% bonus
    
    // Second level referrals
    const secondLevel = redis ? await redis.smembers(`referrals:${ref}`) : [];
    for (const ref2 of secondLevel) {
      const ref2Grant = redis ? await redis.get(`grant:${ref2}`) || '0' : '0';
      totalNetworkGrant += parseInt(ref2Grant) * 0.1; // 10% bonus
    }
    
    if (secondLevel.length > 0) networkDepth = Math.max(networkDepth, 2);
    else if (referrals.length > 0) networkDepth = Math.max(networkDepth, 1);
  }

  // Get user's rank
  const userRank = redis ? await redis.zrevrank('grant-leaderboard', userAddress) : null;

  return {
    userAddress,
    userGrant: parseInt(userGrant),
    referralCount: referrals.length,
    referredBy,
    totalNetworkGrant,
    networkDepth,
    userRank: userRank !== null ? userRank + 1 : null,
    topHolders: topHolders.reduce((acc, item, index) => {
      if (index % 2 === 0) {
        acc.push({ address: item, grant: parseInt(topHolders[index + 1]) });
      }
      return acc;
    }, [] as { address: string; grant: number }[])
  };
}

async function getNFTAnalysisData(userAddress: string) {
  // Get user's NFT collection
  const nftTypes = ['base', 'dj-teddy', 'wanderpaw', 'snakemaster', 'fomobull', 'pumpfunrugs'];
  const userNFTs: Record<string, any> = {};
  
  for (const nftType of nftTypes) {
    const hasNFT = redis ? await redis.sismember(`nft-holders:${nftType}`, userAddress) : false;
    if (hasNFT) {
      const claimedAt = redis ? await redis.hget(`nft-claims:${nftType}`, userAddress) : null;
      const totalHolders = redis ? await redis.scard(`nft-holders:${nftType}`) : 0;
      const distributionTree = redis ? await redis.smembers(`nft-distributed:${nftType}:${userAddress}`) : [];
      
      userNFTs[nftType] = {
        owned: true,
        claimedAt,
        totalHolders,
        distributedTo: distributionTree.length,
        isAncestor: redis ? await redis.sismember(`ancestors:${nftType}`, userAddress) : false
      };
    }
  }

  // Get NFT rarity stats
  const nftStats = [];
  for (const nftType of nftTypes) {
    const holders = redis ? await redis.scard(`nft-holders:${nftType}`) : 0;
    nftStats.push({ type: nftType, holders });
  }
  nftStats.sort((a, b) => a.holders - b.holders);

  // Calculate collection score
  const ownedCount = Object.keys(userNFTs).length;
  const collectionScore = (ownedCount / nftTypes.length) * 100;

  return {
    userAddress,
    userNFTs,
    ownedCount,
    totalTypes: nftTypes.length,
    collectionScore,
    nftRarityRanking: nftStats,
    isCompleteCollector: ownedCount === nftTypes.length
  };
}

function generateGrantAnalysisPrompt(data: any): string {
  return `分析以下ShitX平台的SHIT代币分发数据：

用户地址：${data.userAddress}
当前SHIT余额：${data.userGrant}
直接推荐人数：${data.referralCount}
推荐网络总收益：${data.totalNetworkGrant} SHIT
网络深度：${data.networkDepth}层
排行榜排名：${data.userRank || '未上榜'}

前10名持有者：
${data.topHolders.map((h: any, i: number) => `${i + 1}. ${h.address.slice(0, 8)}... - ${h.grant} SHIT`).join('\n')}

请提供以下分析：
1. 用户在生态中的地位和影响力评估
2. 推荐网络的健康度和增长潜力
3. 与顶级玩家的差距分析
4. 3个具体的增长策略建议
5. 一个有趣的数据洞察

记住用幽默的方式表达，让数据分析变得有趣！`;
}

function generateNFTAnalysisPrompt(data: any): string {
  const ownedNFTs = Object.entries(data.userNFTs)
    .map(([type, info]: [string, any]) => `${type}: ${info.isAncestor ? '始祖' : '持有'}, 分发给${info.distributedTo}人`)
    .join('\n');

  return `分析以下ShitX平台的极速卡片(NFT)收集数据：

用户地址：${data.userAddress}
收集进度：${data.ownedCount}/${data.totalTypes} (${data.collectionScore.toFixed(1)}%)
${data.isCompleteCollector ? '🏆 完美收藏家！' : ''}

持有的极速卡片：
${ownedNFTs || '暂无'}

稀有度排名（持有人数从少到多）：
${data.nftRarityRanking.map((nft: any, i: number) => `${i + 1}. ${nft.type}: ${nft.holders}人持有`).join('\n')}

请提供以下分析：
1. 收藏品味评价和稀有度分析
2. 在NFT分发网络中的影响力
3. 最有价值的持有和缺失分析
4. 收藏策略建议
5. 一个关于用户收藏风格的有趣观察

用诙谐幽默的方式，让用户感受到收集极速卡片的乐趣！`;
}