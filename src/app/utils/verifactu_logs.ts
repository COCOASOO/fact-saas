import { createClient } from "@/lib/supabase/supabaseClient";
import { getCurrentUserId } from "./auth";
import { VerifactuLog, CreateVerifactuLogDTO } from "../types/verifactu_log";

export async function addVerifactuLog(log: CreateVerifactuLogDTO) {
    try {
        const userId = await getCurrentUserId();
        const supabase = createClient();

        // Verificar que la factura existe y pertenece al usuario
        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', log.invoice_id)
            .eq('user_id', userId)
            .single();

        if (invoiceError || !invoice) {
            throw new Error('Factura no encontrada o no autorizada');
        }
        
        const logData = {
            ...log,
            status: log.status || 'pending'
        };
        
        const { data, error } = await supabase
            .from('verifactu_logs')
            .insert([logData])
            .select(`
                *,
                invoices!inner(*)
            `)
            .single();

        if (error) {
            throw error;
        }

        return data as VerifactuLog;
    } catch (error) {
        throw error;
    }
} 