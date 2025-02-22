"use client";

import { useEffect, useState } from "react";
import { createInvoice } from "./actions";
import { createClient } from "@/lib/supabase/supabaseClient";
import { getClients } from "@/lib/database/clients";
import { useRouter } from "next/navigation";

export default function CreateInvoicePage() {
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [filteredClients, setFilteredClients] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchClients() {
      const clientList = await getClients();
      setClients(clientList);
      setFilteredClients(clientList);
    }
    fetchClients();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearch(query);
    setFilteredClients(clients.filter(client => client.name.toLowerCase().includes(query)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.getUser();
    if (data.user && clientId) {
      await createInvoice(data.user.id, clientId, parseFloat(amount));
      router.push("/dashboard/invoices");
    } else {
      alert("Selecciona un cliente válido");
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-lg rounded">
      <h1 className="text-2xl font-bold mb-4">Crear Factura</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold">Buscar Cliente</label>
          <input 
            type="text" 
            value={search} 
            onChange={handleSearch} 
            placeholder="Escribe para filtrar..." 
            className="border p-2 w-full rounded" 
          />
        </div>

        <div>
          <label className="block font-semibold">Seleccionar Cliente</label>
          <select 
            value={clientId} 
            onChange={(e) => setClientId(e.target.value)} 
            className="border p-2 w-full rounded" 
            required
          >
            <option value="">-- Selecciona un cliente --</option>
            {filteredClients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold">Monto</label>
          <input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            className="border p-2 w-full rounded" 
            required 
          />
        </div>

        <button 
          type="submit" 
          className="bg-blue-500 text-white px-4 py-2 rounded w-full"
        >
          Guardar Factura
        </button>
      </form>
    </div>
  );
}
