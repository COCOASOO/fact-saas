import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Overlay } from "@/components/invoicePDF/Overlay";
import { SidePanel } from "@/components/invoicePDF/SidePanel";
import { InvoiceForm } from "@/components/forms/InvoiceForm";
import { InvoicePreviewWrapper } from "@/components/invoicePDF/InvoicePreviewWrapper";
import { Invoice, InvoiceFormData } from "@/app/types/invoice";
import { Plus, Eye, Download } from "lucide-react";
import { addInvoice, updateInvoice } from "@/app/routes/invoices/route";
import { toast } from "sonner";
import html2pdf from "html2pdf.js";

interface InvoicePopupManagerProps {
  invoice?: Invoice;
  onSuccess?: (invoice: Invoice) => void;
}

export function InvoicePopupManager({ invoice, onSuccess }: InvoicePopupManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | undefined>(invoice);
  const [formData, setFormData] = useState<InvoiceFormData | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Actualizar el currentInvoice si el prop invoice cambia
  useEffect(() => {
    setCurrentInvoice(invoice);
    
    // Si el invoice cambia, actualizar también formData
    if (invoice) {
      const {
        id, created_at, updated_at, pdf_url, 
        verifactu_xml, verifactu_hash, verifactu_signature, 
        verifactu_status, verifactu_response, invoice_type,
        ...formFields
      } = invoice;
      
      setFormData(formFields as InvoiceFormData);
    }
  }, [invoice]);

  // Inicializar formData cuando se abre el popup
  useEffect(() => {
    if (isOpen && !formData) {
      // Valores por defecto para nueva factura
      setFormData({
        user_id: '', // Se establecerá en el backend
        client_id: '',
        company_id: '', // Se establecerá según la empresa activa
        date: new Date().toISOString().split('T')[0],
        invoice_number: '',
        status: 'draft',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: '',
        currency: 'EUR',
        subtotal: 0,
        tax_rate: 21,
        tax_amount: 0,
        irpf_rate: 0,
        irpf_amount: 0,
        total_amount: 0,
        series_id: '',
        rectifies_invoice_id: null
      });
    }
  }, [isOpen, formData]);

  // Función para abrir el popup
  const openPopup = () => {
    setIsOpen(true);
    setIsPreviewVisible(true);
  };

  // Función para cerrar el popup
  const closePopup = () => {
    setIsOpen(false);
    if (!currentInvoice) {
      setFormData(undefined);
    }
  };

  // Función para mostrar/ocultar el preview
  const togglePreview = () => {
    setIsPreviewVisible(!isPreviewVisible);
  };

  // Manejar cambios en el formulario
  const handleFormDataChange = (data: InvoiceFormData) => {
    console.log("Form data changed:", data);
    setFormData(data);
  };

  // Manejar envío del formulario
  const handleSubmit = async (data: InvoiceFormData) => {
    try {
      setIsSubmitting(true);
      let result;

      if (currentInvoice?.id) {
        // Actualizar factura existente
        result = await updateInvoice(currentInvoice.id, {
          ...currentInvoice,
          ...data,
          updated_at: new Date().toISOString()
        });
        toast.success("Factura actualizada correctamente");
      } else {
        // Crear nueva factura - añadimos los campos faltantes
        const now = new Date().toISOString();
        
        // Creamos un objeto completo que cumpla con los requisitos de addInvoice
        const completeInvoiceData: Omit<Invoice, "id" | "user_id"> = {
          ...data,
          created_at: now,
          updated_at: now,
          pdf_url: null,
          verifactu_xml: null,
          verifactu_hash: null,
          verifactu_signature: null,
          verifactu_status: null,
          verifactu_response: null,
          invoice_type: 'standard'
        };
        
        result = await addInvoice(completeInvoiceData);
        toast.success("Factura creada correctamente");
      }

      if (onSuccess) {
        onSuccess(result);
      }
      closePopup();
    } catch (error) {
      console.error("Error al guardar la factura:", error);
      toast.error("Error al guardar la factura");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para descargar PDF
  const handleDownloadPDF = () => {
    if (!previewRef.current || !formData) return;
    
    const invoiceElement = previewRef.current.querySelector('[data-invoice-preview]');
    
    if (!invoiceElement) {
      toast.error("No se pudo generar el PDF");
      return;
    }
    
    const options = {
      margin: 0,
      filename: `${formData.invoice_number || 'factura'}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    };

    toast.info("Generando PDF...");
    
    html2pdf().from(invoiceElement).set(options).save()
      .then(() => toast.success("PDF descargado correctamente"))
      .catch((err: any) => {
        console.error("Error al generar PDF:", err);
        toast.error("Error al generar el PDF");
      });
  };

  // Footer con los botones para el formulario
  const formFooter = (
    <div className="flex justify-between">
      <Button variant="outline" onClick={closePopup}>
        Cancelar
      </Button>
      <Button 
        type="submit" 
        form="invoice-form"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Guardando..." : currentInvoice ? "Guardar Cambios" : "Crear Factura"}
      </Button>
    </div>
  );

  return (
    <>
      <Button onClick={openPopup}>
        <Plus className="mr-2 h-4 w-4" />
        {currentInvoice ? "Editar Factura" : "Nueva Factura"}
      </Button>

      <Overlay isOpen={isOpen} onClick={closePopup} disableClose={true}>
        <div className="flex w-full h-full">
          {/* Preview */}
          {isPreviewVisible && formData && (
            <div className="flex-1 p-6 overflow-auto">
              <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Vista Previa de Factura</h2>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleDownloadPDF}>
                      <Download className="mr-2 h-4 w-4" />
                      Descargar PDF
                    </Button>
                    <Button size="sm" variant="outline" onClick={togglePreview}>
                      Ocultar Preview
                    </Button>
                  </div>
                </div>
                <div className="flex-grow overflow-auto p-4" ref={previewRef}>
                  <InvoicePreviewWrapper 
                    invoice={{
                      ...formData,
                      id: currentInvoice?.id || '',
                      created_at: currentInvoice?.created_at || new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                      pdf_url: currentInvoice?.pdf_url || null,
                      verifactu_xml: null,
                      verifactu_hash: null,
                      verifactu_signature: null,
                      verifactu_status: null,
                      verifactu_response: null,
                      invoice_type: 'standard'
                    }}
                    showDownloadButton={false}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Panel lateral con el formulario */}
          <SidePanel
            isOpen={true}
            onClose={closePopup}
            title={currentInvoice ? "Editar Factura" : "Crear Factura"}
            description={currentInvoice 
              ? "Modifica los detalles de la factura a continuación."
              : "Ingresa la información para crear una nueva factura."}
            footer={formFooter}
            className={isPreviewVisible ? "border-l" : ""}
          >
            <Button 
              variant="outline" 
              className="mb-4 w-full"
              onClick={togglePreview}
            >
              <Eye className="mr-2 h-4 w-4" />
              {isPreviewVisible ? "Ocultar Preview" : "Mostrar Preview"}
            </Button>
            
            <InvoiceForm
              invoice={currentInvoice}
              onSubmit={handleSubmit}
              onCancel={closePopup}
              onFormDataChange={handleFormDataChange}
            />
          </SidePanel>
        </div>
      </Overlay>
    </>
  );
}