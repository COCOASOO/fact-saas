import { createClient } from "@/lib/supabase/supabaseClient"
import type { Invoice } from "@/app/types/invoice"
import { getNextInvoiceNumber, updateSeriesInvoiceCount } from "../invoice_series/route";

const supabase = createClient()

async function getCurrentUserId() {
    console.log('🔍 Obteniendo usuario actual...');
    const { data: { user } } = await supabase.auth.getUser()
    console.log('👤 Usuario auth encontrado:', user);
    
    if (!user) {
        console.error('❌ No hay usuario autenticado');
        throw new Error('No hay usuario autenticado')
    }
    console.log('✅ ID de usuario:', user.id);
    return user.id
}

export async function getInvoices() {
    console.group('📋 getInvoices()');
    try {
        const userId = await getCurrentUserId()
        console.log('🔍 Buscando facturas para user_id:', userId);
        
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
        
        console.log('✅ Facturas encontradas:', formattedInvoices);
        console.groupEnd();
        return formattedInvoices
    } catch (error) {
        console.error('❌ Error en getInvoices:', error);
        console.groupEnd();
        throw error;
    }
}

export async function getInvoiceById(id: string) {
    console.group(`🔍 getInvoiceById(${id})`);
    try {
        const userId = await getCurrentUserId()
        console.log('Buscando factura con ID:', id, 'para user_id:', userId);
        
        const { data: invoice, error } = await supabase
            .from('invoices')
            .select(`
                *,
                clients!inner(*)
            `)
            .eq('id', id)
            .eq('user_id', userId)
            .single()

        if (error) {
            console.error('❌ Error al obtener factura:', error);
            throw error
        }

        console.log('✅ Factura encontrada:', invoice);
        console.groupEnd();
        return invoice as Invoice
    } catch (error) {
        console.error('❌ Error en getInvoiceById:', error);
        console.groupEnd();
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
        const nextNumber = await getNextInvoiceNumber(invoice.series_id);
        
        // Crear la factura directamente con el nuevo número
        const { data, error } = await supabase
            .from('invoices')
            .insert([
                {
                    ...invoice,
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

export async function updateInvoice(id: string, invoice: Invoice) {
    console.group(`📝 updateInvoice(${id})`);
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
        const { client, company, ...invoiceData } = invoice;
        console.log("invoiceData", invoiceData)
        const { error } = await supabase
            .from('invoices')
            .update(invoiceData)
            .eq('id', id)
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
            .eq('id', id)
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
