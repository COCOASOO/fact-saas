import { createClient } from "@/lib/supabase/supabaseClient"

export interface Payment {
    id: string
    invoice_id: string
    payment_date: string
    amount: number
    payment_method: 'cash' | 'transfer' | 'card'
    status: 'pending' | 'completed' | 'failed'
}

export interface CreatePaymentDTO {
    invoice_id: string
    amount: number
    payment_method: 'cash' | 'transfer' | 'card'
    status: 'pending' | 'completed' | 'failed'
    payment_date?: string // Opcional ya que tiene valor por defecto en la BD
}

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

export async function getPayments(invoiceId: string) {
    console.group('📋 getPayments()');
    try {
        const userId = await getCurrentUserId()
        console.log('🔍 Buscando pagos para factura:', invoiceId);
        
        const { data: payments, error } = await supabase
            .from('payments')
            .select(`
                *,
                invoices!inner(
                    *,
                    clients!inner(*)
                )
            `)
            .eq('invoices.user_id', userId)
            .eq('invoice_id', invoiceId)

        if (error) {
            console.error('❌ Error al obtener pagos:', error);
            throw error
        }
        
        console.log('✅ Pagos encontrados:', payments);
        console.groupEnd();
        return payments as Payment[]
    } catch (error) {
        console.error('❌ Error en getPayments:', error);
        console.groupEnd();
        throw error;
    }
}

export async function getPaymentById(id: string) {
    console.group(`🔍 getPaymentById(${id})`);
    try {
        const userId = await getCurrentUserId()
        console.log('Buscando pago con ID:', id);
        
        const { data: payment, error } = await supabase
            .from('payments')
            .select(`
                *,
                invoices!inner(
                    *,
                    clients!inner(*)
                )
            `)
            .eq('invoices.user_id', userId)
            .eq('id', id)
            .single()

        if (error) {
            console.error('❌ Error al obtener pago:', error);
            throw error
        }

        console.log('✅ Pago encontrado:', payment);
        console.groupEnd();
        return payment as Payment
    } catch (error) {
        console.error('❌ Error en getPaymentById:', error);
        console.groupEnd();
        throw error;
    }
}

export async function addPayment(payment: CreatePaymentDTO) {
    console.group('➕ addPayment()');
    try {
        console.log('📝 Datos recibidos:', payment);
        const userId = await getCurrentUserId()
        
        // Verificar que la factura existe y pertenece al usuario
        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', payment.invoice_id)
            .eq('user_id', userId)
            .single()

        if (invoiceError || !invoice) {
            console.error('❌ Factura no encontrada o no autorizada');
            throw new Error('Factura no encontrada o no autorizada')
        }
        
        const { data, error } = await supabase
            .from('payments')
            .insert([payment])
            .select(`
                *,
                invoices!inner(
                    *,
                    clients!inner(*)
                )
            `)
            .single()

        if (error) {
            console.error('❌ Error al crear pago:', error);
            throw error
        }

        console.log('✅ Pago creado:', data);
        console.groupEnd();
        return data as Payment
    } catch (error) {
        console.error('❌ Error en addPayment:', error);
        console.groupEnd();
        throw error;
    }
}
