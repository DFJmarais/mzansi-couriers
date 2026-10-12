import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Share2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface CourierIdDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  courierData: any;
}

export const CourierIdDownloadModal = ({
  isOpen,
  onClose,
  courierData,
}: CourierIdDownloadModalProps) => {
  const [downloading, setDownloading] = useState(false);
  const downloadMutation = trpc.courierId.downloadIdCard.useMutation();

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      downloadMutation.mutate(
        { format: "pdf", courierIdCardId: courierData.id || 'default' },
        {
          onSuccess: (data: any) => {
            // Create download link
            const link = document.createElement("a");
            link.href = data.url;
            link.download = `Mzansi-Courier-ID-${courierData.idNumber}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setDownloading(false);
            onClose();
          },
          onError: () => {
            alert("Failed to download PDF");
            setDownloading(false);
          },
        }
      );
    } catch (error) {
      alert("Error downloading PDF");
      setDownloading(false);
    }
  };

  const handleDownloadImage = async () => {
    setDownloading(true);
    try {
      downloadMutation.mutate(
        { format: "image", courierIdCardId: courierData.id || 'default' },
        {
          onSuccess: (data: any) => {
            // Create download link
            const link = document.createElement("a");
            link.href = data.url;
            link.download = `Mzansi-Courier-ID-${courierData.idNumber}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setDownloading(false);
            onClose();
          },
          onError: () => {
            alert("Failed to download image");
            setDownloading(false);
          },
        }
      );
    } catch (error) {
      alert("Error downloading image");
      setDownloading(false);
    }
  };


  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "My Mzansi Courier ID",
        text: `My Courier ID: ${courierData.idNumber}`,
        url: window.location.href,
      });
    } else {
      alert("Sharing not supported on this device");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Download Your Courier ID</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download as PDF
              </>
            )}
          </Button>

          <Button
            onClick={handleDownloadImage}
            disabled={downloading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download as Image
              </>
            )}
          </Button>

          <Button
            type="button"
            disabled
            className="w-full"
            title="Apple Wallet export is not available"
          >
            <Download className="w-4 h-4 mr-2" />
            Apple Wallet export unavailable
          </Button>

          <Button
            onClick={handleShare}
            variant="outline"
            className="w-full"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share ID
          </Button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-4">
          <p className="text-xs text-blue-900">
            <strong>Tip:</strong> Save your ID card on your phone for quick verification. Your QR code expires after 24 hours.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
