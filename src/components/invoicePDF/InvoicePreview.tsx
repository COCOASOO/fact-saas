import React, { forwardRef, useEffect } from "react";
import { Invoice } from "@/app/types/invoice";
import { formatCurrency, formatDate } from "@/lib/utils/invoice-calculations";
import { Client } from "@/app/types/client";
import { Company } from "@/app/types/company";

interface InvoicePreviewProps {
  invoice: Invoice;
  onLoad?: () => void;
}

export const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(
  ({ invoice, onLoad }, ref) => {
    // Add useEffect to call onLoad when component mounts
    useEffect(() => {
      if (onLoad) {
        onLoad();
      }
    }, [onLoad]);

    // Procesamiento seguro para evitar errores con datos incompletos
    const invoiceNumber = invoice?.invoice_number || "BORRADOR";
    const invoiceDate = invoice?.invoice_date || new Date().toISOString().split('T')[0];
    const subtotal = invoice?.subtotal || 0;
    const taxRate = invoice?.tax_rate || 0;
    const taxAmount = invoice?.tax_amount || 0;
    const irpfRate = invoice?.irpf_rate || 0;
    const irpfAmount = invoice?.irpf_amount || 0;
    const totalAmount = invoice?.total_amount || 0;
    const currency = invoice?.currency || "EUR";
    
    // Manejo seguro de datos de cliente y compañía
    const client = invoice?.client as Client || {} as Client;
    const company = invoice?.company as Company || {} as Company;
    
    return (
      <div 
        ref={ref} 
        data-invoice-preview
        className="bg-white p-6 mx-auto text-sm relative"
        style={{
          width: "210mm",
          height: "297mm",
          maxWidth: "100%",
          margin: "0 auto"
        }}
      >
        {/* Cabecera */}
        <div className="flex justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">FACTURA</h1>
            <p className="mt-1">Nº: {invoiceNumber}</p>
            <p>Fecha: {formatDate(invoiceDate)}</p>
          </div>
          {/* Logo temporarily disabled until implemented in database
          {company?.logo_url && (
            <img 
              src={company?.logo_url} 
              alt="Logo" 
              className="h-16 w-auto object-contain" 
            />
          )}
          */}
        </div>
        
        {/* Datos del Emisor */}
        <div className="mb-8">
          <h2 className="font-bold border-b pb-1 mb-3 text-base">Datos del Emisor</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            <p><span className="font-semibold">Empresa:</span> {company?.name || "Pendiente"}</p>
            <p><span className="font-semibold">NIF:</span> {company?.nif || "Pendiente"}</p>
            <p><span className="font-semibold">Dirección:</span> {company?.address || "Pendiente"}, {company?.postcode || ""}</p>
            <p><span className="font-semibold">Ciudad:</span> {company?.city || "Pendiente"}, {company?.country || ""}</p>
          </div>
        </div>

        {/* Datos del Cliente */}
        <div className="mb-8">
          <h2 className="font-bold border-b pb-1 mb-3 text-base">Datos del Cliente</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            <p><span className="font-semibold">Cliente:</span> {client?.name || "Pendiente de selección"}</p>
            <p><span className="font-semibold">NIF:</span> {client?.nif || "Pendiente"}</p>
            <p><span className="font-semibold">Dirección:</span> {client?.address || "Pendiente"}, {client?.postcode || ""}</p>
            <p><span className="font-semibold">Ciudad:</span> {client?.city || "Pendiente"}, {client?.country || ""}</p>
          </div>
        </div>

        {/* Cambio aquí: en lugar de posicionar absolutamente, usamos flex */}
        <div className="flex flex-col h-full">
          <div className="flex-grow"></div> {/* Espaciador que empuja el contenido hacia abajo */}
          
          {/* Detalles Económicos */}
          <div className="w-full flex justify-end mt-12 mb-4">
            <div className="w-full max-w-xs">
              <div className="flex flex-col items-end">
                <div className="w-full">
                  <div className="flex justify-between py-2">
                    <span className="font-semibold">Base Imponible:</span>
                    <span>{formatCurrency(subtotal)} {currency}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="font-semibold">IVA ({taxRate}%):</span>
                    <span>{formatCurrency(taxAmount)} {currency}</span>
                  </div>
                  {irpfRate > 0 && (
                    <div className="flex justify-between py-2">
                      <span className="font-semibold">IRPF ({irpfRate}%):</span>
                      <span>-{formatCurrency(irpfAmount)} {currency}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 mt-2 font-bold border-t border-gray-300">
                    <span>TOTAL:</span>
                    <span>{formatCurrency(totalAmount)} {currency}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

InvoicePreview.displayName = "InvoicePreview";