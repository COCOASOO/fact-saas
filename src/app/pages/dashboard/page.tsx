"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/supabaseClient";
import { User } from "@supabase/supabase-js";
import { data } from "autoprefixer";



export default function Dashboard() {
    const [user, setUser] = useState<User | null>(null); 
    const router = useRouter();
    const supabase = createClient(); 

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            {user && <p>Bienvenido, {user.email}</p>}
        </div>
    );
}
