import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Car, Plus, ShieldCheck, Truck } from "lucide-react";

const vehicleTypes = [
  ["bicycle", "Bicycle"],
  ["scooter", "Scooter"],
  ["motorcycle", "Motorcycle"],
  ["car", "Car"],
  ["bakkie", "Bakkie"],
  ["small_van", "Small van"],
  ["large_van", "Large van"],
  ["truck", "Truck"],
  ["refrigerated", "Refrigerated vehicle"],
  ["flatbed", "Flatbed"],
] as const;

type VehicleType = (typeof vehicleTypes)[number][0];

export default function FleetDashboard() {
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("car");
  const [maxParcelCapacity, setMaxParcelCapacity] = useState("");
  const [weightCapacity, setWeightCapacity] = useState("");

  const fleetQuery = trpc.fleet.getFleetAccount.useQuery();
  const vehiclesQuery = trpc.fleet.getFleetVehicles.useQuery(undefined, {
    enabled: Boolean(fleetQuery.data),
  });
  const addVehicle = trpc.fleet.addVehicle.useMutation({
    onSuccess: async () => {
      toast.success("Vehicle added to your fleet");
      setRegistrationNumber("");
      setVehicleType("car");
      setMaxParcelCapacity("");
      setWeightCapacity("");
      setShowVehicleForm(false);
      await vehiclesQuery.refetch();
      await fleetQuery.refetch();
    },
    onError: (error) => toast.info(error.message || "We are preparing your vehicle record. Please try again."),
  });

  const submitVehicle = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const registration = registrationNumber.trim();
    if (!registration) {
      toast.info("Add the vehicle registration number to continue.");
      return;
    }
    addVehicle.mutate({
      registrationNumber: registration,
      vehicleType,
      maxParcelCapacity: maxParcelCapacity ? Number(maxParcelCapacity) : undefined,
      weightCapacity: weightCapacity ? Number(weightCapacity) : undefined,
    });
  };

  if (fleetQuery.isLoading) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading fleet account…</div>;
  }

  if (!fleetQuery.data) {
    return (
      <div className="min-h-screen bg-mzansi-sand px-4 py-10">
        <Card className="mx-auto max-w-xl p-8 text-center">
          <Truck className="mx-auto mb-4 h-12 w-12 text-emerald-600" />
          <h1 className="text-2xl font-bold">Register your fleet</h1>
          <p className="mt-2 text-muted-foreground">
            Start with a fleet account. Once your details are verified, you can add vehicles and manage your delivery operation here.
          </p>
          <Link href="/fleet/onboarding" className="mt-6 inline-block">
            <Button>Start fleet registration</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const fleet = fleetQuery.data;
  const vehicles = vehiclesQuery.data ?? [];

  return (
    <div className="mobile-borderless-shell min-h-screen bg-mzansi-sand px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Move parcels across Mzansi</p>
          <h1 className="text-3xl font-bold text-slate-900">{fleet.businessName}</h1>
          <p className="mt-1 text-slate-600">Manage the vehicles registered to your fleet and keep your delivery operation ready.</p>
        </header>

        <Card className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Account status</p>
              <div className="mt-1 flex items-center gap-2 font-semibold capitalize">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                {fleet.status}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {fleet.status === "pending"
                  ? "Your registration is in the verification queue. We will guide you when it is ready."
                  : "Your fleet account is on file with Mzansi Couriers."}
              </p>
            </div>
            <div className="rounded-lg bg-slate-100 px-5 py-3 text-center">
              <p className="text-2xl font-bold text-slate-900">{vehicles.length}</p>
              <p className="text-sm text-muted-foreground">Registered vehicles</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Vehicles</h2>
              <p className="text-sm text-muted-foreground">Add each vehicle that may carry parcels on your local routes.</p>
            </div>
            <Button onClick={() => setShowVehicleForm((visible) => !visible)}>
              <Plus className="mr-2 h-4 w-4" />
              {showVehicleForm ? "Close" : "Add vehicle"}
            </Button>
          </div>

          {showVehicleForm && (
            <form onSubmit={submitVehicle} className="mt-5 grid gap-4 rounded-lg bg-white/70 p-4 shadow-sm sm:grid-cols-2">
              <Input
                aria-label="Vehicle registration number"
                placeholder="Registration number"
                value={registrationNumber}
                onChange={(event) => setRegistrationNumber(event.target.value)}
                required
              />
              <label className="grid gap-1 text-sm font-medium">
                Vehicle type
                <select className="h-10 rounded-md border bg-background px-3" value={vehicleType} onChange={(event) => setVehicleType(event.target.value as VehicleType)}>
                  {vehicleTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <Input
                aria-label="Maximum parcel capacity"
                type="number"
                min="1"
                placeholder="Maximum parcel capacity (optional)"
                value={maxParcelCapacity}
                onChange={(event) => setMaxParcelCapacity(event.target.value)}
              />
              <Input
                aria-label="Weight capacity in kilograms"
                type="number"
                min="1"
                step="0.01"
                placeholder="Weight capacity in kg (optional)"
                value={weightCapacity}
                onChange={(event) => setWeightCapacity(event.target.value)}
              />
              <Button type="submit" disabled={addVehicle.isPending} className="sm:col-span-2">
                {addVehicle.isPending ? "Saving vehicle…" : "Save vehicle"}
              </Button>
            </form>
          )}

          {vehiclesQuery.isLoading ? (
            <p className="mt-6 text-sm text-muted-foreground">Loading vehicles…</p>
          ) : vehicles.length === 0 ? (
            <div className="mt-6 rounded-lg bg-muted/40 p-8 text-center shadow-sm">
              <Car className="mx-auto mb-3 h-8 w-8 text-slate-400" />
              <p className="font-medium">Your vehicles will appear here</p>
              <p className="mt-1 text-sm text-muted-foreground">Add your first vehicle to begin building your fleet profile and preparing for delivery work.</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className="rounded-lg bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{vehicle.registrationNumber}</p>
                      <p className="text-sm capitalize text-muted-foreground">{vehicle.vehicleType.replace("_", " ")}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs capitalize text-slate-700">{vehicle.availability}</span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Capacity: {vehicle.maxParcelCapacity ?? "To be added"} parcels · {vehicle.weightCapacity ? `${vehicle.weightCapacity} kg` : "Weight not specified"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
