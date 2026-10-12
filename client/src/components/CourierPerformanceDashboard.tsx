import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Award, Target, Clock, DollarSign, Star } from "lucide-react";

interface PerformanceMetrics {
  totalDeliveries: number;
  completedDeliveries: number;
  acceptanceRate: number;
  cancellationRate: number;
  onTimeRate: number;
  averageRating: number;
  totalEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  rank: string;
  benchmarkPercentile: number;
}

interface CourierPerformanceDashboardProps {
  metrics: PerformanceMetrics;
}

export function CourierPerformanceDashboard({ metrics }: CourierPerformanceDashboardProps) {
  const getPercentileColor = (percentile: number) => {
    if (percentile >= 90) return "text-green-600";
    if (percentile >= 70) return "text-blue-600";
    if (percentile >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getRankColor = (rank: string) => {
    const rankColors: Record<string, string> = {
      "Platinum": "bg-purple-100 text-purple-800",
      "Gold": "bg-yellow-100 text-yellow-800",
      "Silver": "bg-gray-100 text-gray-800",
      "Bronze": "bg-orange-100 text-orange-800",
      "Standard": "bg-blue-100 text-blue-800",
    };
    return rankColors[rank] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Performance Dashboard</h2>
        <Badge className={getRankColor(metrics.rank)}>
          {metrics.rank} Courier
        </Badge>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Deliveries */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-accent" />
              Total Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.totalDeliveries}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.completedDeliveries} completed
            </p>
          </CardContent>
        </Card>

        {/* Acceptance Rate */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              Acceptance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.acceptanceRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cancelled: {metrics.cancellationRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        {/* On-Time Rate */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              On-Time Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.onTimeRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Benchmark: {metrics.benchmarkPercentile.toFixed(0)}th percentile
            </p>
          </CardContent>
        </Card>

        {/* Rating */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-600" />
              Customer Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.averageRating.toFixed(1)}★</div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on customer reviews
            </p>
          </CardContent>
        </Card>

        {/* Weekly Earnings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              Weekly Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R{metrics.weeklyEarnings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              This week
            </p>
          </CardContent>
        </Card>

        {/* Monthly Earnings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Award className="w-4 h-4 text-accent" />
              Monthly Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R{metrics.monthlyEarnings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="font-semibold">Total Earnings (All Time)</span>
              <span className="text-2xl font-bold">R{metrics.totalEarnings.toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-muted-foreground">Weekly Average</p>
                <p className="text-xl font-bold text-green-600">
                  R{(metrics.weeklyEarnings).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-muted-foreground">Monthly Average</p>
                <p className="text-xl font-bold text-blue-600">
                  R{(metrics.monthlyEarnings).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {metrics.onTimeRate >= 95 && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm font-semibold text-green-800">
                ✓ Excellent on-time performance! You're in the top 10%
              </p>
            </div>
          )}

          {metrics.averageRating >= 4.8 && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm font-semibold text-green-800">
                ✓ Outstanding customer ratings! Keep it up!
              </p>
            </div>
          )}

          {metrics.acceptanceRate >= 95 && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm font-semibold text-green-800">
                ✓ High acceptance rate! You're a reliable courier
              </p>
            </div>
          )}

          {metrics.onTimeRate < 90 && (
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm font-semibold text-yellow-800">
                ⚠ Your on-time rate is below average. Try to improve delivery times
              </p>
            </div>
          )}

          {metrics.acceptanceRate < 80 && (
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm font-semibold text-yellow-800">
                ⚠ Your acceptance rate is low. Accepting more jobs helps your rating
              </p>
            </div>
          )}

          {metrics.averageRating < 4.5 && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm font-semibold text-red-800">
                ⚠ Your rating is below average. Focus on customer service
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rank Progression */}
      <Card>
        <CardHeader>
          <CardTitle>Rank Progression</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">Bronze → Silver</span>
                  <span className="text-xs text-muted-foreground">85%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: "85%" }} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">Silver → Gold</span>
                  <span className="text-xs text-muted-foreground">45%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "45%" }} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">Gold → Platinum</span>
                  <span className="text-xs text-muted-foreground">0%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: "0%" }} />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
