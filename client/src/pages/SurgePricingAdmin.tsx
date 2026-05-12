import { useAuth } from '@/_core/hooks/useAuth';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, Loader2, TrendingUp } from 'lucide-react';

export default function SurgePricingAdmin() {
  const { user, isAuthenticated } = useAuth();
  const [configs, setConfigs] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    timeSlot: '',
    startHour: '',
    endHour: '',
    dayOfWeek: 'all',
    multiplier: '',
    demandThreshold: '',
  });

  const getConfigsQuery = trpc.surgePricing.getConfigs.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const createConfigMutation = trpc.surgePricing.createConfig.useMutation({
    onSuccess: () => {
      toast.success('Surge pricing config created');
      setFormData({
        timeSlot: '',
        startHour: '',
        endHour: '',
        dayOfWeek: 'all',
        multiplier: '',
        demandThreshold: '',
      });
      setIsCreating(false);
      getConfigsQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create config');
    },
  });

  const updateConfigMutation = trpc.surgePricing.updateConfig.useMutation({
    onSuccess: () => {
      toast.success('Surge pricing config updated');
      setEditingId(null);
      setFormData({
        timeSlot: '',
        startHour: '',
        endHour: '',
        dayOfWeek: 'all',
        multiplier: '',
        demandThreshold: '',
      });
      getConfigsQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update config');
    },
  });

  useEffect(() => {
    if (getConfigsQuery.data) {
      setConfigs(getConfigsQuery.data);
    }
  }, [getConfigsQuery.data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.timeSlot || !formData.startHour || !formData.endHour || !formData.multiplier || !formData.demandThreshold) {
      toast.error('Please fill in all fields');
      return;
    }

    if (editingId) {
      await updateConfigMutation.mutateAsync({
        id: editingId,
        multiplier: parseFloat(formData.multiplier),
        demandThreshold: parseInt(formData.demandThreshold),
      });
    } else {
      await createConfigMutation.mutateAsync({
        timeSlot: formData.timeSlot,
        startHour: parseInt(formData.startHour),
        endHour: parseInt(formData.endHour),
        dayOfWeek: formData.dayOfWeek,
        multiplier: parseFloat(formData.multiplier),
        demandThreshold: parseInt(formData.demandThreshold),
      });
    }
  };

  const handleEdit = (config: any) => {
    setEditingId(config.id);
    setFormData({
      timeSlot: config.timeSlot,
      startHour: config.startHour.toString(),
      endHour: config.endHour.toString(),
      dayOfWeek: config.dayOfWeek,
      multiplier: config.multiplier,
      demandThreshold: config.demandThreshold.toString(),
    });
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({
      timeSlot: '',
      startHour: '',
      endHour: '',
      dayOfWeek: 'all',
      multiplier: '',
      demandThreshold: '',
    });
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-accent" />
            Surge Pricing Configuration
          </h1>
          <p className="text-muted-foreground mt-1">Manage dynamic pricing rules for peak hours and high demand</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-accent">{configs.length}</p>
                <p className="text-sm text-muted-foreground mt-2">Active Rules</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-accent">
                  {configs.length > 0 ? Math.max(...configs.map(c => parseFloat(c.multiplier))).toFixed(1) : '1.0'}x
                </p>
                <p className="text-sm text-muted-foreground mt-2">Max Multiplier</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-accent">
                  {configs.reduce((sum, c) => sum + c.demandThreshold, 0)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">Total Demand Threshold</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create/Edit Form */}
        {(isCreating || editingId) && (
          <Card className="border-accent/50 bg-gradient-to-br from-background to-accent/5">
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Surge Pricing Rule' : 'Create New Surge Pricing Rule'}</CardTitle>
              <CardDescription>
                {editingId ? 'Update the surge pricing configuration' : 'Add a new surge pricing rule for peak hours or high demand periods'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Time Slot Name</label>
                    <Input
                      placeholder="e.g., peak_lunch"
                      value={formData.timeSlot}
                      onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                      disabled={editingId !== null}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Day of Week</label>
                    <select
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                      value={formData.dayOfWeek}
                      onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                      disabled={editingId !== null}
                    >
                      <option value="all">All Days</option>
                      <option value="weekday">Weekday (Mon-Fri)</option>
                      <option value="weekend">Weekend (Sat-Sun)</option>
                      <option value="monday">Monday</option>
                      <option value="tuesday">Tuesday</option>
                      <option value="wednesday">Wednesday</option>
                      <option value="thursday">Thursday</option>
                      <option value="friday">Friday</option>
                      <option value="saturday">Saturday</option>
                      <option value="sunday">Sunday</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Start Hour (24h)</label>
                    <Input
                      type="number"
                      min="0"
                      max="23"
                      placeholder="12"
                      value={formData.startHour}
                      onChange={(e) => setFormData({ ...formData, startHour: e.target.value })}
                      disabled={editingId !== null}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">End Hour (24h)</label>
                    <Input
                      type="number"
                      min="0"
                      max="23"
                      placeholder="14"
                      value={formData.endHour}
                      onChange={(e) => setFormData({ ...formData, endHour: e.target.value })}
                      disabled={editingId !== null}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Price Multiplier</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="5.0"
                      placeholder="1.5"
                      value={formData.multiplier}
                      onChange={(e) => setFormData({ ...formData, multiplier: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Demand Threshold (pending deliveries)</label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="5"
                      value={formData.demandThreshold}
                      onChange={(e) => setFormData({ ...formData, demandThreshold: e.target.value })}
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-semibold text-blue-900">How it works</p>
                  <p className="text-sm text-blue-800">
                    When the time slot matches and there are more pending deliveries than the threshold, the price multiplier is applied.
                  </p>
                  <p className="text-sm text-blue-800">
                    Example: If multiplier is 1.5x and base price is R100, customers pay R150 during this period.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={createConfigMutation.isPending || updateConfigMutation.isPending} className="flex-1">
                    {(createConfigMutation.isPending || updateConfigMutation.isPending) && (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    )}
                    {editingId ? 'Update Rule' : 'Create Rule'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Create Button */}
        {!isCreating && !editingId && (
          <Button onClick={() => setIsCreating(true)} className="gap-2" size="lg">
            <Plus className="w-4 h-4" />
            Create New Rule
          </Button>
        )}

        {/* Existing Rules */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Active Surge Pricing Rules</h2>
          {getConfigsQuery.isLoading ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-accent" />
                <p className="text-muted-foreground mt-2">Loading rules...</p>
              </CardContent>
            </Card>
          ) : configs.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No surge pricing rules configured yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {configs.map((config) => (
                <Card key={config.id} className="border-l-4 border-l-accent">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg">{config.timeSlot}</h3>
                          <span className="px-2 py-1 bg-accent/10 text-accent text-xs font-semibold rounded">
                            {config.dayOfWeek === 'all' ? 'Every Day' : config.dayOfWeek}
                          </span>
                        </div>
                        <div className="grid md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Time</p>
                            <p className="font-semibold">{config.startHour}:00 - {config.endHour}:00</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Multiplier</p>
                            <p className="font-semibold text-accent text-lg">{config.multiplier}x</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Demand Threshold</p>
                            <p className="font-semibold">{config.demandThreshold} deliveries</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Status</p>
                            <p className="font-semibold text-green-600">Active</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(config)}
                          disabled={editingId !== null}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
