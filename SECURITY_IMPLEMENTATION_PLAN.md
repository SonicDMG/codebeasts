# CodeBeasts Security Implementation Plan

## Executive Summary

This document outlines the security vulnerabilities identified in the CodeBeasts application and provides a prioritized implementation plan. As an anonymous, public-facing application, the focus is on **abuse prevention** and **resource protection** rather than user authentication.

## Security Analysis Overview

**Analysis Date:** January 12, 2026  
**Application Type:** Anonymous, public-facing Next.js application  
**Primary Risks:** API cost exploitation, file upload attacks, XSS vulnerabilities

## Identified Vulnerabilities

### Critical Severity
1. **No Rate Limiting** - Attackers can drain API budgets and overwhelm resources
2. **Insecure File Upload** - Anonymous uploads without proper validation/sanitization
3. **Disabled Content Security Policy** - Application vulnerable to XSS attacks

### High Severity
4. Input validation gaps in API endpoints
5. SSRF vulnerabilities in proxy endpoints
6. Verbose error messages exposing internal details

### Medium Severity
7. Missing security headers (HSTS, Permissions-Policy)
8. Insufficient logging and monitoring
9. Dependency version mismatches

## Implementation Plan

### Phase 1: Critical Security Fixes (Immediate - Week 1)

#### 1.1 Implement IP-Based Rate Limiting
**Priority:** CRITICAL  
**Estimated Time:** 4-6 hours  
**Dependencies:** `@upstash/ratelimit`, `@upstash/redis`

**Implementation Steps:**
1. Install Upstash dependencies
2. Set up Upstash Redis instance
3. Create rate limiting middleware
4. Apply to generation endpoints
5. Add rate limit headers to responses
6. Implement CAPTCHA fallback (hCaptcha/Turnstile)

**Configuration:**
- Limit: 10 generations per IP per hour
- Window: Sliding window algorithm
- Response: 429 Too Many Requests with Retry-After header
- CAPTCHA trigger: After 5 requests in 10 minutes

**Files to Modify:**
- `package.json` - Add dependencies
- `lib/ratelimit.ts` - New rate limiting utility
- `middleware.ts` - New Next.js middleware
- `app/api/generate/prompt/route.ts` - Apply rate limiting
- `.env.example` - Add Upstash configuration

**Success Criteria:**
- Rate limiting active on all generation endpoints
- Proper error responses with retry information
- Cost monitoring alerts configured

---

#### 1.2 Secure File Upload Handling
**Priority:** CRITICAL  
**Estimated Time:** 6-8 hours  
**Dependencies:** `file-type` library

**Implementation Steps:**
1. Add file-type dependency for content validation
2. Implement server-side file size validation (5MB hard limit)
3. Add file content type verification
4. Enhance Sharp processing to strip metadata
5. Implement temporary file cleanup
6. Add file upload logging

**Security Controls:**
- Maximum file size: 5MB (enforced server-side)
- Allowed MIME types: image/jpeg, image/png, image/webp
- Content validation: Verify actual file content matches MIME type
- Metadata stripping: Re-encode through Sharp
- Storage: Temporary only, immediate deletion after processing
- Future enhancement: ClamAV virus scanning

**Files to Modify:**
- `package.json` - Add file-type dependency
- `app/api/generate/prompt/route.ts` - Enhanced file validation
- `app/api/generate/prompt/imageUtils.ts` - Add validation utilities

**Success Criteria:**
- All file uploads validated for size and content type
- Malicious files rejected before processing
- No persistent storage of uploaded files
- Comprehensive logging of upload attempts

---

#### 1.3 Enable Content Security Policy
**Priority:** HIGH  
**Estimated Time:** 2-3 hours  
**Dependencies:** None (configuration only)

**Implementation Steps:**
1. Uncomment CSP configuration in next.config.js
2. Configure strict CSP directives
3. Test CSP with all application features
4. Add CSP reporting endpoint
5. Monitor CSP violations

