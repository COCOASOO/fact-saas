"use client"

import { useState, useEffect, ChangeEvent, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Company } from "@/app/utils/companies"

interface CompanyFormProps {
  company?: Company
  onSubmit: (company: Company) => void
  onCancel: () => void
}

interface FormErrors {
  name?: string
  nif?: string
  address?: string
  city?: string
  postcode?: string
  country?: string
  email?: string
  phone?: string
}

const emptyCompany: Company = {
  id: "",
  name: "",
  nif: "",
  address: "",
  city: "",
  postcode: "",
  country: "ESP",
  email: "",
  phone: "",
  user_id: "",
  created_at: "",
  updated_at: ""
}

export function CompanyForm({ company = emptyCompany, onSubmit, onCancel }: CompanyFormProps) {
  const [formData, setFormData] = useState<Company>(company)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (company) {
      setFormData(company)
    }
  }, [company])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es obligatorio"
    }

    if (!formData.nif.trim()) {
      newErrors.nif = "El NIF es obligatorio"
    } else if (!/^[A-Z0-9]{9}$/.test(formData.nif.toUpperCase())) {
      newErrors.nif = "El formato del NIF no es válido"
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "El formato del email no es válido"
    }

    if (formData.phone && !/^[0-9]{9}$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "El formato del teléfono no es válido"
    }

    if (formData.postcode && !/^[0-9]{5}$/.test(formData.postcode)) {
      newErrors.postcode = "El código postal debe tener 5 dígitos"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (validateForm()) {
      onSubmit(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6 py-4">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información Básica</h3>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre de la Empresa</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="nif">NIF</Label>
                  <Input
                    id="nif"
                    name="nif"
                    value={formData.nif}
                    onChange={handleChange}
                    className={errors.nif ? "border-red-500" : ""}
                  />
                  {errors.nif && <p className="text-red-500 text-sm">{errors.nif}</p>}
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
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
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
                  {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
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
                  {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}
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
                    {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}
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
                    {errors.postcode && <p className="text-red-500 text-sm">{errors.postcode}</p>}
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
                  {errors.country && <p className="text-red-500 text-sm">{errors.country}</p>}
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
        <Button type="submit">{company === emptyCompany ? "Crear Empresa" : "Guardar Cambios"}</Button>
      </DialogFooter>
    </form>
  )
}

