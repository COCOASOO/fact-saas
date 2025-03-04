export type InvoiceSeries = {
  id: string;
  user_id: string;
  serie_format: string;
  invoice_number: number;
  default: boolean;
  type: 'standard' | 'rectifying';
  created_at: string;
};

export type CreateInvoiceSeriesDTO = Omit<InvoiceSeries, 'id' | 'created_at' | 'user_id'>; 