"use client";

import { useAuth } from "@/app/contexts/authContext";
import { getClients, addClient, updateClient, deleteClient, type Client } from "@/app/routes/clients/route";
import { getInvoiceItems, addInvoiceItem, updateInvoiceItem, deleteInvoiceItem, type InvoiceItem } from "@/app/routes/invoice_items/route";
import { getPayments, addPayment, type Payment } from "@/app/routes/payments/route";
import { getVerifactuLogs, addVerifactuLog, type VerifactuLog } from "@/app/routes/verifactu_logs/route";
import { useState } from "react";

export default function Dashboard() {
    const {user} = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [logs, setLogs] = useState<VerifactuLog[]>([]);

    // Datos de prueba para crear un cliente
    const sampleClient = {
        company_id: "b25dc479-ba38-44b6-a4cb-34dfda642ef9",
        name: `Cliente Prueba ${Math.floor(Math.random() * 1000)}`,
        nif: `B${Math.floor(Math.random() * 100000000)}`,
        country: "ESP",
        applies_irpf: true
    };

    // Datos de prueba para crear un item de factura
    const sampleInvoiceItem = {
        invoice_id: "19be3e74-a043-4755-a458-71bec95710cd", // Asegúrate de usar un ID válido de una factura existente
        description: `Item de prueba ${Math.floor(Math.random() * 1000)}`,
        quantity: Math.floor(Math.random() * 10) + 1,
        unit_price: Math.floor(Math.random() * 100) + 1,
        total_price: 0, // Se calculará antes de enviar
    };

    // Datos de prueba para crear un pago
    const samplePayment = {
        invoice_id: "19be3e74-a043-4755-a458-71bec95710cd", // Asegúrate de usar un ID válido de una factura existente
        amount: Math.floor(Math.random() * 1000) + 100,
        payment_method: 'card' as const,
        status: 'completed' as const,
    };

    // Datos de prueba para crear un log
    const sampleLog = {
        invoice_id: "19be3e74-a043-4755-a458-71bec95710cd", // Asegúrate de usar un ID válido de una factura existente
        request_payload: {
            test: true,
            timestamp: new Date().toISOString(),
            data: `Test data ${Math.floor(Math.random() * 1000)}`
        }
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

    const handleGetInvoiceItems = async () => {
        console.log("🔍 Solicitando lista de items...");
        try {
            const result = await getInvoiceItems(sampleInvoiceItem.invoice_id);
            console.log("📋 Items obtenidos:", result);
            setInvoiceItems(result);
        } catch (error) {
            console.error("❌ Error al obtener items:", error);
        }
    };

    const handleCreateInvoiceItem = async () => {
        console.log("📝 Creando item de prueba...");
        try {
            // Calculamos el total_price antes de crear
            const itemToCreate = {
                ...sampleInvoiceItem,
                total_price: sampleInvoiceItem.quantity * sampleInvoiceItem.unit_price
            };
            console.log("📝 Datos a enviar:", itemToCreate);
            
            const result = await addInvoiceItem(itemToCreate);
            console.log("✅ Item creado:", result);
            handleGetInvoiceItems(); // Actualizamos la lista
        } catch (error) {
            console.error("❌ Error al crear item:", error);
        }
    };

    const handleUpdateInvoiceItem = async () => {
        if (invoiceItems.length === 0) {
            console.log("⚠️ No hay items para actualizar");
            return;
        }
        const itemToUpdate = invoiceItems[0];
        console.log("📝 Actualizando primer item...");
        try {
            const newQuantity = Math.floor(Math.random() * 10) + 1;
            const result = await updateInvoiceItem(itemToUpdate.id, {
                quantity: newQuantity,
                total_price: newQuantity * itemToUpdate.unit_price
            });
            console.log("✅ Item actualizado:", result);
            handleGetInvoiceItems(); // Actualizamos la lista
        } catch (error) {
            console.error("❌ Error al actualizar item:", error);
        }
    };

    const handleDeleteInvoiceItem = async () => {
        if (invoiceItems.length === 0) {
            console.log("⚠️ No hay items para eliminar");
            return;
        }
        const itemToDelete = invoiceItems[0];
        console.log("🗑️ Eliminando primer item...");
        try {
            await deleteInvoiceItem(itemToDelete.id);
            console.log("✅ Item eliminado");
            handleGetInvoiceItems(); // Actualizamos la lista
        } catch (error) {
            console.error("❌ Error al eliminar item:", error);
        }
    };

    const handleGetPayments = async () => {
        console.log("🔍 Solicitando lista de pagos...");
        try {
            const result = await getPayments(samplePayment.invoice_id);
            console.log("📋 Pagos obtenidos:", result);
            setPayments(result);
        } catch (error) {
            console.error("❌ Error al obtener pagos:", error);
        }
    };

    const handleCreatePayment = async () => {
        console.log("📝 Creando pago de prueba...");
        try {
            console.log("📝 Datos a enviar:", samplePayment);
            
            const result = await addPayment(samplePayment);
            console.log("✅ Pago creado:", result);
            handleGetPayments(); // Actualizamos la lista
        } catch (error) {
            console.error("❌ Error al crear pago:", error);
        }
    };

    const handleGetLogs = async () => {
        console.log("🔍 Solicitando lista de logs...");
        try {
            const result = await getVerifactuLogs();
            console.log("📋 Logs obtenidos:", result);
            setLogs(result);
        } catch (error) {
            console.error("❌ Error al obtener logs:", error);
        }
    };

    const handleCreateLog = async () => {
        console.log("📝 Creando log de prueba...");
        try {
            console.log("📝 Datos a enviar:", sampleLog);
            
            const result = await addVerifactuLog(sampleLog);
            console.log("✅ Log creado:", result);
            handleGetLogs(); // Actualizamos la lista
        } catch (error) {
            console.error("❌ Error al crear log:", error);
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

            <div className="space-x-4 mb-8">
                <button onClick={handleGetInvoiceItems} className="bg-blue-500 text-white px-4 py-2 rounded">
                    Listar Items
                </button>
                <button onClick={handleCreateInvoiceItem} className="bg-green-500 text-white px-4 py-2 rounded">
                    Crear Item
                </button>
                <button onClick={handleUpdateInvoiceItem} className="bg-yellow-500 text-white px-4 py-2 rounded">
                    Actualizar Primer Item
                </button>
                <button onClick={handleDeleteInvoiceItem} className="bg-red-500 text-white px-4 py-2 rounded">
                    Eliminar Primer Item
                </button>
            </div>

            <div className="space-x-4 mb-8">
                <button onClick={handleGetPayments} className="bg-blue-500 text-white px-4 py-2 rounded">
                    Listar Pagos
                </button>
                <button onClick={handleCreatePayment} className="bg-green-500 text-white px-4 py-2 rounded">
                    Crear Pago
                </button>
            </div>

            <div className="space-x-4 mb-8">
                <button onClick={handleGetLogs} className="bg-blue-500 text-white px-4 py-2 rounded">
                    Listar Logs
                </button>
                <button onClick={handleCreateLog} className="bg-green-500 text-white px-4 py-2 rounded">
                    Crear Log
                </button>
            </div>

            <div className="mt-4">
                <h2 className="text-xl font-semibold mb-2">Clientes ({clients.length})</h2>
                <pre className="bg-gray-100 p-4 rounded">
                    {JSON.stringify(clients, null, 2)}
                </pre>
            </div>

            <div className="mt-4">
                <h2 className="text-xl font-semibold mb-2">Items de Factura ({invoiceItems.length})</h2>
                <pre className="bg-gray-100 p-4 rounded">
                    {JSON.stringify(invoiceItems, null, 2)}
                </pre>
            </div>

            <div className="mt-4">
                <h2 className="text-xl font-semibold mb-2">Pagos ({payments.length})</h2>
                <pre className="bg-gray-100 p-4 rounded">
                    {JSON.stringify(payments, null, 2)}
                </pre>
            </div>

            <div className="mt-4">
                <h2 className="text-xl font-semibold mb-2">Logs de Verifactu ({logs.length})</h2>
                <pre className="bg-gray-100 p-4 rounded">
                    {JSON.stringify(logs, null, 2)}
                </pre>
            </div>
        </div>
    );
}
