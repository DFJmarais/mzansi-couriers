# Mzansi Couriers - South Africa's Peer-to-Peer Logistics Platform

## Overview

Mzansi Couriers is a comprehensive, production-ready logistics platform that connects customers with independent couriers across South Africa. The platform enables seamless package delivery with real-time tracking, transparent pricing, and secure payments.

## Key Features

### For Customers
- **Easy Booking** - Book deliveries in minutes with transparent pricing
- **Real-Time Tracking** - Track packages from pickup to delivery
- **Multiple Payment Options** - EFT, Capitec, card, or in-app wallet
- **Ratings & Reviews** - Rate couriers and provide feedback
- **Delivery History** - View all past deliveries and invoices
- **SMS/WhatsApp Updates** - Get notifications via SMS or WhatsApp

### For Couriers
- **Flexible Work** - Accept deliveries on your own schedule
- **Instant Earnings** - Get paid immediately after delivery
- **Performance Tracking** - Monitor ratings and earnings
- **Route Optimization** - See available jobs near you
- **Referral Program** - Earn bonuses by referring other couriers
- **GPS Tracking** - Automatic route tracking and proof of delivery

### For Admins
- **Dashboard Analytics** - Real-time platform metrics
- **Courier Management** - Approve, verify, and manage couriers
- **Dispute Resolution** - Handle customer complaints
- **Pricing Control** - Set and adjust pricing by region
- **Payment Processing** - Manage payouts to couriers
- **Reporting** - Generate detailed business reports

## Technology Stack

### Frontend
- **React 19** - Modern UI framework
- **Tailwind CSS 4** - Utility-first styling
- **TypeScript** - Type-safe code
- **tRPC** - End-to-end type-safe APIs
- **Wouter** - Lightweight routing
- **React Query** - Data fetching and caching

### Backend
- **Express 4** - Web framework
- **tRPC 11** - Type-safe API layer
- **Drizzle ORM** - Type-safe database access
- **MySQL/TiDB** - Primary database
- **Redis** - Caching and sessions
- **Twilio** - SMS/WhatsApp messaging

### Infrastructure
- **Node.js** - Runtime environment
- **Manus** - Hosting and authentication
- **Paystack** - Payment processing
- **Google Maps** - Location services
- **Firebase** - Push notifications

## Project Structure

```
mzansi-couriers/
├── client/                          # React frontend
│   ├── src/
│   │   ├── pages/                  # Page components
│   │   ├── components/             # Reusable components
│   │   ├── contexts/               # React contexts
│   │   ├── hooks/                  # Custom hooks
│   │   ├── lib/                    # Utilities
│   │   ├── App.tsx                 # Main app component
│   │   └── main.tsx                # Entry point
│   ├── public/                     # Static assets
│   └── index.html                  # HTML template
├── server/                          # Express backend
│   ├── routers/                    # tRPC routers
│   ├── middleware/                 # Express middleware
│   ├── db.ts                       # Database helpers
│   ├── routers.ts                  # Main router
│   └── _core/                      # Core infrastructure
├── drizzle/                        # Database schema
│   └── schema.ts                   # Drizzle schema
├── shared/                         # Shared code
│   └── const.ts                    # Constants
├── storage/                        # S3 storage helpers
├── API_DOCUMENTATION.md            # API reference
├── DEPLOYMENT_GUIDE.md             # Deployment instructions
├── TESTING_GUIDE.md                # Testing documentation
└── package.json                    # Dependencies

```

## Getting Started

### Prerequisites
- Node.js 22+
- pnpm package manager
- MySQL/TiDB database
- Manus account

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
pnpm drizzle-kit generate
pnpm run migrate

# Start development server
pnpm run dev
```

### Development

```bash
# Start dev server (runs on http://localhost:3000)
pnpm run dev

# Run tests
pnpm test

# Run linter
pnpm run lint

# Format code
pnpm run format

