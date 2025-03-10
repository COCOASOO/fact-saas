import React, { useState, useEffect, useRef } from "react";
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
} from "@/app/routes/invoices/route";
import { getClientById } from "@/app/routes/clients/route";
import { getUserCompany } from "@/app/routes/companies/route";
import { toast } from "sonner";
import html2pdf from "html2pdf.js";

interface InvoicePopupManagerProps {
  invoice?: Invoice;
  onSuccess?: (invoice: Invoice) => void;
}

export function InvoicePopupManager({
  invoice,
  onSuccess,
}: InvoicePopupManagerProps) {
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

  // Función para abrir el popup con un invoice existente o crear uno nuevo
  const openPopup = (existingInvoice?: Invoice) => {

    // Simplemente pasamos el valor tal cual, que ya es del tipo correcto (Invoice | undefined)
    setCurrentInvoice(existingInvoice);
    formInitialized.current = false; // Cambiado de setFormInitialized({ current: false })
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
        savedInvoice = await updateInvoice({
          ...formValues,
          id: currentInvoice.id,
        });
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

  // Función para descargar el PDF
  const handleDownloadPDF = () => {

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

    const options = {
      margin: 0,
      filename: `${formData?.invoice_number || "factura"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    toast.info("Generando PDF...");

    html2pdf()
      .from(invoiceElement)
      .set(options)
      .save()
      .then(() => {
        toast.success("PDF descargado correctamente");
      })
      .catch((err: any) => {
        console.error("Error al generar PDF:", err);
        toast.error("Error al generar el PDF");
      });
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
    return isPreviewVisible && formData;
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
        type="button" // Cambiado de "submit" a "button"
        disabled={isSubmitting}
        onClick={() => {
          // Buscar el botón de submit en el formulario y hacer clic en él
          const submitButton = document.getElementById("invoice-form-submit");
          if (submitButton) {
            submitButton.click();
          }
        }}
      >
        {isSubmitting
          ? "Guardando..."
          : currentInvoice
          ? "Actualizar"
          : "Crear"}
      </Button>
    </div>
  );

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
            <Button
              variant="outline"
              className="mb-4 w-full"
              onClick={togglePreview}
            >
              <Eye className="mr-2 h-4 w-4" />
              {isPreviewVisible ? "Ocultar Preview" : "Mostrar Preview"}
            </Button>

            <div style={{ position: "relative", zIndex: 100 }}>
              <InvoiceForm
                key={`invoice-form-${isOpen ? "open" : "closed"}`}
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
