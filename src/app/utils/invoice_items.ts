import { createClient } from "@/lib/supabase/supabaseClient";

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateInvoiceItemDTO {
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount?: number;
  tax_rate?: number;
}

export interface UpdateInvoiceItemDTO extends Partial<CreateInvoiceItemDTO> {}

const supabase = createClient();

export async function getInvoiceItems(invoiceId: string) {
  const { data, error } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("id");

  if (error) throw error;
  return data as InvoiceItem[];
}

export async function addInvoiceItem(item: CreateInvoiceItemDTO) {
  const { data, error } = await supabase
    .from("invoice_items")
    .insert([item])
    .select()
    .single();

  if (error) throw error;
  return data as InvoiceItem;
}

export async function updateInvoiceItem(id: string, item: UpdateInvoiceItemDTO) {
  const { data, error } = await supabase
    .from("invoice_items")
    .update(item)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as InvoiceItem;
}

export async function deleteInvoiceItem(id: string) {
  const { error } = await supabase
    .from("invoice_items")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
} 