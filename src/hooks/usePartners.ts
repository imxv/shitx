'use client';

import { useState, useEffect } from 'react';
import { Partner, localPartners } from '@/config/partners';

export function usePartners() {
  const [partners, setPartners] = useState<Partner[]>(localPartners);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Fetch all partners including Redis ones
    fetch('/api/v1/partner/list')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPartners(data.partners);
        } else {
          throw new Error(data.error || 'Failed to fetch partners');
        }
      })
      .catch(err => {
        console.error('Error fetching partners:', err);
        setError(err);
        // Fallback to local partners on error
        setPartners(localPartners);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { partners, loading, error };
}

// Helper functions that work with the hook data
export function usePartnerById(id: string) {
  const { partners, loading, error } = usePartners();
  const partner = partners.find(p => p.id === id);
  return { partner, loading, error };
}

export function useDeployedPartners() {
  const { partners, loading, error } = usePartners();
  const deployedPartners = partners.filter(p => p.deployed && p.contractAddress);
  return { partners: deployedPartners, loading, error };
}

export function useUndeployedPartners() {
  const { partners, loading, error } = usePartners();
  const undeployedPartners = partners.filter(p => !p.deployed || !p.contractAddress);
  return { partners: undeployedPartners, loading, error };
}