# Security Documentation

## Overview

This document outlines the security measures implemented in the Events Platform to protect against common web vulnerabilities and comply with Google Safe Browsing standards.

## Security Headers

### HTTP Security Headers (via Helmet.js)

The application implements comprehensive HTTP security headers using the `helmet` middleware:

#### Content Security Policy (CSP)
```javascript
Content-Security-Policy:
  - default-src 'self'
  - style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net
  - script-src 'self' https://cdn.jsdelivr.net
  - font-src 'self' https://cdn.jsdelivr.net
  - img-src 'self' data: https:
  - connect-src 'self'
  - frame-src 'none'
  - object-src 'none'
  - upgrade-insecure-requests
```

**Purpose**: Prevents XSS attacks by restricting resource loading sources.

**Note**: `'unsafe-inline'` is currently required for Bootstrap's inline styles. Future enhancement could use nonces or hashes for better security.

#### X-Frame-Options
```
X-Frame-Options: DENY
```

**Purpose**: Prevents clickjacking attacks by disallowing the site to be embedded in iframes.

#### X-Content-Type-Options
```
X-Content-Type-Options: nosniff
```

**Purpose**: Prevents MIME-type sniffing attacks by enforcing declared content types.

#### Referrer-Policy
```
Referrer-Policy: strict-origin-when-cross-origin
```

**Purpose**: Controls referrer information sent with requests to protect user privacy.

#### Permissions-Policy
```
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

**Purpose**: Disables browser features that could be used maliciously (geolocation, microphone, camera).

#### X-XSS-Protection
**REMOVED** - This header is deprecated and can introduce security vulnerabilities in older browsers. Modern browsers ignore this header in favor of CSP.

#### Strict-Transport-Security (HSTS)
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

**Purpose**: Forces HTTPS connections for one year, protecting against man-in-the-middle attacks.

## HTML Meta Tags

All HTML pages include security-related meta tags:

```html
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="description" content="...">
<meta name="robots" content="index, follow">
```

**Note**: CSP is enforced via HTTP headers from helmet.js, not via meta tags, to avoid conflicts and ensure consistent enforcement.

## Rate Limiting

The application implements rate limiting to prevent abuse:

```javascript
Rate Limit: 100 requests per 15 minutes per IP
```

**Purpose**: Protects against brute force attacks and DoS attempts.

## CORS Configuration

Cross-Origin Resource Sharing (CORS) is currently configured permissively:

```javascript
app.use(cors());
```

**Current Status**: Allows all origins for maximum compatibility.

**Future Enhancement**: Consider restricting to specific origins:
```javascript
app.use(cors({
  origin: ['https://yourdomain.com', 'https://www.yourdomain.com']
}));
```

## Azure Deployment Security

The `web.config` file includes security headers for IIS/Azure deployment:

- All HTTP security headers are duplicated in web.config
- HSTS is enforced at the IIS level
- Request filtering is configured to hide sensitive segments

## Input Validation & Sanitization

### HTML Escaping
All user-generated content is escaped before rendering:

```javascript
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
```

### Mongoose/MongoDB Protection
- Using Mongoose ODM prevents NoSQL injection attacks
- All database queries use parameterized operations

## Safe External Resources

External resources are loaded only from trusted CDNs:
- **Bootstrap**: `https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/`
- **Bootstrap Icons**: `https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/`

All external resources are explicitly whitelisted in CSP directives.

## Google Safe Browsing Compliance

The implemented security measures address common Google Safe Browsing warnings:

1. **Proper Security Headers**: All recommended security headers are in place
2. **CSP Implementation**: Strict Content Security Policy prevents malicious code execution
3. **XSS Protection**: Multiple layers of XSS protection (headers + input sanitization)
4. **HTTPS Enforcement**: upgrade-insecure-requests directive in CSP
5. **Frame Protection**: X-Frame-Options prevents clickjacking
6. **No Suspicious Patterns**: No redirects, no external form submissions, no suspicious scripts

## Security Best Practices Followed

1. ✅ **Defense in Depth**: Multiple security layers
2. ✅ **Principle of Least Privilege**: Minimal permissions policy
3. ✅ **Secure by Default**: Security headers applied to all responses
4. ✅ **Input Validation**: All user inputs are validated and sanitized
5. ✅ **Regular Updates**: Dependencies are kept up to date
6. ✅ **Rate Limiting**: Protection against abuse
7. ✅ **HTTPS Enforcement**: Upgrade insecure requests

## Monitoring & Maintenance

### Regular Security Audits
```bash
npm audit
```

### Dependency Updates
```bash
npm update
npm audit fix
```

### Testing Security Headers
Use online tools to verify security headers:
- https://securityheaders.com/
- https://observatory.mozilla.org/

## Incident Response

If a security vulnerability is discovered:

1. **Report**: Create a security issue in GitHub
2. **Assess**: Evaluate severity and impact
3. **Fix**: Implement fix on a security branch
4. **Test**: Verify fix doesn't break functionality
5. **Deploy**: Deploy fix as soon as possible
6. **Document**: Update this document with lessons learned

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Google Safe Browsing](https://safebrowsing.google.com/)

## Future Security Enhancements

Consider these improvements for even stronger security:

1. **CSP Nonces/Hashes**: Replace `'unsafe-inline'` with nonces or hashes for inline styles
2. **Stricter CORS**: Restrict CORS to specific trusted origins only
3. **Rate Limiting by User**: Implement per-user rate limiting for authenticated endpoints
4. **Content Security Policy Reporting**: Add CSP reporting to monitor violations
5. **Subresource Integrity (SRI)**: Add SRI hashes for CDN resources
6. **Security Headers Testing**: Automate security headers testing in CI/CD

## Version History

- **2024-01**: Initial security implementation
  - Added helmet.js
  - Implemented CSP
  - Added security meta tags
  - Updated web.config with security headers
