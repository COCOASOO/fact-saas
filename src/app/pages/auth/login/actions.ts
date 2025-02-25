import { createClient } from "@/lib/supabase/supabaseClient";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useRouter } from 'next/router';

export const handleLogin = async (
  email: string,
  password: string,
  setError: (error: string | null) => void,
  setIsLoggingIn: (isLoggingIn: boolean) => void,
  router: AppRouterInstance
) => {
  const supabase = createClient();
  setIsLoggingIn(true);
  setError(null);

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  setIsLoggingIn(false);

  if (error) {
    setError(error.message);
  } else {
    router.push("/pages/dashboard");
  }
};
