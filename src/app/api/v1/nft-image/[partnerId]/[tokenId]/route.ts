import { NextRequest, NextResponse } from 'next/server';
import { getPartnerById } from '@/lib/partnersService';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string; tokenId: string }> }
) {
  try {
    const { partnerId, tokenId } = await params;
    
    // 如果是合作方 NFT，尝试返回合作方的 logo
    if (partnerId !== 'default') {
      const partner = await getPartnerById(partnerId);
      if (partner && partner.logo) {
        // 检查是否是 URL (Vercel Blob)
        if (partner.logo.startsWith('http://') || partner.logo.startsWith('https://')) {
          try {
            // 从远程 URL 获取图片
            const response = await fetch(partner.logo);
            if (response.ok) {
              const buffer = await response.arrayBuffer();
              const contentType = response.headers.get('content-type') || 'image/png';
              
              return new NextResponse(buffer, {
                headers: {
                  'Content-Type': contentType,
                  'Cache-Control': 'public, max-age=31536000',
                },
              });
            }
          } catch (error) {
            console.error(`Failed to fetch partner logo from URL: ${partner.logo}`, error);
          }
        } else {
          // 本地文件
          const logoPath = path.join(process.cwd(), 'public', 'partner', partner.logo);
          
          try {
            const logoBuffer = await fs.readFile(logoPath);
            
            // 根据文件扩展名设置正确的 Content-Type
            const ext = path.extname(partner.logo).toLowerCase();
            let contentType = 'image/png'; // 默认
            if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
            else if (ext === '.gif') contentType = 'image/gif';
            else if (ext === '.svg') contentType = 'image/svg+xml';
            
            return new NextResponse(logoBuffer, {
              headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000',
              },
            });
          } catch (error) {
            console.error(`Failed to read partner logo: ${logoPath}`, error);
          }
        }
      }
    }
    
    // 如果没有找到合作方 logo，返回默认的 ShitX logo
    const defaultLogoPath = path.join(process.cwd(), 'public', 'shitx.png');
    
    try {
      const defaultLogoBuffer = await fs.readFile(defaultLogoPath);
      return new NextResponse(defaultLogoBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    } catch (error) {
      // 如果连默认 logo 也找不到，返回占位图
      const svg = `
        <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="400" fill="#1a1a1a"/>
          <text x="200" y="200" font-family="Arial" font-size="120" fill="#ffd700" text-anchor="middle" dominant-baseline="middle">💩</text>
          <text x="200" y="300" font-family="Arial" font-size="24" fill="#fff" text-anchor="middle">Shit NFT #${tokenId}</text>
        </svg>
      `;
      
      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    }
  } catch (error) {
    console.error('Error generating NFT image:', error);
    return NextResponse.json(
      { error: 'Failed to generate NFT image' },
      { status: 500 }
    );
  }
}