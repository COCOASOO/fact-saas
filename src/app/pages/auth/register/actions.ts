import { createClient } from "@/lib/supabase/supabaseClient";
import { NextResponse } from "next/server";


export const handleSignup = async (e: React.FormEvent, email: string, password: string, phone: string, name: string, router: any) => {
  e.preventDefault(); // Asegúrate de prevenir el comportamiento por defecto del formulario

  const supabase = createClient();
  const url = process.env.NEXT_PUBLIC_BASE_URL;

  const userData = {
    email,
    password,
    phone,
    name,
    options: { emailRedirectTo: `${url}/routes/auth/callback` },
  };

  console.log("User data to be signed up:", userData);

  const { error, data } = await supabase.auth.signUp(userData);

  if (data?.user) {
    console.log("Signup successful, user data:", data.user);
    
    // Aquí es donde debes asegurarte de que el usuario esté autenticado
    const { user } = data;

    // Verifica que el usuario tenga el rol adecuado
    if (user.role === 'authenticated') {
      const { error: userError } = await supabase
          .from("users")
          .insert([
              {
                  email: user.email,
                  name: name,
                  phone: phone,
                  auth_uuid:user.id
              },
          ]);
      
      if (userError) {
          console.error("Error inserting user data:", userError.message);
          return NextResponse.json({ error: "Error inserting user data" });
      }
    } else {
      console.error("User does not have permission to insert data.");
      return NextResponse.json({ error: "User does not have permission to insert data." });
    }
  } else {
    console.error("Signup error:", error);
  }

  if (error) {
    alert(error.message);
  } else {
    alert("A verification email has been sent to your email address.");
    router.push("/auth/login");
  }
};
