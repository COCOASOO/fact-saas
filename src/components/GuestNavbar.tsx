"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/app/lib/supabase/supabaseClient";
import Link from "next/link";
import { User } from "@supabase/supabase-js";

export default function GuestNavbar() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function checkUser() {
      const { data, error } = await supabase.auth.getUser();
      if (data.user) setUser(data.user);
    }
    checkUser();
  }, []);

  return (
    <header className="bg-white p-4 shadow flex justify-between items-center">
      <Link href="/" className="text-lg font-bold text-blue-600">
        Mi SaaS
      </Link>

      <nav className="flex gap-6">
        <Link href="/" className="text-gray-600 hover:text-blue-600">
          Inicio
        </Link>
        <Link href="/features" className="text-gray-600 hover:text-blue-600">
          Características
        </Link>
        <Link href="/pricing" className="text-gray-600 hover:text-blue-600">
          Precios
        </Link>
      </nav>

      <div>
        {user ? (
          <Link href="/dashboard" className="bg-blue-500 px-4 py-2 text-white rounded">
            Ir al Dashboard
          </Link>
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
