import { createClient } from "@/lib/supabase/supabaseClient";
import type {
  InvoiceSeries,
  CreateInvoiceSeriesDTO,
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

export async function updateInvoiceSeries(id: string, series: CreateInvoiceSeriesDTO) {
  try {

    // Si es serie por defecto, actualizar las otras series del mismo tipo
    if (series.default) {
      const { error: updateError } = await supabase
        .from("invoice_series")
        .update({ default: false })
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .eq("type", series.type)
        .neq("id", id); // No actualizar la serie actual

      if (updateError) throw updateError;
    }

    const { data, error } = await supabase
      .from("invoice_series")
      .update({
        ...series,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        invoice_number: series.invoice_number || 0,
        default: series.default ?? false,
        type: series.type || null
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
