"use client";

import type React from "react";

import { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Invoice, InvoiceFormData } from "@/app/types/invoice";
import {
  calculateTaxAmount,
  calculateIrpfAmount,
  calculateTotalAmount,
} from "@/lib/utils/invoice-calculations";
import { getClients } from "@/app/routes/clients/route";
import { Client } from "@/app/types/client";

interface InvoiceFormProps {
  invoice?: Invoice;
  onSubmit: (invoice: Invoice) => void;
  onCancel: () => void;
}

const emptyInvoice: InvoiceFormData = {
  user_id: "",
  client_id: "",
  company_id: "",
  date: new Date().toISOString().split("T")[0],
  invoice_number: "",
  status: "draft",
  invoice_date: new Date().toISOString().split("T")[0],
  due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
  currency: "EUR",
  subtotal: 0,
  tax_rate: 21,
  tax_amount: 0,
  irpf_rate: 15,
  irpf_amount: 0,
  total_amount: 0,
};

export function InvoiceForm({ invoice, onSubmit, onCancel }: InvoiceFormProps) {
  const [formData, setFormData] = useState<InvoiceFormData>(
    invoice || emptyInvoice
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    const fetchClients = async () => {
      const clientsData = await getClients();
      setClients(clientsData);
    };
    fetchClients();
  }, []);
  useEffect(() => {
    if (!selectedClientId) {
      setFormData((prev) => ({ ...prev, client_id: "" }));
    }
  }, [selectedClientId]);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const clientsData = await getClients();
        setClients(clientsData);
      } catch (error) {
        console.error("Error loading clients:", error);
      }
    };
    loadClients();
  }, []);

  // Update calculations when relevant fields change
  useEffect(() => {
    const taxAmount = calculateTaxAmount(formData.subtotal, formData.tax_rate);
    const irpfAmount = calculateIrpfAmount(
      formData.subtotal,
      formData.irpf_rate
    );
    const totalAmount = calculateTotalAmount(
      formData.subtotal,
      taxAmount,
      irpfAmount
    );

    setFormData((prev) => ({
      ...prev,
      tax_amount: taxAmount,
      irpf_amount: irpfAmount,
      total_amount: totalAmount,
    }));
  }, [formData.subtotal, formData.tax_rate, formData.irpf_rate]);

  const handleChange = (
    name: keyof InvoiceFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.invoice_number) {
      newErrors.invoice_number = "El número de factura es obligatorio";
    }

    if (!formData.client_id) {
      newErrors.client_id = "El cliente es obligatorio";
    }

    if (!formData.company_id) {
      newErrors.company_id = "La empresa es obligatoria";
    }

    if (formData.subtotal <= 0) {
      newErrors.subtotal = "La base imponible debe ser mayor que 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData as Invoice);
    }
  };

    // Actualizar NIF cuando se selecciona una empresa
    const handleClientChange = (value: string) => {
      const selectedClient = clients.find(client => client.id === value)
      setFormData(prev => ({
        ...prev,
        client_id: value,
        name: selectedClient?.name || ''
      }))
    }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6 py-4  ">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información Básica</h3>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="invoice_number">Número de Factura</Label>
                    <Input
                      id="invoice_number"
                      value={formData.invoice_number}
                      onChange={(e) =>
                        handleChange("invoice_number", e.target.value)
                      }
                      className={errors.invoice_number ? "border-red-500" : ""}
                    />
                    {errors.invoice_number && (
                      <p className="text-red-500 text-sm">
                        {errors.invoice_number}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Estado</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleChange("status", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Borrador</SelectItem>
                        <SelectItem value="pending">Pendiente</SelectItem>
                        <SelectItem value="paid">Pagada</SelectItem>
                        <SelectItem value="cancelled">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="invoice_date">Fecha de Factura</Label>
                    <Input
                      id="invoice_date"
                      type="date"
                      value={formData.invoice_date}
                      onChange={(e) =>
                        handleChange("invoice_date", e.target.value)
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="due_date">Fecha de Vencimiento</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => handleChange("due_date", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Cliente</h3>
              <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="client_id">Cliente</Label>
                <Select
                name="client_id"
                value={formData.client_id}
                onValueChange={handleClientChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un cliente"/>
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client)=>(
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.client_id && (
                    <p className="text-red-500 text-sm">{errors.client_id}</p>
                  )}
              </div>

               
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Detalles Económicos</h3>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="subtotal">Base Imponible</Label>
                    <Input
                      id="subtotal"
                      type="number"
                      step="0.01"
                      value={formData.subtotal}
                      onChange={(e) =>
                        handleChange(
                          "subtotal",
                          Number.parseFloat(e.target.value) || 0
                        )
                      }
                      className={errors.subtotal ? "border-red-500" : ""}
                    />
                    {errors.subtotal && (
                      <p className="text-red-500 text-sm">{errors.subtotal}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="currency">Moneda</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => handleChange("currency", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar moneda" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="tax_rate">Tipo de IVA (%)</Label>
                    <Input
                      id="tax_rate"
                      type="number"
                      step="0.01"
                      value={formData.tax_rate}
                      onChange={(e) =>
                        handleChange(
                          "tax_rate",
                          Number.parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tax_amount">Importe IVA</Label>
                    <Input
                      id="tax_amount"
                      type="number"
                      step="0.01"
                      value={formData.tax_amount}
                      disabled
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="irpf_rate">Retención IRPF (%)</Label>
                    <Input
                      id="irpf_rate"
                      type="number"
                      step="0.01"
                      value={formData.irpf_rate}
                      onChange={(e) =>
                        handleChange(
                          "irpf_rate",
                          Number.parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="irpf_amount">Importe IRPF</Label>
                    <Input
                      id="irpf_amount"
                      type="number"
                      step="0.01"
                      value={formData.irpf_amount}
                      disabled
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="total_amount">Total</Label>
                  <Input
                    id="total_amount"
                    type="number"
                    step="0.01"
                    value={formData.total_amount}
                    disabled
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {invoice ? "Guardar Cambios" : "Crear Factura"}
        </Button>
      </DialogFooter>
    </form>
  );
}
