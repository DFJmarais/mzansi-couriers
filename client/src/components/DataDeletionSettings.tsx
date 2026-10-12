import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Trash2, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import { clearNativeSessionToken } from '@/lib/native-secure-storage';

const CONFIRMATION = 'DELETE MY ACCOUNT';

export const DataDeletionSettings: React.FC = () => {
  const [, navigate] = useLocation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteAccount = trpc.auth.deleteAccount.useMutation();

  const handleDeleteAccount = async () => {
    if (confirmText !== CONFIRMATION) {
      setDeleteError(`Please type "${CONFIRMATION}" to confirm.`);
      return;
    }

    setDeleteError(null);
    try {
      await deleteAccount.mutateAsync({ confirmation: CONFIRMATION });
      await clearNativeSessionToken();
      setDeleteSuccess(true);
      setShowDeleteDialog(false);
      window.setTimeout(() => navigate('/'), 1200);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'We could not complete account deletion. Please try again.');
    }
  };

  if (deleteSuccess) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700"><CheckCircle className="h-5 w-5" />Account deleted</CardTitle>
        </CardHeader>
        <CardContent><p className="text-green-700">Your personal account data has been removed and you have been signed out.</p></CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700"><Trash2 className="h-5 w-5" />Delete account</CardTitle>
        <CardDescription>Remove your personal account information from Mzansi Couriers.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700"><strong>This cannot be undone.</strong> Personal profile, saved addresses, preferences, notifications, payment methods, and courier profile data will be removed. Delivery records may be retained where required for custody, payment, tax, or dispute records, without your personal identity.</AlertDescription>
        </Alert>
        <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} className="w-full"><Trash2 className="mr-2 h-4 w-4" />Delete my account</Button>
      </CardContent>
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-700">Confirm account deletion</DialogTitle>
            <DialogDescription>Type the exact phrase below. You will be signed out immediately.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="border-red-200 bg-red-50"><AlertCircle className="h-4 w-4 text-red-600" /><AlertDescription className="text-sm text-red-700">Type "{CONFIRMATION}" to confirm.</AlertDescription></Alert>
            <input type="text" autoComplete="off" placeholder={CONFIRMATION} value={confirmText} onChange={(event) => { setConfirmText(event.target.value); setDeleteError(null); }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono" aria-label="Account deletion confirmation" />
            {deleteError ? <Alert className="border-red-200 bg-red-50"><AlertCircle className="h-4 w-4 text-red-600" /><AlertDescription className="text-sm text-red-700">{deleteError}</AlertDescription></Alert> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setConfirmText(''); setDeleteError(null); }} disabled={deleteAccount.isPending}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteAccount.isPending || confirmText !== CONFIRMATION}>{deleteAccount.isPending ? 'Deleting…' : 'Delete account'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
