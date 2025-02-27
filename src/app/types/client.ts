import { Company } from "./company";

export type Client = {
  id: string;
  company_id: string;
  company?: Company;
  name: string;
  nif: string;
  address?: string | null;
  city?: string | null;
  postcode?: string | null;
  country: string;
  email?: string | null;
  phone?: string | null;
  applies_irpf: boolean;
  user_id: string;
};
