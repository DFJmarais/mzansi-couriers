# Fleet Partner & Courier Services Integration Architecture

## Overview

The Fleet Partner system is fully integrated with your existing courier services. Customers can use **both** individual couriers AND fleet couriers interchangeably. The system intelligently routes deliveries to the best available service provider.

## Integration Model

### 1. Unified Delivery Marketplace

```
Customer Booking
    ↓
Delivery Request
    ↓
┌─────────────────────────────────────┐
│   Smart Dispatch Algorithm          │
│  (Evaluates all available options)  │
└─────────────────────────────────────┘
    ↓
    ├─→ Individual Couriers
    │   (Existing system)
    │
    ├─→ Fleet Couriers
    │   (New Fleet Partner system)
    │
    └─→ Relay Network
        (Multi-leg deliveries)
```

### 2. Service Provider Types

#### A. Individual Couriers (Existing)
- Single person with vehicle
- Direct customer assignment
- Real-time tracking
- Flexible availability

#### B. Fleet Couriers (New)
- Fleet partner with multiple vehicles
- Multiple drivers
- Higher capacity
- Scheduled operations
- Better for bulk/recurring deliveries

#### C. Hybrid Mode (New)
- Fleet can accept individual courier jobs
- Individual couriers can work with fleets
- Flexible partnerships

## Database Integration

### New Tables Added

```sql
-- Links fleet to delivery system
fleet_delivery_assignments
├── fleet_id (FK to fleet_accounts)
├── delivery_id (FK to deliveries)
├── assigned_vehicle_id (FK to fleet_vehicles)
├── assigned_driver_id (FK to fleet_drivers)
├── status (pending, accepted, picked_up, delivered)
└── timestamps

-- Tracks fleet availability
fleet_vehicle_availability
├── vehicle_id (FK to fleet_vehicles)
├── date
├── available_slots
├── current_utilization
└── status

-- Fleet performance vs individual couriers
delivery_provider_comparison
├── delivery_id
├── provider_type (individual | fleet)
├── provider_id
├── estimated_time
├── actual_time
├── cost
├── customer_rating
```

## Delivery Routing Logic

### Smart Dispatch Algorithm

When a customer books a delivery, the system evaluates:

```typescript
interface DeliveryOption {
  providerId: string;
  providerType: 'individual' | 'fleet';
  estimatedTime: number;
  cost: number;
  reliability: number; // 0-100
  capacity: number;
  availability: boolean;
  trustScore: number;
}

// Scoring function
score = (
  (100 - estimatedTime) * 0.3 +      // 30% speed
  (100 - cost) * 0.2 +                // 20% cost
  reliability * 0.3 +                 // 30% reliability
  trustScore * 0.2                    // 20% trust
);

// Best option is selected
bestOption = options.sort((a, b) => b.score - a.score)[0];
```

### Decision Factors

1. **Location Match**
   - Individual courier: Closest to pickup
   - Fleet: Operating in that province/zone

2. **Capacity**
   - Individual: Single parcel/small batch
   - Fleet: Bulk deliveries, recurring orders

3. **Time Window**
   - Individual: ASAP, flexible
   - Fleet: Scheduled, fixed routes

4. **Cost Optimization**
   - Individual: Higher per-delivery cost
   - Fleet: Better bulk rates

5. **Reliability**
   - Individual: Trust score (0-5)
   - Fleet: Fleet trust score + driver rating

## API Integration Points

### 1. Delivery Booking (Existing)

```typescript
// Customer books delivery
POST /api/trpc/deliveries.create
{
  pickupAddress: "...",
  dropoffAddress: "...",
  parcelWeight: 2,
  parcelSize: "small",
  urgency: "standard"
}

// Response includes available providers
{
  estimatedCost: 150,
  estimatedTime: 45,
  availableProviders: [
    {
      id: "courier_123",
      type: "individual",
      name: "John Doe",
      rating: 4.8,
      eta: 35
    },
    {
      id: "fleet_456",
      type: "fleet",
      name: "ABC Logistics",
      rating: 4.9,
      eta: 42
    }
  ]
}
```

### 2. Provider Selection

