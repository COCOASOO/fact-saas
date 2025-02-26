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

export async function getVerifactuLogs() {
    console.group('📋 getVerifactuLogs()');
    try {
        const userId = await getCurrentUserId()
        console.log('🔍 Buscando logs de Verifactu...');
        
        const { data: logs, error } = await supabase
            .from('verifactu_logs')
            .select(`
                *,
                invoices!inner(*)
            `)
            .eq('invoices.user_id', userId)

        if (error) {
            console.error('❌ Error al obtener logs:', error);
            throw error
        }
        
        console.log('✅ Logs encontrados:', logs);
        console.groupEnd();
        return logs as VerifactuLog[]
    } catch (error) {
        console.error('❌ Error en getVerifactuLogs:', error);
        console.groupEnd();
        throw error;
    }
}

export async function addVerifactuLog(log: CreateVerifactuLogDTO) {
    console.group('➕ addVerifactuLog()');
    try {
        console.log('📝 Datos recibidos:', log);
        const userId = await getCurrentUserId()

        // Verificar que la factura existe y pertenece al usuario
        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', log.invoice_id)
            .eq('user_id', userId)
            .single()

        if (invoiceError || !invoice) {
            console.error('❌ Factura no encontrada o no autorizada');
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
            console.error('❌ Error al crear log:', error);
            throw error
        }

        console.log('✅ Log creado:', data);
        console.groupEnd();
        return data as VerifactuLog
    } catch (error) {
        console.error('❌ Error en addVerifactuLog:', error);
        console.groupEnd();
        throw error;
    }
}
