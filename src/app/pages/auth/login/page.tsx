"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/supabaseClient";
import Link from "next/link";
import { signIn } from "@/app/routes/auth/route";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(
      email,
      password,
      setError,
      setIsLoggingIn,
      router
    );
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-600 via-blue-800 to-blue-900 items-center justify-center text-white p-12">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Acme Inc</h2>
          <p className="text-sm text-white/70">Enterprise Solutions</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-sm space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back</h1>
            <p className="text-gray-600 mt-2">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-gray-900 border border-gray-300 
                    focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                    placeholder:text-gray-400 transition-all duration-200"
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-gray-900 border border-gray-300 
                    focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                    placeholder:text-gray-400 transition-all duration-200"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 
                    focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">Remember me</label>
              </div>
              <Link href="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className={`w-full py-2.5 px-4 rounded-lg text-white text-sm font-semibold
                ${isLoggingIn ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"} 
                transition-all duration-200 focus:outline-none focus:ring-2 
                focus:ring-blue-500 focus:ring-offset-2 shadow-lg shadow-blue-600/20`}
            >
              {isLoggingIn ? "Signing in..." : "Sign in"}
            </button>

            <p className="text-center text-sm text-gray-500">
              Don't have an account? {" "}
              <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
