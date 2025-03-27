import { Invoice } from "./invoice";

export interface VerifactuLog {
    id: string;
    invoice_id: string;
    request_payload: any;
    response_payload?: any;
    status: 'pending' | 'completed' | 'failed';
    created_at?: string;
    updated_at?: string;
    invoices?: Invoice; // Para los datos relacionados de Supabase
}

export interface CreateVerifactuLogDTO {
    invoice_id: string;
    request_payload: any;
    response_payload?: any;
    status?: 'pending' | 'completed' | 'failed';
} 