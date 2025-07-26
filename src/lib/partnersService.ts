'use server';

import { Partner, localPartners } from '@/config/partners';
import { getPartnersFromRedis, RedisPartner } from './redisPartners';

// Convert RedisPartner to Partner format
function convertRedisPartnerToPartner(redisPartner: RedisPartner): Partner {
  return {
    ...redisPartner,
    logo: redisPartner.logoUrl, // Use logoUrl as logo for compatibility
  };
}

// Get all partners (static + Redis)
export async function getAllPartners(): Promise<Partner[]> {
  try {
    // Get partners from Redis
    const redisPartners = await getPartnersFromRedis();
    const convertedRedisPartners = redisPartners.map(convertRedisPartnerToPartner);
    
    // Combine static and Redis partners
    // Redis partners take precedence if there's an ID conflict
    const partnerMap = new Map<string, Partner>();
    
    // Add local partners first
    localPartners.forEach(partner => {
      partnerMap.set(partner.id, partner);
    });
    
    // Add Redis partners (they don't override local partners)
    convertedRedisPartners.forEach(partner => {
      partnerMap.set(partner.id, partner);
    });
    
    return Array.from(partnerMap.values());
  } catch (error) {
    console.error('Error fetching partners from Redis:', error);
    // Fallback to local partners if Redis fails
    return localPartners;
  }
}

// Get deployed partners
export async function getDeployedPartners(): Promise<Partner[]> {
  const allPartners = await getAllPartners();
  return allPartners.filter(p => p.deployed && p.contractAddress);
}

// Get undeployed partners
export async function getUndeployedPartners(): Promise<Partner[]> {
  const allPartners = await getAllPartners();
  return allPartners.filter(p => !p.deployed || !p.contractAddress);
}

// Get partner by ID
export async function getPartnerById(id: string): Promise<Partner | undefined> {
  const allPartners = await getAllPartners();
  return allPartners.find(p => p.id === id);
}

// Create a new partner (for user-created series)
export async function createPartner(partnerData: Partial<Partner> & { id: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const { savePartnerToRedis } = await import('./redisPartners');
    
    // Save to Redis
    await savePartnerToRedis({
      id: partnerData.id,
      name: partnerData.name || partnerData.id,
      displayName: partnerData.displayName || partnerData.name || partnerData.id,
      nftName: partnerData.nftName || `${partnerData.displayName} NFT`,
      description: partnerData.description || '',
      longDescription: partnerData.longDescription,
      logoUrl: partnerData.logo,
      website: partnerData.website,
      contractAddress: null,
      totalSupply: partnerData.totalSupply || 100,
      deployed: false,
      isUserCreated: partnerData.isUserCreated,
      creatorId: partnerData.creatorId,
      creatorAddress: partnerData.creatorAddress,
      creatorName: partnerData.creatorName,
      createdAt: partnerData.createdAt,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error creating partner:', error);
    return { success: false, error: (error as Error).message };
  }
}