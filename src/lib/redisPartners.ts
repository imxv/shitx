import { Partner } from '@/config/partners';

const PARTNERS_KEY = 'partners:list';
const PARTNER_PREFIX = 'partner:';

export interface RedisPartner extends Omit<Partner, 'logo'> {
  logoUrl?: string; // Vercel Blob URL instead of filename
  isUserCreated?: boolean;
  creatorId?: string;
  creatorAddress?: string;
  creatorName?: string;
  createdAt?: number;
}

// Lazy load redis to avoid client-side errors
let redisClient: any = null;
async function getRedis() {
  if (!redisClient) {
    const { redis } = await import('./redis');
    redisClient = redis;
  }
  return redisClient;
}

// Save a new partner to Redis
export async function savePartnerToRedis(partner: RedisPartner): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;
  const partnerId = partner.id;
  
  // Save partner data
  await redis.hset(`${PARTNER_PREFIX}${partnerId}`, partner);
  
  // Add to partners list
  await redis.sadd(PARTNERS_KEY, partnerId);
}

// Get all partners from Redis
export async function getPartnersFromRedis(): Promise<RedisPartner[]> {
  const redis = await getRedis();
  if (!redis) return [];
  
  const partnerIds = await redis.smembers(PARTNERS_KEY);
  
  if (partnerIds.length === 0) {
    return [];
  }
  
  const partners: RedisPartner[] = [];
  
  for (const id of partnerIds) {
    const partnerData = await redis.hgetall(`${PARTNER_PREFIX}${id}`);
    if (partnerData && Object.keys(partnerData).length > 0) {
      // Convert Redis hash to Partner object
      partners.push({
        id: partnerData.id,
        name: partnerData.name,
        displayName: partnerData.displayName,
        nftName: partnerData.nftName,
        description: partnerData.description,
        longDescription: partnerData.longDescription,
        logoUrl: partnerData.logoUrl,
        website: partnerData.website,
        contractAddress: partnerData.contractAddress || null,
        totalSupply: parseInt(partnerData.totalSupply || '1000'),
        deployed: partnerData.deployed === 'true',
        isUserCreated: partnerData.isUserCreated === 'true',
        creatorId: partnerData.creatorId,
        creatorAddress: partnerData.creatorAddress,
        creatorName: partnerData.creatorName,
        createdAt: partnerData.createdAt ? parseInt(partnerData.createdAt) : undefined,
      });
    }
  }
  
  return partners;
}

// Get a single partner by ID
export async function getPartnerFromRedis(id: string): Promise<RedisPartner | null> {
  const redis = await getRedis();
  if (!redis) return null;
  
  const partnerData = await redis.hgetall(`${PARTNER_PREFIX}${id}`);
  
  if (!partnerData || Object.keys(partnerData).length === 0) {
    return null;
  }
  
  return {
    id: partnerData.id,
    name: partnerData.name,
    displayName: partnerData.displayName,
    nftName: partnerData.nftName,
    description: partnerData.description,
    longDescription: partnerData.longDescription,
    logoUrl: partnerData.logoUrl,
    website: partnerData.website,
    contractAddress: partnerData.contractAddress || null,
    totalSupply: parseInt(partnerData.totalSupply || '1000'),
    deployed: partnerData.deployed === 'true',
    isUserCreated: partnerData.isUserCreated === 'true',
    creatorId: partnerData.creatorId,
    creatorAddress: partnerData.creatorAddress,
    creatorName: partnerData.creatorName,
    createdAt: partnerData.createdAt ? parseInt(partnerData.createdAt) : undefined,
  };
}

// Delete a partner from Redis
export async function deletePartnerFromRedis(id: string): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;
  
  await redis.del(`${PARTNER_PREFIX}${id}`);
  await redis.srem(PARTNERS_KEY, id);
}

// Update partner contract info
export async function updatePartnerContractInRedis(id: string, contractAddress: string): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;
  
  await redis.hset(`${PARTNER_PREFIX}${id}`, {
    contractAddress,
    deployed: 'true'
  });
}