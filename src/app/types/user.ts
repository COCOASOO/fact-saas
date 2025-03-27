export interface User {
    id: string;
    user_id: string; // ID de autenticación de Supabase
    email: string;
    name?: string;
    created_at: string;
    updated_at?: string;
    profile_picture?: string;
} 