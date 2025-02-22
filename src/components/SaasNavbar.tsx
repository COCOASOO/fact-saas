"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { LogOut } from 'lucide-react'
import { User } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/supabaseClient"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export function SaasNavbar() {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const { data, error } = await supabase.auth.getUser()
      if (error) console.error("Error al obtener el usuario:", error.message)
      if (data.user) setUser(data.user)
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/auth/login"
  }

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-between">
        <nav className="flex items-center gap-4">
          <Link href="/" className="text-sm font-medium text-primary">
            Mi App
          </Link>
          <Separator orientation="vertical" className="h-4" />
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            Inicio
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/auth/register">Registrarse</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/auth/login">Iniciar Sesión</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 items-center justify-between">
      <nav className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-primary"
        >
          Dashboard
        </Link>
        <Separator orientation="vertical" className="h-3" />
        <span className="text-sm text-muted-foreground">{user.email}</span>
      </nav>
      <Button
        variant="destructive"
        size="sm"
        className="gap-2"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
        Cerrar Sesión
      </Button>
    </div>
  )
}