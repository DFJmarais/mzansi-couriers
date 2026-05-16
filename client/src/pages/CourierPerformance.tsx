import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface Rating {
  id: string;
  courierId: string;
  customerId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

interface Metric {
  completionRate: number;
  responseTime: number;
  cancellationRate: number;
  averageRating: number;
  totalDeliveries: number;
}

export default function CourierPerformance() {
  const [metrics, setMetrics] = useState<Metric | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for demonstration
    const mockMetrics: Metric = {
      completionRate: 98.5,
      responseTime: 2.3,
      cancellationRate: 1.2,
      averageRating: 4.7,
      totalDeliveries: 247
    };

    const mockRatings: Rating[] = [
      {
        id: "1",
        courierId: "courier1",
        customerId: "cust1",
        rating: 5,
        comment: "Fast and professional delivery. Highly recommended!",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: "2",
        courierId: "courier1",
        customerId: "cust2",
        rating: 4,
        comment: "Good service, arrived on time.",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: "3",
        courierId: "courier1",
        customerId: "cust3",
        rating: 5,
        comment: "Excellent! Package handled with care.",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    ];

    setMetrics(mockMetrics);
    setRatings(mockRatings);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 3.5) return "text-yellow-600";
    return "text-red-600";
  };

  const getPerformanceBadge = (rate: number, isHighGood: boolean = true) => {
    const threshold = isHighGood ? 95 : 5;
    const isGood = isHighGood ? rate >= threshold : rate <= threshold;
    return (
      <Badge variant={isGood ? "default" : "secondary"}>
        {rate.toFixed(1)}%
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Your Performance</h1>
          <p className="text-muted-foreground">Track your ratings, metrics, and customer feedback</p>
        </div>

        {/* Performance Metrics Grid */}
        <div className="grid md:grid-cols-4 gap-4">
          {/* Average Rating */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm text-muted-foreground">Average Rating</span>
                </div>
                <div className={`text-3xl font-bold ${getRatingColor(metrics?.averageRating || 0)}`}>
                  {metrics?.averageRating.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">Based on {metrics?.totalDeliveries} deliveries</p>
              </div>
            </CardContent>
          </Card>

          {/* Completion Rate */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-muted-foreground">Completion Rate</span>
                </div>
                <div className="text-3xl font-bold">
                  {getPerformanceBadge(metrics?.completionRate || 0, true)}
                </div>
                <p className="text-xs text-muted-foreground">Deliveries completed successfully</p>
              </div>
            </CardContent>
          </Card>

          {/* Response Time */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-muted-foreground">Avg Response Time</span>
                </div>
                <div className="text-3xl font-bold">{metrics?.responseTime.toFixed(1)}m</div>
                <p className="text-xs text-muted-foreground">Minutes to accept job</p>
              </div>
            </CardContent>
          </Card>

          {/* Cancellation Rate */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <span className="text-sm text-muted-foreground">Cancellation Rate</span>
                </div>
                <div className="text-3xl font-bold">
                  {getPerformanceBadge(metrics?.cancellationRate || 0, false)}
                </div>
                <p className="text-xs text-muted-foreground">Lower is better</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold">Strengths</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Excellent completion rate (98.5%) - Keep up the consistency!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>High customer satisfaction (4.7★) - Great work!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Quick response time (2.3m) - Customers appreciate your speed</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Areas to Improve</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span>Reduce cancellations - Try to complete more jobs you accept</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span>Maintain consistency - Keep your high standards across all deliveries</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Reviews */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Customer Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ratings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No reviews yet. Complete more deliveries to get feedback!</p>
            ) : (
              ratings.map((rating) => (
                <div key={rating.id} className="border-b pb-4 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < rating.rating
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(rating.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">{rating.comment}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button variant="outline">Download Performance Report</Button>
          <Button>View Full Analytics</Button>
        </div>
      </div>
    </div>
  );
}
