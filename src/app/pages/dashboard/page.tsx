"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/lib/supabase/supabaseClient";
import { User } from "@supabase/supabase-js";
import { getUserByAuthUuid } from "@/app/lib/database/users";
import { data } from "autoprefixer";



export default function Dashboard() {
    const [user, setUser] = useState<User | null>(null); 
    const router = useRouter();
    const supabase = createClient(); 

    useEffect(() => {
        async function getUser2() {
            const { data, error } = await supabase.auth.getUser();
            if (data.user?.id) {
                if (typeof data.user.id === 'string') {
                    getUserByAuthUuid(data.user.id);
                } else {
                    console.error("El ID del usuario no es una cadena:", data.user.id);
                }
            }
        }
        getUser2();
    }, []);

    useEffect(() => {
        async function getUser() {
            const { data, error } = await supabase.auth.getUser();
            if (error || !data.user) {
                router.push("/pages/auth/login");
            } else {
                setUser(data.user);
            }
        }
        getUser();
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            {user && <p>Bienvenido, {user.email}</p>}
        </div>
    );
}
