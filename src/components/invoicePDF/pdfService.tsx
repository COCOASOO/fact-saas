import html2pdf from 'html2pdf.js';
import { Invoice } from '@/app/types/invoice';
import { toast } from 'sonner';
import { uploadPDF } from '@/lib/supabase/storageService';
import { updateInvoice } from '@/app/routes/invoices/route';
import { createClient } from '@/lib/supabase/supabaseClient';

// Clase para gestionar la generación de PDFs
export class PDFGenerator {
  // Método principal para generar PDF a partir del elemento existente
  static async generateAndStore(element: HTMLElement, invoice: Invoice): Promise<string> {
    if (!element) {
      throw new Error('No se ha proporcionado un elemento válido');
    }
    
    console.log('Iniciando generación de PDF para factura:', invoice.id);

    // Obtener el usuario actual
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Usuario no autenticado');
      throw new Error('Usuario no autenticado');
    }
    
    console.log('Usuario autenticado:', user.id);

    try {
      // Nueva configuración optimizada para evitar páginas en blanco
      const options = {
        filename: `${invoice.invoice_number || 'sin-numero'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          backgroundColor: 'white',
          // Forzar la captura exacta del contenido visible
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight,
          // Evitar recortes
          x: 0,
          y: 0,
          width: element.scrollWidth,
          height: element.scrollHeight,
          // Desactivar logging para mejorar rendimiento
          logging: false
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          // Optimizaciones de rendimiento
          putOnlyUsedFonts: true,
          compress: true,
          // Definir márgenes mínimos pero suficientes
          margins: { top: 5, right: 5, bottom: 5, left: 5 }
        },
        // Estrategia agresiva contra páginas en blanco
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        // Forzar una sola página
        enableLinks: false,
        output: 'blob'
      };
      
      console.log('Generando PDF con opciones:', options);
      
      // Generar PDF como blob con manejo de errores mejorado
      let pdfBlob;
      try {
        pdfBlob = await html2pdf()
          .from(element)
          .set(options)
          .toPdf() // Convertir a PDF directamente
          .get('pdf') // Obtener el objeto PDF
          .then((pdf: { internal: { getNumberOfPages: () => number; }; deletePage: (arg0: any) => void; output: (arg0: string) => any; }) => {
            // Asegurarnos de que el PDF tiene solo una página
            if (pdf.internal.getNumberOfPages() > 1) {
              // Eliminar todas las páginas después de la primera
              for (let i = pdf.internal.getNumberOfPages(); i > 1; i--) {
                pdf.deletePage(i);
              }
            }
            return pdf.output('blob');
          });
          
        console.log('PDF generado correctamente, tamaño:', pdfBlob.size);
      } catch (pdfError) {
        console.error('Error al generar el PDF:', pdfError);
        throw new Error(`Error al generar el PDF: ${pdfError}`);
      }
      
      // Nombre de archivo descriptivo usando el número de factura sin el prefijo BORRADOR-
      const cleanInvoiceNumber = invoice.invoice_number?.replace('BORRADOR-', '') || 'sin-numero';
      const fileName = `${cleanInvoiceNumber}.pdf`;
      
      // Subir a Supabase Storage
      console.log('Subiendo PDF a Storage...');
      const pdfUrl = await uploadPDF(pdfBlob, fileName, user.id);
      console.log('PDF subido, URL:', pdfUrl);
      
      // Actualizar la factura con la URL del PDF
      console.log('Actualizando factura con PDF URL...');
      if (invoice.id) {
        const updatedInvoice = await updateInvoice({
          ...invoice,
          pdf_url: pdfUrl
        });
        console.log('Factura actualizada con PDF URL:', updatedInvoice);
      }
      
      return pdfUrl;
    } catch (error) {
      console.error('Error en generateAndStore:', error);
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
      throw new Error('Esta factura no tiene un PDF guardado');
    }
    
    try {
      console.log('Descargando PDF desde URL:', invoice.pdf_url);
      
      // Verificar si necesitamos regenerar un token para la URL
      let downloadUrl = invoice.pdf_url;
      
      // Si la URL es de Supabase, intentamos obtener una URL firmada si es necesario
      if (downloadUrl.includes('supabase.co')) {
        try {
          const supabase = createClient();
          
          // Extraer la ruta del archivo desde la URL
          const urlParts = downloadUrl.split('/object/public/');
          if (urlParts.length > 1) {
            const [bucket, filePath] = urlParts[1].split('/', 1);
            const fullPath = urlParts[1].substring(bucket.length + 1);
            
            console.log('Obteniendo URL firmada para:', { bucket, fullPath });
            
            // Obtener una URL firmada con duración de 60 segundos
            const { data, error } = await supabase
              .storage
              .from(bucket)
              .createSignedUrl(fullPath, 60);
              
            if (data && !error) {
              console.log('URL firmada generada correctamente:', data.signedUrl);
              downloadUrl = data.signedUrl;
            } else {
              console.warn('No se pudo generar URL firmada:', error);
            }
          }
        } catch (signError) {
          console.warn('Error al generar URL firmada:', signError);
          // Continuamos con la URL original
        }
      }
      
      // Intentar descargar con la URL (original o firmada)
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        // Si falla, intenta un enfoque alternativo
        console.warn(`Error al descargar con fetch: ${response.status}. Intentando descargar con nueva pestaña...`);
        
        // Abrir en nueva pestaña como alternativa
        window.open(downloadUrl, '_blank');
        return;
      }
      
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      const filename = `${invoice.invoice_number || 'sin-numero'}.pdf`;
      
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Liberar el objeto URL
      URL.revokeObjectURL(objectUrl);
      
      console.log('PDF descargado correctamente');
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      
      // Como última alternativa, abrimos directamente la URL
      try {
        window.open(invoice.pdf_url, '_blank');
      } catch (openError) {
        console.error('También falló abrir en nueva pestaña:', openError);
        throw error;
      }
    }
  }
}