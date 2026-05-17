import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Map, Navigation, TrendingUp, Clock, Fuel, AlertCircle } from 'lucide-react';

/**
 * Route Optimization Component
 * 
 * Displays optimized delivery routes with real-time updates
 * Shows distance, time, fuel cost, and efficiency metrics
 */

interface OptimizedRoute {
  deliveries: any[];
  totalDistance: number;
  estimatedTime: number;
  fuelCost: number;
  stops: any[];
  instructions: string[];
  optimizationScore: number;
}

export default function RouteOptimization() {
  const [route, setRoute] = useState<OptimizedRoute | null>(null);
  const [loading, setLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleOptimizeRoute = async () => {
    setLoading(true);
    try {
      // Mock data for demonstration
      const mockRoute: OptimizedRoute = {
        deliveries: [
          { id: 'DEL-001', address: 'Sandton City' },
          { id: 'DEL-002', address: 'Midrand Office' },
          { id: 'DEL-003', address: 'Johannesburg CBD' },
        ],
        totalDistance: 45.3,
        estimatedTime: 90,
        fuelCost: 150.5,
        stops: [],
        instructions: [
          'Start at current location (Sandton)',
          'Proceed to Delivery 1 pickup (Sandton City)',
          'Complete pickup and go to delivery location',
          'Proceed to Delivery 2 pickup (Midrand)',
          'Complete pickup and go to delivery location',
          'Proceed to Delivery 3 pickup (Johannesburg CBD)',
          'Complete pickup and go to delivery location',
        ],
        optimizationScore: 87,
      };

      setRoute(mockRoute);
    } catch (error) {
      // Route optimization failed silently
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Route Optimization</h2>
          <p className="text-muted-foreground">AI-powered route planning for maximum efficiency</p>
        </div>
        <Button onClick={handleOptimizeRoute} disabled={loading} className="gap-2">
          <Navigation className="w-4 h-4" />
          {loading ? 'Optimizing...' : 'Optimize Route'}
        </Button>
      </div>

      {!route ? (
        <Card className="border-dashed">
          <CardContent className="pt-12 text-center">
            <Map className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">No optimized route yet</p>
            <Button onClick={handleOptimizeRoute} variant="outline">
              Generate Optimized Route
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Route Metrics */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Distance</p>
                    <p className="text-2xl font-bold mt-2">{route.totalDistance} km</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-accent/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Est. Time</p>
                    <p className="text-2xl font-bold mt-2">{route.estimatedTime} min</p>
                  </div>
                  <Clock className="w-8 h-8 text-accent/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Fuel Cost</p>
                    <p className="text-2xl font-bold mt-2">R{route.fuelCost.toFixed(2)}</p>
                  </div>
                  <Fuel className="w-8 h-8 text-accent/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-900/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Optimization</p>
                    <p className="text-2xl font-bold mt-2 text-green-600">{route.optimizationScore}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Deliveries in Route */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Delivery Sequence</CardTitle>
              <CardDescription>Optimized order for maximum efficiency</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {route.deliveries.map((delivery, index) => (
                  <div key={delivery.id} className="flex items-center gap-4 p-4 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-accent-foreground font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{delivery.address}</p>
                      <p className="text-sm text-muted-foreground">{delivery.id}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Navigation Instructions */}
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Navigation Instructions</CardTitle>
                <CardDescription>Step-by-step route guidance</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInstructions(!showInstructions)}
              >
                {showInstructions ? 'Hide' : 'Show'}
              </Button>
            </CardHeader>
            {showInstructions && (
              <CardContent>
                <div className="space-y-2">
                  {route.instructions.map((instruction, index) => (
                    <div key={index} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-semibold">
                        {index + 1}
                      </span>
                      <p className="text-sm">{instruction}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Benefits */}
          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/10">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-200">Route Optimization Benefits</p>
                  <ul className="text-sm text-blue-800 dark:text-blue-300 mt-2 space-y-1">
                    <li>✓ Reduces delivery time by 20-30%</li>
                    <li>✓ Minimizes fuel costs and emissions</li>
                    <li>✓ Increases daily earnings potential</li>
                    <li>✓ Improves customer satisfaction</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
