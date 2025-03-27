"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, Pencil, Trash2, Search, Download, Building2, Check, CheckCircle, FileCheck, FileEdit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { InvoiceForm } from "@/components/forms/InvoiceForm"
import type { Invoice } from "@/app/types/invoice"
import { formatCurrency, formatDate } from "@/app/utils/invoice-calculations"
import { getInvoices, updateInvoice, deleteInvoice, addInvoice, updateInvoiceStatus, getInvoiceById } from "@/app/routes/invoices/route"
import { getClients } from "@/app/utils/clients"
import { Client } from "@/app/types/client"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getInvoiceSeries, getNextInvoiceNumber } from "@/app/utils/invoice_series"
import type { InvoiceSeries } from "@/app/types/invoice-series"
import { InvoicePopupManager } from "@/components/invoicePDF/InvoicePopupManager"
import { Skeleton } from "@/components/ui/skeleton"
import { PDFGenerator } from '@/components/invoicePDF/pdfService'
import React from "react"

const getStatusColor = (status: Invoice["status"]) => {
  switch (status) {
    case "final":
      return "bg-green-100 text-green-800 border-green-200"
    case "submitted":
      return "bg-blue-100 text-blue-800 border-blue-200"
    default:
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
  }
}

const getStatusText = (status: Invoice["status"]) => {
  switch (status) {
    case "final":
      return "Definitiva"
    case "submitted":
      return "Presentada"
    default:
      return "Borrador"
  }
}

const getStatusIcon = (status: Invoice["status"]) => {
  switch (status) {
    case "final":
      return <CheckCircle className="h-3 w-3 mr-1" />
    case "submitted":
      return <FileCheck className="h-3 w-3 mr-1" />
    default:
      return <FileEdit className="h-3 w-3 mr-1" />
  }
}

async function uploadPDF(formData: FormData): Promise<string> {
  // Esta es una implementación temporal, deberías reemplazarla
  // con tu lógica real para subir archivos a tu storage
  console.log("Simulando subida de PDF...");
  
  // Aquí iría tu código para subir el PDF a un servicio de almacenamiento
  // Ejemplo: supabase, firebase, o tu propio servidor
  
  // Por ahora, simular con un timeout y devolver una URL ficticia
  return new Promise((resolve) => {
    setTimeout(() => {
      // En un entorno real, aquí devolverías la URL real del PDF subido
      resolve(`https://tudominio.com/storage/invoices/factura-${Date.now()}.pdf`);
    }, 1000);
  });
}

