// This file provides a unified interface for loading partners
// It should be used throughout the application instead of importing partners directly

import { getAllPartners } from './partnersService';
import { Partner } from '@/config/partners';

// Cached partners for client-side usage
let cachedPartners: Partner[] | null = null;

// Get all partners (local + cloud)
export async function getPartners(): Promise<Partner[]> {
  if (cachedPartners) {
    return cachedPartners;
  }
  
  cachedPartners = await getAllPartners();
  return cachedPartners;
}

// Clear cache when needed (e.g., after adding new partner)
export function clearPartnersCache() {
  cachedPartners = null;
}

// For server-side usage where async is acceptable
export const partners = getPartners;