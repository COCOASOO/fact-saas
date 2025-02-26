import { createClient } from "@/lib/supabase/supabaseClient"

export interface Client {
    id: string
    company_id: string
    user_id: string
    name: string
    nif: string
    address?: string
    city?: string
    postcode?: string
    country: string
    email?: string
    phone?: string
    applies_irpf: boolean
    created_at?: string
}

export interface CreateClientDTO {
    company_id: string
    name: string
    nif: string
    address?: string
    city?: string
    postcode?: string
    country?: string
    email?: string
    phone?: string
    applies_irpf?: boolean
}

export interface UpdateClientDTO extends Partial<CreateClientDTO> {}

const supabase = createClient()

export async function getClients() {
    const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)

    if (error) throw error
    return clients as Client[]
}

export async function getClientById(id: string) {
    const { data: client, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single()

    if (error) throw error
    return client as Client
}

export async function addClient(client: CreateClientDTO) {
    const { data, error } = await supabase
        .from('clients')
        .insert([
            {
                ...client,
                user_id: (await supabase.auth.getUser()).data.user?.id,
                country: client.country || 'ESP',
                applies_irpf: client.applies_irpf ?? false
            }
        ])
        .select()
        .single()

    if (error) {
        if (error.code === '23505') {
            throw new Error('Ya existe un cliente con este NIF')
        }
        throw error
    }
    return data as Client
}

export async function updateClient(id: string, client: UpdateClientDTO) {
    const { data, error } = await supabase
        .from('clients')
        .update(client)
        .eq('id', id)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .select()
        .single()

    if (error) {
        if (error.code === '23505') {
            throw new Error('Ya existe un cliente con este NIF')
        }
        throw error
    }
    return data as Client
}

export async function deleteClient(id: string) {
    const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)

    if (error) throw error
    return true
} 