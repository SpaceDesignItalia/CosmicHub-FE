// Types per la gestione completa dei documenti aziendali

export interface BaseDocument {
  id: string;
  title: string;
  description?: string;
  document_type: string;
  issue_date: string;
  expiry_date?: string;
  file_path?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  status: "active" | "expired" | "expiring_soon" | "draft" | "cancelled";
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by?: string;
  notes?: string;
  reminder_days?: number[]; // Giorni prima della scadenza per inviare reminder (es. [30, 15, 7, 1])
}

// Documenti Veicoli
export interface VehicleDocument extends BaseDocument {
  document_id: string;
  vehicle_id: string;
  vehicle_license_plate: string;
  vehicle_name?: string;
  document_type:
    | "insurance" // Assicurazione
    | "inspection" // Revisione
    | "maintenance" // Tagliando/Manutenzione
    | "registration" // Carta di circolazione
    | "license" // Patente di guida (associata al veicolo/autista)
    | "certification" // Certificazioni varie
    | "fuel_card" // Carta carburante
    | "highway_pass" // Telepass/Viacard
    | "lease_contract" // Contratto di leasing
    | "other";
  cost?: number;
  provider?: string; // Assicurazione/officina/ente
  certificate_number?: string;
  renewal_automatic?: boolean;
  status: "active" | "expired" | "expiring_soon" | "draft" | "cancelled";
  file_path: string;
}

// Documenti Azienda/Magazzino
export interface CompanyDocument extends BaseDocument {
  facility_id?: string; // ID magazzino/sede se specifico
  facility_name?: string;
  document_type:
    | "business_license" // Licenza commerciale
    | "tax_registration" // Registrazione fiscale
    | "safety_certification" // Certificazione sicurezza
    | "fire_prevention" // Prevenzione incendi
    | "environmental_permit" // Permessi ambientali
    | "insurance_policy" // Polizza aziendale
    | "iso_certification" // Certificazioni ISO
    | "haccp" // Certificazione HACCP (se alimentare)
    | "professional_registration" // Iscrizione albi professionali
    | "waste_disposal" // Autorizzazione smaltimento rifiuti
    | "energy_certification" // Certificazione energetica
    | "building_permit" // Permessi edilizi
    | "machinery_certification" // Certificazioni macchinari
    | "software_license" // Licenze software
    | "other";
  authority?: string; // Ente che ha rilasciato il documento
  license_number?: string;
  renewal_required?: boolean;
  compliance_area?: string; // Area di conformità (sicurezza, ambiente, qualità, ecc.)
}

// Documenti Dipendenti
export interface EmployeeDocument extends BaseDocument {
  employee_id: string;
  employee_name: string;
  employee_email?: string;
  document_type:
    | "driving_license" // Patente di guida
    | "professional_license" // Abilitazione professionale
    | "safety_training" // Formazione sicurezza
    | "medical_certificate" // Certificato medico
    | "first_aid" // Primo soccorso
    | "crane_license" // Patentino gru
    | "forklift_license" // Patentino muletto
    | "scaffolding" // Abilitazione ponteggi
    | "confined_spaces" // Spazi confinati
    | "height_work" // Lavori in quota
    | "electrical_qualification" // Qualificazione elettrica
    | "welding_certification" // Certificazione saldatura
    | "gas_handling" // Manipolazione gas
    | "dangerous_goods" // Merci pericolose
    | "food_safety" // Sicurezza alimentare
    | "other";
  license_category?: string; // Categoria patente, tipo abilitazione, ecc.
  issuing_authority?: string;
  certificate_number?: string;
  training_hours?: number;
  instructor?: string;
  renewal_required?: boolean;
}

// Reminder/Notifiche
export interface DocumentReminder {
  id: string;
  document_id: string;
  document_type: "vehicle" | "company" | "employee";
  document_title: string;
  expiry_date: string;
  days_until_expiry: number;
  reminder_type: "email" | "notification" | "dashboard" | "sms";
  status: "pending" | "sent" | "acknowledged" | "expired";
  recipients: string[]; // Email o ID utenti
  sent_at?: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  created_at: string;
}

// Configurazione Reminder
export interface ReminderConfig {
  id: string;
  document_type:
    | VehicleDocument["document_type"]
    | CompanyDocument["document_type"]
    | EmployeeDocument["document_type"];
  entity_type: "vehicle" | "company" | "employee";
  reminder_days: number[]; // Es. [60, 30, 15, 7, 1]
  reminder_methods: ("email" | "notification" | "dashboard" | "sms")[];
  recipients: {
    roles?: string[]; // Ruoli che devono ricevere il reminder
    users?: string[]; // Utenti specifici
    emails?: string[]; // Email aggiuntive
  };
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Dashboard Analytics
export interface DocumentAnalytics {
  total_documents: number;
  expiring_soon: number; // Scadenza nei prossimi 30 giorni
  expired: number;
  by_type: {
    vehicle_documents: number;
    company_documents: number;
    employee_documents: number;
  };
  by_status: {
    active: number;
    expiring_soon: number;
    expired: number;
    draft: number;
  };
  recent_uploads: number; // Documenti caricati nell'ultima settimana
  pending_renewals: number;
}

// Filtri per la ricerca documenti
export interface DocumentFilters {
  search?: string;
  document_type?: string;
  entity_type?: "vehicle" | "company" | "employee";
  entity_id?: string;
  status?: BaseDocument["status"];
  expiry_date_from?: string;
  expiry_date_to?: string;
  created_date_from?: string;
  created_date_to?: string;
  reminder_active?: boolean;
}

// Bulk operations
export interface BulkDocumentOperation {
  operation: "delete" | "update_status" | "set_reminder" | "export";
  document_ids: string[];
  parameters?: {
    status?: BaseDocument["status"];
    reminder_days?: number[];
    export_format?: "pdf" | "excel" | "csv";
  };
}

// Upload Document Request
export interface DocumentUploadRequest {
  title: string;
  description?: string;
  document_type: string;
  entity_type: "vehicle" | "company" | "employee";
  entity_id: string;
  issue_date: string;
  expiry_date?: string;
  file: File;
  reminder_days?: number[];
  notes?: string;
  certificate_number?: string;
  provider?: string;
  cost?: number;
}
