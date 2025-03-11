import { createClient } from '@/lib/supabase/supabaseClient';

/**
 * Sube un PDF al almacenamiento de Supabase
 * @param pdfBlob Blob del PDF a subir
 * @param invoice Invoice relacionada con el PDF
 * @returns URL pública del PDF
 */
export const uploadPDF = async (pdfBlob: Blob, fileName: string, userId: string): Promise<string> => {
  try {
    console.log('Intentando subir PDF:', {fileName, userId, blobSize: pdfBlob.size});
    
    const supabase = createClient();
    
    // Verificar que el blob no esté vacío
    if (pdfBlob.size === 0) {
      throw new Error('El blob del PDF está vacío');
    }
    
    // Crear la ruta con formato userId/fileName
    const filePath = `${userId}/${fileName}`;
    console.log('Ruta del archivo:', filePath);
    
    // Subir el archivo al bucket 'invoices'
    const { data, error } = await supabase
      .storage
      .from('invoices')
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true // Sobrescribir si ya existe
      });

    if (error) {
      console.error('Error al subir PDF a Supabase:', error);
      throw new Error(`Error al subir PDF: ${error.message}`);
    }

    console.log('PDF subido correctamente, obteniendo URL pública');
    
    // Obtener la URL pública del archivo
    const { data: { publicUrl } } = supabase
      .storage
      .from('invoices')
      .getPublicUrl(filePath);
    
    console.log('URL pública generada:', publicUrl);

    return publicUrl;
  } catch (error) {
    console.error('Error en uploadPDF:', error);
    throw error;
  }
};

/**
 * Descarga un PDF desde Supabase Storage
 */
export const downloadPDF = async (url: string, filename: string): Promise<void> => {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('No se pudo descargar el archivo');
    }
    
    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Liberar el objeto URL
    URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Error al descargar PDF:', error);
    throw error;
  }
};