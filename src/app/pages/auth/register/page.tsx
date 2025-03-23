"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/app/routes/auth/route";

export default function SignupPage() {
  const router = useRouter();
  
  // Estado para formulario en pasos
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  // Datos de usuario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  
  // Datos de empresa
  const [companyName, setCompanyName] = useState("");
  const [companyNif, setCompanyNif] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyCity, setCompanyCity] = useState("");
  const [companyPostcode, setCompanyPostcode] = useState("");
  const [companyCountry, setCompanyCountry] = useState("ESP");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  
  // Estado de la UI
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Validación al cambiar de paso
  const validateStep = () => {
    if (currentStep === 1) {
      // Validar datos personales
      if (!name || !email || !password || !confirmPassword || !phone) {
        setError("Por favor, completa todos los campos obligatorios");
        return false;
      }
      
      if (password !== confirmPassword) {
        setError("Las contraseñas no coinciden");
        return false;
      }
      
      if (password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres");
        return false;
      }
      
      setError(null);
      return true;
    }
    return true;
  };

  // Manejo de cambio de paso
  const handleNextStep = () => {
    if (validateStep()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Envío del formulario completo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep()) {
      return;
    }
    
    setIsLoading(true);
    
    // Crear objeto de compañía
    const companyData = {
      name: companyName,
      nif: companyNif,
      address: companyAddress,
      city: companyCity,
      postcode: companyPostcode,
      country: companyCountry,
      email: companyEmail || email, // Usar email personal si no se proporciona
      phone: companyPhone || phone, // Usar teléfono personal si no se proporciona
    };
    
    try {
      await signUp(
        e,
        email,
        password,
        phone,
        name,
        router,
        companyData
      );
    } catch (error) {
      setError("Ocurrió un error durante el registro");
    } finally {
      setIsLoading(false);
    }
  };

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
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Crear tu cuenta
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Paso {currentStep} de {totalSteps}
            </p>
            {/* Indicador de progreso */}
            <div className="mt-4 flex gap-2 justify-center">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    index + 1 <= currentStep ? "bg-blue-600 w-8" : "bg-gray-200 w-6"
                  }`}
                ></div>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Paso 1: Datos personales */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-800">Datos personales</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Nombre completo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg text-gray-900 border border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="Introduce tu nombre"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg text-gray-900 border border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Teléfono <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg text-gray-900 border border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="+34 600 000 000"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Contraseña <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg text-gray-900 border border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Confirmar contraseña <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg text-gray-900 border border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="Repite tu contraseña"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Paso 2: Datos de empresa */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-800">Datos de empresa</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Nombre de empresa <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg text-gray-900 border border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="Nombre de tu empresa"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      NIF / CIF <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={companyNif}
                      onChange={(e) => setCompanyNif(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg text-gray-900 border border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder="B12345678"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Dirección
                      </label>
                      <input
                        type="text"
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg text-gray-900 border border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="Calle, número, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Código postal
                      </label>
                      <input
                        type="text"
                        value={companyPostcode}
                        onChange={(e) => setCompanyPostcode(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg text-gray-900 border border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="28001"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Ciudad
                      </label>
                      <input
                        type="text"
                        value={companyCity}
                        onChange={(e) => setCompanyCity(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg text-gray-900 border border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="Madrid"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        País
                      </label>
                      <input
                        type="text"
                        value={companyCountry}
                        onChange={(e) => setCompanyCountry(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg text-gray-900 border border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="ESP"
                        defaultValue="ESP"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Email de empresa
                      </label>
                      <input
                        type="email"
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg text-gray-900 border border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="contacto@empresa.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Teléfono de empresa
                      </label>
                      <input
                        type="tel"
                        value={companyPhone}
                        onChange={(e) => setCompanyPhone(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg text-gray-900 border border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        placeholder="+34 900 000 000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Botones de navegación */}
            <div className="flex justify-between gap-4">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium transition-all duration-200"
                >
                  Anterior
                </button>
              )}
              
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-white text-sm font-semibold bg-blue-600 hover:bg-blue-700 transition-all duration-200 ${
                    currentStep === 1 && "ml-auto"
                  }`}
                >
                  Siguiente
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 px-4 rounded-lg text-white text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 transition-all duration-200"
                >
                  {isLoading ? "Creando cuenta..." : "Crear cuenta"}
                </button>
              )}
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              ¿Ya tienes cuenta?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Iniciar sesión
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
