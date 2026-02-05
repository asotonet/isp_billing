import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useUploadPdfFirmado } from "@/hooks/useContratos";
import { toast } from "sonner";

interface PdfUploadDialogProps {
  contratoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PdfUploadDialog({
  contratoId,
  open,
  onOpenChange,
}: PdfUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const uploadMutation = useUploadPdfFirmado();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    uploadMutation.mutate(
      { id: contratoId, file },
      {
        onSuccess: () => {
          toast.success("PDF firmado subido exitosamente");
          onOpenChange(false);
          setFile(null);
        },
        onError: (err: any) => {
          toast.error(
            err.response?.data?.detail || "Error al subir PDF"
          );
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subir PDF Firmado</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Archivo PDF</Label>
            <Input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
            />
            {file && (
              <p className="text-sm text-muted-foreground mt-2">
                {file.name}
              </p>
            )}
          </div>
          <Button
            onClick={handleUpload}
            disabled={!file || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? "Subiendo..." : "Subir PDF"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
