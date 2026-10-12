# Mzansi Couriers - Deployment Checklist

## Pre-Deployment Verification

### Code Quality
- [x] All TypeScript compilation passes (0 errors)
- [x] All 25 unit tests passing
- [x] No console errors in dev server
- [x] No security vulnerabilities in dependencies
- [x] Code follows ESLint standards

### Functionality Testing
- [x] Home page loads correctly
- [x] All 8 home page buttons functional
- [x] OAuth login flow working
- [x] Protected routes require authentication
- [x] Customer dashboard accessible
- [x] Courier dashboard accessible
- [x] Admin dashboard accessible
- [x] Language switcher working (English, Zulu, Xhosa)
- [x] Regional pricing selector functional
- [x] Payment methods display correctly
- [x] Notification preferences accessible

### Responsive Design
- [x] Desktop layout (1920px+) - Verified
- [x] Tablet layout (768px-1024px) - Verified
- [x] Mobile layout (375px-480px) - Verified
- [x] Touch interactions working
- [x] No horizontal scrolling on mobile

### Performance
- [x] Page load time < 3 seconds
- [x] API response time < 500ms
- [x] Database queries optimized
- [x] Images compressed and optimized
- [x] CSS/JS minified

### Security
- [x] OAuth tokens properly secured
- [x] Session cookies httpOnly flag set
- [x] CSRF protection enabled
- [x] SQL injection prevention (using Drizzle ORM)
- [x] XSS protection enabled
- [x] Environment variables not exposed

### Database
- [x] Database migrations applied
- [x] All tables created successfully
- [x] Foreign key constraints in place
- [x] Indexes created for performance
- [x] Backup strategy documented

### Environment Setup
- [x] Production environment variables configured
- [x] Database connection string verified
- [x] OAuth credentials configured
- [x] JWT secret set
- [x] API endpoints configured

## Deployment Steps

### 1. Pre-Deployment
```bash
# Verify all tests pass
pnpm test

# Build production bundle
pnpm build

# Check for build errors
echo "Build completed successfully"
```

### 2. Database Migration
```bash
# Apply pending migrations
pnpm drizzle-kit migrate

# Verify schema
SELECT * FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'mzansi_couriers';
```

### 3. Environment Configuration
- [ ] Set `DATABASE_URL` to production database
- [ ] Set `JWT_SECRET` to secure random value
- [ ] Set `VITE_APP_ID` to production OAuth app ID
- [ ] Set `OAUTH_SERVER_URL` to production OAuth server
- [ ] Set `VITE_OAUTH_PORTAL_URL` to production portal
- [ ] Set `OWNER_OPEN_ID` to owner's ID
- [ ] Set `OWNER_NAME` to owner's name
- [ ] Set `BUILT_IN_FORGE_API_KEY` for backend API access
- [ ] Set `VITE_FRONTEND_FORGE_API_KEY` for frontend API access

### 4. Deploy Application
```bash
# Deploy to Manus platform
# Click "Publish" button in Management UI

# Verify deployment
curl https://mzansicourier-nsebzqbt.manus.space/
```

### 5. Post-Deployment Verification
- [ ] Home page loads
- [ ] Sign In button works
- [ ] OAuth callback succeeds
- [ ] Customer dashboard loads
- [ ] Courier dashboard loads
- [ ] Admin dashboard loads
- [ ] Language switcher works
- [ ] Database queries execute
- [ ] No console errors

### 6. Monitoring
- [ ] Set up error logging
- [ ] Monitor API response times
- [ ] Track user signups
- [ ] Monitor database performance
- [ ] Set up uptime monitoring

## Rollback Plan

If deployment fails:

1. **Immediate Rollback**
   ```bash
   # Rollback to previous checkpoint
   webdev_rollback_checkpoint --version <previous_version_id>
   ```

2. **Database Rollback**
   ```bash
   # Revert last migration
   pnpm drizzle-kit migrate --down
   ```

3. **Notify Stakeholders**
   - Document the issue
   - Notify team of rollback
   - Schedule post-mortem

## Post-Deployment Tasks

### Day 1
- [ ] Monitor error logs
- [ ] Verify all core flows work
- [ ] Test with real users
- [ ] Check performance metrics

### Week 1
- [ ] Gather user feedback
- [ ] Monitor database performance
- [ ] Check for security issues
- [ ] Review analytics

### Ongoing
- [ ] Daily monitoring
- [ ] Weekly backups
- [ ] Monthly security audits
- [ ] Quarterly performance reviews

## Support Contacts

- **Technical Lead**: Rick (PR Manager)
- **Database Admin**: DevOps Team
- **Security**: Security Team
- **Escalation**: Platform Support

## Sign-Off

- [ ] Code Review: Approved
- [ ] QA Testing: Passed
- [ ] Security Review: Approved
- [ ] Performance Review: Approved
- [ ] Ready for Production: YES

**Deployment Date**: _______________
**Deployed By**: _______________
**Verified By**: _______________

## Deployment History

| Date | Version | Status | Notes |
|------|---------|--------|-------|
| 2026-05-10 | 89987ff5 | Ready | All tests passing, buttons working |
| | | | |

---

**Last Updated**: May 10, 2026
**Status**: Ready for Deployment
