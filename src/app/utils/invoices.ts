import { createClient } from "@/lib/supabase/supabaseClient";
import type { Invoice } from "@/app/types/invoice";

const supabase = createClient();

// Export the interfaces if they're not already defined in types/invoice.ts
export type { Invoice };

export interface CreateInvoiceDTO {
  client_id: string;
  company_id: string;
  date: string;
  invoice_date: string;
  due_date: string;
  currency: string;
  series_id: string;
  invoice_type?: 'standard' | 'rectifying';
  rectifies_invoice_id?: string;
  // Add other fields as needed
}

export interface UpdateInvoiceDTO extends Partial<CreateInvoiceDTO> {
  status?: 'draft' | 'final' | 'submitted';
  pdf_url?: string;
}

export async function getInvoices(options: {
  status?: string;
  client_id?: string;
  limit?: number;
  offset?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}) {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error("User not authenticated");

    let query = supabase
      .from("invoices")
      .select("*, client:client_id(name, nif)")
      .eq("user_id", userId);

    if (options.status) {
      query = query.eq("status", options.status);
    }

    if (options.client_id) {
      query = query.eq("client_id", options.client_id);
    }

    if (options.search) {
      query = query.or(`invoice_number.ilike.%${options.search}%,client.name.ilike.%${options.search}%`);
    }

    if (options.sort_by) {
      query = query.order(options.sort_by, { ascending: options.sort_order === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      invoices: data as Invoice[],
      total: count || 0
    };
  } catch (error) {
    console.error("Error getting invoices:", error);
    throw error;
  }
}

// Add other invoice-related functions
export async function getInvoiceById(id: string) {
  // Implementation
}

export async function createInvoice(invoiceData: CreateInvoiceDTO): Promise<Invoice> {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error("User not authenticated");

    // Convert the DTO to a database-compatible object
    const newInvoice = {
      ...invoiceData,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert the invoice and return the created record
    const { data, error } = await supabase
      .from("invoices")
      .insert([newInvoice])
      .select("*")
      .single();

    if (error) throw error;
    
    return data as Invoice;
  } catch (error) {
    console.error("Error creating invoice:", error);
    throw error;
  }
}

export async function updateInvoice(
  id: string, 
  invoice: Partial<Invoice>
): Promise<Invoice> {
  try {
    const supabase = createClient();
    
    // Actualizar la factura
    const { data, error } = await supabase
      .from("invoices")
      .update(invoice)
      .eq("id", id)
      .select("*")  // Importante: seleccionar los datos actualizados
      .single();

    if (error) {
      console.error("Error updating invoice:", error);
      throw error;
    }
    
    return data as Invoice;
  } catch (error) {
    console.error("Error in updateInvoice:", error);
    throw error;
  }
}

export async function deleteInvoice(id: string) {
  // Implementation
}

// Function to update invoice status
export async function updateInvoiceStatus(id: string, status: 'draft' | 'final' | 'submitted') {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error("User not authenticated");
    
    const invoice = await getInvoiceById(id);
    
    // If not a final status update, do simple update
    if (status !== 'final') {
      const { error } = await supabase
        .from("invoices")
        .update({ status })
        .eq("id", id)
        .eq("user_id", userId);
      
      if (error) throw error;
      return true;
    }
    
    // For final status, do additional validations
    // (Add your implementation from the original route file)
    
    return true;
  } catch (error) {
    console.error("Error updating invoice status:", error);
    throw error;
  }
}

// Function to generate invoice number
export async function generateInvoiceNumber(seriesId: string): Promise<string> {
  // Implement the function here (copy from the original route file)
  // ...
  
  return "INVOICE-NUMBER"; // Replace with actual implementation
}

export async function addInvoice(invoice: Omit<Invoice, 'id' | 'user_id'>): Promise<Invoice> {
  // Handle type conversion for createInvoiceDTO
  const createInvoiceData: CreateInvoiceDTO = {
    client_id: invoice.client_id,
    company_id: invoice.company_id,
    date: invoice.date,
    invoice_date: invoice.invoice_date,
    due_date: invoice.due_date,
    currency: invoice.currency,
    series_id: invoice.series_id,
    invoice_type: invoice.invoice_type || 'standard',
    // Convert null to undefined for rectifies_invoice_id
    rectifies_invoice_id: invoice.rectifies_invoice_id !== null ? invoice.rectifies_invoice_id : undefined,
  };

  return await createInvoice(createInvoiceData);
} 