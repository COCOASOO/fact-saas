import React from "react";
import { cn } from "@/lib/utils/utils";
import { X } from "lucide-react";

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function SidePanel({
  isOpen,
  onClose,
  title,
  description,
  className,
  children,
  footer
}: SidePanelProps) {
  if (!isOpen) return null;
  
  return (
    <div
      className={cn(
        "bg-background h-full border-l shadow-lg w-[550px] flex flex-col overflow-hidden transition-all duration-300",
        isOpen ? "translate-x-0" : "translate-x-full",
        className
      )}
    >
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <button 
            onClick={onClose} 
            className="rounded-full p-1 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Cerrar</span>
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {children}
      </div>
      
      {/* Footer */}
      {footer && (
        <div className="p-6 border-t">
          {footer}
        </div>
      )}
    </div>
  );
}