// Función para mostrar el número de factura limpio en la UI
const getDisplayInvoiceNumber = (invoiceNumber: string) => {
  if (invoiceNumber?.startsWith('BORRADOR-')) {
    // Devolver un diseño apilado verticalmente para ahorrar espacio horizontal
    return (
      <div className="flex flex-col">
        <span className="text-amber-600 text-xs font-semibold bg-amber-50 px-1 rounded self-start mb-1">
          BORRADOR
        </span>
        <span className="font-medium">
          {invoiceNumber.replace('BORRADOR-', '')}
        </span>
      </div>
    );
  }
  return <span className="font-medium">{invoiceNumber}</span>;
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSeries, setSelectedSeries] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<Invoice["status"] | "all">("all")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null)
  const [invoiceSeries, setInvoiceSeries] = useState<InvoiceSeries[]>([])
  const [isFinalizarDialogOpen, setIsFinalizarDialogOpen] = useState(false)
  const [invoiceToFinalize, setInvoiceToFinalize] = useState<Invoice | null>(null)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [invoiceFormData, setInvoiceFormData] = useState<Omit<Invoice, 'id' | 'user_id'>>()
  const [selectedInvoiceForEdit, setSelectedInvoiceForEdit] = useState<Invoice | null>(null)
  const invoicePopupManagerRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileView, setIsMobileView] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        const [invoicesData, clientsData, seriesData] = await Promise.all([
          getInvoices(),
          getClients(),
          getInvoiceSeries()
        ])
        setInvoices(invoicesData)
        setClients(clientsData)
        setInvoiceSeries(seriesData)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const activeSeries = invoiceSeries.filter(series => series.last_invoice_number !== null)

  const filteredInvoices = invoices
    .filter((invoice) => {
      const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSeries = selectedSeries === "all" || invoice.series_id === selectedSeries
      const matchesStatus = selectedStatus === "all" || invoice.status === selectedStatus
      return matchesSearch && matchesSeries && matchesStatus
    })
    .sort((a, b) => {
      const comparison = a.invoice_number.localeCompare(b.invoice_number)
      return sortDirection === "asc" ? comparison : -comparison
    })

  const handleCreateInvoice = async (newInvoice: Omit<Invoice, 'id' | 'user_id'>) => {
    try {
      const createdInvoice = await addInvoice(newInvoice)
      setInvoices([...invoices, createdInvoice])
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error("Error creating invoice:", error)
    }
  }

  const handleEditClick = (invoice: Invoice) => {
    setSelectedInvoiceForEdit(invoice)
    setTimeout(() => {
      if (invoicePopupManagerRef.current) {
        invoicePopupManagerRef.current.openPopup(invoice)
      }
    }, 0)
  }

  const handleDeleteConfirmation = async (invoice: Invoice) => {
    try {
      await deleteInvoice(invoice.id)
      setInvoices(invoices.filter(i => i.id !== invoice.id))
      setIsDeleteDialogOpen(false)
      toast.success("Factura eliminada correctamente")
    } catch (error) {
      console.error("Error deleting invoice:", error)
      toast.error("Error al eliminar la factura")
    }
  }

  const handleDeleteClick = (invoice: Invoice) => {
    if (invoice.status !== "draft") {
      toast.error("Solo se pueden eliminar facturas en estado borrador")
      return
    }
    setCurrentInvoice(invoice)
    setIsDeleteDialogOpen(true)
  }

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    return client?.name || 'Cliente no disponible'
  }

  const handleFinalizarInvoice = (invoice: Invoice) => {
    if (invoice.status !== "draft") {
      toast.error("Solo facturas en borrador pueden ser finalizadas")
      return
    }
    setInvoiceToFinalize(invoice)
    setIsFinalizarDialogOpen(true)
  }

  const handleFinalizarConfirmation = async () => {
    if (!invoiceToFinalize) return;
    
    try {
      await updateInvoiceStatus(invoiceToFinalize.id, "final");
      const updatedInvoices = await getInvoices();
      setInvoices(updatedInvoices);
      setIsFinalizarDialogOpen(false);
      toast.success("Factura finalizada correctamente");
    } catch (error) {
      console.error("Error al finalizar la factura:", error);
      toast.error(`Error al finalizar la factura: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const refreshInvoices = async () => {
    try {
      const invoicesData = await getInvoices();
      setInvoices(invoicesData);
    } catch (error) {
      console.error("Error loading invoices:", error);
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      toast.loading('Descargando PDF...');
      
      if (invoice.pdf_url) {
        await PDFGenerator.downloadFromURL(invoice);
        toast.dismiss();
        toast.success('PDF descargado correctamente');
        return;
      }
      
      toast.dismiss();
      toast.error('Esta factura no tiene PDF guardado. Por favor, edite la factura para generarlo.');
    } catch (error) {
      console.error('Error al descargar el PDF:', error);
      toast.dismiss();
      toast.error('Error al descargar el PDF');
    }
  };

  return (
    <>
      {isMobileView ? (
        <div className="space-y-4">
          <div className="flex flex-col space-y-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Facturas</h2>
              <p className="text-muted-foreground text-sm">Gestiona tus facturas y su información</p>
            </div>

            <Button 
              onClick={() => invoicePopupManagerRef.current?.openPopup()} 
              className="w-full bg-black text-white hover:bg-gray-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Factura
            </Button>
          </div>

          <div className="space-y-2">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar facturas..."
                className="pl-8 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Select
                value={selectedSeries}
                onValueChange={setSelectedSeries}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Serie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las series</SelectItem>
                  {activeSeries.map(series => (
                    <SelectItem key={series.id} value={series.id}>
                      {series.serie_format}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedStatus}
                onValueChange={(value) => setSelectedStatus(value as Invoice["status"] | "all")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="submitted">Presentada</SelectItem>
                  <SelectItem value="final">Definitiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              ))
            ) : filteredInvoices.length === 0 ? (
              <div className="border rounded-lg p-8 text-center text-muted-foreground">
                No se encontraron facturas.
              </div>
            ) : (
              filteredInvoices.map((invoice) => (
                <div key={invoice.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="font-medium">
                      {getDisplayInvoiceNumber(invoice.invoice_number)}
                    </div>
                    
                    <div className="flex space-x-1">
                      {invoice.status === "final" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleDownloadPDF(invoice)}
                        >
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Descargar PDF</span>
                        </Button>
                      )}
                      
                      {invoice.status === "draft" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditClick(invoice)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500"
                            onClick={() => handleDeleteClick(invoice)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-green-500"
                            onClick={() => handleFinalizarInvoice(invoice)}
                          >
                            <Check className="h-4 w-4" />
                            <span className="sr-only">Finalizar</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-sm text-muted-foreground">
                      {formatDate(invoice.invoice_date)}
                    </div>
                    <Badge className={`text-xs ${getStatusColor(invoice.status)}`}>
                      {getStatusIcon(invoice.status)}
                      {getStatusText(invoice.status)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <Building2 className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    {getClientName(invoice.client_id)}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total:</span>
                    <span className="font-medium">{formatCurrency(invoice.total_amount)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="h-full flex-1 flex-col space-y-6 p-4 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Facturas</h2>
              <p className="text-muted-foreground text-sm">Gestiona tus facturas y su información</p>
            </div>
            <div className="flex items-center mt-2 sm:mt-0">
              <InvoicePopupManager 
                ref={invoicePopupManagerRef}
                onSuccess={refreshInvoices} 
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-wrap">
              <div className="relative flex-1 w-full max-w-full sm:max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar facturas..."
                  className="pl-8 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Select
                  value={selectedSeries}
                  onValueChange={setSelectedSeries}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Seleccionar serie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las series</SelectItem>
                    {activeSeries.map(series => (
                      <SelectItem key={series.id} value={series.id}>
                        {series.serie_format}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedStatus}
                  onValueChange={(value) => setSelectedStatus(value as Invoice["status"] | "all")}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="submitted">Presentada</SelectItem>
                    <SelectItem value="final">Definitiva</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortDirection(prev => prev === "asc" ? "desc" : "asc")}
                  className="shrink-0"
                >
                  {sortDirection === "asc" ? "↑" : "↓"}
                </Button>
              </div>
            </div>

            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Factura</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Base imponible</TableHead>
                    <TableHead className="text-right">IVA</TableHead>
                    <TableHead className="text-right">IRPF</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={`skeleton-${index}`}>
                        <TableCell>
                          <Skeleton className="h-6 w-[100px]" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-[80px]" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-[120px]" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-[80px] ml-auto" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-[80px] ml-auto" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-[80px] ml-auto" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-[80px] ml-auto" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-[100px]" />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-8 w-8 rounded-full" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center">
                        No se encontraron facturas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="min-w-[140px]">
                          {getDisplayInvoiceNumber(invoice.invoice_number)}
                        </TableCell>
                        <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                        <TableCell>{getClientName(invoice.client_id)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(invoice.subtotal)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(invoice.tax_amount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(invoice.irpf_amount)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(invoice.total_amount)}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={`flex items-center justify-center ${getStatusColor(invoice.status)}`}>
                            {getStatusIcon(invoice.status)}
                            {getStatusText(invoice.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            {invoice.status === "final" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDownloadPDF(invoice)}
                              >
                                <Download className="h-4 w-4" />
                                <span className="sr-only">Descargar PDF</span>
                              </Button>
                            )}
                            
                            {invoice.status === "draft" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditClick(invoice)}
                                >
                                  <Pencil className="h-4 w-4" />
                                  <span className="sr-only">Editar</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-500 hover:text-red-500"
                                  onClick={() => handleDeleteClick(invoice)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Eliminar</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-green-500 hover:text-green-500"
                                  onClick={() => handleFinalizarInvoice(invoice)}
                                >
                                  <Check className="h-4 w-4" />
                                  <span className="sr-only">Finalizar</span>
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la factura {currentInvoice?.invoice_number}?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => currentInvoice && handleDeleteConfirmation(currentInvoice)}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFinalizarDialogOpen} onOpenChange={setIsFinalizarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar finalización</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas finalizar la factura {invoiceToFinalize?.invoice_number}?
              Esta acción no se puede deshacer y la factura no podrá ser modificada después.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFinalizarDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="default" 
              className="bg-green-600 hover:bg-green-700"
              onClick={handleFinalizarConfirmation}
            >
              Finalizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

