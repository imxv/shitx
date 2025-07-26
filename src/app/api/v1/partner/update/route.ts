import { NextRequest, NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';
import { savePartnerToRedis, RedisPartner, getPartnerFromRedis } from '@/lib/redisPartners';

export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract partner data
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const displayName = formData.get('displayName') as string;
    const nftName = formData.get('nftName') as string;
    const description = formData.get('description') as string;
    const longDescription = formData.get('longDescription') as string | null;
    const website = formData.get('website') as string | null;
    const totalSupply = parseInt(formData.get('totalSupply') as string || '1000');
    const logo = formData.get('logo') as File | null;
    const existingLogoUrl = formData.get('existingLogoUrl') as string | null;
    
    // Validate required fields
    if (!id || !name || !displayName || !nftName || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    let logoUrl: string | undefined = existingLogoUrl || undefined;
    
    // If a new logo is provided, upload it and delete the old one
    if (logo) {
      // Delete old logo if it exists and is a Vercel Blob URL
      if (existingLogoUrl && existingLogoUrl.startsWith('https://')) {
        try {
          await del(existingLogoUrl);
        } catch (error) {
          console.error('Error deleting old logo:', error);
        }
      }
      
      // Upload new logo
      const blob = await put(`partners/${id}/${logo.name}`, logo, {
        access: 'public',
      });
      logoUrl = blob.url;
    }
    
    // Create partner object
    const partner: RedisPartner = {
      id,
      name,
      displayName,
      nftName,
      description,
      longDescription: longDescription || undefined,
      logoUrl,
      website: website || undefined,
      contractAddress: null,
      totalSupply,
      deployed: false,
    };
    
    // Save to Redis
    await savePartnerToRedis(partner);
    
    return NextResponse.json({
      success: true,
      partner,
    });
  } catch (error) {
    console.error('Error updating partner:', error);
    return NextResponse.json(
      { error: 'Failed to update partner' },
      { status: 500 }
    );
  }
}