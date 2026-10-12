# Fly.io Deployment Guide for Mzansi Couriers

## Prerequisites
- ✅ Fly CLI installed (`flyctl`)
- ✅ Fly.io account created
- ✅ Authenticated with `flyctl auth login`
- ✅ GitHub repository pushed

## Step 1: Initialize Fly.io App

Run this command in your project root:

```bash
cd /home/ubuntu/mzansi-couriers
flyctl launch
```

When prompted:
- **App name:** `mzansi-couriers`
- **Region:** `jnb` (Johannesburg, South Africa)
- **PostgreSQL database:** Yes
- **Redis cache:** Yes
- **Deploy now:** No (we'll configure first)

## Step 2: Configure Environment Variables

After `flyctl launch`, edit the generated `fly.toml` file and add:

```toml
[env]
  NODE_ENV = "production"
  PORT = "3000"
  DATABASE_URL = "your-postgres-url"
  REDIS_URL = "your-redis-url"
  JWT_SECRET = "your-jwt-secret"
  VITE_APP_ID = "your-app-id"
  OAUTH_SERVER_URL = "https://api.manus.im"
  VITE_OAUTH_PORTAL_URL = "https://oauth.manus.im"
  PAYSTACK_SECRET_KEY = "your-paystack-key"
  TWILIO_ACCOUNT_SID = "your-twilio-sid"
  TWILIO_AUTH_TOKEN = "your-twilio-token"
```

## Step 3: Create PostgreSQL Database

```bash
flyctl postgres create --name mzansi-db --region jnb
```

Get the connection string:
```bash
flyctl postgres connect -a mzansi-db
```

## Step 4: Create Redis Cache

```bash
flyctl redis create --name mzansi-redis --region jnb
```

Get the connection string:
```bash
flyctl redis connect -a mzansi-redis
```

## Step 5: Set Secrets

```bash
flyctl secrets set \
  DATABASE_URL="postgresql://..." \
  REDIS_URL="redis://..." \
  JWT_SECRET="your-secret" \
  PAYSTACK_SECRET_KEY="your-key" \
  TWILIO_ACCOUNT_SID="your-sid" \
  TWILIO_AUTH_TOKEN="your-token"
```

## Step 6: Deploy

```bash
flyctl deploy
```

## Step 7: Run Migrations

After deployment:
```bash
flyctl ssh console -a mzansi-couriers
# Inside console:
pnpm run db:migrate
```

## Step 8: Get Production URL

```bash
flyctl info -a mzansi-couriers
```

Your app will be at: `https://mzansi-couriers.fly.dev`

## Troubleshooting

### App won't start
- Check logs: `flyctl logs -a mzansi-couriers`
- Verify environment variables: `flyctl secrets list -a mzansi-couriers`

### Database connection failed
- Verify DATABASE_URL is correct
- Check PostgreSQL is running: `flyctl postgres status -a mzansi-db`

### Redis connection failed
- Verify REDIS_URL is correct
- Check Redis is running: `flyctl redis status -a mzansi-redis`

## Next Steps

1. Update your frontend to point to: `https://mzansi-couriers.fly.dev/api/trpc`
2. Deploy frontend to Firebase
3. Build iOS app with Capacitor
4. Submit to App Store

## Support

For Fly.io help: https://fly.io/docs/
For app issues: Check the logs with `flyctl logs`
