# Free Address Search Implementation Plan

## Overview

This document outlines the step-by-step implementation of a zero-cost address search system using Photon + Nominatim APIs for the first 6 months.

---

## Phase 1: Database Schema Updates

### New Tables to Create

```sql
-- Address Cache (global, for frequently searched addresses)
CREATE TABLE address_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  query_text VARCHAR(255) UNIQUE NOT NULL,
  full_address VARCHAR(500) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  province VARCHAR(50),
  city VARCHAR(100),
  suburb VARCHAR(100),
  postal_code VARCHAR(10),
  address_type VARCHAR(50), -- formal, informal, estate, complex
  confidence DECIMAL(3, 2),
  source VARCHAR(20), -- photon, nominatim
  usage_count INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  INDEX idx_query_text (query_text),
  INDEX idx_expires_at (expires_at)
);

-- Recent Searches (user-specific)
CREATE TABLE recent_searches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  address_text VARCHAR(500) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  search_type VARCHAR(20), -- pickup, dropoff
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);

-- Route Cache (for frequently used routes)
CREATE TABLE route_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  origin_lat DECIMAL(10, 8) NOT NULL,
  origin_lng DECIMAL(11, 8) NOT NULL,
  dest_lat DECIMAL(10, 8) NOT NULL,
  dest_lng DECIMAL(11, 8) NOT NULL,
  distance_km DECIMAL(8, 2) NOT NULL,
  duration_minutes INT,
  source VARCHAR(20), -- haversine, osrm, google
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  UNIQUE KEY unique_route (origin_lat, origin_lng, dest_lat, dest_lng),
  INDEX idx_expires_at (expires_at)
);
```

---

## Phase 2: Backend Services

### 2.1 Geocoding Service (server/services/geocoding.ts)

```typescript
// Photon API (primary) - 200-400ms
// Nominatim API (fallback) - 1-2s
// Local cache (< 10ms)

export interface GeocodeResult {
  address: string;
  latitude: number;
  longitude: number;
  province?: string;
  city?: string;
  suburb?: string;
  postalCode?: string;
  confidence: number;
  source: 'photon' | 'nominatim' | 'cache';
}

export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  // 1. Check local cache first
  const cached = await checkAddressCache(query);
  if (cached) return cached;

  // 2. Try Photon API (fast)
  const photonResult = await tryPhoton(query);
  if (photonResult) {
    await cacheResult(photonResult);
    return photonResult;
  }

  // 3. Fallback to Nominatim (slower but reliable)
  const nominatimResult = await tryNominatim(query);
  if (nominatimResult) {
    await cacheResult(nominatimResult);
    return nominatimResult;
  }

  return null;
}

async function tryPhoton(query: string): Promise<GeocodeResult | null> {
  // https://photon.komoot.io/api/
  // Free, 200-400ms, good for informal addresses
}

async function tryNominatim(query: string): Promise<GeocodeResult | null> {
  // https://nominatim.openstreetmap.org/search
  // Free, 1-2s, reliable fallback
}
```

### 2.2 Route Service (server/services/routing.ts)

```typescript
// Haversine formula (instant, < 5ms)
// OSRM API (free, 200-400ms) - optional
// Local cache (< 10ms)

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  source: 'haversine' | 'osrm' | 'cache';
}

export async function calculateRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<RouteResult> {
  // 1. Check route cache
  const cached = await checkRouteCache(originLat, originLng, destLat, destLng);
  if (cached) return cached;

  // 2. Try OSRM API (free, accurate)
  const osrmResult = await tryOSRM(originLat, originLng, destLat, destLng);
  if (osrmResult) {
    await cacheRoute(osrmResult);
    return osrmResult;
  }

  // 3. Fallback to Haversine (instant, less accurate)
  const haversineResult = calculateHaversine(
    originLat, originLng, destLat, destLng
  );
  return haversineResult;
}

function calculateHaversine(
  lat1: number, lng1: number, lat2: number, lng2: number
): RouteResult {
  // Instant calculation, accurate within 5-10%
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  // Rough estimate: 50km/hour average
  const duration = Math.round((distance / 50) * 60);
  
  return {
    distanceKm: Math.round(distance * 100) / 100,
    durationMinutes: duration,
    source: 'haversine'
  };
}

async function tryOSRM(
  lat1: number, lng1: number, lat2: number, lng2: number
): Promise<RouteResult | null> {
  // https://router.project-osrm.org/route/v1/driving/
  // Free, 200-400ms, accurate
}
```

### 2.3 Address Parser (server/services/addressParser.ts)

