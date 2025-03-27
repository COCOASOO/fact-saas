import { createClient } from "@/lib/supabase/supabaseClient";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { CreateCompanyDTO } from "../routes/companies/route";

// Move the signUp function here
export async function signUp(
  e: React.FormEvent,
  email: string,
  password: string,
  phone: string,
  name: string,
  router: AppRouterInstance,
  companyData?: CreateCompanyDTO
) {
  e.preventDefault();
  
  const supabase = createClient();
  const url = process.env.NEXT_PUBLIC_BASE_URL;

  try {
    // Code from your original signUp function
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

      // 1. Guardamos los datos del usuario
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
        console.error("Error al guardar los datos del usuario:", userError);
        alert("Error al guardar los datos del usuario");
        return;
      }

      // 2. Si hay datos de compañía, los guardamos
      if (companyData && companyData.name && companyData.nif) {
        const { error: companyError } = await supabase
          .from("companies")
          .insert([
            {
              ...companyData,
              user_id: user.id,
              country: companyData.country || "ESP"
            },
          ]);

        if (companyError) {
          console.error("Error al guardar los datos de la empresa:", companyError);
          // Aunque falle la empresa, continuamos con el registro
          alert("Se ha completado el registro, pero hubo un problema al guardar los datos de la empresa. Podrás configurarla más tarde.");
        }
      }

      alert("Se ha enviado un correo de verificación a tu dirección de email.");
      router.push("/pages/auth/login");
    }
  } catch (error) {
    console.error("Error durante el registro:", error);
    alert("Ocurrió un error durante el registro");
  }
}

// Move the signIn function here too
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