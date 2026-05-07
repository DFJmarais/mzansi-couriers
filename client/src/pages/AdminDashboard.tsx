import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Users, Package, DollarSign, AlertCircle, CheckCircle2, Clock } from "lucide-react";

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
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.5rem"
                    }}
                  />
                  <Bar dataKey="deliveries" fill="var(--accent)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card className="border-border/50">
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
                      border: "1px solid var(--border)",
                      borderRadius: "0.5rem"
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="var(--accent)" 
                    strokeWidth={2}
                    dot={{ fill: "var(--accent)", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Status Distribution & Active Couriers */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Delivery Status Distribution</CardTitle>
              <CardDescription>Current delivery statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Active Couriers Trend */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Active Couriers Trend</CardTitle>
              <CardDescription>Courier availability throughout the week</CardDescription>
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
                      border: "1px solid var(--border)",
                      borderRadius: "0.5rem"
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="active" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Pending Deliveries */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Pending Deliveries</h2>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="space-y-3">
                {[
                  { id: "DEL-001", from: "Sandton", to: "Midrand", status: "assigned", time: "2 mins ago", courier: "John M." },
                  { id: "DEL-002", from: "Rosebank", to: "Bryanston", status: "in-transit", time: "5 mins ago", courier: "Sarah N." },
                  { id: "DEL-003", from: "Fourways", to: "Sunninghill", status: "pending", time: "8 mins ago", courier: "Unassigned" }
                ].map((delivery, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold text-sm">{delivery.id}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          delivery.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          delivery.status === 'assigned' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        }`}>
                          {delivery.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{delivery.from} → {delivery.to}</p>
                      <p className="text-xs text-muted-foreground mt-1">{delivery.courier} • {delivery.time}</p>
                    </div>
                    <Button size="sm" variant="outline">View</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courier Management */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Top Performing Couriers</h2>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="space-y-3">
                {[
                  { name: "John Mthembu", deliveries: 127, rating: 4.9, status: "online", earnings: "R8,890" },
                  { name: "Sarah Nkosi", deliveries: 115, rating: 4.8, status: "online", earnings: "R8,050" },
                  { name: "Thabo Dlamini", deliveries: 98, rating: 4.7, status: "offline", earnings: "R6,860" }
                ].map((courier, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{courier.name}</p>
                        <div className={`w-2 h-2 rounded-full ${courier.status === 'online' ? 'bg-green-500' : 'bg-muted-foreground'}`}></div>
                      </div>
                      <p className="text-sm text-muted-foreground">{courier.deliveries} deliveries • {courier.rating}★ rating</p>
                      <p className="text-xs text-accent font-semibold mt-1">{courier.earnings} this month</p>
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

        {/* System Alerts */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">System Alerts</h2>
          <div className="space-y-3">
            {[
              { type: "warning", icon: AlertCircle, message: "3 couriers pending verification", action: "Review" },
              { type: "success", icon: CheckCircle2, message: "All systems operational", action: "View" },
              { type: "info", icon: Clock, message: "Peak hours: 12-2 PM, 5-7 PM", action: "Manage" }
            ].map((alert, i) => (
              <Card key={i} className={`border-l-4 ${
                alert.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10' :
                alert.type === 'success' ? 'border-l-green-500 bg-green-50/50 dark:bg-green-900/10' :
                'border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
              }`}>
                <CardContent className="pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <alert.icon className={`w-5 h-5 ${
                      alert.type === 'warning' ? 'text-yellow-600' :
                      alert.type === 'success' ? 'text-green-600' :
                      'text-blue-600'
                    }`} />
                    <p className="text-sm font-medium">{alert.message}</p>
                  </div>
                  <Button size="sm" variant="ghost">{alert.action}</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
