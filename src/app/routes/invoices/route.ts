import { createClient } from "@/lib/supabase/supabaseClient"
import type { Invoice, InvoiceStatus } from "@/app/types/invoice"
import { getNextInvoiceNumber, updateSeriesInvoiceCount } from "../invoice_series/route";

const supabase = createClient()

async function getCurrentUserId() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        console.error('❌ No hay usuario autenticado');
        throw new Error('No hay usuario autenticado')
    }
    return user.id
}

export async function getInvoices() {
    try {
        const userId = await getCurrentUserId()
        
        const { data: invoices, error } = await supabase
            .from('invoices')
            .select(`
                *,
                clients!inner(*)
            `)
            .eq('user_id', userId)

        if (error) {
            console.error('❌ Error al obtener facturas:', error);
            throw error
        }
        
        // Ensure dates are strings before returning
        const formattedInvoices = invoices.map(invoice => ({
            ...invoice,
            created_at: new Date(invoice.created_at).toISOString(),
            updated_at: new Date(invoice.updated_at).toISOString()
        })) as Invoice[]

        return formattedInvoices
    } catch (error) {
        console.error('❌ Error en getInvoices:', error);
        console.groupEnd();
        throw error;
    }
}

export async function getInvoiceById(id: string): Promise<Invoice> {
    try {
        const userId = await getCurrentUserId();
        
        const { data, error } = await supabase
            .from('invoices')
            .select(`
                *,
                client:client_id(*),
                company:company_id(*)
            `)
            .eq('id', id)
            .eq('user_id', userId)
            .single();
        
        if (error) {
            throw error;
        }
        
        return data as Invoice;
    } catch (error) {
        console.error('Error al obtener factura por ID:', error);
        throw error;
    }
}

export async function addInvoice(invoice: Omit<Invoice, 'id' | 'user_id'>): Promise<Invoice> {
    try {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        if (!userId) {
            throw new Error("Usuario no autenticado");
        }

        // Obtener el siguiente número de factura
        const nextNumber = await generateInvoiceNumber(invoice.series_id);
        
        // Extraemos invoice_type e items para que no se incluyan en la inserción
        const { invoice_type, items, ...invoiceData } = invoice;
        
        // Crear la factura directamente con el nuevo número
        const { data, error } = await supabase
            .from('invoices')
            .insert([
                {
                    ...invoiceData,
                    user_id: userId,
                    invoice_number: nextNumber,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                // Si hay un conflicto, intentamos obtener el siguiente número disponible
                console.log("Conflicto detectado, intentando con el siguiente número...");
                return addInvoice(invoice); // Intentar nuevamente con el siguiente número
            }
            throw error;
        }

        // Actualizar el contador de la serie
        await updateSeriesInvoiceCount(invoice.series_id);

        return data as Invoice;
    } catch (error) {
        console.error("Error creating invoice:", error);
        throw error;
    }
}

export async function updateInvoice(invoice: Invoice) {
    console.group(`📝 updateInvoice(${invoice.id})`);
    try {
        console.log('Datos a actualizar:', invoice);
        const userId = await getCurrentUserId()
        
        // Si se está actualizando el client_id, verificar que el nuevo cliente existe y pertenece al usuario
        if (invoice.client_id) {
            const { data: client, error: clientError } = await supabase
                .from('clients')
                .select('*')
                .eq('id', invoice.client_id)
                .eq('user_id', userId)
                .single()

            if (clientError || !client) {
                console.error('❌ Cliente no encontrado o no autorizado');
                throw new Error('Cliente no encontrado o no autorizado')
            }
        }
        
        // Eliminamos los campos virtuales antes de enviar a la BD
        const { client, company, items, ...invoiceData } = invoice;
        console.log("invoiceData", invoiceData)
        const { error } = await supabase
            .from('invoices')
            .update(invoiceData)
            .eq('id', invoice.id)
            .eq('user_id', userId)

        if (error) {
            console.error('❌ Error al actualizar factura:', error);
            if (error.code === '23505') {
                throw new Error('Ya existe una factura con este número')
            }
            throw error
        }

        // Si necesitamos los datos actualizados, hacemos una consulta separada
        const { data: updatedInvoice } = await supabase
            .from('invoices')
            .select(`
                *,
                clients!inner(*)
            `)
            .eq('id', invoice.id)
            .single()

        console.log('✅ Factura actualizada:', updatedInvoice);
        console.groupEnd();
        return updatedInvoice as Invoice
    } catch (error) {
        console.error('❌ Error en updateInvoice:', error);
        console.groupEnd();
        throw error;
    }
}

export async function deleteInvoice(id: string) {
    console.group(`🗑️ deleteInvoice(${id})`);
    try {
        const userId = await getCurrentUserId()
        console.log('Eliminando factura con ID:', id, 'para user_id:', userId);
        
        const { error } = await supabase
            .from('invoices')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)

        if (error) {
            console.error('❌ Error al eliminar factura:', error);
            throw error
        }

        console.log('✅ Factura eliminada correctamente');
        console.groupEnd();
        return true
    } catch (error) {
        console.error('❌ Error en deleteInvoice:', error);
        console.groupEnd();
        throw error;
    }
}

