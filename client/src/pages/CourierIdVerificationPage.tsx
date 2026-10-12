import { useRoute } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VerificationData {
  status: string;
  courierName: string;
  idNumber: string;
  profilePhotoUrl?: string;
  vehicleRegistration: string;
  vehicleMakeModel: string;
  province: string;
  emergencyContact: string;
  generatedAt?: string;
  expiryDate: string;
  verifiedAt: string;
}

export const CourierIdVerificationPage = () => {
  const [, params] = useRoute("/verify-courier/:qrToken");
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use query to fetch verification data
  const { data: queryData, isLoading: queryLoading, error: queryError } = trpc.courierId.verifyIdByQrCode.useQuery(
    { qrToken: params?.qrToken || '' },
    { enabled: !!params?.qrToken }
  );

  useEffect(() => {
    if (queryData) {
      setVerificationData(queryData);
      setLoading(false);
    }
  }, [queryData]);

  useEffect(() => {
    if (queryError) {
      setError(queryError.message || 'Failed to verify courier ID');
      setLoading(false);
    }
  }, [queryError]);

  useEffect(() => {
    setLoading(queryLoading);
  }, [queryLoading]);



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-700 font-semibold">Verifying Courier ID...</p>
        </div>
      </div>
    );
  }

  if (error || !verificationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-2">NOT AUTHORISED</h1>
          <p className="text-gray-700 mb-6">
            {error || "This courier ID could not be verified. It may be expired, suspended, or invalid."}
          </p>
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
            <p className="text-sm text-gray-600">
              <strong>If you believe this is an error:</strong> Contact Mzansi Couriers support at mzansicouriers@yahoo.com or call 0800-COURIER
            </p>
          </div>
          <Button onClick={() => window.location.reload()} className="w-full bg-red-600 hover:bg-red-700">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const isAuthorised = verificationData.status === "active";
  const formattedDate = new Date(verificationData.verifiedAt).toLocaleString();

  return (
    <div className={`min-h-screen bg-gradient-to-br ${isAuthorised ? "from-green-50 to-green-100" : "from-yellow-50 to-yellow-100"} flex items-center justify-center p-4`}>
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        {/* Status Header */}
        <div className="text-center mb-6">
          {isAuthorised ? (
            <>
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-green-600 mb-2">AUTHORISED COURIER</h1>
              <p className="text-gray-600">This courier is verified and active</p>
            </>
          ) : (
            <>
              <AlertCircle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-yellow-600 mb-2">CAUTION</h1>
              <p className="text-gray-600">Courier status: {verificationData.status.toUpperCase()}</p>
            </>
          )}
        </div>

        {/* Courier Information */}
        <div className="space-y-4 mb-6 border-t border-b py-6">
          {verificationData.profilePhotoUrl && (
            <div className="flex justify-center mb-4">
              <img
                src={verificationData.profilePhotoUrl}
                alt={verificationData.courierName}
                className="w-20 h-20 rounded-full border-4 border-green-600"
              />
            </div>
          )}

          <div>
            <p className="text-sm text-gray-500">Courier Name</p>
            <p className="text-lg font-bold text-gray-900">{verificationData.courierName}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">ID Number</p>
            <p className="text-lg font-bold text-green-600">{verificationData.idNumber}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Vehicle Registration</p>
            <p className="text-lg font-bold text-gray-900">{verificationData.vehicleRegistration}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Vehicle</p>
            <p className="text-sm text-gray-700">{verificationData.vehicleMakeModel}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Province</p>
            <p className="text-sm text-gray-700">{verificationData.province}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Emergency Contact</p>
            <p className="text-sm text-gray-700">{verificationData.emergencyContact}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-xs text-gray-500">ID Generated</p>
              <p className="text-sm font-semibold text-gray-900">
                {verificationData.generatedAt ? new Date(verificationData.generatedAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">ID Expires</p>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(verificationData.expiryDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Verification Details */}
        <div className="bg-gray-50 rounded p-4 mb-6">
          <p className="text-xs text-gray-500 mb-2">Verified At</p>
          <p className="text-sm font-mono text-gray-700">{formattedDate}</p>
        </div>

        {/* Company Information */}
        <div className="bg-green-50 border border-green-200 rounded p-4 mb-6">
          <p className="text-sm font-bold text-green-900 mb-2">Mzansi Couriers Support</p>
          <p className="text-xs text-gray-700 mb-2">
            <strong>Email:</strong> mzansicouriers@yahoo.com
          </p>
          <p className="text-xs text-gray-700">
            <strong>Hotline:</strong> 0800-COURIER (0800-268743)
          </p>
        </div>

        {/* Status Warning */}
        {verificationData.status === "suspended" && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
            <p className="text-sm font-bold text-red-900 mb-2">⚠️ Courier Suspended</p>
            <p className="text-xs text-red-800">
              This courier's ID has been suspended. Do not accept deliveries from this courier.
            </p>
          </div>
        )}

        {verificationData.status === "expired" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
            <p className="text-sm font-bold text-yellow-900 mb-2">⚠️ ID Expired</p>
            <p className="text-xs text-yellow-800">
              This courier's ID has expired. They must renew their ID before accepting deliveries.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => window.print()}
            className="w-full bg-gray-600 hover:bg-gray-700"
          >
            Print Verification
          </Button>
          <Button
            onClick={() => window.location.href = "/"}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Return Home
          </Button>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-500 text-center mt-4">
          This verification is valid for 24 hours from the time shown above.
        </p>
      </div>
    </div>
  );
};
