import React, { useMemo, useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, XCircle, Clock, AlertCircle, FileText, Eye, Download, Send } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Admin Onboarding Review Dashboard
 * Admins review and approve/reject courier applications
 * Enhanced with document review, activation, and job assignment
 */

export default function AdminOnboarding() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedApplication, setSelectedApplication] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string | null>(null);
  const [courierFilter, setCourierFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Redirect if not admin
  React.useEffect(() => {
    if (user && user.role !== 'admin') {
      setLocation('/');
    }
  }, [user, setLocation]);

  const { data: applications, isLoading, refetch } = trpc.onboarding.getPendingApplications.useQuery();
  const { data: documents } = trpc.onboarding.getVerificationDocuments.useQuery(
    { userId: selectedApplication || 0 },
    { enabled: selectedApplication !== null && showDocuments }
  );
  const courierSafety = trpc.adminAudit.courierSafety.useQuery(undefined, { retry: false, refetchInterval: 60_000 });

  // Keep the UI resilient if a stale cache or joined response contains the same
  // record more than once. React keys must remain unique within each list.
  const uniqueApplications = applications
    ? Array.from(new Map(applications.map((application) => [application.id, application])).values())
    : applications;
  const uniqueDocuments = documents
    ? Array.from(new Map(documents.map((document: any) => [document.id ?? `${document.documentType}:${document.fileUrl}`, document])).values())
    : documents;
  const courierByUserId = useMemo(() => new Map((courierSafety.data?.couriers ?? []).map((courier) => [courier.userId, courier])), [courierSafety.data?.couriers]);
  const filteredApplications = useMemo(() => {
    const search = courierFilter.trim().toLowerCase();
    return (uniqueApplications ?? []).filter((application) => {
      const courier = courierByUserId.get(application.userId);
      const courierText = [courier?.name, courier?.email, application.userId, application.vehicleRegistration].filter(Boolean).join(' ').toLowerCase();
      const matchesCourier = !search || courierText.includes(search);
      const matchesStatus = statusFilter === 'all' || application.status === statusFilter;
      const hasGps = Boolean(courier?.currentLocation);
      const matchesRegion = regionFilter === 'all' || (regionFilter === 'gps' ? hasGps : !hasGps);
      return matchesCourier && matchesStatus && matchesRegion;
    });
  }, [courierByUserId, courierFilter, regionFilter, statusFilter, uniqueApplications]);

  const approveMutation = trpc.onboarding.approveApplication.useMutation();
  const rejectMutation = trpc.onboarding.rejectApplication.useMutation();
  const activateMutation = trpc.onboarding.activateAccount.useMutation();
  const notifyMutation = trpc.system.notifyOwner.useMutation();

  if (!user || user.role !== 'admin') return null;

  const handleApprove = async (userId: number) => {
    try {
      await approveMutation.mutateAsync({ userId });
      toast.success('Application approved and ready for the next step.');
      refetch();
      setSelectedApplication(null);
    } catch (error) {
      toast.info('The application is taking a moment to update. Please try again.');
    }
  };

  const handleReject = async (userId: number) => {
    if (!rejectReason.trim()) {
      toast.info('Add a short note explaining what information is needed next.');
      return;
    }
    try {
      await rejectMutation.mutateAsync({ userId, reason: rejectReason });
      toast.success('Review completed and next steps recorded.');
      refetch();
      setSelectedApplication(null);
      setRejectReason('');
      setShowRejectForm(false);
    } catch (error) {
      toast.info('The review note is taking a moment to save. Please try again.');
    }
  };

  const handleActivate = async (userId: number) => {
    try {
      await activateMutation.mutateAsync({ userId });
      toast.success('Courier account activated and ready for delivery work.');
      
      // Notify owner
      await notifyMutation.mutateAsync({
        title: 'New Courier Activated',
        content: `Courier #${userId} has been activated and is ready to receive delivery opportunities.`,
      });

      refetch();
      setSelectedApplication(null);
    } catch (error) {
      toast.info('The courier account is taking a moment to update. Please try again.');
    }
  };



  const currentApp = filteredApplications.find((app) => app.id === selectedApplication);

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
    <DashboardLayout>
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-6xl mx-auto flex flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Courier Onboarding</h1>
            <p className="text-muted-foreground mt-1">Vet new driver applications, verify documents, and record approval decisions.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => setLocation('/admin/dashboard')} className="w-full sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to dashboard
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* New courier review queue */}
        <Card className="border-accent/30 bg-card p-4" aria-label="Courier onboarding filters">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <label className="min-w-0 flex-1 text-sm font-semibold text-foreground">Courier
              <input value={courierFilter} onChange={(event) => setCourierFilter(event.target.value)} placeholder="Search name, email, user ID or registration" className="mt-1 h-10 w-full rounded-md border bg-background px-3 font-normal" />
            </label>
            <label className="text-sm font-semibold text-foreground">Region / location
              <select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-3 font-normal lg:w-52">
                <option value="all">All locations</option>
                <option value="gps">GPS location recorded</option>
                <option value="no-gps">No GPS location recorded</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-foreground">Status
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-3 font-normal lg:w-48">
                <option value="all">All statuses</option>
                <option value="pending_approval">Pending approval</option>
                <option value="approved">Approved</option>
                <option value="active">Active</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>
            <Button type="button" variant="outline" onClick={() => { setCourierFilter(''); setRegionFilter('all'); setStatusFilter('all'); }} className="h-10">Clear filters</Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Showing {filteredApplications.length} of {uniqueApplications?.length ?? 0} courier applications. Location filters use the latest persisted GPS record; no region is assumed when GPS is unavailable.</p>
        </Card>
        {!filteredApplications.length ? (
          <Card className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No matching applications</h2>
            <p className="text-muted-foreground">Try a different courier, location, or status filter.</p>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Applications List */}
            <div className="lg:col-span-1">
              <div className="space-y-2">
                {filteredApplications.map((app) => (
                  <Card
                    key={app.id}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedApplication === app.id
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-secondary/50'
                    }`}
                    onClick={() => {
                      setSelectedApplication(app.id);
                      setShowDocuments(false);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">App #{app.id}</p>
                        <p className="text-xs text-muted-foreground">User: {app.userId}</p>
                        <p className="text-xs text-muted-foreground">Region: {app.region ? `${app.region}${app.province ? `, ${app.province}` : ''}` : app.province ?? 'Not recorded'}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(app.startedAt || '').toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          app.status === 'pending_approval'
                            ? 'bg-amber-50 text-amber-900 border-amber-200'
                            : app.status === 'approved'
                              ? 'bg-green-50 text-green-900 border-green-200'
                              : 'bg-red-50 text-red-900 border-red-200'
                        }
                      >
                        {app.status}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Application Details */}
            <div className="lg:col-span-2">
              {currentApp ? (
                <div className="space-y-4">
                  {/* Status Overview */}
                  <Card className="p-6">
                    <h2 className="text-xl font-bold text-foreground mb-4">Application Details</h2>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-3 bg-secondary/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Status</p>
                        <p className="font-semibold text-foreground capitalize">{currentApp.status}</p>
                      </div>
                      <div className="p-3 bg-secondary/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Quiz Score</p>
                        <p className="font-semibold text-foreground">{currentApp.quizScore || 'N/A'}%</p>
                      </div>
                      <div className="p-3 bg-secondary/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Verification</p>
                        <p className="font-semibold text-foreground capitalize">{currentApp.verificationStatus}</p>
                      </div>
                      <div className="p-3 bg-secondary/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Submitted</p>
                        <p className="font-semibold text-foreground text-sm">
                          {new Date(currentApp.startedAt || '').toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Admin Notes */}
                    {currentApp.adminNotes && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <p className="text-sm font-semibold text-blue-900 mb-2">Admin Notes</p>
                        <p className="text-sm text-blue-800">{currentApp.adminNotes}</p>
                      </div>
                    )}
                  </Card>

                  {/* Document Review */}
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Verification Documents
                      </h3>
                      <Button
                        onClick={() => setShowDocuments(!showDocuments)}
                        variant="outline"
                        size="sm"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {showDocuments ? 'Hide' : 'View'}
                      </Button>
                    </div>

                    {showDocuments && documents && documents.length > 0 ? (
                      <div className="space-y-3">
                        {uniqueDocuments?.map((doc: any) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-foreground capitalize">
                                {doc.documentType.replace(/_/g, ' ')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(doc.createdAt || '').toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                <Eye className="w-4 h-4" />
                              </a>
                              <a
                                href={doc.fileUrl}
                                download
                                className="text-primary hover:underline"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {showDocuments ? 'No documents found' : 'Click View to see documents'}
                      </p>
                    )}
                  </Card>

                  {/* Action Buttons */}
                  <Card className="p-6">
                    {(currentApp.status === 'pending_approval' || currentApp.status === 'not_started') ? (
                      showRejectForm ? (
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
                              onClick={() => handleReject(currentApp.userId)}
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
                        <p className="text-sm text-muted-foreground">
                          Documents will appear here once uploaded by courier
                        </p>
                      )
                    ) : currentApp.status === 'approved' ? (
                      <div className="space-y-3">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <p className="text-sm text-green-800">
                            ✓ Application approved. Ready to activate courier account.
                          </p>
                        </div>
                        <Button
                          onClick={() => handleActivate(currentApp.userId)}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          disabled={activateMutation.isPending}
                        >
                          {activateMutation.isPending ? 'Activating...' : 'Activate Courier Account'}
                        </Button>
                      </div>
                    ) : currentApp.status === 'active' ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-800">
                          ✓ Courier account is active and ready to accept jobs.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-800">✗ Application rejected</p>
                      </div>
                    )}
                  </Card>
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select an application to review</p>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </DashboardLayout>
  );
}
