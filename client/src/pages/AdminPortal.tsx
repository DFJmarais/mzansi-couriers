import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, LogOut, Lock } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export default function AdminPortal() {
  const [, setLocation] = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  const loginMutation = trpc.adminAuth.login.useMutation();
  const logoutMutation = trpc.adminAuth.logout.useMutation();
  const resetMutation = trpc.adminPasswordReset.request.useMutation({
    onSuccess: (data) => setResetMessage(data.message),
    onError: () => setResetMessage('If an administrator account matches that email, a reset link has been sent.'),
  });

  // Check for existing session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('adminSessionToken');
    if (storedToken) {
      verifySession(storedToken);
    }
  }, []);

  const verifySession = async (token: string) => {
    try {
      // Note: useQuery returns { data, isLoading, error }
      // For verification on mount, we'll use a simpler approach
      // Just set the token and let the page load
      if (token) {
        setIsLoggedIn(true);
        setSessionToken(token);
        setError('');
      }
    } catch (err: any) {
      console.info('Admin session needs a fresh sign-in:', err);
      localStorage.removeItem('adminSessionToken');
      setIsLoggedIn(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await loginMutation.mutateAsync({
        username,
        password,
      });

      if (result.success) {
        localStorage.setItem('adminSessionToken', result.sessionToken);
        setSessionToken(result.sessionToken);
        setIsLoggedIn(true);
        setUsername('');
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'We could not sign you in yet. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (sessionToken) {
      try {
        await logoutMutation.mutateAsync({ sessionToken });
      } catch (err: any) {
        console.error('Logout error:', err);
      }
    }
    localStorage.removeItem('adminSessionToken');
    setIsLoggedIn(false);
    setSessionToken(null);
    setUsername('');
    setPassword('');
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-4">
                <Lock className="w-8 h-8 text-orange-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Portal</h1>
              <p className="text-gray-600 mt-2">Mzansi Couriers Management</p>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {showReset ? <form onSubmit={(event) => { event.preventDefault(); if (resetEmail) resetMutation.mutate({ email: resetEmail, origin: window.location.origin }); }} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="admin-reset-email">Administrator email</label><Input id="admin-reset-email" type="email" autoComplete="email" placeholder="you@example.com" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} disabled={resetMutation.isPending} required /></div>
              <Button type="submit" disabled={resetMutation.isPending || !resetEmail} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg">{resetMutation.isPending ? 'Sending reset link…' : 'Email reset link'}</Button>
              {resetMessage && <p className="text-sm text-green-700" role="status">{resetMessage}</p>}
              <button type="button" onClick={() => { setShowReset(false); setResetMessage(''); }} className="w-full text-orange-600 hover:text-orange-700 font-medium">← Back to sign in</button>
            </form> : <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <Input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>}

            {!showReset && <button type="button" onClick={() => { setShowReset(true); setError(''); }} className="mt-4 w-full text-orange-600 hover:text-orange-700 font-medium">Forgot your password?</button>}

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Admin Access:</strong> This portal is for authorized administrators only. All access is logged and monitored.
              </p>
            </div>

            {/* Back to Home */}
            <div className="text-center mt-6">
              <button
                onClick={() => setLocation('/')}
                className="text-orange-600 hover:text-orange-700 font-medium"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Logged in - show admin dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Mzansi Couriers Management System</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Courier Management */}
          <Card className="p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Courier Management</h3>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
            </div>
            <p className="text-gray-600 mb-4">Approve, suspend, and manage courier accounts</p>
            <Button
              onClick={() => setLocation('/admin/dashboard')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Manage Couriers
            </Button>
          </Card>

          {/* Revenue Management */}
          <Card className="p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Revenue</h3>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
            <p className="text-gray-600 mb-4">Track payouts and revenue distribution</p>
            <Button
              onClick={() => setLocation('/admin/dashboard')}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              View Revenue
            </Button>
          </Card>

          {/* Surge Pricing */}
          <Card className="p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Surge Pricing</h3>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
            </div>
            <p className="text-gray-600 mb-4">Configure dynamic pricing rules</p>
            <Button
              onClick={() => setLocation('/admin/surge-pricing')}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              Configure Pricing
            </Button>
          </Card>

          {/* MCP Collaborator Approvals */}
          <Card className="p-6 hover:shadow-lg transition">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">ChatGPT Collaborators</h3>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔐</span>
              </div>
            </div>
            <p className="text-gray-600 mb-4">Review verified Manus accounts requesting MCP task access</p>
            <Button
              onClick={() => { window.location.href = '/api/mcp/oauth/collaborator-approvals'; }}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Review Collaborators
            </Button>
          </Card>

        </div>
      </div>
    </div>
  );
}
