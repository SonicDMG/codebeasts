
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/config/api';
import type { CodeBeast } from '@/types/gallery';
import { toast } from '@/hooks/use-toast';
import { Sparkles } from 'lucide-react';

export const useGalleryData = (itemsPerPage = 20) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timestamp, setTimestamp] = useState(() => Date.now());
  const [currentPage, setCurrentPage] = useState(1);
  const previousDataRef = useRef<CodeBeast[]>([]);
  const isInitialLoadRef = useRef(true);
  const autoRefreshCountRef = useRef(0);
  const newBeastsRef = useRef<string[]>([]);

  // Add debug console log to track the component state
  console.log('Gallery data state:', { 
    timestamp, 
    currentPage, 
    newBeasts: newBeastsRef.current,
    previousDataLength: previousDataRef.current.length 
  });

  const fetchCodeBeasts = async (): Promise<CodeBeast[]> => {
    const response = await fetch(`${API_BASE_URL}/api/static/temp`);
    if (!response.ok) {
      throw new Error('Failed to fetch CodeBeasts');
    }
    
    // For auto-refresh (not manual refresh), increment and log the counter
    if (!isRefreshing) {
      autoRefreshCountRef.current += 1;
      console.log(`🔄 Auto-refreshing gallery data (count: ${autoRefreshCountRef.current})`);
    }
    
    return await response.json();
  };

  const { data: allCodeBeasts = [], refetch, isLoading } = useQuery({
    queryKey: ['codebeasts', timestamp],
    queryFn: fetchCodeBeasts,
    refetchInterval: 10000,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  });

  console.log('Fetched CodeBeasts data:', { 
    count: allCodeBeasts.length,
    isLoading,
    newBeastCount: newBeastsRef.current.length
  });

  // Check for new CodeBeasts
  useEffect(() => {
    if (isInitialLoadRef.current) {
      // Store initial data and skip notifications on first load
      previousDataRef.current = [...allCodeBeasts];
      isInitialLoadRef.current = false;
      return;
    }

    // Compare with previous data to find new beasts
    const newBeasts = allCodeBeasts.filter(beast => 
      !previousDataRef.current.some(prevBeast => prevBeast.username === beast.username)
    );

    // Show toast for each new beast
    if (newBeasts.length > 0) {
      // If there are new beasts, reset to first page to show them
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
      
      console.log(`🎉 Found ${newBeasts.length} new CodeBeasts:`, newBeasts.map(b => b.username));
      
      // Store new beast usernames for prioritization
      newBeastsRef.current = newBeasts.map(beast => beast.username);
      
      newBeasts.forEach(beast => {
        toast({
          title: "New CodeBeast Arrived!",
          description: `${beast.username}'s CodeBeast has joined the gallery`,
          variant: "default",
          action: (
            <div className="flex items-center gap-1">
              <Sparkles className="h-4 w-4 text-yellow-400" /> 
            </div>
          )
        });
      });
    }

    // Update the reference
    previousDataRef.current = [...allCodeBeasts];
  }, [allCodeBeasts, currentPage]);

  // Calculate pagination values
  const totalItems = allCodeBeasts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  // Ensure current page is within valid range
  const validatedCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  if (validatedCurrentPage !== currentPage) {
    setCurrentPage(validatedCurrentPage);
  }

  // Sort beasts to prioritize new ones at the top
  const sortedCodeBeasts = [...allCodeBeasts].sort((a, b) => {
    const aIsNew = newBeastsRef.current.includes(a.username);
    const bIsNew = newBeastsRef.current.includes(b.username);
    
    if (aIsNew && !bIsNew) return -1;
    if (!aIsNew && bIsNew) return 1;
    return 0;
  });

  console.log('Sorted CodeBeasts:', { 
    total: sortedCodeBeasts.length,
    newOnTop: sortedCodeBeasts.slice(0, 3).map(b => ({
      username: b.username,
      isNew: newBeastsRef.current.includes(b.username)
    }))
  });

  // Clear new beasts reference after 30 seconds
  useEffect(() => {
    if (newBeastsRef.current.length > 0) {
      const timer = setTimeout(() => {
        console.log('Clearing new beasts reference after 30 seconds');
        newBeastsRef.current = [];
      }, 30000); // 30 seconds
      
      return () => clearTimeout(timer);
    }
  }, [newBeastsRef.current]);

  // Get current page items
  const startIndex = (validatedCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const codeBeasts = sortedCodeBeasts.slice(startIndex, endIndex);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    console.log('🖱️ Manual refresh triggered');
    setTimestamp(Date.now());
    await refetch();
    setIsRefreshing(false);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return {
    codeBeasts,
    isRefreshing,
    handleManualRefresh,
    timestamp,
    pagination: {
      currentPage: validatedCurrentPage,
      totalPages,
      totalItems,
      goToPage,
      nextPage,
      prevPage
    }
  };
};
