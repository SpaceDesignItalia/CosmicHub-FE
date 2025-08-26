import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface EventPartecipant {
  EventPartecipantEmail: string;
  EventPartecipantRole: string;
}

interface EventAttachment {
  EventAttachmentId: number;
  EventAttachmentUrl: string;
  EventAttachmentName: string;
}

interface CalendarEvent {
  EventId: number;
  EventTitle: string;
  EventStartDate: string;
  EventEndDate: string;
  EventStartTime: string;
  EventEndTime: string;
  EventColor: string;
  EventDescription: string;
  EventLocation: string;
  EventTagId: number;
  EventAttachments: EventAttachment[];
  EventPartecipants: EventPartecipant[];
  // CosmicHub specific fields
  EventType?: string;
  EventPriority?: string;
  EstimatedDuration?: string;
  CustomerInfo?: {
    customer_id: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string;
  };
  TechnicianAssignment?: {
    technician_id: string;
    technician_name: string;
  };
  InterventionNotes?: string;
  IsFromCCC?: boolean;
  CCCData?: any;
}

interface EventTag {
  EventTagId: number;
  EventTagName: string;
}

interface Technician {
  user_id: string;
  name: string;
  email: string;
  specializations: string[];
}

interface AddEventModalProps {
  isOpen: boolean;
  isClosed: () => void;
  prefilledData?: any;
  eventTags?: EventTag[];
  technicians?: any[];
  onEventCreated?: (event: CalendarEvent | null) => void;
  onModalClose?: () => void; // Nuovo callback per pulire dati pending
}

// Mock data per CosmicHub
const mockEventTags: EventTag[] = [
  { EventTagId: 1, EventTagName: "Intervento Tecnico" },
  { EventTagId: 2, EventTagName: "Manutenzione" },
  { EventTagId: 3, EventTagName: "Installazione" },
  { EventTagId: 4, EventTagName: "Riparazione" },
  { EventTagId: 5, EventTagName: "Controllo" },
  { EventTagId: 6, EventTagName: "Preventivo" },
];

const appointmentColors = [
  { color: "#EF4444", name: "Urgente" },
  { color: "#F59E0B", name: "Alta Priorità" },
  { color: "#10B981", name: "Normale" },
  { color: "#3B82F6", name: "Bassa Priorità" },
  { color: "#6366F1", name: "Programmata" },
];

const interventionTypes = [
  "Riparazione",
  "Manutenzione",
  "Ispezione",
  "Installazione",
  "Consulenza",
  "Intervento Tecnico",
];
const priorityLevels = ["Normale", "Alta", "Urgente", "Emergenza"];

// Mapping functions for data conversion
const getEventTypeMapping = (eventType: string) => {
  const typeMap: { [key: string]: string } = {
    // Valori dal form cliente
    inspection: "Ispezione",
    repair: "Riparazione",
    maintenance: "Manutenzione",
    installation: "Installazione",
    consultation: "Consulenza",
    // Valori legacy per compatibilità
    appointment: "Intervento Tecnico",
    intervention: "Riparazione",
  };
  return typeMap[eventType] || "Intervento Tecnico";
};

const getPriorityMapping = (priority: string) => {
  // Mappa le priorità dal form cliente al modal
  const priorityMap: { [key: string]: string } = {
    low: "Normale",
    medium: "Normale",
    high: "Alta",
    emergency: "Emergenza",
    Normale: "Normale",
    Alta: "Alta",
    Urgente: "Urgente",
    Emergenza: "Emergenza",
  };
  return priorityMap[priority] || "Normale";
};

const INITIAL_EVENT_DATA: CalendarEvent = {
  EventId: 0,
  EventTitle: "",
  EventStartDate: new Date().toISOString().split("T")[0],
  EventEndDate: new Date().toISOString().split("T")[0],
  EventStartTime: "09:00",
  EventEndTime: "10:00",
  EventColor: "#10B981", // Colore verde per priorità Normale
  EventDescription: "",
  EventLocation: "",
  EventTagId: 1,
  EventAttachments: [],
  EventPartecipants: [],
  EventType: "Intervento Tecnico",
  EventPriority: "Normale",
  EstimatedDuration: "60",
};

