"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Search, Download, Building2 } from "lucide-react"
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
import { getInvoices, updateInvoice, deleteInvoice, addInvoice } from "@/app/routes/invoices/route"
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

const getStatusColor = (status: Invoice["status"]) => {
  switch (status) {
    case "final":
      return "bg-green-100 text-green-800"
    case "submitted":
      return "bg-blue-100 text-blue-800"
    default:
      return "bg-yellow-100 text-yellow-800"
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

  // Load invoices and clients on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
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

  // Handle invoice edit
  const handleEditInvoice = async (invoice: Invoice) => {
    if (invoice.status !== "draft") {
      toast.error("Solo se pueden editar facturas en estado borrador")
      return
    }
    setCurrentInvoice(invoice)
    setIsEditDialogOpen(true)
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

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Facturas</h2>
          <p className="text-muted-foreground">Gestiona tus facturas y su información</p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nueva Factura
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nueva Factura</DialogTitle>
                <DialogDescription>Crea una nueva factura. Rellena los detalles a continuación.</DialogDescription>
              </DialogHeader>
              <InvoiceForm onSubmit={handleCreateInvoice} onCancel={() => setIsCreateDialogOpen(false)} />
            </DialogContent>
          </Dialog>
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
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    No se encontraron facturas.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                    <TableCell>{getClientName(invoice.client_id)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(invoice.subtotal)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(invoice.tax_amount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(invoice.irpf_amount)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(invoice.total_amount)}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={getStatusColor(invoice.status)}>{getStatusText(invoice.status)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {invoice.pdf_url && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={invoice.pdf_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                              <span className="sr-only">Descargar PDF</span>
                            </a>
                          </Button>
                        )}
                        {invoice.status === "draft" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditInvoice(invoice)}
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

      {/* Edit Invoice Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Factura</DialogTitle>
            <DialogDescription>Modifica los detalles de la factura a continuación.</DialogDescription>
          </DialogHeader>
          {currentInvoice && (
            <InvoiceForm
              invoice={currentInvoice}
              onSubmit={(updatedInvoice) => handleEditInvoice({ ...updatedInvoice, id: currentInvoice.id, user_id: currentInvoice.user_id })}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Factura</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar la factura {currentInvoice?.invoice_number}? Esta acción no se puede
              deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => currentInvoice && handleDeleteConfirmation(currentInvoice)}>
              Eliminar Factura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

