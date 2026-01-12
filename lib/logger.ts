/**
 * Logging utility for CodeBeasts
 * 
 * Provides consistent logging with environment awareness:
 * - securityLog: Always outputs (security events with [SECURITY:*] prefix)
 * - debugLog: Only outputs in development (verbose debugging)
 * - Standard console.*: Use for general application logging
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Security-related logs - ALWAYS output with [SECURITY:*] prefix
 * 
 * Use for:
 * - Rate limiting events: [SECURITY:RATE_LIMIT]
 * - File upload validation: [SECURITY:FILE_UPLOAD]
 * - Input validation failures: [SECURITY:VALIDATION]
 * - Authentication/authorization: [SECURITY:AUTH]
 * - Suspicious activity: [SECURITY:SUSPICIOUS]
 * 
 * These logs are always visible in production for security monitoring.
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
 * Debug logs - only output in development
 * 
 * Use for:
 * - Verbose debugging information
 * - Development-only diagnostics
 * - Sensitive data that shouldn't appear in production logs
 * 
 * These logs are automatically hidden in production (NODE_ENV=production).
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
 * For general application logging, use native console methods:
 * - console.log() - General info (visible in all environments)
 * - console.warn() - Warnings (visible in all environments)
 * - console.error() - Errors (visible in all environments)
 */

// Made with Bob
