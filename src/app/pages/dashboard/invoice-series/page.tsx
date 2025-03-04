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
import { getInvoiceSeries } from '@/app/routes/invoice_series/route';
import {InvoiceSeriesDialog} from '@/components/forms/InvoiceSeriesDialog';

export default function InvoiceSeriesPage() {
  const [series, setSeries] = useState<InvoiceSeries[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSeries, setCurrentSeries] = useState<InvoiceSeries | null>(null);

  useEffect(() => {
    loadSeries();
  }, []);

  const loadSeries = async () => {
    try {
      const data = await getInvoiceSeries();
      console.log("series: ", data)
      setSeries(data);
    } catch (error) {
      console.error('Error loading series:', error);
    }
  };

  const handleCreateSeries = () => {
    setCurrentSeries(null);
    setIsDialogOpen(true);
  };

  const handleEditSeries = (series: InvoiceSeries) => {
    setCurrentSeries(series);
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-6">
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
              <TableHead>Número Actual</TableHead>
              <TableHead>Por Defecto</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {series.map((serie) => (
              <TableRow key={serie.id}>
                <TableCell>{serie.serie_format}</TableCell>
                <TableCell>{serie.type}</TableCell>
                <TableCell>{serie.invoice_number}</TableCell>
                <TableCell>{serie.default ? "Sí" : "No"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditSeries(serie)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500"
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

      <InvoiceSeriesDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        series={currentSeries}
        onSuccess={() => {
          setIsDialogOpen(false);
          loadSeries();
        }}
      />
    </div>
  );
}
