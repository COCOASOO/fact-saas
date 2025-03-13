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
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        throw new Error('No hay usuario autenticado')
    }
    return user.id
}

export async function getPayments(invoiceId: string) {
    try {
        const userId = await getCurrentUserId()
        
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
            throw error
        }
        
        return payments as Payment[]
    } catch (error) {
        throw error;
    }
}

export async function getPaymentById(id: string) {
    try {
        const userId = await getCurrentUserId()
        
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
            throw error
        }

        return payment as Payment
    } catch (error) {
        throw error;
    }
}

export async function addPayment(payment: CreatePaymentDTO) {
    try {
        const userId = await getCurrentUserId()
        
        // Verificar que la factura existe y pertenece al usuario
        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', payment.invoice_id)
            .eq('user_id', userId)
            .single()

        if (invoiceError || !invoice) {
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
            throw error
        }

        return data as Payment
    } catch (error) {
        throw error;
    }
}
