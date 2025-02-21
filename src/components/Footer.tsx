import Link from "next/link"
import { FileText } from "lucide-react"

export default function Footer() {
  return (
    <footer className="mx-auto border-t bg-background">
      <div className=" flex flex-col gap-8 py-8 md:py-12">
        <div className="flex flex-col gap-6 md:flex-row md:justify-between">
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <FileText className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">FacturaFácil</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-[250px]">
              Simplificando la facturación electrónica para empresas y autónomos
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Producto</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/features" className="text-muted-foreground hover:text-foreground">
                    Características
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-muted-foreground hover:text-foreground">
                    Precios
                  </Link>
                </li>
                <li>
                  <Link href="/guides" className="text-muted-foreground hover:text-foreground">
                    Guías
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Compañía</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about" className="text-muted-foreground hover:text-foreground">
                    Sobre Nosotros
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-muted-foreground hover:text-foreground">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-muted-foreground hover:text-foreground">
                    Contacto
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                    Privacidad
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                    Términos
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} FacturaFácil. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  )
}

