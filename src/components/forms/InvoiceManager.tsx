import React, { useState, useEffect } from "react";
import { 
  Sheet, SheetContent, SheetDescription, 
  SheetHeader, SheetTitle, SheetFooter, SheetClose 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { InvoiceForm } from "@/components/forms/InvoiceForm";
import { InvoicePreviewWrapper } from "@/components/invoicePDF/InvoicePreviewWrapper";
import { Invoice } from "@/app/types/invoice";
import { Plus, Eye, Download } from "lucide-react";
import { addInvoice, updateInvoice } from "@/app/routes/invoices/route";
import { toast } from "sonner";

interface InvoiceManagerProps {
  invoice?: Invoice;
  onSuccess?: (invoice: Invoice) => void;
}

export function InvoiceManager({ invoice, onSuccess }: InvoiceManagerProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | undefined>(invoice);
  const [formData, setFormData] = useState<Omit<Invoice, 'id' | 'user_id' | 'created_at' | 'updated_at'>>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Actualizar el currentInvoice si el prop invoice cambia
  useEffect(() => {
    setCurrentInvoice(invoice);
  }, [invoice]);

  // Función para abrir el Sheet y mostrar el preview automáticamente
  const openSheet = () => {
    setIsSheetOpen(true);
    setIsPreviewVisible(true);
  };

  // Función para abrir/cerrar el preview
  const togglePreview = () => {
    setIsPreviewVisible(!isPreviewVisible);
  };

  // Cerrar todo
  const handleClose = () => {
    setIsSheetOpen(false);
    setIsPreviewVisible(false);
  };

  // Manejar cambios en el formulario
  const handleFormDataChange = (data: Omit<Invoice, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    setFormData(data);
  };

  // Manejar envío del formulario
  const handleSubmit = async (data: Omit<Invoice, 'id' | 'user_id'>) => {
    try {
      setIsSubmitting(true);
      let result;

      if (currentInvoice?.id) {
        // Actualizar factura existente
        result = await updateInvoice(currentInvoice.id, {
          ...data,
          id: currentInvoice.id,
          user_id: currentInvoice.user_id,
          created_at: currentInvoice.created_at,
          updated_at: new Date().toISOString()
        } as Invoice);
        toast.success("Factura actualizada correctamente");
      } else {
        // Crear nueva factura
        result = await addInvoice(data);
        toast.success("Factura creada correctamente");
      }

      // Notificar éxito
      if (onSuccess) {
        onSuccess(result);
      }

      // Cerrar todo
      handleClose();
    } catch (error) {
      console.error("Error al guardar la factura:", error);
      toast.error("Error al guardar la factura");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Botón para abrir el Sheet */}
      <Button onClick={openSheet}>
        <Plus className="mr-2 h-4 w-4" />
        {currentInvoice ? "Editar Factura" : "Nueva Factura"}
      </Button>

      {/* Overlay que contiene tanto el preview como el sheet */}
      {isSheetOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex">
          {/* Preview en el lado izquierdo */}
          {isPreviewVisible && formData && (
            <div className="w-2/3 p-4 overflow-auto">
              <div className="bg-white rounded-lg shadow-lg h-full flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Vista Previa de Factura</h2>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => {
                        // Aquí podríamos reutilizar la función de descarga del InvoicePreviewWrapper
                        // Para simplificar, abriremos el botón de descargar dentro del componente
                        toast.info("Descargando factura...");
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Descargar PDF
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={togglePreview}
                    >
                      Ocultar Preview
                    </Button>
                  </div>
                </div>
                <div className="flex-grow overflow-auto p-4">
                  <InvoicePreviewWrapper 
                    invoice={{
                      ...formData,
                      id: currentInvoice?.id || '',
                      user_id: currentInvoice?.user_id || '',
                      created_at: currentInvoice?.created_at || new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    }}
                    showDownloadButton={false}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sheet en el lado derecho */}
          <div className={isPreviewVisible ? "w-1/3" : "w-full"}>
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetContent 
                className="w-full h-full overflow-y-auto" 
                side={isPreviewVisible ? "right" : "right"}
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <SheetHeader>
                  <SheetTitle>{currentInvoice ? "Editar Factura" : "Crear Factura"}</SheetTitle>
                  <SheetDescription>
                    {currentInvoice 
                      ? "Modifica los detalles de la factura a continuación."
                      : "Ingresa la información para crear una nueva factura."}
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-4">
                  {/* Botón para mostrar/ocultar el preview */}
                  {formData && (
                    <Button 
                      variant="outline" 
                      className="mb-4 w-full"
                      onClick={togglePreview}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      {isPreviewVisible ? "Ocultar Preview" : "Mostrar Preview"}
                    </Button>
                  )}
                  
                  {/* Formulario de factura */}
                  <InvoiceForm
                    invoice={currentInvoice}
                    onSubmit={handleSubmit}
                    onCancel={handleClose}
                    onFormDataChange={handleFormDataChange}
                  />
                </div>
                
                <SheetFooter className="pt-4 flex justify-between">
                  <Button variant="outline" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    form="invoice-form"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Guardando..." : currentInvoice ? "Guardar Cambios" : "Crear Factura"}
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      )}
    </>
  );
}
