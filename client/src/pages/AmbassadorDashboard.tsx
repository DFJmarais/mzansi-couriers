import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function AmbassadorDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch ambassador status
  const { data: ambassadorStatus, isLoading: statusLoading } = trpc.ambassador.getAmbassadorStatus.useQuery();

  // Fetch referral code
  const { data: referralCode } = trpc.ambassador.getReferralCode.useQuery();

  // Fetch rewards history
  const { data: rewardsHistory } = trpc.ambassador.getRewardsHistory.useQuery();

  // Fetch achievements
  const { data: achievements } = trpc.ambassador.getAchievements.useQuery();

  // Fetch AI recommendations
  const { data: aiRecommendations } = trpc.ambassador.getAIRecommendations.useQuery();

  // Charts only use verified account data; empty responses remain empty.
  const referralTrend: Array<{ month: string; referrals: number; active: number }> = [];
  const rewardDistribution: Array<{ type: string; value: number }> = [];
  const verifiedRewards = (rewardsHistory?.rewards ?? []) as Array<{
    refereeName: string;
    createdAt: string | Date;
    amount: number;
    status: string;
  }>;
  const verifiedAchievements = (achievements?.achievements ?? []) as Array<{
    icon: string;
    name: string;
    description: string;
    unlockedAt: string | Date;
  }>;

  if (statusLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ambassador Dashboard</h1>
          <p className="text-gray-600 mt-2">Grow your network and earn rewards</p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-orange-600">{ambassadorStatus?.level}</div>
          <p className="text-gray-600">Ambassador Level</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ambassadorStatus?.totalReferrals || 0}</div>
            <p className="text-xs text-gray-500 mt-1">+2 this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ambassadorStatus?.activeReferrals || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Actively using platform</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{ambassadorStatus?.totalRewardsEarned || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Lifetime rewards</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Reward Multiplier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ambassadorStatus?.rewardMultiplier}x</div>
            <p className="text-xs text-gray-500 mt-1">Based on level</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Referral Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Referral Trend</CardTitle>
                <CardDescription>Your referral growth over time</CardDescription>
              </CardHeader>
              <CardContent>
                {referralTrend.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No verified referral history is available yet.</p>
                ) : <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={referralTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="referrals" stroke="#ff6b35" name="Total Referrals" />
                    <Line type="monotone" dataKey="active" stroke="#4CAF50" name="Active" />
                  </LineChart>
                </ResponsiveContainer>}
              </CardContent>
            </Card>

            {/* Progress to Next Level */}
            <Card>
              <CardHeader>
                <CardTitle>Progress to Next Level</CardTitle>
                <CardDescription>Keep growing to unlock new benefits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Current Level: {ambassadorStatus?.level}</span>
                    <span className="text-sm text-gray-600">{ambassadorStatus?.progressToNextLevel}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-600 h-2 rounded-full transition-all"
                      style={{ width: `${ambassadorStatus?.progressToNextLevel || 0}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  <p>{ambassadorStatus?.progressToNextLevel != null ? "Progress is calculated from your verified ambassador activity." : "Verified milestone data is not available yet."}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>AI Growth Recommendations</CardTitle>
              <CardDescription>Personalized strategies to increase referrals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {aiRecommendations?.recommendations?.map((rec: any, idx: number) => (
                  <div key={idx} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="font-medium text-sm">{typeof rec === 'string' ? rec : rec.action}</p>
                  </div>
                )) || <p className="text-gray-600">Loading recommendations...</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Referral Code</CardTitle>
              <CardDescription>Share this code to earn rewards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-100 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Referral Code</p>
                  <p className="text-2xl font-bold font-mono">{referralCode?.code}</p>
                </div>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(referralCode?.code || "");
                    alert("Copied to clipboard!");
                  }}
                >
                  Copy
                </Button>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Referral Link</p>
                <p className="text-sm text-gray-700 break-all">{referralCode?.referralLink}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">{referralCode?.totalReferrals}</p>
                  <p className="text-xs text-gray-600">Total Referrals</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{referralCode?.activeReferrals}</p>
                  <p className="text-xs text-gray-600">Active Users</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">R{referralCode?.totalRewardsEarned}</p>
                  <p className="text-xs text-gray-600">Earned</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Reward Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {rewardDistribution.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No verified reward history is available yet.</p>
                ) : <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={rewardDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#ff6b35" />
                  </BarChart>
                </ResponsiveContainer>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rewards Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Earned</span>
                  <span className="font-bold">R{ambassadorStatus?.totalRewardsEarned}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pending Rewards</span>
                  <span className="font-bold">R{rewardsHistory?.pendingRewards}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid Out</span>
                  <span className="font-bold">R{(ambassadorStatus?.totalRewardsEarned || 0) - (rewardsHistory?.pendingRewards || 0)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Rewards */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {verifiedRewards.map((reward, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 border-b">
                    <div>
                      <p className="font-medium">{reward.refereeName}</p>
                      <p className="text-sm text-gray-600">{new Date(reward.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">R{reward.amount}</p>
                      <p className={`text-xs ${reward.status === "paid" ? "text-green-600" : "text-yellow-600"}`}>
                        {reward.status}
                      </p>
                    </div>
                  </div>
                )) || <p className="text-gray-600">No rewards yet</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {verifiedAchievements.map((achievement, idx) => (
              <Card key={idx} className="border-2 border-yellow-400">
                <CardHeader className="pb-2">
                  <div className="text-4xl mb-2">{achievement.icon}</div>
                  <CardTitle className="text-lg">{achievement.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Reward details available when verified</span>
                    <span className="text-xs text-gray-500">{new Date(achievement.unlockedAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            )) || <p className="text-gray-600">No achievements yet</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
