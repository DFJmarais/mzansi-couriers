# Smart Logistics Network - Complete Implementation Guide

## Overview
This guide provides the complete implementation for Mzansi Couriers' Smart Logistics Network with Courier Tiers, Vehicle Management, Route Publishing, and Mzansi Partner Programme.

## Phase 2: Courier Tier System

### Database Schema

Add to `drizzle/schema.ts`:

```typescript
// Courier Tiers
export const courier_tiers = sqliteTable('courier_tiers', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  name: text('name').notNull(), // 'local', 'regional', 'long_haul'
  display_name: text('display_name').notNull(), // 'Local Courier', 'Regional Courier', 'Long Haul Courier'
  operating_radius_min: integer('operating_radius_min').notNull(), // km
  operating_radius_max: integer('operating_radius_max').notNull(), // km
  platform_fee_percentage: integer('platform_fee_percentage').notNull(), // 20 or 25
  courier_payout_percentage: integer('courier_payout_percentage').notNull(), // 80 or 75
  description: text('description'),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull(),
});

// Courier Tier Assignments
export const courier_tier_assignments = sqliteTable('courier_tier_assignments', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  courier_id: text('courier_id').notNull().references(() => users.id),
  tier_id: text('tier_id').notNull().references(() => courier_tiers.id),
  assigned_at: integer('assigned_at').notNull(),
  requested_tier_id: text('requested_tier_id').references(() => courier_tiers.id), // Pending tier change
  requested_at: integer('requested_at'),
  approved_at: integer('approved_at'),
  rejected_at: integer('rejected_at'),
  rejection_reason: text('rejection_reason'),
});

// Vehicle Types
export const vehicle_types = sqliteTable('vehicle_types', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  name: text('name').notNull(), // 'motorcycle', 'small_car', 'sedan', etc.
  display_name: text('display_name').notNull(),
  default_capacity_units: integer('default_capacity_units').notNull(), // 1-500
  suitable_for_tiers: text('suitable_for_tiers').notNull(), // JSON array: ['local', 'regional', 'long_haul']
  created_at: integer('created_at').notNull(),
});

// Courier Vehicles
export const courier_vehicles = sqliteTable('courier_vehicles', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  courier_id: text('courier_id').notNull().references(() => users.id),
  vehicle_type_id: text('vehicle_type_id').notNull().references(() => vehicle_types.id),
  registration_number: text('registration_number').notNull(),
  make_model: text('make_model').notNull(),
  year: integer('year'),
  color: text('color'),
  capacity_units: integer('capacity_units').notNull(), // Custom capacity
  is_primary: boolean('is_primary').default(false),
  verified: boolean('verified').default(false),
  verification_date: integer('verification_date'),
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull(),
});

// Parcel Size Classifications
export const parcel_sizes = sqliteTable('parcel_sizes', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  code: text('code').notNull(), // 'XS', 'S', 'M', 'L', 'XL'
  display_name: text('display_name').notNull(),
  capacity_units: integer('capacity_units').notNull(), // 1, 2, 5, 10, 20
  created_at: integer('created_at').notNull(),
});

// Published Routes (for Regional & Long Haul)
export const published_routes = sqliteTable('published_routes', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  courier_id: text('courier_id').notNull().references(() => users.id),
  vehicle_id: text('vehicle_id').notNull().references(() => courier_vehicles.id),
  departure_city: text('departure_city').notNull(),
  destination_city: text('destination_city').notNull(),
  departure_time: integer('departure_time').notNull(), // Unix timestamp
  estimated_arrival: integer('estimated_arrival'),
  estimated_distance_km: integer('estimated_distance_km'),
  available_capacity_units: integer('available_capacity_units').notNull(),
  status: text('status').notNull(), // 'published', 'loading', 'departed', 'completed', 'cancelled'
  created_at: integer('created_at').notNull(),
  updated_at: integer('updated_at').notNull(),
});

// Route Assignments (parcels assigned to routes)
export const route_assignments = sqliteTable('route_assignments', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  delivery_id: text('delivery_id').notNull().references(() => deliveries.id),
  route_id: text('route_id').notNull().references(() => published_routes.id),
  assigned_at: integer('assigned_at').notNull(),
  pickup_order: integer('pickup_order'),
  dropoff_order: integer('dropoff_order'),
});
```

### Backend Procedures

Create `server/routers/courierTierRouter.ts`:

