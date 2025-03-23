"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Company, getUserCompany, updateCompany, addCompany } from "@/app/routes/companies/route";
import { toast, Toaster } from "sonner";

// Importaciones de componentes Shadcn
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle2, Building2, MapPin, Mail, Phone } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CompanySettings() {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Datos del formulario
  const [formData, setFormData] = useState({
    name: "",
    nif: "",
    address: "",
    city: "",
    postcode: "",
    country: "ESP",
    email: "",
    phone: ""
  });

  // Errores de validación
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Cargar datos de la empresa
  useEffect(() => {
    async function loadCompanyData() {
      try {
        setIsLoading(true);
        const companyData = await getUserCompany();
        
        if (companyData) {
          setCompany(companyData);
          setFormData({
            name: companyData.name || "",
            nif: companyData.nif || "",
            address: companyData.address || "",
            city: companyData.city || "",
            postcode: companyData.postcode || "",
            country: companyData.country || "ESP",
            email: companyData.email || "",
            phone: companyData.phone || ""
          });
        }
      } catch (error) {
        console.error("Error al cargar datos de la empresa:", error);
        toast.error("No se pudieron cargar los datos de la empresa");
      } finally {
        setIsLoading(false);
      }
    }

    loadCompanyData();
  }, []);

  // Manejar cambios en los campos del formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error específico al editar un campo
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "El nombre de la empresa es obligatorio";
    }
    
    if (!formData.nif.trim()) {
      newErrors.nif = "El NIF es obligatorio";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Guardar cambios
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Por favor, corrige los errores en el formulario");
      return;
    }
    
    setIsSaving(true);
    
    try {
      if (company) {
        // Actualizar empresa existente
        const updatedCompany = await updateCompany(company.id, formData);
        setCompany(updatedCompany);
        toast.success("Datos de la empresa actualizados correctamente");
      } else {
        // Crear nueva empresa
        const newCompany = await addCompany(formData);
        setCompany(newCompany);
        toast.success("Empresa creada correctamente");
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Error al guardar los datos de la empresa:", error);
      toast.error("No se pudieron guardar los cambios");
    } finally {
      setIsSaving(false);
    }
  };

  // Cancelar edición
  const handleCancel = () => {
    // Restaurar datos originales
    if (company) {
      setFormData({
        name: company.name || "",
        nif: company.nif || "",
        address: company.address || "",
        city: company.city || "",
        postcode: company.postcode || "",
        country: company.country || "ESP",
        email: company.email || "",
        phone: company.phone || ""
      });
    }
    setErrors({});
    setIsEditing(false);
  };

  // Crear nueva empresa
  const handleCreateCompany = () => {
    setIsEditing(true);
  };

  return (
    <div className="container mx-auto py-6">
      <Toaster position="top-right" />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Datos de Facturación</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona la información de tu empresa para las facturas
        </p>
      </div>
      <Separator className="my-6" />
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Información de Empresa</CardTitle>
          <CardDescription>
            Estos datos se mostrarán en todas tus facturas
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <>
              {!company && !isEditing ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No hay datos de empresa</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Configura los datos de tu empresa para que aparezcan en tus facturas como empresa emisora.
                  </p>
                  <Button onClick={handleCreateCompany}>
                    Configurar empresa
                  </Button>
                </div>
              ) : !isEditing ? (
                <div className="space-y-8">
                  {/* Información General */}
                  <div>
                    <h2 className="text-lg font-medium border-b pb-2 mb-4">
                      Información General
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Nombre de la empresa</h3>
                        <p className="mt-1">{company?.name}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">NIF/CIF</h3>
                        <p className="mt-1">{company?.nif}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Dirección */}
                  <div>
                    <h2 className="text-lg font-medium border-b pb-2 mb-4">
                      Dirección
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Dirección</h3>
                        <p className="mt-1">{company?.address || "-"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Ciudad</h3>
                        <p className="mt-1">{company?.city || "-"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Código Postal</h3>
                        <p className="mt-1">{company?.postcode || "-"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">País</h3>
                        <p className="mt-1">{company?.country || "-"}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Contacto */}
                  <div>
                    <h2 className="text-lg font-medium border-b pb-2 mb-4">
                      Datos de Contacto
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                        <p className="mt-1">{company?.email || "-"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Teléfono</h3>
                        <p className="mt-1">{company?.phone || "-"}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Botones de acción */}
                  <div className="flex justify-end pt-4">
                    <Button onClick={() => setIsEditing(true)}>
                      Editar información
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Información general */}
                  <div>
                    <h2 className="text-lg font-medium border-b pb-2 mb-4">
                      Información General
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className={errors.name ? "text-destructive" : ""}>
                          Nombre de la empresa *
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className={errors.name ? "border-destructive" : ""}
                          placeholder="Nombre de la empresa"
                        />
                        {errors.name && (
                          <p className="text-sm text-destructive">{errors.name}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nif" className={errors.nif ? "text-destructive" : ""}>
                          NIF/CIF *
                        </Label>
                        <Input
                          id="nif"
                          name="nif"
                          value={formData.nif}
                          onChange={handleChange}
                          className={errors.nif ? "border-destructive" : ""}
                          placeholder="B12345678"
                        />
                        {errors.nif && (
                          <p className="text-sm text-destructive">{errors.nif}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Dirección */}
                  <div>
                    <h2 className="text-lg font-medium border-b pb-2 mb-4">
                      Dirección
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="address">
                          Dirección
                        </Label>
                        <Input
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          placeholder="Calle, número, piso..."
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">
                            Ciudad
                          </Label>
                          <Input
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="Ciudad"
                          />
                        </div>
                        <div>
                          <Label htmlFor="postcode">
                            Código Postal
                          </Label>
                          <Input
                            id="postcode"
                            name="postcode"
                            value={formData.postcode}
                            onChange={handleChange}
                            placeholder="28001"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="country">
                          País
                        </Label>
                        <Input
                          id="country"
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          placeholder="ESP"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Contacto */}
                  <div>
                    <h2 className="text-lg font-medium border-b pb-2 mb-4">
                      Datos de Contacto
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="empresa@ejemplo.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">
                          Teléfono
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+34 600 000 000"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Botones de acción */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSaving}
                    >
                      {isSaving ? "Guardando..." : "Guardar cambios"}
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

