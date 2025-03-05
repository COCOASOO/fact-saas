import { createClient } from "@/lib/supabase/supabaseClient";
import type {
  InvoiceSeries,
  CreateInvoiceSeriesDTO,
  UpdateInvoiceSeriesDTO,
} from "@/app/types/invoice-series";

const supabase = createClient();

export async function getInvoiceSeries() {
  try {
    const { data, error } = await supabase
      .from("invoice_series")
      .select("*")
      .eq("user_id", (await supabase.auth.getUser()).data.user?.id);

    if (error) throw error;
    return data as InvoiceSeries[];
  } catch (error) {
    console.error("Error getting invoice series:", error);
    throw error;
  }
}

export async function addInvoiceSeries(series: CreateInvoiceSeriesDTO) {
  try {
    // Si es serie por defecto, actualizar las otras series del mismo tipo
    if (series.default) {
      const { error: updateError } = await supabase
        .from("invoice_series")
        .update({ default: false })
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .eq("type", series.type);

      if (updateError) throw updateError;
    }

    const { data, error } = await supabase
      .from("invoice_series")
      .insert([
        {
          ...series,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          invoice_number: series.invoice_number || 0,
          default: series.default ?? false,
          type: series.type || null
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data as InvoiceSeries;
  } catch (error) {
    console.error("Error adding invoice series:", error);
    throw error;
  }
}

export async function getNextInvoiceNumber(seriesId: string): Promise<string> {
  try {
    const { data: series, error } = await supabase
      .from("invoice_series")
      .select("*")
      .eq("id", seriesId)
      .single();

    if (error) throw error;

    // Incrementamos el número de factura
    const nextNumber = series.invoice_number + 1;

    // Actualizamos el contador en la base de datos
    const { error: updateError } = await supabase
      .from("invoice_series")
      .update({ invoice_number: nextNumber })
      .eq("id", seriesId);

    if (updateError) throw updateError;

    // Formateamos el número según el formato de la serie
    const formattedNumber = series.serie_format.replace(
      /#+/g,
      nextNumber
        .toString()
        .padStart(series.serie_format.match(/#+/)[0].length, "0")
    );

    return formattedNumber;
  } catch (error) {
    console.error("Error getting next invoice number:", error);
    throw error;
  }
}

export async function checkSeriesHasInvoices(seriesId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('series_id', seriesId);

  if (error) throw error;
  return count ? count > 0 : false;
}

export async function deleteInvoiceSeries(id: string) {
  try {
    const { data: series } = await supabase
      .from("invoice_series")
      .select("*")
      .eq("id", id)
      .single();

    if (!series) {
      throw new Error("Serie no encontrada");
    }

    // Verificar si es serie por defecto
    if (series.default) {
      throw new Error("No se puede eliminar una serie por defecto");
    }

    // Verificar si tiene facturas asociadas
    const hasInvoices = await checkSeriesHasInvoices(id);
    if (hasInvoices) {
      throw new Error("No se puede eliminar una serie que contiene facturas");
    }

    const { error } = await supabase
      .from("invoice_series")
      .delete()
      .eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting invoice series:", error);
    throw error;
  }
}

export async function updateInvoiceSeries(id: string, series: UpdateInvoiceSeriesDTO) {
  try {
    
    // Verificar si la serie tiene facturas
    const hasInvoices = await checkSeriesHasInvoices(id);
    
    if (hasInvoices) {
      // Si tiene facturas, solo permitir actualizar el campo 'default'
      if (Object.keys(series).some(key => key !== 'default')) {
        throw new Error("Solo se puede modificar si es serie por defecto cuando existen facturas");
      }
    }

    // Si es serie por defecto, actualizar las otras series del mismo tipo
    if (series.default) {
      const { error: updateError } = await supabase
        .from("invoice_series")
        .update({ default: false })
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .eq("type", series.type)
        .neq("id", id);

      if (updateError) throw updateError;
    }

    const { data, error } = await supabase
      .from("invoice_series")
      .update({
        ...series,
        user_id: (await supabase.auth.getUser()).data.user?.id,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as InvoiceSeries;
  } catch (error) {
    console.error("Error updating invoice series:", error);
    throw error;
  }
}

export async function checkDuplicateFormat(format: string, excludeId?: string) {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    let query = supabase
      .from("invoice_series")
      .select("*")
      .eq("user_id", userId)
      .eq("serie_format", format);
    
    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data.length > 0;
  } catch (error) {
    console.error("Error checking duplicate format:", error);
    throw error;
  }
}
