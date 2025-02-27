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
import { CompanyForm } from "@/components/forms/CompanyForm"
import { getCompanies, addCompany, updateCompany, deleteCompany } from "@/app/routes/companies/route"
import { Company, CreateCompanyDTO, UpdateCompanyDTO } from "@/app/routes/companies/route"

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    try {
      setIsLoading(true)
      const data = await getCompanies()
      setCompanies(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las empresas')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCompany = async (newCompany: Company) => {
    try {
      const companyData: CreateCompanyDTO = {
        name: newCompany.name,
        nif: newCompany.nif,
        address: newCompany.address,
        city: newCompany.city,
        postcode: newCompany.postcode,
        country: newCompany.country,
        email: newCompany.email,
        phone: newCompany.phone
      }
      await addCompany(companyData)
      await loadCompanies()
      setIsCreateDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la empresa')
    }
  }

  const handleEditCompany = async (updatedCompany: Company) => {
    try {
      const companyData: UpdateCompanyDTO = {
        name: updatedCompany.name,
        nif: updatedCompany.nif,
        address: updatedCompany.address,
        city: updatedCompany.city,
        postcode: updatedCompany.postcode,
        country: updatedCompany.country,
        email: updatedCompany.email,
        phone: updatedCompany.phone
      }
      await updateCompany(updatedCompany.id, companyData)
      await loadCompanies()
      setIsEditDialogOpen(false)
      setCurrentCompany(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar la empresa')
    }
  }

  const handleDeleteCompany = async (id: string) => {
    try {
      await deleteCompany(id)
      await loadCompanies()
      setIsDeleteDialogOpen(false)
      setCurrentCompany(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la empresa')
    }
  }

  // Filter companies based on search query
  const filteredCompanies = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (company.email?.toLowerCase() ?? '').includes(searchQuery.toLowerCase()) ||
      company.nif.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Open edit dialog with company data
  const openEditDialog = (company: Company) => {
    setCurrentCompany(company)
    setIsEditDialogOpen(true)
  }

  // Open delete confirmation dialog
  const openDeleteDialog = (company: Company) => {
    setCurrentCompany(company)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Empresas</h2>
          <p className="text-muted-foreground">Gestiona la información y detalles de tus empresas</p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Añadir Empresa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nueva Empresa</DialogTitle>
                <DialogDescription>
                  Añade una nueva empresa a tu organización. Rellena los detalles a continuación.
                </DialogDescription>
              </DialogHeader>
              <CompanyForm onSubmit={handleCreateCompany} onCancel={() => setIsCreateDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar empresas..."
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
                <TableHead className="w-[300px]">Detalles de la Empresa</TableHead>
                <TableHead className="w-[200px]">Contacto</TableHead>
                <TableHead className="hidden md:table-cell">Ubicación</TableHead>
                <TableHead className="w-[100px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No se encontraron empresas.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="font-medium">{company.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Building2 className="h-3 w-3" />
                          {company.nif}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="text-sm flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {company.email}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          {company.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-col">
                        <span className="text-sm">{company.address}</span>
                        <span className="text-sm text-muted-foreground">
                          {company.city}, {company.postcode}
                        </span>
                        <span className="text-sm text-muted-foreground">{company.country}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(company)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-500"
                          onClick={() => openDeleteDialog(company)}
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

      {/* Edit Company Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Empresa</DialogTitle>
            <DialogDescription>Actualiza la información de la empresa a continuación.</DialogDescription>
          </DialogHeader>
          {currentCompany && (
            <CompanyForm
              company={currentCompany}
              onSubmit={handleEditCompany}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Empresa</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar a {currentCompany?.name}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => currentCompany && handleDeleteCompany(currentCompany.id)}>
              Eliminar Empresa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

