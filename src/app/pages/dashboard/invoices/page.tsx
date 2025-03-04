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

const getStatusColor = (status: Invoice["status"]) => {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-800"
    case "pending":
      return "bg-yellow-100 text-yellow-800"
    case "cancelled":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getStatusText = (status: Invoice["status"]) => {
  switch (status) {
    case "paid":
      return "Pagada"
    case "pending":
      return "Pendiente"
    case "cancelled":
      return "Cancelada"
    default:
      return "Borrador"
  }
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null)

  // Load invoices and clients on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [invoicesData, clientsData] = await Promise.all([
          getInvoices(),
          getClients()
        ])
        setInvoices(invoicesData)
        setClients(clientsData)
      } catch (error) {
        console.error("Error loading data:", error)
      }
    }
    loadData()
  }, [])

  // Filter invoices based on search query
  const filteredInvoices = invoices.filter((invoice) =>
    invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
  const handleEditInvoice = async (updatedInvoice: Omit<Invoice, 'id' | 'user_id'>) => {
    if (!currentInvoice) return;
    
    try {
      // Aseguramos que los valores numéricos estén redondeados a 2 decimales
      const roundedInvoice = {
        ...updatedInvoice,
        subtotal: Number(updatedInvoice.subtotal.toFixed(2)),
        tax_amount: Number(updatedInvoice.tax_amount.toFixed(2)),
        irpf_amount: Number(updatedInvoice.irpf_amount.toFixed(2)),
        total_amount: Number(updatedInvoice.total_amount.toFixed(2)),
        tax_rate: Number(updatedInvoice.tax_rate.toFixed(2)),
        irpf_rate: Number(updatedInvoice.irpf_rate.toFixed(2))
      };

      // Eliminamos campos virtuales y datos adicionales no necesarios
      const { client, company, clients, ...cleanInvoiceData } = roundedInvoice as any;

      const updated = await updateInvoice(currentInvoice.id, {
        ...currentInvoice,
        ...cleanInvoiceData,
        updated_at: new Date().toISOString()
      });

      setInvoices(invoices.map((invoice) => 
        invoice.id === updated.id ? updated : invoice
      ));
      setIsEditDialogOpen(false);
      setCurrentInvoice(null);
    } catch (error) {
      console.error("Error updating invoice:", error)
      // Here you might want to show an error message to the user
    }
  }

  // Handle invoice deletion
  const handleDeleteInvoice = async (id: string) => {
    try {
      await deleteInvoice(id)
      setInvoices(invoices.filter((invoice) => invoice.id !== id))
      setIsDeleteDialogOpen(false)
      setCurrentInvoice(null)
    } catch (error) {
      console.error("Error deleting invoice:", error)
      // Here you might want to show an error message to the user
    }
  }

  // Obtener el cliente para una factura
  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Cliente no disponible';
  };

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
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar facturas..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setCurrentInvoice(invoice)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-500"
                          onClick={() => {
                            setCurrentInvoice(invoice)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
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
              onSubmit={handleEditInvoice}
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
            <Button variant="destructive" onClick={() => currentInvoice && handleDeleteInvoice(currentInvoice.id)}>
              Eliminar Factura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

