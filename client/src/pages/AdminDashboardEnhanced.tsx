import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';

export default function AdminDashboardEnhanced() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'payments', label: 'Payments & Revenue' },
    { id: 'disputes', label: 'Disputes' },
    { id: 'referrals', label: 'Referrals' },
    { id: 'surge', label: 'Surge Pricing' },
    { id: 'analytics', label: 'Analytics' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Manage all platform operations</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-b-2 border-orange-600 text-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
              <p className="text-3xl font-bold mt-2">R0.00</p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-600">Active Deliveries</h3>
              <p className="text-3xl font-bold mt-2">0</p>
              <p className="text-xs text-gray-500 mt-1">In progress</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-600">Active Couriers</h3>
              <p className="text-3xl font-bold mt-2">0</p>
              <p className="text-xs text-gray-500 mt-1">Online now</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-600">Total Users</h3>
              <p className="text-3xl font-bold mt-2">0</p>
              <p className="text-xs text-gray-500 mt-1">Registered</p>
            </Card>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Payment Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Successful Payments</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Failed Payments</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Disputes Tab */}
        {activeTab === 'disputes' && (
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Dispute Management</h2>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Open Disputes: 0</p>
                <p className="text-sm text-gray-600">Resolved Disputes: 0</p>
                <p className="text-sm text-gray-600">Total Refunded: R0.00</p>
              </div>
              <Button className="mt-4">View All Disputes</Button>
            </Card>
          </div>
        )}

        {/* Referrals Tab */}
        {activeTab === 'referrals' && (
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Referral Program</h2>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Total Referrals: 0</p>
                <p className="text-sm text-gray-600">Completed Referrals: 0</p>
                <p className="text-sm text-gray-600">Referral Bonuses Paid: R0.00</p>
              </div>
              <Button className="mt-4">View Leaderboard</Button>
            </Card>
          </div>
        )}

        {/* Surge Pricing Tab */}
        {activeTab === 'surge' && (
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Surge Pricing Control</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Current Surge Multiplier</p>
                  <p className="text-3xl font-bold text-orange-600">1.0x</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Demand Level</p>
                  <p className="text-lg font-semibold">Low</p>
                </div>
                <Button className="w-full">Manage Surge Rules</Button>
              </div>
            </Card>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Platform Analytics</h2>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Daily Active Users: 0</p>
                <p className="text-sm text-gray-600">Average Rating: 0.0</p>
                <p className="text-sm text-gray-600">Completion Rate: 0%</p>
              </div>
              <Button className="mt-4">Export Report</Button>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
