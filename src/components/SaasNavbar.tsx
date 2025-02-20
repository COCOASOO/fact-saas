"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/app/lib/supabase/supabaseClient";
import Link from "next/link";
import { User } from "@supabase/supabase-js";

export default function SaasNavbar() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data, error } = await supabase.auth.getUser();
      if (error) console.error("Error al obtener el usuario:", error.message);
      if (data.user) setUser(data.user);
    }
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  return (
    <header className="bg-white p-4 shadow flex justify-between items-center">
      {/* Logo */}
      <Link href="/" className="text-lg font-bold text-blue-600">
        Mi App
      </Link>

      {/* Navegación */}
      <nav className="flex gap-6">
        <Link href="/" className="text-gray-600 hover:text-blue-600">
          Inicio
        </Link>
        {user && (
          <Link href="/pages/dashboard" className="text-gray-600 hover:text-blue-600">
            Dashboard
          </Link>
        )}
      </nav>

      {/* Autenticación */}
      <div>
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-gray-700">{user.email}</span>
            <button onClick={handleLogout} className="bg-red-500 px-3 py-1 text-white rounded">
              Cerrar Sesión
            </button>
          </div>
        ) : (
          <div className="flex gap-4">
            <Link href="/auth/login" className="bg-blue-500 px-4 py-2 text-white rounded">
              Iniciar Sesión
            </Link>
            <Link href="/auth/register" className="border border-blue-500 px-4 py-2 text-blue-500 rounded">
              Registrarse
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
