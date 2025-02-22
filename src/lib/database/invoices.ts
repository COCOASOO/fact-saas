import { createClient } from "@/lib/supabase/supabaseClient";

const supabase = createClient();

export async function getInvoices(id: string) {
  const { data, error } = await supabase.from("invoices").select("*");
  if (error) throw error;
  return data;
}

export async function getInvoicesByUser(userId: string) {
  const { data, error } = await supabase.from("invoices").select("*").eq("user_id", userId);
  if (error) throw error;
  return data;
}

export async function addInvoice(invoice: {
  user_id: string;
  client_id: string;
  date: string;
  invoice_number: string;
  amount: number;
  status: string;
  pdf_url?: string;
}) {
  const { data, error } = await supabase.from("invoices").insert([invoice]);
  if (error) throw error;
  return data;
}

export async function deleteInvoice(invoiceId: string) {
  const { data, error } = await supabase.from("invoices").delete().eq("id", invoiceId);
  if (error) throw error;
  return data;
}
