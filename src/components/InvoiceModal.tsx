"use client";
import { useState } from "react";
import { addInvoice } from "@/app/utils/invoices";

interface CreateInvoiceDTO {
  client_id: string;
  company_id: string;
  date: string;
  invoice_date: string;
  due_date: string;
  currency: string;
  series_id: string;
  invoice_type?: 'standard' | 'rectifying';
  rectifies_invoice_id?: string;
}

interface InvoiceModalProps {
  closeModal: () => void;
}

export default function InvoiceModal({ closeModal }: InvoiceModalProps) {
  const [client_id, setClientId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [company_id, setCompanyId] = useState<string>("");
  const [currency, setCurrency] = useState<string>("EUR");
  const [series_id, setSeriesId] = useState<string>("");

  const handleSubmit = async () => {
    await addInvoice({
      client_id,
      company_id,
      date,
      invoice_date: date,
      due_date: date, // Using same date for due_date for now
      currency,
      series_id,
      invoice_type: 'standard',
      invoice_number: `FAC-${Math.random().toString(36).substr(2, 9)}`,
      status: "draft",
      created_at: "",
      pdf_url: null,
      subtotal: 0,
      tax_rate: 0,
      tax_amount: 0,
      irpf_rate: 0,
      irpf_amount: 0,
      total_amount: 0,
      verifactu_xml: null,
      verifactu_hash: null,
      verifactu_signature: null,
      verifactu_status: null,
      verifactu_response: null,
      updated_at: ""
    });
    closeModal();
  };

  return (
    <div className="modal">
      <h2>Crear Factura</h2>
      <label>Cliente</label>
      <input type="text" value={client_id} onChange={(e) => setClientId(e.target.value)} />
      <label>Fecha</label>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <label>Monto</label>
      <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
      <label>Compañía</label>
      <input type="text" value={company_id} onChange={(e) => setCompanyId(e.target.value)} />
      <label>Moneda</label>
      <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
        <option value="EUR">EUR</option>
        <option value="USD">USD</option>
      </select>
      <label>Serie</label>
      <input type="text" value={series_id} onChange={(e) => setSeriesId(e.target.value)} />
      <button onClick={handleSubmit}>Guardar</button>
      <button onClick={closeModal}>Cancelar</button>
    </div>
  );
}
