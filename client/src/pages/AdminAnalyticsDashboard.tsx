import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, DollarSign, Truck, MapPin, AlertCircle } from "lucide-react";

export default function AdminAnalyticsDashboard() {
  const [dateRange, setDateRange] = useState({ start: "2026-05-01", end: "2026-05-14" });

  // Fetch analytics data
  const { data: summary } = trpc.analytics.getDashboardSummary.useQuery();
  const { data: revenueData } = trpc.analytics.getRevenueAnalytics.useQuery({
    startDate: dateRange.start,
    endDate: dateRange.end,
    groupBy: "daily",
  });
  const { data: courierPerformance } = trpc.analytics.getCourierPerformance.useQuery({});
  const { data: zonePerformance } = trpc.analytics.getZonePerformance.useQuery();
  const { data: demandData } = trpc.analytics.getDemandAnalytics.useQuery({
    date: dateRange.start,
  });
  const { data: payoutAnalytics } = trpc.analytics.getPayoutAnalytics.useQuery({
    startDate: dateRange.start,
    endDate: dateRange.end,
  });
  const { data: referralAnalytics } = trpc.analytics.getReferralAnalytics.useQuery();
  const { data: surgeAnalytics } = trpc.analytics.getSurgePricingAnalytics.useQuery({
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  const COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Real-time platform metrics and performance analytics</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R{summary?.totalRevenue?.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+12.5% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deliveries</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.totalDeliveries?.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{summary?.completedDeliveries} completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Couriers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.activeCouriers}</div>
              <p className="text-xs text-muted-foreground">+{summary?.newCouriersThisMonth} this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.averageRating}/5.0</div>
              <p className="text-xs text-muted-foreground">Platform average</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="couriers">Couriers</TabsTrigger>
            <TabsTrigger value="zones">Zones</TabsTrigger>
            <TabsTrigger value="demand">Demand</TabsTrigger>
          </TabsList>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Daily revenue over the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="totalRevenue" stroke="#FF6B6B" name="Total Revenue" />
                    <Line type="monotone" dataKey="platformCommission" stroke="#4ECDC4" name="Commission" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Platform Commission</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R{summary?.platformCommission?.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">20% of total revenue</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Courier Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">R{summary?.courierEarnings?.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">80% to couriers</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {((summary?.completedDeliveries || 0) / (summary?.totalDeliveries || 1) * 100).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">{summary?.cancelledDeliveries} cancelled</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Couriers Tab */}
          <TabsContent value="couriers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Couriers</CardTitle>
                <CardDescription>Ranked by deliveries completed this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courierPerformance?.slice(0, 5).map((courier: any) => (
                    <div key={courier.courierId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">{courier.courierName}</p>
                        <p className="text-sm text-muted-foreground">{courier.deliveriesCompleted} deliveries</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">R{courier.totalEarnings?.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{courier.averageRating}/5.0 ⭐</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Zones Tab */}
          <TabsContent value="zones" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Zone Performance</CardTitle>
                <CardDescription>Revenue and deliveries by zone</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={zonePerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="zone" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalDeliveries" fill="#FF6B6B" name="Deliveries" />
                    <Bar dataKey="revenue" fill="#4ECDC4" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Demand Tab */}
          <TabsContent value="demand" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Hourly Demand Pattern</CardTitle>
                <CardDescription>Delivery requests by hour (today)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={demandData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" label={{ value: "Hour of Day", position: "insideBottomRight", offset: -5 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="deliveryRequests" stroke="#FF6B6B" name="Requests" />
                    <Line type="monotone" dataKey="demandMultiplier" stroke="#FFA07A" name="Surge Multiplier" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Additional Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          {/* Referral Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Referral Program</CardTitle>
              <CardDescription>Referral performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Referrals</span>
                  <span className="font-semibold">{referralAnalytics?.totalReferrals}</span>
                </div>
                <div className="flex justify-between">
                  <span>Success Rate</span>
                  <span className="font-semibold">{referralAnalytics?.successRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Top Referrer</span>
                  <span className="font-semibold">{referralAnalytics?.topReferrers?.[0]?.name}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payout Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Payout Status</CardTitle>
              <CardDescription>Weekly payout metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Completed Payouts</span>
                  <span className="font-semibold">{payoutAnalytics?.completedPayouts}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Amount</span>
                  <span className="font-semibold">R{payoutAnalytics?.totalAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Success Rate</span>
                  <span className="font-semibold">{payoutAnalytics?.payoutSuccessRate}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
