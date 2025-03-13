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
import { formatCurrency, formatDate } from "@/lib/utils/invoice-calculations"
import { getInvoices, updateInvoice, deleteInvoice, addInvoice, updateInvoiceStatus, getInvoiceById } from "@/app/routes/invoices/route"
import { getClients } from "@/app/routes/clients/route"
import { Client } from "@/app/types/client"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getInvoiceSeries } from "@/app/routes/invoice_series/route"
import type { InvoiceSeries } from "@/app/types/invoice-series"
import { InvoicePopupManager } from "@/components/invoicePDF/InvoicePopupManager"
import { Skeleton } from "@/components/ui/skeleton"
import { PDFGenerator } from '@/components/invoicePDF/pdfService'
import React from "react"
import { generatePDF } from '@/components/invoicePDF/InvoicePreviewWrapper'

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

  // Load invoices and clients on component mount
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

  // Filtrar las series que tienen facturas
  const activeSeries = invoiceSeries.filter(series => series.last_invoice_number !== null)

  // Filter and sort invoices
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

  // Handle invoice creation
  const handleCreateInvoice = async (newInvoice: Omit<Invoice, 'id' | 'user_id'>) => {
    try {
      const createdInvoice = await addInvoice(newInvoice)
      setInvoices([...invoices, createdInvoice])
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error("Error creating invoice:", error)
      // Here you might want to show an error message to the user
    }
  }

  // Handle edit button click - now directly opens the popup
  const handleEditClick = (invoice: Invoice) => {
    // Set the invoice to edit and then open the popup directly
    setSelectedInvoiceForEdit(invoice)
    // Use a small timeout to ensure the state is updated before we try to open the popup
    setTimeout(() => {
      if (invoicePopupManagerRef.current) {
        invoicePopupManagerRef.current.openPopup(invoice)
      }
    }, 0)
  }

  // Handle invoice deletion confirmation
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

  // Handle delete button click (opens dialog)
  const handleDeleteClick = (invoice: Invoice) => {
    if (invoice.status !== "draft") {
      toast.error("Solo se pueden eliminar facturas en estado borrador")
      return
    }
    setCurrentInvoice(invoice)
    setIsDeleteDialogOpen(true)
  }

  // Obtener el cliente para una factura
  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    return client?.name || 'Cliente no disponible'
  }

  // Handle finalizar invoice (this opens the dialog)
  const handleFinalizarInvoice = (invoice: Invoice) => {
    if (invoice.status !== "draft") {
      toast.error("Solo facturas en borrador pueden ser finalizadas")
      return
    }
    setInvoiceToFinalize(invoice)
    setIsFinalizarDialogOpen(true)
  }

  // Add this new function to handle the actual finalization
  const handleFinalizarConfirmation = async () => {
    if (!invoiceToFinalize) return
    
    try {
      const updatedInvoice = await updateInvoiceStatus(invoiceToFinalize.id, "final")
      // Update the invoice in the list
      setInvoices(invoices.map(inv => 
        inv.id === updatedInvoice.id ? updatedInvoice : inv
      ))
      toast.success("Factura finalizada correctamente")
      setIsFinalizarDialogOpen(false)
    } catch (error) {
      console.error("Error al finalizar la factura:", error)
      toast.error("Error al finalizar la factura")
    }
  }

  // Reemplazar función handleNewInvoice y isCreateDialogOpen
  const refreshInvoices = async () => {
    try {
      const invoicesData = await getInvoices();
      setInvoices(invoicesData);
    } catch (error) {
      console.error("Error loading invoices:", error);
    }
  };

  // Add this function to handle PDF download
  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      toast.loading('Descargando PDF...');
      
      // Si la factura ya tiene URL de PDF, descargar directamente
      if (invoice.pdf_url) {
        await PDFGenerator.downloadFromURL(invoice);
        toast.dismiss();
        toast.success('PDF descargado correctamente');
        return;
      }
      
      // Si no tiene PDF, mostrar mensaje al usuario
      toast.dismiss();
      toast.error('Esta factura no tiene PDF guardado. Por favor, edite la factura para generarlo.');
    } catch (error) {
      console.error('Error al descargar el PDF:', error);
      toast.dismiss();
      toast.error('Error al descargar el PDF');
    }
  };

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Facturas</h2>
          <p className="text-muted-foreground">Gestiona tus facturas y su información</p>
        </div>
        <div className="flex items-center space-x-2">
          <InvoicePopupManager 
            ref={invoicePopupManagerRef}
            onSuccess={refreshInvoices} 
          />
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar facturas..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select
            value={selectedSeries}
            onValueChange={setSelectedSeries}
          >
            <SelectTrigger className="w-[180px]">
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
            <SelectTrigger className="w-[180px]">
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
          >
            {sortDirection === "asc" ? "↑" : "↓"}
          </Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[150px]">Número</TableHead>
                <TableHead className="w-[120px]">Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Base</TableHead>
                <TableHead className="text-right">IVA</TableHead>
                <TableHead className="text-right">IRPF</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[100px] text-center">Estado</TableHead>
                <TableHead className="w-[100px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Skeleton loader mientras se cargan los datos
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell>
                      <Skeleton className="h-5 w-[80px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-[100px]" />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Skeleton className="h-5 w-[180px]" />
                        <Skeleton className="h-4 w-[120px]" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
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
                        {/* Show download button for final invoices */}
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
                        
                        {/* Show edit/delete/finalize buttons only for drafts */}
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

      {/* Delete confirmation dialog */}
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

      {/* Add Finalizar confirmation dialog */}
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
    </div>
  )
}

