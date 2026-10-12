import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { useState } from 'react';
import { Gift, Share2, TrendingUp, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function CourierReferralSection() {
  const [copied, setCopied] = useState(false);
  
  const statsQuery = trpc.courierReferral.getStats.useQuery();
  const referralsQuery = trpc.courierReferral.getMyReferrals.useQuery();
  const shareLinkQuery = trpc.courierReferral.getShareLink.useQuery();

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    if (shareLinkQuery.data?.whatsappLink) {
      window.open(shareLinkQuery.data.whatsappLink, '_blank');
    }
  };

  const handleShareSMS = () => {
    if (shareLinkQuery.data?.smsText) {
      window.location.href = `sms:?body=${encodeURIComponent(shareLinkQuery.data.smsText)}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Gift className="w-6 h-6 text-green-600" />
          Courier Referral Bonuses
        </h2>
        <p className="text-muted-foreground mt-1">Earn R50-R100 for each courier you refer</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Earned</p>
              <p className="text-3xl font-bold text-green-600">R{statsQuery.data?.totalEarned || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Referrals</p>
              <p className="text-3xl font-bold text-accent">{statsQuery.data?.totalReferrals || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Pending Bonuses</p>
              <p className="text-3xl font-bold text-orange-600">{statsQuery.data?.pendingBonuses || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Earned Bonuses</p>
              <p className="text-3xl font-bold text-blue-600">{statsQuery.data?.earnedBonuses || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-blue-900">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center font-bold">1</div>
            <p>Share your unique referral code with other couriers</p>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center font-bold">2</div>
            <p>They sign up and use your code during onboarding</p>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center font-bold">3</div>
            <p>When they complete 10 deliveries, you earn your bonus!</p>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center font-bold">4</div>
            <p>Bonus is automatically added to your earnings account</p>
          </div>
        </CardContent>
      </Card>

      {/* Share Section */}
      <Card className="border-accent/50 bg-gradient-to-br from-background to-accent/5">
        <CardHeader>
          <CardTitle>Share Your Code</CardTitle>
          <CardDescription>Invite other couriers to earn your bonus</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Code Display */}
          {shareLinkQuery.data && (
            <div className="flex items-center gap-2 p-3 bg-background border border-input rounded-lg">
              <code className="flex-1 font-mono font-bold text-accent">{shareLinkQuery.data.code}</code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyCode(shareLinkQuery.data!.code)}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          )}

          {/* Share Buttons */}
          <div className="grid md:grid-cols-2 gap-3">
            <Button onClick={handleShareWhatsApp} className="gap-2" size="lg">
              <Share2 className="w-4 h-4" />
              Share on WhatsApp
            </Button>
            <Button onClick={handleShareSMS} variant="outline" className="gap-2" size="lg">
              <Share2 className="w-4 h-4" />
              Share via SMS
            </Button>
          </div>

          {/* Message Preview */}
          {shareLinkQuery.data && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Message preview:</p>
              <p className="text-sm">{shareLinkQuery.data.message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Referrals */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold">Your Active Referrals</h3>
        {referralsQuery.isLoading ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Loading referrals...
            </CardContent>
          </Card>
        ) : referralsQuery.data && referralsQuery.data.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-3">No referrals yet. Start sharing your code!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {referralsQuery.data?.map((referral) => (
              <Card key={referral.id} className="border-l-4 border-l-accent">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm">Courier: {referral.referredCourierId}</p>
                        <p className="text-xs text-muted-foreground">
                          Referred {referral.createdAt ? new Date(referral.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <Badge
                        className={`${
                          referral.bonusStatus === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : referral.bonusStatus === 'earned'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {referral.bonusStatus === 'paid'
                          ? 'Bonus Paid'
                          : referral.bonusStatus === 'earned'
                          ? 'Bonus Earned'
                          : 'In Progress'}
                      </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {referral.deliveriesProgress}/{referral.deliveryThreshold} deliveries
                        </span>
                        <span className="font-semibold text-accent">
                          R{referral.bonusAmount}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-accent h-full transition-all"
                          style={{ width: `${referral.progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Status Message */}
                    {referral.bonusStatus === 'pending' && (
                      <p className="text-xs text-muted-foreground">
                        {referral.deliveryThreshold - referral.deliveriesProgress} more deliveries needed to earn bonus
                      </p>
                    )}
                    {referral.bonusStatus === 'earned' && (
                      <p className="text-xs text-blue-600 font-semibold">
                        Bonus earned! Waiting for payout processing...
                      </p>
                    )}
                    {referral.bonusStatus === 'paid' && (
                      <p className="text-xs text-green-600 font-semibold">
                        Bonus paid on {referral.bonusEarnedAt ? new Date(referral.bonusEarnedAt).toLocaleDateString() : 'N/A'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Bonus Tiers */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-900">Bonus Tiers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-green-900">
          <div className="flex justify-between">
            <span>Standard Bonus (1-5 referrals)</span>
            <span className="font-bold">R50 each</span>
          </div>
          <div className="flex justify-between">
            <span>Premium Bonus (6-10 referrals)</span>
            <span className="font-bold">R75 each</span>
          </div>
          <div className="flex justify-between">
            <span>Elite Bonus (11+ referrals)</span>
            <span className="font-bold">R100 each</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
