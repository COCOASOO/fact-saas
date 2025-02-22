"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/supabaseClient";
import Link from "next/link";
import { handleSignup } from "./actions";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const url = process.env.NEXT_PUBLIC_BASE_URL;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-600 via-blue-800 to-blue-900">
        <div className="absolute inset-0 opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-600/20 to-blue-900/40"></div>
        <div className="relative w-full max-w-2xl mx-auto flex flex-col h-full p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-lg">
              A
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Acme Inc</h2>
              <p className="text-sm text-white/70">Enterprise Solutions</p>
            </div>
          </div>
          <div className="mt-auto space-y-8">
            {["Secure Platform", "24/7 Support", "Free Updates"].map(
              (title, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-lg">
                    ✔
                  </div>
                  <div>
                    <h3 className="font-medium">{title}</h3>
                    <p className="text-sm text-white/70">
                      Lorem ipsum description.
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-sm space-y-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Create your account
          </h1>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSignup(e, email, password, phone, name, router);
            }}
            className="space-y-6"
          >
            {error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
                {error}
              </div>
            )}
            {["Name", "Email", "Password", "Phone"].map((label, index) => (
              <div key={index} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {label}
                </label>
                <input
                  name={
                    label === "Name"
                      ? "name"
                      : label === "Email"
                      ? "email"
                      : label === "Password"
                      ? "password"
                      : "phone"
                  }
                  type={label === "Password" ? "password" : "text"}
                  value={
                    label === "Name"
                      ? name
                      : label === "Email"
                      ? email
                      : label === "Password"
                      ? password
                      : phone
                  }
                  onChange={(e) => {
                    if (label === "Name") setName(e.target.value);
                    else if (label === "Email") setEmail(e.target.value);
                    else if (label === "Password") setPassword(e.target.value);
                    else setPhone(e.target.value);
                  }}
                  className="w-full px-4 py-2.5 rounded-lg text-gray-900 border border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 transition-all duration-200"
                  placeholder={label}
                  required
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2.5 px-4 rounded-lg text-white text-sm font-semibold ${
                isLoading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
              } transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg shadow-blue-600/20`}
            >
              {isLoading ? "Creating account..." : "Create account"}
            </button>
            <p className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
