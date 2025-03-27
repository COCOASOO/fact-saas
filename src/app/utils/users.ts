import { createClient } from "@/lib/supabase/supabaseClient";
import { User } from "../types/user";
const supabase = createClient();

export async function getCurrentUser() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error('No hay usuario autenticado');

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

    if (error) throw error;
    return user as User;
}

export async function getUsers() {
    // Esta función probablemente solo sea accesible para administradores
    const { data: users, error } = await supabase
        .from('users')
        .select('*');

    if (error) throw error;
    return users as User[];
}

export async function getUserById(id: string) {
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return user as User;
}

export async function updateUser(id: string, userData: Partial<User>) {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error('No hay usuario autenticado');
    
    // Verificar que el usuario solo actualice su propio perfil
    if (id !== authUser.id) {
        throw new Error('No tienes permiso para actualizar este usuario');
    }

    const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('user_id', authUser.id)
        .select()
        .single();

    if (error) throw error;
    return data as User;
} 