"use client";

import { useAuth } from "@/app/contexts/authContext";

export default function Dashboard() {
    const {user} = useAuth();

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            {user && <p>Bienvenido, {user.email}</p>}
        </div>
    );
}
