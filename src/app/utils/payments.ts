import { createClient } from "@/lib/supabase/supabaseClient";
import { getCurrentUserId } from "./auth";
import { Payment, CreatePaymentDTO } from "../types/payment";

const supabase = createClient();

// Función para obtener pagos con filtro opcional por factura
export async function getPayments(invoiceId?: string) {
    try {
        const userId = await getCurrentUserId();
        
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

// Función para añadir un nuevo pago
export async function addPayment(payment: CreatePaymentDTO) {
    try {
        const userId = await getCurrentUserId();
        
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

// Función para obtener un pago específico por ID
export async function getPaymentById(id: string) {
    try {
        const userId = await getCurrentUserId();
        
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
            .single();

        if (error) {
            throw error;
        }

        return payment as Payment;
    } catch (error) {
        throw error;
    }
}

// Función para eliminar un pago
export async function deletePayment(id: string) {
    try {
        const userId = await getCurrentUserId();
        
        // Verificar que el pago pertenece al usuario
        const { data: payment, error: fetchError } = await supabase
            .from('payments')
            .select(`
                *,
                invoices!inner(*)
            `)
            .eq('id', id)
            .eq('invoices.user_id', userId)
            .single();
            
        if (fetchError || !payment) {
            throw new Error('Pago no encontrado o no autorizado');
        }
        
        const { error } = await supabase
            .from('payments')
            .delete()
            .eq('id', id);

        if (error) {
            throw error;
        }

        return true;
    } catch (error) {
        throw error;
    }
} 