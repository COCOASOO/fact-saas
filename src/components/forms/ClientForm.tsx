"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getCompanies,
  getCompanyById,
  getUserCompany,
} from "@/app/utils/companies";
import type { Company } from "@/app/utils/companies";

interface Client {
  id: string;
  company_id: string;
  user_id: string;
  name: string;
  nif: string;
  address?: string;
  city?: string;
  postcode?: string;
  country: string;
  email?: string;
  phone?: string;
  applies_irpf: boolean;
  created_at?: string;
}

interface ClientFormProps {
  client?: Client;
  onSubmit: (client: Client) => void;
  onCancel: () => void;
}

interface FormErrors {
  company_id?: string;
  name?: string;
  nif?: string;
  address?: string;
  city?: string;
  postcode?: string;
  country?: string;
  email?: string;
  phone?: string;
}

// Default empty client
const emptyClient: Client = {
  id: "",
  company_id: "",
  user_id: "",
  name: "",
  nif: "",
  address: "",
  city: "",
  postcode: "",
  country: "ESP",
  email: "",
  phone: "",
  applies_irpf: false,
};

export function ClientForm({
  client = emptyClient,
  onSubmit,
  onCancel,
}: ClientFormProps) {

  const [formData, setFormData] = useState<Client>({
    ...emptyClient,
    ...client, 
  });  const [errors, setErrors] = useState<FormErrors>({});
  const [company, setCompany] = useState<Company>();

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const companiesData = await getUserCompany();
        setCompany(companiesData || undefined); // Ensure company state is set to undefined if companiesData is null
  
        setFormData((prev) => ({
          ...prev,
          company_id: companiesData?.id || prev.company_id,
        }));
      } catch (error) {
        console.error("Error loading companies:", error);
      }
    };
    loadCompany();
  }, []);
  

  // Update form data when client prop changes
  useEffect(() => {
    if (client) {
      setFormData(client);
    }
  }, [client]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when field is edited
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.company_id.trim()) {
      newErrors.company_id = "La empresa es obligatoria";
    }

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es obligatorio";
    }

    if (!formData.nif.trim()) {
      newErrors.nif = "El NIF es obligatorio";
    } else if (!/^[0-9A-Z]{9}$/.test(formData.nif.toUpperCase())) {
      newErrors.nif = "El formato del NIF no es válido";
    }

    if (!formData.email?.trim()) {
      newErrors.email = "El email es obligatorio";
    } else if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El formato del email no es válido";
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = "El teléfono es obligatorio";
    } else if (
      formData.phone &&
      !/^[0-9]{9}$/.test(formData.phone.replace(/\s/g, ""))
    ) {
      newErrors.phone = "El formato del teléfono no es válido";
    }

    if (!formData.address?.trim()) {
      newErrors.address = "La dirección es obligatoria";
    }

    if (!formData.city?.trim()) {
      newErrors.city = "La ciudad es obligatoria";
    }

    if (!formData.postcode?.trim()) {
      newErrors.postcode = "El código postal es obligatorio";
    } else if (formData.postcode && !/^[0-9]{5}$/.test(formData.postcode)) {
      newErrors.postcode = "El código postal debe tener 5 dígitos";
    }

    if (!formData.country.trim()) {
      newErrors.country = "El país es obligatorio";
    }

    if (!formData.company_id.trim()) {
      newErrors.company_id = "La empresa es obligatoria";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();  
    if (validateForm()) {
      onSubmit(formData);
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
                  <Label htmlFor="nif">NIF del cliente</Label>
                  <Input
                    id="nif"
                    name="nif"
                    value={formData.nif}
                    onChange={handleChange}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.nif && (
                    <p className="text-red-500 text-sm">{errors.nif}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información de Contacto</h3>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm">{errors.name}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm">{errors.email}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={errors.phone ? "border-red-500" : ""}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Dirección</h3>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={errors.address ? "border-red-500" : ""}
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm">{errors.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className={errors.city ? "border-red-500" : ""}
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm">{errors.city}</p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="postcode">Código Postal</Label>
                    <Input
                      id="postcode"
                      name="postcode"
                      value={formData.postcode}
                      onChange={handleChange}
                      className={errors.postcode ? "border-red-500" : ""}
                    />
                    {errors.postcode && (
                      <p className="text-red-500 text-sm">{errors.postcode}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="country">País</Label>
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className={errors.country ? "border-red-500" : ""}
                  />
                  {errors.country && (
                    <p className="text-red-500 text-sm">{errors.country}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="applies_irpf">Estado IRPF</Label>
                <p className="text-sm text-muted-foreground">
                  Activar si este cliente debe tener IRPF aplicado
                </p>
              </div>
              <Switch
                id="applies_irpf"
                checked={formData.applies_irpf}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, applies_irpf: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {client === emptyClient ? "Crear Cliente" : "Guardar Cambios"}
        </Button>
      </DialogFooter>
    </form>
  );
}
