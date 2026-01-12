/**
 * Security Penetration Tests
 * 
 * Tests that attempt to bypass security measures to ensure they are working correctly.
 * These tests simulate real attack scenarios including:
 * - Input validation bypass attempts
 * - File upload attacks
 * - Rate limiting bypass
 * - NoSQL injection
 * - XSS attempts
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { 
  safeValidate, 
  githubUsernameSchema, 
  emotionSchema,
  imageUrlSchema,
  generatePromptSchema,
  galleryPostSchema,
  sanitizeForDb,
  validateAndSanitizeUsername,
  ALLOWED_EMOTIONS
} from '@/lib/validation';

describe('Security Penetration Tests', () => {
  
  // ============================================================================
  // USERNAME VALIDATION BYPASS ATTEMPTS
  // ============================================================================
  
  describe('Username Validation - Attack Scenarios', () => {
    
    it('should reject username with SQL injection attempt', () => {
      const maliciousUsernames = [
        "admin' OR '1'='1",
        "admin'--",
        "admin' /*",
        "'; DROP TABLE users--",
      ];
      
      maliciousUsernames.forEach(username => {
        const result = safeValidate(githubUsernameSchema, username);
        expect(result.success).toBe(false);
      });
    });
    
    it('should reject username with NoSQL injection attempt', () => {
      const maliciousUsernames = [
        '{"$gt": ""}',
        '{"$ne": null}',
        'admin{$gt:""}',
        '{$where: "1==1"}',
      ];
      
      maliciousUsernames.forEach(username => {
        const result = safeValidate(githubUsernameSchema, username);
        expect(result.success).toBe(false);
      });
    });
    
    it('should reject username with XSS attempt', () => {
      const maliciousUsernames = [
        '<script>alert("XSS")</script>',
        'javascript:alert(1)',
        '<img src=x onerror=alert(1)>',
        '"><script>alert(String.fromCharCode(88,83,83))</script>',
      ];
      
      maliciousUsernames.forEach(username => {
        const result = safeValidate(githubUsernameSchema, username);
        expect(result.success).toBe(false);
      });
    });
    
    it('should reject username with path traversal attempt', () => {
      const maliciousUsernames = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        'user/../../admin',
        'user%2F..%2F..%2Fadmin',
      ];
      
      maliciousUsernames.forEach(username => {
        const result = safeValidate(githubUsernameSchema, username);
        expect(result.success).toBe(false);
      });
    });
    
    it('should reject username exceeding length limit', () => {
      const longUsername = 'a'.repeat(40); // GitHub max is 39
      const result = safeValidate(githubUsernameSchema, longUsername);
      expect(result.success).toBe(false);
    });
    
    it('should reject username with special characters', () => {
      const maliciousUsernames = [
        'user@domain',
        'user#123',
        'user$var',
        'user%20name',
        'user&admin',
        'user*wildcard',
      ];
      
      maliciousUsernames.forEach(username => {
        const result = safeValidate(githubUsernameSchema, username);
        expect(result.success).toBe(false);
      });
    });
    
    it('should accept valid GitHub usernames', () => {
      const validUsernames = [
        'octocat',
        'github-user',
        'user123',
        'a',
        'a'.repeat(39), // Max length
      ];
      
      validUsernames.forEach(username => {
        const result = safeValidate(githubUsernameSchema, username);
        expect(result.success).toBe(true);
      });
    });
    
    it('should normalize username to lowercase', () => {
      const result = safeValidate(githubUsernameSchema, 'UserName123');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('username123');
      }
    });
  });
  
  // ============================================================================
  // EMOTION VALIDATION BYPASS ATTEMPTS
  // ============================================================================
  
  describe('Emotion Validation - Attack Scenarios', () => {
    
    it('should reject emotion not in allowed list', () => {
      const maliciousEmotions = [
        'Custom Emotion',
        'Action Figure; DROP TABLE images;',
        'Angry\'; DELETE FROM users WHERE \'1\'=\'1',
      ];
      
      maliciousEmotions.forEach(emotion => {
        const result = safeValidate(emotionSchema, emotion);
        expect(result.success).toBe(false);
      });
    });
    
    it('should reject emotion exceeding length limit', () => {
      const longEmotion = 'A'.repeat(101);
      const result = safeValidate(emotionSchema, longEmotion);
      expect(result.success).toBe(false);
    });
    
    it('should accept all allowed emotions', () => {
      ALLOWED_EMOTIONS.forEach(emotion => {
        const result = safeValidate(emotionSchema, emotion);
        expect(result.success).toBe(true);
      });
    });
  });
  
  // ============================================================================
  // URL VALIDATION BYPASS ATTEMPTS
  // ============================================================================
  
  describe('Image URL Validation - Attack Scenarios', () => {
    
    it('should reject non-HTTPS URLs', () => {
      const maliciousUrls = [
        'http://everart.ai/image.jpg',
        'ftp://everart.ai/image.jpg',
        'file:///etc/passwd',
        'data:text/html,<script>alert(1)</script>',
      ];
      
      maliciousUrls.forEach(url => {
        const result = safeValidate(imageUrlSchema, url);
        expect(result.success).toBe(false);
      });
    });
    
    it('should reject URLs from unauthorized domains', () => {
      const maliciousUrls = [
        'https://attacker.com/image.jpg',
        'https://evil.com/image.jpg',
        'https://everart.ai.attacker.com/image.jpg', // Subdomain attack
        'https://everart.ai@attacker.com/image.jpg', // User info attack
      ];
      
      maliciousUrls.forEach(url => {
        const result = safeValidate(imageUrlSchema, url);
        expect(result.success).toBe(false);
      });
    });
    
    it('should reject SSRF attempts to internal networks', () => {
      const maliciousUrls = [
        'https://localhost/image.jpg',
        'https://127.0.0.1/image.jpg',
        'https://192.168.1.1/image.jpg',
        'https://10.0.0.1/image.jpg',
        'https://[::1]/image.jpg',
      ];
      
      maliciousUrls.forEach(url => {
        const result = safeValidate(imageUrlSchema, url);
        expect(result.success).toBe(false);
      });
    });
    
    it('should reject extremely long URLs', () => {
      const longUrl = 'https://everart.ai/' + 'a'.repeat(2049);
      const result = safeValidate(imageUrlSchema, longUrl);
      expect(result.success).toBe(false);
    });
    
    it('should accept valid URLs from allowed domains', () => {
      const validUrls = [
        'https://everart.ai/image.jpg',
        'https://api.everart.ai/image.jpg',
        'https://storage.googleapis.com/bucket/image.jpg',
        'https://raw.githubusercontent.com/user/repo/main/image.jpg',
      ];
      
      validUrls.forEach(url => {
        const result = safeValidate(imageUrlSchema, url);
        expect(result.success).toBe(true);
      });
    });
  });
  
  // ============================================================================
  // NOSQL INJECTION PREVENTION
  // ============================================================================
  
  describe('NoSQL Injection Prevention', () => {
    
    it('should sanitize special MongoDB operators', () => {
      const maliciousInputs = [
        '{"$gt": ""}',
        '{"$ne": null}',
        '{$where: "1==1"}',
        'admin{$gt:""}',
      ];
      
      maliciousInputs.forEach(input => {
        const sanitized = sanitizeForDb(input);
        expect(sanitized).not.toContain('$');
        expect(sanitized).not.toContain('{');
        expect(sanitized).not.toContain('}');
      });
    });
    
    it('should remove quotes from input', () => {
      const maliciousInputs = [
        "admin' OR '1'='1",
        'admin" OR "1"="1',
        "'; DROP TABLE users--",
      ];
      
      maliciousInputs.forEach(input => {
        const sanitized = sanitizeForDb(input);
        expect(sanitized).not.toContain("'");
        expect(sanitized).not.toContain('"');
      });
    });
    
    it('should validate and sanitize username for database operations', () => {
      const testCases = [
        { input: 'ValidUser', expected: 'validuser' },
        { input: 'User-Name', expected: 'user-name' },
        { input: 'user123', expected: 'user123' },
      ];
      
      testCases.forEach(({ input, expected }) => {
        const result = validateAndSanitizeUsername(input);
        expect(result).toBe(expected);
      });
    });
    
    it('should throw error for invalid username during sanitization', () => {
      const maliciousInputs = [
        '{"$gt": ""}',
        '<script>alert(1)</script>',
        '../../../etc/passwd',
      ];
      
      maliciousInputs.forEach(input => {
        expect(() => validateAndSanitizeUsername(input)).toThrow();
      });
    });
  });
  
  // ============================================================================
  // COMBINED API ENDPOINT VALIDATION
  // ============================================================================
  
  describe('API Endpoint Validation - Attack Scenarios', () => {
    
    it('should reject malicious generate prompt request', () => {
      const maliciousRequests = [
        {
          username: '<script>alert(1)</script>',
          emotion: 'Action Figure',
        },
        {
          username: 'validuser',
          emotion: 'Custom; DROP TABLE images;',
        },
        {
          username: '{"$gt": ""}',
          emotion: 'Action Figure',
        },
      ];
      
      maliciousRequests.forEach(request => {
        const result = safeValidate(generatePromptSchema, request);
        expect(result.success).toBe(false);
      });
    });
    
    it('should reject malicious gallery post request', () => {
      const maliciousRequests = [
        {
          username: 'validuser',
          image_url: 'http://attacker.com/image.jpg', // Non-HTTPS
        },
        {
          username: '<script>alert(1)</script>',
          image_url: 'https://everart.ai/image.jpg',
        },
        {
          username: 'validuser',
          image_url: 'https://attacker.com/image.jpg', // Unauthorized domain
        },
      ];
      
      maliciousRequests.forEach(request => {
        const result = safeValidate(galleryPostSchema, request);
        expect(result.success).toBe(false);
      });
    });
    
    it('should accept valid generate prompt request', () => {
      const validRequest = {
        username: 'octocat',
        emotion: 'Action Figure',
      };
      
      const result = safeValidate(generatePromptSchema, validRequest);
      expect(result.success).toBe(true);
    });
    
    it('should accept valid gallery post request', () => {
      const validRequest = {
        username: 'github-user',
        image_url: 'https://everart.ai/images/test.jpg',
      };
      
      const result = safeValidate(galleryPostSchema, validRequest);
      expect(result.success).toBe(true);
    });
  });
  
  // ============================================================================
  // EDGE CASES AND BOUNDARY TESTING
  // ============================================================================
  
  describe('Edge Cases and Boundary Testing', () => {
    
    it('should handle null and undefined inputs', () => {
      const schemas = [
        githubUsernameSchema,
        emotionSchema,
        imageUrlSchema,
      ];
      
      schemas.forEach(schema => {
        expect(safeValidate(schema, null).success).toBe(false);
        expect(safeValidate(schema, undefined).success).toBe(false);
      });
    });
    
    it('should handle empty strings', () => {
      const schemas = [
        githubUsernameSchema,
        emotionSchema,
        imageUrlSchema,
      ];
      
      schemas.forEach(schema => {
        expect(safeValidate(schema, '').success).toBe(false);
      });
    });
    
    it('should handle whitespace-only strings', () => {
      const schemas = [
        githubUsernameSchema,
        emotionSchema,
      ];
      
      schemas.forEach(schema => {
        expect(safeValidate(schema, '   ').success).toBe(false);
      });
    });
    
    it('should handle objects instead of strings', () => {
      const schemas = [
        githubUsernameSchema,
        emotionSchema,
        imageUrlSchema,
      ];
      
      schemas.forEach(schema => {
        expect(safeValidate(schema, {}).success).toBe(false);
        expect(safeValidate(schema, { username: 'test' }).success).toBe(false);
      });
    });
    
    it('should handle arrays instead of strings', () => {
      const schemas = [
        githubUsernameSchema,
        emotionSchema,
        imageUrlSchema,
      ];
      
      schemas.forEach(schema => {
        expect(safeValidate(schema, []).success).toBe(false);
        expect(safeValidate(schema, ['test']).success).toBe(false);
      });
    });
    
    it('should handle numbers instead of strings', () => {
      const schemas = [
        githubUsernameSchema,
        emotionSchema,
        imageUrlSchema,
      ];
      
      schemas.forEach(schema => {
        expect(safeValidate(schema, 123).success).toBe(false);
        expect(safeValidate(schema, 0).success).toBe(false);
      });
    });
  });
});

// Made with Bob