// Tipi unificati per il calendario CosmicHub

export interface TechnicianAssignment {
  technician_id: string;
  technician_name: string;
  role: string;
  availability_status: "available" | "busy" | "on_break" | "offline";
}

export interface CustomerInfo {
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address: string;
  customer_type: "private" | "business";
}

export interface EventAttachment {
  EventAttachmentId: number;
  EventAttachmentUrl: string;
  EventAttachmentName: string;
}

export interface EventPartecipant {
  EventPartecipantId: number;
  EventPartecipantEmail: string;
  EventPartecipantRole: string;
  EventPartecipantStatus: string;
}

export interface CalendarEvent {
  EventId: number;
  EventTitle: string;
  EventStartDate: string | Date;
  EventEndDate: string | Date;
  EventStartTime: string;
  EventEndTime: string;
  EventColor: string;
  EventDescription: string;
  EventLocation: string;
  EventTagName: string;
  EventAttachments: EventAttachment[];
  EventPartecipants: EventPartecipant[];
  // CosmicHub specific fields
  EventType?:
    | "appointment"
    | "maintenance"
    | "inspection"
    | "repair"
    | "installation"
    | "consultation"
    | "Intervento Tecnico";
  EventPriority?: "Normale" | "Alta" | "Urgente" | "Emergenza";
  EstimatedDuration?: number | string;
  CustomerInfo?: CustomerInfo;
  TechnicianAssignment?: TechnicianAssignment;
  InterventionNotes?: string;
  IsFromCCC?: boolean;
  CCCData?: any;
}

export interface EventTag {
  EventTagId: number;
  EventTagName: string;
  EventTagColor: string;
}

// Funzione per ottenere il colore in base alla priorità
export const getPriorityColor = (priority: string) => {
  const colorMap: { [key: string]: string } = {
    Normale: "#10B981", // Verde
    Alta: "#F59E0B", // Giallo/Arancione
    Urgente: "#F97316", // Arancione
    Emergenza: "#DC2626", // Rosso scuro
  };
  return colorMap[priority] || "#10B981"; // Default verde per Normale
};

// Funzione per ottenere l'emoji pallino in base alla priorità
export const getPriorityEmoji = (priority: string) => {
  const emojiMap: { [key: string]: string } = {
    Normale: "🟢",
    Alta: "🟡",
    Urgente: "🟠",
    Emergenza: "🔴",
  };
  return emojiMap[priority] || "🟢"; // Default verde per Normale
};
