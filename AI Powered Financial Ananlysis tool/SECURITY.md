# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of ASIP seriously. If you discover a security vulnerability, please follow these steps:

### 🔒 Private Disclosure

**DO NOT** open a public issue for security vulnerabilities.

Instead:
1. Email: security@arpananand.com (or your contact email)
2. Subject: "ASIP Security Vulnerability"
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### ⏱️ Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity
  - Critical: 1-7 days
  - High: 7-14 days
  - Medium: 14-30 days
  - Low: 30-90 days

## 🛡️ Security Best Practices

### API Keys
- ✅ Never commit API keys to the repository
- ✅ Use `.env` file for sensitive data
- ✅ Rotate API keys regularly
- ✅ Use environment-specific keys (dev/prod)

### Data Protection
- ✅ No sensitive user data is stored
- ✅ API requests are logged without sensitive info
- ✅ Input validation on all endpoints
- ✅ Error messages don't expose system details

### Dependencies
- ✅ Regular dependency updates via `pip`
- ✅ Security audit with `pip-audit`
- ✅ Minimal dependency footprint
- ✅ Pinned versions in `requirements.txt`

## 🔍 Known Security Considerations

### API Rate Limiting
- Gemini API has quota limits (20 requests/day free tier)
- Built-in tracking to prevent quota exhaustion
- No authentication bypass possible

### Data Sources
- Yahoo Finance API - public data only
- NSE India - official public listings
- No personal financial data collected

### Network Security
- Backend runs on localhost by default
- CORS configuration for production deployment
- HTTPS recommended for production

## 📋 Security Checklist for Deployment

Before deploying to production:

- [ ] Change all default configurations
- [ ] Enable HTTPS/TLS
- [ ] Set up proper CORS policies
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Use environment-specific API keys
- [ ] Enable firewall rules
- [ ] Regular security updates
- [ ] Backup and disaster recovery plan

## 🚨 Disclosure Policy

When we fix a security issue:
1. We'll notify the reporter privately
2. Release a patched version
3. Publish a security advisory (if applicable)
4. Credit the reporter (unless they prefer anonymity)

## 📞 Contact

For security concerns: security@arpananand.com
For general issues: Use GitHub Issues (non-security only)

---

*Last updated: 2024*
