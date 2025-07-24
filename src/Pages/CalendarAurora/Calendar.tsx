import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Kbd,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Avatar,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { format, startOfWeek, endOfWeek, isSameDay, isSameWeek, isSameMonth, isSameYear } from "date-fns";
import { it } from "date-fns/locale";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AddEventModal from "./AddEventModal";
import CalendarDay from "./CalendarDay";
import CalendarMonth from "./CalendarMonth";
import CalendarWeek from "./CalendarWeek";
import CalendarYear from "./CalendarYear";
import ViewEventModal from "./ViewEventModal";
import PageHeader from "../../Components/Layout/PageHeader";

// CosmicHub Calendar Types
interface TechnicianAssignment {
  technician_id: string;
  technician_name: string;
  role: string;
  availability_status: "available" | "busy" | "on_break" | "offline";
}

interface CustomerInfo {
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address: string;
  customer_type: "private" | "business";
}

interface EventAttachment {
  EventAttachmentId: number;
  EventAttachmentUrl: string;
  EventAttachmentName: string;
}

interface EventPartecipant {
  EventPartecipantId: number;
  EventPartecipantEmail: string;
  EventPartecipantRole: string;
  EventPartecipantStatus: string;
}

interface CalendarEvent {
  EventId: number;
  EventTitle: string;
  EventStartDate: Date;
  EventEndDate: Date;
  EventStartTime: string;
  EventEndTime: string;
  EventColor: string;
  EventDescription: string;
  EventLocation: string;
  EventTagName: string;
  EventAttachments: EventAttachment[];
  EventPartecipants: EventPartecipant[];
  // CosmicHub specific fields
  EventType?: "appointment" | "maintenance" | "inspection" | "repair" | "installation" | "consultation";
  EventPriority?: "low" | "medium" | "high" | "emergency";
  EstimatedDuration?: number;
  CustomerInfo?: CustomerInfo;
  TechnicianAssignment?: TechnicianAssignment;
  InterventionNotes?: string;
  IsFromCCC?: boolean;
  CCCData?: any;
}

interface EventTag {
  EventTagId: number;
  EventTagName: string;
  EventTagColor: string;
}

// CosmicHub color scheme ottimizzato per visibilità in entrambi i temi
const appointmentColors = [
  { color: "#60A5FA", name: "Blu - Sopralluogo", type: "inspection", textColor: "#FFFFFF" },     // Blu chiaro
  { color: "#34D399", name: "Verde - Manutenzione", type: "maintenance", textColor: "#1F2937" }, // Verde chiaro
  { color: "#FBBF24", name: "Giallo - Riparazione", type: "repair", textColor: "#1F2937" },     // Giallo visibile
  { color: "#A78BFA", name: "Viola - Installazione", type: "installation", textColor: "#FFFFFF" }, // Viola chiaro
  { color: "#22D3EE", name: "Ciano - Consulenza", type: "consultation", textColor: "#1F2937" },   // Ciano chiaro
  { color: "#F87171", name: "Rosso - Emergenza", type: "emergency", textColor: "#FFFFFF" },       // Rosso emergenza
];

const priorityColors = {
  low: { bg: "#E2E8F0", text: "#475569", border: "#94A3B8" },      // Grigio chiaro
  medium: { bg: "#FED7AA", text: "#9A3412", border: "#FBBF24" },   // Arancione chiaro
  high: { bg: "#FECACA", text: "#991B1B", border: "#F87171" },     // Rosso chiaro
  emergency: { bg: "#FCA5A5", text: "#7F1D1D", border: "#EF4444" } // Rosso scuro
};

