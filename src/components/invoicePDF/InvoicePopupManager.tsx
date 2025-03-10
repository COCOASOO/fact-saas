import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Overlay } from "@/components/invoicePDF/Overlay";
import { SidePanel } from "@/components/invoicePDF/SidePanel";
import { InvoiceForm } from "@/components/forms/InvoiceForm";
import { InvoicePreviewWrapper } from "@/components/invoicePDF/InvoicePreviewWrapper";
import { Invoice } from "@/app/types/invoice";
import { Plus, Eye, Download } from "lucide-react";
import { addInvoice, updateInvoice } from "@/app/routes/invoices/route";
import { toast } from "sonner";
import html2pdf from "html2pdf.js";

interface InvoicePopupManagerProps {
  invoice?: Invoice;
  onSuccess?: (invoice: Invoice) => void;
}

export function InvoicePopupManager({ invoice, onSuccess }: InvoicePopupManagerProps) {
  console.log("[InvoicePopupManager] Mounting component with props:", { invoice });
  
  const [isOpen, setIsOpen] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | undefined>(invoice);
  const [formData, setFormData] = useState<any>({
    client_id: '',  // Inicializar siempre con un valor
    items: []       // Inicializar con array vacío
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const formInitialized = useRef(false);

  // Actualizar el currentInvoice si el prop invoice cambia
  useEffect(() => {
    console.log("[InvoicePopupManager] Invoice prop changed:", { 
      oldInvoice: currentInvoice, 
      newInvoice: invoice 
    });
    setCurrentInvoice(invoice);
  }, [invoice]);

  // Inicializar formData cuando se abre el popup
  useEffect(() => {
    if (isOpen) {
      console.log("[ClientSelector] Initializing form data");
      
      // Solo actualizar si no se ha inicializado ya o si el currentInvoice ha cambiado
      if (!formInitialized.current || currentInvoice) {
        const initialData = currentInvoice ? {
          ...currentInvoice,
          client_id: currentInvoice.client_id || '',
          items: currentInvoice.items || []
        } : {
          client_id: '',
          company_id: '',
          date: new Date().toISOString().split('T')[0],
          invoice_number: '',
          status: 'draft',
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
          currency: 'EUR',
          subtotal: 0,
          tax_rate: 21,
          tax_amount: 0,
          irpf_rate: 15,
          irpf_amount: 0,
          total_amount: 0,
          items: [],
          payment_method: 'transfer',
          notes: '',
          series_id: '',
        };

        console.log("[ClientSelector] Initial form data:", initialData);
        console.log("[ClientSelector] Initial client_id:", initialData.client_id);
        setFormData(initialData);
        formInitialized.current = true;
      }
    } else {
      // Resetear el flag cuando se cierra el popup
      formInitialized.current = false;
    }
  }, [isOpen, currentInvoice]);

  // Log cuando el popup se abre/cierra
  useEffect(() => {
    console.log("Popup state changed:", { isOpen });
    
    if (isOpen) {
      console.log("Current form data when opening:", formData);
      console.log("Current invoice when opening:", currentInvoice);
    }
  }, [isOpen, formData, currentInvoice]);

  // Manejar cambios en el formulario
  const handleFormDataChange = (data: any) => {
    console.log("[ClientSelector] Form data changed");
    console.log("[ClientSelector] Previous client_id:", formData?.client_id);
    console.log("[ClientSelector] New client_id:", data.client_id);
    
    // Log específico si cambia el cliente
    if (data.client_id !== formData?.client_id) {
      console.log("[ClientSelector] Client selection changed!");
      console.log("[ClientSelector] Selected client data:", data.client_id);
    }

    // Asegurar que items siempre sea un array
    if (!data.items) {
      data.items = [];
    }

    setFormData(data);
  };

  // Función para abrir el popup
  const openPopup = () => {
    console.log("[ClientSelector] Opening popup with clean state");
    
    // Resetear formInitialized para forzar la reinicialización
    formInitialized.current = false;
    
    setIsOpen(true);
  };

  // Función para cerrar el popup
  const closePopup = () => {
    console.log("[Form] Closing popup");
    console.log("[Form] Final form state:", formData);
    setIsOpen(false);
  };

  // Función para mostrar/ocultar el preview
  const togglePreview = () => {
    console.log("Toggling preview, current state:", isPreviewVisible);
    setIsPreviewVisible(!isPreviewVisible);
  };

  // Función para enviar el formulario
  const handleSubmit = async (formValues: any) => {
    console.log("[Form] Submitting form with values:", formValues);
    
    // Asegurar que client_id esté definido
    if (!formValues.client_id) {
      toast.error("Por favor, selecciona un cliente");
      return;
    }
    
    // Asegurar que items sea siempre un array
    if (!formValues.items) {
      formValues.items = [];
    }

    setIsSubmitting(true);
    
    try {
      let savedInvoice;
      
      if (currentInvoice?.id) {
        console.log("[Form] Updating existing invoice:", currentInvoice.id);
        savedInvoice = await updateInvoice({
          ...formValues,
          id: currentInvoice.id
        });
        toast.success("Factura actualizada correctamente");
      } else {
        console.log("[Form] Creating new invoice");
        savedInvoice = await addInvoice(formValues);
        toast.success("Factura creada correctamente");
      }
      
      console.log("[Form] Operation successful, saved invoice:", savedInvoice);
      
      if (onSuccess) {
        onSuccess(savedInvoice);
      }
      
      closePopup();
    } catch (error) {
      console.error("[Form] Error submitting form:", error);
      toast.error("Error al guardar la factura");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para descargar el PDF
  const handleDownloadPDF = () => {
    console.log("Attempting to download PDF");
    
    if (!previewRef.current) {
      console.error("Preview ref is null");
      toast.error("No se pudo generar el PDF");
      return;
    }
    
    const invoiceElement = previewRef.current.querySelector('[data-invoice-preview]');
    
    if (!invoiceElement) {
      console.error("Invoice element not found in preview");
      toast.error("No se pudo generar el PDF");
      return;
    }
    
    console.log("PDF element found:", invoiceElement);
    
    const options = {
      margin: 0,
      filename: `${formData?.invoice_number || 'factura'}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    };

    console.log("PDF options:", options);
    toast.info("Generando PDF...");
    
    html2pdf().from(invoiceElement).set(options).save()
      .then(() => {
        console.log("PDF generated successfully");
        toast.success("PDF descargado correctamente");
      })
      .catch((err: any) => {
        console.error("Error al generar PDF:", err);
        toast.error("Error al generar el PDF");
      });
  };

  // Renderizado condicional del footer del panel
  const formFooter = (
    <div className="flex justify-between w-full">
      <Button 
        variant="outline" 
        onClick={closePopup}
        disabled={isSubmitting}
      >
        Cancelar
      </Button>
      
      <Button 
        type="submit"
        disabled={isSubmitting}
        onClick={() => document.getElementById('invoice-form-submit')?.click()}
      >
        {isSubmitting ? 'Guardando...' : (currentInvoice ? 'Actualizar' : 'Crear')}
      </Button>
    </div>
  );

  // Crear un objeto completo para el preview
  const getPreviewData = () => {
    if (!formData) {
      console.log("No form data available for preview");
      return null;
    }
    
    // Nos aseguramos de que items siempre sea un array
    const items = Array.isArray(formData.items) ? formData.items : [];
    
    const previewData = {
      ...formData,
      items: items,
      id: currentInvoice?.id || '',
      user_id: currentInvoice?.user_id || '',
      created_at: currentInvoice?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    console.log("Generated preview data:", previewData);
    
    // Verificación de campos críticos
    if (!previewData.client_id) {
      console.warn("Preview data missing client_id");
    }
    
    if (!previewData.invoice_number) {
      console.warn("Preview data missing invoice_number");
    }
    
    if (items.length === 0) {
      console.warn("Preview data has empty items array");
    }
    
    return previewData;
  };

  // Determinar si hay suficientes datos para mostrar el preview
  const shouldShowPreview = () => {
    return isPreviewVisible && formData;
  };

  return (
    <>
      <Button onClick={openPopup}>
        <Plus className="mr-2 h-4 w-4" />
        {currentInvoice ? "Editar Factura" : "Nueva Factura"}
      </Button>

      <Overlay isOpen={isOpen} onClick={(e) => e.stopPropagation()} disableClose={true}>
        <div className="flex w-full h-full relative z-10">
          {/* Preview */}
          {shouldShowPreview() && (
            <div className="flex-1 p-6 overflow-auto relative z-20">
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
                    invoice={getPreviewData()}
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
            className={`${isPreviewVisible ? "border-l" : ""} relative z-30`}
          >
            <Button 
              variant="outline" 
              className="mb-4 w-full"
              onClick={togglePreview}
            >
              <Eye className="mr-2 h-4 w-4" />
              {isPreviewVisible ? "Ocultar Preview" : "Mostrar Preview"}
            </Button>
            
            <div className="relative z-40">
              <InvoiceForm
                key={`invoice-form-${isOpen ? 'open' : 'closed'}`}
                invoice={currentInvoice}
                onSubmit={handleSubmit}
                onCancel={closePopup}
                onFormDataChange={handleFormDataChange}
                initialData={formData}
              />
            </div>
          </SidePanel>
        </div>
      </Overlay>
    </>
  );
}