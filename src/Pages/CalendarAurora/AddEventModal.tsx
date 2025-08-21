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
  prefilledData?: any | null;
  eventTags?: EventTag[];
  technicians?: Technician[];
  onEventCreated?: (event: CalendarEvent) => void;
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
const priorityLevels = ["Bassa", "Normale", "Alta", "Urgente", "Critica"];

// Mapping functions for data conversion
const getEventTypeMapping = (eventType: string) => {
  const typeMap: { [key: string]: string } = {
    appointment: "Intervento Tecnico",
    intervention: "Riparazione",
    inspection: "Ispezione",
    maintenance: "Manutenzione",
    consultation: "Consulenza",
  };
  return typeMap[eventType] || "Intervento Tecnico";
};

const getPriorityMapping = (priority: string) => {
  const priorityMap: { [key: string]: string } = {
    low: "Bassa",
    medium: "Normale",
    high: "Alta",
    emergency: "Urgente",
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
  EventColor: appointmentColors[2].color,
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
}: AddEventModalProps) {
  const [eventData, setEventData] = useState<CalendarEvent>(INITIAL_EVENT_DATA);
  const [loading, setLoading] = useState(false);
  const [newPartecipant, setNewPartecipant] = useState<EventPartecipant>({
    EventPartecipantEmail: "",
    EventPartecipantRole: "",
  });
  const [showCCCBanner, setShowCCCBanner] = useState(false);
  const [showPreparationBanner, setShowPreparationBanner] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setEventData(INITIAL_EVENT_DATA);
      setShowCCCBanner(false);
      setShowPreparationBanner(false);

      // Apply prefilled data if coming from CCC or New Event Form
      console.log(prefilledData);
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
              getPriorityMapping(prefilledData.priority) || "Normale",
            EstimatedDuration: prefilledData.estimated_duration || "60",
            CustomerInfo: {
              customer_id: prefilledData.customer_id || "",
              customer_name: prefilledData.customer_name || "",
              customer_phone: prefilledData.customer_phone || "",
              customer_email: prefilledData.customer_email || "",
            },
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
            CustomerInfo: {
              customer_id: prefilledData.customer_id || "",
              customer_name: prefilledData.customer_name || "",
              customer_phone: prefilledData.customer_phone || "",
              customer_email: prefilledData.customer_email || "",
            },
            TechnicianAssignment: prefilledData.technician_id
              ? {
                  technician_id: prefilledData.technician_id,
                  technician_name: prefilledData.technician_name || "",
                }
              : undefined,
            InterventionNotes: prefilledData.notes || "",
            // Nota: rimuovo le proprietà extra che non esistono nel tipo CalendarEvent
          };
        }

        setEventData(updatedEventData);
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
      // Mock save - simulate API call
      const newEvent: CalendarEvent = {
        ...eventData,
        EventId: Date.now(), // Mock ID generation
      };

      console.log(newEvent);

      axios.post("Customer/POST/AddEvent", newEvent).then((res) => {
        if (res.status === 200) {
          // Call parent callback if provided
          if (onEventCreated) {
            onEventCreated(newEvent);
          }

          // Navigate back to customers if from CCC
          if (eventData.IsFromCCC) {
            navigate("/customers");
          }

          // Close modal
          isClosed();
        }
      });
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
      Bassa: "#10B981",
      Normale: "#3B82F6",
      Alta: "#F59E0B",
      Urgente: "#EF4444",
      Critica: "#DC2626",
    };
    return colorMap[priority] || "#3B82F6";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isClosed}
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
              {priorityLevels.map((priority) => (
                <SelectItem key={priority}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getPriorityColor(priority) }}
                    />
                    {priority}
                  </div>
                </SelectItem>
              ))}
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

          {/* Customer Info (if from CCC) */}
          {eventData.CustomerInfo && (
            <div className="border border-default-200 rounded-lg p-4 bg-default-50">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Icon icon="solar:user-bold" width={16} />
                Informazioni Cliente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-default-500">Nome:</span>{" "}
                  {eventData.CustomerInfo.customer_name}
                </div>
                <div>
                  <span className="text-default-500">Telefono:</span>{" "}
                  {eventData.CustomerInfo.customer_phone}
                </div>
                <div className="md:col-span-2">
                  <span className="text-default-500">Email:</span>{" "}
                  {eventData.CustomerInfo.customer_email}
                </div>
              </div>
            </div>
          )}

          {/* Technician Assignment (if from CCC) */}
          {eventData.TechnicianAssignment && (
            <div className="border border-default-200 rounded-lg p-4 bg-default-50">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Icon icon="solar:wrench-bold" width={16} />
                Tecnico Assegnato
              </h3>
              <div className="text-sm">
                <span className="text-default-500">Tecnico:</span>{" "}
                {eventData.TechnicianAssignment.technician_name}
              </div>
            </div>
          )}

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
          <Button
            variant="light"
            onPress={() => {
              if (eventData.IsFromCCC) {
                navigate("/customers");
              } else {
                isClosed();
              }
            }}
          >
            {eventData.IsFromCCC ? "Torna ai Clienti" : "Annulla"}
          </Button>
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
