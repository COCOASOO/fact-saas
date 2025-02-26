"use client";

import { useAuth } from "@/app/contexts/authContext";
import { getClients, addClient, updateClient, deleteClient, type Client } from "@/app/routes/clients/route";
import { useState } from "react";

export default function Dashboard() {
    const {user} = useAuth();
    const [clients, setClients] = useState<Client[]>([]);

    // Datos de prueba para crear un cliente
    const sampleClient = {
        company_id: "b25dc479-ba38-44b6-a4cb-34dfda642ef9",
        name: `Cliente Prueba ${Math.floor(Math.random() * 1000)}`,
        nif: `B${Math.floor(Math.random() * 100000000)}`,
        country: "ESP",
        applies_irpf: true
    };

    const handleGetClients = async () => {
        console.log("🔍 Solicitando lista de clientes...");
        try {
            const result = await getClients();
            console.log("📋 Clientes obtenidos:", result);
            setClients(result);
        } catch (error) {
            console.error("❌ Error al obtener clientes:", error);
        }
    };

    const handleCreateClient = async () => {
        console.log("📝 Creando cliente de prueba...");
        try {
            const result = await addClient(sampleClient);
            console.log("✅ Cliente creado:", result);
            handleGetClients(); // Actualizamos la lista
        } catch (error) {
            console.error("❌ Error al crear cliente:", error);
        }
    };

    const handleUpdateClient = async () => {
        if (clients.length === 0) {
            console.log("⚠️ No hay clientes para actualizar");
            return;
        }
        const clientToUpdate = clients[0];
        console.log("📝 Actualizando primer cliente...");
        try {
            const result = await updateClient(clientToUpdate.id, {
                name: `Cliente Actualizado ${Math.floor(Math.random() * 1000)}`
            });
            console.log("✅ Cliente actualizado:", result);
            handleGetClients(); // Actualizamos la lista
        } catch (error) {
            console.error("❌ Error al actualizar cliente:", error);
        }
    };

    const handleDeleteClient = async () => {
        if (clients.length === 0) {
            console.log("⚠️ No hay clientes para eliminar");
            return;
        }
        const clientToDelete = clients[0];
        console.log("🗑️ Eliminando primer cliente...");
        try {
            await deleteClient(clientToDelete.id);
            console.log("✅ Cliente eliminado");
            handleGetClients(); // Actualizamos la lista
        } catch (error) {
            console.error("❌ Error al eliminar cliente:", error);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            {user && <p className="mb-4">Bienvenido, {user.email}</p>}
            
            <div className="space-x-4 mb-8">
                <button onClick={handleGetClients} className="bg-blue-500 text-white px-4 py-2 rounded">
                    Listar Clientes
                </button>
                <button onClick={handleCreateClient} className="bg-green-500 text-white px-4 py-2 rounded">
                    Crear Cliente
                </button>
                <button onClick={handleUpdateClient} className="bg-yellow-500 text-white px-4 py-2 rounded">
                    Actualizar Primer Cliente
                </button>
                <button onClick={handleDeleteClient} className="bg-red-500 text-white px-4 py-2 rounded">
                    Eliminar Primer Cliente
                </button>
            </div>

            <div className="mt-4">
                <h2 className="text-xl font-semibold mb-2">Clientes ({clients.length})</h2>
                <pre className="bg-gray-100 p-4 rounded">
                    {JSON.stringify(clients, null, 2)}
                </pre>
            </div>
        </div>
    );
}