export async function updateInvoiceStatus(id: string, status: InvoiceStatus) {
  try {
    const userId = await getCurrentUserId();
    const invoice = await getInvoiceById(id);
    
    // Si no es una actualización a estado final, hacemos la actualización simple
    if (status !== 'final') {
      const { error } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) throw error;
      return true;
    }
    
    // Para finalizar facturas, necesitamos más validaciones
    
    // 1. Verificar si hay una factura con el mismo número (para el mismo usuario)
    const cleanInvoiceNumber = invoice.invoice_number.replace('BORRADOR-', '');
    const { data: existingInvoices } = await supabase
      .from('invoices')
      .select('id, invoice_number')
      .eq('invoice_number', cleanInvoiceNumber)
      .eq('user_id', userId)
      .neq('id', id)
      .eq('status', 'final');
    
    if (existingInvoices && existingInvoices.length > 0) {
      console.error('Ya existe otra factura con el número', cleanInvoiceNumber, existingInvoices);
      throw new Error(`Ya existe una factura con el número ${cleanInvoiceNumber}`);
    }
    
    // 2. Verificar que el PDF existe en storage
    if (!invoice.pdf_url) {
      throw new Error('La factura no tiene un PDF asociado');
    }
    
    // 3. Actualizar el estado y el número de factura (quitando el prefijo BORRADOR-)
    const { error } = await supabase
      .from('invoices')
      .update({ 
        status,
        invoice_number: cleanInvoiceNumber,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    // 4. Actualizar el contador de la serie si es necesario
    if (invoice.series_id) {
      await updateSeriesInvoiceCount(invoice.series_id);
    }
    
    console.log(`✅ Factura ${id} marcada como definitiva con número ${cleanInvoiceNumber}`);
    return true;
  } catch (error) {
    console.error('Error al actualizar estado de factura:', error);
    throw error;
  }
}

// Función que genera el número de factura
export async function generateInvoiceNumber(seriesId: string): Promise<string> {
  const { data: series, error: seriesError } = await supabase
    .from('invoice_series')
    .select('*')
    .eq('id', seriesId)
    .single();
  
  if (seriesError || !series) {
    throw new Error('Serie no encontrada');
  }
  
  // Obtener el año actual para el formato
  const currentYear = new Date().getFullYear().toString().slice(-2);
  
  // Buscar facturas existentes para detectar huecos
  const { data: finalInvoices } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('series_id', seriesId)
    .order('created_at', { ascending: true });
  
  // Extraer números de facturas existentes
  let existingNumbers: number[] = [];
  
  if (finalInvoices && finalInvoices.length > 0) {
    // Procesar el formato para extraer la parte numérica
    // Ejemplo: si el formato es 'FA%%%-####', nos interesa el '####'
    const digitPattern = series.serie_format.match(/#+/);
    const digitFormat = digitPattern ? digitPattern[0] : '####';
    const digitCount = digitFormat.length;
    
    // Crear una expresión regular que busque exactamente ese número de dígitos al final
    const numberPattern = new RegExp(`\\d{${digitCount}}$`);
    
    // Extraer números
    const numbers = finalInvoices.map(inv => {
      // Quitar el prefijo BORRADOR- si existe
      const cleanNumber = inv.invoice_number.replace('BORRADOR-', '');
      const match = cleanNumber.match(numberPattern);
      return match ? parseInt(match[0], 10) : 0;
    }).filter(n => n > 0);
    
    existingNumbers = [...numbers];
  }
  
  // Encontrar el primer hueco o el siguiente número
  let nextNumber = 1;
  if (existingNumbers.length > 0) {
    existingNumbers.sort((a, b) => a - b);
    
    // Buscar primer hueco
    for (let i = 1; i <= existingNumbers.length + 1; i++) {
      if (!existingNumbers.includes(i)) {
        nextNumber = i;
        break;
      }
    }
    
    // Si no encontramos hueco, usar el siguiente al máximo
    if (nextNumber === 1 && existingNumbers.length > 0) {
      nextNumber = Math.max(...existingNumbers) + 1;
    }
  }
  
  // Determinar el patrón de dígitos en el formato (ejem: #### o ##)
  const digitPattern = series.serie_format.match(/#+/);
  const digitFormat = digitPattern ? digitPattern[0] : '####';
  const digitCount = digitFormat.length;
  
  // Formatear el número con ceros a la izquierda según el número de # en el formato
  const formattedNumber = nextNumber.toString().padStart(digitCount, '0');
  
  // Generar el número de factura
  let invoiceNumber = series.serie_format;
  
  // Reemplazar el año (patrón %% o similar)
  const yearPattern = invoiceNumber.match(/%+/);
  if (yearPattern) {
    const yearFormat = yearPattern[0];
    // Si hay 4 %, usar año completo, sino los últimos dígitos
    const yearValue = yearFormat.length === 4 
      ? new Date().getFullYear().toString()
      : currentYear;
    invoiceNumber = invoiceNumber.replace(yearFormat, yearValue);
  }
  
  // Reemplazar el número secuencial (patrón ### o similar)
  invoiceNumber = invoiceNumber.replace(/#+/, formattedNumber);
  
  // Para facturas borrador, añadir el prefijo
  return `BORRADOR-${invoiceNumber}`;
}
