export interface Customer {
  customer_id: string;
  name: string;
  surname: string;
  email?: string;
  phone: string;
  address: string;
  city: string;
  zip_code: string;
  country: string;
  company_name?: string;
  vat_number?: string;
  tax_code?: string;
  notes?: string;
  status: "active" | "inactive";
  customer_type: "private" | "business";
  created_at: Date;
  updated_at: Date;
  created_by: string;
  // Metadati per analytics
  total_interventions?: number;
  last_intervention_date?: Date;
  customer_value?: number;
}

export interface CustomerFormData {
  name: string;
  surname: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zip_code: string;
  country: string;
  company_name?: string;
  vat_number?: string;
  tax_code?: string;
  notes?: string;
  customer_type: "private" | "business";
} 