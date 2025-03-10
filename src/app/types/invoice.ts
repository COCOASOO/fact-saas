import { Client } from "./client";
import { Company } from "./company";

export interface Invoice {
  id: string;
  created_at: string;
  user_id: string;
  client_id: string;
  client?: Client | null;
  company_id: string;
  company?: Company | null;
  date: string;
  invoice_number: string;
  status: "draft" | "final" | "submitted";
  pdf_url: string | null;
  invoice_date: string;
  due_date: string;
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  irpf_rate: number;
  irpf_amount: number;
  total_amount: number;
  verifactu_xml: string | null;
  verifactu_hash: string | null;
  verifactu_signature: string | null;
  verifactu_status: string | null;
  verifactu_response: string | null;
  updated_at: string;
  series_id: string;
  rectifies_invoice_id?: string | null;
  invoice_type: 'standard' | 'rectifying';
  items?: any[];
}

export type InvoiceDB = Omit<Invoice, 'client' | 'company'>;

export interface InvoiceFormData
  extends Omit<
    Invoice,
    | "id"
    | "created_at"
    | "updated_at"
    | "pdf_url"
    | "verifactu_xml"
    | "verifactu_hash"
    | "verifactu_signature"
    | "verifactu_status"
    | "verifactu_response"
    | "invoice_type"
  > {
  // Form specific fields can be added here
}

export type InvoiceStatus = 
  | "draft"      // Borrador inicial
  | "review"     // En revisión 
  | "ready"      // Lista para finalizar
  | "final"      // Finalizada/definitiva
  | "canceled";  // Anulada