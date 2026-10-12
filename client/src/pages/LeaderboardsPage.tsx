import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export function LeaderboardsPage() {
  const [selectedCategory, setSelectedCategory] = useState("top_ambassadors");
  const [period, setPeriod] = useState<"monthly" | "lifetime">("monthly");

  // Fetch leaderboard
  const { data: leaderboard, isLoading } = trpc.leaderboards.getMonthlyLeaderboard.useQuery({
    category: selectedCategory as any,
    limit: 100,
  });

  // Fetch user position
  const { data: userPosition } = trpc.leaderboards.getUserPosition.useQuery({
    category: selectedCategory,
    period,
  });

  // Fetch categories
  const { data: categories } = trpc.leaderboards.getCategories.useQuery();

  const categoryIcons: Record<string, string> = {
    top_ambassadors: "🌟",
    top_partners: "🤝",
    top_businesses: "💼",
    top_referrers: "📢",
    highest_rated: "⭐",
    most_deliveries: "📦",
    fastest_delivery: "⚡",
    carbon_champions: "🌱",
    community_builders: "🏘️",
    rising_stars: "🚀",
  };

  const getRankMedal = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Leaderboards</h1>
        <p className="text-gray-600 mt-2">Compete with the Mzansi Couriers community</p>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
          {categories?.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
              <span className="hidden sm:inline">{cat.icon}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Period Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setPeriod("monthly")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            period === "monthly"
              ? "bg-orange-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setPeriod("lifetime")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            period === "lifetime"
              ? "bg-orange-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Lifetime
        </button>
      </div>

      {/* User Position Card */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Your ranking position will appear here when verified leaderboard data is available.</p>
        </CardContent>
      </Card>

      {/* Leaderboard Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top 100 {categoryIcons[selectedCategory as keyof typeof categoryIcons]}</CardTitle>
          <CardDescription>See how you rank against other users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leaderboard?.leaderboard?.map((entry: any, idx: number) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-4 rounded-lg border transition ${
                  entry.rank <= 3 ? "bg-yellow-50 border-yellow-200" : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="text-2xl font-bold w-12 text-center">{getRankMedal(entry.rank)}</div>
                  <div className="flex-1">
                    <p className="font-bold">{entry.name}</p>
                    <p className="text-sm text-gray-600">{entry.badge}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-2xl font-bold">{entry.value}</p>
                    {entry.monthlyChange && (
                      <p className={`text-sm ${entry.monthlyChangePercent > 0 ? "text-green-600" : "text-red-600"}`}>
                        {entry.monthlyChange} ({entry.monthlyChangePercent}%)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recognition Section */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Recognition</CardTitle>
          <CardDescription>Recognition appears here when verified ranking data is available.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No verified recognition results are available yet.</p>
        </CardContent>
      </Card>
    </div>
  );
}
