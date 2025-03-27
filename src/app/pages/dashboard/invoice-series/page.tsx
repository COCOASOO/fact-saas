"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search, BarChart3, RotateCcw } from "lucide-react";
import { InvoiceSeries } from "@/app/types/invoice-series";
import {
  getInvoiceSeries,
  deleteInvoiceSeries,
  checkSeriesHasInvoices,
  updateInvoiceSeries,
} from "@/app/utils/invoice_series";
import { InvoiceSeriesDialog } from "@/components/forms/InvoiceSeriesDialog";
import { Toaster, toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function InvoiceSeriesPage() {
  const [series, setSeries] = useState<InvoiceSeries[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSeries, setCurrentSeries] = useState<InvoiceSeries | null>(
    null
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [seriesForDeletion, setSeriesForDeletion] =
    useState<InvoiceSeries | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "standard" | "rectifying"
  >("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    loadSeries();
    
    // Add responsive detection
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    // Set initial value
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadSeries = async () => {
    try {
      setIsLoading(true);
      const data = await getInvoiceSeries();
      if (Array.isArray(data)) {
        setSeries(data);
      } else {
        console.error("Data received is not an array:", data);
        toast.error("Error al cargar las series");
      }
    } catch (error) {
      console.error("Error loading series:", error);
      toast.error("No se pudieron cargar las series");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSeries = () => {
    setCurrentSeries(null);
    setIsDialogOpen(true);
  };

  const handleEditSeries = async (series: InvoiceSeries) => {
    const hasInvoices = await checkSeriesHasInvoices(series.id);
    if (hasInvoices) {
      toast.error("No se puede editar una serie que contiene facturas");
      return;
    }
    setCurrentSeries({ ...series });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (series: InvoiceSeries) => {
    setSeriesForDeletion(series);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteSeries = async (series: InvoiceSeries) => {
    try {
      if (series.default) {
        toast.error("No se puede eliminar una serie por defecto");
        return;
      }

      const hasInvoices = await checkSeriesHasInvoices(series.id);
      if (hasInvoices) {
        toast.error("No se puede eliminar una serie que contiene facturas");
        return;
      }

      await deleteInvoiceSeries(series.id);
      toast.success("Serie eliminada correctamente");
      loadSeries();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting series:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al eliminar la serie"
      );
    }
  };

  const handleDefaultToggle = async (series: InvoiceSeries) => {
    if (!series.default) {
      try {
        // Primero obtenemos todas las series del mismo tipo
        const seriesOfSameType = filteredAndSortedSeries.filter(
          (s) => s.type === series.type && s.id !== series.id
        );

        // Desactivamos la serie que estaba por defecto
        const defaultSeries = seriesOfSameType.find((s) => s.default);
        if (defaultSeries) {
          await updateInvoiceSeries(defaultSeries.id, { default: false });
        }

        // Activamos la nueva serie por defecto
        await updateInvoiceSeries(series.id, { default: true });

        toast.success("Serie establecida como predeterminada");
        loadSeries();
      } catch (error) {
        console.error("Error updating default series:", error);
        toast.error("Error al establecer la serie como predeterminada");
      }
    }
  };

  // Filter and sort series
  const filteredAndSortedSeries = series
    .filter((serie) => {
      const matchesSearch = serie.serie_format
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "all" || serie.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      // First sort by default status (default series first)
      if (a.default !== b.default) {
        return a.default ? -1 : 1;
      }
      // Then sort by series format
      return a.serie_format.localeCompare(b.serie_format);
    });

  return (
    <div className="h-full flex-1 flex-col space-y-6 p-4 sm:p-6 md:p-8">
      <Toaster richColors position="top-right" />
      
      {/* Encabezado con estilos responsivos */}
      <div className="flex flex-col space-y-2">
        <div className={`flex ${isMobileView ? "flex-col" : "flex-row items-center justify-between"}`}>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Series de Facturación</h2>
            <p className="text-muted-foreground text-sm">Gestiona tus series de facturas y su información</p>
          </div>
          
          {/* Botón para desktop */}
          {!isMobileView && (
            <Button 
              onClick={handleCreateSeries} 
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Serie
            </Button>
          )}
        </div>
        
        {/* Botón para móvil - ancho completo y negro */}
        {isMobileView && (
          <Button 
            onClick={handleCreateSeries} 
            className="w-full bg-black text-white hover:bg-gray-800"
            variant="default"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Serie
          </Button>
        )}
      </div>

      {/* Filtros en horizontal */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-wrap">
          <div className="relative flex-1 w-full max-w-full sm:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar series..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Select
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value as typeof typeFilter)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo de serie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="standard">Estándar</SelectItem>
                <SelectItem value="rectifying">Rectificativa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      
        {/* Vista de mobile o desktop según corresponda */}
        {isMobileView ? (
          /* Mobile card view */
          <div className="space-y-3">
            {isLoading ? (
              // Skeleton para carga en móvil
              Array.from({ length: 3 }).map((_, index) => (
                <div key={`skeleton-card-${index}`} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-[140px]" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-[120px]" />
                      <Skeleton className="h-4 w-[30px]" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-[120px]" />
                      <Skeleton className="h-4 w-[80px]" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Skeleton className="h-4 w-[80px]" />
                      <Skeleton className="h-5 w-10 ml-2 rounded-full" />
                    </div>
                    <div className="flex space-x-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </div>
                </div>
              ))
            ) : filteredAndSortedSeries.length === 0 ? (
              <div className="border rounded-lg p-6 text-center">
                {series.length === 0
                  ? "No hay series de facturación definidas"
                  : "No se encontraron series que coincidan con los filtros"}
              </div>
            ) : (
              filteredAndSortedSeries.map((serie) => (
                <div 
                  key={serie.id} 
                  className="border rounded-lg p-4 space-y-3"
                >
                  {/* Formato y predeterminada */}
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{serie.serie_format}</span>
                    {serie.default && (
                      <span className="text-xs text-muted-foreground">Predeterminada</span>
                    )}
                  </div>
                  
                  {/* Información básica */}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Facturas generadas:</span>
                      <span>{serie.invoice_number || 0}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Última factura:</span>
                      <span>
                        {serie.last_invoice_number || "Sin facturas"}
                      </span>
                    </div>
                  </div>

                  {/* Por defecto switch y acciones */}
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center">
                      <span className="text-sm text-muted-foreground mr-2">Por defecto:</span>
                      <Switch
                        checked={serie.default}
                        onCheckedChange={() => handleDefaultToggle(serie)}
                        disabled={serie.default}
                        className="scale-90"
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={
                          serie.has_invoices ||
                          serie.last_invoice_number !== null
                        }
                        className={
                          serie.has_invoices ||
                          serie.last_invoice_number !== null
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }
                        onClick={() =>
                          !serie.has_invoices && handleEditSeries(serie)
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`text-red-500 ${
                          serie.default ||
                          serie.has_invoices ||
                          serie.last_invoice_number !== null
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        onClick={() => handleDeleteClick(serie)}
                        disabled={
                          serie.default ||
                          serie.has_invoices ||
                          serie.last_invoice_number !== null
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Desktop table view */
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Formato</TableHead>
                  <TableHead className="min-w-[100px]">Tipo</TableHead>
                  <TableHead className="min-w-[150px]">Cantidad de Facturas</TableHead>
                  <TableHead className="min-w-[120px]">Última Factura</TableHead>
                  <TableHead className="min-w-[100px]">Por Defecto</TableHead>
                  <TableHead className="min-w-[90px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[40px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-10 rounded-full" />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredAndSortedSeries.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {series.length === 0
                        ? "No hay series de facturación definidas"
                        : "No se encontraron series que coincidan con los filtros"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedSeries.map((serie) => (
                    <TableRow
                      key={serie.id}
                      className={serie.default ? "bg-muted/50" : ""}
                    >
                      <TableCell>{serie.serie_format}</TableCell>
                      <TableCell>
                        {serie.type === "standard" ? "Estándar" : "Rectificativa"}
                      </TableCell>
                      <TableCell>{serie.invoice_number}</TableCell>
                      <TableCell>
                        {serie.last_invoice_number || "Sin facturas"}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={serie.default}
                          onCheckedChange={() => handleDefaultToggle(serie)}
                          disabled={serie.default}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={
                              serie.has_invoices ||
                              serie.last_invoice_number !== null
                            }
                            className={
                              serie.has_invoices ||
                              serie.last_invoice_number !== null
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }
                            onClick={() =>
                              !serie.has_invoices && handleEditSeries(serie)
                            }
                            title={
                              serie.has_invoices
                                ? "No se puede editar una serie que contiene facturas"
                                : "Editar serie"
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`text-red-500 ${
                              serie.default ||
                              serie.has_invoices ||
                              serie.last_invoice_number !== null
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                            onClick={() => handleDeleteClick(serie)}
                            disabled={
                              serie.default ||
                              serie.has_invoices ||
                              serie.last_invoice_number !== null
                            }
                            title={
                              serie.default
                                ? "No se puede eliminar una serie por defecto"
                                : serie.has_invoices
                                ? "No se puede eliminar una serie con facturas"
                                : "Eliminar serie"
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Serie</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar la serie{" "}
              {seriesForDeletion?.serie_format}? Esta acción no se puede
              deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                seriesForDeletion && handleDeleteSeries(seriesForDeletion)
              }
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InvoiceSeriesDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        series={currentSeries}
        onSuccess={() => {
          setIsDialogOpen(false);
          loadSeries();
          toast.success(
            currentSeries
              ? "Serie actualizada correctamente"
              : "Serie creada correctamente y establecida como predeterminada"
          );
        }}
      />
    </div>
  );
}
