"use client";

import { useAuth } from "@/app/contexts/authContext";
import { getCompanies, addCompany, updateCompany, deleteCompany, getCompanyById, type Company } from "@/app/routes/companies/route";
import { getClients, addClient, updateClient, deleteClient, getClientById, type Client } from "@/app/routes/clients/route";
import { getPayments, addPayment, getPaymentById, type Payment } from "@/app/routes/payments/route";
import { getVerifactuLogs, addVerifactuLog, type VerifactuLog } from "@/app/routes/verifactu_logs/route";
import { getUsers, getUserById, getCurrentUser, type User } from "@/app/routes/users/route";
import { useState } from "react";

export default function Dashboard() {
    const {user} = useAuth();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [logs, setLogs] = useState<VerifactuLog[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // Datos de prueba para crear una empresa
    const sampleCompany = {
        name: `Empresa Prueba ${Math.floor(Math.random() * 1000)}`,
        nif: `B${Math.floor(Math.random() * 100000000)}`,
        country: "ESP",
        email: "test@example.com"
    };

    // Datos de prueba para crear un cliente
    const sampleClient = {
        company_id: "b25dc479-ba38-44b6-a4cb-34dfda642ef9", // Asegúrate de usar un ID válido
        name: `Cliente Prueba ${Math.floor(Math.random() * 1000)}`,
        nif: `B${Math.floor(Math.random() * 100000000)}`,
        country: "ESP",
        applies_irpf: true
    };

    // Datos de prueba para crear un pago
    const samplePayment = {
        invoice_id: "19be3e74-a043-4755-a458-71bec95710cd", // Asegúrate de usar un ID válido
        amount: Math.floor(Math.random() * 1000) + 100,
        payment_method: 'card' as const,
        status: 'completed' as const,
    };

    // Datos de prueba para crear un log
    const sampleLog = {
        invoice_id: "19be3e74-a043-4755-a458-71bec95710cd", // Asegúrate de usar un ID válido
        request_payload: {
            test: true,
            timestamp: new Date().toISOString(),
            data: `Test data ${Math.floor(Math.random() * 1000)}`
        }
    };

    // Manejadores para Companies
    const handleGetCompanies = async () => {
        try {
            const result = await getCompanies();
            setCompanies(result);
        } catch (error) {
            console.error("Error al obtener empresas:", error);
        }
    };

    const handleCreateCompany = async () => {
        try {
            const result = await addCompany(sampleCompany);
            handleGetCompanies();
        } catch (error) {
            console.error("Error al crear empresa:", error);
        }
    };

    const handleUpdateCompany = async () => {
        if (companies.length === 0) return;
        try {
            const result = await updateCompany(companies[0].id, {
                name: `Empresa Actualizada ${Math.floor(Math.random() * 1000)}`
            });
            handleGetCompanies();
        } catch (error) {
            console.error("Error al actualizar empresa:", error);
        }
    };

    const handleDeleteCompany = async () => {
        if (companies.length === 0) return;
        try {
            await deleteCompany(companies[0].id);
            handleGetCompanies();
        } catch (error) {
            console.error("Error al eliminar empresa:", error);
        }
    };

    // Manejadores para Clients
    const handleGetClients = async () => {
        try {
            const result = await getClients();
            setClients(result);
        } catch (error) {
            console.error("Error al obtener clientes:", error);
        }
    };

    const handleCreateClient = async () => {
        try {
            const result = await addClient(sampleClient);
            handleGetClients();
        } catch (error) {
            console.error("Error al crear cliente:", error);
        }
    };

    const handleUpdateClient = async () => {
        if (clients.length === 0) return;
        try {
            const result = await updateClient(clients[0].id, {
                name: `Cliente Actualizado ${Math.floor(Math.random() * 1000)}`
            });
            handleGetClients();
        } catch (error) {
            console.error("Error al actualizar cliente:", error);
        }
    };

    const handleDeleteClient = async () => {
        if (clients.length === 0) return;
        try {
            await deleteClient(clients[0].id);
            handleGetClients();
        } catch (error) {
            console.error("Error al eliminar cliente:", error);
        }
    };

    // Manejadores para Payments
    const handleGetPayments = async () => {
        try {
            const result = await getPayments(samplePayment.invoice_id);
            setPayments(result);
        } catch (error) {
            console.error("Error al obtener pagos:", error);
        }
    };

    const handleCreatePayment = async () => {
        try {
            const result = await addPayment(samplePayment);
            handleGetPayments();
        } catch (error) {
            console.error("Error al crear pago:", error);
        }
    };

    // Manejadores para VerifactuLogs
    const handleGetLogs = async () => {
        try {
            const result = await getVerifactuLogs();
            setLogs(result);
        } catch (error) {
            console.error("Error al obtener logs:", error);
        }
    };

    const handleCreateLog = async () => {
        try {
            const result = await addVerifactuLog(sampleLog);
            handleGetLogs();
        } catch (error) {
            console.error("Error al crear log:", error);
        }
    };

    // Manejadores adicionales para Users
    const handleGetUsers = async () => {
        try {
            const result = await getUsers();
            setUsers(result);
        } catch (error) {
            console.error("Error al obtener usuarios:", error);
        }
    };

    const handleGetUserById = async () => {
        if (users.length === 0) return;
        try {
            const result = await getUserById(users[0].id);
            console.log("Usuario específico:", result);
        } catch (error) {
            console.error("Error al obtener usuario específico:", error);
        }
    };

    const handleGetCurrentUser = async () => {
        try {
            const result = await getCurrentUser();
            setCurrentUser(result);
        } catch (error) {
            console.error("Error al obtener usuario actual:", error);
        }
    };

    // Manejadores adicionales para Companies
    const handleGetCompanyById = async () => {
        if (companies.length === 0) return;
        try {
            const result = await getCompanyById(companies[0].id);
            console.log("Empresa específica:", result);
        } catch (error) {
            console.error("Error al obtener empresa específica:", error);
        }
    };

    // Manejadores adicionales para Clients
    const handleGetClientById = async () => {
        if (clients.length === 0) return;
        try {
            const result = await getClientById(clients[0].id);
            console.log("Cliente específico:", result);
        } catch (error) {
            console.error("Error al obtener cliente específico:", error);
        }
    };

    // Manejadores adicionales para Payments
    const handleGetPaymentById = async () => {
        if (payments.length === 0) return;
        try {
            const result = await getPaymentById(payments[0].id);
            console.log("Pago específico:", result);
        } catch (error) {
            console.error("Error al obtener pago específico:", error);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            {user && <p className="mb-4">Bienvenido, {user.email}</p>}
            
            {/* Users Section */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Usuarios</h2>
                <div className="space-x-4 mb-4">
                    <button onClick={handleGetUsers} className="bg-blue-500 text-white px-4 py-2 rounded">
                        Listar Usuarios
                    </button>
                    <button onClick={handleGetUserById} className="bg-blue-500 text-white px-4 py-2 rounded">
                        Obtener Usuario por ID
                    </button>
                    <button onClick={handleGetCurrentUser} className="bg-blue-500 text-white px-4 py-2 rounded">
                        Obtener Usuario Actual
                    </button>
                </div>
                <pre className="bg-gray-100 p-4 rounded">
                    {JSON.stringify(users, null, 2)}
                </pre>
                {currentUser && (
                    <div className="mt-4">
                        <h3 className="font-semibold">Usuario Actual:</h3>
                        <pre className="bg-gray-100 p-4 rounded">
                            {JSON.stringify(currentUser, null, 2)}
                        </pre>
                    </div>
                )}
            </div>

            {/* Companies Section */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Empresas</h2>
                <div className="space-x-4 mb-4">
                    <button onClick={handleGetCompanies} className="bg-blue-500 text-white px-4 py-2 rounded">
                        Listar Empresas
                    </button>
                    <button onClick={handleGetCompanyById} className="bg-blue-500 text-white px-4 py-2 rounded">
                        Obtener Empresa por ID
                    </button>
                    <button onClick={handleCreateCompany} className="bg-green-500 text-white px-4 py-2 rounded">
                        Crear Empresa
                    </button>
                    <button onClick={handleUpdateCompany} className="bg-yellow-500 text-white px-4 py-2 rounded">
                        Actualizar Primera Empresa
                    </button>
                    <button onClick={handleDeleteCompany} className="bg-red-500 text-white px-4 py-2 rounded">
                        Eliminar Primera Empresa
                    </button>
                </div>
                <pre className="bg-gray-100 p-4 rounded">
                    {JSON.stringify(companies, null, 2)}
                </pre>
            </div>

            {/* Clients Section */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Clientes</h2>
                <div className="space-x-4 mb-4">
                    <button onClick={handleGetClients} className="bg-blue-500 text-white px-4 py-2 rounded">
                        Listar Clientes
                    </button>
                    <button onClick={handleGetClientById} className="bg-blue-500 text-white px-4 py-2 rounded">
                        Obtener Cliente por ID
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
                <pre className="bg-gray-100 p-4 rounded">
                    {JSON.stringify(clients, null, 2)}
                </pre>
            </div>

            {/* Payments Section */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Pagos</h2>
                <div className="space-x-4 mb-4">
                    <button onClick={handleGetPayments} className="bg-blue-500 text-white px-4 py-2 rounded">
                        Listar Pagos
                    </button>
                    <button onClick={handleGetPaymentById} className="bg-blue-500 text-white px-4 py-2 rounded">
                        Obtener Pago por ID
                    </button>
                    <button onClick={handleCreatePayment} className="bg-green-500 text-white px-4 py-2 rounded">
                        Crear Pago
                    </button>
                </div>
                <pre className="bg-gray-100 p-4 rounded">
                    {JSON.stringify(payments, null, 2)}
                </pre>
            </div>

            {/* VerifactuLogs Section */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Logs de Verifactu</h2>
                <div className="space-x-4 mb-4">
                    <button onClick={handleGetLogs} className="bg-blue-500 text-white px-4 py-2 rounded">
                        Listar Logs
                    </button>
                    <button onClick={handleCreateLog} className="bg-green-500 text-white px-4 py-2 rounded">
                        Crear Log
                    </button>
                </div>
                <pre className="bg-gray-100 p-4 rounded">
                    {JSON.stringify(logs, null, 2)}
                </pre>
            </div>
        </div>
    );
}
