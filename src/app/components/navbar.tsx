"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/app/lib/supabase/supabaseClient";
import { User } from "@supabase/supabase-js";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data, error } = await supabase.auth.getUser();
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
      <h1 className="text-lg font-bold">Dashboard</h1>
      <div>
        {user ? (
          <div className="flex items-center gap-4">
            <span>{user.email}</span>
            <button onClick={handleLogout} className="bg-red-500 px-3 py-1 text-white rounded">
              Cerrar Sesión
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
