# Mzansi Couriers - Deployment Guide

## Pre-Deployment Checklist

### Environment Variables
- [ ] `DATABASE_URL` - MySQL/TiDB connection string
- [ ] `JWT_SECRET` - Session signing secret (32+ characters)
- [ ] `VITE_APP_ID` - Manus OAuth app ID
- [ ] `OAUTH_SERVER_URL` - Manus OAuth server URL
- [ ] `VITE_OAUTH_PORTAL_URL` - Manus login portal URL
- [ ] `OWNER_OPEN_ID` - Owner's Manus OpenID
- [ ] `OWNER_NAME` - Owner's name
- [ ] `BUILT_IN_FORGE_API_URL` - Manus Forge API URL
- [ ] `BUILT_IN_FORGE_API_KEY` - Manus Forge API key
- [ ] `VITE_FRONTEND_FORGE_API_KEY` - Frontend Forge API key
- [ ] `VITE_FRONTEND_FORGE_API_URL` - Frontend Forge API URL
- [ ] `TWILIO_ACCOUNT_SID` - Twilio account ID
- [ ] `TWILIO_AUTH_TOKEN` - Twilio auth token
- [ ] `TWILIO_WHATSAPP_NUMBER` - Twilio WhatsApp number
- [ ] `PAYSTACK_SECRET_KEY` - Paystack secret key
- [ ] `VITE_PAYSTACK_PUBLIC_KEY` - Paystack public key
- [ ] `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- [ ] `VITE_FIREBASE_API_KEY` - Firebase API key
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase sender ID
- [ ] `VITE_ANALYTICS_ENDPOINT` - Analytics endpoint
- [ ] `VITE_ANALYTICS_WEBSITE_ID` - Analytics website ID

### Database
- [ ] Database created and accessible
- [ ] All migrations applied
- [ ] Indexes created for performance
- [ ] Backup system configured
- [ ] Connection pooling configured

### Security
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Input validation active
- [ ] SQL injection protection verified
- [ ] XSS protection enabled
- [ ] CSRF tokens configured

### Testing
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Load tests completed
- [ ] Security audit passed
- [ ] Performance benchmarks met

### Monitoring
- [ ] Error logging configured
- [ ] Performance monitoring active
- [ ] Uptime monitoring configured
- [ ] Alert system set up
- [ ] Backup verification scheduled

---

## Deployment Steps

### Step 1: Prepare Application

```bash
# Install dependencies
pnpm install

# Build application
pnpm run build

# Run tests
pnpm test

# Check for TypeScript errors
pnpm run type-check
```

### Step 2: Database Migration

```bash
# Generate migration from schema changes
pnpm drizzle-kit generate

# Apply migrations
pnpm run migrate

# Verify database
pnpm run verify-db
```

### Step 3: Environment Configuration

Create `.env.production` with all required variables:

```env
DATABASE_URL=mysql://user:password@host:3306/mzansi_couriers
JWT_SECRET=your-secret-key-here-min-32-chars
VITE_APP_ID=your-manus-app-id
# ... (add all other variables)
```

### Step 4: Deploy to Production

#### Option A: Manus Hosting (Recommended)

1. Click "Publish" button in Management UI
2. Configure custom domain (optional)
3. Enable SSL/TLS
4. Set up CDN caching
5. Configure backup schedule

#### Option B: External Hosting (Vercel, Railway, etc.)

```bash
# Build for production
pnpm run build

# Deploy
# Follow your hosting provider's deployment process
```

### Step 5: Post-Deployment Verification

```bash
# Check health endpoint
curl https://your-domain.com/api/health

# Verify OAuth callback
curl https://your-domain.com/api/oauth/callback

# Test tRPC endpoint
curl https://your-domain.com/api/trpc/auth.me

