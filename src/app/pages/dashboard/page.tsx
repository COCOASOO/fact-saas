"use client";

import { useAuth } from "@/app/contexts/authContext";
import { getInvoices, addInvoice, updateInvoice, deleteInvoice, type Invoice } from "@/app/routes/invoices/route";
import { useState } from "react";

export default function Dashboard() {
    const {user} = useAuth();
    const [invoices, setInvoices] = useState<Invoice[]>([]);

    // Datos de prueba para crear una factura
    const sampleInvoice = {
        client_id: "a98a6845-1046-4d37-bd23-5f4cf0b20a37",
        company_id: "b25dc479-ba38-44b6-a4cb-34dfda642ef9",
        invoice_number: `TEST-${Math.floor(Math.random() * 1000)}`,
        subtotal: 1000,
        tax_rate: 0.21,
        tax_amount: 210,
        total_amount: 1210
    };

    const handleGetInvoices = async () => {
        console.log("🔍 Solicitando lista de facturas...");
        try {
            const result = await getInvoices();
            console.log("📋 Facturas obtenidas:", result);
            setInvoices(result);
        } catch (error) {
            console.error("❌ Error al obtener facturas:", error);
        }
    };

    const handleCreateInvoice = async () => {
        console.log("📝 Creando factura de prueba...");
        try {
            const result = await addInvoice(sampleInvoice);
            console.log("✅ Factura creada:", result);
            handleGetInvoices(); // Actualizamos la lista
        } catch (error) {
            console.error("❌ Error al crear factura:", error);
        }
    };

    const handleUpdateInvoice = async () => {
        if (invoices.length === 0) {
            console.log("⚠️ No hay facturas para actualizar");
            return;
        }
        const invoiceToUpdate = invoices[0];
        console.log("📝 Actualizando primera factura...");
        try {
            const result = await updateInvoice(invoiceToUpdate.id, {
                status: 'paid'
            });
            console.log("✅ Factura actualizada:", result);
            handleGetInvoices(); // Actualizamos la lista
        } catch (error) {
            console.error("❌ Error al actualizar factura:", error);
        }
    };

    const handleDeleteInvoice = async () => {
        if (invoices.length === 0) {
            console.log("⚠️ No hay facturas para eliminar");
            return;
        }
        const invoiceToDelete = invoices[0];
        console.log("🗑️ Eliminando primera factura...");
        try {
            await deleteInvoice(invoiceToDelete.id);
            console.log("✅ Factura eliminada");
            handleGetInvoices(); // Actualizamos la lista
        } catch (error) {
            console.error("❌ Error al eliminar factura:", error);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            {user && <p className="mb-4">Bienvenido, {user.email}</p>}
            
            <div className="space-x-4 mb-8">
                <button onClick={handleGetInvoices} className="bg-blue-500 text-white px-4 py-2 rounded">
                    Listar Facturas
                </button>
                <button onClick={handleCreateInvoice} className="bg-green-500 text-white px-4 py-2 rounded">
                    Crear Factura
                </button>
                <button onClick={handleUpdateInvoice} className="bg-yellow-500 text-white px-4 py-2 rounded">
                    Actualizar Primera Factura
                </button>
                <button onClick={handleDeleteInvoice} className="bg-red-500 text-white px-4 py-2 rounded">
                    Eliminar Primera Factura
                </button>
            </div>

            <div className="mt-4">
                <h2 className="text-xl font-semibold mb-2">Facturas ({invoices.length})</h2>
                <pre className="bg-gray-100 p-4 rounded">
                    {JSON.stringify(invoices, null, 2)}
                </pre>
            </div>
        </div>
    );
}
