# Security Policy

## Overview

CalendarInbox Pro takes security seriously. This document outlines our security practices and how to report vulnerabilities.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Security Features

### Authentication & Authorization
- **JWT-based authentication** with 7-day expiration
- **Bcrypt password hashing** with 10 salt rounds
- **Password requirements**: Minimum 8 characters with uppercase, lowercase, and numbers
- **Token validation** on all protected endpoints

### API Security
- **Rate limiting**: 100 requests per 15 minutes per IP
- **Helmet.js**: Security headers including CSP, XSS protection
- **CORS**: Configured for specific origins only
- **Input validation**: All inputs validated with Zod schemas
- **SQL injection prevention**: Prepared statements for all database queries

### Data Protection
- **Encrypted passwords**: Never stored in plain text
- **Secure token storage**: OAuth2 tokens encrypted at rest
- **Environment variables**: Sensitive data never committed to repository
- **Activity logging**: All critical actions logged for audit trail

### Infrastructure Security
- **Database isolation**: SQLite with proper file permissions
- **Error handling**: Generic errors in production, detailed in development
- **Graceful shutdown**: Proper cleanup on termination signals

## Security Best Practices for Deployment

### 1. Environment Variables
- Change default `JWT_SECRET` to a strong random value (minimum 32 characters)
- Use strong unique passwords for all accounts
- Never commit `.env` file to version control
- Rotate secrets regularly (every 90 days recommended)

### 2. Database Security
- Store database in secure location with restricted permissions
- Implement regular backup strategy
- Consider encryption at rest for sensitive data
- Monitor database access logs

### 3. Network Security
- Use HTTPS/TLS in production
- Configure firewall to allow only necessary ports
- Implement reverse proxy (nginx/Apache)
- Use VPN for administrative access

### 4. Monitoring & Logging
- Set up centralized logging
- Monitor for suspicious activity patterns
- Implement alerting for security events
- Regular security audit logs review

### 5. Updates & Patches
- Keep all dependencies up to date
- Subscribe to security advisories
- Test updates in staging before production
- Document all security patches applied

## Known Security Considerations

### 1. Email OAuth Tokens
- OAuth2 tokens are stored in database
- Implement token encryption at rest for production
- Regular token rotation recommended

### 2. Rate Limiting
- Current rate limit: 100 requests / 15 minutes
- Adjust based on your traffic patterns
- Consider implementing per-user rate limits

### 3. File Uploads
- Currently attachments are stored locally
- Implement virus scanning for production
- Consider cloud storage for scalability

### 4. Email Content
- Email content is stored unencrypted
- Consider end-to-end encryption for sensitive data
- Implement data retention policies

## Vulnerability Reporting

### Reporting a Vulnerability

If you discover a security vulnerability, please follow these steps:

1. **DO NOT** open a public issue
2. Email security details to: **security@calendarinbox.pro**
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- **Initial response**: Within 48 hours
- **Status update**: Within 7 days
- **Fix timeline**: Varies based on severity
  - Critical: 24-48 hours
  - High: 1 week
  - Medium: 2-4 weeks
  - Low: Next release cycle

### Disclosure Policy

- We follow responsible disclosure
- Security fixes released before public disclosure
- Credit given to reporters (if desired)
- Public disclosure after fix is deployed

## Security Checklist for Production

- [ ] Changed JWT_SECRET from default
- [ ] Configured strong passwords
- [ ] Enabled HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Configured rate limiting
- [ ] Implemented logging and monitoring
- [ ] Set up automated backups
- [ ] Reviewed and configured CORS
- [ ] Disabled debug mode
- [ ] Set NODE_ENV=production
- [ ] Implemented token encryption
- [ ] Configured secure cookie settings
- [ ] Set up intrusion detection
- [ ] Documented security procedures
- [ ] Trained team on security practices

## Compliance

### Data Protection
- GDPR considerations for EU users
- CCPA compliance for California users
- Data retention policies
- User data deletion on request

### Email Standards
- CAN-SPAM compliance
- SPF/DKIM/DMARC configuration
- Unsubscribe mechanisms

## Security Contacts

- **Security Email**: security@calendarinbox.pro
- **General Support**: support@calendarinbox.pro
- **GitHub Issues**: https://github.com/zodiesel21011-cmd/calendarinbox/issues (non-security only)

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

Last updated: 2024-10-17
Version: 1.0.0
