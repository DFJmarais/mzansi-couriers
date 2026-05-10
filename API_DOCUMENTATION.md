# Mzansi Couriers - API Documentation

## Overview

Mzansi Couriers uses **tRPC** for end-to-end type-safe API communication. All procedures are defined in `server/routers.ts` and consumed via `trpc.*` hooks on the frontend.

## Authentication

All protected routes require Manus OAuth authentication. The system automatically handles:
- OAuth callback at `/api/oauth/callback`
- Session cookie management
- User context injection via `ctx.user`

### Public Procedures
- `auth.login` - Get login URL
- `auth.getLoginUrl` - Get Manus OAuth portal URL

### Protected Procedures
- `auth.me` - Get current authenticated user
- `auth.logout` - Logout and clear session

## Core API Procedures

### Authentication Router (`auth.*`)

#### `auth.me` (Query)
Get current authenticated user information.

**Returns:**
```typescript
{
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
}
```

#### `auth.logout` (Mutation)
Logout current user and clear session.

**Returns:** `{ success: boolean }`

#### `auth.getLoginUrl` (Query)
Get Manus OAuth login portal URL.

**Input:**
```typescript
{
  returnPath?: string;  // Optional path to redirect after login
}
```

**Returns:** `{ loginUrl: string }`

### Customer Router (`customer.*`)

#### `customer.bookDelivery` (Mutation)
Book a new delivery as a customer.

**Input:**
```typescript
{
  pickupAddress: string;
  dropoffAddress: string;
  packageDescription: string;
  estimatedWeight: number;  // in kg
  zone: 'johannesburg' | 'capetown' | 'durban' | 'pretoria';
}
```

**Returns:**
```typescript
{
  id: string;
  status: 'pending' | 'accepted' | 'in_transit' | 'delivered';
  estimatedPrice: number;  // in Rand
  createdAt: Date;
}
```

#### `customer.getDeliveries` (Query)
Get all deliveries for current customer.

**Returns:**
```typescript
Array<{
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  status: string;
  estimatedPrice: number;
  actualPrice?: number;
  courier?: { name: string; rating: number };
  createdAt: Date;
}>
```

#### `customer.trackDelivery` (Query)
Track a specific delivery in real-time.

**Input:**
```typescript
{
  deliveryId: string;
}
```

**Returns:**
```typescript
{
  id: string;
  status: 'pending' | 'accepted' | 'in_transit' | 'delivered';
  currentLocation?: { lat: number; lng: number };
  estimatedArrival?: Date;
  courier: { name: string; phone: string; rating: number };
}
```

### Courier Router (`courier.*`)

#### `courier.getAvailableJobs` (Query)
Get list of available delivery jobs for courier.

**Input:**
```typescript
{
  zone: string;
  limit?: number;  // Default: 20
}
```

**Returns:**
```typescript
Array<{
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  estimatedPrice: number;
  distance: number;  // in km
  customer: { name: string; rating: number };
  createdAt: Date;
}>
```

#### `courier.acceptJob` (Mutation)
Accept a delivery job.

**Input:**
```typescript
{
  jobId: string;
}
```

**Returns:**
```typescript
{
  id: string;
  status: 'accepted';
  pickupAddress: string;
  dropoffAddress: string;
  price: number;
}
```

#### `courier.updateJobStatus` (Mutation)
Update delivery job status.

**Input:**
```typescript
{
  jobId: string;
  status: 'picked_up' | 'in_transit' | 'delivered';
  location?: { lat: number; lng: number };
}
```

**Returns:** `{ success: boolean; status: string }`

#### `courier.getEarnings` (Query)
Get courier earnings summary.

**Returns:**
```typescript
{
  totalEarnings: number;
  completedDeliveries: number;
  averageRating: number;
  thisMonth: number;
  thisWeek: number;
}
```

### Admin Router (`admin.*`)

#### `admin.getDashboardMetrics` (Query)
Get platform-wide metrics for admin dashboard.

**Returns:**
```typescript
{
  totalDeliveries: number;
  activeDeliveries: number;
  totalCouriers: number;
  totalCustomers: number;
  platformRevenue: number;
  averageRating: number;
}
```

#### `admin.getAllDeliveries` (Query)
Get all deliveries on the platform with filtering.

**Input:**
```typescript
{
  status?: string;
  zone?: string;
  limit?: number;
  offset?: number;
}
```

**Returns:**
```typescript
Array<{
  id: string;
  customer: { name: string; email: string };
  courier?: { name: string; email: string };
  status: string;
  price: number;
  createdAt: Date;
}>
```

#### `admin.manageCourier` (Mutation)
Manage courier account (suspend, verify, etc).

**Input:**
```typescript
{
  courierId: string;
  action: 'verify' | 'suspend' | 'activate';
}
```

**Returns:** `{ success: boolean; message: string }`

### System Router (`system.*`)

#### `system.notifyOwner` (Mutation)
Send notification to app owner.

**Input:**
```typescript
{
  title: string;
  content: string;
}
```

**Returns:** `{ success: boolean }`

## Regional Pricing

Pricing varies by delivery zone:

| Zone | Region | Base Rate | Notes |
|------|--------|-----------|-------|
| Johannesburg | Gauteng | R2.50/km | Busiest zone |
| Cape Town | Western Cape | R2.75/km | Longer distances |
| Durban | KwaZulu-Natal | R2.50/km | Coastal routes |
| Pretoria | Gauteng | R2.50/km | Government hub |

## Payment Methods

Supported payment methods for customers:
- EFT Transfer (Standard Bank, FNB, Capitec)
- Capitec Bank Direct
- Debit/Credit Card
- Mzansi Wallet (in-app balance)

## Notifications

Notification system supports:
- **In-App**: Real-time notifications in dashboard
- **SMS**: Text message updates (fallback for low-data users)
- **WhatsApp**: WhatsApp Business API integration (framework ready)

## Error Handling

All procedures return typed errors via tRPC:

```typescript
{
  code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'BAD_REQUEST' | 'INTERNAL_SERVER_ERROR';
  message: string;
}
```

## Rate Limiting

- Public endpoints: 100 requests/minute per IP
- Authenticated endpoints: 1000 requests/minute per user
- Admin endpoints: 500 requests/minute per admin

## Deployment Endpoints

- **Production**: https://mzansicourier-nsebzqbt.manus.space
- **API Base**: /api/trpc
- **OAuth Callback**: /api/oauth/callback

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Deliveries Table
```sql
CREATE TABLE deliveries (
  id VARCHAR(36) PRIMARY KEY,
  customerId VARCHAR(36) NOT NULL,
  courierId VARCHAR(36),
  pickupAddress TEXT NOT NULL,
  dropoffAddress TEXT NOT NULL,
  status ENUM('pending', 'accepted', 'in_transit', 'delivered') DEFAULT 'pending',
  estimatedPrice DECIMAL(10, 2),
  actualPrice DECIMAL(10, 2),
  zone VARCHAR(50) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customerId) REFERENCES users(id),
  FOREIGN KEY (courierId) REFERENCES users(id)
);
```

## Version

- API Version: 1.0.0
- Last Updated: May 10, 2026
- Status: Production Ready
