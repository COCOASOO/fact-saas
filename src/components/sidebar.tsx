"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, ChevronLeft, ChevronRight, FileText, Settings, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
  },
  {
    title: "Facturas",
    href: "/dashboard/invoices",
    icon: FileText,
  },
  {
    title: "Clientes",
    href: "/dashboard/clients",
    icon: Users,
  },
  {
    title: "Configuración",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = React.useState(true)

  React.useEffect(() => {
    const stored = localStorage.getItem("sidebarExpanded")
    if (stored !== null) {
      setIsExpanded(stored === "true")
    }
  }, [])

  const toggleSidebar = () => {
    const newState = !isExpanded
    setIsExpanded(newState)
    localStorage.setItem("sidebarExpanded", String(newState))
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 hidden border-r bg-background transition-all duration-300 ease-in-out lg:flex lg:flex-col",
        isExpanded ? "w-64" : "w-16",
      )}
    >
      <div className="flex flex-col gap-4 p-4">
        <div className="flex h-12 items-center justify-between">
          {isExpanded && <h2 className="text-lg font-semibold">Facturación</h2>}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleSidebar}>
            {isExpanded ? <ChevronLeft /> : <ChevronRight />}
            <span className="sr-only">{isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}</span>
          </Button>
        </div>
        <TooltipProvider delayDuration={0}>
          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Button
                      asChild
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-2",
                        isActive && "bg-secondary",
                        !isExpanded && "justify-center px-2",
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        {isExpanded && <span>{item.title}</span>}
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  {!isExpanded && <TooltipContent side="right">{item.title}</TooltipContent>}
                </Tooltip>
              )
            })}
          </nav>
        </TooltipProvider>
      </div>
    </aside>
  )
}

