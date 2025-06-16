"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/app/utils/utils";

function LoadingIndicatorContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Cuando cambia la ruta, activamos el indicador de carga
    setIsLoading(true);
    setProgress(0);
    
    // Simulamos un progreso gradual
    const timer1 = setTimeout(() => setProgress(40), 100);
    const timer2 = setTimeout(() => setProgress(70), 300);
    const timer3 = setTimeout(() => setProgress(90), 500);
    
    // Después de un tiempo, consideramos que la página ha cargado
    const finishTimer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => setIsLoading(false), 200); // Pequeño delay antes de ocultar
    }, 800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(finishTimer);
    };
  }, [pathname, searchParams]);

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-1 transition-opacity duration-300",
        isLoading ? "opacity-100" : "opacity-0"
      )}
    >
      <Progress value={progress} className="h-1 w-full rounded-none" />
    </div>
  );
}

export function LoadingIndicator() {
  return (
    <Suspense fallback={null}>
      <LoadingIndicatorContent />
    </Suspense>
  );
}