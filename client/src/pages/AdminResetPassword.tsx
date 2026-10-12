import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AdminResetPassword() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const token = new URLSearchParams(search).get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const reset = trpc.adminPasswordReset.reset.useMutation({
    onSuccess: (result) => { setMessage(result.message); setError(""); },
    onError: (err) => { setError(err.message); setMessage(""); },
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!token) return setError("This reset link is missing its security token. Request a new link.");
    if (password.length < 12) return setError("Use at least 12 characters for your new password.");
    if (password !== confirmation) return setError("The passwords do not match.");
    reset.mutate({ token, password });
  };

  return <main className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
    <Card className="w-full max-w-md shadow-2xl"><div className="p-8">
      <div className="text-center mb-8"><div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4"><Lock className="w-8 h-8 text-orange-600" /></div><h1 className="text-2xl font-bold text-gray-900">Create a new admin password</h1><p className="text-gray-600 text-sm mt-2">Your reset link works once and expires after 30 minutes.</p></div>
      {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3"><AlertCircle className="w-5 h-5 text-red-600 shrink-0" /><p className="text-red-700 text-sm">{error}</p></div>}
      {message ? <div className="space-y-4"><div className="p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3"><CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" /><p className="text-green-800 text-sm">{message}</p></div><Button className="w-full" onClick={() => setLocation("/auth")}>Return to sign in</Button></div> : <form onSubmit={submit} className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="new-password">New password</label><Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={12} /></div><div><label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="confirm-password">Confirm new password</label><Input id="confirm-password" type="password" autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} required minLength={12} /></div><Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={reset.isPending}>{reset.isPending ? "Updating password…" : "Update password"}</Button></form>}
      <Button variant="ghost" className="w-full mt-4" onClick={() => setLocation("/auth")}>Back to sign in</Button>
    </div></Card>
  </main>;
}
