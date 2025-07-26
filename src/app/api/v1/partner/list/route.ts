import { NextResponse } from 'next/server';
import { getAllPartners } from '@/lib/partnersService';

export async function GET() {
  try {
    const partners = await getAllPartners();
    
    return NextResponse.json({
      success: true,
      partners,
    });
  } catch (error) {
    console.error('Error fetching partners:', error);
    return NextResponse.json(
      { error: 'Failed to fetch partners' },
      { status: 500 }
    );
  }
}