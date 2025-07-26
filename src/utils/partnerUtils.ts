/**
 * Get the correct logo URL for a partner
 * Handles both local files and Vercel Blob URLs
 */
export function getPartnerLogoUrl(logo?: string): string {
  if (!logo) {
    return '/shitx.png'; // Default logo
  }
  
  // Check if it's already a full URL (from Vercel Blob)
  if (logo.startsWith('http://') || logo.startsWith('https://')) {
    return logo;
  }
  
  // Otherwise, it's a local file in public/partner/
  return `/partner/${logo}`;
}