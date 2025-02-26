
/**
 * Custom hook for fetching and managing the CodeBeasts gallery data.
 * Provides real-time updates and manual refresh functionality for the gallery view.
 * Uses React Query for efficient data fetching and caching.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/config/api';
import type { CodeBeast } from '@/types/gallery';

export const useGalleryData = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timestamp, setTimestamp] = useState(() => Date.now());

  const fetchCodeBeasts = async (): Promise<CodeBeast[]> => {
    console.log('Fetching CodeBeasts data...'); // Add logging for debugging
    const response = await fetch(`${API_BASE_URL}/api/static/temp`, {
      // Add cache control headers to prevent browser caching
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    if (!response.ok) {
      console.error('Failed to fetch CodeBeasts:', response.status); // Add error logging
      throw new Error('Failed to fetch CodeBeasts');
    }
    const data = await response.json();
    console.log('Fetched CodeBeasts:', data); // Add logging for debugging
    return data;
  };

  const { data: codeBeasts = [], refetch } = useQuery({
    queryKey: ['codebeasts', timestamp],
    queryFn: fetchCodeBeasts,
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 0, // Consider data immediately stale
    gcTime: 0, // Disable garbage collection
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    meta: {
      errorMessage: 'Failed to fetch CodeBeasts gallery'
    }
  });

  const handleManualRefresh = async () => {
    console.log('Manual refresh triggered'); // Add logging for debugging
    setIsRefreshing(true);
    setTimestamp(Date.now());
    await refetch();
    setIsRefreshing(false);
    console.log('Manual refresh completed'); // Add logging for debugging
  };

  return {
    codeBeasts,
    isRefreshing,
    handleManualRefresh,
    timestamp
  };
};
