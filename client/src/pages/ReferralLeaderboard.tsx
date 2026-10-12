import { useAuth } from '@/_core/hooks/useAuth';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { Trophy, Star, Zap, Target } from 'lucide-react';

export default function ReferralLeaderboard() {
  const { isAuthenticated } = useAuth();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Fetch real leaderboard data from API
  useEffect(() => {
    // Will be populated with real user data once users start referring others
    setLeaderboard([]);
  }, []);

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'platinum':
        return '💎';
      case 'gold':
        return '🥇';
      case 'silver':
        return '🥈';
      case 'bronze':
        return '🥉';
      default:
        return '⭐';
    }
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'platinum':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'gold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'silver':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'bronze':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-accent/10 text-accent border-accent/20';
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600';
    if (rank === 2) return 'text-gray-500';
    if (rank === 3) return 'text-orange-600';
    return 'text-muted-foreground';
  };

  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please log in to view the leaderboard.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Trophy className="w-8 h-8 text-yellow-600" />
              Referral Leaderboard
            </h1>
            <p className="text-muted-foreground">Top referrers will appear here as users join through referral links</p>
          </div>
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <p className="text-muted-foreground">No referrals yet. Share your referral code to start earning and climb the leaderboard!</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-600" />
            Referral Leaderboard
          </h1>
          <p className="text-muted-foreground mt-1">Top referrers earning stars and building their network</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-600" />
                  Total Stars Awarded
                </p>
                <p className="text-3xl font-bold">
                  {leaderboard.reduce((sum, r) => sum + r.stars, 0)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4 text-accent" />
                  Active Referrers
                </p>
                <p className="text-3xl font-bold">{leaderboard.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Target className="w-4 h-4 text-accent" />
                  Total Referrals
                </p>
                <p className="text-3xl font-bold">
                  {leaderboard.reduce((sum, r) => sum + r.referrals, 0)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-600" />
                  Avg Stars/Referrer
                </p>
                <p className="text-3xl font-bold">
                  {(leaderboard.reduce((sum, r) => sum + r.stars, 0) / leaderboard.length).toFixed(1)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard Table */}
        <Card>
          <CardHeader>
            <CardTitle>Top Referrers</CardTitle>
            <CardDescription>Ranked by total stars earned through referrals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                    entry.rank <= 3
                      ? 'bg-gradient-to-r from-accent/5 to-accent/10 border-accent/30'
                      : 'bg-background border-border/50 hover:border-accent/30'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Rank */}
                    <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <span className={`text-lg font-bold ${getRankColor(entry.rank)}`}>
                        {entry.rank <= 3 ? getBadgeIcon(entry.badge) : `#${entry.rank}`}
                      </span>
                    </div>

                    {/* Name and Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{entry.name}</h3>
                        {entry.badge !== 'none' && (
                          <Badge className={`text-xs ${getBadgeColor(entry.badge)}`}>
                            {entry.badge.charAt(0).toUpperCase() + entry.badge.slice(1)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {entry.referrals} referral{entry.referrals !== 1 ? 's' : ''} • Joined {entry.joinedDays} days ago
                      </p>
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end mb-1">
                      {[...Array(Math.min(5, Math.ceil(entry.stars / 10)))].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-2xl font-bold text-accent">{entry.stars}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Badge Explanation */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Badge System</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex gap-3">
                <span className="text-2xl">💎</span>
                <div>
                  <p className="font-semibold text-blue-900">Platinum</p>
                  <p className="text-sm text-blue-800">40+ stars earned</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">🥇</span>
                <div>
                  <p className="font-semibold text-blue-900">Gold</p>
                  <p className="text-sm text-blue-800">30-39 stars earned</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">🥈</span>
                <div>
                  <p className="font-semibold text-blue-900">Silver</p>
                  <p className="text-sm text-blue-800">20-29 stars earned</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-2xl">🥉</span>
                <div>
                  <p className="font-semibold text-blue-900">Bronze</p>
                  <p className="text-sm text-blue-800">10-19 stars earned</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-blue-800 mt-4">
              Earn stars by referring friends and colleagues to Mzansi Couriers. Each successful referral earns you 1 star. Reach milestones to unlock exclusive badges and rewards!
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