export default function AddEventModal({
  isOpen,
  isClosed,
  prefilledData = null,
  eventTags = mockEventTags,
  technicians = [],
  onEventCreated,
  onModalClose,
}: AddEventModalProps) {
  const [eventData, setEventData] = useState<CalendarEvent>(INITIAL_EVENT_DATA);
  const [loading, setLoading] = useState(false);
  const [newPartecipant, setNewPartecipant] = useState<EventPartecipant>({
    EventPartecipantEmail: "",
    EventPartecipantRole: "",
  });
  const [showCCCBanner, setShowCCCBanner] = useState(false);
  const [showPreparationBanner, setShowPreparationBanner] = useState(false);

  // Nuovi state per clienti e tecnici
  const [availableCustomers, setAvailableCustomers] = useState<any[]>([]);
  const [availableTechnicians, setAvailableTechnicians] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>("");

  const navigate = useNavigate();

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
    if (isOpen) {
      // Reset form when modal opens - SEMPRE pulisci tutto
      setEventData({
        ...INITIAL_EVENT_DATA,
        CustomerInfo: undefined,
        TechnicianAssignment: undefined,
      });
      setShowCCCBanner(false);
      setShowPreparationBanner(false);

      // Reset selezioni cliente e tecnico
      setSelectedCustomerId("");
      setSelectedTechnicianId("");

      // Carica clienti e tecnici disponibili
      loadCustomersAndTechnicians();

      // Apply prefilled data if coming from CCC or New Event Form
      if (prefilledData) {
        // Check if data comes from preparation form or CCC
        const isFromPreparation = prefilledData.from_preparation;
        setShowCCCBanner(!isFromPreparation);
        setShowPreparationBanner(isFromPreparation);

        let updatedEventData;

        if (isFromPreparation) {
          // Handle data from NewEvent preparation form
          updatedEventData = {
            ...INITIAL_EVENT_DATA,
            EventTitle: prefilledData.title || "",
            EventDescription: prefilledData.description || "",
            EventLocation: prefilledData.location || "",
            EventType:
              getEventTypeMapping(prefilledData.event_type) ||
              "Intervento Tecnico",
            EventPriority:
              getPriorityMapping(
                prefilledData.priority || prefilledData.urgency_level
              ) || "Normale",
            EstimatedDuration: prefilledData.estimated_duration || "60",
            // Usa la data selezionata se disponibile, altrimenti usa la data corrente
            EventStartDate:
              prefilledData.selectedDate ||
              new Date().toISOString().split("T")[0],
            EventEndDate:
              prefilledData.selectedDate ||
              new Date().toISOString().split("T")[0],
            // Imposta l'orario se è stato selezionato un'ora specifica
            EventStartTime:
              prefilledData.selectedHour !== undefined
                ? `${String(prefilledData.selectedHour).padStart(2, "0")}:00`
                : "09:00",
            EventEndTime:
              prefilledData.selectedHour !== undefined
                ? `${String(prefilledData.selectedHour + 1).padStart(
                    2,
                    "0"
                  )}:00`
                : "10:00",
            CustomerInfo: prefilledData.customer_id
              ? {
                  customer_id: prefilledData.customer_id || "",
                  customer_name: prefilledData.customer_name || "",
                  customer_phone: prefilledData.customer_phone || "",
                  customer_email: prefilledData.customer_email || "",
                }
              : undefined,
            TechnicianAssignment: prefilledData.assigned_technician
              ? {
                  technician_id: prefilledData.assigned_technician_id || "",
                  technician_name: prefilledData.assigned_technician,
                }
              : undefined,
            InterventionNotes: prefilledData.notes || "",
          };
        } else {
          // Handle data from CCC (existing logic)
          updatedEventData = {
            ...INITIAL_EVENT_DATA,
            EventTitle: prefilledData.problem_description || "",
            EventDescription: prefilledData.notes || "",
            EventLocation: prefilledData.location || "",
            EventType: prefilledData.intervention_type || "Intervento Tecnico",
            EventPriority: prefilledData.urgency_level || "Normale",
            EstimatedDuration: prefilledData.estimated_duration || "60",
            // Usa la data selezionata se disponibile, altrimenti usa la data corrente
            EventStartDate:
              prefilledData.selectedDate ||
              new Date().toISOString().split("T")[0],
            EventEndDate:
              prefilledData.selectedDate ||
              new Date().toISOString().split("T")[0],
            // Imposta l'orario se è stato selezionato un'ora specifica
            EventStartTime:
              prefilledData.selectedHour !== undefined
                ? `${String(prefilledData.selectedHour).padStart(2, "0")}:00`
                : "09:00",
            EventEndTime:
              prefilledData.selectedHour !== undefined
                ? `${String(prefilledData.selectedHour + 1).padStart(
                    2,
                    "0"
                  )}:00`
                : "10:00",
            CustomerInfo: prefilledData.customer_id
              ? {
                  customer_id: prefilledData.customer_id || "",
                  customer_name: prefilledData.customer_name || "",
                  customer_phone: prefilledData.customer_phone || "",
                  customer_email: prefilledData.customer_email || "",
                }
              : undefined,
            TechnicianAssignment: prefilledData.assigned_technician_id
              ? {
                  technician_id: prefilledData.assigned_technician_id,
                  technician_name: prefilledData.assigned_technician || "",
                }
              : undefined,
            InterventionNotes: prefilledData.notes || "",
            // Nota: rimuovo le proprietà extra che non esistono nel tipo CalendarEvent
          };
        }

        setEventData(updatedEventData);

        // Imposta i valori selezionati per i select solo se ci sono dati precompilati
        if (prefilledData && prefilledData.customer_id) {
          setSelectedCustomerId(prefilledData.customer_id);
        }
        if (
          prefilledData &&
          (prefilledData.assigned_technician_id || prefilledData.technician_id)
        ) {
          setSelectedTechnicianId(
            prefilledData.assigned_technician_id || prefilledData.technician_id
          );
        }
      }
    }
  }, [isOpen, prefilledData]);

  const handleSave = async () => {
    if (!eventData.EventTitle.trim()) {
      alert("Il titolo dell'evento è obbligatorio");
      return;
    }

    setLoading(true);

    try {
      // Chiamata API per salvare l'evento
      const response = await axios.post("Customer/POST/AddEvent", eventData);

      if (response.status === 200) {
        // Usa i dati restituiti dall'API se disponibili, altrimenti usa quelli locali
        const savedEvent = response.data || {
          ...eventData,
          EventId: Date.now(), // Fallback ID se l'API non restituisce l'evento
        };

        console.log("Evento salvato:", savedEvent);

        // Call parent callback if provided
        if (onEventCreated) {
          onEventCreated(savedEvent);
        }

        // Resta sul calendario; non navigare ai clienti
        if (prefilledData) {
          // Se viene da cliente o form preparazione, pulisci i dati e torna al calendario pulito
          setEventData({
            ...INITIAL_EVENT_DATA,
            CustomerInfo: undefined,
            TechnicianAssignment: undefined,
          });
          setSelectedCustomerId("");
          setSelectedTechnicianId("");

          // Pulisci anche pendingEventData per non mantenere i dati del cliente
          if (prefilledData.from_ccc || prefilledData.from_call) {
            if (onModalClose) {
              onModalClose();
            }
          }

          navigate("/calendar", { replace: true });
        }

        // Close modal
        isClosed();

        // Mostra messaggio di successo
        alert("Evento creato con successo!");
      }
    } catch (error) {
      console.error("Errore nella creazione dell'evento:", error);
      alert("Errore nella creazione dell'evento");
    } finally {
      setLoading(false);
    }
  };

  const addPartecipant = () => {
    if (!newPartecipant.EventPartecipantEmail.trim()) return;

    setEventData((prev) => ({
      ...prev,
      EventPartecipants: [...prev.EventPartecipants, { ...newPartecipant }],
    }));

    setNewPartecipant({
      EventPartecipantEmail: "",
      EventPartecipantRole: "",
    });
  };

  const removePartecipant = (index: number) => {
    setEventData((prev) => ({
      ...prev,
      EventPartecipants: prev.EventPartecipants.filter((_, i) => i !== index),
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

  // Funzione personalizzata per gestire la chiusura del modal
  const handleModalClose = () => {
    // Se si viene da cliente o form preparazione, torna al calendario pulito
    if (prefilledData) {
      // Pulisci i dati del modal
      setEventData({
        ...INITIAL_EVENT_DATA,
        CustomerInfo: undefined,
        TechnicianAssignment: undefined,
      });
      setSelectedCustomerId("");
      setSelectedTechnicianId("");
      // NON pulire pendingEventData: mantieni le informazioni per poter cambiare giorno
      // Resta sul calendario, ripulendo solo la query
      navigate("/calendar", { replace: true });
    }
    // Chiudi il modal
    isClosed();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      size="2xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">Nuovo Evento</h2>
        </ModalHeader>

        <ModalBody className="gap-4">
          {/* Basic Event Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Titolo Evento"
              placeholder="Inserisci il titolo..."
              value={eventData.EventTitle}
              onChange={(e) =>
                setEventData((prev) => ({
                  ...prev,
                  EventTitle: e.target.value,
                }))
              }
              isRequired
              startContent={<Icon icon="solar:calendar-bold" width={20} />}
            />

            <Select
              label="Categoria"
              placeholder="Seleziona categoria"
              selectedKeys={[eventData.EventTagId.toString()]}
              onSelectionChange={(keys) => {
                const tagId = Number(Array.from(keys)[0]);
                setEventData((prev) => ({ ...prev, EventTagId: tagId }));
              }}
            >
              {eventTags.map((tag) => (
                <SelectItem key={tag.EventTagId.toString()}>
                  {tag.EventTagName}
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Data Inizio"
              type="date"
              value={eventData.EventStartDate}
              onChange={(e) =>
                setEventData((prev) => ({
                  ...prev,
                  EventStartDate: e.target.value,
                }))
              }
              isRequired
            />

            <Input
              label="Data Fine"
              type="date"
              value={eventData.EventEndDate}
              onChange={(e) =>
                setEventData((prev) => ({
                  ...prev,
                  EventEndDate: e.target.value,
                }))
              }
              isRequired
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              isRequired
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
              isRequired
            />
          </div>

          {/* CosmicHub Specific Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tipo Intervento"
              placeholder="Seleziona tipo"
              selectedKeys={eventData.EventType ? [eventData.EventType] : []}
              onSelectionChange={(keys) => {
                const type = Array.from(keys)[0] as string;
                setEventData((prev) => ({ ...prev, EventType: type }));
              }}
            >
              {interventionTypes.map((type) => (
                <SelectItem key={type}>{type}</SelectItem>
              ))}
            </Select>

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
                  EventColor: getPriorityColor(priority),
                }));
              }}
            >
              <SelectItem key="Normale">🟢 Normale</SelectItem>
              <SelectItem key="Alta">🟡 Alta</SelectItem>
              <SelectItem key="Urgente">🟠 Urgente</SelectItem>
              <SelectItem key="Emergenza">🔴 Emergenza</SelectItem>
            </Select>
          </div>

          {/* Location */}
          <Input
            label="Luogo"
            placeholder="Inserisci il luogo..."
            value={eventData.EventLocation}
            onChange={(e) =>
              setEventData((prev) => ({
                ...prev,
                EventLocation: e.target.value,
              }))
            }
            startContent={<Icon icon="solar:map-point-bold" width={20} />}
          />

          {/* Description */}
          <Textarea
            label="Descrizione"
            placeholder="Inserisci una descrizione..."
            value={eventData.EventDescription}
            onChange={(e) =>
              setEventData((prev) => ({
                ...prev,
                EventDescription: e.target.value,
              }))
            }
            rows={3}
          />

          {/* Card Assegnazioni Unificata */}
          <div className="border border-default-200 rounded-lg p-4 bg-default-50">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Icon icon="solar:user-bold" width={16} />
              Assegnazioni
            </h3>

            {/* Select per Cliente e Tecnico (sempre visibili quando non ci sono assegnazioni) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {!eventData.CustomerInfo && (
                <Select
                  label="Cliente"
                  placeholder="Seleziona cliente"
                  selectedKeys={selectedCustomerId ? [selectedCustomerId] : []}
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
                          customer_email: selectedCustomer.email || "",
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
                    const technicianId = Array.from(keys)[0] as string;
                    setSelectedTechnicianId(technicianId);

                    // Trova i dati del tecnico selezionato
                    const selectedTechnician = availableTechnicians.find(
                      (t) => t.user_id === technicianId
                    );
                    if (selectedTechnician) {
                      setEventData((prev) => ({
                        ...prev,
                        TechnicianAssignment: {
                          technician_id: selectedTechnician.user_id,
                          technician_name: selectedTechnician.name,
                        },
                      }));
                    }
                  }}
                >
                  {availableTechnicians.map((technician) => (
                    <SelectItem key={technician.user_id}>
                      {technician.name}
                    </SelectItem>
                  ))}
                </Select>
              )}
            </div>

            {/* Informazioni Assegnate (sempre visibili quando ci sono assegnazioni) */}
            {(eventData.CustomerInfo || eventData.TechnicianAssignment) && (
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
                      <Icon icon="solar:trash-bin-trash-bold" width={14} />
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
                            {eventData.TechnicianAssignment.technician_name}
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
                      <Icon icon="solar:trash-bin-trash-bold" width={14} />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Participants */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Partecipanti</h3>

            {/* Add new participant */}
            <div className="flex gap-2 mb-3">
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

            {/* Participants list */}
            {eventData.EventPartecipants.map((participant, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-default-100 rounded-lg p-2 mb-2"
              >
                <div>
                  <div className="font-medium text-sm">
                    {participant.EventPartecipantEmail}
                  </div>
                  <div className="text-xs text-default-500">
                    {participant.EventPartecipantRole}
                  </div>
                </div>
                <Button
                  onPress={() => removePartecipant(index)}
                  isIconOnly
                  size="sm"
                  color="danger"
                  variant="light"
                >
                  <Icon icon="solar:trash-bin-trash-bold" width={14} />
                </Button>
              </div>
            ))}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={isClosed}>Annulla</Button>
          <Button
            color="primary"
            onPress={handleSave}
            isLoading={loading}
            isDisabled={!eventData.EventTitle.trim()}
          >
            {loading ? "Salvataggio..." : "Salva Evento"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
