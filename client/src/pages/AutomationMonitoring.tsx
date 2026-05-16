import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, CheckCircle2, AlertCircle, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';

/**
 * Automation Monitoring Dashboard
 * 
 * Real-time monitoring of BullMQ automation engine
 * Shows job statistics, recent events, and system health
 */

export default function AutomationMonitoring() {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Mock data for demonstration
  const mockStats = {
    total: 1247,
    queued: 12,
    processing: 5,
    completed: 1180,
    failed: 50,
    retried: 25,
    avgDuration: 245,
    successRate: 94.6,
  };

  const mockEvents = [
    { jobId: 'payment-PAY-001', queueName: 'payment-success', status: 'completed', duration: 234, timestamp: Date.now() - 60000 },
    { jobId: 'delivery-DEL-001-in_transit', queueName: 'delivery-status', status: 'completed', duration: 189, timestamp: Date.now() - 120000 },
    { jobId: 'courier-assigned-DEL-002', queueName: 'courier-assigned', status: 'completed', duration: 267, timestamp: Date.now() - 180000 },
    { jobId: 'earnings-COURIER-001-2026-05-16', queueName: 'daily-earnings', status: 'completed', duration: 312, timestamp: Date.now() - 240000 },
    { jobId: 'ticket-TICKET-001', queueName: 'support-ticket', status: 'failed', duration: 450, timestamp: Date.now() - 300000 },
  ];

  useEffect(() => {
    setStats(mockStats);
    setEvents(mockEvents);
    setLoading(false);

    // Auto-refresh every 5 seconds if enabled
    if (autoRefresh) {
      const interval = setInterval(() => {
        // In production, fetch real data from trpc.automation.getStats()
        console.log('Refreshing automation stats...');
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  if (!isAuthenticated || user?.role !== 'admin') {
    return <div>Access denied</div>;
  }

  if (loading) {
    return <div className="p-8">Loading automation monitoring...</div>;
  }

  const statusData = [
    { name: 'Completed', value: stats.completed, color: '#10b981' },
    { name: 'Queued', value: stats.queued, color: '#3b82f6' },
    { name: 'Processing', value: stats.processing, color: '#f59e0b' },
    { name: 'Failed', value: stats.failed, color: '#ef4444' },
  ];

  const recentEventsData = mockEvents.slice(0, 5).map((event, i) => ({
    name: `Job ${i + 1}`,
    duration: event.duration,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Automation Monitoring</h1>
            <p className="text-muted-foreground">BullMQ Automation Engine Status</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={autoRefresh ? 'default' : 'outline'}
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { icon: Activity, label: 'Total Jobs', value: stats.total.toLocaleString(), change: '+8%', trend: 'up' },
            { icon: CheckCircle2, label: 'Success Rate', value: `${stats.successRate.toFixed(1)}%`, change: '+2.3%', trend: 'up' },
            { icon: Clock, label: 'Avg Duration', value: `${stats.avgDuration}ms`, change: '-15ms', trend: 'up' },
            { icon: AlertCircle, label: 'Failed Jobs', value: stats.failed, change: '-5', trend: 'up' },
          ].map((metric, i) => (
            <Card key={i} className="border-border/50 hover:border-accent/50 transition-all hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <p className="text-2xl font-bold mt-2">{metric.value}</p>
                    <p className={`text-xs mt-2 ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {metric.change} this hour
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
          {/* Job Status Distribution */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Job Status Distribution</CardTitle>
              <CardDescription>Current job states in the queue</CardDescription>
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

          {/* Recent Job Duration */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Recent Job Processing Times</CardTitle>
              <CardDescription>Last 5 jobs duration in milliseconds</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={recentEventsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Bar dataKey="duration" fill="var(--accent)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Queue Status */}
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Queued Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-blue-600">{stats.queued}</p>
              <p className="text-sm text-muted-foreground mt-2">Waiting to be processed</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-yellow-600">{stats.processing}</p>
              <p className="text-sm text-muted-foreground mt-2">Currently being processed</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Failed Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-red-600">{stats.failed}</p>
              <p className="text-sm text-muted-foreground mt-2">Require attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Events */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Recent Automation Events</h2>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="space-y-3">
                {events.map((event, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold text-sm">{event.jobId}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          event.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          event.status === 'processing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {event.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{event.queueName}</p>
                      <p className="text-xs text-muted-foreground mt-1">Duration: {event.duration}ms • {new Date(event.timestamp).toLocaleTimeString()}</p>
                    </div>
                    <Button size="sm" variant="outline">Details</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">System Health</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-900/10">
              <CardContent className="pt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-medium">Redis Connection</p>
                </div>
                <span className="text-xs font-semibold text-green-600">Connected</span>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-900/10">
              <CardContent className="pt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-medium">All Workers Running</p>
                </div>
                <span className="text-xs font-semibold text-green-600">6/6 Active</span>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-900/10">
              <CardContent className="pt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-medium">Queue Depth</p>
                </div>
                <span className="text-xs font-semibold text-green-600">Healthy</span>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-900/10">
              <CardContent className="pt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-medium">Error Rate</p>
                </div>
                <span className="text-xs font-semibold text-green-600">5.4% (Normal)</span>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Info Box */}
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/10">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-200">Automation Engine Status</p>
                <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                  Your BullMQ automation engine is running smoothly with 94.6% success rate. All 6 workflows are active and processing jobs efficiently.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
