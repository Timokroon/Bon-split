import { useState, useRef } from "react";
import { CloudUpload, Camera, FolderOpen, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface ReceiptUploadResponse {
  success: boolean;
  receipt: any;
  splitResults: any[];
  message: string;
}

export default function ReceiptUpload() {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const uploadReceiptMutation = useMutation({
    mutationFn: async (file: File): Promise<ReceiptUploadResponse> => {
      const formData = new FormData();
      formData.append('receipt', file);
      
      const response = await fetch('/api/receipt', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process receipt');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Bon succesvol verwerkt!",
        description: data.message,
      });
      // You could emit an event here to update the bill splitting results
      window.dispatchEvent(new CustomEvent('receiptProcessed', { detail: data }));
    },
    onError: (error) => {
      toast({
        title: "Fout bij verwerken bon",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Ongeldig bestandstype",
        description: "Alleen JPEG, PNG en PDF bestanden zijn toegestaan.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Bestand te groot",
        description: "Het bestand mag maximaal 10MB zijn.",
        variant: "destructive",
      });
      return;
    }

    uploadReceiptMutation.mutate(file);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <CloudUpload className="text-amber-500 text-lg" />
        <h2 className="text-lg font-semibold text-slate-800">Bon Uploaden</h2>
      </div>

      {/* Upload Area */}
      <div 
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragOver 
            ? 'border-primary-400 bg-primary-50/30' 
            : uploadReceiptMutation.isPending
              ? 'border-slate-200 bg-slate-50'
              : 'border-slate-300 hover:border-primary-400 hover:bg-primary-50/30'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!uploadReceiptMutation.isPending ? handleClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf"
          onChange={handleFileChange}
          disabled={uploadReceiptMutation.isPending}
        />
        
        <div className="space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
            <Camera className="text-slate-500 text-lg" />
          </div>
          <div>
            {uploadReceiptMutation.isPending ? (
              <>
                <p className="text-slate-700 font-medium">Bon wordt verwerkt...</p>
                <p className="text-sm text-slate-500">Even geduld terwijl we de tekst analyseren</p>
              </>
            ) : (
              <>
                <p className="text-slate-700 font-medium">Sleep je bon hierheen</p>
                <p className="text-sm text-slate-500">of klik om een foto te selecteren</p>
              </>
            )}
          </div>
          <p className="text-xs text-slate-400">PNG, JPG, PDF tot 10MB</p>
        </div>
      </div>

      {/* Quick Capture */}
      <div className="mt-4 flex space-x-3">
        <Button 
          variant="outline"
          onClick={handleClick}
          disabled={uploadReceiptMutation.isPending}
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors"
        >
          <Camera className="mr-2" size={16} />
          Camera
        </Button>
        <Button 
          variant="outline"
          onClick={handleClick}
          disabled={uploadReceiptMutation.isPending}
          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors"
        >
          <FolderOpen className="mr-2" size={16} />
          Galerij
        </Button>
      </div>

      {/* Afronden Button */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <Button 
          onClick={() => setLocation("/bill-splitting")}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          <Calculator className="mr-2" size={16} />
          Afronden & Rekening Verdelen
        </Button>
        <p className="text-xs text-slate-500 text-center mt-2">
          Ga naar het verdeel scherm om kosten op te splitsen
        </p>
      </div>
    </div>
  );
}
