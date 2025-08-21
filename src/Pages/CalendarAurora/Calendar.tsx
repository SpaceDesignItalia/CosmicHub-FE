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
import {
  format,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isSameWeek,
  isSameMonth,
  isSameYear,
} from "date-fns";
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
import axios from "axios";

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
  EventType?:
    | "appointment"
    | "maintenance"
    | "inspection"
    | "repair"
    | "installation"
    | "consultation";
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
  {
    color: "#60A5FA",
    name: "Blu - Sopralluogo",
    type: "inspection",
    textColor: "#FFFFFF",
  }, // Blu chiaro
  {
    color: "#34D399",
    name: "Verde - Manutenzione",
    type: "maintenance",
    textColor: "#1F2937",
  }, // Verde chiaro
  {
    color: "#FBBF24",
    name: "Giallo - Riparazione",
    type: "repair",
    textColor: "#1F2937",
  }, // Giallo visibile
  {
    color: "#A78BFA",
    name: "Viola - Installazione",
    type: "installation",
    textColor: "#FFFFFF",
  }, // Viola chiaro
  {
    color: "#22D3EE",
    name: "Ciano - Consulenza",
    type: "consultation",
    textColor: "#1F2937",
  }, // Ciano chiaro
  {
    color: "#F87171",
    name: "Rosso - Emergenza",
    type: "emergency",
    textColor: "#FFFFFF",
  }, // Rosso emergenza
];

const priorityColors = {
  low: { bg: "#E2E8F0", text: "#475569", border: "#94A3B8" }, // Grigio chiaro
  medium: { bg: "#FED7AA", text: "#9A3412", border: "#FBBF24" }, // Arancione chiaro
  high: { bg: "#FECACA", text: "#991B1B", border: "#F87171" }, // Rosso chiaro
  emergency: { bg: "#FCA5A5", text: "#7F1D1D", border: "#EF4444" }, // Rosso scuro
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
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
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
    loadData();

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

  const loadData = () => {
    axios.get("Customer/GET/GetAllEvents").then((res) => {
      console.log(res.data);
      setEvents(res.data);

      if (res.status === 200) {
        setLoading(false);
      }
    });
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
        assigned_technician_id: searchParams.get("assigned_technician_id"),
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
        customer_id: searchParams.get("customer_id"),
        customer_name: searchParams.get("customer_name"),
        customer_phone: searchParams.get("customer_phone"),
        customer_email: searchParams.get("customer_email"),
        customer_address: searchParams.get("customer_address"),
        customer_type: searchParams.get("customer_type"),

        // Dettagli intervento
        assigned_technician: searchParams.get("assigned_technician"),
        assigned_technician_id: searchParams.get("assigned_technician_id"),
        location: searchParams.get("location"),
        notes: searchParams.get("notes"),
        contact_method: searchParams.get("contact_method"),
        send_reminder: searchParams.get("send_reminder") === "true",
        from_external: searchParams.get("from_external") === "true",

        // Flag per indicare che viene dal form di preparazione
        from_preparation: true,
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
        return `${format(weekStart, "dd MMM", { locale: it })} - ${format(
          weekEnd,
          "dd MMM yyyy",
          { locale: it }
        )}`;
      case "month":
        return format(currentDate, "MMMM yyyy", { locale: it });
      case "year":
        return format(currentDate, "yyyy", { locale: it });
      default:
        return "";
    }
  };

  const getEventsCount = () => {
    return events.filter((event) => {
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
    <div
      className="h-screen flex flex-col bg-background p-6 gap-6"
      ref={container}
    >
      <PageHeader
        title="Calendario"
        description={`${getEventsCount()} eventi trovati`}
        icon="solar:calendar-bold-duotone"
        size="md"
      />

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
                  {viewType === "day"
                    ? "Giorno"
                    : viewType === "week"
                    ? "Settimana"
                    : viewType === "month"
                    ? "Mese"
                    : "Anno"}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {/* Actions */}
              <Button
                color="primary"
                onPress={handleNewAppointment}
                startContent={
                  <Icon icon="solar:calendar-add-bold" width={16} />
                }
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
                <DropdownMenu className="bg-background border border-default-200">
                  <DropdownItem
                    key="shortcuts"
                    startContent={
                      <Icon icon="solar:keyboard-bold" width={16} />
                    }
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
                  <Icon
                    icon="solar:loading-line-duotone"
                    width={32}
                    className="animate-spin text-primary"
                  />
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
          setEvents((prev) =>
            prev.map((e) =>
              e.EventId === updatedEvent.EventId ? updatedEvent : e
            )
          );
        }}
        onEventDeleted={(deletedEventId) => {
          setEvents((prev) => prev.filter((e) => e.EventId !== deletedEventId));
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
          setEvents((prev) => [...prev, event]);
          // Solo ora puliamo i dati pending dopo il salvataggio
          setPendingEventData(null);
          setShowPrefilledBanner(false);
        }}
      />
    </div>
  );
}
