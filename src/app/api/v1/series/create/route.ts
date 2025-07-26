import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { nftRedis } from '@/lib/redis';
import { createPartner } from '@/lib/partnersService';
import * as mock from '@/lib/mockImplementation';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // 获取表单数据
    const name = formData.get('name') as string;
    const displayName = formData.get('displayName') as string;
    const nftName = formData.get('nftName') as string;
    const description = formData.get('description') as string;
    const longDescription = formData.get('longDescription') as string || '';
    const website = formData.get('website') as string || '';
    const totalSupply = parseInt(formData.get('totalSupply') as string || '100');
    
    // 获取创建者信息
    const creatorId = formData.get('creatorId') as string;
    const creatorAddress = formData.get('creatorAddress') as string;
    const creatorName = formData.get('creatorName') as string;
    
    // 验证必填字段
    if (!name || !displayName || !nftName || !description || !creatorId || !creatorAddress) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }
    
    // 检查用户余额
    const currentBalance = await mock.getBalance(creatorAddress);
    const balanceAmount = parseInt(currentBalance);
    const CREATION_COST = 10000; // 创建系列需要 10000 SHIT
    
    if (balanceAmount < CREATION_COST) {
      return NextResponse.json(
        { error: `余额不足，创建系列需要 ${CREATION_COST} SHIT，您当前余额为 ${balanceAmount} SHIT` },
        { status: 400 }
      );
    }
    
    // 验证name格式（只允许小写字母和数字）
    if (!/^[a-z0-9]+$/.test(name)) {
      return NextResponse.json(
        { error: '英文ID只能包含小写字母和数字' },
        { status: 400 }
      );
    }
    
    // 生成唯一的系列ID（添加用户前缀）
    const seriesId = `user_${creatorAddress.slice(2, 8)}_${name}`.toLowerCase();
    
    // 检查系列ID是否已存在
    const existingPartners = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/v1/partner/list`);
    const partnersData = await existingPartners.json();
    if (partnersData.partners?.some((p: any) => p.id === seriesId)) {
      return NextResponse.json(
        { error: '该系列ID已存在，请更换名称' },
        { status: 400 }
      );
    }
    
    // 处理Logo上传
    let logoUrl = '';
    const logoFile = formData.get('logo') as File | null;
    if (logoFile) {
      try {
        const blob = await put(`partners/${seriesId}/logo.${logoFile.name.split('.').pop()}`, logoFile, {
          access: 'public',
          addRandomSuffix: false,
        });
        logoUrl = blob.url;
      } catch (error) {
        console.error('Error uploading logo:', error);
      }
    }
    
    // 创建合作方数据
    const partnerData = {
      id: seriesId,
      name: displayName,
      displayName: displayName,
      nftName: nftName,
      description: description,
      longDescription: longDescription,
      website: website,
      logo: logoUrl,
      totalSupply: totalSupply,
      isUserCreated: true,
      creatorId: creatorId,
      creatorAddress: creatorAddress,
      creatorName: creatorName,
      createdAt: Date.now()
    };
    
    // 保存到partners系统
    const createResult = await createPartner(partnerData);
    if (!createResult.success) {
      return NextResponse.json(
        { error: '创建系列失败：' + createResult.error },
        { status: 500 }
      );
    }
    
    // 为创建者mint始祖NFT
    try {
      // 直接调用claim-partner-nft API
      const claimResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/v1/claim-partner-nft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: creatorId,
          evmAddress: creatorAddress,
          username: creatorName,
          fingerprint: creatorAddress.slice(2), // 使用地址的一部分作为fingerprint
          partnerId: seriesId
        })
      });
      
      const claimResult = await claimResponse.json();
      
      if (!claimResult.success) {
        // 如果mint失败，删除创建的系列
        console.error('Failed to mint ancestor NFT:', claimResult.error);
        // TODO: 实现删除逻辑
      }
      
      // 记录创建者获得始祖NFT
      await nftRedis.recordSeriesCreation(seriesId, creatorAddress, claimResult.nft?.tokenId || '1');
      
      // 扣除创建费用
      const newBalance = (balanceAmount - CREATION_COST).toString();
      await mock.setBalance(creatorAddress, newBalance);
      
      // 记录支出
      await nftRedis.recordExpense(
        creatorAddress,
        CREATION_COST,
        'series_creation',
        `创建系列: ${displayName}`,
        { seriesId, nftName, totalSupply }
      );
      
      return NextResponse.json({
        success: true,
        series: partnerData,
        ancestorNFT: claimResult.nft,
        newBalance: newBalance,
        message: `成功创建系列 "${displayName}"，您已获得始祖NFT！已扣除 ${CREATION_COST} SHIT，当前余额: ${newBalance} SHIT`
      });
      
    } catch (error) {
      console.error('Error minting ancestor NFT:', error);
      return NextResponse.json({
        success: true,
        series: partnerData,
        warning: '系列创建成功，但始祖NFT铸造失败，请联系管理员'
      });
    }
    
  } catch (error) {
    console.error('Error creating series:', error);
    return NextResponse.json(
      { error: '创建失败：' + (error as Error).message },
      { status: 500 }
    );
  }
}

// 获取用户创建的系列
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorAddress = searchParams.get('creator');
    
    if (!creatorAddress) {
      return NextResponse.json(
        { error: '缺少创建者地址' },
        { status: 400 }
      );
    }
    
    // 获取所有合作方
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/v1/partner/list`);
    const data = await response.json();
    
    // 筛选用户创建的系列
    const userSeries = data.partners?.filter((p: any) => 
      p.isUserCreated && p.creatorAddress?.toLowerCase() === creatorAddress.toLowerCase()
    ) || [];
    
    return NextResponse.json({
      success: true,
      series: userSeries
    });
    
  } catch (error) {
    console.error('Error fetching user series:', error);
    return NextResponse.json(
      { error: '获取失败' },
      { status: 500 }
    );
  }
}