export interface Intervention {
  intervention_id: string;
  appointment_id: string;
  customer_id: string;
  assigned_technician_id: string;
  assigned_van_id?: string;
  intervention_code: string; // Codice univoco per l'intervento
  title: string;
  description: string;
  intervention_type: "inspection" | "repair" | "maintenance" | "installation" | "emergency";
  status: "assigned" | "accepted" | "in_progress" | "paused" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "emergency";
  
  // Date e orari
  scheduled_date: Date;
  scheduled_start_time: string;
  scheduled_end_time: string;
  actual_start_time?: string;
  actual_end_time?: string;
  
  // Location
  intervention_address: string;
  intervention_city: string;
  intervention_coordinates?: {
    lat: number;
    lng: number;
  };
  
  // Costi e materiali
  estimated_cost?: number;
  actual_cost?: number;
  materials_needed?: MaterialNeeded[];
  materials_used?: MaterialUsed[];
  
  // Report
  work_performed?: string;
  customer_signature?: string;
  technician_notes?: string;
  photos?: string[]; // URLs delle foto
  
  // Metadati
  created_at: Date;
  updated_at: Date;
  created_by: string;
  completed_at?: Date;
}

export interface MaterialNeeded {
  material_id: string;
  material_name: string;
  quantity: number;
  unit: string;
  estimated_cost?: number;
}

export interface MaterialUsed {
  material_id: string;
  material_name: string;
  quantity_used: number;
  unit: string;
  actual_cost: number;
  serial_numbers?: string[];
}

export interface InterventionFormData {
  appointment_id: string;
  customer_id: string;
  assigned_technician_id: string;
  assigned_van_id?: string;
  title: string;
  description: string;
  intervention_type: "inspection" | "repair" | "maintenance" | "installation" | "emergency";
  priority: "low" | "medium" | "high" | "emergency";
  scheduled_date: Date;
  scheduled_start_time: string;
  scheduled_end_time: string;
  intervention_address: string;
  intervention_city: string;
  estimated_cost?: number;
  materials_needed?: MaterialNeeded[];
  technician_notes?: string;
}

// Type per il report di completamento intervento
export interface InterventionCompletionReport {
  work_performed: string;
  materials_used: MaterialUsed[];
  actual_cost: number;
  customer_satisfaction_rating?: number;
  customer_signature?: string;
  technician_notes?: string;
  photos?: string[];
  next_maintenance_date?: Date;
  recommendations?: string;
} 