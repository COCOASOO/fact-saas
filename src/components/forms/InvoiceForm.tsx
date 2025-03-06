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
import { getClientById, getClients } from "@/app/routes/clients/route";
import { Client } from "@/app/types/client";
import { Company, getUserCompany } from "@/app/routes/companies/route";
import { addInvoice } from "@/app/routes/invoices/route";
import { getInvoiceSeries } from '@/app/routes/invoice_series/route';
import { InvoiceSeries } from '@/app/types/invoice-series';

interface InvoiceFormProps {
  invoice?: Invoice;
  onSubmit: (invoice: Omit<Invoice, 'id' | 'user_id'>) => void;
  onCancel: () => void;
}

const emptyInvoice: Omit<Invoice, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  client_id: "",
  company_id: "",
  date: new Date().toISOString().split("T")[0],
  status: "draft",
  pdf_url: null,
  invoice_date: new Date().toISOString().split("T")[0],
  due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
  currency: "EUR",
  subtotal: 0,
  tax_rate: 21,
  tax_amount: 0,
  irpf_rate: 0,
  irpf_amount: 0,
  total_amount: 0,
  verifactu_xml: null,
  verifactu_hash: null,
  verifactu_signature: null,
  verifactu_status: null,
  verifactu_response: null,
  series_id: "",
  invoice_number: ""
};

