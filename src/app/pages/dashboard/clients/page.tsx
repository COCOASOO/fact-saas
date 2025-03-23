"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Search, Building2, Mail, Phone } from "lucide-react"
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
import { ClientForm } from "@/components/forms/ClientForm"
import { getClients, addClient, updateClient, deleteClient } from "@/app/routes/clients/route"
import { Client, CreateClientDTO, UpdateClientDTO } from "@/app/routes/clients/route"
import { getCompanies } from "@/app/routes/companies/route"
import type { Company } from "@/app/routes/companies/route"
import { Skeleton } from "@/components/ui/skeleton"

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentClient, setCurrentClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [isMobileView, setIsMobileView] = useState(false)

  const loadClients = async () => {
    try {
      setIsLoading(true)
      const [clientsData, companiesData] = await Promise.all([
        getClients(),
        getCompanies()
      ])
      setClients(clientsData)
      setCompanies(companiesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768)
    }
    
    handleResize()
    
    window.addEventListener('resize', handleResize)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Filter clients based on search query
  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.email?.toLowerCase() ?? '').includes(searchQuery.toLowerCase()) ||
      client.nif.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Handle client creation
  const handleCreateClient = async (newClient: Client) => {
    try {
      const clientData: CreateClientDTO = {
        company_id: newClient.company_id,
        name: newClient.name,
        nif: newClient.nif,
        address: newClient.address,
        city: newClient.city,
        postcode: newClient.postcode,
        country: newClient.country,
        email: newClient.email,
        phone: newClient.phone,
        applies_irpf: newClient.applies_irpf
      }
      await addClient(clientData)
      await loadClients() // Recargar la lista
      setIsCreateDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el cliente')
    }
  }

  // Handle client edit
  const handleEditClient = async (updatedClient: Client) => {
    try {
      const clientData: UpdateClientDTO = {
        name: updatedClient.name,
        nif: updatedClient.nif,
        address: updatedClient.address,
        city: updatedClient.city,
        postcode: updatedClient.postcode,
        country: updatedClient.country,
        email: updatedClient.email,
        phone: updatedClient.phone,
        applies_irpf: updatedClient.applies_irpf
      }
      await updateClient(updatedClient.id, clientData)
      await loadClients() // Recargar la lista
      setIsEditDialogOpen(false)
      setCurrentClient(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el cliente')
    }
  }

  // Handle client deletion
  const handleDeleteClient = async (id: string) => {
    try {
      await deleteClient(id)
      await loadClients() // Recargar la lista
      setIsDeleteDialogOpen(false)
      setCurrentClient(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el cliente')
    }
  }

  // Open edit dialog with client data
  const openEditDialog = (client: Client) => {
    setCurrentClient(client)
    setIsEditDialogOpen(true)
  }

  // Open delete confirmation dialog
  const openDeleteDialog = (client: Client) => {
    setCurrentClient(client)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="h-full flex-1 flex-col space-y-6 p-4 sm:p-6 md:p-8">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Clientes</h2>
          <p className="text-muted-foreground text-sm">Gestiona la información y detalles de tus clientes</p>
        </div>
        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" /> Añadir Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Cliente</DialogTitle>
                <DialogDescription>
                  Añade un nuevo cliente a tu organización. Rellena los detalles a continuación.
                </DialogDescription>
              </DialogHeader>
              <ClientForm onSubmit={handleCreateClient} onCancel={() => setIsCreateDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {isMobileView ? (
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={`skeleton-card-${index}`} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-[180px]" />
                    <div className="flex space-x-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-[120px]" />
                      <Skeleton className="h-6 w-12" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))
            ) : filteredClients.length === 0 ? (
              <div className="border rounded-lg p-6 text-center">
                No se encontraron clientes.
              </div>
            ) : (
              filteredClients.map((client) => {
                const company = companies.find(company => company.id === client.company_id);
                return (
                  <div key={client.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="mr-2 overflow-hidden">
                        <h3 className="font-medium text-lg truncate">{client.name}</h3>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Building2 className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{client.nif}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(client)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-500"
                          onClick={() => openDeleteDialog(client)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1 max-w-[60%]">
                          <div className="text-sm font-medium">Empresa</div>
                          <div className="text-sm truncate">{company?.name || 'N/A'}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">IRPF</div>
                          <Badge variant={client.applies_irpf ? "default" : "secondary"}>
                            {client.applies_irpf ? "Sí" : "No"}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Contacto</div>
                        <div className="text-sm flex items-center gap-1 break-all">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          {client.email || 'N/A'}
                        </div>
                        <div className="text-sm flex items-center gap-1">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          {client.phone || 'N/A'}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Ubicación</div>
                        <div className="text-sm">{client.city}, {client.country}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="min-w-[200px]">Detalles del Cliente</TableHead>
                  <TableHead className="min-w-[150px]">Empresa</TableHead>
                  <TableHead className="min-w-[150px]">Contacto</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[200px]">Ubicación</TableHead>
                  <TableHead className="w-[80px] text-center">IRPF</TableHead>
                  <TableHead className="w-[90px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Skeleton loader para la tabla
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Skeleton className="h-5 w-[180px]" />
                          <Skeleton className="h-4 w-[120px]" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Skeleton className="h-5 w-[150px]" />
                          <Skeleton className="h-4 w-[100px]" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Skeleton className="h-4 w-[180px]" />
                          <Skeleton className="h-4 w-[120px]" />
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-col gap-1">
                          <Skeleton className="h-4 w-[200px]" />
                          <Skeleton className="h-4 w-[150px]" />
                          <Skeleton className="h-4 w-[80px]" />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Skeleton className="h-6 w-12 mx-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No se encontraron clientes.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => {
                    const company = companies.find(company => company.id === client.company_id);
                    return (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="font-medium">{client.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Building2 className="h-3 w-3" />
                              {client.nif}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="font-medium">
                              {company?.name || 'N/A'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {company?.nif || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="text-sm flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              {client.email}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              {client.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-col">
                            <span className="text-sm">{client.address}</span>
                            <span className="text-sm text-muted-foreground">
                              {client.city}, {client.postcode}
                            </span>
                            <span className="text-sm text-muted-foreground">{client.country}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={client.applies_irpf ? "default" : "secondary"}>
                            {client.applies_irpf ? "Sí" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(client)}>
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-500"
                              onClick={() => openDeleteDialog(client)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Edit Client Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>Actualiza la información del cliente a continuación.</DialogDescription>
          </DialogHeader>
          {currentClient && (
            <ClientForm
              client={currentClient}
              onSubmit={handleEditClient}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Cliente</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar a {currentClient?.name}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => currentClient && handleDeleteClient(currentClient.id)}>
              Eliminar Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

