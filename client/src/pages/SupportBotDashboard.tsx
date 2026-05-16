import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import { MessageSquare, CheckCircle2, AlertCircle, Clock, TrendingUp, Zap } from 'lucide-react';

/**
 * Support Bot Dashboard
 * 
 * Monitor AI support bot performance and manage tickets
 * Shows bot responses, escalations, and customer satisfaction
 */

interface SupportTicket {
  id: string;
  customerId: string;
  subject: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'bot-responded' | 'escalated' | 'resolved';
  botConfidence: number;
  sentiment: 'positive' | 'neutral' | 'negative' | 'angry';
  createdAt: number;
}

export default function SupportBotDashboard() {
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: 'TICKET-001',
      customerId: 'CUST-001',
      subject: 'Delivery was late',
      priority: 'high',
      status: 'bot-responded',
      botConfidence: 92,
      sentiment: 'negative',
      createdAt: Date.now() - 3600000,
    },
    {
      id: 'TICKET-002',
      customerId: 'CUST-002',
      subject: 'Payment failed',
      priority: 'medium',
      status: 'bot-responded',
      botConfidence: 88,
      sentiment: 'neutral',
      createdAt: Date.now() - 7200000,
    },
    {
      id: 'TICKET-003',
      customerId: 'CUST-003',
      subject: 'Courier was rude',
      priority: 'high',
      status: 'escalated',
      botConfidence: 45,
      sentiment: 'angry',
      createdAt: Date.now() - 10800000,
    },
  ]);

  const stats = {
    totalTickets: 1247,
    botResolved: 1087,
    escalated: 160,
    avgConfidence: 87.3,
    avgResponseTime: 2.3,
    satisfactionRate: 91.2,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'bot-responded':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'escalated':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'resolved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return '😊';
      case 'neutral':
        return '😐';
      case 'negative':
        return '😕';
      case 'angry':
        return '😠';
      default:
        return '😐';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Support Bot Dashboard</h1>
            <p className="text-muted-foreground">AI-powered customer support monitoring</p>
          </div>
          <Button className="gap-2">
            <Zap className="w-4 h-4" />
            View Bot Analytics
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              icon: CheckCircle2,
              label: 'Bot Resolved',
              value: `${stats.botResolved.toLocaleString()}`,
              change: '+12%',
              color: 'text-green-600',
            },
            {
              icon: AlertCircle,
              label: 'Escalated',
              value: `${stats.escalated}`,
              change: '-8%',
              color: 'text-red-600',
            },
            {
              icon: TrendingUp,
              label: 'Satisfaction',
              value: `${stats.satisfactionRate}%`,
              change: '+3.2%',
              color: 'text-blue-600',
            },
          ].map((metric, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <p className="text-2xl font-bold mt-2">{metric.value}</p>
                    <p className="text-xs text-green-600 mt-2">{metric.change} this month</p>
                  </div>
                  <metric.icon className={`w-8 h-8 ${metric.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bot Performance */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Bot Performance</CardTitle>
              <CardDescription>Key metrics and statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Avg Confidence</span>
                <span className="text-lg font-bold text-accent">{stats.avgConfidence}%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Avg Response Time</span>
                <span className="text-lg font-bold text-accent">{stats.avgResponseTime}s</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Total Tickets</span>
                <span className="text-lg font-bold text-accent">{stats.totalTickets.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Resolution Rate</span>
                <span className="text-lg font-bold text-green-600">87.2%</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Common Issues</CardTitle>
              <CardDescription>Most frequent support topics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { issue: 'Delivery Delays', count: 342, percentage: 27 },
                { issue: 'Payment Issues', count: 289, percentage: 23 },
                { issue: 'Tracking Problems', count: 198, percentage: 16 },
                { issue: 'Courier Behavior', count: 156, percentage: 12 },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.issue}</span>
                    <span className="text-xs text-muted-foreground">{item.count} tickets</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-accent rounded-full h-2"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent Tickets */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Recent Support Tickets</h2>
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getSentimentIcon(ticket.sentiment)}</span>
                        <div>
                          <p className="font-semibold">{ticket.subject}</p>
                          <p className="text-sm text-muted-foreground">{ticket.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            ticket.status
                          )}`}
                        >
                          {ticket.status.replace('-', ' ')}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            ticket.priority === 'high' || ticket.priority === 'critical'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}
                        >
                          {ticket.priority}
                        </span>
                        {ticket.status === 'bot-responded' && (
                          <span className="text-xs text-muted-foreground">
                            Bot confidence: {ticket.botConfidence}%
                          </span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Box */}
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/10">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-200">Support Bot Status</p>
                <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                  Your AI support bot is running smoothly with 87.2% resolution rate. The bot has resolved 1,087 tickets this month with an average confidence of 87.3%. Complex issues are automatically escalated to human agents.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
