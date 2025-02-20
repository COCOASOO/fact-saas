"use client";

import { useState } from "react";
import { createClient } from "@/app/lib/supabase/supabaseClient";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Check your email for the reset link!");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form onSubmit={handleResetPassword} className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4">Reset Password</h2>

        {error && <p className="text-red-500">{error}</p>}
        {message && <p className="text-green-500">{message}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 mb-4"
          required
        />
        <button type="submit" className="w-full bg-yellow-500 text-white p-2 rounded">
          Send Reset Link
        </button>
      </form>
    </div>
  );
}
