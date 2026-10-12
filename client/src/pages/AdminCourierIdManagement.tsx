import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Clock, Trash2 } from "lucide-react";

interface CourierIdRecord {
  id: number;
  idNumber: string;
  courierName: string;
  status: "active" | "suspended" | "expired" | "pending_approval" | "rejected";
  expiryDate: string;
  approvalNotes?: string;
  suspensionReason?: string;
}

export const AdminCourierIdManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  // Courier ID records are intentionally empty until this screen is connected
  // to verified admin courier-management data.
  const [courierIds] = useState<CourierIdRecord[]>([]);

  const filteredIds = courierIds.filter((record) => {
    const matchesSearch =
      record.idNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.courierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "suspended":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "expired":
        return <Clock className="w-5 h-5 text-gray-600" />;
      case "pending_approval":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-50 border-green-200";
      case "suspended":
        return "bg-red-50 border-red-200";
      case "expired":
        return "bg-gray-50 border-gray-200";
      case "pending_approval":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Search by ID number or courier name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-64"
        />
        <select
          value={statusFilter || ""}
          onChange={(e) => setStatusFilter(e.target.value || undefined)}
          className="border rounded px-3 py-2 bg-white"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="expired">Expired</option>
          <option value="pending_approval">Pending Approval</option>
        </select>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {filteredIds.length} of {courierIds.length} courier IDs
      </div>

      {/* Courier IDs List */}
      <div className="space-y-3">
        {filteredIds.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No courier IDs found matching your search</p>
          </Card>
        ) : (
          filteredIds.map((record) => (
            <Card
              key={record.id}
              className={`p-4 border-2 ${getStatusColor(record.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {getStatusIcon(record.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">{record.courierName}</h3>
                      <span className="text-sm font-mono text-green-600 bg-green-100 px-2 py-1 rounded">
                        {record.idNumber}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Status</p>
                        <p className="font-semibold capitalize">{record.status.replace("_", " ")}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Expiry Date</p>
                        <p className="font-semibold">
                          {new Date(record.expiryDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {record.approvalNotes && (
                      <p className="text-xs text-gray-600 mt-2">
                        <strong>Notes:</strong> {record.approvalNotes}
                      </p>
                    )}
                    {record.suspensionReason && (
                      <p className="text-xs text-red-600 mt-2">
                        <strong>Reason:</strong> {record.suspensionReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 ml-4">
                  {record.status === "pending_approval" && (
                    <>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => alert(`Approved ${record.idNumber}`)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => alert(`Rejected ${record.idNumber}`)}
                      >
                        Reject
                      </Button>
                    </>
                  )}

                  {record.status === "active" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => alert(`Suspended ${record.idNumber}`)}
                    >
                      Suspend
                    </Button>
                  )}

                  {record.status === "suspended" && (
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => alert(`Unsuspended ${record.idNumber}`)}
                    >
                      Unsuspend
                    </Button>
                  )}

                  {record.status === "expired" && (
                    <Button
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={() => alert(`Renewed ${record.idNumber}`)}
                    >
                      Renew
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => alert(`View history for ${record.idNumber}`)}
                  >
                    History
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 bg-green-50 border-green-200">
          <p className="text-sm text-gray-600">Active IDs</p>
          <p className="text-2xl font-bold text-green-600">
            {courierIds.filter((r) => r.status === "active").length}
          </p>
        </Card>
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {courierIds.filter((r) => r.status === "pending_approval").length}
          </p>
        </Card>
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-sm text-gray-600">Suspended</p>
          <p className="text-2xl font-bold text-red-600">
            {courierIds.filter((r) => r.status === "suspended").length}
          </p>
        </Card>
        <Card className="p-4 bg-gray-50 border-gray-200">
          <p className="text-sm text-gray-600">Expired</p>
          <p className="text-2xl font-bold text-gray-600">
            {courierIds.filter((r) => r.status === "expired").length}
          </p>
        </Card>
      </div>
    </div>
  );
};
