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
  created_by: string;

  // Metadati per analytics
  total_interventions?: number;
  last_intervention_date?: Date;
  customer_value?: number;

  // Sistema di referenze
  referred_by?: string; // ID del cliente che ha fatto la referenza
  referred_by_name?: string; // Nome del cliente che ha fatto la referenza
  referrals?: CustomerReferral[]; // Clienti portati da questo cliente
  referral_discount?: number; // Sconto per referenze

  // Storico dettagliato
  intervention_history?: InterventionSummary[];
  payment_history?: PaymentSummary[];
  preferred_technician_id?: string;
  preferred_technician_name?: string;
  recurring_problems?: string[];
  customer_rating?: number; // 1-5 stelle

  // Comunicazione
  preferred_contact_method?: "phone" | "email" | "whatsapp" | "sms";
  communication_preferences?: {
    receive_reminders: boolean;
    receive_promotions: boolean;
    receive_maintenance_alerts: boolean;
  };

  // Geolocalizzazione
  coordinates?: {
    lat: number;
    lng: number;
  };

  // Statistiche
  stats?: {
    total_spent: number;
    average_intervention_cost: number;
    punctuality_score: number; // 1-10
    payment_reliability: number; // 1-10
    last_contact_date?: Date;
  };
}

export interface CustomerReferral {
  referral_id: string;
  referred_customer_id: string;
  referred_customer_name: string;
  referral_date: Date;
  status: "pending" | "confirmed" | "completed";
  discount_applied?: number;
  commission_earned?: number;
}

export interface InterventionSummary {
  intervention_id: string;
  date: Date;
  type: string;
  technician_name: string;
  cost: number;
  problem_description: string;
  solution_description?: string;
  customer_satisfaction?: number; // 1-5
  status: "completed" | "cancelled" | "pending";
}

export interface PaymentSummary {
  payment_id: string;
  intervention_id: string;
  date: Date;
  amount: number;
  method: "cash" | "card" | "bank_transfer" | "check";
  status: "paid" | "pending" | "overdue";
  invoice_number?: string;
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
  referred_by?: string;
  preferred_contact_method?: "phone" | "email" | "whatsapp" | "sms";
  communication_preferences?: {
    receive_reminders: boolean;
    receive_promotions: boolean;
    receive_maintenance_alerts: boolean;
  };
}

export interface CustomerSearchResult {
  customer: Customer;
  match_score: number;
  match_reasons: string[];
}

export interface QuickBookingData {
  customer_id: string;
  problem_description: string;
  urgency_level: string; // Cambiato da enum a stringa libera
  preferred_date?: Date;
  preferred_time?: string;
  location?: string;
  notes?: string;
  estimated_duration?: number;
  intervention_type:
    | "inspection"
    | "repair"
    | "maintenance"
    | "installation"
    | "consultation";
}
