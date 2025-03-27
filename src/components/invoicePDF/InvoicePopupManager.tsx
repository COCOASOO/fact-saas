import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Overlay } from "@/components/invoicePDF/Overlay";
import { SidePanel } from "@/components/invoicePDF/SidePanel";
import { InvoiceForm } from "@/components/forms/InvoiceForm";
import { InvoicePreviewWrapper } from "@/components/invoicePDF/InvoicePreviewWrapper";
import { Invoice } from "@/app/types/invoice";
import { Plus, Eye, Download } from "lucide-react";
import {
  addInvoice,
  updateInvoice,
  getInvoiceById,
} from "@/app/utils/invoices";
import { getClientById } from "@/app/utils/clients";
import { getUserCompany } from "@/app/utils/companies";
import { toast } from "sonner";
import html2pdf from "html2pdf.js";
import { PDFGenerator } from "@/components/invoicePDF/pdfService";
import { createClient } from "@/lib/supabase/supabaseClient";

interface InvoicePopupManagerProps {
  invoice?: Invoice;
  onSuccess?: (invoice: Invoice) => void;
}

export const InvoicePopupManager = forwardRef<
  { openPopup: (invoice?: Invoice) => void },
  InvoicePopupManagerProps
>(({ invoice, onSuccess }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | undefined>(
    undefined
  );
  const [formData, setFormData] = useState<any>({
    client_id: "", // Inicializar siempre con un valor
    items: [], // Inicializar con array vacío
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const formInitialized = useRef(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [companyData, setCompanyData] = useState<any>(null);

  // Actualizar el currentInvoice si el prop invoice cambia
  useEffect(() => {
    setCurrentInvoice(invoice);
  }, [invoice]);

  // Inicializar formData cuando se abre el popup
  useEffect(() => {
    if (isOpen) {

      // Solo actualizar si no se ha inicializado ya o si el currentInvoice ha cambiado
      if (!formInitialized.current || currentInvoice) {
        const initialData = currentInvoice
          ? {
              ...currentInvoice,
              client_id: currentInvoice.client_id || "",
            }
          : {
              client_id: "",
              company_id: "",
              date: new Date().toISOString().split("T")[0],
              invoice_number: "",
              status: "draft",
              invoice_date: new Date().toISOString().split("T")[0],
              due_date: new Date(new Date().setDate(new Date().getDate() + 30))
                .toISOString()
                .split("T")[0],
              currency: "EUR",
              subtotal: 0,
              tax_rate: 21,
              tax_amount: 0,
              irpf_rate: 15,
              irpf_amount: 0,
              total_amount: 0,
              items: [],
              payment_method: "transfer",
              notes: "",
              series_id: "",
            };

        
        setFormData(initialData);
        formInitialized.current = true;
      }
    } else {
      // Resetear el flag cuando se cierra el popup
      formInitialized.current = false;
    }
  }, [isOpen, currentInvoice]);

  // Cargar datos de la compañía
  useEffect(() => {
    const loadCompanyData = async () => {
      try {
        const company = await getUserCompany();
        setCompanyData(company);
      } catch (error) {
        console.error(
          "[InvoicePopupManager] Error loading company data:",
          error
        );
      }
    };

    if (isOpen) {
      loadCompanyData();
    }
  }, [isOpen]);

  // Cargar datos completos del cliente cuando cambia formData.client_id
  useEffect(() => {
    const loadClientData = async () => {
      if (formData?.client_id) {
        try {
          const client = await getClientById(formData.client_id);
          setSelectedClient(client);
        } catch (error) {
          console.error(
            "[InvoicePopupManager] Error loading client data:",
            error
          );
        }
      } else {
        setSelectedClient(null);
      }
    };

    if (isOpen && formData?.client_id) {
      loadClientData();
    }
  }, [isOpen, formData?.client_id]);

  // Manejar cambios en el formulario
  const handleFormDataChange = (data: any) => {
    // Asegurar que items siempre sea un array
    if (!data.items) {
      data.items = [];
    }

    setFormData(data);
  };

  // Expose the openPopup method via ref
  useImperativeHandle(ref, () => ({
    openPopup: (existingInvoice?: Invoice) => {
      setCurrentInvoice(existingInvoice);
      formInitialized.current = false;
      setIsOpen(true);
    }
  }));

  // Original openPopup function can remain for the button click
  const openPopup = (existingInvoice?: Invoice) => {
    setCurrentInvoice(existingInvoice);
    formInitialized.current = false;
    setIsOpen(true);
  };

  const closePopup = () => {
    setIsOpen(false);
  };

  // Función para mostrar/ocultar el preview
  const togglePreview = () => {
    setIsPreviewVisible(!isPreviewVisible);
  };

  // Función para enviar el formulario
  const handleSubmit = async (formValues: any) => {

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
        const updateData = { ...formValues };
        delete updateData.id; // Eliminar el id del objeto de datos
        savedInvoice = await updateInvoice(currentInvoice.id, updateData);
        toast.success("Factura actualizada correctamente");
      } else {
        savedInvoice = await addInvoice(formValues);
        toast.success("Factura creada correctamente");
      }


      if (onSuccess) {
        onSuccess(savedInvoice);
      }

      closePopup();
    } catch (error) {
      toast.error("Error al guardar la factura");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para guardar la factura y generar PDF
  const handleSaveInvoice = async () => {
    try {
      // Asegurar que client_id esté definido
      if (!formData.client_id) {
        toast.error("Por favor, selecciona un cliente");
        return;
      }

      // Asegurar que items sea siempre un array
      const invoiceData = { 
        ...formData,
        items: formData.items || [] 
      };

      setIsSubmitting(true);
      console.log("Guardando factura con datos:", invoiceData);

      let savedInvoice;

      try {
        if (currentInvoice?.id) {
          console.log("Actualizando factura existente:", currentInvoice.id);
          const updateData = { ...invoiceData };
          delete updateData.id; // Eliminar el id del objeto de datos
          savedInvoice = await updateInvoice(currentInvoice.id, updateData);
        } else {
          console.log("Creando nueva factura");
          savedInvoice = await addInvoice(invoiceData);
        }
        
        console.log("Factura guardada exitosamente:", savedInvoice);
        
        // Una vez guardada la factura, generamos el PDF
        if (savedInvoice && previewRef.current) {
          console.log("Buscando elemento preview para generar PDF");
          const invoiceElement = previewRef.current.querySelector(
            "[data-invoice-preview]"
          );

          if (invoiceElement) {
            console.log("Elemento preview encontrado, generando PDF");
            toast.loading("Generando PDF...");
            
            try {
              console.log("Utilizando PDFGenerator para generar el PDF");
              const pdfBlob = await PDFGenerator.generatePDF(invoiceElement as HTMLElement, {
                filename: `${savedInvoice.invoice_number}.pdf`
              });
              
              console.log("PDF generado correctamente, tamaño:", pdfBlob.size);
              
              // Nombre de archivo sin prefijo BORRADOR-
              const cleanInvoiceNumber = savedInvoice.invoice_number?.replace('BORRADOR-', '');
              const fileName = `${cleanInvoiceNumber}.pdf`;
              
              console.log("Subiendo PDF a Storage:", fileName);
              
              // Importación dinámica para asegurar que uploadPDF está accesible
              const { uploadPDF } = await import('@/lib/supabase/storageService');
              const pdfUrl = await uploadPDF(pdfBlob, fileName, savedInvoice.user_id);
              
              console.log("PDF subido exitosamente, URL:", pdfUrl);
              
              // Actualizar factura con la URL del PDF
              if (savedInvoice && savedInvoice.id) {
                console.log("Actualizando factura con URL del PDF");
                await updateInvoice(savedInvoice.id, { pdf_url: pdfUrl });
              }
              
              toast.dismiss();
              toast.success("Factura y PDF guardados correctamente");
            } catch (pdfError) {
              console.error("Error al generar o guardar el PDF:", pdfError);
              toast.dismiss();
              toast.error("La factura se guardó pero hubo un error al generar el PDF");
            }
          } else {
            console.warn("No se encontró elemento preview para generar PDF");
          }
        }

        if (onSuccess) {
          onSuccess(savedInvoice);
        }

        closePopup();
      } catch (error) {
        console.error("Error al guardar la factura:", error);
        toast.error("Error al guardar la factura");
      } finally {
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error general en handleSaveInvoice:", error);
      setIsSubmitting(false);
      toast.error("Error al procesar la operación");
    }
  };

  // Función para descargar el PDF
  const handleDownloadPDF = async () => {
    try {
      if (!previewRef.current) {
        toast.error("No se pudo generar el PDF");
        return;
      }

      const invoiceElement = previewRef.current.querySelector(
        "[data-invoice-preview]"
      );

      if (!invoiceElement) {
        toast.error("No se pudo generar el PDF");
        return;
      }

      toast.loading("Generando PDF...");

      // Si ya hay un PDF guardado, descárgalo directamente
      if (currentInvoice?.pdf_url) {
        await PDFGenerator.downloadFromURL(currentInvoice);
        toast.dismiss();
        toast.success("PDF descargado correctamente");
        return;
      }

      // Si no, genera y guarda el PDF
      const previewData = getPreviewData();
      if (!previewData) {
        toast.dismiss();
        toast.error("No hay datos suficientes para generar el PDF");
        return;
      }

      // Generar y guardar el PDF
      await PDFGenerator.generateAndStore(invoiceElement as HTMLElement, previewData);
      
      toast.dismiss();
      toast.success("PDF descargado y guardado correctamente");
      
    } catch (err: any) {
      console.error("Error al generar PDF:", err);
      toast.dismiss();
      toast.error("Error al generar el PDF");
    }
  };

  // Crear un objeto completo para el preview
  const getPreviewData = () => {
    if (!formData) {
      return undefined;
    }

    // Nos aseguramos de que items siempre sea un array
    const items = Array.isArray(formData.items) ? formData.items : [];

    // Construir la factura con los datos necesarios para el preview
    const previewData = {
      ...formData,
      items: items,
      id: currentInvoice?.id || "",
      user_id: currentInvoice?.user_id || "",
      created_at: currentInvoice?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Añadir explícitamente los objetos completos para el preview
      client: selectedClient || {},
      company: companyData || {},
    } as Invoice; // Forzar el tipo para evitar errores

    return previewData;
  };

  // Determinar si hay suficientes datos para mostrar el preview
  const shouldShowPreview = () => {
    return isPreviewVisible && isOpen;
  };

  // Añadir este useEffect
  useEffect(() => {
    // Agregar un estilo dinámico para asegurar que los selects funcionen en modales
    if (isOpen) {
      const style = document.createElement("style");
      style.id = "invoice-popup-select-fix";
      style.innerHTML = `
        [role="listbox"],
        [data-radix-popper-content-wrapper] {
          z-index: 300 !important;
        }
      `;
      document.head.appendChild(style);

      return () => {
        const styleElem = document.getElementById("invoice-popup-select-fix");
        if (styleElem) styleElem.remove();
      };
    }
  }, [isOpen]);

  // Actualizar el botón de footer para que envíe el formulario
  const formFooter = (
    <div className="flex justify-between w-full">
      <Button variant="outline" onClick={closePopup} disabled={isSubmitting}>
        Cancelar
      </Button>

      <Button
        type="button"
        disabled={isSubmitting}
        onClick={handleSaveInvoice}
      >
        {isSubmitting
          ? "Guardando..."
          : currentInvoice
          ? "Actualizar"
          : "Crear"}
      </Button>
    </div>
  );

  // En un componente que se carga al inicio
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.storage.listBuckets();
        
        if (error) {
          console.error('Error al verificar conexión con Supabase Storage:', error);
        } else {
          console.log('Conexión a Supabase Storage correcta. Buckets disponibles:', data?.map(b => b.name));
        }
      } catch (err) {
        console.error('Error al verificar Supabase:', err);
      }
    };
    
    checkSupabaseConnection();
  }, []);

  return (
    <>
      <Button onClick={() => openPopup(invoice)}>
        <Plus className="mr-2 h-4 w-4" />
        {invoice ? "Editar Factura" : "Nueva Factura"}
      </Button>

      <Overlay isOpen={isOpen} onClick={() => {}} disableClose={true}>
        <div className="flex w-full h-full relative z-10">
          {/* Preview */}
          {shouldShowPreview() && (
            <div className="flex-1 p-6 overflow-auto relative z-20">
              <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                  <h2 className="text-xl font-semibold">
                    Vista Previa de Factura
                  </h2>
                </div>
                <div className="flex-grow overflow-auto p-4" ref={previewRef}>
                  {getPreviewData() && (
                    <InvoicePreviewWrapper
                      invoice={getPreviewData() as Invoice}
                      showDownloadButton={false}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Panel lateral con el formulario */}
          <SidePanel
            isOpen={true}
            onClose={closePopup}
            title={currentInvoice ? "Editar Factura" : "Crear Factura"}
            description={
              currentInvoice
                ? "Modifica los detalles de la factura a continuación."
                : "Ingresa la información para crear una nueva factura."
            }
            footer={formFooter}
            className={`${isPreviewVisible ? "border-l" : ""}`}
          >
            <div style={{ position: "relative", zIndex: 100 }}>
              <InvoiceForm
                key={`invoice-form-${isOpen ? "open" : "closed"}`}
                invoice={currentInvoice}
                onSubmit={handleSaveInvoice}
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
});

InvoicePopupManager.displayName = "InvoicePopupManager";
