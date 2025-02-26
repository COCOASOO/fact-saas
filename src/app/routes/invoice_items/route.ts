import { createClient } from "@/lib/supabase/supabaseClient"

export interface InvoiceItem {
    id: string
    invoice_id: string
    description: string
    quantity: number
    unit_price: number
    total_price: number
}

export interface CreateInvoiceItemDTO {
    invoice_id: string
    description: string
    quantity: number
    unit_price: number
    total_price: number
}

export interface UpdateInvoiceItemDTO extends Partial<CreateInvoiceItemDTO> {}

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

export async function getInvoiceItems(invoiceId: string) {
    console.group('📋 getInvoiceItems()');
    try {
        const userId = await getCurrentUserId()
        console.log('🔍 Buscando items de factura:', invoiceId);
        
        const { data: items, error } = await supabase
            .from('invoice_items')
            .select('*, invoices!inner(*)')
            .eq('invoices.user_id', userId)
            .eq('invoice_id', invoiceId)

        if (error) {
            console.error('❌ Error al obtener items:', error);
            throw error
        }
        
        console.log('✅ Items encontrados:', items);
        console.groupEnd();
        return items as InvoiceItem[]
    } catch (error) {
        console.error('❌ Error en getInvoiceItems:', error);
        console.groupEnd();
        throw error;
    }
}

export async function getInvoiceItemById(id: string) {
    console.group(`🔍 getInvoiceItemById(${id})`);
    try {
        const userId = await getCurrentUserId()
        console.log('Buscando item con ID:', id);
        
        const { data: item, error } = await supabase
            .from('invoice_items')
            .select('*, invoices!inner(*)')
            .eq('invoices.user_id', userId)
            .eq('id', id)
            .single()

        if (error) {
            console.error('❌ Error al obtener item:', error);
            throw error
        }

        console.log('✅ Item encontrado:', item);
        console.groupEnd();
        return item as InvoiceItem
    } catch (error) {
        console.error('❌ Error en getInvoiceItemById:', error);
        console.groupEnd();
        throw error;
    }
}

export async function addInvoiceItem(item: CreateInvoiceItemDTO) {
    console.group('➕ addInvoiceItem()');
    try {
        console.log('📝 Datos recibidos:', item);
        await getCurrentUserId() // Verificamos que el usuario está autenticado
        
        const { data, error } = await supabase
            .from('invoice_items')
            .insert([item])
            .select()
            .single()

        if (error) {
            console.error('❌ Error al crear item:', error);
            throw error
        }

        console.log('✅ Item creado:', data);
        console.groupEnd();
        return data as InvoiceItem
    } catch (error) {
        console.error('❌ Error en addInvoiceItem:', error);
        console.groupEnd();
        throw error;
    }
}

export async function updateInvoiceItem(id: string, item: UpdateInvoiceItemDTO) {
    console.group(`📝 updateInvoiceItem(${id})`);
    try {
        console.log('Datos a actualizar:', item);
        await getCurrentUserId() // Verificamos que el usuario está autenticado
        
        const { data, error } = await supabase
            .from('invoice_items')
            .update(item)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('❌ Error al actualizar item:', error);
            throw error
        }

        console.log('✅ Item actualizado:', data);
        console.groupEnd();
        return data as InvoiceItem
    } catch (error) {
        console.error('❌ Error en updateInvoiceItem:', error);
        console.groupEnd();
        throw error;
    }
}

export async function deleteInvoiceItem(id: string) {
    console.group(`🗑️ deleteInvoiceItem(${id})`);
    try {
        await getCurrentUserId() // Verificamos que el usuario está autenticado
        console.log('Eliminando item con ID:', id);
        
        const { error } = await supabase
            .from('invoice_items')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('❌ Error al eliminar item:', error);
            throw error
        }

        console.log('✅ Item eliminado correctamente');
        console.groupEnd();
        return true
    } catch (error) {
        console.error('❌ Error en deleteInvoiceItem:', error);
        console.groupEnd();
        throw error;
    }
}
