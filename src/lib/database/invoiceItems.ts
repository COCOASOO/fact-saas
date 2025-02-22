import { createClient } from "@/lib/supabase/supabaseClient";

const supabase = createClient();

export async function getInvoiceItems(invoiceId: string) {
  const { data, error } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", invoiceId);
  if (error) throw error;
  return data;
}

export async function addInvoiceItem(item: {
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  total: number;
}) {
  const { data, error } = await supabase.from("invoice_items").insert([item]);
  if (error) throw error;
  return data;
}
