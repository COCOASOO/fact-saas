import html2pdf from 'html2pdf.js';
import { Invoice } from '@/app/types/invoice';
import { toast } from 'sonner';
import { uploadPDF } from '@/lib/supabase/storageService';
import { updateInvoice } from '@/app/routes/invoices/route';
import { createClient } from '@/lib/supabase/supabaseClient';

// Clase para gestionar la generación de PDFs
export class PDFGenerator {
  /**
   * Método para generar un PDF a partir de un elemento HTML
   * Este método es usado tanto por generateAndStore como directamente por InvoicePopupManager
   */
  static async generatePDF(element: HTMLElement, options = {}): Promise<Blob> {
    if (!element) {
      throw new Error('No se ha proporcionado un elemento válido');
    }
    
    console.log('Iniciando generación de PDF a partir del elemento');

    // Configuración por defecto para el PDF
    const defaultOptions = {
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        backgroundColor: 'white',
        logging: false
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait'
      },
      pagebreak: { mode: 'avoid-all' } // Evitar todos los saltos de página automáticos
    };

    // Combinar opciones por defecto con las proporcionadas
    const finalOptions = { ...defaultOptions, ...options };
    
    console.log('Generando PDF con opciones:', finalOptions);
    
    try {
      // Generar PDF utilizando un método que nos permita eliminar la segunda página
      const pdfBlob = await html2pdf()
        .from(element)
        .set(finalOptions)
        .toPdf()
        .get('pdf')
        .then((pdf: { internal: { getNumberOfPages: () => number; }; deletePage: (arg0: any) => void; output: (arg0: string) => any; }) => {
          // Si hay más de una página, eliminamos todas excepto la primera
          if (pdf.internal.getNumberOfPages() > 1) {
            console.log(`Eliminando páginas adicionales. Total: ${pdf.internal.getNumberOfPages()}`);
            for (let i = pdf.internal.getNumberOfPages(); i > 1; i--) {
              pdf.deletePage(i);
            }
          }
          return pdf.output('blob');
        });
      
      console.log('PDF generado correctamente, tamaño:', pdfBlob.size);
      return pdfBlob;
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      throw error;
    }
  }

  // Método principal para generar PDF y almacenarlo
  static async generateAndStore(element: HTMLElement, invoice: Invoice): Promise<string> {
    if (!element) {
      throw new Error('No se ha proporcionado un elemento válido');
    }
    
    console.log('Iniciando generación y almacenamiento de PDF para factura:', invoice.id);

    // Obtener el usuario actual
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Usuario no autenticado');
      throw new Error('Usuario no autenticado');
    }
    
    console.log('Usuario autenticado:', user.id);

    try {
      // Usar el método común para generar el PDF
      const options = {
        filename: `${invoice.invoice_number || 'sin-numero'}.pdf`,
      };
      
      const pdfBlob = await this.generatePDF(element, options);
      
      // El resto del código para subir el PDF se mantiene igual
      const fileName = `${user.id}/${invoice.invoice_number || 'sin-numero'}.pdf`;
      console.log('Subiendo PDF al almacenamiento con nombre:', fileName);
      
      // Subir el PDF al almacenamiento
      const pdfUrl = await uploadPDF(pdfBlob, fileName, user.id);
      console.log('PDF subido exitosamente, URL:', pdfUrl);
      
      // Actualizar la factura con la URL del PDF
      const updatedInvoice = {
        ...invoice,
        pdf_url: pdfUrl,
      };
      
      console.log('Actualizando factura con URL del PDF');
      await updateInvoice(updatedInvoice);
      console.log('Factura actualizada correctamente');
      
      return pdfUrl;
    } catch (error) {
      console.error('Error al generar y almacenar el PDF:', error);
      throw error;
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
    // Ajustes críticos para evitar desbordamiento y páginas en blanco
    tempContainer.style.width = '210mm';  
    tempContainer.style.height = 'auto';
    tempContainer.style.overflow = 'hidden';
    tempContainer.style.backgroundColor = 'white';
    document.body.appendChild(tempContainer);

    // Clonar el contenido
    const clonedElement = originalElement.cloneNode(true) as HTMLElement;
    
    // Ajustar estilos para el PDF - correcciones críticas
    clonedElement.style.transform = 'none';
    clonedElement.style.width = '210mm';
    clonedElement.style.height = 'auto'; 
    clonedElement.style.margin = '0';
    clonedElement.style.padding = '0';
    clonedElement.style.boxSizing = 'border-box';
    
    // Eliminar cualquier elemento que pueda causar desbordamiento
    const overflowingElements = clonedElement.querySelectorAll('div, p, table, section');
    overflowingElements.forEach((el: Element) => {
      if (el instanceof HTMLElement) {
        el.style.overflow = 'visible';
        el.style.height = 'auto';
        el.style.maxHeight = 'none';
        // Eliminar márgenes y paddings excesivos
        if (parseInt(window.getComputedStyle(el).marginBottom) > 15) {
          el.style.marginBottom = '15px';
        }
        if (parseInt(window.getComputedStyle(el).paddingBottom) > 15) {
          el.style.paddingBottom = '15px';
        }
      }
    });

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
      toast.error('La factura no tiene un PDF asociado');
      return;
    }
    
    console.log('Iniciando descarga de PDF para factura:', invoice.id);
    
    try {
      // Extraer la ruta relativa del archivo desde la URL completa
      // La URL típica es algo como: https://[project-ref].supabase.co/storage/v1/object/public/invoices/userId/filename.pdf
      const urlParts = invoice.pdf_url.split('/');
      const bucketName = urlParts[urlParts.indexOf('object') + 2]; // Obtener el nombre del bucket
      const filePath = urlParts.slice(urlParts.indexOf(bucketName) + 1).join('/'); // Obtener la ruta del archivo
      
      console.log(`Extrayendo archivo desde bucket: ${bucketName}, ruta: ${filePath}`);
      
      // Inicializar cliente de Supabase
      const supabase = createClient();
      
      // Intentar descargar usando la API de Supabase Storage
      const { data, error } = await supabase
        .storage
        .from(bucketName)
        .download(filePath);
      
      if (error) {
        console.error('Error al descargar desde Supabase:', error);
        throw new Error(`Error al descargar el PDF: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('No se pudo obtener datos del archivo');
      }
      
      // Crear un enlace temporal para descargar el archivo
      const fileName = `${invoice.invoice_number || 'factura'}.pdf`;
      const downloadUrl = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link); // Necesario para Firefox
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      
      toast.success(`Factura ${fileName} descargada correctamente`);
    } catch (error) {
      console.error('Error en el proceso de descarga:', error);
      toast.error(`No se pudo descargar el PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      
      // Plan B: Intentar abrir en una nueva pestaña (puede requerir inicio de sesión)
      try {
        window.open(invoice.pdf_url, '_blank');
        toast.info('Intentando abrir el PDF en una nueva pestaña...');
      } catch (openError) {
        console.error('También falló abrir en nueva pestaña:', openError);
      }
    }
  }
}