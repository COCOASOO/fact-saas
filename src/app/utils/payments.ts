import { createClient } from "@/lib/supabase/supabaseClient";
import { getCurrentUserId } from "./auth";
import { Payment,CreatePaymentDTO } from "../types/payment";

// Funciones movidas desde routes/payments/route.ts
export async function getPayments(invoiceId?: string) {
    try {
        const userId = await getCurrentUserId();
        const supabase = createClient();
        
        let query = supabase
            .from('payments')
            .select(`
                *,
                invoices!inner(
                    *,
                    clients!inner(*)
                )
            `)
            .eq('invoices.user_id', userId);
        
        // Si se proporciona un ID de factura, filtrar por esa factura
        if (invoiceId) {
            query = query.eq('invoice_id', invoiceId);
        }
        
        const { data: payments, error } = await query;

        if (error) {
            throw error;
        }
        
        return payments as Payment[];
    } catch (error) {
        throw error;
    }
}

export async function addPayment(payment: CreatePaymentDTO) {
    try {
        const userId = await getCurrentUserId();
        const supabase = createClient();
        
        // Verificar que la factura existe y pertenece al usuario
        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', payment.invoice_id)
            .eq('user_id', userId)
            .single();

        if (invoiceError || !invoice) {
            throw new Error('Factura no encontrada o no autorizada');
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
            .single();

        if (error) {
            throw error;
        }

        return data as Payment;
    } catch (error) {
        throw error;
    }
} 