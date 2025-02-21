import { CheckCircle2, FileText, Upload, Settings } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function FeaturesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <section className="container py-8 md:py-12 lg:py-24">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h1 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-6xl text-primary">
            Características Completas
          </h1>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Descubre todas las herramientas que necesitas para tu facturación electrónica
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-8 py-12 lg:grid-cols-2">
          <Card className="card-gradient border-0 shadow-lg hover:shadow-xl transition-all duration-200 group">
            <CardHeader>
              <div className="rounded-full bg-blue-50 w-16 h-16 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 feature-icon" />
              </div>
              <CardTitle className="text-primary">Gestión de Facturas</CardTitle>
              <CardDescription>Sistema completo de facturación</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {["Creación de facturas en segundos", "Numeración automática", "Gestión de clientes y productos"].map(
                (feature) => (
                  <div key={feature} className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span>{feature}</span>
                  </div>
                ),
              )}
            </CardContent>
          </Card>

          <Card className="card-gradient border-0 shadow-lg hover:shadow-xl transition-all duration-200 group">
            <CardHeader>
              <div className="rounded-full bg-blue-50 w-16 h-16 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 feature-icon" />
              </div>
              <CardTitle className="text-primary">Plantillas Personalizables</CardTitle>
              <CardDescription>Diseña tus propias facturas</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {["Múltiples plantillas prediseñadas", "Editor visual intuitivo", "Personalización completa"].map(
                (feature) => (
                  <div key={feature} className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span>{feature}</span>
                  </div>
                ),
              )}
            </CardContent>
          </Card>

          <Card className="card-gradient border-0 shadow-lg hover:shadow-xl transition-all duration-200 group">
            <CardHeader>
              <div className="rounded-full bg-blue-50 w-16 h-16 flex items-center justify-center mb-4">
                <Upload className="h-8 w-8 feature-icon" />
              </div>
              <CardTitle className="text-primary">Cumplimiento Normativo</CardTitle>
              <CardDescription>Siempre actualizado con la ley</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {["Facturas según normativa vigente", "Actualizaciones automáticas", "Validación de datos"].map(
                (feature) => (
                  <div key={feature} className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span>{feature}</span>
                  </div>
                ),
              )}
            </CardContent>
          </Card>

          <Card className="card-gradient border-0 shadow-lg hover:shadow-xl transition-all duration-200 group">
            <CardHeader>
              <div className="rounded-full bg-blue-50 w-16 h-16 flex items-center justify-center mb-4">
                <Settings className="h-8 w-8 feature-icon" />
              </div>
              <CardTitle className="text-primary">Importación y Exportación</CardTitle>
              <CardDescription>Gestión de datos flexible</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {["Importación desde Excel", "Exportación a PDF y otros formatos", "Integración con otros sistemas"].map(
                (feature) => (
                  <div key={feature} className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span>{feature}</span>
                  </div>
                ),
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}

