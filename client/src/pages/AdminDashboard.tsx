import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Users, Package, DollarSign, AlertCircle, CheckCircle2, Clock, Send, Mail } from "lucide-react";
import { LanguageSwitcher, NotificationPreferences } from "@/components/Phase2Features";
import { useState } from "react";


const chartData = [
  { name: "Mon", deliveries: 45, revenue: 2250, active: 120 },
  { name: "Tue", deliveries: 52, revenue: 2600, active: 135 },
  { name: "Wed", deliveries: 48, revenue: 2400, active: 128 },
  { name: "Thu", deliveries: 61, revenue: 3050, active: 145 },
  { name: "Fri", deliveries: 55, revenue: 2750, active: 140 },
  { name: "Sat", deliveries: 67, revenue: 3350, active: 152 },
  { name: "Sun", deliveries: 42, revenue: 2100, active: 115 }
];

const statusData = [
  { name: "Delivered", value: 1840, color: "#10b981" },
  { name: "In Transit", value: 320, color: "#a855f7" },
  { name: "Assigned", value: 180, color: "#3b82f6" },
  { name: "Pending", value: 45, color: "#f59e0b" }
];

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [sendingEarnings, setSendingEarnings] = useState(false);

  if (!isAuthenticated || user?.role !== 'admin') {
    return <div>Access denied</div>;
  }

  const handleSendDailyEarnings = async (courierId: string, courierName: string) => {
    setSendingEarnings(true);
    try {
      // In production, this would call a tRPC mutation to queue the job
      // await trpc.automation.queueDailyEarnings.mutate({ courierId, courierName });
    } catch (error) {
      // Failed to send earnings summary
    } finally {
      setSendingEarnings(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header with Language Switcher */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard - Mzansi Control Center</h1>
            <p className="text-muted-foreground">Monitor South Africa's delivery network 🇿🇦</p>
          </div>
          <LanguageSwitcher  />
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { icon: Package, label: "Total Deliveries", value: "2,847", change: "+12%", trend: "up" },
            { icon: DollarSign, label: "Total Revenue", value: "R142,350", change: "+8%", trend: "up" },
            { icon: Users, label: "Active Couriers", value: "324", change: "+5%", trend: "up" },
            { icon: TrendingUp, label: "Avg Rating", value: "4.7★", change: "+0.2", trend: "up" }
          ].map((metric, i) => (
            <Card key={i} className="border-border/50 hover:border-accent/50 transition-all hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <p className="text-2xl font-bold mt-2">{metric.value}</p>
                    <p className={`text-xs mt-2 ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {metric.change} this week
                    </p>
                  </div>
                  <metric.icon className="w-8 h-8 text-accent/50" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Deliveries Chart */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Deliveries This Week</CardTitle>
              <CardDescription>Daily delivery volume and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }} />
                  <Bar dataKey="deliveries" fill="#FF6B35" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Weekly revenue in Rand</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }} />
                  <Line type="monotone" dataKey="revenue" stroke="#FF6B35" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Delivery Status</CardTitle>
              <CardDescription>Current delivery states</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Active Couriers Chart */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Active Couriers</CardTitle>
              <CardDescription>Couriers online this week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }} />
                  <Line type="monotone" dataKey="active" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Courier Management */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Top Performing Couriers</h2>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Top performing couriers will be displayed here once they complete deliveries.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Earnings Summary Management */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Daily Earnings Summary Management</h2>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Send Earnings Reports to Couriers</CardTitle>
              <CardDescription>Manually trigger daily earnings summaries via WhatsApp and Email</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Daily earnings summaries for couriers will be displayed here. Use the automation system to send reports.</p>
              </div>
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  💡 <strong>Tip:</strong> These summaries are automatically sent daily at 6 PM via the BullMQ automation engine. Use this to manually trigger reports for specific couriers.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Alerts */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">System Alerts</h2>
          <div className="space-y-3">
            <Card className="border-border/50 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-900 dark:text-yellow-100">High demand detected</p>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">Peak delivery hours detected. Consider surge pricing activation.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
