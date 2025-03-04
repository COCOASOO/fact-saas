import { createClient } from "@/lib/supabase/supabaseClient";

export interface Company {
  id: string;
  name: string;
  nif: string;
  address?: string;
  city?: string;
  postcode?: string;
  country: string;
  email?: string;
  phone?: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCompanyDTO {
  name: string;
  nif: string;
  address?: string;
  city?: string;
  postcode?: string;
  country?: string;
  email?: string;
  phone?: string;
}

export interface UpdateCompanyDTO extends Partial<CreateCompanyDTO> {}

const supabase = createClient();

// Función auxiliar para obtener el user_id actual
async function getCurrentUserId() {
  console.log("🔍 Obteniendo usuario actual...");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log("👤 Usuario auth encontrado:", user);

  if (!user) {
    console.error("❌ No hay usuario autenticado");
    throw new Error("No hay usuario autenticado");
  }
  console.log("✅ ID de usuario:", user.id);
  return user.id;
}

export async function getCompanies() {
  try {
    const userId = await getCurrentUserId();

    const { data: companies, error } = await supabase
      .from("companies")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    return companies as Company[];
  } catch (error) {
    throw error;
  }
}

export async function getUserCompany() {
  try {
    const userId = await getCurrentUserId();
    const { data: company, error } = await supabase
      .from("companies")
      .select("*")
      .eq("user_id", userId)
      .single();

      console.log("LA COMPANY: ", company)
    return company as Company;
  } catch (error) {
    console.error("❌ Error en getUserCompany:", error);
    throw error;
  }
}

export async function getCompanyById(id: string) {
  console.group(`🔍 getCompanyById(${id})`);
  try {
    const userId = await getCurrentUserId();
    console.log("Buscando empresa con ID:", id, "para user_id:", userId);

    const { data: company, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("❌ Error al obtener empresa:", error);
      throw error;
    }

    console.log("✅ Empresa encontrada:", company);
    console.groupEnd();
    return company as Company;
  } catch (error) {
    console.error("❌ Error en getCompanyById:", error);
    console.groupEnd();
    throw error;
  }
}

export async function addCompany(company: CreateCompanyDTO) {
  try {
    const userId = await getCurrentUserId();

    const companyData = {
      ...company,
      user_id: userId,
      country: company.country || "ESP",
    };

    const { data, error } = await supabase
      .from("companies")
      .insert([companyData])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("Ya existe una empresa con este NIF");
      }
      throw error;
    }

    return data as Company;
  } catch (error) {
    throw error;
  }
}

export async function updateCompany(id: string, company: UpdateCompanyDTO) {
  console.group(`📝 updateCompany(${id})`);
  try {
    console.log("Datos a actualizar:", company);
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from("companies")
      .update(company)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("❌ Error al actualizar empresa:", error);
      if (error.code === "23505") {
        throw new Error("Ya existe una empresa con este NIF");
      }
      throw error;
    }

    console.log("✅ Empresa actualizada:", data);
    console.groupEnd();
    return data as Company;
  } catch (error) {
    console.error("❌ Error en updateCompany:", error);
    console.groupEnd();
    throw error;
  }
}

export async function deleteCompany(id: string) {
  console.group(`🗑️ deleteCompany(${id})`);
  try {
    const userId = await getCurrentUserId();
    console.log("Eliminando empresa con ID:", id, "para user_id:", userId);

    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("❌ Error al eliminar empresa:", error);
      throw error;
    }

    console.log("✅ Empresa eliminada correctamente");
    console.groupEnd();
    return true;
  } catch (error) {
    console.error("❌ Error en deleteCompany:", error);
    console.groupEnd();
    throw error;
  }
}