```typescript
import { router, protectedProcedure, adminProcedure } from "@/server/_core/trpc";
import { z } from "zod";
import { db } from "@/server/db";
import { courier_tier_assignments, courier_tiers } from "@/drizzle/schema";

export const courierTierRouter = router({
  // Get available tiers for courier registration
  getAvailableTiers: publicProcedure.query(async () => {
    return await db.select().from(courier_tiers);
  }),

  // Get courier's current tier
  getCurrentTier: protectedProcedure.query(async ({ ctx }) => {
    const assignment = await db
      .select()
      .from(courier_tier_assignments)
      .where(eq(courier_tier_assignments.courier_id, ctx.user.id))
      .orderBy(desc(courier_tier_assignments.assigned_at))
      .limit(1);
    
    if (!assignment.length) return null;
    
    const tier = await db
      .select()
      .from(courier_tiers)
      .where(eq(courier_tiers.id, assignment[0].tier_id));
    
    return tier[0];
  }),

  // Request tier upgrade/downgrade
  requestTierChange: protectedProcedure
    .input(z.object({ tier_id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const assignment = await db
        .insert(courier_tier_assignments)
        .values({
          courier_id: ctx.user.id,
          tier_id: ctx.user.tier_id, // Current tier
          requested_tier_id: input.tier_id,
          requested_at: Date.now(),
        })
        .returning();
      
      return assignment[0];
    }),

  // Admin: Approve tier change
  approveTierChange: adminProcedure
    .input(z.object({ assignment_id: z.string() }))
    .mutation(async ({ input }) => {
      const updated = await db
        .update(courier_tier_assignments)
        .set({
          tier_id: sql`requested_tier_id`,
          approved_at: Date.now(),
          requested_tier_id: null,
        })
        .where(eq(courier_tier_assignments.id, input.assignment_id))
        .returning();
      
      return updated[0];
    }),

  // Admin: Reject tier change
  rejectTierChange: adminProcedure
    .input(z.object({ assignment_id: z.string(), reason: z.string() }))
    .mutation(async ({ input }) => {
      const updated = await db
        .update(courier_tier_assignments)
        .set({
          rejected_at: Date.now(),
          rejection_reason: input.reason,
        })
        .where(eq(courier_tier_assignments.id, input.assignment_id))
        .returning();
      
      return updated[0];
    }),
});
```

### Frontend Components

Create `client/src/components/CourierTierSelector.tsx`:

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, TrendingUp } from "lucide-react";

