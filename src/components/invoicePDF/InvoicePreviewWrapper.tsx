import React, { useRef } from "react";
import { Invoice } from "@/app/types/invoice";
import { InvoicePreview } from "./InvoicePreview";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from 'sonner';
import { PDFGenerator } from './pdfService';
interface InvoicePreviewWrapperProps {
  invoice: Invoice;
  showDownloadButton?: boolean;
}

export function InvoicePreviewWrapper({ 
  invoice, 
  showDownloadButton = true 
}: InvoicePreviewWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    try {
      if (!wrapperRef.current) {
        toast.error('No se pudo generar el PDF');
        return;
      }

      // Encuentra el elemento InvoicePreview dentro del wrapper
      const previewElement = wrapperRef.current.querySelector('[data-invoice-preview]');
      if (!previewElement) {
        toast.error('No se pudo encontrar el contenido para generar el PDF');
        return;
      }

      toast.loading('Generando PDF...');
      
      // Usar el servicio para generar el PDF
      await PDFGenerator.generateFromElement(previewElement as HTMLElement, invoice);
      
      toast.dismiss();
      toast.success('PDF descargado correctamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.dismiss();
      toast.error('Error al generar el PDF');
    }
  };

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

// Método exportado para uso sin UI
export const generatePDF = async (invoice: Invoice): Promise<void> => {
  try {
    // Buscar si ya existe algún preview visible en la aplicación
    const existingPreview = document.querySelector('[data-invoice-preview]');
    
    if (existingPreview) {
      // Si existe un preview, generar a partir de ese elemento
      return PDFGenerator.generateFromElement(existingPreview as HTMLElement, invoice);
    } else {
      // Si no existe, crear un elemento temporal con el componente
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '210mm';
      tempDiv.style.height = '297mm';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.overflow = 'hidden';
      document.body.appendChild(tempDiv);
      
      // Asegúrate de que este selector coincida con el que usas en InvoicePreview
      tempDiv.innerHTML = `<div data-temp-preview-container></div>`;
      
      // Renderizar el InvoicePreview en este div temporal
      const container = tempDiv.querySelector('[data-temp-preview-container]');
      
      // Crear un elemento temporal con la estructura
      const previewElement = document.createElement('div');
      previewElement.setAttribute('data-invoice-preview', '');
      previewElement.style.width = '210mm';
      previewElement.style.height = '297mm';
      previewElement.style.backgroundColor = 'white';
      previewElement.style.margin = '0';
      previewElement.style.padding = '10mm';
      previewElement.style.boxSizing = 'border-box';
      
      // Aquí deberías insertar el HTML de la factura
      // Por ahora, utilizamos un enfoque alternativo
      container?.appendChild(previewElement);
      
      // Generar el PDF
      await PDFGenerator.generateInvisibleCopy('[data-invoice-preview]', invoice);
      
      // Limpiar
      document.body.removeChild(tempDiv);
      
      return Promise.resolve();
    }
  } catch (error) {
    console.error('Error generando PDF:', error);
    return Promise.reject(error);
  }
};