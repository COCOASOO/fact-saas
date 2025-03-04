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
import { Switch } from "@/components/ui/switch";
import { CreateInvoiceSeriesDTO, InvoiceSeries } from '@/app/types/invoice-series';
import { addInvoiceSeries } from '@/app/routes/invoice_series/route';
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

  useEffect(() => {
    if (series) {
      setFormData({
        serie_format: series.serie_format,
        type: series.type,
        default: series.default,
        invoice_number: series.invoice_number,
      });
    } else {
      setFormData({
        serie_format: '',
        type: 'standard',
        default: false,
        invoice_number: 0,
      });
    }
  }, [series]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.serie_format) {
      newErrors.serie_format = 'El formato es requerido';
    } else if (!/.*#/.test(formData.serie_format)) {
      newErrors.serie_format = 'El formato debe incluir al menos un # para la numeración';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await addInvoiceSeries(formData);
      onSuccess();
    } catch (error) {
      console.error('Error saving series:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {series ? 'Editar Serie' : 'Nueva Serie'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serie_format">Formato</Label>
            <Input
              id="serie_format"
              value={formData.serie_format}
              onChange={(e) => setFormData({ ...formData, serie_format: e.target.value })}
              placeholder="Ej: FACT-###"
            />
            {errors.serie_format && (
              <p className="text-sm text-red-500">{errors.serie_format}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as 'standard' | 'rectifying' })}
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

          <div className="flex items-center space-x-2">
            <Switch
              id="default"
              checked={formData.default}
              onCheckedChange={(checked) => setFormData({ ...formData, default: checked })}
            />
            <Label htmlFor="default">Serie por defecto</Label>
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
