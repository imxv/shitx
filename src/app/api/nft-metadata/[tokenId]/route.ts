import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  const { tokenId } = await params;
  
  // 生成基于 tokenId 的稀有度
  const numericId = parseInt(tokenId);
  let rarity = 'Common Toilet';
  let image = 'common';
  
  if (numericId <= 100) {
    rarity = 'Legendary Golden Throne';
    image = 'legendary';
  } else if (numericId <= 500) {
    rarity = 'Epic Diamond Toilet';
    image = 'epic';
  } else if (numericId <= 1500) {
    rarity = 'Rare Silver Toilet';
    image = 'rare';
  } else if (numericId <= 4000) {
    rarity = 'Uncommon Bronze Toilet';
    image = 'uncommon';
  }

  // 返回 ERC721 标准的 metadata
  const metadata = {
    name: `Shit NFT #${tokenId}`,
    description: `专属厕所通行证 #${tokenId}。在那个创造失眠的难忘夏天，见证了中国有史以来最大的厕所革命。`,
    image: `https://shitx.top/api/nft-image/${tokenId}`,
    external_url: `https://shitx.top/nft/${tokenId}`,
    attributes: [
      {
        trait_type: 'Token ID',
        value: numericId,
        display_type: 'number'
      },
      {
        trait_type: 'Rarity',
        value: rarity
      },
      {
        trait_type: 'Collection',
        value: 'ShitX Genesis'
      },
      {
        trait_type: 'Edition',
        value: '2024 Summer of Insomnia'
      },
      {
        trait_type: 'Toilet Power',
        value: Math.floor(Math.random() * 100) + 1,
        display_type: 'boost_number'
      },
      {
        trait_type: 'Flush Speed',
        value: Math.floor(Math.random() * 100) + 1,
        display_type: 'boost_percentage'
      }
    ]
  };

  return NextResponse.json(metadata);
}