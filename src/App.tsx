import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import Index from './pages/Index'
import Gallery from './pages/Gallery'
import NotFound from './pages/NotFound'
import DirectImage from './pages/DirectImage'

const RouteHandler = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const hasUserParam = searchParams.has('u');

  // If we're at the root path and have a 'u' parameter, show DirectImage
  if (location.pathname === '/' && hasUserParam) {
    return <DirectImage />;
  }

  // Otherwise show the Index component
  return <Index />;
};

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <Routes>
          <Route path="/" element={<RouteHandler />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster />
    </ThemeProvider>
  )
}

export default App