**CSP Configuration:**
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https://*.everart.ai https://storage.googleapis.com;
connect-src 'self' https://api.everart.ai;
font-src 'self';
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;
```

**Files to Modify:**
- `next.config.js` - Uncomment and configure CSP

**Success Criteria:**
- CSP active in production
- No legitimate functionality broken
- XSS attack vectors mitigated
- CSP violations logged

---

### Phase 2: High Priority Fixes (Week 2)

#### 2.1 Enhanced Input Validation
**Estimated Time:** 4-5 hours

**Implementation:**
- Create Zod schemas for all API endpoints
- Add server-side validation for all inputs
- Implement length limits on text fields
- Add sanitization for database queries

**Files to Modify:**
- `types/validation.ts` - New Zod schemas
- All API route files - Add validation

---

#### 2.2 SSRF Protection Enhancement
**Estimated Time:** 2-3 hours

**Implementation:**
- Strengthen URL validation in proxy endpoint
- Add URL parsing validation
- Implement domain allowlist
- Add timeout limits for external requests

**Files to Modify:**
- `app/api/proxy-image/route.ts`
- `lib/urlValidation.ts` - New validation utilities

---

#### 2.3 Error Handling Improvements
**Estimated Time:** 3-4 hours

**Implementation:**
- Create generic error response utility
- Remove detailed error messages from production
- Implement structured server-side logging
- Add error monitoring integration

**Files to Modify:**
- `lib/errorHandling.ts` - New error utilities
- All API routes - Update error responses

---

### Phase 3: Medium Priority Improvements (Week 3-4)

#### 3.1 Security Headers
**Estimated Time:** 2 hours

**Implementation:**
- Add Strict-Transport-Security header
- Change X-Frame-Options to DENY
- Add Permissions-Policy header
- Configure additional security headers

**Files to Modify:**
- `next.config.js`

---

#### 3.2 Monitoring & Logging
**Estimated Time:** 6-8 hours

**Implementation:**
- Implement structured logging (Winston/Pino)
- Add security event logging
- Set up cost monitoring alerts
- Implement bot detection patterns
- Configure alerting for anomalies

**Files to Modify:**
- `lib/logger.ts` - New logging utility
- All API routes - Add logging
- Infrastructure - Configure alerts

---

#### 3.3 Dependency Management
**Estimated Time:** 2-3 hours

**Implementation:**
- Enable Dependabot or Snyk
- Fix eslint-config-next version mismatch
- Update all dependencies to latest secure versions
- Configure automated security scanning

**Files to Modify:**
- `package.json`
- `.github/dependabot.yml` - New configuration

---

## Implementation Order

### Week 1 (Critical)
1. **Day 1-2:** Rate limiting implementation
2. **Day 3-4:** File upload security
3. **Day 5:** Content Security Policy

### Week 2 (High Priority)
4. **Day 1-2:** Input validation with Zod
5. **Day 3:** SSRF protection
6. **Day 4-5:** Error handling improvements

### Week 3-4 (Medium Priority)
7. **Day 1:** Security headers
8. **Day 2-4:** Monitoring and logging
9. **Day 5:** Dependency management

## Testing Strategy

### Security Testing Checklist
- [ ] Rate limiting bypass attempts
- [ ] Malicious file upload tests
- [ ] XSS injection attempts
- [ ] SSRF exploitation tests
- [ ] Input validation boundary tests
- [ ] Error message information disclosure
- [ ] Load testing with rate limits
- [ ] CSP violation testing

### Tools
- OWASP ZAP for automated scanning
- Burp Suite for manual testing
- Artillery for load testing
- Browser DevTools for CSP testing

## Monitoring & Maintenance

### Ongoing Security Tasks
1. **Weekly:** Review security logs and alerts
2. **Monthly:** Dependency security updates
3. **Quarterly:** Full security audit
4. **Annually:** Penetration testing

### Key Metrics to Monitor
- Rate limit violations per hour
- File upload rejection rate
- CSP violation count
- API cost per day
- Error rate trends
- Unusual traffic patterns

## Cost Considerations

### Infrastructure Costs
- Upstash Redis: ~$10-20/month (Pro plan)
- Monitoring/Logging: ~$20-50/month (depending on volume)
- CAPTCHA service: Free tier available (hCaptcha/Turnstile)

### Development Time
- Phase 1 (Critical): 12-17 hours
- Phase 2 (High): 9-12 hours
- Phase 3 (Medium): 10-13 hours
- **Total:** 31-42 hours

## Success Metrics

### Phase 1 Success Criteria
- ✅ Rate limiting active with 10 req/hour limit
- ✅ File uploads validated and sanitized
- ✅ CSP enabled without breaking functionality
- ✅ Zero critical vulnerabilities remaining

### Overall Success Criteria
- 90% reduction in abuse attempts
- API costs within budget
- Zero successful XSS attacks
- All high/critical vulnerabilities resolved
- Comprehensive security monitoring in place

## Rollback Plan

Each phase includes rollback procedures:
1. Feature flags for gradual rollout
2. Database backups before changes
3. Configuration version control
4. Monitoring for regressions
5. Quick disable switches for new features

## Documentation Updates Required

- [ ] Update README.md with security features
- [ ] Create SECURITY.md for vulnerability reporting
- [ ] Document rate limiting for users
- [ ] Update API documentation
- [ ] Create incident response playbook

## Compliance Considerations

While this is an anonymous app, consider:
- Privacy policy for minimal data collection
- Terms of service for acceptable use
- Data retention policy (90-day deletion)
- GDPR considerations for EU users
- CCPA considerations for California users

## Next Steps

1. **Immediate:** Review and approve this plan
2. **Week 1:** Begin Phase 1 implementation
3. **Ongoing:** Monitor security metrics
4. **Future:** Consider additional enhancements (WAF, DDoS protection)

---

## Appendix A: Environment Variables Required

```bash
# Rate Limiting (Upstash)
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# CAPTCHA (Optional - for enhanced rate limiting)
HCAPTCHA_SECRET_KEY=your_hcaptcha_secret
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your_hcaptcha_site_key

# Monitoring (Optional)
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info
```

## Appendix B: Code Examples

See implementation files for detailed code examples:
- Rate limiting: `lib/ratelimit.ts`
- File validation: `lib/fileValidation.ts`
- Error handling: `lib/errorHandling.ts`

---

**Document Version:** 1.0  
**Last Updated:** January 12, 2026  
**Next Review:** After Phase 1 completion