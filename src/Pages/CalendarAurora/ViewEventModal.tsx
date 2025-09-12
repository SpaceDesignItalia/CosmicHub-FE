import {
  Button,
  Chip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ScrollShadow,
  Accordion,
  AccordionItem,
  Input,
  Select,
  SelectItem,
  Textarea,
  Avatar,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import FileCard from "./FileCard";
import ConfirmDeleteEventModal from "./ConfirmDeleteEventModal";
import axios from "axios";

interface EventPartecipant {
  EventPartecipantId: number;
  EventPartecipantEmail: string;
  EventPartecipantRole: string;
  EventPartecipantStatus: string;
}

interface EventAttachment {
  EventAttachmentId: number;
  EventAttachmentUrl: string;
  EventAttachmentName: string;
}

interface CalendarEvent {
  EventId: number;
  EventTitle: string;
  EventStartDate: any;
  EventEndDate: any;
  EventStartTime: string;
  EventEndTime: string;
  EventColor: string;
  EventDescription: string;
  EventLocation: string;
  EventTagName: string;
  EventAttachments: EventAttachment[];
  EventPartecipants: EventPartecipant[];
  // CosmicHub specific fields
  EventType?: string;
  EventPriority?: string;
  EstimatedDuration?: number;
  CustomerInfo?: {
    customer_id: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    customer_address: string;
    customer_type: string;
  };
  TechnicianAssignment?: {
    technician_id: string;
    technician_name: string;
    role: string;
    availability_status: string;
  };
  InterventionNotes?: string;
}

interface ViewEventModalProps {
  isOpen: boolean;
  eventId: number;
  eventData?: CalendarEvent; // Dati evento opzionali per evitare chiamata API
  isClosed: () => void;
  onEventUpdated?: (event: CalendarEvent) => void;
  onEventDeleted?: (eventId: number) => void;
}

interface EventTag {
  EventTagId: number;
  EventTagName: string;
}

const INITIAL_EVENT_DATA: CalendarEvent = {
  EventId: 0,
  EventTitle: "",
  EventStartDate: new Date().toISOString().split("T")[0],
  EventEndDate: new Date().toISOString().split("T")[0],
  EventStartTime: "",
  EventEndTime: "",
  EventColor: "",
  EventDescription: "",
  EventLocation: "",
  EventTagName: "",
  EventAttachments: [],
  EventPartecipants: [],
};

// Mock data per CosmicHub
const mockEventTags: EventTag[] = [
  { EventTagId: 1, EventTagName: "Intervento Tecnico" },
  { EventTagId: 2, EventTagName: "Manutenzione" },
  { EventTagId: 3, EventTagName: "Installazione" },
  { EventTagId: 4, EventTagName: "Riparazione" },
  { EventTagId: 5, EventTagName: "Controllo" },
  { EventTagId: 6, EventTagName: "Preventivo" },
];

const priorityLevels = ["Bassa", "Normale", "Alta", "Urgente", "Critica"];

const interventionTypes = [
  "Riparazione",
  "Manutenzione",
  "Installazione",
  "Controllo",
  "Preventivo",
  "Emergenza",
];

export default function ViewEventModal({
  isOpen,
  eventId,
  eventData: providedEventData,
  isClosed,
  onEventUpdated,
  onEventDeleted,
}: ViewEventModalProps) {
  const [eventData, setEventData] = useState<CalendarEvent>(INITIAL_EVENT_DATA);
  const [originalEventData, setOriginalEventData] =
    useState<CalendarEvent>(INITIAL_EVENT_DATA);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newPartecipant, setNewPartecipant] = useState<EventPartecipant>({
    EventPartecipantId: 0,
    EventPartecipantEmail: "",
    EventPartecipantRole: "",
    EventPartecipantStatus: "pending",
  });

  // Stato per le notifiche temporanee
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  // Funzione per mostrare notifiche temporanee
  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "success" });
    }, 3000); // Nasconde la notifica dopo 3 secondi
  };

  // Stati per le assegnazioni (cliente e tecnico)
  const [availableCustomers, setAvailableCustomers] = useState<any[]>([]);
  const [availableTechnicians, setAvailableTechnicians] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>("");

  // Opzioni per la priorità
  const priorityOptions = [
    { key: "Normale", label: "🟢 Normale" },
    { key: "Alta", label: "🟡 Alta" },
    { key: "Urgente", label: "🟠 Urgente" },
    { key: "Emergenza", label: "🔴 Emergenza" },
  ];

  // Funzione per convertire le date nel formato corretto per i campi input
  const formatDateForInput = (date: any): string => {
    if (!date) return "";

    // Se è già nel formato YYYY-MM-DD, restituiscilo
    if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }

    // Se è nel formato ISO con timezone, estrai solo la parte data
    if (typeof date === "string" && date.includes("T")) {
      return date.split("T")[0];
    }

    // Se è un oggetto Date, convertilo direttamente
    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    // Altrimenti, prova a convertirlo evitando problemi di fuso orario
    try {
      // Se è una stringa che sembra una data, prova a parsarla manualmente
      if (typeof date === "string") {
        // Prova diversi formati comuni
        const dateFormats = [
          /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
          /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
          /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
        ];

        for (const format of dateFormats) {
          const match = date.match(format);
          if (match) {
            if (format.source.includes("YYYY")) {
              // Formato YYYY-MM-DD
              return `${match[1]}-${match[2]}-${match[3]}`;
            } else {
              // Formato DD/MM/YYYY o DD-MM-YYYY
              return `${match[3]}-${match[2]}-${match[1]}`;
            }
          }
        }
      }

      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return "";

      // Usa getFullYear, getMonth, getDate per evitare problemi di fuso orario
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Errore conversione data:", error, "Data originale:", date);
      return "";
    }
  };

  // Funzione per caricare clienti e tecnici disponibili
  const loadCustomersAndTechnicians = async () => {
    try {
      // Carica clienti
      const customersResponse = await axios.get("Customer/GET/GetAllCustomers");
      if (customersResponse.data) {
        setAvailableCustomers(
          Array.isArray(customersResponse.data) ? customersResponse.data : []
        );
      }

      // Carica tecnici (dipendenti)
      const techniciansResponse = await axios.get(
        "Employee/GET/GetAllEmployees"
      );
      if (techniciansResponse.data) {
        setAvailableTechnicians(
          Array.isArray(techniciansResponse.data)
            ? techniciansResponse.data
            : []
        );
      }
    } catch (error) {
      console.error("Errore caricamento clienti/tecnici:", error);
    }
  };

  useEffect(() => {
    if (isOpen && eventId) {
      // Carica clienti e tecnici disponibili
      loadCustomersAndTechnicians();

      // Se abbiamo i dati dell'evento, usali direttamente
      if (providedEventData) {
        // Normalizza i dati per assicurarsi che gli array siano sempre definiti
        const normalizedEventData = {
          ...providedEventData,
          EventAttachments: providedEventData.EventAttachments || [],
          EventPartecipants: providedEventData.EventPartecipants || [],
          // Corregge le date per evitare problemi di fuso orario
          EventStartDate: formatDateForInput(providedEventData.EventStartDate),
          EventEndDate: formatDateForInput(providedEventData.EventEndDate),
        };
        setEventData(normalizedEventData);
        setOriginalEventData(normalizedEventData);

        // Inizializza le selezioni per cliente e tecnico
        if (normalizedEventData.CustomerInfo) {
          setSelectedCustomerId(normalizedEventData.CustomerInfo.customer_id);
        }
        if (normalizedEventData.TechnicianAssignment) {
          setSelectedTechnicianId(
            normalizedEventData.TechnicianAssignment.technician_id
          );
        }

        setLoading(false);
      } else {
        // Altrimenti fai la chiamata API (fallback)
        loadEvent();
      }
    }
  }, [isOpen, eventId, providedEventData]);

  const loadEvent = async () => {
    setLoading(true);

    try {
      // Chiamata API reale per caricare tutti gli eventi e filtrare per ID
      const response = await axios.get("Customer/GET/GetAllEvents");

      console.log("Risposta API GetAllEvents:", response.data);

      // Trova l'evento specifico per ID
      let eventData = null;
      if (Array.isArray(response.data)) {
        eventData = response.data.find((event) => event.EventId === eventId);
      } else if (response.data && response.data.events) {
        eventData = response.data.events.find(
          (event: any) => event.EventId === eventId
        );
      } else if (response.data && response.data.data) {
        eventData = response.data.data.find(
          (event: any) => event.EventId === eventId
        );
      }

      console.log("Evento trovato per ID", eventId, ":", eventData);

      // Processa i dati dell'evento
      if (eventData) {
        console.log("Dati evento ricevuti dall'API:", eventData);

        // Mappa i dati dall'API al formato interno
        const processedEvent: CalendarEvent = {
          EventId: eventData.EventId || eventId,
          EventTitle:
            eventData.EventTitle || eventData.title || `Evento #${eventId}`,
          EventStartDate: eventData.EventStartDate
            ? formatDateForInput(eventData.EventStartDate)
            : new Date().toISOString().split("T")[0],
          EventEndDate: eventData.EventEndDate
            ? formatDateForInput(eventData.EventEndDate)
            : new Date().toISOString().split("T")[0],
          EventStartTime: eventData.EventStartTime || eventData.startTime || "",
          EventEndTime: eventData.EventEndTime || eventData.endTime || "",
          EventColor: eventData.EventColor || eventData.color || "#3B82F6",
          EventDescription:
            eventData.EventDescription || eventData.description || "",
          EventLocation: eventData.EventLocation || eventData.location || "",
          EventTagName:
            eventData.EventTagName ||
            eventData.tagName ||
            eventData.category ||
            "Intervento Tecnico",
          EventAttachments:
            eventData.EventAttachments || eventData.attachments || [],
          EventPartecipants:
            eventData.EventPartecipants || eventData.participants || [],
          EventType: eventData.EventType || eventData.type,
          EventPriority: eventData.EventPriority || eventData.priority,
          EstimatedDuration:
            eventData.EstimatedDuration || eventData.estimatedDuration,
          CustomerInfo: eventData.CustomerInfo || eventData.customerInfo,
          TechnicianAssignment:
            eventData.TechnicianAssignment || eventData.technicianAssignment,
          InterventionNotes:
            eventData.InterventionNotes ||
            eventData.interventionNotes ||
            eventData.notes,
        };

        console.log("Evento processato:", processedEvent);
        setEventData(processedEvent);
        setOriginalEventData(processedEvent);
      } else {
        // Se l'evento non esiste, mostra un messaggio di errore
        console.error(
          `Evento con ID ${eventId} non trovato nella lista eventi`
        );
        alert(`Evento con ID ${eventId} non trovato`);
        isClosed();
      }
    } catch (error) {
      console.error("Errore caricamento evento:", error);

      // Fallback: se l'API non è disponibile, usa dati di esempio per testing
      console.warn("API non disponibile, uso dati di fallback per testing");
      const fallbackEvent = {
        ...INITIAL_EVENT_DATA,
        EventId: eventId,
        EventTitle: `Evento Fallback #${eventId}`,
        EventDescription:
          "⚠️ Questo evento è caricato da fallback perché l'API non è disponibile",
        EventLocation: "Ubicazione non disponibile",
        EventTagName: "Intervento Tecnico",
        EventColor: "#F59E0B", // Colore arancione per indicare fallback
        EventStartTime: "09:00",
        EventEndTime: "10:00",
      };
      setEventData(fallbackEvent);
      setOriginalEventData(fallbackEvent);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      // Prepara i dati per l'invio, assicurandosi che le date siano nel formato corretto
      const dataToSend = {
        ...eventData,
        EventStartDate: eventData.EventStartDate || null,
        EventEndDate: eventData.EventEndDate || null,
      };

      // Chiamata API reale per aggiornare l'evento
      const response = await axios.put(
        "Customer/UPDATE/UpdateEvent",
        dataToSend
      );

      const updatedEvent = response.data;

      // Processa le date restituite dal server per assicurarsi che siano nel formato corretto
      const processedUpdatedEvent = {
        ...updatedEvent,
        EventStartDate: formatDateForInput(updatedEvent.EventStartDate),
        EventEndDate: formatDateForInput(updatedEvent.EventEndDate),
      };

      setOriginalEventData(eventData);
      setIsEditing(false);
      showNotification("Evento aggiornato con successo!", "success");

      // Chiama il callback per aggiornare il calendario
      if (onEventUpdated) {
        onEventUpdated(processedUpdatedEvent);
      }
    } catch (error) {
      console.error("Errore aggiornamento evento:", error);
      showNotification("Errore durante l'aggiornamento dell'evento", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);

    try {
      // Chiamata API reale per eliminare l'evento
      await axios.delete(`Customer/DELETE/DeleteEvent/${eventId}`);

      showNotification("Evento eliminato con successo!", "success");

      // Chiama il callback per aggiornare il calendario
      if (onEventDeleted) {
        onEventDeleted(eventId);
      }
    } catch (error) {
      console.error("Errore eliminazione evento:", error);
      showNotification("Errore durante l'eliminazione dell'evento", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEventData(originalEventData);
    setIsEditing(false);
  };

  const addPartecipant = () => {
    if (!newPartecipant.EventPartecipantEmail.trim()) return;

    const newId =
      Math.max(
        ...(eventData.EventPartecipants || []).map((p) => p.EventPartecipantId),
        0
      ) + 1;

    setEventData((prev) => ({
      ...prev,
      EventPartecipants: [
        ...(prev.EventPartecipants || []),
        {
          ...newPartecipant,
          EventPartecipantId: newId,
        },
      ],
    }));

    setNewPartecipant({
      EventPartecipantId: 0,
      EventPartecipantEmail: "",
      EventPartecipantRole: "",
      EventPartecipantStatus: "pending",
    });
  };

  const removePartecipant = (id: number) => {
    setEventData((prev) => ({
      ...prev,
      EventPartecipants: (prev.EventPartecipants || []).filter(
        (p) => p.EventPartecipantId !== id
      ),
    }));
  };

  const removeAttachment = (attachmentId: number) => {
    setEventData((prev) => ({
      ...prev,
      EventAttachments: (prev.EventAttachments || []).filter(
        (a) => a.EventAttachmentId !== attachmentId
      ),
    }));
  };

  const getPriorityColor = (priority: string) => {
    const colorMap: { [key: string]: string } = {
      Normale: "#10B981", // Verde
      Alta: "#F59E0B", // Giallo/Arancione
      Urgente: "#F97316", // Arancione
      Emergenza: "#DC2626", // Rosso scuro
    };
    return colorMap[priority] || "#10B981"; // Default verde per Normale
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      confirmed: "success",
      pending: "warning",
      cancelled: "danger",
    };
    return colorMap[status] || "default";
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ""}`;
    }
    return `${mins}m`;
  };

  return (
    <>
      {/* Notifica temporanea volante */}
      {notification.show && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transition-all duration-300 ease-in-out ${
            notification.type === "success"
              ? "bg-success-50 border border-success-200 text-success-800"
              : "bg-danger-50 border border-danger-200 text-danger-800"
          }`}
        >
          <div className="flex items-center gap-3">
            <Icon
              icon={
                notification.type === "success"
                  ? "solar:check-circle-bold"
                  : "solar:close-circle-bold"
              }
              width={20}
              className={
                notification.type === "success"
                  ? "text-success-600"
                  : "text-danger-600"
              }
            />
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      <Modal
        isOpen={isOpen}
        onClose={isClosed}
        size="3xl"
        scrollBehavior="inside"
        hideCloseButton
        motionProps={{
          variants: {
            enter: {
              y: 0,
              opacity: 1,
              transition: {
                duration: 0.15,
                ease: "easeOut",
              },
            },
            exit: {
              y: -20,
              opacity: 0,
              transition: {
                duration: 0.1,
                ease: "easeIn",
              },
            },
          },
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: eventData.EventColor }}
                />
                <h2 className="text-xl font-bold">
                  {isEditing ? "Modifica Evento" : "Dettagli Evento"}
                </h2>
              </div>

              {!isEditing && (
                <div className="flex gap-2">
                  <Button
                    variant="flat"
                    size="md"
                    onPress={() => setIsEditing(true)}
                    startContent={<Icon icon="solar:pen-2-bold" width={16} />}
                  >
                    Modifica
                  </Button>
                  <ConfirmDeleteEventModal
                    EventData={eventData}
                    DeleteEvent={handleDelete}
                  />
                </div>
              )}
            </div>
          </ModalHeader>

          <ModalBody className="gap-6">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Icon
                  icon="solar:loading-line-duotone"
                  width={32}
                  className="animate-spin"
                />
              </div>
            ) : (
              <>
                {/* Basic Event Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isEditing ? (
                    <Input
                      label="Titolo Evento"
                      value={eventData.EventTitle}
                      onChange={(e) =>
                        setEventData((prev) => ({
                          ...prev,
                          EventTitle: e.target.value,
                        }))
                      }
                      isRequired
                    />
                  ) : (
                    <div>
                      <label className="text-sm font-medium text-default-600">
                        Titolo
                      </label>
                      <p className="text-base font-semibold">
                        {eventData.EventTitle}
                      </p>
                    </div>
                  )}

                  {isEditing ? (
                    <Select
                      label="Categoria"
                      selectedKeys={[eventData.EventTagName]}
                      onSelectionChange={(keys) => {
                        const tagName = Array.from(keys)[0] as string;
                        setEventData((prev) => ({
                          ...prev,
                          EventTagName: tagName,
                        }));
                      }}
                    >
                      {mockEventTags.map((tag) => (
                        <SelectItem key={tag.EventTagName}>
                          {tag.EventTagName}
                        </SelectItem>
                      ))}
                    </Select>
                  ) : (
                    <div>
                      <label className="text-sm font-medium text-default-600">
                        Categoria
                      </label>
                      <p className="text-base">{eventData.EventTagName}</p>
                    </div>
                  )}
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isEditing ? (
                    <>
                      <Input
                        label="Data Inizio"
                        type="date"
                        value={formatDateForInput(eventData.EventStartDate)}
                        onChange={(e) =>
                          setEventData((prev) => ({
                            ...prev,
                            EventStartDate: e.target.value,
                          }))
                        }
                      />
                      <Input
                        label="Data Fine"
                        type="date"
                        value={formatDateForInput(eventData.EventEndDate)}
                        onChange={(e) =>
                          setEventData((prev) => ({
                            ...prev,
                            EventEndDate: e.target.value,
                          }))
                        }
                      />
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="text-sm font-medium text-default-600">
                          Data Inizio
                        </label>
                        <p className="text-base">
                          {new Date(
                            eventData.EventStartDate
                          ).toLocaleDateString("it-IT")}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-default-600">
                          Data Fine
                        </label>
                        <p className="text-base">
                          {new Date(eventData.EventEndDate).toLocaleDateString(
                            "it-IT"
                          )}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isEditing ? (
                    <>
                      <Input
                        label="Ora Inizio"
                        type="time"
                        value={eventData.EventStartTime}
                        onChange={(e) =>
                          setEventData((prev) => ({
                            ...prev,
                            EventStartTime: e.target.value,
                          }))
                        }
                      />
                      <Input
                        label="Ora Fine"
                        type="time"
                        value={eventData.EventEndTime}
                        onChange={(e) =>
                          setEventData((prev) => ({
                            ...prev,
                            EventEndTime: e.target.value,
                          }))
                        }
                      />
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="text-sm font-medium text-default-600">
                          Ora Inizio
                        </label>
                        <p className="text-base">{eventData.EventStartTime}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-default-600">
                          Ora Fine
                        </label>
                        <p className="text-base">{eventData.EventEndTime}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Location */}
                {isEditing ? (
                  <Input
                    label="Luogo"
                    value={eventData.EventLocation}
                    onChange={(e) =>
                      setEventData((prev) => ({
                        ...prev,
                        EventLocation: e.target.value,
                      }))
                    }
                    startContent={
                      <Icon icon="solar:map-point-bold" width={20} />
                    }
                  />
                ) : (
                  eventData.EventLocation && (
                    <div>
                      <label className="text-sm font-medium text-default-600">
                        Luogo
                      </label>
                      <p className="text-base flex items-center gap-2">
                        <Icon icon="solar:map-point-bold" width={16} />
                        {eventData.EventLocation}
                      </p>
                    </div>
                  )
                )}

                {/* Priority */}
                {isEditing ? (
                  <Select
                    label="Priorità"
                    placeholder="Seleziona priorità"
                    selectedKeys={
                      eventData.EventPriority ? [eventData.EventPriority] : []
                    }
                    onSelectionChange={(keys) => {
                      const priority = Array.from(keys)[0] as string;
                      setEventData((prev) => ({
                        ...prev,
                        EventPriority: priority,
                      }));
                    }}
                    startContent={<Icon icon="solar:flag-bold" width={20} />}
                  >
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.key}>{option.label}</SelectItem>
                    ))}
                  </Select>
                ) : (
                  eventData.EventPriority && (
                    <div>
                      <label className="text-sm font-medium text-default-600">
                        Priorità
                      </label>
                      <p className="text-base flex items-center gap-2">
                        <span className="text-lg">
                          {eventData.EventPriority === "Normale" && "🟢"}
                          {eventData.EventPriority === "Alta" && "🟡"}
                          {eventData.EventPriority === "Urgente" && "🟠"}
                          {eventData.EventPriority === "Emergenza" && "🔴"}
                        </span>
                        {eventData.EventPriority}
                      </p>
                    </div>
                  )
                )}

                {/* Description */}
                {isEditing ? (
                  <Textarea
                    label="Descrizione"
                    value={eventData.EventDescription}
                    onChange={(e) =>
                      setEventData((prev) => ({
                        ...prev,
                        EventDescription: e.target.value,
                      }))
                    }
                    rows={4}
                  />
                ) : (
                  eventData.EventDescription && (
                    <div>
                      <label className="text-sm font-medium text-default-600">
                        Descrizione
                      </label>
                      <p className="text-base whitespace-pre-wrap">
                        {eventData.EventDescription}
                      </p>
                    </div>
                  )
                )}

                {/* Assegnazioni Unificate */}
                <div className="border border-default-200 rounded-lg p-4 bg-default-50">
                  <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                    <Icon icon="solar:user-bold" width={16} />
                    Assegnazioni
                  </h3>

                  {isEditing ? (
                    <>
                      {/* Select per Cliente e Tecnico (sempre visibili quando non ci sono assegnazioni) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {!eventData.CustomerInfo && (
                          <Select
                            label="Cliente"
                            placeholder="Seleziona cliente"
                            selectedKeys={
                              selectedCustomerId ? [selectedCustomerId] : []
                            }
                            onSelectionChange={(keys) => {
                              const customerId = Array.from(keys)[0] as string;
                              setSelectedCustomerId(customerId);

                              // Trova i dati del cliente selezionato
                              const selectedCustomer = availableCustomers.find(
                                (c) => c.customer_id === customerId
                              );
                              if (selectedCustomer) {
                                setEventData((prev) => ({
                                  ...prev,
                                  CustomerInfo: {
                                    customer_id: selectedCustomer.customer_id,
                                    customer_name: `${selectedCustomer.name} ${selectedCustomer.surname}`,
                                    customer_phone: selectedCustomer.phone,
                                    customer_email:
                                      selectedCustomer.email || "",
                                    customer_address:
                                      selectedCustomer.address || "",
                                    customer_type:
                                      selectedCustomer.type || "Cliente",
                                  },
                                }));
                              }
                            }}
                          >
                            {availableCustomers.map((customer) => (
                              <SelectItem key={customer.customer_id}>
                                {customer.name} {customer.surname}
                              </SelectItem>
                            ))}
                          </Select>
                        )}

                        {!eventData.TechnicianAssignment && (
                          <Select
                            label="Tecnico"
                            placeholder="Seleziona tecnico"
                            selectedKeys={
                              selectedTechnicianId ? [selectedTechnicianId] : []
                            }
                            onSelectionChange={(keys) => {
                              const technicianId = Array.from(
                                keys
                              )[0] as string;
                              setSelectedTechnicianId(technicianId);

                              // Trova i dati del tecnico selezionato
                              const selectedTechnician =
                                availableTechnicians.find(
                                  (t) => t.user_id === technicianId
                                );
                              if (selectedTechnician) {
                                setEventData((prev) => ({
                                  ...prev,
                                  TechnicianAssignment: {
                                    technician_id: selectedTechnician.user_id,
                                    technician_name: `${selectedTechnician.name} ${selectedTechnician.surname}`,
                                    role: selectedTechnician.role || "Tecnico",
                                    availability_status:
                                      selectedTechnician.availability_status ||
                                      "Disponibile",
                                  },
                                }));
                              }
                            }}
                          >
                            {availableTechnicians.map((technician) => (
                              <SelectItem key={technician.user_id}>
                                {technician.name} {technician.surname}
                              </SelectItem>
                            ))}
                          </Select>
                        )}
                      </div>

                      {/* Informazioni Assegnate (sempre visibili quando ci sono assegnazioni) */}
                      {(eventData.CustomerInfo ||
                        eventData.TechnicianAssignment) && (
                        <div className="space-y-3 pt-3 border-t border-default-200">
                          {eventData.CustomerInfo && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                                  <span className="text-lg">👤</span>
                                </div>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                      Cliente:
                                    </span>
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                      {eventData.CustomerInfo.customer_name}
                                    </span>
                                  </div>
                                  <span className="text-xs text-blue-600 dark:text-blue-400">
                                    📞 {eventData.CustomerInfo.customer_phone}
                                  </span>
                                  {eventData.CustomerInfo.customer_email && (
                                    <span className="text-xs text-blue-600 dark:text-blue-400">
                                      ✉️ {eventData.CustomerInfo.customer_email}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                color="danger"
                                variant="light"
                                onPress={() => {
                                  setSelectedCustomerId("");
                                  setEventData((prev) => ({
                                    ...prev,
                                    CustomerInfo: undefined,
                                  }));
                                }}
                                className="flex-shrink-0"
                              >
                                <Icon
                                  icon="solar:trash-bin-trash-bold"
                                  width={14}
                                />
                              </Button>
                            </div>
                          )}

                          {eventData.TechnicianAssignment && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                                  <span className="text-lg">🔧</span>
                                </div>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                                      Tecnico:
                                    </span>
                                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                      {
                                        eventData.TechnicianAssignment
                                          .technician_name
                                      }
                                    </span>
                                  </div>
                                  <span className="text-xs text-orange-600 dark:text-orange-400">
                                    🛠️ Tecnico assegnato
                                  </span>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                color="danger"
                                variant="light"
                                onPress={() => {
                                  setSelectedTechnicianId("");
                                  setEventData((prev) => ({
                                    ...prev,
                                    TechnicianAssignment: undefined,
                                  }));
                                }}
                                className="flex-shrink-0"
                              >
                                <Icon
                                  icon="solar:trash-bin-trash-bold"
                                  width={14}
                                />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    /* Visualizzazione Assegnazioni */
                    <div className="space-y-3">
                      {eventData.CustomerInfo && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                              <span className="text-lg">👤</span>
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                  Cliente:
                                </span>
                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                  {eventData.CustomerInfo.customer_name}
                                </span>
                              </div>
                              <span className="text-xs text-blue-600 dark:text-blue-400">
                                📞 {eventData.CustomerInfo.customer_phone}
                              </span>
                              {eventData.CustomerInfo.customer_email && (
                                <span className="text-xs text-blue-600 dark:text-blue-400">
                                  ✉️ {eventData.CustomerInfo.customer_email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {eventData.TechnicianAssignment && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                              <span className="text-lg">🔧</span>
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                                  Tecnico:
                                </span>
                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                  {
                                    eventData.TechnicianAssignment
                                      .technician_name
                                  }
                                </span>
                              </div>
                              <span className="text-xs text-orange-600 dark:text-orange-400">
                                🛠️ Tecnico assegnato
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Accordion for Advanced Info */}
                {((eventData.EventPartecipants?.length || 0) > 0 ||
                  isEditing ||
                  (eventData.EventAttachments?.length || 0) > 0 ||
                  eventData.InterventionNotes) && (
                  <Accordion>
                    {[
                      (eventData.EventPartecipants?.length || 0) > 0 ||
                      isEditing ? (
                        <AccordionItem
                          key="participants"
                          title={`Partecipanti (${
                            eventData.EventPartecipants?.length || 0
                          })`}
                          startContent={
                            <Icon
                              icon="solar:users-group-rounded-bold"
                              width={20}
                            />
                          }
                        >
                          <div className="space-y-3">
                            {isEditing && (
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Email partecipante"
                                  value={newPartecipant.EventPartecipantEmail}
                                  onChange={(e) =>
                                    setNewPartecipant((prev) => ({
                                      ...prev,
                                      EventPartecipantEmail: e.target.value,
                                    }))
                                  }
                                  className="flex-1"
                                />
                                <Input
                                  placeholder="Ruolo"
                                  value={newPartecipant.EventPartecipantRole}
                                  onChange={(e) =>
                                    setNewPartecipant((prev) => ({
                                      ...prev,
                                      EventPartecipantRole: e.target.value,
                                    }))
                                  }
                                  className="w-32"
                                />
                                <Button
                                  onPress={addPartecipant}
                                  isIconOnly
                                  color="primary"
                                  variant="flat"
                                >
                                  <Icon icon="solar:add-bold" width={16} />
                                </Button>
                              </div>
                            )}

                            {(eventData.EventPartecipants || []).map(
                              (participant) => (
                                <div
                                  key={participant.EventPartecipantId}
                                  className="flex items-center justify-between bg-default-100 rounded-lg p-3"
                                >
                                  <div className="flex items-center gap-3">
                                    <Avatar
                                      name={participant.EventPartecipantEmail}
                                      size="sm"
                                    />
                                    <div>
                                      <div className="font-medium text-sm">
                                        {participant.EventPartecipantEmail}
                                      </div>
                                      <div className="text-xs text-default-500">
                                        {participant.EventPartecipantRole}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Chip
                                      size="sm"
                                      color={
                                        getStatusColor(
                                          participant.EventPartecipantStatus
                                        ) as any
                                      }
                                      variant="flat"
                                    >
                                      {participant.EventPartecipantStatus}
                                    </Chip>
                                    {isEditing && (
                                      <Button
                                        onPress={() =>
                                          removePartecipant(
                                            participant.EventPartecipantId
                                          )
                                        }
                                        isIconOnly
                                        size="sm"
                                        color="danger"
                                        variant="light"
                                      >
                                        <Icon
                                          icon="solar:trash-bin-trash-bold"
                                          width={14}
                                        />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </AccordionItem>
                      ) : null,

                      (eventData.EventAttachments?.length || 0) > 0 ? (
                        <AccordionItem
                          key="attachments"
                          title={`Allegati (${
                            eventData.EventAttachments?.length || 0
                          })`}
                          startContent={
                            <Icon icon="solar:paperclip-bold" width={20} />
                          }
                        >
                          <div className="space-y-3">
                            {(eventData.EventAttachments || []).map(
                              (attachment) => (
                                <FileCard
                                  key={attachment.EventAttachmentId}
                                  file={attachment}
                                  index={attachment.EventAttachmentId}
                                  DeleteFile={(file) =>
                                    removeAttachment(file.EventAttachmentId)
                                  }
                                  variant="default"
                                />
                              )
                            )}
                          </div>
                        </AccordionItem>
                      ) : null,

                      eventData.InterventionNotes ? (
                        <AccordionItem
                          key="notes"
                          title="Note Intervento"
                          startContent={
                            <Icon icon="solar:notes-bold" width={20} />
                          }
                        >
                          <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
                            <p className="text-sm">
                              {eventData.InterventionNotes}
                            </p>
                          </div>
                        </AccordionItem>
                      ) : null,
                    ].filter(Boolean)}
                  </Accordion>
                )}
              </>
            )}
          </ModalBody>

          <ModalFooter>
            {isEditing ? (
              <div className="flex gap-2">
                <Button
                  variant="light"
                  onPress={handleCancel}
                  isDisabled={loading}
                >
                  Annulla
                </Button>
                <Button
                  color="primary"
                  onPress={handleSave}
                  isLoading={loading}
                  isDisabled={!eventData.EventTitle.trim()}
                >
                  {loading ? "Salvataggio..." : "Salva"}
                </Button>
              </div>
            ) : (
              <Button variant="light" onPress={isClosed}>
                Chiudi
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
