import React, { useEffect } from "react";
import { cn } from "@/app/utils/utils";

interface OverlayProps {
  isOpen: boolean;
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
  disableClose?: boolean;
}

export function Overlay({ 
  isOpen, 
  onClick, 
  className, 
  children,
  disableClose = false
}: OverlayProps) {
  // Controlar el scroll del body cuando el overlay está abierto
  useEffect(() => {
    if (isOpen) {
      // Guardar la posición actual del scroll
      const scrollY = window.scrollY;
      
      // Bloquear el scroll del body
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      // Ocultar el sidebar
      const sidebar = document.querySelector('nav'); // Selector para el sidebar
      if (sidebar) {
        sidebar.setAttribute('data-hidden', 'true');
        sidebar.classList.add('opacity-0', 'pointer-events-none');
      }
      
      // Añadir un atributo personalizado en el body para controlar los z-index globalmente
      document.body.setAttribute('data-overlay-open', 'true');
      
      return () => {
        // Restaurar scroll cuando se desmonta
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
        
        // Mostrar el sidebar de nuevo
        if (sidebar) {
          sidebar.removeAttribute('data-hidden');
          sidebar.classList.remove('opacity-0', 'pointer-events-none');
        }
        
        // Eliminar el atributo personalizado
        document.body.removeAttribute('data-overlay-open');
      };
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className={cn(
        "fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm transition-all duration-200",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        className
      )}
      onClick={disableClose ? undefined : onClick}
      // Añadir un id específico para poder hacer referencia a él
      id="global-overlay-container"
    >
      {/* Si hay children, evitar que los clicks se propaguen al overlay */}
      {children && (
        <div 
          className="h-full w-full flex"
          onClick={(e) => e.stopPropagation()}
          style={{ 
            isolation: 'isolate', 
            position: 'relative',
            zIndex: 10 
          }}
          id="overlay-content-container"
        >
          {children}
        </div>
      )}
    </div>
  );
}