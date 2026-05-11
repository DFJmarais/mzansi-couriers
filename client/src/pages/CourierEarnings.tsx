import React, { useState } from "react";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export function CourierEarnings() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  // Fetch earnings data
  const { data: todayData } = trpc.smsEarnings.getTodayEarnings.useQuery();
  const { data: weeklyData } = trpc.smsEarnings.getWeeklyEarnings.useQuery();
  const { data: monthlyData } = trpc.smsEarnings.getMonthlyEarnings.useQuery();
  const { data: lifetimeData } = trpc.smsEarnings.getLifetimeStats.useQuery();

  const COLORS = ["#1f7f4f", "#ff9f43", "#ee5a6f", "#54a0ff"];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Earnings Dashboard</h1>
          <p className="text-muted-foreground">Track your deliveries and earnings</p>
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
                {todayData?.averageRating?.toFixed(1) || "5.0"} ⭐
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {todayData?.completionRate?.toFixed(0) || "100"}% completion
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
                {lifetimeData?.averageRating?.toFixed(1) || "5.0"} ⭐
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {lifetimeData?.totalHours?.toFixed(0) || "0"} hours active
              </p>
            </CardContent>
          </Card>
        </div>

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
                ) : (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    Loading...
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
