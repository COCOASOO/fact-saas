import { createClient } from "@/lib/supabase/supabaseClient";
import type {
  InvoiceSeries,
  CreateInvoiceSeriesDTO,
  UpdateInvoiceSeriesDTO,
} from "@/app/types/invoice-series";

const supabase = createClient();

export async function getInvoiceSeries() {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      throw new Error("Usuario no autenticado");
    }

    const { data: series, error } = await supabase
      .from("invoice_series")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    if (!series) return [];

    // Obtener el último número de factura para cada serie
    const seriesWithLastNumber = await Promise.all(
      series.map(async (serie) => {
        try {
          const lastNumber = await getLastInvoiceNumber(serie.id);
          return {
            ...serie,
            last_invoice_number: lastNumber
          };
        } catch (error) {
          return {
            ...serie,
            last_invoice_number: null
          };
        }
      })
    );

    return seriesWithLastNumber;
  } catch (error) {
    throw error;
  }
}

// Add all other functions from your original file
export async function getLastInvoiceNumber(seriesId: string) {
  // Implementation
}

export async function getInvoiceSeriesById(id: string) {
  // Implementation
}

export async function addInvoiceSeries(series: CreateInvoiceSeriesDTO) {
  // Implementation
}

export async function updateInvoiceSeries(id: string, series: UpdateInvoiceSeriesDTO) {
  // Implementation
}

export async function deleteInvoiceSeries(id: string) {
  // Implementation
}

export async function checkSeriesHasInvoices(seriesId: string): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .eq("series_id", seriesId);
    
    if (error) throw error;
    
    // If count is null or undefined, assume no invoices (though this shouldn't happen)
    return (count ?? 0) > 0;
  } catch (error) {
    console.error("Error checking if series has invoices:", error);
    throw error;
  }
}

/**
 * Gets the next available invoice number for a specific series
 */
export async function getNextInvoiceNumber(seriesId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("invoice_series")
      .select("invoice_number")
      .eq("id", seriesId)
      .single();

    if (error) throw error;
    if (!data) throw new Error("Series not found");

    return data.invoice_number;
  } catch (error) {
    console.error("Error getting next invoice number:", error);
    throw error;
  }
}

/**
 * Updates the invoice counter for a series after creating a new invoice
 */
export async function updateSeriesInvoiceCount(seriesId: string): Promise<void> {
  try {
    // First try to use the RPC function if available in your Supabase project
    const { error } = await supabase.rpc("increment_series_counter", {
      series_id: seriesId
    });

    if (error) {
      // Fallback method if RPC isn't available
      const { data: currentSeries, error: fetchError } = await supabase
        .from("invoice_series")
        .select("invoice_number")
        .eq("id", seriesId)
        .single();
      
      if (fetchError) throw fetchError;
      if (!currentSeries) throw new Error("Series not found");

      const { error: updateError } = await supabase
        .from("invoice_series")
        .update({ invoice_number: currentSeries.invoice_number + 1 })
        .eq("id", seriesId);

      if (updateError) throw updateError;
    }
  } catch (error) {
    console.error("Error updating series invoice count:", error);
    throw error;
  }
}

/**
 * Check if a series format already exists for the current user
 */
export async function checkDuplicateFormat(format: string, excludeId?: string): Promise<boolean> {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      throw new Error("Usuario no autenticado");
    }

    let query = supabase
      .from("invoice_series")
      .select("id")
      .eq("user_id", userId)
      .eq("serie_format", format);

    // If we're updating an existing series, exclude it from the check
    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    // Return true if any matching records were found (meaning it's a duplicate)
    return (data?.length ?? 0) > 0;
  } catch (error) {
    console.error("Error checking duplicate format:", error);
    throw error;
  }
} 