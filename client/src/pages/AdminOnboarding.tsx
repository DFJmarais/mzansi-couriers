import React, { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, AlertCircle, FileText } from 'lucide-react';

/**
 * Admin Onboarding Review Dashboard
 * Admins review and approve/reject courier applications
 */

export default function AdminOnboarding() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedApplication, setSelectedApplication] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Redirect if not admin
  React.useEffect(() => {
    if (user && user.role !== 'admin') {
      setLocation('/');
    }
  }, [user, setLocation]);

  const { data: applications, isLoading, refetch } = trpc.onboarding.getPendingApplications.useQuery();
  const approveMutation = trpc.onboarding.approveApplication.useMutation();
  const rejectMutation = trpc.onboarding.rejectApplication.useMutation();

  if (!user || user.role !== 'admin') return null;

  const handleApprove = async (userId: number) => {
    try {
      await approveMutation.mutateAsync({ userId });
      refetch();
      setSelectedApplication(null);
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleReject = async (userId: number) => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    try {
      await rejectMutation.mutateAsync({ userId, reason: rejectReason });
      refetch();
      setSelectedApplication(null);
      setRejectReason('');
      setShowRejectForm(false);
    } catch (error) {
      console.error('Failed to reject:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-3 animate-spin" />
            <p className="text-muted-foreground">Loading applications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-foreground">Courier Onboarding Review</h1>
          <p className="text-muted-foreground mt-1">Review and approve new courier applications</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {!applications || applications.length === 0 ? (
          <Card className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">All Caught Up!</h2>
            <p className="text-muted-foreground">No pending applications to review</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {applications.map((app) => (
              <Card key={app.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Application #{app.id}</h3>
                    <p className="text-sm text-muted-foreground">User ID: {app.userId}</p>
                  </div>
                  <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-200">
                    Pending Review
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-3 bg-secondary/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <p className="font-semibold text-foreground capitalize">{app.status}</p>
                  </div>
                  <div className="p-3 bg-secondary/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Quiz Score</p>
                    <p className="font-semibold text-foreground">{app.quizScore || 'N/A'}%</p>
                  </div>
                  <div className="p-3 bg-secondary/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Verification</p>
                    <p className="font-semibold text-foreground capitalize">{app.verificationStatus}</p>
                  </div>
                  <div className="p-3 bg-secondary/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Submitted</p>
                    <p className="font-semibold text-foreground text-sm">
                      {new Date(app.startedAt || '').toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Admin Notes */}
                {app.adminNotes && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm font-semibold text-blue-900 mb-2">Admin Notes</p>
                    <p className="text-sm text-blue-800">{app.adminNotes}</p>
                  </div>
                )}

                {/* Action Buttons */}
                {selectedApplication === app.id ? (
                  <div className="space-y-4">
                    {showRejectForm ? (
                      <div className="space-y-3">
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Enter rejection reason..."
                          className="w-full p-3 border rounded-lg text-foreground bg-background"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleReject(app.userId)}
                            variant="destructive"
                            className="flex-1"
                            disabled={rejectMutation.isPending}
                          >
                            {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
                          </Button>
                          <Button
                            onClick={() => {
                              setShowRejectForm(false);
                              setRejectReason('');
                            }}
                            variant="outline"
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApprove(app.userId)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          disabled={approveMutation.isPending}
                        >
                          {approveMutation.isPending ? 'Approving...' : 'Approve'}
                        </Button>
                        <Button
                          onClick={() => setShowRejectForm(true)}
                          variant="destructive"
                          className="flex-1"
                        >
                          Reject
                        </Button>
                        <Button
                          onClick={() => setSelectedApplication(null)}
                          variant="outline"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={() => setSelectedApplication(app.id)}
                    variant="outline"
                    className="w-full"
                  >
                    Review Application
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
