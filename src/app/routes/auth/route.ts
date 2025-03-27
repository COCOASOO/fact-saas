import { createClient } from "@/lib/supabase/supabaseClient";
import { NextRequest, NextResponse } from "next/server";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { CreateCompanyDTO } from "../companies/route";

const supabase = createClient();

// Mantenemos el endpoint POST para posibles llamadas API externas o necesidades futuras
export async function POST(request: NextRequest) {
  const { action, email, password, phone, name, companyData } = await request.json();
  const url = process.env.NEXT_PUBLIC_BASE_URL;

  switch (action) {
    case 'signup':
      try {
        const userData = {
          email,
          password,
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

          // Si hay datos de compañía, los guardamos
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
              // Continuamos aunque falle la empresa
            }
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
      
    // Add other cases as needed
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
}
