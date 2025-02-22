import { createClient } from "@/lib/supabase/supabaseClient";

const supabase = createClient();

// Obtener TODOS los clientes
export async function getClients() {
  const { data, error } = await supabase.from("clients").select("*");
  if (error) throw error;
  return data;
}

export async function getClientsByUser(userId: string) {
  const formattedUserId = String(userId).trim(); // Asegura que es un string
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", formattedUserId);

  if (error) throw error;
  return data;
}


// Agregar un nuevo cliente
export async function addClient(client: {
  name: string;
  tax_id: string;
  email: string;
  address: string;
  phone: string;
  user_id: string;
}) {
  const { data, error } = await supabase.from("clients").insert([client]);
  if (error) throw error;
  return data;
}

// Actualizar datos de un cliente
export async function updateClient(clientId: string, updatedData: any) {
  const { data, error } = await supabase
    .from("clients")
    .update(updatedData)
    .eq("id", clientId);
  if (error) throw error;
  return data;
}

// Eliminar un cliente
export async function deleteClient(clientId: string) {
  const { data, error } = await supabase.from("clients").delete().eq("id", clientId);
  if (error) throw error;
  return data;
}
