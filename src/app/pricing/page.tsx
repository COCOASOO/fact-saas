import Link from "next/link"
import { CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

const plans = [
  {
    name: "Básico",
    description: "Perfecto para autónomos y pequeñas empresas",
    price: "9.99",
    features: ["Hasta 50 facturas mensuales", "2 plantillas personalizables", "Exportación PDF", "Soporte por email"],
  },
  {
    name: "Profesional",
    description: "Ideal para empresas en crecimiento",
    price: "29.99",
    features: [
      "Facturas ilimitadas",
      "Plantillas ilimitadas",
      "Importación de datos",
      "Soporte prioritario",
      "API access",
    ],
    popular: true,
  },
  {
    name: "Empresa",
    description: "Para grandes empresas con necesidades específicas",
    price: "99.99",
    features: [
      "Todo lo del plan Profesional",
      "Múltiples usuarios",
      "Personalización avanzada",
      "Soporte 24/7",
      "Integración personalizada",
    ],
  },
]

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <section className="container py-8 md:py-12 lg:py-24">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h1 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-6xl text-primary">
            Planes Simples, Precios Transparentes
          </h1>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Elige el plan que mejor se adapte a tus necesidades
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 py-12 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`pricing-card card-gradient border-0 ${
                plan.popular ? "shadow-xl shadow-blue-500/10" : "shadow-lg"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-5 left-0 right-0 mx-auto w-fit">
                  <span className="bg-primary text-white text-sm font-medium px-4 py-1.5 rounded-full">
                    Más Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl text-primary">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-primary">
                  {plan.price}€<span className="text-sm font-normal text-muted-foreground">/mes</span>
                </div>
                <ul className="mt-4 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Link href="/auth/register" className="w-full">
                  <Button
                    variant={plan.popular ? "default" : "outline"}
                    className={`w-full ${plan.popular ? "bg-primary hover:bg-primary/90" : "hover:bg-primary/10"}`}
                  >
                    Empezar Ahora
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}

