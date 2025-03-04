
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/config/api';
import type { CodeBeast } from '@/types/gallery';
import { toast } from '@/hooks/use-toast';
import { Sparkles } from 'lucide-react';

// Duration to show the "new" status (3 minutes)
const NEW_BEAST_DURATION = 3 * 60 * 1000;

export const useGalleryData = (itemsPerPage = 20) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timestamp, setTimestamp] = useState(() => Date.now());
  const [currentPage, setCurrentPage] = useState(1);
  const previousDataRef = useRef<CodeBeast[]>([]);
  const isInitialLoadRef = useRef(true);
  const autoRefreshCountRef = useRef(0);
  
  // Track new beasts with their timestamps
  const [newBeasts, setNewBeasts] = useState<{[username: string]: number}>({});

  console.log('Gallery data state:', { 
    timestamp, 
    currentPage, 
    newBeasts,
    previousDataLength: previousDataRef.current.length 
  });

  const fetchCodeBeasts = async (): Promise<CodeBeast[]> => {
    const response = await fetch(`${API_BASE_URL}/api/static/temp`);
    if (!response.ok) {
      throw new Error('Failed to fetch CodeBeasts');
    }
    
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
    newBeastCount: Object.keys(newBeasts).length
  });

  // Reset newBeasts on manual refresh or timestamp change
  useEffect(() => {
    setNewBeasts({});
  }, [timestamp]);

  // Compare previous data with current data to detect new beasts
  useEffect(() => {
    // Skip the first load to avoid marking all beasts as new initially
    if (isInitialLoadRef.current) {
      previousDataRef.current = [...allCodeBeasts];
      isInitialLoadRef.current = false;
      return;
    }

    // Find beasts that weren't in the previous data
    const justAddedBeasts = allCodeBeasts.filter(beast => 
      !previousDataRef.current.some(prevBeast => prevBeast.username === beast.username)
    );

    if (justAddedBeasts.length > 0) {
      // When new beasts are detected, navigate to page 1 if not already there
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
      
      console.log(`🎉 Found ${justAddedBeasts.length} new CodeBeasts:`, justAddedBeasts.map(b => b.username));
      
      const now = Date.now();
      const updatedNewBeasts = { ...newBeasts };
      
      // Add all new beasts to the tracking object with current timestamp
      justAddedBeasts.forEach(beast => {
        updatedNewBeasts[beast.username] = now;
        
        // Show toast notification for each new beast
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
      
      setNewBeasts(updatedNewBeasts);
    }

    // Update reference to current data for next comparison
    previousDataRef.current = [...allCodeBeasts];
  }, [allCodeBeasts, currentPage, newBeasts]);

  // Clean up expired "new" status beasts
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      let hasExpired = false;
      const updatedNewBeasts = { ...newBeasts };
      
      // Remove beasts whose "new" status has expired
      Object.entries(updatedNewBeasts).forEach(([username, timestamp]) => {
        if (now - timestamp > NEW_BEAST_DURATION) {
          delete updatedNewBeasts[username];
          hasExpired = true;
          console.log(`Beast ${username} is no longer considered new`);
        }
      });
      
      if (hasExpired) {
        setNewBeasts(updatedNewBeasts);
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(cleanupInterval);
  }, [newBeasts]);

  const totalItems = allCodeBeasts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  // Ensure current page is always valid
  const validatedCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  if (validatedCurrentPage !== currentPage) {
    setCurrentPage(validatedCurrentPage);
  }

  // Sort beasts to show new ones first
  const sortedCodeBeasts = [...allCodeBeasts].sort((a, b) => {
    const aIsNew = newBeasts[a.username] !== undefined;
    const bIsNew = newBeasts[b.username] !== undefined;
    
    if (aIsNew && !bIsNew) return -1;
    if (!aIsNew && bIsNew) return 1;
    return 0;
  });

  console.log('Sorted CodeBeasts:', { 
    total: sortedCodeBeasts.length,
    newOnTop: sortedCodeBeasts.slice(0, 3).map(b => ({
      username: b.username,
      isNew: newBeasts[b.username] !== undefined
    }))
  });

  // Paginate the sorted beasts
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
    newBeasts,
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
