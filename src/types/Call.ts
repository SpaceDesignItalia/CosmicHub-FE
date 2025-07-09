export interface Call {
  call_id: string;
  customer_id?: string; // Optional se il cliente è nuovo
  caller_name: string;
  caller_phone: string;
  call_date: Date;
  call_time: string;
  problem_description: string;
  urgency_level: "low" | "medium" | "high" | "emergency";
  call_source: "phone" | "email" | "whatsapp" | "website" | "walk_in";
  status: "pending" | "appointment_scheduled" | "intervention_assigned" | "completed" | "cancelled";
  notes?: string;
  created_by: string;
  // Info per nuovo cliente se non esiste
  is_new_customer: boolean;
  customer_data?: {
    name: string;
    surname: string;
    email?: string;
    address: string;
    city: string;
    zip_code: string;
    customer_type: "private" | "business";
    company_name?: string;
  };
}

export interface CallFormData {
  caller_name: string;
  caller_phone: string;
  problem_description: string;
  urgency_level: "low" | "medium" | "high" | "emergency";
  call_source: "phone" | "email" | "whatsapp" | "website" | "walk_in";
  notes?: string;
  is_new_customer: boolean;
  customer_data?: {
    name: string;
    surname: string;
    email?: string;
    address: string;
    city: string;
    zip_code: string;
    customer_type: "private" | "business";
    company_name?: string;
  };
} 