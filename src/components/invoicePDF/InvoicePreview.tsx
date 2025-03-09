import React, { forwardRef } from "react";
import { Invoice } from "@/app/types/invoice";
import { formatCurrency, formatDate } from "@/lib/utils/invoice-calculations";
interface InvoicePreviewProps {
  invoice: Invoice;
}

export const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(
  ({ invoice }, ref) => {
    return (
      <div 
        ref={ref} 
        className="bg-white p-6 sm:p-10 max-w-4xl mx-auto text-sm"
      >
        {/* Cabecera */}
        <div className="flex justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">FACTURA</h1>
            <p className="mt-1">Nº: {invoice.invoice_number}</p>
            <p>Fecha: {formatDate(invoice.invoice_date)}</p>
          </div>
          {/* Logo temporarily disabled until implemented in database
          {invoice.company?.logo_url && (
            <img 
              src={invoice.company?.logo_url} 
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
            <p><span className="font-semibold">Empresa:</span> {invoice.company?.name}</p>
            <p><span className="font-semibold">NIF:</span> {invoice.company?.nif}</p>
            <p><span className="font-semibold">Dirección:</span> {invoice.company?.address}, {invoice.company?.postcode}</p>
            <p><span className="font-semibold">Ciudad:</span> {invoice.company?.city}, {invoice.company?.country}</p>
          </div>
        </div>

        {/* Datos del Cliente */}
        <div className="mb-8">
          <h2 className="font-bold border-b pb-1 mb-3 text-base">Datos del Cliente</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            <p><span className="font-semibold">Cliente:</span> {invoice.client?.name}</p>
            <p><span className="font-semibold">NIF:</span> {invoice.client?.nif}</p>
            <p><span className="font-semibold">Dirección:</span> {invoice.client?.address}, {invoice.client?.postcode}</p>
            <p><span className="font-semibold">Ciudad:</span> {invoice.client?.city}, {invoice.client?.country}</p>
          </div>
        </div>

        {/* Detalles Económicos */}
        <div className="mt-8">
          <div className="flex flex-col items-end">
            <div className="w-full max-w-xs">
              <div className="flex justify-between py-2">
                <span className="font-semibold">Base Imponible:</span>
                <span>{formatCurrency(invoice.subtotal || 0)} {invoice.currency}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-semibold">IVA ({invoice.tax_rate || 0}%):</span>
                <span>{formatCurrency(invoice.tax_amount || 0)} {invoice.currency}</span>
              </div>
              {(invoice.irpf_rate || 0) > 0 && (
                <div className="flex justify-between py-2">
                  <span className="font-semibold">IRPF ({invoice.irpf_rate || 0}%):</span>
                  <span>-{formatCurrency(invoice.irpf_amount || 0)} {invoice.currency}</span>
                </div>
              )}
              <div className="flex justify-between py-2 mt-2 font-bold border-t border-gray-300">
                <span>TOTAL:</span>
                <span>{formatCurrency(invoice.total_amount || 0)} {invoice.currency}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

InvoicePreview.displayName = "InvoicePreview";