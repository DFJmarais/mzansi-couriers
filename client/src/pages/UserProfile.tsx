import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { User, MapPin, Truck, CreditCard, Edit2 } from "lucide-react";
import { useState } from "react";

export default function UserProfile() {
  const { user, isAuthenticated } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  if (!isAuthenticated) {
    return <div>Access denied</div>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>
          <Button onClick={() => setIsEditing(!isEditing)}>
            <Edit2 className="w-4 h-4 mr-2" />
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </div>

        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <p className="text-lg font-semibold mt-2">{user?.name || 'Not set'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-lg font-semibold mt-2">{user?.email || 'Not set'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Role</label>
                <p className="text-lg font-semibold mt-2 capitalize">{user?.role}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                <p className="text-lg font-semibold mt-2">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saved Addresses */}
        {user?.role === 'customer' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Saved Addresses
                </CardTitle>
                <Button size="sm" disabled title="Address storage is not connected yet">Addresses unavailable</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No saved addresses are available yet. Addresses will appear here once account address storage is connected.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Methods */}
        {user?.role === 'customer' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Methods
                </CardTitle>
                <Button size="sm" disabled title="Payment-method storage is not connected yet">Payment methods unavailable</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No saved payment methods are available. Customer payments are handled securely through Paystack checkout.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Courier Info */}
        {user?.role === 'courier' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Courier Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Vehicle Type</label>
                  <p className="text-lg font-semibold mt-2">Not configured</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Registration</label>
                  <p className="text-lg font-semibold mt-2">Not configured</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">License Number</label>
                  <p className="text-lg font-semibold mt-2">Not configured</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="text-lg font-semibold mt-2 text-muted-foreground">Managed through courier verification</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Email Notifications</label>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">SMS Notifications</label>
              <input type="checkbox" defaultChecked className="w-4 h-4" />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Marketing Emails</label>
              <input type="checkbox" className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
