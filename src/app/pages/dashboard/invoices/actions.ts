import { createClient } from "@/app/lib/supabase/supabaseClient";

const supabase = createClient();

// Obtener todas las facturas del usuario
export async function getInvoices(userId: string) {
  const { data, error } = await supabase.from("invoices").select("*").eq("user_id", userId);
  if (error) throw error;
  return data;
}

// Crear una nueva factura
export async function createInvoice(userId: string, client: string, amount: number) {
  const { data, error } = await supabase.from("invoices").insert([{ user_id: userId, client, amount }]);
  if (error) throw error;
  return data;
}

// Obtener una factura por ID
export async function getInvoiceById(invoiceId: string) {
  const { data, error } = await supabase.from("invoices").select("*").eq("id", invoiceId).single();
  if (error) throw error;
  return data;
}
