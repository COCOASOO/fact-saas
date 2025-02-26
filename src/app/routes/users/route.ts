import { createClient } from "@/lib/supabase/supabaseClient"

export interface User {
    id: string
    email: string
    name: string
    phone?: string
    user_id: string
    created_at?: string
}

const supabase = createClient()

export async function getUsers() {
    const { data: users, error } = await supabase
        .from('users')
        .select('*')

    if (error) throw error
    return users as User[]
}

export async function getUserById(id: string) {
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single()

    if (error) throw error
    return user as User
}

export async function getCurrentUser() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) throw new Error('No authenticated user')

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', authUser.id)
        .single()

    if (error) throw error
    return user as User
}