export function InvoiceForm({ invoice, onSubmit, onCancel }: InvoiceFormProps) {
  const [formData, setFormData] = useState<typeof emptyInvoice>(
    invoice ? {
      ...emptyInvoice,
      ...invoice,
    } : emptyInvoice
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();
  const [company, setCompany] = useState<Company>();
  const [series, setSeries] = useState<InvoiceSeries[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<string>("");

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const companyData = await getUserCompany();
        setCompany(companyData);
        setFormData((prev) => ({
          ...prev,
          company_id: companyData?.id || prev.company_id,
        }));
      } catch (error) {
        console.error("Error loading companies:", error);
      }
    };
    loadCompany();
  }, []);

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

  useEffect(() => {
    if (invoice?.client_id) {
      const loadClientData = async () => {
        try {
          const clientData = await getClientById(invoice.client_id);
          setSelectedClient(clientData);
          console.log("Cliente cargado:", clientData);
        } catch (error) {
          console.error("Error loading client data:", error);
        }
      };
      loadClientData();
    }
  }, [invoice]);

  useEffect(() => {
    const loadSeries = async () => {
      try {
        const seriesData = await getInvoiceSeries();
        setSeries(seriesData);
        
        if (!selectedSeries) {
          const defaultSeries = seriesData.find(s => s.default && s.type === 'standard');
          if (defaultSeries) {
            setSelectedSeries(defaultSeries.id);
            setFormData(prev => ({ ...prev, series_id: defaultSeries.id }));
          }
        }
      } catch (error) {
        console.error("Error loading series:", error);
      }
    };
    loadSeries();
  }, []);

  useEffect(() => {
    const taxAmount = Number((calculateTaxAmount(formData.subtotal, formData.tax_rate)).toFixed(2));
    const irpfAmount = Number((calculateIrpfAmount(formData.subtotal, formData.irpf_rate)).toFixed(2));
    const totalAmount = Number((calculateTotalAmount(formData.subtotal, taxAmount, irpfAmount)).toFixed(2));

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
    const processedValue = typeof value === 'number' 
      ? Number(value.toFixed(2))
      : value;

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleClientChange = async (value: string) => {
    try {
      const selectedClientData = await getClientById(value);
      if (selectedClientData) {
        setSelectedClient(selectedClientData);
        setFormData((prev) => ({
          ...prev,
          client_id: selectedClientData.id,
          company_id: selectedClientData.company_id,
          irpf_rate: selectedClientData.applies_irpf ? 15 : 0,
        }));
      }
    } catch (error) {
      console.error("Error fetching client:", error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        onSubmit({ ...formData, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      } catch (error) {
        console.error("Error al guardar la factura:", error);
        if (error instanceof Error) {
          if (error.message.includes("número")) {
            setErrors((prev) => ({
              ...prev,
              invoice_number: error.message,
            }));
          }
        }
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6 py-4">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información Básica</h3>
              <div className="grid gap-4">
                {!invoice && (
                  <div className="grid gap-2">
                    <Label htmlFor="series_id">Serie de Facturación</Label>
                    <Select
                      value={selectedSeries}
                      onValueChange={(value) => {
                        setSelectedSeries(value);
                        setFormData(prev => ({ ...prev, series_id: value }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar serie" />
                      </SelectTrigger>
                      <SelectContent>
                        {series
                          .filter(s => s.type === 'standard')
                          .map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.serie_format} {s.default ? "(Por defecto)" : ""}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {invoice && (
                  <div className="grid gap-2">
                    <Label>Número de Factura</Label>
                    <Input value={invoice.invoice_number} disabled />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Cliente</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="client_id">Cliente</Label>
                  <Select
                    name="client_id"
                    value={formData.client_id}
                    onValueChange={handleClientChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
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

                <div className="grid gap-2">
                  <Label htmlFor="c_nif">NIF</Label>
                  <Input
                    id="c_nif"
                    name="c_nif"
                    value={selectedClient?.nif || ""}
                    onChange={(e) =>
                      setSelectedClient((prev) =>
                        prev ? { ...prev, nif: e.target.value } : undefined
                      )
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="c_email">Email</Label>
                  <Input
                    id="c_email"
                    name="c_email"
                    value={selectedClient?.email || ""}
                    onChange={(e) =>
                      setSelectedClient((prev) =>
                        prev ? { ...prev, email: e.target.value } : undefined
                      )
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="c_phone">Teléfono</Label>
                  <Input
                    id="c_phone"
                    name="c_phone"
                    value={selectedClient?.phone || ""}
                    onChange={(e) =>
                      setSelectedClient((prev) =>
                        prev ? { ...prev, phone: e.target.value } : undefined
                      )
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="c_address">Dirección</Label>
                  <Input
                    id="c_address"
                    name="c_address"
                    value={selectedClient?.address || ""}
                    onChange={(e) =>
                      setSelectedClient((prev) =>
                        prev ? { ...prev, address: e.target.value } : undefined
                      )
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="c_city">Ciudad</Label>
                  <Input
                    id="c_city"
                    name="c_city"
                    value={selectedClient?.city || ""}
                    onChange={(e) =>
                      setSelectedClient((prev) =>
                        prev ? { ...prev, city: e.target.value } : undefined
                      )
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="c_cp">Código postal</Label>
                  <Input
                    id="c_cp"
                    name="c_cp"
                    value={selectedClient?.postcode || ""}
                    onChange={(e) =>
                      setSelectedClient((prev) =>
                        prev ? { ...prev, postcode: e.target.value } : undefined
                      )
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="c_country">País</Label>
                  <Input
                    id="c_country"
                    name="c_country"
                    value={selectedClient?.country || ""}
                    onChange={(e) =>
                      setSelectedClient((prev) =>
                        prev ? { ...prev, country: e.target.value } : undefined
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información emisor</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="company_id">Empresa</Label>
                  <input type="hidden" name="company_id" value={company?.id} />
                  <Input
                    value={company?.name || "Cargando empresa..."}
                    readOnly
                    className="bg-muted"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="nif">NIF de la Empresa</Label>
                  <Input
                    id="nif"
                    name="nif"
                    value={company?.nif || ""}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cp">Código postal</Label>
                  <Input
                    id="cp"
                    name="cp"
                    value={company?.postcode || ""}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    name="address"
                    value={company?.address || ""}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    name="city"
                    value={company?.city || ""}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="country">País</Label>
                  <Input
                    id="country"
                    name="country"
                    value={company?.country || ""}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    value={company?.email || ""}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={company?.phone || ""}
                    readOnly
                    className="bg-muted"
                  />
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
                      disabled={!selectedClient?.applies_irpf}
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
