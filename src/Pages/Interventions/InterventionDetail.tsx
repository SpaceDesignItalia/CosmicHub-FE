import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Badge,
  Divider,
  Progress,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Image,
  Tabs,
  Tab,
  Accordion,
  AccordionItem,
  Textarea,
  Input,
  Avatar,
  Timeline,
  TimelineItem,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import type { Intervention, MaterialUsed, InterventionCompletionReport } from "../../types/Intervention";
import type { Customer } from "../../types/Customer";
import type { Technician } from "../../types/Technician";
import PageHeader from "../../Components/Layout/PageHeader";

const statusColorMap = {
  assigned: "default",
  accepted: "primary",
  in_progress: "warning",
  paused: "secondary",
  completed: "success",
  cancelled: "danger",
} as const;

const priorityColorMap = {
  low: "success",
  medium: "warning",
  high: "danger",
  emergency: "danger",
} as const;

const typeColorMap = {
  inspection: "primary",
  repair: "warning",
  maintenance: "secondary",
  installation: "success",
  emergency: "danger",
} as const;

export default function InterventionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadInterventionDetails();
  }, [id]);

  const loadInterventionDetails = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Mock data - sostituire con chiamate API reali
      const mockCustomer: Customer = {
        customer_id: "1",
        name: "Mario",
        surname: "Rossi",
        phone: "+39 333 1234567",
        address: "Via Roma 123",
        city: "Milano",
        zip_code: "20100",
        country: "Italia",
        status: "active",
        customer_type: "private",
        created_at: new Date(),
        updated_at: new Date(),
        created_by: "admin",
      };

      const mockTechnician: Technician = {
        technician_id: "1",
        user_id: "tech1",
        name: "Giuseppe",
        surname: "Bianchi",
        role: "technician",
        status: "active",
        specializations: ["repair", "maintenance"],
        skill_level: "senior",
        availability_status: "available",
        working_hours: {
          monday: { is_working_day: true, start_time: "08:00", end_time: "18:00" },
          tuesday: { is_working_day: true, start_time: "08:00", end_time: "18:00" },
          wednesday: { is_working_day: true, start_time: "08:00", end_time: "18:00" },
          thursday: { is_working_day: true, start_time: "08:00", end_time: "18:00" },
          friday: { is_working_day: true, start_time: "08:00", end_time: "18:00" },
          saturday: { is_working_day: false },
          sunday: { is_working_day: false },
        },
      };

      const mockIntervention: Intervention = {
        intervention_id: id,
        appointment_id: "1",
        customer_id: "1",
        assigned_technician_id: "1",
        assigned_van_id: "VAN-001",
        intervention_code: "INT-2024-001",
        title: "Riparazione rubinetto cucina",
        description: "Sostituzione guarnizioni e riparazione perdita d'acqua nel rubinetto principale della cucina. Il cliente ha segnalato un gocciolamento continuo che si è aggravato negli ultimi giorni.",
        intervention_type: "repair",
        status: "in_progress",
        priority: "medium",
        scheduled_date: new Date("2024-12-15"),
        scheduled_start_time: "09:30",
        scheduled_end_time: "11:00",
        actual_start_time: "09:25",
        intervention_address: "Via Roma 123",
        intervention_city: "Milano",
        intervention_coordinates: { lat: 45.4642, lng: 9.1900 },
        estimated_cost: 150,
        actual_cost: 135,
        materials_needed: [
          {
            material_id: "MAT-001",
            material_name: "Guarnizione O-Ring 25mm",
            quantity: 2,
            unit: "pz",
            estimated_cost: 15,
          },
          {
            material_id: "MAT-002", 
            material_name: "Silicone sigillante",
            quantity: 1,
            unit: "tubo",
            estimated_cost: 8,
          }
        ],
        materials_used: [
          {
            material_id: "MAT-001",
            material_name: "Guarnizione O-Ring 25mm",
            quantity_used: 2,
            unit: "pz",
            actual_cost: 15,
          }
        ],
        work_performed: "Sostituzione guarnizioni deteriorate, pulizia della sede e applicazione nuovo sigillante. Controllo funzionalità e test di tenuta completati con successo.",
        technician_notes: "Cliente molto soddisfatto del lavoro. Consigliata manutenzione preventiva ogni 6 mesi.",
        photos: [
          "/public/images/intervention-before.jpg",
          "/public/images/intervention-after.jpg"
        ],
        created_at: new Date("2024-12-10"),
        updated_at: new Date(),
        created_by: "operator1",
      };

      setIntervention(mockIntervention);
      setCustomer(mockCustomer);
      setTechnician(mockTechnician);
    } catch (error) {
      console.error("Errore nel caricamento dei dettagli:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      assigned: "Assegnato",
      accepted: "Accettato", 
      in_progress: "In Corso",
      paused: "In Pausa",
      completed: "Completato",
      cancelled: "Annullato"
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      low: "Bassa",
      medium: "Media", 
      high: "Alta",
      emergency: "Emergenza"
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      inspection: "Ispezione",
      repair: "Riparazione",
      maintenance: "Manutenzione", 
      installation: "Installazione",
      emergency: "Emergenza"
    };
    return labels[type as keyof typeof labels] || type;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    }).format(date);
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      assigned: "solar:clipboard-list-bold",
      accepted: "solar:check-circle-bold",
      in_progress: "solar:play-circle-bold",
      paused: "solar:pause-circle-bold", 
      completed: "solar:verified-check-bold",
      cancelled: "solar:close-circle-bold"
    };
    return icons[status as keyof typeof icons] || "solar:info-circle-bold";
  };

  const calculateProgress = () => {
    if (!intervention) return 0;
    
    const statusProgress = {
      assigned: 20,
      accepted: 40,
      in_progress: 70,
      paused: 70,
      completed: 100,
      cancelled: 0
    };
    
    return statusProgress[intervention.status] || 0;
  };

  const addNote = async () => {
    if (!notes.trim()) return;
    
    try {
      // Implementare chiamata API per aggiungere note
      console.log("Aggiunta nota:", notes);
      setNotes("");
      onClose();
    } catch (error) {
      console.error("Errore nell'aggiunta della nota:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen">
        <PageHeader
          title="Dettagli Intervento"
          description="Caricamento..."
          icon="solar:eye-bold-duotone"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Icon icon="solar:refresh-circle-bold" width={48} className="animate-spin text-primary" />
            <p className="text-default-600">Caricamento dettagli intervento...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!intervention) {
    return (
      <div className="flex flex-col h-screen">
        <PageHeader
          title="Intervento Non Trovato"
          description="L'intervento richiesto non esiste"
          icon="solar:danger-triangle-bold-duotone"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Icon icon="solar:file-remove-bold-duotone" width={64} className="text-danger mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Intervento Non Trovato</h3>
            <p className="text-default-600 mb-4">L'intervento richiesto non esiste o è stato eliminato.</p>
            <Button color="primary" onPress={() => navigate("/interventions")}>
              Torna alla Lista
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <PageHeader
        title={`Intervento ${intervention.intervention_code}`}
        description={intervention.title}
        icon="solar:eye-bold-duotone"
        actions={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="flat"
              startContent={<Icon icon="solar:pen-bold" width={16} />}
              onPress={() => navigate(`/interventions/edit/${intervention.intervention_id}`)}
            >
              Modifica
            </Button>
            {intervention.status === "assigned" && (
              <Button
                size="sm"
                color="primary"
                startContent={<Icon icon="solar:play-circle-bold" width={16} />}
                onPress={() => navigate(`/interventions/start/${intervention.intervention_id}`)}
              >
                Avvia
              </Button>
            )}
            {intervention.status === "in_progress" && (
              <Button
                size="sm"
                color="success"
                startContent={<Icon icon="solar:check-circle-bold" width={16} />}
                onPress={() => navigate(`/interventions/complete/${intervention.intervention_id}`)}
              >
                Completa
              </Button>
            )}
          </div>
        }
      />
      
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header con stato e progresso */}
          <Card className="mb-6">
            <CardBody className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-2xl font-bold">{intervention.intervention_code}</h1>
                  <p className="text-lg text-default-600 mt-1">{intervention.title}</p>
                </div>
                <div className="flex gap-2">
                  <Chip
                    color={statusColorMap[intervention.status]}
                    size="lg"
                    startContent={<Icon icon={getStatusIcon(intervention.status)} width={16} />}
                  >
                    {getStatusLabel(intervention.status)}
                  </Chip>
                  <Chip
                    color={priorityColorMap[intervention.priority]}
                    variant="flat"
                    size="lg"
                  >
                    {getPriorityLabel(intervention.priority)}
                  </Chip>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progresso Intervento</span>
                    <span>{calculateProgress()}%</span>
                  </div>
                  <Progress 
                    value={calculateProgress()} 
                    color={statusColorMap[intervention.status]}
                    className="w-full"
                    aria-label="Progresso intervento"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-default-500">Data Programmata:</span>
                  <p className="font-medium">{formatDate(intervention.scheduled_date)}</p>
                </div>
                <div>
                  <span className="text-default-500">Orario:</span>
                  <p className="font-medium">{intervention.scheduled_start_time} - {intervention.scheduled_end_time}</p>
                </div>
                <div>
                  <span className="text-default-500">Tipo Intervento:</span>
                  <p className="font-medium">{getTypeLabel(intervention.intervention_type)}</p>
                </div>
                <div>
                  <span className="text-default-500">Costo Stimato:</span>
                  <p className="font-medium">€ {intervention.estimated_cost}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Tabs per sezioni dettagliate */}
          <Tabs 
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            className="w-full"
          >
            <Tab key="details" title={
              <div className="flex items-center gap-2">
                <Icon icon="solar:info-circle-bold" width={16} />
                Dettagli
              </div>
            }>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                {/* Info Cliente */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Icon icon="solar:user-bold-duotone" width={20} />
                      Cliente
                    </h3>
                  </CardHeader>
                  <CardBody className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar 
                        name={`${customer?.name} ${customer?.surname}`}
                        size="sm"
                      />
                      <div>
                        <p className="font-medium">{customer?.name} {customer?.surname}</p>
                        <p className="text-sm text-default-500">{customer?.phone}</p>
                      </div>
                    </div>
                    <Divider />
                    <div className="space-y-2">
                      <div>
                        <span className="text-default-500 text-sm">Indirizzo:</span>
                        <p className="text-sm">{customer?.address}, {customer?.city}</p>
                      </div>
                      <div>
                        <span className="text-default-500 text-sm">Tipo Cliente:</span>
                        <Chip size="sm" variant="flat" className="ml-2">
                          {customer?.customer_type === "private" ? "Privato" : "Azienda"}
                        </Chip>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Info Tecnico */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Icon icon="solar:user-hands-bold-duotone" width={20} />
                      Tecnico Assegnato
                    </h3>
                  </CardHeader>
                  <CardBody className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar 
                        name={`${technician?.name} ${technician?.surname}`}
                        size="sm"
                      />
                      <div>
                        <p className="font-medium">{technician?.name} {technician?.surname}</p>
                        <p className="text-sm text-default-500">
                          {technician?.skill_level === "senior" ? "Tecnico Senior" : "Tecnico Junior"}
                        </p>
                      </div>
                    </div>
                    <Divider />
                    <div className="space-y-2">
                      <div>
                        <span className="text-default-500 text-sm">Stato:</span>
                        <Badge 
                          size="sm" 
                          color={technician?.availability_status === "available" ? "success" : "warning"}
                          className="ml-2"
                        >
                          {technician?.availability_status === "available" ? "Disponibile" : "Occupato"}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-default-500 text-sm">Specializzazioni:</span>
                        <div className="flex gap-1 mt-1">
                          {technician?.specializations.map((spec) => (
                            <Chip key={spec} size="sm" variant="flat">
                              {getTypeLabel(spec)}
                            </Chip>
                          ))}
                        </div>
                      </div>
                      {intervention.assigned_van_id && (
                        <div>
                          <span className="text-default-500 text-sm">Furgone Assegnato:</span>
                          <p className="text-sm font-medium">{intervention.assigned_van_id}</p>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>

                {/* Dettagli Intervento */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Icon icon="solar:clipboard-text-bold-duotone" width={20} />
                      Descrizione e Dettagli
                    </h3>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    <div>
                      <span className="text-default-500 text-sm">Descrizione:</span>
                      <p className="mt-1">{intervention.description}</p>
                    </div>
                    
                    {intervention.work_performed && (
                      <div>
                        <span className="text-default-500 text-sm">Lavoro Eseguito:</span>
                        <p className="mt-1">{intervention.work_performed}</p>
                      </div>
                    )}

                    {intervention.technician_notes && (
                      <div>
                        <span className="text-default-500 text-sm">Note del Tecnico:</span>
                        <p className="mt-1 text-sm bg-default-100 p-3 rounded-lg">
                          {intervention.technician_notes}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-default-500">Creato il:</span>
                        <p>{formatDateTime(intervention.created_at)}</p>
                      </div>
                      <div>
                        <span className="text-default-500">Creato da:</span>
                        <p>{intervention.created_by}</p>
                      </div>
                      {intervention.actual_start_time && (
                        <div>
                          <span className="text-default-500">Inizio Effettivo:</span>
                          <p>{intervention.actual_start_time}</p>
                        </div>
                      )}
                      {intervention.actual_end_time && (
                        <div>
                          <span className="text-default-500">Fine Effettiva:</span>
                          <p>{intervention.actual_end_time}</p>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </div>
            </Tab>

            <Tab key="materials" title={
              <div className="flex items-center gap-2">
                <Icon icon="solar:box-bold" width={16} />
                Materiali
              </div>
            }>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                {/* Materiali Necessari */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Materiali Necessari</h3>
                  </CardHeader>
                  <CardBody>
                    {intervention.materials_needed && intervention.materials_needed.length > 0 ? (
                      <div className="space-y-3">
                        {intervention.materials_needed.map((material) => (
                          <div key={material.material_id} className="flex justify-between items-center p-3 bg-default-50 rounded-lg">
                            <div>
                              <p className="font-medium">{material.material_name}</p>
                              <p className="text-sm text-default-500">
                                Quantità: {material.quantity} {material.unit}
                              </p>
                            </div>
                            <p className="font-medium">€ {material.estimated_cost}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-default-500 text-center py-4">Nessun materiale specificato</p>
                    )}
                  </CardBody>
                </Card>

                {/* Materiali Utilizzati */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Materiali Utilizzati</h3>
                  </CardHeader>
                  <CardBody>
                    {intervention.materials_used && intervention.materials_used.length > 0 ? (
                      <div className="space-y-3">
                        {intervention.materials_used.map((material) => (
                          <div key={material.material_id} className="flex justify-between items-center p-3 bg-success-50 rounded-lg">
                            <div>
                              <p className="font-medium">{material.material_name}</p>
                              <p className="text-sm text-default-500">
                                Utilizzati: {material.quantity_used} {material.unit}
                              </p>
                            </div>
                            <p className="font-medium">€ {material.actual_cost}</p>
                          </div>
                        ))}
                        <Divider />
                        <div className="flex justify-between items-center font-semibold">
                          <span>Totale Materiali:</span>
                          <span>€ {intervention.materials_used.reduce((sum, m) => sum + m.actual_cost, 0)}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-default-500 text-center py-4">Nessun materiale utilizzato ancora</p>
                    )}
                  </CardBody>
                </Card>
              </div>

              {/* Riepilogo Costi */}
              <Card className="mt-6">
                <CardHeader>
                  <h3 className="text-lg font-semibold">Riepilogo Costi</h3>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-primary-50 rounded-lg">
                      <Icon icon="solar:calculator-bold-duotone" width={24} className="mx-auto mb-2 text-primary" />
                      <p className="text-sm text-default-500">Costo Stimato</p>
                      <p className="text-xl font-bold">€ {intervention.estimated_cost}</p>
                    </div>
                    <div className="text-center p-4 bg-success-50 rounded-lg">
                      <Icon icon="solar:bill-list-bold-duotone" width={24} className="mx-auto mb-2 text-success" />
                      <p className="text-sm text-default-500">Costo Effettivo</p>
                      <p className="text-xl font-bold">€ {intervention.actual_cost || "N/A"}</p>
                    </div>
                    <div className="text-center p-4 bg-warning-50 rounded-lg">
                      <Icon icon="solar:chart-2-bold-duotone" width={24} className="mx-auto mb-2 text-warning" />
                      <p className="text-sm text-default-500">Differenza</p>
                      <p className="text-xl font-bold">
                        {intervention.actual_cost 
                          ? `€ ${(intervention.actual_cost - intervention.estimated_cost).toFixed(2)}`
                          : "N/A"
                        }
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Tab>

            <Tab key="photos" title={
              <div className="flex items-center gap-2">
                <Icon icon="solar:camera-bold" width={16} />
                Foto
              </div>
            }>
              <Card className="mt-4">
                <CardHeader>
                  <h3 className="text-lg font-semibold">Documentazione Fotografica</h3>
                </CardHeader>
                <CardBody>
                  {intervention.photos && intervention.photos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {intervention.photos.map((photo, index) => (
                        <div key={index} className="relative">
                          <Image
                            src={photo}
                            alt={`Foto intervento ${index + 1}`}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <Button
                            isIconOnly
                            size="sm"
                            className="absolute top-2 right-2"
                            onPress={() => window.open(photo, '_blank')}
                          >
                            <Icon icon="solar:maximize-bold" width={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Icon icon="solar:camera-add-bold-duotone" width={48} className="mx-auto mb-4 text-default-400" />
                      <p className="text-default-500">Nessuna foto disponibile</p>
                    </div>
                  )}
                </CardBody>
              </Card>
            </Tab>

            <Tab key="timeline" title={
              <div className="flex items-center gap-2">
                <Icon icon="solar:history-bold" width={16} />
                Timeline
              </div>
            }>
              <Card className="mt-4">
                <CardHeader className="flex justify-between">
                  <h3 className="text-lg font-semibold">Cronologia Intervento</h3>
                  <Button
                    size="sm"
                    variant="flat"
                    startContent={<Icon icon="solar:notes-bold" width={16} />}
                    onPress={onOpen}
                  >
                    Aggiungi Nota
                  </Button>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                        <div className="w-px h-12 bg-default-300"></div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Intervento creato</p>
                        <p className="text-sm text-default-500">{formatDateTime(intervention.created_at)}</p>
                        <p className="text-sm">Creato da {intervention.created_by}</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-warning rounded-full"></div>
                        <div className="w-px h-12 bg-default-300"></div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Intervento avviato</p>
                        <p className="text-sm text-default-500">{formatDate(intervention.scheduled_date)} alle {intervention.actual_start_time || intervention.scheduled_start_time}</p>
                        <p className="text-sm">Tecnico: {technician?.name} {technician?.surname}</p>
                      </div>
                    </div>

                    {intervention.status === "completed" && (
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-success rounded-full"></div>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Intervento completato</p>
                          <p className="text-sm text-default-500">{intervention.completed_at ? formatDateTime(intervention.completed_at) : "In corso..."}</p>
                          <p className="text-sm">Costo finale: € {intervention.actual_cost}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            </Tab>
          </Tabs>
        </div>
      </div>

      {/* Modal per aggiungere note */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>Aggiungi Nota</ModalHeader>
          <ModalBody>
            <Textarea
              label="Nota"
              placeholder="Inserisci una nota per questo intervento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              minRows={3}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Annulla
            </Button>
            <Button color="primary" onPress={addNote}>
              Aggiungi Nota
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
} 