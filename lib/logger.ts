/**
 * Logging utility with environment-aware log levels
 * 
 * Security logs always output regardless of environment
 * Debug logs only output in development
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Security-related logs - ALWAYS output
 */
export const securityLog = {
  info: (message: string, ...args: any[]) => {
    console.log(message, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(message, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(message, ...args);
  },
};

/**
 * Debug logs - only in development
 */
export const debugLog = {
  info: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.warn(`[DEBUG] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.error(`[DEBUG] ${message}`, ...args);
    }
  },
};

/**
 * General application logs - output in all environments
 */
export const appLog = {
  info: (message: string, ...args: any[]) => {
    console.log(message, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(message, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(message, ...args);
  },
};

/**
 * Helper to check if we're in development
 */
export const isDevMode = () => isDevelopment;

/**
 * Helper to check if we're in production
 */
export const isProdMode = () => isProduction;

// Made with Bob