```typescript
// Customer selects provider
POST /api/trpc/deliveries.selectProvider
{
  deliveryId: "DEL123",
  providerId: "fleet_456",
  providerType: "fleet"
}

// System assigns to specific vehicle/driver
{
  success: true,
  assignedVehicle: "GP 23 ABC",
  assignedDriver: "Jane Smith",
  trackingUrl: "https://mzansicourier.com/track/DEL123"
}
```

### 3. Real-time Tracking (Unified)

```typescript
// Works for both individual couriers and fleet
GET /api/trpc/deliveries.track
{
  deliveryId: "DEL123"
}

// Response
{
  status: "in_transit",
  currentLocation: {
    latitude: -25.7461,
    longitude: 28.2313
  },
  provider: {
    type: "fleet",
    name: "ABC Logistics",
    vehicle: "GP 23 ABC",
    driver: "Jane Smith",
    phone: "0712345678"
  },
  eta: "14:30",
  trackingHistory: [...]
}
```

## Workflow Examples

### Scenario 1: Individual Courier Delivery

```
1. Customer books delivery
2. System finds nearest individual courier
3. Courier accepts job
4. Real-time tracking via GPS
5. Delivery completed
6. Payment to individual courier
```

### Scenario 2: Fleet Delivery

```
1. Customer books delivery
2. System finds fleet in service area
3. Fleet accepts via command centre
4. AI dispatch assigns to optimal vehicle/driver
5. Real-time tracking via fleet GPS
6. Delivery completed
7. Payment to fleet (minus commission)
```

### Scenario 3: Hybrid - Fleet Accepts Individual Courier Job

```
1. Individual courier unavailable
2. Fleet in same area accepts job
3. Fleet assigns one vehicle/driver
4. Operates as single courier
5. Delivery completed
6. Fleet earns commission on job
```

### Scenario 4: Individual Courier Works with Fleet

```
1. Fleet partner has surge in deliveries
2. Offers jobs to nearby individual couriers
3. Individual courier accepts fleet job
4. Works under fleet coordination
5. Delivery completed
6. Individual courier paid, fleet takes commission
```

## Customer Experience

### Booking Page - Provider Selection

```
┌─────────────────────────────────────┐
│  Available Delivery Options         │
├─────────────────────────────────────┤
│                                     │
│  Option 1: Individual Courier       │
│  John Doe • Rating: 4.8 ⭐         │
│  ETA: 35 min • Cost: R150          │
│  [Select]                          │
│                                     │
│  Option 2: Fleet Partner            │
│  ABC Logistics • Rating: 4.9 ⭐    │
│  ETA: 42 min • Cost: R145          │
│  [Select]                          │
│                                     │
│  Option 3: Relay Network            │
│  Multi-leg • Rating: 4.7 ⭐        │
│  ETA: 2 hours • Cost: R120         │
│  [Select]                          │
│                                     │
└─────────────────────────────────────┘
```

### Tracking Page - Unified

```
┌─────────────────────────────────────┐
│  Track Your Delivery                │
├─────────────────────────────────────┤
│                                     │
│  Status: In Transit                 │
│  Provider: ABC Logistics (Fleet)    │
│  Vehicle: GP 23 ABC                 │
│  Driver: Jane Smith                 │
│  Phone: 0712345678                  │
│                                     │
│  [Live Map]                         │
│                                     │
│  ETA: 14:30 (8 min away)           │
│                                     │
└─────────────────────────────────────┘
```

## Fleet Dashboard Integration

### Fleet Command Centre Shows All Jobs

```
Fleet Dashboard
├── Active Deliveries
│   ├── Individual courier jobs assigned to fleet
│   ├── Fleet-specific jobs
│   └── Relay network jobs
├── Available Jobs
│   ├── Jobs from individual couriers
│   ├── Surge pricing opportunities
│   └── Recommended assignments
└── Analytics
    ├── Fleet performance vs individual couriers
    ├── Market share in zones
    └── Revenue comparison
```

## Pricing Integration

### Dynamic Pricing Model

