import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { deletePartnerFromRedis, getPartnerFromRedis } from '@/lib/redisPartners';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Partner ID is required' },
        { status: 400 }
      );
    }
    
    // Get partner data to delete logo if exists
    const partner = await getPartnerFromRedis(id);
    
    if (partner && partner.logoUrl && partner.logoUrl.startsWith('https://')) {
      try {
        // Delete logo from Vercel Blob
        await del(partner.logoUrl);
      } catch (error) {
        console.error('Error deleting partner logo:', error);
      }
    }
    
    // Delete from Redis
    await deletePartnerFromRedis(id);
    
    return NextResponse.json({
      success: true,
      message: `Partner ${id} deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting partner:', error);
    return NextResponse.json(
      { error: 'Failed to delete partner' },
      { status: 500 }
    );
  }
}