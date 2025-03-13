import { createClient } from "@/lib/supabase/supabaseClient"

export interface VerifactuLog {
    id: string
    invoice_id: string
    request_payload: any
    response_payload?: any
    status: 'pending' | 'completed' | 'failed'
}

export interface CreateVerifactuLogDTO {
    invoice_id: string
    request_payload: any
    response_payload?: any
    status?: 'pending' | 'completed' | 'failed'
}

const supabase = createClient()

async function getCurrentUserId() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        throw new Error('No hay usuario autenticado')
    }
    return user.id
}

export async function getVerifactuLogs() {
    try {
        const userId = await getCurrentUserId()
        
        const { data: logs, error } = await supabase
            .from('verifactu_logs')
            .select(`
                *,
                invoices!inner(*)
            `)
            .eq('invoices.user_id', userId)

        if (error) {
            throw error
        }
        
        return logs as VerifactuLog[]
    } catch (error) {
        throw error;
    }
}

export async function addVerifactuLog(log: CreateVerifactuLogDTO) {
    try {
        const userId = await getCurrentUserId()

        // Verificar que la factura existe y pertenece al usuario
        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', log.invoice_id)
            .eq('user_id', userId)
            .single()

        if (invoiceError || !invoice) {
            throw new Error('Factura no encontrada o no autorizada')
        }
        
        const logData = {
            ...log,
            status: log.status || 'pending'
        }
        
        const { data, error } = await supabase
            .from('verifactu_logs')
            .insert([logData])
            .select(`
                *,
                invoices!inner(*)
            `)
            .single()

        if (error) {
            throw error
        }

        return data as VerifactuLog
    } catch (error) {
        throw error;
    }
}
