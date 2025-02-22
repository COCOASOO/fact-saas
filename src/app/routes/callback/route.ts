import { createClient } from "@/lib/supabase/supabaseServer";
import { redirect } from "next/navigation";

export async function GET(request:Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next');

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && next) {
            redirect(next);
        }
    }

    redirect('/auth/login');
}