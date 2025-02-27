export type Company = {
    id: string;                 // UUID o ID autogenerado
    name: string;               // No puede ser null
    nif: string;                // Unique
    address?: string | null;    // Opcional
    city?: string | null;       // Opcional
    postcode?: string | null;   // Opcional
    country: string;            // Default 'ESP'
    email?: string | null;      // Opcional
    phone?: string | null;      // Opcional
    user_id: string;            // Foreign key (relación con User)
  };