"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";
import { useTheme } from "@/context/theme-context";
import { getCurrentUser } from "@/app/utils/users";
import { createClient } from "@/lib/supabase/supabaseClient";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User as UserIcon, Palette, Shield, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Settings() {
  const router = useRouter();
  const { contrast, fontSize, compactMode, setContrast, setFontSize, setCompactMode } = useTheme();
  const supabase = createClient();
  
  // Estados para las diferentes secciones
  const [userSettings, setUserSettings] = useState({
    name: "",
    email: "",
    phone: ""
  });

  // Estados para cambio de contraseña
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordErrors, setPasswordErrors] = useState<{[key: string]: string}>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Estados para cambios y guardado
  const [isLoading, setIsLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState("profile");
  const [loadingUser, setLoadingUser] = useState(true);

  // Cargar datos del usuario
  useEffect(() => {
    async function loadUserData() {
      try {
        setLoadingUser(true);
        const user = await getCurrentUser();
        setUserSettings({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || ""
        });
      } catch (error) {
        console.error("Error al cargar datos del usuario:", error);
        toast.error("No se pudieron cargar tus datos");
      } finally {
        setLoadingUser(false);
      }
    }

    loadUserData();
  }, []);

  // Manejo de cambios
  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserSettings(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  // Validar y cambiar contraseña
  const validatePasswordChange = () => {
    const errors: {[key: string]: string} = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = "Ingresa tu contraseña actual";
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = "Ingresa una nueva contraseña";
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = "La contraseña debe tener al menos 6 caracteres";
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Las contraseñas no coinciden";
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const changePassword = async () => {
    if (!validatePasswordChange()) return;
    
    setIsChangingPassword(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });
      
      if (error) throw error;
      
      toast.success("Contraseña actualizada correctamente");
      setShowPasswordDialog(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error: any) {
      console.error("Error al cambiar contraseña:", error);
      toast.error(error.message || "No se pudo actualizar la contraseña");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Guardar cambios del perfil
  const saveUserProfile = async () => {
    setIsLoading(true);
    
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('No authenticated user');
      
      // Actualizar nombre en la tabla users
      const { error: profileError } = await supabase
        .from('users')
        .update({
          name: userSettings.name,
          phone: userSettings.phone
        })
        .eq('user_id', authUser.id);
      
      if (profileError) throw profileError;
      
      toast.success("Perfil actualizado correctamente");
    } catch (error) {
      console.error("Error al guardar perfil:", error);
      toast.error("No se pudieron guardar los cambios");
    } finally {
      setIsLoading(false);
    }
  };

  // Guardar cambios de apariencia
  const saveAppearanceChanges = () => {
    setIsLoading(true);
    
    // Simulamos una pequeña espera para dar feedback visual
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Configuración de apariencia aplicada correctamente");
    }, 500);
  };

  // Función auxiliar para obtener el nombre de la sección
  const getSectionName = (section: string): string => {
    switch (section) {
      case "profile": return "perfil";
      case "appearance": return "apariencia";
      default: return section;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Toaster position="top-right" />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground mt-2">
          Personaliza tu experiencia y preferencias de la aplicación
        </p>
      </div>

      <Tabs 
        defaultValue="profile" 
        value={currentTab}
        onValueChange={setCurrentTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 mb-8">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Apariencia</span>
          </TabsTrigger>
        </TabsList>

        {/* Contenido de la pestaña Perfil */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Perfil de Usuario</CardTitle>
              <CardDescription>
                Gestiona tu información personal y de contacto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingUser ? (
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-6 bg-gray-200 animate-pulse rounded"></div>
                  <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
                </div>
              ) : (
                <>
                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre</Label>
                      <Input 
                        id="name" 
                        name="name" 
                        value={userSettings.name} 
                        onChange={handleUserChange} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        name="email" 
                        value={userSettings.email} 
                        disabled 
                      />
                      <p className="text-sm text-muted-foreground">
                        El email no se puede cambiar directamente.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input 
                        id="phone" 
                        name="phone" 
                        type="tel" 
                        value={userSettings.phone} 
                        onChange={handleUserChange} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Seguridad</Label>
                      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="w-full justify-start text-muted-foreground"
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Cambiar contraseña
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Cambiar contraseña</DialogTitle>
                            <DialogDescription>
                              Ingresa tu contraseña actual y la nueva contraseña
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="currentPassword">Contraseña actual</Label>
                              <Input 
                                id="currentPassword"
                                name="currentPassword"
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                className={passwordErrors.currentPassword ? "border-red-500" : ""}
                              />
                              {passwordErrors.currentPassword && (
                                <p className="text-sm text-red-500">{passwordErrors.currentPassword}</p>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="newPassword">Nueva contraseña</Label>
                              <Input 
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                className={passwordErrors.newPassword ? "border-red-500" : ""}
                              />
                              {passwordErrors.newPassword && (
                                <p className="text-sm text-red-500">{passwordErrors.newPassword}</p>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                              <Input 
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                className={passwordErrors.confirmPassword ? "border-red-500" : ""}
                              />
                              {passwordErrors.confirmPassword && (
                                <p className="text-sm text-red-500">{passwordErrors.confirmPassword}</p>
                              )}
                            </div>
                          </div>
                          
                          <DialogFooter>
                            <Button 
                              variant="outline" 
                              onClick={() => setShowPasswordDialog(false)}
                            >
                              Cancelar
                            </Button>
                            <Button 
                              onClick={changePassword}
                              disabled={isChangingPassword}
                            >
                              {isChangingPassword ? "Cambiando..." : "Cambiar contraseña"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={saveUserProfile}
                disabled={isLoading || loadingUser}
              >
                {isLoading ? "Guardando..." : "Guardar cambios"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Contenido de la pestaña Apariencia */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Apariencia</CardTitle>
              <CardDescription>
                Personaliza la apariencia de la aplicación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="contrast-mode">Modo alto contraste</Label>
                    <p className="text-sm text-muted-foreground">
                      Aumenta el contraste para mejor legibilidad
                    </p>
                  </div>
                  <Switch 
                    id="contrast-mode"
                    checked={contrast}
                    onCheckedChange={setContrast}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="font-size">Tamaño de fuente</Label>
                  <Select 
                    value={fontSize}
                    onValueChange={(value) => setFontSize(value as "small" | "medium" | "large")}
                  >
                    <SelectTrigger id="font-size">
                      <SelectValue placeholder="Selecciona un tamaño" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Pequeño</SelectItem>
                      <SelectItem value="medium">Mediano</SelectItem>
                      <SelectItem value="large">Grande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="compact-mode">Modo compacto</Label>
                    <p className="text-sm text-muted-foreground">
                      Reduce el espaciado para mostrar más contenido
                    </p>
                  </div>
                  <Switch 
                    id="compact-mode"
                    checked={compactMode}
                    onCheckedChange={setCompactMode}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={saveAppearanceChanges}
                disabled={isLoading}
              >
                {isLoading ? "Aplicando..." : "Aplicar cambios"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

