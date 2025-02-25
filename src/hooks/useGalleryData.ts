
import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/config/api';
import type { CodeBeast } from '@/types/gallery';

export const useGalleryData = () => {
  const { toast } = useToast();
  const previousBeasts = useRef<Map<string, string>>(new Map());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isInitialMount = useRef(true);

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

  const handleNewBeasts = (codeBeasts: CodeBeast[]) => {
    if (isInitialMount.current) {
      if (codeBeasts.length > 0) {
        const newBeastsMap = new Map(codeBeasts.map(beast => [beast.username, beast.imageUrl]));
        previousBeasts.current = newBeastsMap;
      }
      isInitialMount.current = false;
      return;
    }

    if (codeBeasts.length > 0) {
      const newOrUpdatedBeasts = codeBeasts.filter(beast => {
        const previousImageUrl = previousBeasts.current.get(beast.username);
        return !previousImageUrl || previousImageUrl !== beast.imageUrl;
      });

      if (newOrUpdatedBeasts.length > 0) {
        const newBeasts = newOrUpdatedBeasts.filter(beast => !previousBeasts.current.has(beast.username));
        const updatedBeasts = newOrUpdatedBeasts.filter(beast => previousBeasts.current.has(beast.username));
        
        if (newBeasts.length > 0) {
          const usernames = newBeasts.map(beast => beast.username);
          toast({
            title: "New CodeBeast" + (usernames.length > 1 ? "s" : "") + " Generated!",
            description: `Welcome ${usernames.join(", ")} to the gallery!`,
            duration: 5000,
          });
        }
        
        if (updatedBeasts.length > 0) {
          const usernames = updatedBeasts.map(beast => beast.username);
          toast({
            title: "CodeBeast" + (usernames.length > 1 ? "s" : "") + " Updated!",
            description: `${usernames.join(", ")} generated new images!`,
            duration: 5000,
          });
        }
      }

      const newBeastsMap = new Map(codeBeasts.map(beast => [beast.username, beast.imageUrl]));
      previousBeasts.current = newBeastsMap;
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  return {
    codeBeasts,
    isRefreshing,
    handleManualRefresh,
    handleNewBeasts,
  };
};
