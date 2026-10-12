import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import { Users, MessageSquare, TrendingUp, Send, Target, BarChart3 } from 'lucide-react';

/**
 * Outreach Campaigns Dashboard
 * 
 * Manage AI-powered recruitment and awareness campaigns
 * Monitor performance and ROI
 */

interface Campaign {
  id: string;
  name: string;
  type: 'recruitment' | 'awareness';
  status: 'active' | 'paused' | 'completed';
  targetCount: number;
  sentCount: number;
  responseCount: number;
  conversionCount: number;
  createdAt: number;
  performance: {
    responseRate: number;
    conversionRate: number;
    roi: number;
  };
}

export default function OutreachCampaigns() {
  // Campaigns remain empty until connected to verified campaign records.
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showNewCampaignForm, setShowNewCampaignForm] = useState(false);

  const totalStats = {
    activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
    totalSent: campaigns.reduce((sum, c) => sum + c.sentCount, 0),
    totalConversions: campaigns.reduce((sum, c) => sum + c.conversionCount, 0),
    avgConversionRate: campaigns.length === 0 ? "0.0" : (campaigns.reduce((sum, c) => sum + c.performance.conversionRate, 0) / campaigns.length).toFixed(1),
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Outreach Campaigns</h1>
            <p className="text-muted-foreground">AI-powered recruitment and awareness campaigns</p>
          </div>
          <Button onClick={() => setShowNewCampaignForm(!showNewCampaignForm)} className="gap-2">
            <Send className="w-4 h-4" />
            New Campaign
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { icon: Target, label: 'Active Campaigns', value: totalStats.activeCampaigns },
            { icon: Send, label: 'Total Sent', value: totalStats.totalSent.toLocaleString() },
            { icon: Users, label: 'Total Conversions', value: totalStats.totalConversions },
            { icon: TrendingUp, label: 'Avg Conversion Rate', value: `${totalStats.avgConversionRate}%` },
          ].map((metric, i) => (
            <Card key={i} className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <p className="text-2xl font-bold mt-2">{metric.value}</p>
                  </div>
                  <metric.icon className="w-8 h-8 text-accent/50" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* New Campaign Form */}
        {showNewCampaignForm && (
          <Card className="border-accent/50 bg-accent/5">
            <CardHeader>
              <CardTitle>Create New Campaign</CardTitle>
              <CardDescription>Set up a new recruitment or awareness campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Campaign Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Cape Town Courier Recruitment"
                    className="w-full mt-2 px-3 py-2 border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Campaign Type</label>
                  <select className="w-full mt-2 px-3 py-2 border border-border rounded-lg">
                    <option value="recruitment">Courier Recruitment</option>
                    <option value="awareness">Customer Awareness</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Target Location</label>
                  <input
                    type="text"
                    placeholder="e.g., Johannesburg"
                    className="w-full mt-2 px-3 py-2 border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Target Count</label>
                  <input
                    type="number"
                    placeholder="e.g., 500"
                    className="w-full mt-2 px-3 py-2 border border-border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowNewCampaignForm(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowNewCampaignForm(false)}>Close until campaign storage is connected</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Campaigns List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Active & Recent Campaigns</h2>
          <div className="space-y-3">
            {campaigns.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No verified outreach campaigns are available yet.</p>
              </Card>
            ) : campaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="border-border/50 cursor-pointer hover:border-accent/50 transition-all"
                onClick={() => setSelectedCampaign(campaign)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10">
                          {campaign.type === 'recruitment' ? (
                            <Users className="w-5 h-5 text-accent" />
                          ) : (
                            <MessageSquare className="w-5 h-5 text-accent" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">{campaign.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {campaign.type === 'recruitment' ? 'Courier Recruitment' : 'Customer Awareness'}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">
                            {campaign.sentCount} / {campaign.targetCount}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-accent rounded-full h-2"
                            style={{ width: `${(campaign.sentCount / campaign.targetCount) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="p-2 bg-muted/50 rounded">
                          <p className="text-xs text-muted-foreground">Response Rate</p>
                          <p className="text-lg font-bold text-accent">{campaign.performance.responseRate.toFixed(1)}%</p>
                        </div>
                        <div className="p-2 bg-muted/50 rounded">
                          <p className="text-xs text-muted-foreground">Conversions</p>
                          <p className="text-lg font-bold text-green-600">{campaign.conversionCount}</p>
                        </div>
                        <div className="p-2 bg-muted/50 rounded">
                          <p className="text-xs text-muted-foreground">ROI</p>
                          <p className="text-lg font-bold text-blue-600">{campaign.performance.roi}%</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          campaign.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : campaign.status === 'paused'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}
                      >
                        {campaign.status}
                      </span>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Campaign Details */}
        {selectedCampaign && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>{selectedCampaign.name}</CardTitle>
              <CardDescription>Campaign performance and details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Detailed Stats */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Total Targets</span>
                    <span className="text-lg font-bold">{selectedCampaign.targetCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Messages Sent</span>
                    <span className="text-lg font-bold">{selectedCampaign.sentCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Responses</span>
                    <span className="text-lg font-bold text-blue-600">{selectedCampaign.responseCount}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Conversions</span>
                    <span className="text-lg font-bold text-green-600">{selectedCampaign.conversionCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Conversion Rate</span>
                    <span className="text-lg font-bold">{selectedCampaign.performance.conversionRate.toFixed(2)}%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">ROI</span>
                    <span className="text-lg font-bold text-accent">{selectedCampaign.performance.roi}%</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-4 border-t border-border">
                <Button variant="outline">Pause Campaign</Button>
                <Button variant="outline">Export Results</Button>
                <Button>Continue Campaign</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Box */}
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/10">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <BarChart3 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 dark:text-blue-200">Outreach Campaign Status</p>
                <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                  You have {totalStats.activeCampaigns} active campaigns with {totalStats.totalConversions} total conversions. The AI bots are continuously optimizing messages for better engagement and conversion rates.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
