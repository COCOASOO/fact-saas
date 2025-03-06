'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { InvoiceSeries } from '@/app/types/invoice-series';
import { getInvoiceSeries, deleteInvoiceSeries, checkSeriesHasInvoices } from '@/app/routes/invoice_series/route';
import { InvoiceSeriesDialog } from '@/components/forms/InvoiceSeriesDialog';
import { Toaster, toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function InvoiceSeriesPage() {
  const [series, setSeries] = useState<InvoiceSeries[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSeries, setCurrentSeries] = useState<InvoiceSeries | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [seriesForDeletion, setSeriesForDeletion] = useState<InvoiceSeries | null>(null);

  useEffect(() => {
    loadSeries();
  }, []);

  const loadSeries = async () => {
    try {
      const data = await getInvoiceSeries();
      if (Array.isArray(data)) {
        setSeries(data);
      } else {
        console.error('Data received is not an array:', data);
        toast.error("Error al cargar las series");
      }
    } catch (error) {
      console.error('Error loading series:', error);
      toast.error("No se pudieron cargar las series");
    }
  };

  const handleCreateSeries = () => {
    setCurrentSeries(null);
    setIsDialogOpen(true);
  };

  const handleEditSeries = async (series: InvoiceSeries) => {
    const hasInvoices = await checkSeriesHasInvoices(series.id);
    if (hasInvoices) {
      toast.warning("Esta serie contiene facturas. Solo podrás modificar si es la serie por defecto.");
    }
    setCurrentSeries({ ...series, has_invoices: hasInvoices });
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
      console.error('Error deleting series:', error);
      toast.error(error instanceof Error ? error.message : "Error al eliminar la serie");
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Toaster richColors position="top-right" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Series de Facturación</h1>
        <Button onClick={handleCreateSeries}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Serie
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Formato</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Cantidad de Facturas</TableHead>
              <TableHead>Última Factura</TableHead>
              <TableHead>Por Defecto</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {series.map((serie) => (
              <TableRow key={serie.id}>
                <TableCell>{serie.serie_format}</TableCell>
                <TableCell>
                  {serie.type === 'standard' ? 'Estándar' : 'Rectificativa'}
                </TableCell>
                <TableCell>{serie.invoice_number}</TableCell>
                <TableCell>{serie.last_invoice_number || 'Sin facturas'}</TableCell>
                <TableCell>{serie.default ? "Sí" : "No"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditSeries(serie)}
                      title={serie.has_invoices ? "Solo podrás modificar si es la serie por defecto" : "Editar serie"}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`text-red-500 ${(serie.default || serie.has_invoices) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => handleDeleteClick(serie)}
                      disabled={serie.default || serie.has_invoices}
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
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Serie</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar la serie {seriesForDeletion?.serie_format}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => seriesForDeletion && handleDeleteSeries(seriesForDeletion)}
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
          toast.success(currentSeries 
            ? "Serie actualizada correctamente" 
            : "Serie creada correctamente"
          );
        }}
      />
    </div>
  );
}