# Build for production
pnpm run build
```

## Core Workflows

### Customer Booking Flow
1. Customer logs in or signs up
2. Fills delivery details (pickup, dropoff, package info)
3. System calculates price based on distance and package size
4. Customer reviews and confirms
5. Selects payment method
6. Payment processed via Paystack
7. Delivery created and sent to courier network
8. Customer receives SMS/WhatsApp confirmation

### Courier Assignment Flow
1. Delivery created and available in system
2. System notifies nearby couriers via SMS/WhatsApp
3. Courier accepts delivery
4. Customer notified of courier assignment
5. Courier navigates to pickup location
6. Marks package as picked up
7. Navigates to delivery location
8. Marks package as delivered
9. Uploads proof of delivery (photo/signature)
10. Receives payment confirmation

### Payment Flow
1. Customer selects payment method
2. Payment details sent to Paystack
3. Paystack processes payment
4. Webhook confirms payment
5. Delivery activated
6. Courier completes delivery
7. Payment released to courier
8. Invoice sent to customer

## Database Schema

### Key Tables
- **users** - All platform users (customers, couriers, admins)
- **deliveries** - Delivery orders and tracking
- **ratings** - Customer ratings for couriers
- **payments** - Payment transactions
- **notifications** - User notifications
- **disputes** - Customer disputes and complaints
- **referrals** - Courier referral program
- **surge_pricing** - Dynamic pricing rules

## API Endpoints

All API endpoints are accessed via `/api/trpc/{router}.{procedure}`.

### Main Routers
- `auth.*` - Authentication and user management
- `delivery.*` - Delivery booking and tracking
- `courier.*` - Courier operations
- `pricing.*` - Price calculation
- `payments.*` - Payment processing
- `admin.*` - Admin operations
- `notifications.*` - Notification management

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

## Deployment

### Prerequisites
- Manus account
- Environment variables configured
- Database set up
- Payment processor configured

### Deployment Steps

1. **Prepare Application**
   ```bash
   pnpm install
   pnpm run build
   pnpm test
   ```

2. **Configure Environment**
   - Set all required environment variables
   - Configure database connection
   - Set up payment processor

3. **Deploy**
   - Click "Publish" in Manus Management UI
   - Configure custom domain (optional)
   - Enable SSL/TLS

4. **Verify**
   - Test critical flows
   - Monitor error logs
   - Check performance metrics

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

## Scaling for 100K+ Users

### Phase 1: Database Optimization (5K-10K users)
- Add read replicas
- Enable query caching
- Optimize indexes
- Add Redis for sessions

### Phase 2: Database Sharding (10K-50K users)
- Implement geographic sharding (9 South African provinces)
- Set up shard routing logic
- Migrate data across shards
- Test failover scenarios

### Phase 3: Serverless Architecture (50K-100K+ users)
- Convert to serverless functions
- Implement edge caching
- Set up CDN globally
- Enable auto-scaling

### Phase 4: Advanced Scaling (100K+ users)
- Implement database federation
- Set up multi-region deployment
- Configure load balancing
- Implement circuit breakers

## Testing

The project includes comprehensive testing:

- **Unit Tests** - Individual function testing
- **Integration Tests** - Component interaction testing
- **E2E Tests** - Complete workflow testing
- **Performance Tests** - Load and stress testing
- **Security Tests** - Vulnerability scanning
- **Accessibility Tests** - WCAG compliance

Run tests with:
```bash
pnpm test                    # Unit tests
pnpm test:integration       # Integration tests
pnpm test:e2e              # End-to-end tests
pnpm test:performance      # Performance tests
```

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for complete testing documentation.

## Security

The platform implements multiple security layers:

- **Authentication** - Manus OAuth with JWT sessions
- **Authorization** - Role-based access control
- **Data Protection** - HTTPS, encryption at rest
- **Input Validation** - Zod schema validation
- **SQL Injection Prevention** - Parameterized queries
- **XSS Protection** - Output encoding
- **Rate Limiting** - Per-endpoint request limits
- **CSRF Protection** - Token validation

## Performance

Performance targets for production:

| Metric | Target |
|--------|--------|
| Page Load Time | <2 seconds |
| API Response Time | <200ms |
| Database Query Time | <50ms |
| Uptime | 99.9% |
| Error Rate | <0.1% |

## Monitoring

The platform includes comprehensive monitoring:

- **Error Logging** - Centralized error tracking
- **Performance Monitoring** - Response time tracking
- **Uptime Monitoring** - Service availability
- **Database Monitoring** - Query performance
- **User Analytics** - Usage patterns

## Support

- **Documentation** - See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Deployment** - See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Testing** - See [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- **Email** - support@mzansicouriers.com

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## License

Proprietary - All rights reserved

## Roadmap

### Q3 2026
- [ ] Mobile app (iOS/Android)
- [ ] Advanced analytics dashboard
- [ ] Courier performance scoring
- [ ] Automated dispute resolution

### Q4 2026
- [ ] International expansion
- [ ] B2B corporate accounts
- [ ] Subscription pricing
- [ ] API for third-party integrations

### 2027
- [ ] Autonomous delivery
- [ ] Blockchain verification
- [ ] AI-powered routing
- [ ] Sustainability tracking

## Team

- **Founder & CEO** - Rick (PR Manager)
- **Product** - [Team member]
- **Engineering** - [Team member]
- **Operations** - [Team member]

## Acknowledgments

Built with:
- React & TypeScript
- Tailwind CSS
- tRPC
- Drizzle ORM
- Manus Platform
- Twilio
- Paystack

---

**Version:** 1.0.0  
**Last Updated:** May 27, 2026  
**Status:** Production Ready

For more information, visit [mzansicouriers.com](https://mzansicouriers.com)
