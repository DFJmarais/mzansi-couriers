import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export function AdminReferralConfig() {
  const [activeTab, setActiveTab] = useState("levels");
  const [editingLevel, setEditingLevel] = useState<string | null>(null);

  // Ambassador Levels Configuration
  const ambassadorLevels = [
    { id: "beginner", name: "Beginner", icon: "🌱", minReferrals: 0, multiplier: 1.0, benefits: ["Basic rewards", "Community access"] },
    { id: "bronze", name: "Bronze", icon: "🥉", minReferrals: 5, multiplier: 1.1, benefits: ["1.1x rewards", "Priority support"] },
    { id: "silver", name: "Silver", icon: "🥈", minReferrals: 10, multiplier: 1.25, benefits: ["1.25x rewards", "Exclusive events"] },
    { id: "gold", name: "Gold", icon: "🥇", minReferrals: 25, multiplier: 1.5, benefits: ["1.5x rewards", "VIP access", "Monthly bonus"] },
    { id: "platinum", name: "Platinum", icon: "💎", minReferrals: 50, multiplier: 1.75, benefits: ["1.75x rewards", "Concierge support", "Annual bonus"] },
    { id: "diamond", name: "Diamond", icon: "👑", minReferrals: 100, multiplier: 2.0, benefits: ["2.0x rewards", "Personal manager", "Quarterly bonus"] },
  ];

  // Reward Configuration
  const rewardConfig = {
    referrerReward: 500,
    refereeReward: 200,
    refereeFirstDeliveryBonus: 100,
    ambassadorBonusPercentage: 5,
  };

  // Fraud Detection Settings
  const fraudSettings = [
    { id: "fake_accounts", name: "Fake Account Detection", enabled: true, sensitivity: "High" },
    { id: "duplicate_detection", name: "Duplicate Account Detection", enabled: true, sensitivity: "High" },
    { id: "self_referral", name: "Self-Referral Prevention", enabled: true, sensitivity: "Critical" },
    { id: "referral_loops", name: "Referral Loop Detection", enabled: true, sensitivity: "High" },
    { id: "banking_fraud", name: "Banking Fraud Detection", enabled: true, sensitivity: "Critical" },
    { id: "suspicious_activity", name: "Suspicious Activity Monitoring", enabled: true, sensitivity: "Medium" },
  ];

  // Achievement Configuration
  const achievements = [
    { id: "first_referral", name: "First Referral", icon: "🎉", reward: 50, description: "Refer your first person" },
    { id: "five_referrals", name: "Five Referrals", icon: "🌟", reward: 100, description: "Refer 5 people" },
    { id: "ten_referrals", name: "Ten Referrals", icon: "⭐", reward: 200, description: "Refer 10 people" },
    { id: "referral_master", name: "Referral Master", icon: "👑", reward: 500, description: "Refer 50 people" },
    { id: "community_builder", name: "Community Builder", icon: "🏘️", reward: 300, description: "Build active community" },
    { id: "trusted_ambassador", name: "Trusted Ambassador", icon: "🤝", reward: 400, description: "Maintain 95%+ satisfaction" },
    { id: "growth_champion", name: "Growth Champion", icon: "🚀", reward: 250, description: "100% monthly growth" },
    { id: "loyalty_hero", name: "Loyalty Hero", icon: "💪", reward: 350, description: "6+ months active" },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Referral Program Configuration</h1>
        <p className="text-gray-600 mt-2">Manage ambassador levels, rewards, and fraud detection</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="levels">Levels</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="fraud">Fraud Detection</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        {/* Ambassador Levels Tab */}
        <TabsContent value="levels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ambassador Levels</CardTitle>
              <CardDescription>Configure level requirements and benefits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {ambassadorLevels.map((level) => (
                <div key={level.id} className="p-4 border rounded-lg hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">{level.icon}</span>
                        <div>
                          <h3 className="font-bold text-lg">{level.name}</h3>
                          <p className="text-sm text-gray-600">{level.minReferrals}+ referrals</p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap mt-2">
                        {level.benefits.map((benefit, idx) => (
                          <Badge key={idx} variant="outline">
                            {benefit}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-600">{level.multiplier}x</p>
                      <p className="text-sm text-gray-600">Multiplier</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reward Configuration</CardTitle>
              <CardDescription>Set reward amounts and bonuses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border rounded-lg">
                  <label className="block text-sm font-medium mb-2">Referrer Reward (R)</label>
                  <input
                    type="number"
                    value={rewardConfig.referrerReward}
                    className="w-full px-3 py-2 border rounded-lg"
                    readOnly
                  />
                  <p className="text-xs text-gray-600 mt-1">Amount paid to referrer per successful referral</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <label className="block text-sm font-medium mb-2">Referee Reward (R)</label>
                  <input
                    type="number"
                    value={rewardConfig.refereeReward}
                    className="w-full px-3 py-2 border rounded-lg"
                    readOnly
                  />
                  <p className="text-xs text-gray-600 mt-1">Amount paid to new user on signup</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <label className="block text-sm font-medium mb-2">First Delivery Bonus (R)</label>
                  <input
                    type="number"
                    value={rewardConfig.refereeFirstDeliveryBonus}
                    className="w-full px-3 py-2 border rounded-lg"
                    readOnly
                  />
                  <p className="text-xs text-gray-600 mt-1">Bonus for referee's first delivery</p>
                </div>

                <div className="p-4 border rounded-lg">
                  <label className="block text-sm font-medium mb-2">Ambassador Bonus (%)</label>
                  <input
                    type="number"
                    value={rewardConfig.ambassadorBonusPercentage}
                    className="w-full px-3 py-2 border rounded-lg"
                    readOnly
                  />
                  <p className="text-xs text-gray-600 mt-1">Monthly bonus for top ambassadors</p>
                </div>
              </div>

              <Button className="w-full">Update Rewards</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fraud Detection Tab */}
        <TabsContent value="fraud" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fraud Detection Settings</CardTitle>
              <CardDescription>Configure fraud detection mechanisms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fraudSettings.map((setting) => (
                <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{setting.name}</h3>
                    <Badge className={setting.sensitivity === "Critical" ? "bg-red-600" : "bg-yellow-600"}>
                      {setting.sensitivity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm font-medium ${setting.enabled ? "text-green-600" : "text-red-600"}`}>
                      {setting.enabled ? "Enabled" : "Disabled"}
                    </span>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Achievement Configuration</CardTitle>
              <CardDescription>Manage achievement badges and rewards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className="p-4 border rounded-lg hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{achievement.icon}</span>
                        <div>
                          <h3 className="font-bold">{achievement.name}</h3>
                          <p className="text-xs text-gray-600">{achievement.description}</p>
                        </div>
                      </div>
                      <Badge className="bg-orange-600">+R{achievement.reward}</Badge>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Active Ambassadors</p>
            <p className="text-2xl font-bold">1,247</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Referrals</p>
            <p className="text-2xl font-bold">12,450</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fraud Detection Rate</p>
            <p className="text-2xl font-bold">2.3%</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Program Health</p>
            <p className="text-2xl font-bold text-green-600">Excellent</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