# Check database connectivity
# Verify from admin dashboard
```

### Step 6: Enable Monitoring

1. Set up error tracking (Sentry, LogRocket, etc.)
2. Configure performance monitoring
3. Enable uptime monitoring
4. Set up alert notifications
5. Configure log aggregation

---

## Scaling for 100K+ Users

### Phase 1: Database Optimization (5K-10K users)
- [ ] Add read replicas
- [ ] Enable query caching
- [ ] Optimize indexes
- [ ] Add Redis for sessions

### Phase 2: Database Sharding (10K-50K users)
- [ ] Implement geographic sharding (9 provinces)
- [ ] Set up shard routing logic
- [ ] Migrate data across shards
- [ ] Test failover scenarios

### Phase 3: Serverless Architecture (50K-100K+ users)
- [ ] Convert to serverless functions
- [ ] Implement edge caching
- [ ] Set up CDN globally
- [ ] Enable auto-scaling

### Phase 4: Advanced Scaling (100K+ users)
- [ ] Implement database federation
- [ ] Set up multi-region deployment
- [ ] Configure load balancing
- [ ] Implement circuit breakers

---

## Monitoring & Maintenance

### Daily Tasks
- [ ] Check error logs
- [ ] Monitor database performance
- [ ] Verify backups completed
- [ ] Check uptime status

### Weekly Tasks
- [ ] Review performance metrics
- [ ] Check security logs
- [ ] Update dependencies
- [ ] Test disaster recovery

### Monthly Tasks
- [ ] Security audit
- [ ] Performance optimization
- [ ] Capacity planning
- [ ] User feedback review

---

## Rollback Procedure

If issues occur after deployment:

1. **Immediate Actions**
   - Check error logs
   - Monitor user reports
   - Assess impact severity

2. **Rollback Steps**
   - Stop current deployment
   - Restore previous version
   - Verify database integrity
   - Test critical flows

3. **Post-Rollback**
   - Investigate root cause
   - Fix issues
   - Run full test suite
   - Deploy again

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Page Load Time | <2s | TBD |
| API Response Time | <200ms | TBD |
| Database Query Time | <50ms | TBD |
| Uptime | 99.9% | TBD |
| Error Rate | <0.1% | TBD |

---

## Support & Troubleshooting

### Common Issues

**Issue: Database Connection Timeout**
- Check connection string
- Verify network connectivity
- Check connection pool limits
- Review database logs

**Issue: High API Response Time**
- Check database query performance
- Review cache hit rates
- Monitor server CPU/memory
- Check for N+1 queries

**Issue: Rate Limiting Errors**
- Verify rate limit configuration
- Check client request patterns
- Review rate limit logs
- Adjust limits if needed

**Issue: OAuth Callback Fails**
- Verify redirect URL configuration
- Check OAuth credentials
- Review OAuth logs
- Test with different browser

### Getting Help

- **Documentation**: See API_DOCUMENTATION.md
- **GitHub Issues**: Report bugs on GitHub
- **Email Support**: support@mzansicouriers.com
- **Emergency**: contact@mzansicouriers.com

---

## Version History

- **v1.0.0** (May 27, 2026) - Initial production release
  - Core delivery booking
  - Courier management
  - Real-time tracking
  - SMS/WhatsApp notifications
  - Admin dashboard
  - Payment integration

---

## Deployment Checklist Template

```markdown
## Deployment: [Date] - [Version]

### Pre-Deployment
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Database backed up
- [ ] Monitoring configured

### Deployment
- [ ] Environment variables set
- [ ] Database migrations applied
- [ ] Application deployed
- [ ] Health checks passing

### Post-Deployment
- [ ] Critical flows tested
- [ ] Error logs reviewed
- [ ] Performance verified
- [ ] Users notified

### Monitoring (24 hours)
- [ ] Error rate normal
- [ ] Response times acceptable
- [ ] Database performing well
- [ ] No user complaints

### Sign-Off
- Deployed by: _______________
- Verified by: _______________
- Date: _______________
```

---

Last Updated: May 27, 2026