export default function CalendarAurora() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const container = useRef<HTMLDivElement>(null);
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"day" | "week" | "month" | "year">("month");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventTags, setEventTags] = useState<EventTag[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [prefilledEventData, setPrefilledEventData] = useState<any>(null);
  const [pendingEventData, setPendingEventData] = useState<any>(null);
  const [showPrefilledBanner, setShowPrefilledBanner] = useState(false);

  // CosmicHub specific state
  const [loading, setLoading] = useState(true);
  const [technicians, setTechnicians] = useState<TechnicianAssignment[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<string>("");

  // Check if coming from CCC workflow or creating new event
  const isFromCCC = searchParams.get("from_ccc") === "true";
  const isCreatingEvent = searchParams.get("creating_event") === "true";
  const isNewAppointment = window.location.pathname.includes("/new");

  useEffect(() => {
    loadMockData();
    
    // Handle CCC workflow or new event creation
    if (isFromCCC || isCreatingEvent || isNewAppointment) {
      handleEventCreationWorkflow();
    }

    // Keyboard shortcuts
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case "t":
            e.preventDefault();
            setCurrentDate(new Date());
            break;
          case "1":
            e.preventDefault();
            setView("day");
            break;
          case "2":
            e.preventDefault();
            setView("week");
            break;
          case "3":
            e.preventDefault();
            setView("month");
            break;
          case "4":
            e.preventDefault();
            setView("year");
            break;
          case "n":
            e.preventDefault();
            handleNewAppointment();
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  const loadMockData = async () => {
    setLoading(true);
    
    // Mock technicians
    const mockTechnicians: TechnicianAssignment[] = [
      {
        technician_id: "1",
        technician_name: "Marco Fontana",
        role: "Tecnico Senior",
        availability_status: "available"
      },
      {
        technician_id: "2", 
        technician_name: "Andrea Lombardi",
        role: "Tecnico Specializzato",
        availability_status: "busy"
      },
      {
        technician_id: "3",
        technician_name: "Simone Ricci", 
        role: "Tecnico Junior",
        availability_status: "available"
      },
      {
        technician_id: "4",
        technician_name: "Giulia Ferri",
        role: "Tecnico Esperto",
        availability_status: "available"
      }
    ];

    // Mock events/appointments - Many more examples con colori ottimizzati
    const today = new Date();
    const tomorrow = new Date(Date.now() + 86400000);
    const dayAfter = new Date(Date.now() + 172800000);
    const nextWeek = new Date(Date.now() + 604800000);

    const mockEvents: CalendarEvent[] = [
      // OGGI
      {
        EventId: 1,
        EventTitle: "🔧 Riparazione Urgente Caldaia",
        EventStartDate: new Date(today),
        EventEndDate: new Date(today),
        EventStartTime: "08:30",
        EventEndTime: "10:30",
        EventColor: "#F87171", // Rosso emergenza visibile
        EventDescription: "Riparazione urgente caldaia con perdita di pressione. Cliente senza riscaldamento.",
        EventLocation: "Via Roma 123, Milano",
        EventTagName: "Riparazione",
        EventAttachments: [],
        EventPartecipants: [
          { EventPartecipantId: 1, EventPartecipantEmail: "marco.fontana@cosmichub.it", EventPartecipantRole: "Tecnico Principale", EventPartecipantStatus: "confirmed" }
        ],
        EventType: "repair",
        EventPriority: "high",
        EstimatedDuration: 120,
        CustomerInfo: {
          customer_id: "1",
          customer_name: "Mario Rossi",
          customer_phone: "+39 333 1234567",
          customer_email: "mario.rossi@email.com",
          customer_address: "Via Roma 123, Milano",
          customer_type: "private"
        },
        TechnicianAssignment: mockTechnicians[0]
      },
      {
        EventId: 2,
        EventTitle: "❄️ Installazione Condizionatore",
        EventStartDate: new Date(today),
        EventEndDate: new Date(today),
        EventStartTime: "14:00",
        EventEndTime: "17:30",
        EventColor: "#A78BFA", // Viola installazione visibile
        EventDescription: "Installazione nuovo condizionatore dual split in appartamento al 3° piano",
        EventLocation: "Corso Venezia 89, Milano",
        EventTagName: "Installazione",
        EventAttachments: [],
        EventPartecipants: [
          { EventPartecipantId: 2, EventPartecipantEmail: "simone.ricci@cosmichub.it", EventPartecipantRole: "Tecnico Installatore", EventPartecipantStatus: "confirmed" },
          { EventPartecipantId: 3, EventPartecipantEmail: "lucia.neri@email.it", EventPartecipantRole: "Cliente", EventPartecipantStatus: "pending" }
        ],
        EventType: "installation",
        EventPriority: "medium",
        EstimatedDuration: 210,
        CustomerInfo: {
          customer_id: "2",
          customer_name: "Lucia Neri",
          customer_phone: "+39 987 654 321",
          customer_email: "lucia.neri@email.it",
          customer_address: "Corso Venezia 89, Milano",
          customer_type: "private"
        },
        TechnicianAssignment: mockTechnicians[2]
      },
      {
        EventId: 3,
        EventTitle: "🔍 Preventivo Ristrutturazione",
        EventStartDate: new Date(today),
        EventEndDate: new Date(today),
        EventStartTime: "11:00",
        EventEndTime: "12:30",
        EventColor: "#60A5FA", // Blu sopralluogo visibile
        EventDescription: "Sopralluogo e preventivo per ristrutturazione completa impianto idraulico",
        EventLocation: "Via Manzoni 67, Milano",
        EventTagName: "Preventivo",
        EventAttachments: [],
        EventPartecipants: [],
        EventType: "consultation",
        EventPriority: "low",
        EstimatedDuration: 90,
        CustomerInfo: {
          customer_id: "3",
          customer_name: "Famiglia Verdi",
          customer_phone: "+39 345 678 901",
          customer_email: "casa.verdi@email.it",
          customer_address: "Via Manzoni 67, Milano",
          customer_type: "private"
        },
        TechnicianAssignment: mockTechnicians[0]
      },

      // DOMANI
      {
        EventId: 4,
        EventTitle: "🏢 Manutenzione Condominio Verde",
        EventStartDate: new Date(tomorrow),
        EventEndDate: new Date(tomorrow),
        EventStartTime: "09:00",
        EventEndTime: "12:30",
        EventColor: "#34D399", // Verde manutenzione visibile
        EventDescription: "Controllo annuale impianti climatizzazione di tutto il condominio (15 unità)",
        EventLocation: "Via Milano 456, Roma",
        EventTagName: "Manutenzione",
        EventAttachments: [],
        EventPartecipants: [
          { EventPartecipantId: 4, EventPartecipantEmail: "andrea.lombardi@cosmichub.it", EventPartecipantRole: "Tecnico Responsabile", EventPartecipantStatus: "confirmed" },
          { EventPartecipantId: 5, EventPartecipantEmail: "giulia.ferri@cosmichub.it", EventPartecipantRole: "Assistente", EventPartecipantStatus: "confirmed" },
          { EventPartecipantId: 6, EventPartecipantEmail: "admin@condominioverde.it", EventPartecipantRole: "Amministratore", EventPartecipantStatus: "pending" }
        ],
        EventType: "maintenance",
        EventPriority: "medium",
        EstimatedDuration: 210,
        CustomerInfo: {
          customer_id: "4",
          customer_name: "Condominio Verde",
          customer_phone: "+39 06 1234567",
          customer_email: "amministratore@condominioverde.it",
          customer_address: "Via Milano 456, Roma",
          customer_type: "business"
        },
        TechnicianAssignment: mockTechnicians[1]
      },
      {
        EventId: 5,
        EventTitle: "💧 Riparazione Perdita Urgente",
        EventStartDate: new Date(tomorrow),
        EventEndDate: new Date(tomorrow),
        EventStartTime: "15:30",
        EventEndTime: "17:00",
        EventColor: "#FBBF24", // Giallo riparazione visibile
        EventDescription: "Riparazione perdita nella tubatura principale che sta allagando il seminterrato",
        EventLocation: "Via Dante 45, Napoli",
        EventTagName: "Riparazione",
        EventAttachments: [],
        EventPartecipants: [
          { EventPartecipantId: 7, EventPartecipantEmail: "marco.fontana@cosmichub.it", EventPartecipantRole: "Tecnico Emergenze", EventPartecipantStatus: "confirmed" }
        ],
        EventType: "repair",
        EventPriority: "high",
        EstimatedDuration: 90,
        CustomerInfo: {
          customer_id: "5",
          customer_name: "Giuseppe Ferrari",
          customer_phone: "+39 333 111 222",
          customer_email: "giuseppe.ferrari@email.it",
          customer_address: "Via Dante 45, Napoli",
          customer_type: "private"
        },
        TechnicianAssignment: mockTechnicians[0]
      },

      // DOPODOMANI
      {
        EventId: 6,
        EventTitle: "⚡ Controllo Impianto Elettrico",
        EventStartDate: new Date(dayAfter),
        EventEndDate: new Date(dayAfter),
        EventStartTime: "10:00",
        EventEndTime: "11:30",
        EventColor: "#22D3EE", // Ciano consulenza visibile
        EventDescription: "Controllo annuale obbligatorio impianto elettrico e gas domestico",
        EventLocation: "Piazza Garibaldi 12, Bologna",
        EventTagName: "Controllo",
        EventAttachments: [],
        EventPartecipants: [
          { EventPartecipantId: 8, EventPartecipantEmail: "giulia.ferri@cosmichub.it", EventPartecipantRole: "Tecnico Certificato", EventPartecipantStatus: "confirmed" }
        ],
        EventType: "inspection",
        EventPriority: "medium",
        EstimatedDuration: 90,
        CustomerInfo: {
          customer_id: "6",
          customer_name: "Anna Bianchi",
          customer_phone: "+39 051 987 654",
          customer_email: "anna.bianchi@email.it",
          customer_address: "Piazza Garibaldi 12, Bologna",
          customer_type: "private"
        },
        TechnicianAssignment: mockTechnicians[3]
      },
      {
        EventId: 7,
        EventTitle: "🏭 Manutenzione Stabilimento",
        EventStartDate: new Date(dayAfter),
        EventEndDate: new Date(dayAfter),
        EventStartTime: "14:00",
        EventEndTime: "18:00",
        EventColor: "#34D399", // Verde manutenzione visibile
        EventDescription: "Manutenzione programmata sistemi HVAC dello stabilimento produttivo",
        EventLocation: "Zona Industriale, Torino",
        EventTagName: "Manutenzione",
        EventAttachments: [],
        EventPartecipants: [
          { EventPartecipantId: 9, EventPartecipantEmail: "andrea.lombardi@cosmichub.it", EventPartecipantRole: "Capo Squadra", EventPartecipantStatus: "confirmed" },
          { EventPartecipantId: 10, EventPartecipantEmail: "simone.ricci@cosmichub.it", EventPartecipantRole: "Assistente", EventPartecipantStatus: "confirmed" },
          { EventPartecipantId: 11, EventPartecipantEmail: "responsabile@aziendaxyz.it", EventPartecipantRole: "Responsabile Tecnico", EventPartecipantStatus: "pending" }
        ],
        EventType: "maintenance",
        EventPriority: "medium",
        EstimatedDuration: 240,
        CustomerInfo: {
          customer_id: "7",
          customer_name: "Azienda XYZ S.p.A.",
          customer_phone: "+39 011 555 777",
          customer_email: "manutenzioni@aziendaxyz.it",
          customer_address: "Zona Industriale, Torino",
          customer_type: "business"
        },
        TechnicianAssignment: mockTechnicians[1]
      },

      // SETTIMANA PROSSIMA
      {
        EventId: 8,
        EventTitle: "☀️ Installazione Impianto Solare",
        EventStartDate: new Date(nextWeek),
        EventEndDate: new Date(nextWeek),
        EventStartTime: "08:00",
        EventEndTime: "17:00",
        EventColor: "#A78BFA", // Viola installazione visibile
        EventDescription: "Installazione completa impianto solare termico su tetto condominiale (20 unità)",
        EventLocation: "Via del Sole 88, Firenze",
        EventTagName: "Installazione",
        EventAttachments: [],
        EventPartecipants: [
          { EventPartecipantId: 12, EventPartecipantEmail: "marco.fontana@cosmichub.it", EventPartecipantRole: "Capo Progetto", EventPartecipantStatus: "confirmed" },
          { EventPartecipantId: 13, EventPartecipantEmail: "andrea.lombardi@cosmichub.it", EventPartecipantRole: "Tecnico Specializzato", EventPartecipantStatus: "confirmed" },
          { EventPartecipantId: 14, EventPartecipantEmail: "simone.ricci@cosmichub.it", EventPartecipantRole: "Assistente", EventPartecipantStatus: "confirmed" },
          { EventPartecipantId: 15, EventPartecipantEmail: "giulia.ferri@cosmichub.it", EventPartecipantRole: "Coordinatore", EventPartecipantStatus: "confirmed" }
        ],
        EventType: "installation",
        EventPriority: "medium",
        EstimatedDuration: 480,
        CustomerInfo: {
          customer_id: "8",
          customer_name: "Condominio Sole",
          customer_phone: "+39 055 123 456",
          customer_email: "amministratore@condominiosole.it",
          customer_address: "Via del Sole 88, Firenze",
          customer_type: "business"
        },
        TechnicianAssignment: mockTechnicians[0]
      },
      {
        EventId: 9,
        EventTitle: "🚨 Emergenza Allagamento",
        EventStartDate: new Date(Date.now() + 259200000), // 3 giorni
        EventEndDate: new Date(Date.now() + 259200000),
        EventStartTime: "20:00",
        EventEndTime: "23:30",
        EventColor: "#F87171", // Rosso emergenza visibile
        EventDescription: "Intervento d'emergenza notturno per allagamento seminterrato causa rottura tubazione principale",
        EventLocation: "Via Emergenza 999, Milano",
        EventTagName: "Emergenza",
        EventAttachments: [],
        EventPartecipants: [
          { EventPartecipantId: 16, EventPartecipantEmail: "marco.fontana@cosmichub.it", EventPartecipantRole: "Tecnico Emergenze", EventPartecipantStatus: "confirmed" },
          { EventPartecipantId: 17, EventPartecipantEmail: "andrea.lombardi@cosmichub.it", EventPartecipantRole: "Supporto", EventPartecipantStatus: "confirmed" }
        ],
        EventType: "repair",
        EventPriority: "emergency",
        EstimatedDuration: 210,
        CustomerInfo: {
          customer_id: "9",
          customer_name: "Uffici Centro S.r.l.",
          customer_phone: "+39 800 911 911",
          customer_email: "emergenze@ufficicentro.it",
          customer_address: "Via Emergenza 999, Milano",
          customer_type: "business"
        },
        TechnicianAssignment: mockTechnicians[0]
      }
    ];

    // Mock event tags con colori coordinati
    const mockEventTags: EventTag[] = [
      { EventTagId: 1, EventTagName: "Intervento Tecnico", EventTagColor: appointmentColors[0].color },
      { EventTagId: 2, EventTagName: "Manutenzione", EventTagColor: appointmentColors[1].color },
      { EventTagId: 3, EventTagName: "Riparazione", EventTagColor: appointmentColors[2].color },
      { EventTagId: 4, EventTagName: "Installazione", EventTagColor: appointmentColors[3].color },
      { EventTagId: 5, EventTagName: "Consulenza", EventTagColor: appointmentColors[4].color },
    ];

    setTechnicians(mockTechnicians);
    setEvents(mockEvents);
    setEventTags(mockEventTags);
    setLoading(false);
  };

  const handleEventCreationWorkflow = () => {
    if (isFromCCC) {
      // Pre-fill data from CCC - salva i dati ma NON aprire il modal
      const cccData = {
        customer_id: searchParams.get("customer_id"),
        customer_name: searchParams.get("customer_name"),
        customer_phone: searchParams.get("customer_phone"),
        customer_email: searchParams.get("customer_email"),
        customer_address: searchParams.get("customer_address"),
        problem_description: searchParams.get("problem_description"),
        intervention_type: searchParams.get("intervention_type"),
        urgency_level: searchParams.get("urgency_level"),
        estimated_duration: searchParams.get("estimated_duration"),
        notes: searchParams.get("notes"),
        location: searchParams.get("location"),
        assigned_technician: searchParams.get("assigned_technician"),
        preferred_technician: searchParams.get("preferred_technician"),
        customer_type: searchParams.get("customer_type"),
      };

      setPendingEventData(cccData);
      setShowPrefilledBanner(true);
      // NON aprire il modal automaticamente
    } else if (isCreatingEvent) {
      // Pre-fill data from NewEvent form - salva i dati ma NON aprire il modal
      const eventData = {
        // Dati evento
        title: searchParams.get("title"),
        description: searchParams.get("description"),
        event_type: searchParams.get("event_type"),
        priority: searchParams.get("priority"),
        estimated_duration: searchParams.get("estimated_duration"),
        
        // Dati cliente  
        customer_name: searchParams.get("customer_name"),
        customer_phone: searchParams.get("customer_phone"),
        customer_email: searchParams.get("customer_email"),
        customer_address: searchParams.get("customer_address"),
        customer_type: searchParams.get("customer_type"),
        
        // Dettagli intervento
        assigned_technician: searchParams.get("assigned_technician"),
        location: searchParams.get("location"),
        notes: searchParams.get("notes"),
        contact_method: searchParams.get("contact_method"),
        send_reminder: searchParams.get("send_reminder") === "true",
        from_external: searchParams.get("from_external") === "true",
        
        // Flag per indicare che viene dal form di preparazione
        from_preparation: true
      };

      setPendingEventData(eventData);
      setShowPrefilledBanner(true);
      // NON aprire il modal automaticamente
    } else if (isNewAppointment) {
      handleNewAppointment();
    }
  };

  const handleNewAppointment = () => {
    setPrefilledEventData(null);
        setIsOpen(true);
  };

  const changeDate = (offset: number) => {
    const newDate = new Date(currentDate);
    if (view === "year") {
      newDate.setFullYear(newDate.getFullYear() + offset);
    } else if (view === "month") {
      newDate.setMonth(newDate.getMonth() + offset);
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() + offset * 7);
    } else {
      newDate.setDate(newDate.getDate() + offset);
    }
    setCurrentDate(newDate);
  };

  const handleDateClick = (date: Date) => {
    setCurrentDate(date);
    
    // Se ci sono dati precompilati, apri il modal per quella data
    if (pendingEventData) {
      setPrefilledEventData(pendingEventData);
      setIsOpen(true);
      // NON pulire i dati pending - li manterremo fino al salvataggio
    } else {
      // Se non ci sono dati precompilati, cambia solo la vista
      setView("day");
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsViewOpen(true);
  };

  const getViewTitle = () => {
    switch (view) {
      case "day":
        return format(currentDate, "EEEE, dd MMMM yyyy", { locale: it });
      case "week":
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        return `${format(weekStart, "dd MMM", { locale: it })} - ${format(weekEnd, "dd MMM yyyy", { locale: it })}`;
      case "month":
        return format(currentDate, "MMMM yyyy", { locale: it });
      case "year":
        return format(currentDate, "yyyy", { locale: it });
      default:
        return "";
    }
  };

  const getEventsCount = () => {
    return events.filter(event => {
      const eventDate = new Date(event.EventStartDate);
      
      switch (view) {
        case "day":
          return isSameDay(eventDate, currentDate);
        case "week":
          return isSameWeek(eventDate, currentDate, { weekStartsOn: 1 });
        case "month":
          return isSameMonth(eventDate, currentDate);
        case "year":
          return isSameYear(eventDate, currentDate);
        default:
          return false;
      }
    }).length;
  };

  const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

  return (
    <div className="h-screen flex flex-col bg-background" ref={container}>
      {/* Header with responsive theme */}
      <Card className="border-none shadow-sm bg-background">
        <CardHeader className="pb-3">
          <PageHeader
            title="Calendario"
            description={`${getEventsCount()} eventi trovati`}
            icon="solar:calendar-bold-duotone"
          />

        </CardHeader>
      </Card>



      {/* Navigation and Controls with proper theme support */}
      <Card className="border-none shadow-sm bg-background">
        <CardBody className="py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              {/* Navigation Arrows */}
              <Button
                variant="flat"
                isIconOnly
                onPress={() => changeDate(-1)}
                size="sm"
                className="text-foreground hover:bg-default-200"
              >
                <Icon icon="solar:arrow-left-bold" width={16} />
              </Button>
              
              <div className="text-center min-w-0">
                <h1 className="text-lg font-semibold text-foreground">
                  {getViewTitle()}
                </h1>
                <p className="text-sm text-default-600">
                  {getEventsCount()} eventi
                </p>
              </div>

              <Button
                variant="flat"
                isIconOnly
                onPress={() => changeDate(1)}
                size="sm"
                className="text-foreground hover:bg-default-200"
              >
                <Icon icon="solar:arrow-right-bold" width={16} />
              </Button>
            </div>

            {/* Today Button */}
            <Button
              variant="flat"
              onPress={() => setCurrentDate(new Date())}
              size="sm"
              startContent={<Icon icon="solar:home-bold" width={16} />}
              className="text-foreground hover:bg-default-200"
            >
              Oggi
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
            {/* View Selector with theme support */}
            <div className="flex bg-default-100 dark:bg-default-200 rounded-lg p-1">
              {["day", "week", "month", "year"].map((viewType) => (
                <Button
                  key={viewType}
                  variant={view === viewType ? "solid" : "light"}
                  color={view === viewType ? "primary" : "default"}
                  size="sm"
                  onPress={() => setView(viewType as any)}
                  className={`min-w-0 px-3 ${
                    view === viewType 
                      ? "text-primary-foreground" 
                      : "text-foreground hover:bg-default-200"
                  }`}
                >
                  {viewType === "day" ? "Giorno" : 
                   viewType === "week" ? "Settimana" :
                   viewType === "month" ? "Mese" : "Anno"}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {/* Actions */}
              <Button
                color="primary"
                onPress={handleNewAppointment}
                startContent={<Icon icon="solar:calendar-add-bold" width={16} />}
                className="font-medium"
              >
                Nuovo Appuntamento
              </Button>

              {/* More Actions */}
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    variant="flat"
                    isIconOnly
                    className="text-foreground hover:bg-default-200"
                  >
                    <Icon icon="solar:menu-dots-bold" width={16} />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  className="bg-background border border-default-200"
                >
                  <DropdownItem
                    key="shortcuts"
                    startContent={<Icon icon="solar:keyboard-bold" width={16} />}
                    className="text-foreground"
                  >
                    <div>
                      <div className="font-medium">Scorciatoie Tastiera</div>
                      <div className="text-xs text-default-600 mt-2 space-y-1">
                        <div className="flex justify-between">
                          <span>Oggi</span>
                          <Kbd keys={["cmd", "t"]}>⌘T</Kbd>
                        </div>
                        <div className="flex justify-between">
                          <span>Nuovo</span>
                          <Kbd keys={["cmd", "n"]}>⌘N</Kbd>
                        </div>
                        <div className="flex justify-between">
                          <span>Viste</span>
                          <Kbd keys={["cmd", "1"]}>⌘1-4</Kbd>
                        </div>
                      </div>
                    </div>
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Calendar Content with proper theme */}
      <Card className="flex-1 border-none shadow-sm bg-background overflow-hidden">
        <CardBody className="p-0 h-full">
          <div className="h-full bg-background text-foreground">
            {loading ? (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                  <Icon icon="solar:loading-line-duotone" width={32} className="animate-spin text-primary" />
                  <p className="text-default-600">Caricamento calendario...</p>
                </div>
            </div>
          ) : (
            <>
                          {view === "day" && (
              <CalendarDay
                currentDate={currentDate}
                onDateClick={handleDateClick}
                redLineBehavior="show"
                events={events}
              />
            )}
                             {view === "week" && (
                 <CalendarWeek
                   currentDate={currentDate}
                   onDateClick={handleDateClick}
                   redLineBehavior="show"
                   events={events}
                 />
               )}
              {view === "month" && (
                <CalendarMonth
                  currentDate={currentDate}
                    events={events}
                  onDateClick={handleDateClick}
                />
              )}
                             {view === "year" && (
                 <CalendarYear
                   currentDate={currentDate}
                   events={events}
                   onDateClick={handleDateClick}
                   onMonthClick={(date) => {
                     setCurrentDate(date);
                     setView("month");
                   }}
                 />
               )}
            </>
          )}
        </div>
        </CardBody>
      </Card>

      {/* Modals */}
             <AddEventModal
         isOpen={isOpen}
         isClosed={() => {
           setIsOpen(false);
           setPrefilledEventData(null);
           // Navigate back to customers if from CCC
           if (isFromCCC) {
             navigate("/customers");
           }
         }}
         prefilledData={prefilledEventData}
       />

      <ViewEventModal
        isOpen={isViewOpen}
        isClosed={() => {
          setIsViewOpen(false);
          setSelectedEvent(null);
        }}
        eventId={selectedEvent?.EventId || 0}
        onEventUpdated={(updatedEvent) => {
          setEvents(prev => 
            prev.map(e => e.EventId === updatedEvent.EventId ? updatedEvent : e)
          );
        }}
        onEventDeleted={(deletedEventId) => {
          setEvents(prev => prev.filter(e => e.EventId !== deletedEventId));
          setIsViewOpen(false);
          setSelectedEvent(null);
        }}
      />

      <AddEventModal
        isOpen={isOpen}
        isClosed={() => {
          setIsOpen(false);
          setPrefilledEventData(null);
          // NON pulire pendingEventData qui - permettiamo all'utente di scegliere un altro giorno
        }}
        prefilledData={prefilledEventData}
        eventTags={eventTags}
        technicians={technicians}
        onEventCreated={(event) => {
          setEvents(prev => [...prev, event]);
          // Solo ora puliamo i dati pending dopo il salvataggio
          setPendingEventData(null);
          setShowPrefilledBanner(false);
        }}
      />
      </div>
  );
}