```
Base Delivery Cost = R75 (pickup) + R40-50 (per relay leg) + Surcharges

Provider Selection Impact:
├── Individual Courier
│   ├── Commission: 15-20%
│   └── Customer pays: Full price
│
├── Fleet Courier
│   ├── Commission: 10-15% (volume discount)
│   └── Customer pays: 5-10% less (bulk incentive)
│
└── Relay Network
    ├── Commission: 12-18% per leg
    └── Customer pays: 15-20% less (multi-leg discount)
```

## Courier Earnings Integration

### Individual Courier Earnings

```
Delivery Price: R150
Commission: 15% = R22.50
Courier Earns: R127.50
```

### Fleet Earnings

```
Delivery Price: R150
Fleet Commission: 12% = R18
Fleet Earns: R132
├── Driver Payment: R80
├── Vehicle Costs: R30
└── Fleet Profit: R22
```

### Hybrid Earnings

```
Individual Courier accepts Fleet Job:
├── Delivery Price: R150
├── Fleet Commission: 12% = R18
├── Courier Earns: R132 (better rate for working with fleet)
└── Fleet Profit: R0 (pass-through)
```

## Notifications Integration

### Unified Notification System

```
Individual Courier Notifications:
├── New delivery available
├── Delivery accepted
├── Customer contacted
└── Delivery completed

Fleet Notifications:
├── New fleet job available
├── Individual courier job available
├── Vehicle/driver assignment
├── Delivery status updates
└── Performance alerts

Customer Notifications:
├── Delivery confirmed
├── Provider assigned
├── In transit
├── Delivery completed
└── Rating request
```

## Analytics Integration

### Dashboard Metrics

```
Overall Delivery Metrics:
├── Total Deliveries (Individual + Fleet)
├── Average Delivery Time
├── Customer Satisfaction
├── Cost Per Delivery
└── Provider Mix (% Individual vs Fleet)

Provider Comparison:
├── Individual Courier Performance
│   ├── Avg Time: 45 min
│   ├── Rating: 4.7
│   └── Cost: R150
│
└── Fleet Performance
    ├── Avg Time: 42 min
    ├── Rating: 4.8
    └── Cost: R145
```

## Implementation Checklist

- [x] Fleet database schema created
- [x] Fleet tRPC procedures implemented
- [x] Fleet UI components built
- [x] Fleet routing added to app
- [ ] **NEW: Delivery assignment integration**
- [ ] **NEW: Smart dispatch algorithm**
- [ ] **NEW: Provider selection UI**
- [ ] **NEW: Unified tracking system**
- [ ] **NEW: Hybrid earnings system**
- [ ] **NEW: Analytics dashboard**
- [ ] **NEW: Notification integration**
- [ ] **NEW: Testing & QA**

## Benefits of Integration

### For Customers
- More delivery options
- Better pricing (fleet bulk discounts)
- Faster deliveries (fleet optimization)
- Better reliability (fleet backup)
- Transparent provider selection

### For Individual Couriers
- Access to fleet jobs during surge
- Partnership opportunities
- Stable income with fleet work
- Competition drives quality

### For Fleet Partners
- Access to all customer deliveries
- Individual courier job opportunities
- Hybrid revenue models
- Market expansion

### For Mzansi Couriers
- Increased market coverage
- Better service reliability
- Higher customer satisfaction
- Competitive advantage
- Revenue diversification

## Next Steps

1. **Create delivery assignment layer** - Link fleet to delivery system
2. **Implement smart dispatch algorithm** - Evaluate all providers
3. **Build provider selection UI** - Customer chooses provider
4. **Integrate tracking** - Unified tracking for all providers
5. **Update pricing** - Fleet-specific rates
6. **Test workflows** - End-to-end integration testing
7. **Deploy** - Roll out to production

## Security & Compliance

- All fleet drivers verified before assignment
- Customer data protected
- Payment processing secure
- POPIA compliance maintained
- Audit logging for all assignments
- Dispute resolution system

## Conclusion

The Fleet Partner system is designed as a **complementary service** to your existing courier network, not a replacement. Customers benefit from choice, couriers benefit from opportunities, and Mzansi Couriers benefits from a more robust, scalable delivery network.

The integration is seamless - customers don't need to know if their delivery is handled by an individual courier or a fleet. They just get their package delivered reliably and on time.
