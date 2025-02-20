
// API configuration
export const API_BASE_URL = import.meta.env.PROD 
  ? 'https://api.codebeasts.dev'  // Production URL
  : 'http://localhost:5000';      // Development URL
