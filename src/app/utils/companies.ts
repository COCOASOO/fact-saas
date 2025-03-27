// src/app/utils/companies.ts
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

async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('No hay usuario autenticado');
  }
  return user.id;
}

export async function getCompanies() {
  try {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    return data as Company[];
  } catch (error) {
    throw error;
  }
}

export async function getCompanyById(id: string) {
  try {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      throw error;
    }

    return data as Company;
  } catch (error) {
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
  try {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from("companies")
      .update(company)
      .eq("id", id)
      .eq("user_id", userId)
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

export async function deleteCompany(id: string) {
  try {
    const userId = await getCurrentUserId();

    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    throw error;
  }
}

export async function getUserCompany() {
  try {
    const userId = await getCurrentUserId();

    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No company found
        return null;
      }
      throw error;
    }

    return data as Company;
  } catch (error) {
    throw error;
  }
}