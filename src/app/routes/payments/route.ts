import { createClient } from "@/lib/supabase/supabaseClient"
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserId } from "@/app/utils/auth"
import { Payment, CreatePaymentDTO } from "@/app/types/payment"

const supabase = createClient()

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

// Esta es una ruta API válida para Next.js
export async function GET(request: NextRequest) {
    try {
        const userId = await getCurrentUserId();
        const supabase = createClient();
        
        // Extraer parámetros de consulta si es necesario
        const { searchParams } = new URL(request.url);
        const invoiceId = searchParams.get('invoice_id');
        
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
        
        const { data, error } = await query;
        
        if (error) {
            throw error;
        }
        
        if (!data) {
            return NextResponse.json({ error: 'No data found' }, { status: 404 });
        }
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error occurred:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}