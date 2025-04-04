"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
  Building2,
  ListOrdered,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/app/utils/utils";
import { LoadingIndicator } from "@/components/loading-indicator";
import "./../app/styles.css";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  {
    href: "/pages/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    href: "/pages/dashboard/invoices",
    icon: FileText,
    label: "Facturas",
  },
  {
    href: "/pages/dashboard/invoice-series",
    icon: ListOrdered,
    label: "Series de Facturación",
  },
  {
    href: "/pages/dashboard/clients",
    icon: Users,
    label: "Clientes",
  },
  {
    href: "/pages/dashboard/companies",
    icon: Building2,
    label: "Datos empresa",
  },
  {
    href: "/pages/dashboard/settings",
    icon: Settings,
    label: "Configuración",
  },
];

interface SidebarProps {
  className?: string;
  onToggle?: (expanded: boolean) => void;
}

export function Sidebar({ className, onToggle }: SidebarProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const [activeNavigation, setActiveNavigation] = React.useState<string | null>(null);

  React.useEffect(() => {
    const stored = localStorage.getItem("sidebarExpanded");
    if (stored !== null) {
      setIsExpanded(stored === "true");
    }
  }, []);

  // Reset activeNavigation cuando cambia la ruta
  React.useEffect(() => {
    setActiveNavigation(null);
  }, [pathname]);

  const toggleSidebar = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem("sidebarExpanded", String(newState));
    onToggle?.(newState);
  };

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setActiveNavigation(href);
    router.push(href);
  };

  return (
    <>
      <LoadingIndicator />
      <nav
        className={cn(
          "fixed inset-y-0 left-0 z-50 hidden h-screen border-r bg-background transition-all duration-300 ease-in-out lg:block",
          isExpanded ? "w-64" : "w-16",
          className
        )}
      >
        <div className="flex h-full flex-col gap-4 ">
          <div className="flex h-16 items-center justify-between border-b px-4 mt-1px">
            {isExpanded && (
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6" />
                <span className="font-semibold">Facturación</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleSidebar}
            >
              {isExpanded ? <ChevronLeft /> : <ChevronRight />}
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
          </div>
          <ScrollArea className="flex-1 px-3">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavigation(e, item.href)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground",
                    pathname === item.href && "bg-muted font-medium",
                    activeNavigation === item.href && "opacity-70",
                    !isExpanded && "justify-center"
                  )}
                >
                  {activeNavigation === item.href ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <item.icon className="h-4 w-4" />
                  )}
                  {isExpanded && (
                    <span className="flex-1">
                      {item.label}
                      {activeNavigation === item.href && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          cargando...
                        </span>
                      )}
                    </span>
                  )}
                  {!isExpanded && <span className="sr-only">{item.label}</span>}
                </a>
              ))}
            </div>
          </ScrollArea>
        </div>
      </nav>
    </>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [activeNavigation, setActiveNavigation] = React.useState<string | null>(null);

  // Reset activeNavigation cuando cambia la ruta
  React.useEffect(() => {
    setActiveNavigation(null);
  }, [pathname]);

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setActiveNavigation(href);
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <LoadingIndicator />
      <Sheet open={open} onOpenChange={setOpen}>
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 lg:hidden"
          onClick={() => setOpen(true)}
        >
          <ChevronRight className="h-6 w-6" />
          <span className="sr-only">Open Sidebar</span>
        </Button>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-full flex-col gap-4">
            <SheetHeader className="h-16 border-b px-6">
              <SheetTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6" />
                <span className="font-semibold">Facturación</span>
              </SheetTitle>
            </SheetHeader>
            <ScrollArea className="flex-1 px-3">
              <div className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={(e) => handleNavigation(e, item.href)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground",
                      pathname === item.href && "bg-muted font-medium",
                      activeNavigation === item.href && "opacity-70"
                    )}
                  >
                    {activeNavigation === item.href ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <item.icon className="h-4 w-4" />
                    )}
                    <span className="flex-1">
                      {item.label}
                      {activeNavigation === item.href && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          cargando...
                        </span>
                      )}
                    </span>
                  </a>
                ))}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
