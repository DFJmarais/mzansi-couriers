import React, { useState } from "react";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function CourierEarnings() {
  const [, setLocation] = useLocation();
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  // Fetch earnings data
  const { data: todayData, isLoading: todayLoading, isError: todayError, refetch: refetchToday } = trpc.smsEarnings.getTodayEarnings.useQuery();
  const { data: weeklyData, isError: weeklyError, refetch: refetchWeekly } = trpc.smsEarnings.getWeeklyEarnings.useQuery();
  const { data: monthlyData, isError: monthlyError, refetch: refetchMonthly } = trpc.smsEarnings.getMonthlyEarnings.useQuery();
  const { data: lifetimeData, isError: lifetimeError, refetch: refetchLifetime } = trpc.smsEarnings.getLifetimeStats.useQuery();
  const { data: payoutHistory, isLoading: payoutHistoryLoading, isError: payoutHistoryError, refetch: refetchPayoutHistory } = trpc.payouts.getCourierPayoutHistory.useQuery({ limit: 10 });

  const earningsError = todayError || weeklyError || monthlyError || lifetimeError;
  const retryEarnings = () => {
    void refetchToday();
    void refetchWeekly();
    void refetchMonthly();
    void refetchLifetime();
    void refetchPayoutHistory();
  };

  const COLORS = ["#1f7f4f", "#ff9f43", "#ee5a6f", "#54a0ff"];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" className="-ml-3 mb-3" onClick={() => setLocation("/courier/mobile")} aria-label="Back to courier workspace"><ArrowLeft className="mr-2 h-4 w-4" />Back to courier workspace</Button>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Your Mzansi delivery record</p>
          <h1 className="text-3xl font-bold text-foreground mb-2">Earnings and payouts</h1>
          <p className="text-muted-foreground">Track completed deliveries, recorded earnings, and weekly Paystack payout status.</p>
          {earningsError ? <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><span className="flex items-center gap-2"><AlertCircle className="h-4 w-4" />Some earnings data is temporarily unavailable. Your recorded delivery work is safe.</span><Button size="sm" variant="outline" onClick={retryEarnings} className="gap-2"><RefreshCw className="h-4 w-4" />Retry</Button></div> : null}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Today's Earnings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today's Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">R{todayData?.totalEarnings?.toFixed(2) || "0.00"}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {todayData?.completedDeliveries || 0} deliveries
              </p>
            </CardContent>
          </Card>

          {/* Today's Rating */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today's Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {todayData?.averageRating != null ? `${todayData.averageRating.toFixed(1)} / 5` : "Not rated"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {todayData?.completionRate != null ? `${todayData.completionRate.toFixed(0)}% completion` : "Completion rate unavailable"}
              </p>
            </CardContent>
          </Card>

          {/* Lifetime Earnings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Lifetime Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">R{lifetimeData?.totalEarnings?.toFixed(2) || "0.00"}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {lifetimeData?.totalDeliveries || 0} total deliveries
              </p>
            </CardContent>
          </Card>

          {/* Lifetime Rating */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Lifetime Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {lifetimeData?.averageRating != null ? `${lifetimeData.averageRating.toFixed(1)} / 5` : "Not rated"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {lifetimeData?.totalHours != null ? `${lifetimeData.totalHours.toFixed(0)} hours active` : "Activity history unavailable"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-emerald-200 bg-emerald-50/60">
          <CardHeader>
            <CardTitle className="text-lg">Payout history</CardTitle>
            <p className="text-sm text-muted-foreground">Verified earnings are reviewed weekly and normally processed by Paystack on Thursday or Friday.</p>
          </CardHeader>
          <CardContent>
            {payoutHistoryLoading ? <p className="text-sm text-muted-foreground">Loading payout history…</p> : payoutHistoryError ? <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><span className="flex items-center gap-2"><AlertCircle className="h-4 w-4" />Payout history is temporarily unavailable.</span><Button size="sm" variant="outline" onClick={() => void refetchPayoutHistory}>Retry</Button></div> : payoutHistory?.payouts?.length ? <div className="space-y-3">{payoutHistory.payouts.map((payout) => <div key={payout.id} className="flex flex-col gap-2 rounded-lg border bg-white p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">R{Number(payout.amount).toFixed(2)}</p><p className="text-xs text-muted-foreground">Week of {new Date(payout.payoutDate).toLocaleDateString()}</p></div><span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${payout.status === "completed" ? "bg-emerald-100 text-emerald-800" : payout.status === "failed" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>{payout.status}</span></div>)}</div> : <p className="rounded-lg border bg-white p-4 text-sm text-muted-foreground">No weekly payout records yet. Complete and verify deliveries to build your payout history.</p>}
          </CardContent>
        </Card>

        {/* Charts Section */}
        <Tabs defaultValue="daily" className="mb-8">
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>

          {/* Daily Chart */}
          <TabsContent value="daily">
            <Card>
              <CardHeader>
                <CardTitle>Daily Earnings Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {todayData ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[todayData]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="totalEarnings" fill="#1f7f4f" name="Earnings (R)" />
                        <Bar dataKey="completedDeliveries" fill="#ff9f43" name="Deliveries" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : todayError ? (
                  <div className="flex h-80 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                    <p>Today’s earnings are temporarily unavailable.</p>
                    <Button variant="outline" onClick={retryEarnings} className="gap-2"><RefreshCw className="h-4 w-4" />Retry earnings</Button>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    {todayLoading ? "Loading…" : "No earnings recorded yet"}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Weekly Chart */}
          <TabsContent value="weekly">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                {weeklyData?.weeks && weeklyData.weeks.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyData.weeks}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="periodDate" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="totalEarnings" stroke="#1f7f4f" name="Earnings (R)" />
                        <Line type="monotone" dataKey="completedDeliveries" stroke="#ff9f43" name="Deliveries" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    No weekly data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monthly Chart */}
          <TabsContent value="monthly">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyData?.months && monthlyData.months.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyData.months}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="periodDate" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="totalEarnings" stroke="#1f7f4f" name="Earnings (R)" />
                        <Line type="monotone" dataKey="completedDeliveries" stroke="#ff9f43" name="Deliveries" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    No monthly data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Lifetime Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Lifetime Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Total Distance</p>
                <p className="text-2xl font-bold text-foreground">
                  {lifetimeData?.totalDistance?.toFixed(0) || "0"} km
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Total Hours</p>
                <div className="text-2xl font-bold text-foreground">
                {lifetimeData?.totalHours?.toFixed(1) || "0"} hrs
              </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Average per Delivery</p>
                <p className="text-2xl font-bold text-foreground">
                  R{lifetimeData && (lifetimeData.totalDeliveries || 0) > 0
                    ? ((lifetimeData.totalEarnings || 0) / (lifetimeData.totalDeliveries || 1)).toFixed(2)
                    : "0.00"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
