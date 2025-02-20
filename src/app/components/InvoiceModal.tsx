"use client";
import { useState } from "react";
import { addInvoice } from "@/app/lib/database/invoices";

interface InvoiceModalProps {
  closeModal: () => void;
}

export default function InvoiceModal({ closeModal }: InvoiceModalProps) {
  const [client_id, setClientId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);

  const handleSubmit = async () => {
    await addInvoice({
      user_id: "ID_DEL_USUARIO",
      client_id,
      date,
      invoice_number: `FAC-${Math.random().toString(36).substr(2, 9)}`,
      amount,
      status: "pending",
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
      <button onClick={handleSubmit}>Guardar</button>
      <button onClick={closeModal}>Cancelar</button>
    </div>
  );
}
