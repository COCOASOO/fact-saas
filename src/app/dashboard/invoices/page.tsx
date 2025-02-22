"use client";

import { useEffect, useState } from "react";
import { getInvoices, addInvoice } from "@/lib/database/invoices";
import { getClientsByUser } from "@/lib/database/clients"; // Función corregida para filtrar por usuario
import { createClient } from "@/lib/supabase/supabaseClient";
import Link from "next/link";
import { getUserByAuthUuid } from "@/lib/database/users";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<{ id: string; client_name: string; amount: number; status: string }[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [filteredClients, setFilteredClients] = useState<{ id: string; name: string }[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [preview, setPreview] = useState({ client: "", amount: 0 });
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        console.error("Error al obtener usuario:", error?.message);
        return;
      }
  
      console.log("Auth UUID obtenido:", data.user.id);
  
      // Obtener el usuario desde la tabla "users" por su auth_uuid
      const userData = await getUserByAuthUuid(data.user.id);
  
      if (!userData) {
        console.error("No se encontró el usuario en la tabla users.");
        return;
      }
  
      const userId = userData.id; // ID correcto del usuario
      console.log("ID del usuario en users:", userId);
  
      // Obtener facturas y clientes con el userId correcto
      const userInvoices = await getInvoices(userId);
      setInvoices(userInvoices);
  
      const clientList = await getClientsByUser(userId);
      setClients(clientList);
      setFilteredClients(clientList);
    }
  
    fetchData();
  }, []);
  

  // Función para filtrar clientes mientras se escribe en el buscador
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearch(query);
    setFilteredClients(clients.filter(client => client.name.toLowerCase().includes(query)));
  };

  const handleCreateInvoice = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    const { data: authData, error: authError } = await supabase.auth.getUser();
  
    if (authError || !authData.user) {
      console.error("Error al obtener usuario autenticado:", authError?.message);
      return;
    }
  
    // 1️⃣ Obtener el auth_uuid del usuario autenticado
    const authUuid = authData.user.id;
  
    // 2️⃣ Buscar el ID real en la tabla users
    const userData = await getUserByAuthUuid(authUuid);
  
    if (!userData || !userData.id) {
      console.error("Error: No se encontró el usuario en la tabla users.");
      return;
    }
  
    try {
      // 3️⃣ Insertar la factura usando el ID real del usuario
      await addInvoice({
        user_id: userData.id, // <-- Ahora usamos el ID correcto
        client_id: clientId,
        date: new Date().toISOString(),
        invoice_number: `INV-${Math.floor(Math.random() * 10000)}`,
        amount: parseFloat(amount),
        status: "Pendiente",
      });
  
      setModalOpen(false);
      setClientId("");
      setAmount("");
  
      // Refrescar facturas
      const userInvoices = await getInvoices(userData.id);
      setInvoices(userInvoices);
    } catch (error) {
      console.error("Error al crear la factura:", (error as Error).message);
      alert("Error al crear la factura: " + (error as Error).message);
    }
  };
  

  return (
    <div>
      <h1 className="text-2xl font-bold">Facturas</h1>
      <button 
        onClick={() => setModalOpen(true)} 
        className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
      >
        Nueva Factura
      </button>

      {/* Tabla de facturas */}
      <table className="mt-4 w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Cliente</th>
            <th className="border p-2">Monto</th>
            <th className="border p-2">Estado</th>
            <th className="border p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="border">
              <td className="p-2">{invoice.client_name}</td>
              <td className="p-2">${invoice.amount}</td>
              <td className="p-2">{invoice.status}</td>
              <td className="p-2">
                <Link href={`/dashboard/invoices/${invoice.id}`}>
                  <button className="bg-green-500 text-white px-3 py-1 rounded">Ver</button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal de creación de facturas */}
      {modalOpen && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg w-1/3">
            <h2 className="text-xl font-bold mb-4">Nueva Factura</h2>
            <form onSubmit={handleCreateInvoice}>
              <div className="mb-2">
                <label className="block">Buscar Cliente</label>
                <input
                  type="text"
                  value={search}
                  onChange={handleSearch}
                  placeholder="Escribe para filtrar..."
                  className="border p-2 w-full rounded"
                />
              </div>

              <div className="mb-2">
                <label className="block">Seleccionar Cliente</label>
                <select
                  value={clientId}
                  onChange={(e) => {
                    setClientId(e.target.value);
                    const selectedClient = clients.find(c => c.id === e.target.value);
                    setPreview({ ...preview, client: selectedClient ? selectedClient.name : "" });
                  }}
                  className="border p-2 w-full rounded"
                  required
                >
                  <option value="">-- Selecciona un cliente --</option>
                  {filteredClients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-2">
                <label className="block">Monto</label>
                <input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => { 
                    setAmount(e.target.value);
                    setPreview({ ...preview, amount: parseFloat(e.target.value) || 0 });
                  }} 
                  className="border p-2 w-full rounded" 
                  required 
                />
              </div>

              {/* Vista previa */}
              <div className="border p-4 mt-4">
                <h3 className="font-semibold">Vista Previa</h3>
                <p><strong>Cliente:</strong> {preview.client || "N/A"}</p>
                <p><strong>Monto:</strong> ${preview.amount.toFixed(2)}</p>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button 
                  type="button" 
                  className="bg-gray-400 px-4 py-2 rounded" 
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
