"use client";

import { useAuth } from "@/app/contexts/authContext";
import { getCompanies, type Company } from "@/app/utils/companies";
import { getClients, type Client } from "@/app/utils/clients";
import { getInvoices} from "@/app/utils/invoices";
import { type Invoice } from "@/app/types/invoice";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  CircleAlert, 
  FileText, 
  Users, 
  Building, 
  CreditCard,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  ChevronRight,
  BarChart2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/app/utils/invoice-calculations";

export default function Dashboard() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const [companiesData, clientsData, invoicesData] = await Promise.all([
          getCompanies(),
          getClients(),
          getInvoices({})
        ]);
        
        setCompanies(companiesData);
        setClients(clientsData);
        setInvoices(invoicesData.invoices);
      } catch (error) {
        console.error("Error al cargar datos del dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Calcular estadísticas para mostrar
  const totalInvoices = invoices.length;
  const pendingInvoices = invoices.filter(inv => inv.status === "draft").length;
  const completedInvoices = invoices.filter(inv => inv.status === "final").length;
  
  // Calcular monto total de facturas
  const totalInvoiceAmount = invoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);
  
  // Obtener las facturas más recientes (limitadas a 5)
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime())
    .slice(0, 5);

  return (
    <div className="container p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        {user && (
          <p className="text-muted-foreground mt-2">
            Bienvenido, {user.email}. Aquí tienes un resumen de tu actividad.
          </p>
        )}
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        {/* Número de facturas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total de facturas
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{totalInvoices}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {pendingInvoices} pendientes · {completedInvoices} finalizadas
            </p>
          </CardContent>
        </Card>

        {/* Número de clientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Clientes activos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{clients.length}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Distribuidos en {companies.length} empresas
            </p>
          </CardContent>
        </Card>

        {/* Cobros pendientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total facturado
            </CardTitle>
            <CircleAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(totalInvoiceAmount)}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {pendingInvoices} facturas pendientes
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1 mb-8">
        {/* Facturas recientes */}
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Facturas recientes</CardTitle>
              <Link href="/pages/dashboard/invoices">
                <Button variant="ghost" size="sm" className="gap-1">
                  Ver todas <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="ml-auto">
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mb-2 opacity-20" />
                <p>No hay facturas recientes</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentInvoices.map((invoice) => {
                  const client = clients.find(c => c.id === invoice.client_id);
                  return (
                    <div key={invoice.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center 
                          ${invoice.status === 'draft' ? 'bg-amber-100' : 
                            invoice.status === 'final' ? 'bg-green-100' : 'bg-blue-100'}`}>
                          {invoice.status === 'draft' ? 
                            <Clock className="h-5 w-5 text-amber-600" /> : 
                            invoice.status === 'final' ? 
                            <CheckCircle className="h-5 w-5 text-green-600" /> : 
                            <Calendar className="h-5 w-5 text-blue-600" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{invoice.invoice_number}</p>
                          <p className="text-xs text-muted-foreground">{client?.name || 'Cliente desconocido'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(invoice.total_amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(invoice.invoice_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Link href="/pages/dashboard/invoices" className="w-full">
              <Button variant="outline" className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                Ir a facturas
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Accesos rápidos */}
      <Card>
        <CardHeader>
          <CardTitle>Accesos rápidos</CardTitle>
          <CardDescription>
            Gestiona rápidamente los aspectos clave de tu negocio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/pages/dashboard/clients">
              <Card className="cursor-pointer hover:bg-accent/10 transition-colors">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <Users className="h-6 w-6 mb-3 text-indigo-500" />
                  <h3 className="font-medium">Clientes</h3>
                  <p className="text-sm text-muted-foreground">
                    Gestionar {clients.length} clientes
                  </p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/pages/dashboard/companies">
              <Card className="cursor-pointer hover:bg-accent/10 transition-colors">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <Building className="h-6 w-6 mb-3 text-emerald-500" />
                  <h3 className="font-medium">Empresas</h3>
                  <p className="text-sm text-muted-foreground">
                    Gestionar {companies.length} empresas
                  </p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/pages/dashboard/invoices">
              <Card className="cursor-pointer hover:bg-accent/10 transition-colors">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <FileText className="h-6 w-6 mb-3 text-blue-500" />
                  <h3 className="font-medium">Facturas</h3>
                  <p className="text-sm text-muted-foreground">
                    Crear y gestionar facturas
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
