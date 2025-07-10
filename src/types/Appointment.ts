export interface Technician {
  technician_id: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  specialization: string[];
  color: string; // Colore per identificare il tecnico nel calendario
  is_available: boolean;
}

export interface Appointment {
  appointment_id: string;
  customer_id: string;
  call_id?: string;
  technician_id?: string; // ID del tecnico assegnato
  technician?: Technician; // Dati del tecnico (popolato quando necessario)
  title: string;
  description: string;
  appointment_date: Date;
  start_time: string;
  end_time: string;
  location: string;
  appointment_type: "inspection" | "repair" | "maintenance" | "installation" | "consultation";
  status: "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";
  priority: "low" | "medium" | "high" | "emergency";
  estimated_duration: number; // in minutes
  notes?: string;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  // Reminder settings
  send_reminder: boolean;
  reminder_sent?: boolean;
  reminder_date?: Date;
}

export interface AppointmentFormData {
  customer_id: string;
  call_id?: string;
  technician_id?: string;
  title: string;
  description: string;
  appointment_date: Date;
  start_time: string;
  end_time: string;
  location: string;
  appointment_type: "inspection" | "repair" | "maintenance" | "installation" | "consultation";
  priority: "low" | "medium" | "high" | "emergency";
  estimated_duration: number;
  notes?: string;
  send_reminder: boolean;
} 