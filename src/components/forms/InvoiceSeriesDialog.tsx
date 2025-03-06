import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateInvoiceSeriesDTO, InvoiceSeries } from '@/app/types/invoice-series';
import { addInvoiceSeries, updateInvoiceSeries, checkSeriesHasInvoices, checkDuplicateFormat } from '@/app/routes/invoice_series/route';
import { createClient } from '@/lib/supabase/supabaseClient';

const supabase = createClient();

interface InvoiceSeriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  series: InvoiceSeries | null;
  onSuccess: () => void;
}

export function InvoiceSeriesDialog({
  open,
  onOpenChange,
  series,
  onSuccess,
}: InvoiceSeriesDialogProps) {
  const [formData, setFormData] = useState<CreateInvoiceSeriesDTO>({
    serie_format: '',
    type: 'standard',
    default: false,
    invoice_number: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasInvoices, setHasInvoices] = useState(false);

  useEffect(() => {
    if (series) {
      setFormData({
        serie_format: series.serie_format,
        type: series.type,
        default: series.default,
        invoice_number: series.invoice_number,
      });
      // Verificar si la serie tiene facturas
      checkSeriesHasInvoices(series.id).then(setHasInvoices);
    } else {
      setFormData({
        serie_format: '',
        type: 'standard',
        default: false,
        invoice_number: 0,
      });
      setHasInvoices(false);
    }
  }, [series]);

  const validateForm = async () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.serie_format) {
      newErrors.serie_format = 'El formato es requerido';
    } else {
      // Validar que no contenga espacios
      if (/\s/.test(formData.serie_format)) {
        newErrors.serie_format = 'El formato no puede contener espacios';
      }
      // Validar que contenga exactamente 2 o 4 % para el año
      else if (!/(%%|%%%%)/.test(formData.serie_format)) {
        newErrors.serie_format = 'El formato debe incluir exactamente 2 o 4 símbolos % para el año (ejemplo: %% o %%%%)';
      }
      // Validar que contenga al menos tres #
      else if ((formData.serie_format.match(/#/g) || []).length < 3) {
        newErrors.serie_format = 'El formato debe incluir al menos tres # para la numeración';
      }
      // Verificar formato duplicado si no hay otros errores
      else {
        try {
          const isDuplicate = await checkDuplicateFormat(
            formData.serie_format, 
            series?.id
          );
          if (isDuplicate) {
            newErrors.serie_format = 'Ya existe una serie con este formato';
          }
        } catch (error) {
          console.error('Error checking duplicate format:', error);
          newErrors.serie_format = 'Error al validar el formato';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!(await validateForm())) return;

    try {
      if (series) {
        await updateInvoiceSeries(series.id, formData);
      } else {
        await addInvoiceSeries(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving series:', error);
      if (error instanceof Error) {
        setErrors({
          serie_format: error.message
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {series ? 'Editar Serie' : 'Nueva Serie'}
          </DialogTitle>
          {hasInvoices && (
            <p className="text-sm text-yellow-600">
              Esta serie contiene facturas. Solo se puede modificar si es la serie por defecto.
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serie_format">Formato</Label>
            <Input
              id="serie_format"
              value={formData.serie_format}
              onChange={(e) => setFormData({ ...formData, serie_format: e.target.value })}
              placeholder="Ej: FACT-%%%%-###"
              disabled={hasInvoices}
            />
            {errors.serie_format && (
              <p className="text-sm text-red-500">{errors.serie_format}</p>
            )}
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Formato de serie:</strong></p>
              <ul className="list-disc pl-4 space-y-1">
                <li><code>%%</code>: Últimos dos dígitos del año (ej: 25)</li>
                <li><code>%%%%</code>: Año completo (ej: 2025)</li>
                <li><code>###</code>: Número secuencial (mínimo 3 dígitos)</li>
                <li>No se permiten espacios en el formato</li>
              </ul>
              <p><em>Ejemplos:</em></p>
              <ul className="list-disc pl-4 space-y-1">
                <li>FACT-%%-### → FACT-25-001</li>
                <li>FACT-%%%%-### → FACT-2025-001</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as 'standard' | 'rectifying' })}
              disabled={hasInvoices}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Estándar</SelectItem>
                <SelectItem value="rectifying">Rectificativa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {series ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