```typescript
// Parse South African addresses
// Handle estates, complexes, townships, informal addresses

export interface ParsedAddress {
  street?: string;
  suburb?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  addressType: 'formal' | 'informal' | 'estate' | 'complex' | 'township';
}

export function parseAddress(text: string): ParsedAddress {
  // 1. Detect address type
  const addressType = detectAddressType(text);

  // 2. Extract components based on type
  if (addressType === 'estate') {
    return parseEstateAddress(text);
  } else if (addressType === 'complex') {
    return parseComplexAddress(text);
  } else if (addressType === 'township') {
    return parseTownshipAddress(text);
  } else if (addressType === 'informal') {
    return parseInformalAddress(text);
  } else {
    return parseFormalAddress(text);
  }
}

function detectAddressType(text: string): string {
  const lower = text.toLowerCase();
  
  if (lower.includes('estate') || lower.includes('plot')) return 'estate';
  if (lower.includes('unit') || lower.includes('apt') || lower.includes('complex')) return 'complex';
  if (lower.includes('township') || lower.includes('soweto') || lower.includes('khayelitsha')) return 'township';
  if (lower.includes('near') || lower.includes('opposite') || lower.includes('next to')) return 'informal';
  
  return 'formal';
}
```

---

## Phase 3: Frontend Components

### 3.1 Updated AddressSelector Component

```typescript
// client/src/components/AddressSelectorV2.tsx

// Key improvements:
// 1. Use Photon API instead of Google Places
// 2. Add localStorage caching for recent searches
// 3. Add IndexedDB for larger cache
// 4. Implement smart debouncing (300-500ms)
// 5. Add map preview
// 6. Show recent addresses
// 7. Better error handling with fallbacks

export default function AddressSelectorV2({
  label,
  placeholder,
  value,
  onAddressSelect,
  type
}: AddressSelectorProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Fetch suggestions from Photon API
  const fetchSuggestions = useCallback(async (input: string) => {
    if (!input.trim() || input.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Try Photon API first
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(input)}&limit=5&lang=en`
      );
      
      if (response.ok) {
        const data = await response.json();
        const results = data.features.map((feature: any) => ({
          description: feature.properties.name,
          place_id: feature.id,
          lat: feature.geometry.coordinates[1],
          lng: feature.geometry.coordinates[0],
          properties: feature.properties
        }));
        setSuggestions(results);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setError('Could not fetch addresses');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setError('');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Debounce for 400ms
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 400);
  };

  // Load recent searches from localStorage
  const loadRecentSearches = () => {
    const recent = localStorage.getItem(`recent_${type}_searches`);
    if (recent) {
      setRecentSearches(JSON.parse(recent));
    }
  };

  // Save recent search
  const saveRecentSearch = (address: string, lat: number, lng: number) => {
    const recent = localStorage.getItem(`recent_${type}_searches`) || '[]';
    const searches = JSON.parse(recent);
    
    // Remove duplicate if exists
    const filtered = searches.filter((s: any) => s.address !== address);
    
    // Add new search at top
    const updated = [
      { address, lat, lng, timestamp: Date.now() },
      ...filtered
    ].slice(0, 5); // Keep only 5 recent
    
    localStorage.setItem(`recent_${type}_searches`, JSON.stringify(updated));
    setRecentSearches(updated);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: any) => {
    const address = suggestion.description;
    setInputValue(address);
    setSuggestions([]);
    setShowSuggestions(false);
    
    saveRecentSearch(address, suggestion.lat, suggestion.lng);
    onAddressSelect(address, { lat: suggestion.lat, lng: suggestion.lng });
  };

  return (
    <div className="relative w-full">
      {/* Input field */}
      {/* Suggestions dropdown */}
      {/* Recent searches */}
      {/* Error message */}
    </div>
  );
}
```

### 3.2 Update CustomerDashboard

```typescript
// client/src/pages/CustomerDashboard.tsx

// Key changes:
// 1. Replace Google Directions with backend route calculation
// 2. Add validation before submission
// 3. Show estimated time based on distance
// 4. Add recent address suggestions
// 5. Better error handling

const handleCalculateDistance = async (pickupCoords: any, dropoffCoords: any) => {
  try {
    // Call backend route calculation (uses Haversine + caching)
    const response = await trpc.delivery.calculateRoute.useQuery({
      originLat: pickupCoords.lat,
      originLng: pickupCoords.lng,
      destLat: dropoffCoords.lat,
      destLng: dropoffCoords.lng
    });

    setDistance(response.data.distanceKm);
    setEstimatedTime(response.data.durationMinutes);
    calculatePrice(response.data.distanceKm);
  } catch (err) {
    console.error('Error calculating route:', err);
    // Fallback to Haversine on client
    const distance = calculateHaversine(pickupCoords, dropoffCoords);
    setDistance(distance);
    calculatePrice(distance);
  }
};
```

---

## Phase 4: tRPC Procedures

### 4.1 Geocoding Procedures

```typescript
// server/routers.ts

