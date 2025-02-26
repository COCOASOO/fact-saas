import { createClient } from "@/lib/supabase/supabaseClient";
import { NextRequest, NextResponse } from "next/server";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

// Función para el registro de usuarios
export async function signUp(
  e: React.FormEvent,
  email: string,
  password: string,
  phone: string,
  name: string,
  router: AppRouterInstance
) {
  e.preventDefault();
  
  const supabase = createClient();
  const url = process.env.NEXT_PUBLIC_BASE_URL;

  try {
    // Primero verificamos si el usuario ya existe
    const { data: existingUser } = await supabase
      .from('users')
      .select()
      .eq('email', email)
      .single();

    if (existingUser) {
      alert('Este correo electrónico ya está registrado');
      return;
    }

    const userData = {
      email,
      password,
      phone,
      name,
      options: { emailRedirectTo: `${url}/routes/auth/callback` },
    };

    const { error, data } = await supabase.auth.signUp(userData);

    if (error) {
      // Manejamos específicamente el error de rate limit
      if (error.message.includes('security purposes')) {
        alert('Por favor, espera un momento antes de intentar registrarte nuevamente');
      } else {
        alert(error.message);
      }
      return;
    }

    if (data?.user) {
      const { user } = data;

      const { error: userError } = await supabase
        .from("users")
        .insert([
          {
            email: user.email,
            name: name,
            phone: phone,
            user_id: user.id
          },
        ]);
      
      if (userError) {
        console.error("Error inserting user data:", userError.message);
        alert("Error al guardar los datos del usuario");
        return;
      }

      alert("Se ha enviado un correo de verificación a tu dirección de email.");
      router.push("/pages/auth/login");
    }
  } catch (error) {
    console.error("Error en el registro:", error);
    alert("Ocurrió un error durante el registro");
  }
}

// Función para el login de usuarios
export async function signIn(
  email: string,
  password: string,
  setError: (error: string | null) => void,
  setIsLoggingIn: (isLoggingIn: boolean) => void,
  router: AppRouterInstance
) {
  const supabase = createClient();
  setIsLoggingIn(true);
  setError(null);

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      router.push("/pages/dashboard");
    }
  } catch (error) {
    setError('An unexpected error occurred');
  } finally {
    setIsLoggingIn(false);
  }
}

// Mantenemos el endpoint POST para posibles llamadas API externas o necesidades futuras
export async function POST(request: NextRequest) {
    const { action, email, password, phone, name } = await request.json();
    const supabase = createClient();
    const url = process.env.NEXT_PUBLIC_BASE_URL;

    switch (action) {
        case 'signup':
            try {
                const userData = {
                    email,
                    password,
                    phone,
                    name,
                    options: { emailRedirectTo: `${url}/routes/auth/callback` },
                };

                const { error, data } = await supabase.auth.signUp(userData);

                if (error) {
                    return NextResponse.json({ error: error.message }, { status: 400 });
                }

                if (data?.user) {
                    const { user } = data;

                    // Insertar datos del usuario en la tabla users
                    const { error: userError } = await supabase
                        .from("users")
                        .insert([
                            {
                                email: user.email,
                                name: name,
                                phone: phone,
                                user_id: user.id
                            },
                        ]);

                    if (userError) {
                        return NextResponse.json({ error: "Error inserting user data" }, { status: 500 });
                    }

                    return NextResponse.json({ 
                        message: "Signup successful", 
                        redirectTo: "/pages/auth/login" 
                    });
                }
            } catch (error) {
                return NextResponse.json({ error: "Internal server error" }, { status: 500 });
            }
            break;

        case 'login':
            try {
                const { error, data } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) {
                    return NextResponse.json({ error: error.message }, { status: 400 });
                }

                return NextResponse.json({ 
                    message: "Login successful", 
                    redirectTo: "/pages/dashboard" 
                });
            } catch (error) {
                return NextResponse.json({ error: "Internal server error" }, { status: 500 });
            }
            break;

        default:
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
}
