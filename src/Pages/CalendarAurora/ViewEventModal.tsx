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
  EventStartDate: new Date().toISOString().split('T')[0],
  EventEndDate: new Date().toISOString().split('T')[0],
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

const priorityLevels = [
  "Bassa",
  "Normale", 
  "Alta",
  "Urgente",
  "Critica"
];

const interventionTypes = [
  "Riparazione",
  "Manutenzione",
  "Installazione", 
  "Controllo",
  "Preventivo",
  "Emergenza"
];

export default function ViewEventModal({
  isOpen,
  eventId,
  isClosed,
  onEventUpdated,
  onEventDeleted,
}: ViewEventModalProps) {
  const [eventData, setEventData] = useState<CalendarEvent>(INITIAL_EVENT_DATA);
  const [originalEventData, setOriginalEventData] = useState<CalendarEvent>(INITIAL_EVENT_DATA);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newPartecipant, setNewPartecipant] = useState<EventPartecipant>({
    EventPartecipantId: 0,
    EventPartecipantEmail: "",
    EventPartecipantRole: "",
    EventPartecipantStatus: "pending",
  });

  useEffect(() => {
    if (isOpen && eventId) {
      loadEvent();
    }
  }, [isOpen, eventId]);

  const loadEvent = async () => {
    setLoading(true);
    
    try {
      // Mock eventi - simuliamo il caricamento di un evento specifico
      const mockEvents: CalendarEvent[] = [
        {
          EventId: 1,
          EventTitle: "🔧 Riparazione Urgente Caldaia",
          EventStartDate: new Date().toISOString().split('T')[0],
          EventEndDate: new Date().toISOString().split('T')[0],
          EventStartTime: "08:30",
          EventEndTime: "10:30",
          EventColor: "#EF4444",
          EventDescription: "Riparazione urgente caldaia con perdita di pressione. Cliente senza riscaldamento da 2 giorni. Necessario intervento immediato per ripristinare il servizio.",
          EventLocation: "Via Roma 123, Milano",
          EventTagName: "Riparazione",
          EventAttachments: [
            {
              EventAttachmentId: 1,
              EventAttachmentUrl: "/mock/documento-caldaia.pdf",
              EventAttachmentName: "Scheda Tecnica Caldaia.pdf"
            },
            {
              EventAttachmentId: 2,
              EventAttachmentUrl: "/mock/foto-perdita.jpg",
              EventAttachmentName: "Foto Perdita.jpg"
            }
          ],
          EventPartecipants: [
            { 
              EventPartecipantId: 1,
              EventPartecipantEmail: "marco.fontana@cosmichub.it", 
              EventPartecipantRole: "Tecnico Principale",
              EventPartecipantStatus: "confirmed"
            },
            { 
              EventPartecipantId: 2,
              EventPartecipantEmail: "mario.rossi@email.com", 
              EventPartecipantRole: "Cliente",
              EventPartecipantStatus: "confirmed"
            }
          ],
          EventType: "repair",
          EventPriority: "Urgente",
          EstimatedDuration: 120,
          CustomerInfo: {
            customer_id: "1",
            customer_name: "Mario Rossi",
            customer_phone: "+39 333 1234567",
            customer_email: "mario.rossi@email.com",
            customer_address: "Via Roma 123, Milano",
            customer_type: "private"
          },
          TechnicianAssignment: {
            technician_id: "1",
            technician_name: "Marco Fontana",
            role: "Tecnico Senior",
            availability_status: "available"
          },
          InterventionNotes: "Cliente riferisce che la perdita è iniziata ieri sera. Pressione scesa a zero. Verificare valvole e guarnizioni."
        },
        // Aggiungi altri eventi mock se necessario
      ];

      const event = mockEvents.find(e => e.EventId === eventId);
      if (event) {
        setEventData(event);
        setOriginalEventData(event);
      } else {
        // Se l'evento non esiste nei mock, crea uno di default
        const defaultEvent = {
          ...INITIAL_EVENT_DATA,
          EventId: eventId,
          EventTitle: `Evento Mock #${eventId}`,
          EventDescription: "Questo è un evento di esempio creato per testing",
          EventLocation: "Location di esempio",
          EventTagName: "Intervento Tecnico",
          EventColor: "#3B82F6",
        };
        setEventData(defaultEvent);
        setOriginalEventData(defaultEvent);
      }
    } catch (error) {
      console.error("Errore caricamento evento:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    
    try {
      // Mock save - simula aggiornamento evento
      console.log("Aggiornamento evento:", eventData);
      
      // Simula delay API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onEventUpdated) {
        onEventUpdated(eventData);
      }
      
      setOriginalEventData(eventData);
      setIsEditing(false);
      alert("Evento aggiornato con successo!");
      
    } catch (error) {
      console.error("Errore aggiornamento evento:", error);
      alert("Errore durante l'aggiornamento");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    
    try {
      // Mock delete - simula eliminazione evento
      console.log("Eliminazione evento:", eventId);
      
      // Simula delay API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (onEventDeleted) {
        onEventDeleted(eventId);
      }
      
      setShowDeleteModal(false);
    isClosed();
      alert("Evento eliminato con successo!");
      
    } catch (error) {
      console.error("Errore eliminazione evento:", error);
      alert("Errore durante l'eliminazione");
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
    
    const newId = Math.max(...eventData.EventPartecipants.map(p => p.EventPartecipantId), 0) + 1;
    
    setEventData(prev => ({
      ...prev,
      EventPartecipants: [...prev.EventPartecipants, { 
        ...newPartecipant, 
        EventPartecipantId: newId 
      }]
    }));
    
    setNewPartecipant({
      EventPartecipantId: 0,
      EventPartecipantEmail: "",
      EventPartecipantRole: "",
      EventPartecipantStatus: "pending",
    });
  };

  const removePartecipant = (id: number) => {
    setEventData(prev => ({
      ...prev,
      EventPartecipants: prev.EventPartecipants.filter(p => p.EventPartecipantId !== id)
    }));
  };

  const removeAttachment = (attachmentId: number) => {
    setEventData(prev => ({
      ...prev,
      EventAttachments: prev.EventAttachments.filter(a => a.EventAttachmentId !== attachmentId)
    }));
  };

  const getPriorityColor = (priority: string) => {
    const colorMap: { [key: string]: string } = {
      "Bassa": "#10B981",
      "Normale": "#3B82F6", 
      "Alta": "#F59E0B",
      "Urgente": "#EF4444",
      "Critica": "#DC2626",
    };
    return colorMap[priority] || "#3B82F6";
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      "confirmed": "success",
      "pending": "warning",
      "cancelled": "danger",
    };
    return colorMap[status] || "default";
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={isClosed}
        size="3xl"
        scrollBehavior="inside"
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
                        size="sm"
                    onPress={() => setIsEditing(true)}
                    startContent={<Icon icon="solar:pen-2-bold" width={16} />}
                  >
                    Modifica
                  </Button>
                      <Button
                    color="danger"
                    variant="flat" 
                        size="sm"
                    onPress={() => setShowDeleteModal(true)}
                    startContent={<Icon icon="solar:trash-bin-trash-bold" width={16} />}
                  >
                    Elimina
                  </Button>
                    </div>
              )}
                            </div>
          </ModalHeader>
          
          <ModalBody className="gap-6">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Icon icon="solar:loading-line-duotone" width={32} className="animate-spin" />
              </div>
            ) : (
              <>
                {/* Basic Event Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isEditing ? (
                    <Input
                      label="Titolo Evento"
                      value={eventData.EventTitle}
                      onChange={(e) => setEventData(prev => ({ ...prev, EventTitle: e.target.value }))}
                      isRequired
                    />
                  ) : (
                    <div>
                      <label className="text-sm font-medium text-default-600">Titolo</label>
                      <p className="text-base font-semibold">{eventData.EventTitle}</p>
                          </div>
                        )}

                  {isEditing ? (
                    <Select
                      label="Categoria"
                      selectedKeys={[eventData.EventTagName]}
                      onSelectionChange={(keys) => {
                        const tagName = Array.from(keys)[0] as string;
                        setEventData(prev => ({ ...prev, EventTagName: tagName }));
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
                      <label className="text-sm font-medium text-default-600">Categoria</label>
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
                        value={eventData.EventStartDate}
                        onChange={(e) => setEventData(prev => ({ ...prev, EventStartDate: e.target.value }))}
                      />
                      <Input
                        label="Data Fine"
                        type="date"
                        value={eventData.EventEndDate}
                        onChange={(e) => setEventData(prev => ({ ...prev, EventEndDate: e.target.value }))}
                      />
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="text-sm font-medium text-default-600">Data Inizio</label>
                        <p className="text-base">{new Date(eventData.EventStartDate).toLocaleDateString('it-IT')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-default-600">Data Fine</label>
                        <p className="text-base">{new Date(eventData.EventEndDate).toLocaleDateString('it-IT')}</p>
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
                        onChange={(e) => setEventData(prev => ({ ...prev, EventStartTime: e.target.value }))}
                      />
                      <Input
                        label="Ora Fine"
                        type="time"
                        value={eventData.EventEndTime}
                        onChange={(e) => setEventData(prev => ({ ...prev, EventEndTime: e.target.value }))}
                      />
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="text-sm font-medium text-default-600">Ora Inizio</label>
                        <p className="text-base">{eventData.EventStartTime}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-default-600">Ora Fine</label>
                        <p className="text-base">{eventData.EventEndTime}</p>
                      </div>
                    </>
                                  )}
                              </div>

                {/* CosmicHub Specific Fields */}
                {(eventData.EventType || eventData.EventPriority || eventData.EstimatedDuration) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {eventData.EventType && (
                      <div>
                        <label className="text-sm font-medium text-default-600">Tipo Intervento</label>
                        <p className="text-base">{eventData.EventType}</p>
                          </div>
                    )}
                    
                    {eventData.EventPriority && (
                      <div>
                        <label className="text-sm font-medium text-default-600">Priorità</label>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getPriorityColor(eventData.EventPriority) }}
                          />
                          <p className="text-base">{eventData.EventPriority}</p>
                        </div>
                            </div>
                          )}
                    
                    {eventData.EstimatedDuration && (
                      <div>
                        <label className="text-sm font-medium text-default-600">Durata Stimata</label>
                        <p className="text-base">{formatDuration(eventData.EstimatedDuration)}</p>
                          </div>
                        )}
                    </div>
                )}

                {/* Location */}
                {isEditing ? (
                      <Input
                    label="Luogo"
                    value={eventData.EventLocation}
                    onChange={(e) => setEventData(prev => ({ ...prev, EventLocation: e.target.value }))}
                    startContent={<Icon icon="solar:map-point-bold" width={20} />}
                  />
                ) : (
                  eventData.EventLocation && (
                    <div>
                      <label className="text-sm font-medium text-default-600">Luogo</label>
                      <p className="text-base flex items-center gap-2">
                        <Icon icon="solar:map-point-bold" width={16} />
                        {eventData.EventLocation}
                      </p>
                    </div>
                  )
                )}

                {/* Description */}
                {isEditing ? (
                  <Textarea
                    label="Descrizione"
                    value={eventData.EventDescription}
                    onChange={(e) => setEventData(prev => ({ ...prev, EventDescription: e.target.value }))}
                    rows={4}
                  />
                ) : (
                  eventData.EventDescription && (
                    <div>
                      <label className="text-sm font-medium text-default-600">Descrizione</label>
                      <p className="text-base whitespace-pre-wrap">{eventData.EventDescription}</p>
                            </div>
                  )
                )}

                {/* Customer Info */}
                {eventData.CustomerInfo && (
                  <div className="border border-default-200 rounded-lg p-4 bg-default-50">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Icon icon="solar:user-bold" width={16} />
                      Informazioni Cliente
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-default-500">Nome:</span> {eventData.CustomerInfo.customer_name}
                            </div>
                      <div>
                        <span className="text-default-500">Telefono:</span> {eventData.CustomerInfo.customer_phone}
                        </div>
                      <div className="md:col-span-2">
                        <span className="text-default-500">Email:</span> {eventData.CustomerInfo.customer_email}
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-default-500">Indirizzo:</span> {eventData.CustomerInfo.customer_address}
                      </div>
                    </div>
                  </div>
                )}

                {/* Technician Assignment */}
                {eventData.TechnicianAssignment && (
                  <div className="border border-default-200 rounded-lg p-4 bg-default-50">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Icon icon="solar:wrench-bold" width={16} />
                      Tecnico Assegnato
                    </h3>
                    <div className="flex items-center gap-3">
                      <Avatar 
                        name={eventData.TechnicianAssignment.technician_name}
                        size="sm"
                      />
                      <div>
                        <p className="font-medium">{eventData.TechnicianAssignment.technician_name}</p>
                        <p className="text-sm text-default-500">{eventData.TechnicianAssignment.role}</p>
                        </div>
                      </div>
                    </div>
                )}

                                 {/* Accordion for Advanced Info */}
                 {((eventData.EventPartecipants.length > 0 || isEditing) || 
                   eventData.EventAttachments.length > 0 || 
                   eventData.InterventionNotes) && (
                   <Accordion>
                     {[
                       (eventData.EventPartecipants.length > 0 || isEditing) ? (
                         <AccordionItem
                           key="participants"
                           title={`Partecipanti (${eventData.EventPartecipants.length})`}
                           startContent={<Icon icon="solar:users-group-rounded-bold" width={20} />}
                         >
                           <div className="space-y-3">
                             {isEditing && (
                               <div className="flex gap-2">
                                 <Input
                                   placeholder="Email partecipante"
                                   value={newPartecipant.EventPartecipantEmail}
                                   onChange={(e) => setNewPartecipant(prev => ({ ...prev, EventPartecipantEmail: e.target.value }))}
                                   className="flex-1"
                                 />
                                 <Input
                                   placeholder="Ruolo"
                                   value={newPartecipant.EventPartecipantRole}
                                   onChange={(e) => setNewPartecipant(prev => ({ ...prev, EventPartecipantRole: e.target.value }))}
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

                             {eventData.EventPartecipants.map((participant) => (
                               <div key={participant.EventPartecipantId} className="flex items-center justify-between bg-default-100 rounded-lg p-3">
                                 <div className="flex items-center gap-3">
                                   <Avatar 
                                     name={participant.EventPartecipantEmail}
                                     size="sm"
                                   />
                                   <div>
                                     <div className="font-medium text-sm">{participant.EventPartecipantEmail}</div>
                                     <div className="text-xs text-default-500">{participant.EventPartecipantRole}</div>
                          </div>
                                 </div>
                                 <div className="flex items-center gap-2">
                              <Chip
                                     size="sm" 
                                     color={getStatusColor(participant.EventPartecipantStatus) as any}
                                variant="flat"
                                   >
                                     {participant.EventPartecipantStatus}
                              </Chip>
                                   {isEditing && (
                                     <Button
                                       onPress={() => removePartecipant(participant.EventPartecipantId)}
                                       isIconOnly
                                       size="sm"
                                       color="danger"
                                       variant="light"
                                     >
                                       <Icon icon="solar:trash-bin-trash-bold" width={14} />
                                     </Button>
                            )}
                          </div>
                      </div>
                             ))}
                    </div>
                         </AccordionItem>
                       ) : null,

                       eventData.EventAttachments.length > 0 ? (
                         <AccordionItem
                           key="attachments"
                           title={`Allegati (${eventData.EventAttachments.length})`}
                           startContent={<Icon icon="solar:paperclip-bold" width={20} />}
                         >
                           <div className="space-y-3">
                             {eventData.EventAttachments.map((attachment) => (
                               <FileCard
                                 key={attachment.EventAttachmentId}
                                 file={attachment}
                                 index={attachment.EventAttachmentId}
                                 DeleteFile={(file) => removeAttachment(file.EventAttachmentId)}
                                 variant="default"
                               />
                             ))}
                    </div>
                         </AccordionItem>
                       ) : null,

                       eventData.InterventionNotes ? (
                         <AccordionItem
                           key="notes"
                           title="Note Intervento"
                           startContent={<Icon icon="solar:notes-bold" width={20} />}
                         >
                           <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
                             <p className="text-sm">{eventData.InterventionNotes}</p>
                           </div>
                         </AccordionItem>
                       ) : null
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
                  {loading ? "Salvataggio..." : "Salva Modifiche"}
                    </Button>
              </div>
            ) : (
              <Button
                variant="light"
                onPress={isClosed}
              >
                Chiudi
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

             <ConfirmDeleteEventModal
         EventData={eventData}
         DeleteEvent={handleDelete}
       />
    </>
  );
}
