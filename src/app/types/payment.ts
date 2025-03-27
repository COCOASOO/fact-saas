import { Invoice } from "./invoice";

export interface Payment {
  id: string;
  created_at: string | number | Date;
  invoice_id: string;
  payment_date: string;
  amount: number;
  payment_method: 'cash' | 'transfer' | 'card';
  status: 'pending' | 'completed' | 'failed';
  invoices?: Invoice; // For the joined data from Supabase
}

export interface CreatePaymentDTO {
  invoice_id: string;
  amount: number;
  payment_method: 'cash' | 'transfer' | 'card';
  status: 'pending' | 'completed' | 'failed';
  payment_date?: string; // Optional as it has a default value in the DB
} 