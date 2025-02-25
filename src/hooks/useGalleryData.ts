
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/config/api';
import type { CodeBeast } from '@/types/gallery';

export const useGalleryData = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchCodeBeasts = async (): Promise<CodeBeast[]> => {
    const response = await fetch(`${API_BASE_URL}/api/static/temp`);
    if (!response.ok) {
      throw new Error('Failed to fetch CodeBeasts');
    }
    return await response.json();
  };

  const { data: codeBeasts = [], refetch } = useQuery({
    queryKey: ['codebeasts'],
    queryFn: fetchCodeBeasts,
    refetchInterval: 10000,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  });

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  return {
    codeBeasts,
    isRefreshing,
    handleManualRefresh
  };
};
