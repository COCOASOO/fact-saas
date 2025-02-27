"use client";

import * as React from "react";
import { Sidebar, MobileSidebar } from "@/components/sidebar";
import { SaasNavbar } from "@/components/SaasNavbar";
import { cn } from "@/lib/utils/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isExpanded, setIsExpanded] = React.useState(true);

  React.useEffect(() => {
    const stored = localStorage.getItem("sidebarExpanded");
    setIsExpanded(stored === "true");
  }, []);

  const handleSidebarToggle = (expanded: boolean) => {
    setIsExpanded(expanded);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar onToggle={handleSidebarToggle} />
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          isExpanded ? "lg:pl-64" : "lg:pl-16"
        )}
      >
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-4 h-16 flex items-center">
            <MobileSidebar />
            <SaasNavbar />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
