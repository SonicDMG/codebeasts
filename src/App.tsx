
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import Index from '@/pages/Index';
import Gallery from '@/pages/Gallery';
import DirectImage from '@/pages/DirectImage';
import NotFound from '@/pages/NotFound';
import { useSearchParams } from 'react-router-dom';
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
    return <DirectImage />;
  }
  return <Index />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<RootComponent />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/direct/:username" element={<DirectImage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
