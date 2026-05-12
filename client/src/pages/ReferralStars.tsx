import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/_core/hooks/useAuth';
import { Copy, Share2, MessageCircle, Loader2 } from 'lucide-react';

export default function ReferralStars() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Fetch user's referral code
  const { data: referralCode, isLoading: codeLoading } = trpc.referral.getOrCreateCode.useQuery();

  // Fetch user's stars
  const { data: stars, isLoading: starsLoading } = trpc.referral.getStars.useQuery();

  // Fetch star history
  const { data: starHistory, isLoading: historyLoading } = trpc.referral.getStarHistory.useQuery({ limit: 10 });

  // Fetch share link
  const { data: shareLink, isLoading: shareLinkLoading } = trpc.referral.getShareLink.useQuery();

  const handleCopyCode = () => {
    if (referralCode?.code) {
      navigator.clipboard.writeText(referralCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    if (shareLink?.whatsappMessage) {
      const encodedMessage = encodeURIComponent(shareLink.whatsappMessage);
      window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    }
  };

  const handleShareLink = () => {
    if (shareLink?.link) {
      navigator.clipboard.writeText(shareLink.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isLoading = codeLoading || starsLoading || historyLoading || shareLinkLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            🌟 Mzansi Stars
          </h1>
          <p className="text-slate-600">Earn stars by referring friends and completing deliveries</p>
        </div>

        {/* Star Count Card */}
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">⭐</div>
            <div className="text-5xl font-bold text-amber-600 mb-2">
              {isLoading ? <Loader2 className="h-12 w-12 animate-spin mx-auto" /> : stars?.starCount || 0}
            </div>
            <p className="text-slate-700 font-semibold mb-4">Total Stars Earned</p>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-slate-900">{stars?.totalReferred || 0}</p>
                <p className="text-sm text-slate-600">People Referred</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{starHistory?.length || 0}</p>
                <p className="text-sm text-slate-600">Achievements</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Referral Code Section */}
        <Card className="p-6 border-2 border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Your Referral Code</h2>
          <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200">
            <p className="text-sm text-slate-600 mb-2">Share this code with friends:</p>
            <div className="flex items-center gap-2">
              <code className="text-2xl font-mono font-bold text-slate-900 flex-1">
                {isLoading ? '...' : referralCode?.code}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>
          <p className="text-sm text-slate-600">
            ✓ Each friend who signs up with your code earns you <strong>1 star</strong>
          </p>
        </Card>

        {/* Share Section */}
        <Card className="p-6 border-2 border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Share & Earn</h2>
          <div className="space-y-3">
            <Button
              onClick={handleShareWhatsApp}
              className="w-full bg-green-500 hover:bg-green-600 text-white gap-2"
            >
              <MessageCircle className="h-5 w-5" />
              Share via WhatsApp
            </Button>
            <Button
              onClick={handleShareLink}
              variant="outline"
              className="w-full gap-2"
            >
              <Share2 className="h-5 w-5" />
              Copy Share Link
            </Button>
          </div>
        </Card>

        {/* Star History */}
        {starHistory && starHistory.length > 0 && (
          <Card className="p-6 border-2 border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Achievements</h2>
            <div className="space-y-3">
              {starHistory.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⭐</span>
                    <div>
                      <p className="font-semibold text-slate-900 capitalize">
                        {entry.reason?.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm text-slate-600">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-amber-600">+{entry.starsAwarded}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Info Section */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="font-bold text-slate-900 mb-3">How Stars Work</h3>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>✓ <strong>Referral Signup:</strong> +1 star when someone signs up with your code</li>
            <li>✓ <strong>First Delivery:</strong> +1 star when your referral completes their first delivery</li>
            <li>✓ <strong>Unlock Badges:</strong> Reach milestones to unlock special badges</li>
            <li>✓ <strong>Leaderboard:</strong> Top referrers get featured in our community</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
