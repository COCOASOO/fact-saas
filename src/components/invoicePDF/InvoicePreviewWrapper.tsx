import React, { useRef } from "react";
import { Invoice } from "@/app/types/invoice";
import { InvoicePreview } from "./InvoicePreview";

interface InvoicePreviewWrapperProps {
  invoice: Invoice;
  showDownloadButton?: boolean;
}

export function InvoicePreviewWrapper({ 
  invoice, 
  showDownloadButton = true 
}: InvoicePreviewWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col h-full" ref={wrapperRef}>
      <div className="bg-gray-100 border rounded-lg p-4 flex-grow overflow-auto">
        <div className="shadow-lg mx-auto" style={{ 
          transform: 'scale(0.75)',
          transformOrigin: 'top center',
          maxHeight: '100%',
          width: 'fit-content'
        }}>
          <InvoicePreview invoice={invoice} />
        </div>
      </div>
    </div>
  );
}