import { createClient } from "@/lib/supabase/supabaseClient"
import { NextRequest, NextResponse } from "next/server";
import * as InvoiceItemUtils from "@/app/utils/invoice_items";

export interface InvoiceItem {
    id: string
    invoice_id: string
    description: string
    quantity: number
    unit_price: number
    total_price: number
}

export interface CreateInvoiceItemDTO {
    invoice_id: string
    description: string
    quantity: number
    unit_price: number
    total_price: number
}

export interface UpdateInvoiceItemDTO extends Partial<CreateInvoiceItemDTO> {}

const supabase = createClient()

async function getCurrentUserId() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        throw new Error('No hay usuario autenticado')
    }
    return user.id
}

export async function getInvoiceItems(invoiceId: string) {
    try {
        const userId = await getCurrentUserId()
        
        const { data: items, error } = await supabase
            .from('invoice_items')
            .select('*, invoices!inner(*)')
            .eq('invoices.user_id', userId)
            .eq('invoice_id', invoiceId)

        if (error) {
            throw error
        }
        
        return items as InvoiceItem[]
    } catch (error) {
        throw error;
    }
}

export async function getInvoiceItemById(id: string) {
    try {
        const userId = await getCurrentUserId()
        
        const { data: item, error } = await supabase
            .from('invoice_items')
            .select('*, invoices!inner(*)')
            .eq('invoices.user_id', userId)
            .eq('id', id)
            .single()

        if (error) {
            throw error
        }

        return item as InvoiceItem
    } catch (error) {
        throw error;
    }
}

export async function addInvoiceItem(item: CreateInvoiceItemDTO) {
    try {
        await getCurrentUserId() // Verificamos que el usuario está autenticado
        
        const { data, error } = await supabase
            .from('invoice_items')
            .insert([item])
            .select()
            .single()

        if (error) {
            throw error
        }

        return data as InvoiceItem
    } catch (error) {
        throw error;
    }
}

export async function updateInvoiceItem(id: string, item: UpdateInvoiceItemDTO) {
    try {
        await getCurrentUserId() // Verificamos que el usuario está autenticado
        
        const { data, error } = await supabase
            .from('invoice_items')
            .update(item)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw error
        }

        return data as InvoiceItem
    } catch (error) {
        throw error;
    }
}

export async function deleteInvoiceItem(id: string) {
    try {
        await getCurrentUserId() // Verificamos que el usuario está autenticado
        
        const { error } = await supabase
            .from('invoice_items')
            .delete()
            .eq('id', id)

        if (error) {
            throw error
        }

        return true
    } catch (error) {
        throw error;
    }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoice_id');
    
    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }
    
    const items = await getInvoiceItems(invoiceId);
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const item = await addInvoiceItem(data);
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    const data = await request.json();
    const item = await updateInvoiceItem(id, data);
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    await deleteInvoiceItem(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
