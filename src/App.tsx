
/**
 * Root application component that sets up routing and global providers.
 * Handles conditional rendering based on URL parameters and provides
 * the QueryClient context for data fetching throughout the app.
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { HelmetProvider } from 'react-helmet-async';
import Index from '@/pages/Index';
import Gallery from '@/pages/Gallery';
import DirectImage from '@/pages/DirectImage';
import NotFound from '@/pages/NotFound';
import { useSearchParams } from 'react-router-dom';
import { Footer } from '@/components/layout/Footer';
import './App.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      refetchOnWindowFocus: false,
    },
  },
});

// Root component to handle the conditional rendering
const RootComponent = () => {
  const [searchParams] = useSearchParams();
  const username = searchParams.get('u');
  
  if (username) {
    return (
      <>
        <DirectImage />
        <Footer />
      </>
    );
  }
  return (
    <>
      <Index />
      <Footer />
    </>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <Router>
          <div className="flex flex-col min-h-screen">
            <div className="flex-grow">
              <Routes>
                <Route path="/" element={<RootComponent />} />
                <Route path="/gallery" element={
                  <>
                    <Gallery />
                    <Footer />
                  </>
                } />
                <Route path="/direct/:username" element={
                  <>
                    <DirectImage />
                    <Footer />
                  </>
                } />
                <Route path="*" element={
                  <>
                    <NotFound />
                    <Footer />
                  </>
                } />
              </Routes>
            </div>
          </div>
          <Toaster />
        </Router>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
