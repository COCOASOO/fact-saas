"use client";

import { Invoice } from '@/app/types/invoice';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/supabaseClient';

// Componente que maneja las operaciones de PDF
export default function PDFOperations() {
  return null; // Este componente no renderiza nada
}

// Método para descargar un PDF existente
PDFOperations.downloadFromURL = async (invoice: Invoice): Promise<void> => {
  if (!invoice.pdf_url) {
    toast.error('La factura no tiene un PDF asociado');
    return;
  }
  
  console.log('Iniciando descarga de PDF para factura:', invoice.id);
  
  try {
    // Extraer la ruta relativa del archivo desde la URL completa
    const urlParts = invoice.pdf_url.split('/');
    const bucketName = urlParts[urlParts.indexOf('object') + 2];
    const filePath = urlParts.slice(urlParts.indexOf(bucketName) + 1).join('/');
    
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
    document.body.appendChild(link);
    link.click();
    
    // Limpiar
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
    
    toast.success(`Factura ${fileName} descargada correctamente`);
  } catch (error) {
    console.error('Error en el proceso de descarga:', error);
    toast.error(`No se pudo descargar el PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    
    // Plan B: Intentar abrir en una nueva pestaña
    try {
      window.open(invoice.pdf_url, '_blank');
      toast.info('Intentando abrir el PDF en una nueva pestaña...');
    } catch (openError) {
      console.error('También falló abrir en nueva pestaña:', openError);
    }
  }
}; 