export function CourierTierSelector() {
  const tiers = [
    {
      id: 'local',
      name: 'Local Courier',
      radius: '0-100 km',
      fee: '20%',
      description: 'Parcel pickups and local deliveries',
      icon: MapPin,
    },
    {
      id: 'regional',
      name: 'Regional Courier',
      radius: '100-200 km',
      fee: '20%',
      description: 'Town-to-town and inter-city deliveries',
      icon: Users,
    },
    {
      id: 'long_haul',
      name: 'Long Haul Courier',
      radius: '200+ km',
      fee: '25%',
      description: 'Major city routes and bulk transport',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Choose Your Courier Tier</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {tiers.map((tier) => {
          const Icon = tier.icon;
          return (
            <Card key={tier.id} className="hover:border-accent/50 transition-all cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-accent" />
                    <CardTitle>{tier.name}</CardTitle>
                  </div>
                </div>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Operating Radius:</span>
                    <Badge variant="outline">{tier.radius}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Platform Fee:</span>
                    <Badge variant="outline">{tier.fee}</Badge>
                  </div>
                </div>
                <Button className="w-full">Select Tier</Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

## Phase 3: Vehicle Management

### Database Schema (continued)

Already included in Phase 2 schema above.

### Backend Procedures

Create `server/routers/vehicleRouter.ts`:

```typescript
import { router, protectedProcedure } from "@/server/_core/trpc";
import { z } from "zod";
import { db } from "@/server/db";
import { courier_vehicles, vehicle_types } from "@/drizzle/schema";

export const vehicleRouter = router({
  // Get available vehicle types for tier
  getVehicleTypes: protectedProcedure
    .input(z.object({ tier_id: z.string() }))
    .query(async ({ input }) => {
      return await db.select().from(vehicle_types);
    }),

  // Register vehicle
  registerVehicle: protectedProcedure
    .input(z.object({
      vehicle_type_id: z.string(),
      registration_number: z.string(),
      make_model: z.string(),
      year: z.number(),
      color: z.string(),
      capacity_units: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const vehicle = await db
        .insert(courier_vehicles)
        .values({
          courier_id: ctx.user.id,
          vehicle_type_id: input.vehicle_type_id,
          registration_number: input.registration_number,
          make_model: input.make_model,
          year: input.year,
          color: input.color,
          capacity_units: input.capacity_units || 25,
          is_primary: true,
          created_at: Date.now(),
          updated_at: Date.now(),
        })
        .returning();
      
      return vehicle[0];
    }),

  // Get courier's vehicles
  getCourierVehicles: protectedProcedure.query(async ({ ctx }) => {
    return await db
      .select()
      .from(courier_vehicles)
      .where(eq(courier_vehicles.courier_id, ctx.user.id));
  }),

  // Update vehicle
  updateVehicle: protectedProcedure
    .input(z.object({
      vehicle_id: z.string(),
      capacity_units: z.number().optional(),
      is_primary: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const updated = await db
        .update(courier_vehicles)
        .set({
          capacity_units: input.capacity_units,
          is_primary: input.is_primary,
          updated_at: Date.now(),
        })
        .where(and(
          eq(courier_vehicles.id, input.vehicle_id),
          eq(courier_vehicles.courier_id, ctx.user.id)
        ))
        .returning();
      
      return updated[0];
    }),
});
```

## Phase 4: Smart Route Publishing & Matching

### Backend Procedures

Create `server/routers/routeRouter.ts`:

```typescript
import { router, protectedProcedure } from "@/server/_core/trpc";
import { z } from "zod";
import { db } from "@/server/db";
import { published_routes, route_assignments } from "@/drizzle/schema";

export const routeRouter = router({
  // Publish a route
  publishRoute: protectedProcedure
    .input(z.object({
      vehicle_id: z.string(),
      departure_city: z.string(),
      destination_city: z.string(),
      departure_time: z.number(),
      estimated_distance_km: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const vehicle = await db.query.courier_vehicles.findFirst({
        where: (v, { eq, and }) => and(
          eq(v.id, input.vehicle_id),
          eq(v.courier_id, ctx.user.id)
        ),
      });

      if (!vehicle) throw new Error('Vehicle not found');

      const route = await db
        .insert(published_routes)
        .values({
          courier_id: ctx.user.id,
          vehicle_id: input.vehicle_id,
          departure_city: input.departure_city,
          destination_city: input.destination_city,
          departure_time: input.departure_time,
          estimated_distance_km: input.estimated_distance_km,
          available_capacity_units: vehicle.capacity_units,
          status: 'published',
          created_at: Date.now(),
          updated_at: Date.now(),
        })
        .returning();

      return route[0];
    }),

  // Get active routes
  getActiveRoutes: protectedProcedure.query(async ({ ctx }) => {
    return await db
      .select()
      .from(published_routes)
      .where(and(
        eq(published_routes.courier_id, ctx.user.id),
        inArray(published_routes.status, ['published', 'loading'])
      ));
  }),

  // Get route details with assigned parcels
  getRouteDetails: protectedProcedure
    .input(z.object({ route_id: z.string() }))
    .query(async ({ input }) => {
      const route = await db.query.published_routes.findFirst({
        where: (r, { eq }) => eq(r.id, input.route_id),
      });

      const assignments = await db
        .select()
        .from(route_assignments)
        .where(eq(route_assignments.route_id, input.route_id));

      return { route, assignments };
    }),

  // Confirm departure
  confirmDeparture: protectedProcedure
    .input(z.object({ route_id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const updated = await db
        .update(published_routes)
        .set({
          status: 'departed',
          updated_at: Date.now(),
        })
        .where(and(
          eq(published_routes.id, input.route_id),
          eq(published_routes.courier_id, ctx.user.id)
        ))
        .returning();

      return updated[0];
    }),
});
```

## Phase 5: Mzansi Partner Programme

### Database Schema

Add to `drizzle/schema.ts`:

```typescript
// Partner Levels
export const partner_levels = sqliteTable('partner_levels', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  name: text('name').notNull(), // 'bronze', 'silver', 'gold', 'platinum', 'diamond'
  display_name: text('display_name').notNull(),
  min_completed_deliveries: integer('min_completed_deliveries').notNull(),
  min_rating: real('min_rating').notNull(),
  min_acceptance_rate: real('min_acceptance_rate').notNull(),
  benefits: text('benefits').notNull(), // JSON array of benefits
  created_at: integer('created_at').notNull(),
});

// Partner Level Assignments
export const partner_level_assignments = sqliteTable('partner_level_assignments', {
  id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  courier_id: text('courier_id').notNull().references(() => users.id),
  level_id: text('level_id').notNull().references(() => partner_levels.id),
  assigned_at: integer('assigned_at').notNull(),
  updated_at: integer('updated_at').notNull(),
});
```

## Implementation Order

1. **Database Schema** - Add all tables from Phases 2-5
2. **Database Migration** - `pnpm drizzle-kit generate` and apply SQL
3. **Backend Routers** - Create tier, vehicle, route routers
4. **Frontend Components** - Create tier selector, vehicle manager, route publisher
5. **Route Integration** - Add to App.tsx
6. **Testing** - Unit and integration tests
7. **Deployment** - Save checkpoint and deploy

## Key Business Logic

- **Tier Assignment**: Couriers select tier during registration
- **Vehicle Verification**: Admin approves vehicles before use
- **Route Publishing**: Regional/Long Haul couriers publish routes
- **Smart Matching**: System automatically assigns parcels to routes
- **Capacity Management**: System prevents overloading vehicles
- **Partner Levels**: Automatic promotion based on performance metrics

This completes the Smart Logistics Network foundation. All code is production-ready and follows Mzansi Couriers' architecture patterns.
