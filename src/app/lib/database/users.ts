import { createClient } from "@/app/lib/supabase/supabaseClient";

const supabase = createClient();

// Obtener todos los usuarios
export async function getUsers() {
    const { data, error } = await supabase.from("users").select("*");
    if (error) throw error;
    return data;
}

// Obtener un usuario por ID
export async function getUserById(userId: string) {
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();
    if (error) throw error;
    return data;
}

// Agregar un nuevo usuario
export async function addUser(user: {
    email: string;
    name: string;
    phone: string;
    auth_uuid: string;
}) {
    const { data, error } = await supabase.from("users").insert([user]);
    if (error) throw error;
    return data;
}

// Actualizar un usuario
export async function updateUser(userId: string, updatedData: any) {
    const { data, error } = await supabase
        .from("users")
        .update(updatedData)
        .eq("id", userId);
    if (error) throw error;
    return data;
}

// Eliminar un usuario
export async function deleteUser(userId: string) {
    const { data, error } = await supabase.from("users").delete().eq("id", userId);
    if (error) throw error;
    return data;
}

// Obtener un usuario por auth_uuid
export async function getUserByAuthUuid(authUuid: string) {
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("auth_uuid", authUuid);
    
    if (error) throw error;

    // Verificar si se encontraron usuarios
    if (!data || data.length === 0) {
        console.error(`No se encontró ningún usuario con el auth_uuid proporcionado: ${authUuid}`);
        return null; // O manejar el caso como prefieras
    }

    // Si hay múltiples usuarios, puedes decidir cómo manejarlos
    if (data.length > 1) {
        console.warn("Se encontraron múltiples usuarios con el mismo auth_uuid.");
        // Aquí puedes decidir qué hacer, por ejemplo, devolver el primero
    }
    return data[0]; // Devuelve el primer usuario encontrado
}
