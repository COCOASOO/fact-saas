import { getInvoiceById } from "./actions";

export default async function InvoiceDetailPage({ params }: { params: { invoiceId: string } }) {
  const invoice = await getInvoiceById(params.invoiceId);

  return (
    <div>
      <h1 className="text-2xl font-bold">Factura de {invoice.client}</h1>
      <p>Monto: ${invoice.amount}</p>
      <p>Estado: {invoice.status}</p>
    </div>
  );
}
