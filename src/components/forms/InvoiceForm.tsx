"use client";

import type React from "react";

import { useState, useEffect, use } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/app/utils/invoice-calculations";
import { getClients, getClientById } from "@/app/utils/clients";
import { Client } from "@/app/types/client";
import { Company, getUserCompany } from "@/app/utils/companies";
import { getInvoiceSeries, getNextInvoiceNumber } from '@/app/utils/invoice_series';
import { InvoiceSeries } from '@/app/types/invoice-series';
import { generateInvoiceNumber } from "@/app/utils/invoices";

interface InvoiceFormProps {
  invoice?: Invoice;
  onSubmit: (invoice: Omit<Invoice, 'id' | 'user_id'>) => void;
  onCancel: () => void;
  onFormDataChange?: (data: Omit<Invoice, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  initialData?: Omit<Invoice, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
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
  invoice_number: "",
  invoice_type: "standard" as 'standard' | 'rectifying'
};

export function InvoiceForm({ 
  invoice, 
  onSubmit, 
  onCancel, 
  onFormDataChange, 
  initialData
}: InvoiceFormProps) {
  const [formData, setFormData] = useState<Omit<Invoice, 'id' | 'user_id' | 'created_at' | 'updated_at'>>(
    invoice ? {
      ...emptyInvoice,
      ...invoice,
    } : emptyInvoice
  );
  const [invoiceType, setInvoiceType] = useState<'standard' | 'rectifying'>('standard');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();
  const [company, setCompany] = useState<Company>();
  const [series, setSeries] = useState<InvoiceSeries[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<string>("");
  const [seriesError, setSeriesError] = useState<string>("");

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const companyData = await getUserCompany();
        setCompany(companyData || undefined); // Ensure company is set to undefined if null
        setFormData((prev) => ({
          ...prev,
          company_id: companyData?.id ?? prev.company_id, // Use nullish coalescing operator
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

  // Generar número de factura provisional para previsualización
useEffect(() => {
  if (!formData.invoice_number && formData.series_id) {
    // Si no hay número de factura pero hay serie seleccionada
    const fetchNextNumber = async () => {
      try {
        const nextNumber = await generateInvoiceNumber(formData.series_id);
        setFormData(prev => ({
          ...prev,
          invoice_number: nextNumber // Esto incluirá "BORRADOR-"
        }));
      } catch (error) {
        console.error("Error al generar número de factura:", error);
      }
    };
    
    fetchNextNumber();
  }
}, [formData.series_id]);

  useEffect(() => {
    const loadSeries = async () => {
      try {
        const seriesData = await getInvoiceSeries();
        setSeries(seriesData);
        
        const availableSeries = seriesData.filter(s => s.type === invoiceType);
        if (availableSeries.length === 0) {
          setSeriesError(`No hay series configuradas para facturas ${invoiceType === 'standard' ? 'estándar' : 'rectificativas'}`);
          return;
        }
        
        setSeriesError("");
        
        if (!selectedSeries) {
          const defaultSeries = availableSeries.find(s => s.default);
          if (defaultSeries) {
            setSelectedSeries(defaultSeries.id);
            setFormData(prev => ({ ...prev, series_id: defaultSeries.id }));
          } else {
            setSelectedSeries(availableSeries[0].id);
            setFormData(prev => ({ ...prev, series_id: availableSeries[0].id }));
          }
        }
      } catch (error) {
        console.error("Error loading series:", error);
        setSeriesError("Error al cargar las series de facturación");
      }
    };
    loadSeries();
  }, [invoiceType]);

  useEffect(() => {
    const taxAmount = Number(calculateTaxAmount(formData.subtotal, formData.tax_rate).toFixed(2));
    const irpfAmount = Number(calculateIrpfAmount(formData.subtotal, formData.irpf_rate).toFixed(2));
    const totalAmount = Number(calculateTotalAmount(formData.subtotal, taxAmount, irpfAmount).toFixed(2));

    setFormData((prev) => ({
      ...prev,
      tax_amount: taxAmount,
      irpf_amount: irpfAmount,
      total_amount: totalAmount,
    }));
  }, [formData.subtotal, formData.tax_rate, formData.irpf_rate]);

  const handleChange = (field: string, value: any) => {
    const updatedFormData = { ...formData, [field]: value ?? "" };
    
    // Si cambia el subtotal, tax_rate o irpf_rate, recalcular los montos
    if (field === "subtotal" || field === "tax_rate" || field === "irpf_rate") {
      const subtotal = field === "subtotal" ? value : updatedFormData.subtotal;
      const taxRate = field === "tax_rate" ? value : updatedFormData.tax_rate;
      const irpfRate = field === "irpf_rate" ? value : updatedFormData.irpf_rate;
      
      const taxAmount = calculateTaxAmount(subtotal, taxRate);
      const irpfAmount = calculateIrpfAmount(subtotal, irpfRate);
      const totalAmount = calculateTotalAmount(subtotal, taxAmount, irpfAmount);
      
      updatedFormData.tax_amount = taxAmount;
      updatedFormData.irpf_amount = irpfAmount;
      updatedFormData.total_amount = totalAmount;
    }
    
    setFormData(updatedFormData);
    
    // Emitir los cambios para actualizar el preview
    if (onFormDataChange) {
      onFormDataChange(updatedFormData);
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

    if (!formData.series_id) {
      newErrors.series_id = "Debe seleccionar una serie de facturación";
    }

    if (seriesError) {
      newErrors.series_id = seriesError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (onSubmitForm: (invoice: Omit<Invoice, 'id' | 'user_id'>) => void) => {
    if (validateForm()) {
      try {
        const submitData = {
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        onSubmitForm(submitData);
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

  // Asegurarse de emitir los datos iniciales al cargar el componente
  useEffect(() => {
    if (onFormDataChange) {
      onFormDataChange(formData);
    }
  }, [formData.client_id, formData.tax_rate, formData.subtotal, formData.irpf_rate]);

  return (
    <form 
      id="invoice-form"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit(onSubmit);
      }}
      className="space-y-4 mt-2"
    >
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información Básica</h3>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="invoice_type">Tipo de Factura</Label>
                  <Select
                    value={invoiceType}
                    onValueChange={(value: 'standard' | 'rectifying') => {
                      setInvoiceType(value);
                      setSelectedSeries("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Estándar</SelectItem>
                      <SelectItem value="rectifying">Rectificativa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="series_id">Serie de Facturación</Label>
                  <Input
                    value={series.find(s => s.id === selectedSeries)?.serie_format || ''}
                    readOnly
                    className={`bg-muted ${seriesError ? 'border-red-500' : ''}`}
                  />
                  {seriesError && (
                    <p className="text-red-500 text-sm">{seriesError}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Cliente</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="client_id">Cliente</Label>
                  <Select
                    name="client_id"
                    value={formData.client_id ?? ""}
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
                    value={selectedClient?.nif ?? ""}
                    onChange={(e) =>
                      setSelectedClient((prev) =>
                        prev ? { ...prev, nif: e.target.value } : prev
                      )
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="c_email">Email</Label>
                  <Input
                    id="c_email"
                    name="c_email"
                    value={selectedClient?.email ?? ""}
                    onChange={(e) =>
                      setSelectedClient((prev) =>
                        prev ? { ...prev, email: e.target.value } : prev
                      )
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="c_phone">Teléfono</Label>
                  <Input
                    id="c_phone"
                    name="c_phone"
                    value={selectedClient?.phone ?? ""}
                    onChange={(e) =>
                      setSelectedClient((prev) =>
                        prev ? { ...prev, phone: e.target.value } : prev
                      )
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="c_address">Dirección</Label>
                  <Input
                    id="c_address"
                    name="c_address"
                    value={selectedClient?.address ?? ""}
                    onChange={(e) =>
                      setSelectedClient((prev) =>
                        prev ? { ...prev, address: e.target.value } : prev
                      )
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="c_city">Ciudad</Label>
                  <Input
                    id="c_city"
                    name="c_city"
                    value={selectedClient?.city ?? ""}
                    onChange={(e) =>
                      setSelectedClient((prev) =>
                        prev ? { ...prev, city: e.target.value } : prev
                      )
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="c_cp">Código postal</Label>
                  <Input
                    id="c_cp"
                    name="c_cp"
                    value={selectedClient?.postcode ?? ""}
                    onChange={(e) =>
                      setSelectedClient((prev) =>
                        prev ? { ...prev, postcode: e.target.value } : prev
                      )
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="c_country">País</Label>
                  <Input
                    id="c_country"
                    name="c_country"
                    value={selectedClient?.country ?? ""}
                    onChange={(e) =>
                      setSelectedClient((prev) =>
                        prev ? { ...prev, country: e.target.value } : prev
                      )
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información emisor</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="company_id">Empresa</Label>
                  <input type="hidden" name="company_id" value={company?.id} />
                  <Input
                    value={company?.name ?? "Cargando empresa..."}
                    readOnly
                    className="bg-muted"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="nif">NIF de la Empresa</Label>
                  <Input
                    id="nif"
                    name="nif"
                    value={company?.nif ?? ""}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cp">Código postal</Label>
                  <Input
                    id="cp"
                    name="cp"
                    value={company?.postcode ?? ""}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    name="address"
                    value={company?.address ?? ""}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    name="city"
                    value={company?.city ?? ""}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="country">País</Label>
                  <Input
                    id="country"
                    name="country"
                    value={company?.country ?? ""}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    value={company?.email ?? ""}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={company?.phone ?? ""}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
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
                      value={formData.subtotal ?? 0}
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
                      value={formData.currency ?? "EUR"}
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
                      value={formData.tax_rate ?? 0}
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
                      value={formData.tax_amount ?? 0}
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
                      value={formData.irpf_rate ?? 0}
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
                      value={formData.irpf_amount ?? 0}
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
                    value={formData.total_amount ?? 0}
                    disabled
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botón de submit oculto para ser activado desde fuera */}
      <button 
        id="invoice-form-submit" 
        type="submit" 
        style={{ display: 'none' }}
      >
        Submit
      </button>
    </form>
  );
}
