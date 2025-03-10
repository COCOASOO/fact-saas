import React, { useRef } from "react";
import { Invoice } from "@/app/types/invoice";
import { InvoicePreview } from "./InvoicePreview";
import html2pdf from "html2pdf.js";
import { Button } from "../ui/button";
import { Download } from "lucide-react";

interface InvoicePreviewWrapperProps {
  invoice: Invoice;
  showDownloadButton?: boolean;
}

export function InvoicePreviewWrapper({ 
  invoice, 
  showDownloadButton = true 
}: InvoicePreviewWrapperProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = () => {
    if (!invoiceRef.current) return;

    const options = {
      margin: 0,
      filename: `${invoice.invoice_number || 'factura'}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    };

    // Generar y descargar PDF
    html2pdf().from(invoiceRef.current).set(options).save();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-gray-100 border rounded-lg p-4 flex-grow overflow-auto">
        <div className="shadow-lg mx-auto" style={{ 
          transform: 'scale(0.75)',
          transformOrigin: 'top center',
          maxHeight: '100%',
          width: 'fit-content'
        }}>
          <InvoicePreview ref={invoiceRef} invoice={invoice} />
        </div>
      </div>
      
      {showDownloadButton && (
        <div className="mt-4 flex justify-end">
          <Button 
            onClick={handleDownloadPDF}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Download className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>
        </div>
      )}
    </div>
  );
}