export const appRouter = router({
  address: router({
    // Geocode an address
    geocode: publicProcedure
      .input(z.object({ query: z.string().min(3) }))
      .query(async ({ input }) => {
        const result = await geocodeAddress(input.query);
        if (!result) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Address not found'
          });
        }
        return result;
      }),

    // Get recent searches for user
    getRecentSearches: protectedProcedure
      .input(z.object({ type: z.enum(['pickup', 'dropoff']) }))
      .query(async ({ ctx, input }) => {
        return await db.getRecentSearches(ctx.user.id, input.type);
      }),

    // Save recent search
    saveRecentSearch: protectedProcedure
      .input(z.object({
        address: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        type: z.enum(['pickup', 'dropoff'])
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.saveRecentSearch(ctx.user.id, input);
      })
  }),

  delivery: router({
    // Calculate route
    calculateRoute: publicProcedure
      .input(z.object({
        originLat: z.number(),
        originLng: z.number(),
        destLat: z.number(),
        destLng: z.number()
      }))
      .query(async ({ input }) => {
        return await calculateRoute(
          input.originLat,
          input.originLng,
          input.destLat,
          input.destLng
        );
      }),

    // Create delivery with validation
    create: protectedProcedure
      .input(z.object({
        pickupAddress: z.string(),
        pickupLat: z.number(),
        pickupLng: z.number(),
        dropoffAddress: z.string(),
        dropoffLat: z.number(),
        dropoffLng: z.number(),
        distance: z.number(),
        packageSize: z.enum(['small', 'medium', 'large']),
        packageDescription: z.string()
      }))
      .mutation(async ({ ctx, input }) => {
        // Validate addresses
        if (!input.pickupAddress || !input.dropoffAddress) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid addresses'
          });
        }

        // Validate coordinates
        if (input.pickupLat === 0 || input.pickupLng === 0 ||
            input.dropoffLat === 0 || input.dropoffLng === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid coordinates'
          });
        }

        // Calculate price
        const price = calculatePrice(input.distance, input.packageSize);

        // Create delivery
        return await db.createDelivery({
          customerId: ctx.user.id,
          pickupAddress: input.pickupAddress,
          pickupLatitude: input.pickupLat,
          pickupLongitude: input.pickupLng,
          dropoffAddress: input.dropoffAddress,
          dropoffLatitude: input.dropoffLat,
          dropoffLongitude: input.dropoffLng,
          distance: input.distance,
          estimatedPrice: price,
          packageSize: input.packageSize,
          packageDescription: input.packageDescription
        });
      })
  })
});
```

---

## Phase 5: Implementation Timeline

### Week 1: Database & Backend Services
- [ ] Create address_cache, recent_searches, route_cache tables
- [ ] Implement geocoding service (Photon + Nominatim)
- [ ] Implement routing service (Haversine + OSRM)
- [ ] Implement address parser for SA addresses
- [ ] Add caching layer
- [ ] Write unit tests

### Week 2: Backend Integration
- [ ] Add tRPC procedures for geocoding
- [ ] Add tRPC procedures for routing
- [ ] Add tRPC procedures for recent searches
- [ ] Implement booking validation
- [ ] Write integration tests
- [ ] Performance testing

### Week 3: Frontend Implementation
- [ ] Create AddressSelectorV2 component
- [ ] Integrate Photon API
- [ ] Add localStorage caching
- [ ] Add recent searches UI
- [ ] Update CustomerDashboard
- [ ] Add map preview

### Week 4: Testing & Optimization
- [ ] End-to-end testing
- [ ] Performance benchmarking
- [ ] Load testing
- [ ] Accuracy testing
- [ ] Documentation
- [ ] Deploy to production

---

## Performance Targets

### Response Times
- **Cached results**: < 50ms
- **Recent searches**: < 50ms
- **Photon API**: 200-400ms
- **Nominatim fallback**: 1-2s
- **Route calculation**: < 100ms (Haversine) / 200-400ms (OSRM)

### Cache Hit Rates
- **Address cache**: 70-80%
- **Route cache**: 60-70%
- **Recent searches**: 30-40%

### Cost
- **First 6 months**: R0 (completely free)
- **After 6 months**: Optional upgrade to Google Places (R1,500/month)

---

## API Endpoints

### Photon Search
```
GET https://photon.komoot.io/api/?q={query}&limit=5&lang=en
```

### Nominatim Search
```
GET https://nominatim.openstreetmap.org/search?q={query}&format=json&limit=5
```

### OSRM Routing
```
GET https://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}
```

---

## South African Address Optimization

### Supported Address Types
1. **Formal**: "50 2nd Avenue, Johannesburg, Gauteng"
2. **Estate**: "Plot 42, Waterfall Estate, Midrand"
3. **Complex**: "Unit 5, The Pavilion, Sandton"
4. **Farm**: "Sunnybrook Farm, Muldersdrift, Gauteng"
5. **Industrial**: "Unit 3, Linbro Business Park, Johannesburg"
6. **Township**: "123 Main Street, Soweto, Johannesburg"
7. **Informal**: "Near Shoprite, Khayelitsha, Cape Town"

### Optimization Strategy
- Parse address components (street, suburb, city, province)
- Detect address type (formal, estate, complex, township, informal)
- Prioritize exact matches
- Use fuzzy matching for informal addresses
- Add province/city filtering
- Build local address database over time

---

## Monitoring & Analytics

### Metrics to Track
- Address search response time
- Cache hit rate
- API error rate
- User satisfaction (address accuracy)
- Cost (should be R0 for 6 months)

### Alerting
- Alert if response time > 1 second
- Alert if cache hit rate < 50%
- Alert if API error rate > 5%

