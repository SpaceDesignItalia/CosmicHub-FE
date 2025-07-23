import type { Employee } from "./Employee";

export interface Technician extends Employee {
  technician_id: string;
  phone: string;
  email: string;
  profile_image: string;
  created_at: Date;
  updated_at: Date;
  specializations: TechnicianSpecialization[];
  skill_level: "junior" | "senior" | "expert";
  hourly_rate?: number;
  availability_status: "available" | "busy" | "on_break" | "offline";
  current_location?: {
    lat: number;
    lng: number;
    last_updated: Date;
  };
  // Statistiche performance
  total_interventions_completed?: number;
  average_completion_time?: number; // in minutes
  customer_rating_average?: number;
  certifications?: TechnicianCertification[];
  // Programmazione settimanale
  working_hours: WorkingHours;
}

export interface TechnicianSpecialization {
  specialization_id: string;
  name: string;
  category:
    | "electrical"
    | "plumbing"
    | "hvac"
    | "appliances"
    | "electronics"
    | "carpentry"
    | "other";
  skill_level: "basic" | "intermediate" | "advanced" | "expert";
}

export interface TechnicianCertification {
  certification_id: string;
  name: string;
  issuing_organization: string;
  issue_date: Date;
  expiry_date?: Date;
  certification_number?: string;
}

export interface WorkingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  is_working_day: boolean;
  start_time?: string; // "09:00"
  end_time?: string; // "18:00"
  break_start?: string; // "12:00"
  break_end?: string; // "13:00"
}

// Tipo per l'algoritmo di assegnazione automatica
export interface TechnicianAvailability {
  technician_id: string;
  name: string;
  surname: string;
  is_available: boolean;
  current_workload: number; // 0-100%
  distance_from_location?: number; // in km
  specialization_match_score: number; // 0-100%
  skill_level_score: number; // 0-100%
  customer_rating: number;
  estimated_travel_time?: number; // in minutes
}

export interface TechnicianFormData {
  user_id: string;
  specializations: string[]; // IDs delle specializzazioni
  skill_level: "junior" | "senior" | "expert";
  hourly_rate?: number;
  certifications?: Omit<TechnicianCertification, "certification_id">[];
  working_hours: WorkingHours;
}
