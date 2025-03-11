import html2pdf from 'html2pdf.js';
import { Invoice } from '@/app/types/invoice';
import { toast } from 'sonner';
import { uploadPDF, downloadPDF } from '@/lib/supabase/storageService';
import { updateInvoice } from '@/app/routes/invoices/route';
import { createClient } from '@/lib/supabase/supabaseClient';

// Clase para gestionar la generación de PDFs
export class PDFGenerator {
  // Método principal para generar PDF a partir del elemento existente
  static async generateAndStore(element: HTMLElement, invoice: Invoice): Promise<string> {
    if (!element) {
      throw new Error('No se ha proporcionado un elemento válido');
    }

    // Obtener el usuario actual
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Eliminar cualquier transformación que pueda afectar al renderizado
    const elementClone = element.cloneNode(true) as HTMLElement;
    elementClone.style.transform = 'none';
    elementClone.style.width = '210mm';
    elementClone.style.height = '297mm';
    elementClone.style.padding = '15mm';
    elementClone.style.boxSizing = 'border-box';
    elementClone.style.backgroundColor = 'white';

    // Configuración para html2pdf
    const options = {
      margin: 0,
      filename: `factura-${invoice.invoice_number || 'sin-numero'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        backgroundColor: 'white',
        logging: true,
        windowWidth: 794, // Ancho A4 en px (210mm)
        windowHeight: 1123 // Alto A4 en px (297mm)
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true
      },
      output: 'blob' // Generar como blob para subir
    };

    // Crear contenedor temporal
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.appendChild(elementClone);
    document.body.appendChild(tempContainer);

    try {
      // Esperar a que los estilos se apliquen
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generar PDF como blob
      const pdfBlob = await html2pdf()
        .set(options)
        .from(elementClone)
        .outputPdf('blob');
      
      // Nombre de archivo único con id de la factura
      const fileName = `invoice_${invoice.id}_${Date.now()}.pdf`;
      
      // Subir a Supabase Storage con el userId para cumplir las políticas
      const pdfUrl = await uploadPDF(pdfBlob, fileName, user.id);
      
      // Actualizar la factura con la URL del PDF
      if (invoice.id) {
        await updateInvoice({
          ...invoice,
          pdf_url: pdfUrl
        });
      }
      
      return pdfUrl;
    } finally {
      // Limpiar
      document.body.removeChild(tempContainer);
    }
  }

  // Método para crear una copia invisible del elemento y generar PDF
  static async generateInvisibleCopy(selector: string, invoice: Invoice): Promise<void> {
    // Encontrar el elemento original
    const originalElement = document.querySelector(selector);
    if (!originalElement) {
      throw new Error(`No se encontró el elemento con selector: ${selector}`);
    }

    // Crear una copia del elemento para no afectar el original
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '210mm';
    tempContainer.style.height = '297mm';
    tempContainer.style.overflow = 'hidden';
    tempContainer.style.backgroundColor = 'white';
    document.body.appendChild(tempContainer);

    // Clonar el contenido
    const clonedElement = originalElement.cloneNode(true) as HTMLElement;
    
    // Ajustar estilos para el PDF
    clonedElement.style.transform = 'none';
    clonedElement.style.width = '210mm';
    clonedElement.style.height = '297mm';
    clonedElement.style.overflow = 'hidden';
    clonedElement.style.margin = '0';
    clonedElement.style.boxSizing = 'border-box';
    
    tempContainer.appendChild(clonedElement);

    try {
      // Asegurarnos de que todos los estilos se apliquen
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generar el PDF
      await this.generateAndStore(clonedElement, invoice);
      
      return Promise.resolve();
    } finally {
      // Limpiar
      if (tempContainer && tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }
    }
  }

  // Método para descargar un PDF existente
  static async downloadFromURL(invoice: Invoice): Promise<void> {
    if (!invoice.pdf_url) {
      throw new Error('Esta factura no tiene un PDF guardado');
    }
    
    const filename = `factura-${invoice.invoice_number || 'sin-numero'}.pdf`;
    await downloadPDF(invoice.pdf_url, filename);
  }
}