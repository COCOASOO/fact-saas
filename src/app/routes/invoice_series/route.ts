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
          console.error(`Error getting last number for series ${serie.id}:`, error);
          return {
            ...serie,
            last_invoice_number: null
          };
        }
      })
    );

    return seriesWithLastNumber;
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

    // Obtener todas las facturas de esta serie ordenadas por número
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('series_id', seriesId)
      .order('invoice_number');

    if (invoicesError) throw invoicesError;

    // Encontrar el primer hueco en la numeración o usar el siguiente número
    let nextNumber = 1;
    if (invoices && invoices.length > 0) {
      const usedNumbers = invoices.map(inv => parseInt(inv.invoice_number));
      while (usedNumbers.includes(nextNumber)) {
        nextNumber++;
      }
    }

    // Actualizamos el contador en la base de datos si el nuevo número es mayor
    if (nextNumber > series.invoice_number) {
      const { error: updateError } = await supabase
        .from("invoice_series")
        .update({ invoice_number: nextNumber })
        .eq("id", seriesId);

      if (updateError) throw updateError;
    }

    // Obtenemos el año actual
    const currentYear = new Date().getFullYear();
    
    // Primero reemplazamos los símbolos de año
    let formattedNumber = series.serie_format
      .replace('%%%%', currentYear.toString())
      .replace('%%', currentYear.toString().slice(-2));

    // Luego reemplazamos los # con el número de factura
    formattedNumber = formattedNumber.replace(
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

export async function updateSeriesInvoiceCount(seriesId: string) {
  try {
    const { count, error } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('series_id', seriesId);

    if (error) throw error;

    const { error: updateError } = await supabase
      .from('invoice_series')
      .update({ invoice_number: count || 0 })
      .eq('id', seriesId);

    if (updateError) throw updateError;

    return count || 0;
  } catch (error) {
    console.error('Error updating series invoice count:', error);
    throw error;
  }
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
    const { count, error: countError } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('series_id', id);

    if (countError) throw countError;

    if (count && count > 0) {
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

export async function getLastInvoiceNumber(seriesId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('invoice_number, created_at')  // Incluimos created_at explícitamente
      .eq('series_id', seriesId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error in getLastInvoiceNumber:", error);
      return null;
    }

    // Verificamos si hay resultados
    if (!data || data.length === 0) {
      return null;
    }

    return data[0].invoice_number;
  } catch (error) {
    console.error("Error getting last invoice number:", error);
    return null;
  }
}
