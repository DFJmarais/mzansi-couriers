import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { TrendingUp, Users, Package, DollarSign } from "lucide-react";

const chartData = [
  { name: "Mon", deliveries: 45, revenue: 2250 },
  { name: "Tue", deliveries: 52, revenue: 2600 },
  { name: "Wed", deliveries: 48, revenue: 2400 },
  { name: "Thu", deliveries: 61, revenue: 3050 },
  { name: "Fri", deliveries: 55, revenue: 2750 },
  { name: "Sat", deliveries: 67, revenue: 3350 },
  { name: "Sun", deliveries: 42, revenue: 2100 }
];

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || user?.role !== 'admin') {
    return <div>Access denied</div>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Monitor deliveries, couriers, and platform analytics</p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { icon: Package, label: "Total Deliveries", value: "2,847", change: "+12%" },
            { icon: DollarSign, label: "Total Revenue", value: "R142,350", change: "+8%" },
            { icon: Users, label: "Active Couriers", value: "324", change: "+5%" },
            { icon: TrendingUp, label: "Avg Rating", value: "4.7★", change: "+0.2" }
          ].map((metric, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <p className="text-2xl font-bold mt-1">{metric.value}</p>
                    <p className="text-xs text-green-600 mt-2">{metric.change} this week</p>
                  </div>
                  <metric.icon className="w-8 h-8 text-accent opacity-50" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Deliveries Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Deliveries This Week</CardTitle>
              <CardDescription>Daily delivery volume</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)"
                    }}
                  />
                  <Bar dataKey="deliveries" fill="var(--accent)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue This Week</CardTitle>
              <CardDescription>Daily platform revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)"
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="var(--accent)" 
                    strokeWidth={2}
                    dot={{ fill: "var(--accent)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Pending Deliveries */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Pending Deliveries</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {[
                  { id: "DEL-001", from: "Sandton", to: "Midrand", status: "assigned", time: "2 mins ago" },
                  { id: "DEL-002", from: "Rosebank", to: "Bryanston", status: "in-transit", time: "5 mins ago" },
                  { id: "DEL-003", from: "Fourways", to: "Sunninghill", status: "pending", time: "8 mins ago" }
                ].map((delivery, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{delivery.id}</p>
                      <p className="text-sm text-muted-foreground">{delivery.from} → {delivery.to}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        delivery.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        delivery.status === 'assigned' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      }`}>
                        {delivery.status}
                      </span>
                      <span className="text-xs text-muted-foreground">{delivery.time}</span>
                      <Button size="sm" variant="outline">View</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courier Management */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Top Couriers</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {[
                  { name: "John Mthembu", deliveries: 127, rating: 4.9, status: "online" },
                  { name: "Sarah Nkosi", deliveries: 115, rating: 4.8, status: "online" },
                  { name: "Thabo Dlamini", deliveries: 98, rating: 4.7, status: "offline" }
                ].map((courier, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{courier.name}</p>
                        <div className={`w-2 h-2 rounded-full ${courier.status === 'online' ? 'bg-green-500' : 'bg-muted-foreground'}`}></div>
                      </div>
                      <p className="text-sm text-muted-foreground">{courier.deliveries} deliveries • {courier.rating}★ rating</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Suspend</Button>
                      <Button size="sm" variant="outline">Details</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
