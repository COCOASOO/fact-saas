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

export async function addInvoiceSeries(series: CreateInvoiceSeriesDTO) {
  try {
    // Siempre establecer como default al crear
    const seriesWithDefault = {
      ...series,
      default: true
    };

    // Actualizar las otras series del mismo tipo
    const { error: updateError } = await supabase
      .from("invoice_series")
      .update({ default: false })
      .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
      .eq("type", series.type);

    if (updateError) throw updateError;

    const { data, error } = await supabase
      .from("invoice_series")
      .insert([
        {
          ...seriesWithDefault,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          invoice_number: series.invoice_number || 0,
          type: series.type || null
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data as InvoiceSeries;
  } catch (error) {
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
      .eq('series_id', seriesId);

    if (invoicesError) throw invoicesError;

    // Encontrar el primer hueco en la numeración o usar el siguiente número
    let nextNumber = 1;
    if (invoices && invoices.length > 0) {
      // Extraer y ordenar los números de las facturas existentes
      const usedNumbers = invoices
        .map(inv => {
          const match = inv.invoice_number.match(/\d+$/);
          return match ? parseInt(match[0], 10) : 0;
        })
        .filter(num => num > 0)
        .sort((a, b) => a - b);

      // Si no hay números usados, empezar desde 1
      if (usedNumbers.length === 0) {
        nextNumber = 1;
      } else {
        // Buscar el primer hueco disponible
        let foundGap = false;
        for (let i = 1; i <= Math.max(...usedNumbers) + 1; i++) {
          if (!usedNumbers.includes(i)) {
            nextNumber = i;
            foundGap = true;
            break;
          }
        }

        // Si no se encontró ningún hueco, usar el siguiente número
        if (!foundGap) {
          nextNumber = Math.max(...usedNumbers) + 1;
        }
      }
    }

    // Obtenemos el año actual
    const currentYear = new Date().getFullYear();
    
    // Primero reemplazamos los símbolos de año
    let formattedNumber = series.serie_format
      .replace('%%%%', currentYear.toString())
      .replace('%%', currentYear.toString().slice(-2));

    // Luego reemplazamos los # con el número de factura
    const numberPattern = series.serie_format.match(/#+/);
    if (!numberPattern) {
      throw new Error('El formato de la serie debe contener al menos un #');
    }

    formattedNumber = formattedNumber.replace(
      /#+/g,
      nextNumber.toString().padStart(numberPattern[0].length, "0")
    );

    // Verificación final usando el número en lugar del formato completo
    const { data: existingInvoices } = await supabase
      .from('invoices')
      .select('id')
      .eq('series_id', seriesId)
      .eq('invoice_number', formattedNumber);

    if (existingInvoices && existingInvoices.length > 0) {
      // Si el número ya está en uso, intentar con el siguiente
      nextNumber++;
      return getNextInvoiceNumber(seriesId);
    }

    return formattedNumber;
  } catch (error) {
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
    throw error;
  }
}

export async function getLastInvoiceNumber(seriesId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('invoice_number, created_at')
      .eq('series_id', seriesId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    return data[0].invoice_number;
  } catch (error) {
    return null;
  }
}
