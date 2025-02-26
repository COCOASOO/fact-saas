import { createClient } from "@/lib/supabase/supabaseClient"

export interface Invoice {
    id: string
    user_id: string
    client_id: string
    company_id: string
    date?: string
    invoice_number: string
    status?: 'pending' | 'paid' | 'cancelled'
    pdf_url?: string
    invoice_date: string
    due_date?: string
    currency?: string
    verifactu_xml?: string
    verifactu_hash?: string
    verifactu_signature?: string
    verifactu_status?: string
    verifactu_response?: string
    subtotal: number
    tax_rate: number
    tax_amount: number
    irpf_rate: number
    irpf_amount: number
    total_amount: number
}

export interface CreateInvoiceDTO {
    client_id: string
    company_id: string
    date?: string
    invoice_number: string
    status?: 'pending' | 'paid' | 'cancelled'
    due_date?: string
    currency?: string
    subtotal: number
    tax_rate: number
    tax_amount: number
    irpf_rate?: number
    irpf_amount?: number
    total_amount: number
}

export interface UpdateInvoiceDTO extends Partial<CreateInvoiceDTO> {}

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
        
        console.log('✅ Facturas encontradas:', invoices);
        console.groupEnd();
        return invoices as Invoice[]
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

export async function addInvoice(invoice: CreateInvoiceDTO) {
    console.group('➕ addInvoice()');
    try {
        console.log('📝 Datos recibidos:', invoice);
        const userId = await getCurrentUserId()
        
        // Verificar que el cliente existe y pertenece al usuario
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
        
        const invoiceData = {
            ...invoice,
            user_id: userId,
            currency: invoice.currency || 'EUR',
            status: invoice.status || 'pending',
            irpf_rate: invoice.irpf_rate || 0.00,
            irpf_amount: invoice.irpf_amount || 0.00
        }
        console.log('📝 Datos a insertar:', invoiceData);

        const { data, error } = await supabase
            .from('invoices')
            .insert([invoiceData])
            .select(`
                *,
                clients!inner(*)
            `)
            .single()

        if (error) {
            console.error('❌ Error al crear factura:', error);
            if (error.code === '23505') {
                throw new Error('Ya existe una factura con este número')
            }
            throw error
        }

        console.log('✅ Factura creada:', data);
        console.groupEnd();
        return data as Invoice
    } catch (error) {
        console.error('❌ Error en addInvoice:', error);
        console.groupEnd();
        throw error;
    }
}

export async function updateInvoice(id: string, invoice: UpdateInvoiceDTO) {
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
        
        const { data, error } = await supabase
            .from('invoices')
            .update(invoice)
            .eq('id', id)
            .eq('user_id', userId)
            .select(`
                *,
                clients!inner(*)
            `)
            .single()

        if (error) {
            console.error('❌ Error al actualizar factura:', error);
            if (error.code === '23505') {
                throw new Error('Ya existe una factura con este número')
            }
            throw error
        }

        console.log('✅ Factura actualizada:', data);
        console.groupEnd();
        return data as Invoice
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
