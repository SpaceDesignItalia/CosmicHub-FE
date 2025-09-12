import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Chip,
  Badge,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Progress,
  Avatar,
  DatePicker,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { parseDate } from "@internationalized/date";
import type { Intervention } from "../../types/Intervention";
import type { Customer } from "../../types/Customer";
import type { Technician } from "../../types/Technician";
import PageHeader from "../../Components/Layout/PageHeader";

interface ReassignmentData {
  new_technician_id: string;
  new_van_id?: string;
  new_scheduled_date: Date;
  new_start_time: string;
  new_end_time: string;
  reassignment_reason: string;
  priority_change?: "low" | "medium" | "high" | "emergency";
  notify_customer: boolean;
  notify_old_technician: boolean;
  notify_new_technician: boolean;
  additional_notes: string;
}

export default function InterventionReassign() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isOpen: isConfirmModalOpen, onOpen: onOpenConfirmModal, onClose: onCloseConfirmModal } = useDisclosure();
  
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [currentTechnician, setCurrentTechnician] = useState<Technician | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [vans, setVans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reassigning, setReassigning] = useState(false);
  const [technicianConflicts, setTechnicianConflicts] = useState<Record<string, any[]>>({});
  
  const [reassignmentData, setReassignmentData] = useState<ReassignmentData>({
    new_technician_id: "",
    new_van_id: "",
    new_scheduled_date: new Date(),
    new_start_time: "",
    new_end_time: "",
    reassignment_reason: "",
    notify_customer: true,
    notify_old_technician: true,
    notify_new_technician: true,
    additional_notes: "",
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
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

      const mockTechnicians: Technician[] = [
        {
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
        },
        {
          technician_id: "2",
          user_id: "tech2",
          name: "Marco",
          surname: "Neri",
          role: "technician",
          status: "active",
          specializations: ["installation", "inspection"],
          skill_level: "junior",
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
        },
        {
          technician_id: "3",
          user_id: "tech3",
          name: "Luigi",
          surname: "Verdi",
          role: "technician",
          status: "active",
          specializations: ["repair", "emergency"],
          skill_level: "senior",
          availability_status: "busy",
          working_hours: {
            monday: { is_working_day: true, start_time: "08:00", end_time: "18:00" },
            tuesday: { is_working_day: true, start_time: "08:00", end_time: "18:00" },
            wednesday: { is_working_day: true, start_time: "08:00", end_time: "18:00" },
            thursday: { is_working_day: true, start_time: "08:00", end_time: "18:00" },
            friday: { is_working_day: true, start_time: "08:00", end_time: "18:00" },
            saturday: { is_working_day: false },
            sunday: { is_working_day: false },
          },
        },
      ];

      const mockVans = [
        { van_id: "VAN-001", name: "Furgone 1", license_plate: "AB123CD", assigned_technician: "1" },
        { van_id: "VAN-002", name: "Furgone 2", license_plate: "EF456GH", assigned_technician: null },
        { van_id: "VAN-003", name: "Furgone 3", license_plate: "IJ789KL", assigned_technician: "3" },
      ];

      const mockIntervention: Intervention = {
        intervention_id: id,
        appointment_id: "1",
        customer_id: "1",
        assigned_technician_id: "1",
        assigned_van_id: "VAN-001",
        intervention_code: "INT-2024-001",
        title: "Riparazione rubinetto cucina",
        description: "Sostituzione guarnizioni e riparazione perdita d'acqua nel rubinetto principale della cucina",
        intervention_type: "repair",
        status: "assigned",
        priority: "medium",
        scheduled_date: new Date("2024-12-15"),
        scheduled_start_time: "09:30",
        scheduled_end_time: "11:00",
        intervention_address: "Via Roma 123",
        intervention_city: "Milano",
        estimated_cost: 150,
        created_at: new Date("2024-12-10"),
        updated_at: new Date(),
        created_by: "operator1",
      };

      // Mock conflicts per tecnici
      const mockConflicts = {
        "2": [
          {
            intervention_code: "INT-2024-005",
            time: "10:00-12:00",
            type: "installation",
            priority: "high"
          }
        ],
        "3": [
          {
            intervention_code: "INT-2024-006",
            time: "09:00-11:30",
            type: "emergency",
            priority: "emergency"
          },
          {
            intervention_code: "INT-2024-007",
            time: "14:00-16:00",
            type: "maintenance",
            priority: "medium"
          }
        ]
      };

      setIntervention(mockIntervention);
      setCustomer(mockCustomer);
      setCurrentTechnician(mockTechnicians.find(t => t.technician_id === mockIntervention.assigned_technician_id) || null);
      setTechnicians(mockTechnicians);
      setVans(mockVans);
      setTechnicianConflicts(mockConflicts);

      // Inizializza i dati di riassegnazione con i valori attuali
      setReassignmentData(prev => ({
        ...prev,
        new_scheduled_date: mockIntervention.scheduled_date,
        new_start_time: mockIntervention.scheduled_start_time,
        new_end_time: mockIntervention.scheduled_end_time,
      }));
    } catch (error) {
      console.error("Errore nel caricamento dei dati:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ReassignmentData, value: any) => {
    setReassignmentData(prev => ({ ...prev, [field]: value }));
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

  const getPriorityLabel = (priority: string) => {
    const labels = {
      low: "Bassa",
      medium: "Media",
      high: "Alta",
      emergency: "Emergenza"
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  const getTechnicianWorkload = (technicianId: string) => {
    // Simula il calcolo del carico di lavoro
    const conflicts = technicianConflicts[technicianId] || [];
    return conflicts.length;
  };

  const getTechnicianSuitability = (technician: Technician) => {
    if (!intervention) return { score: 0, reasons: [] };

    const reasons = [];
    let score = 0;

    // Controllo specializzazioni
    if (technician.specializations.includes(intervention.intervention_type)) {
      score += 30;
      reasons.push("Specializzazione appropriata");
    } else {
      reasons.push("Specializzazione non ottimale");
    }

    // Controllo disponibilità
    if (technician.availability_status === "available") {
      score += 25;
      reasons.push("Attualmente disponibile");
    } else {
      reasons.push("Attualmente occupato");
    }

    // Controllo carico di lavoro
    const workload = getTechnicianWorkload(technician.technician_id);
    if (workload < 2) {
      score += 20;
      reasons.push("Carico di lavoro leggero");
    } else if (workload < 4) {
      score += 10;
      reasons.push("Carico di lavoro moderato");
    } else {
      reasons.push("Carico di lavoro elevato");
    }

    // Controllo livello
    if (technician.skill_level === "senior") {
      score += 15;
      reasons.push("Tecnico senior");
    } else {
      score += 10;
      reasons.push("Tecnico junior");
    }

    // Controllo conflitti
    const conflicts = technicianConflicts[technician.technician_id] || [];
    if (conflicts.length === 0) {
      score += 10;
      reasons.push("Nessun conflitto");
    } else {
      reasons.push(`${conflicts.length} possibili conflitti`);
    }

    return { score: Math.min(score, 100), reasons };
  };

  const getSuitabilityColor = (score: number) => {
    if (score >= 80) return "success";
    if (score >= 60) return "primary";
    if (score >= 40) return "warning";
    return "danger";
  };

  const canReassign = () => {
    return (
      reassignmentData.new_technician_id !== "" &&
      reassignmentData.new_technician_id !== intervention?.assigned_technician_id &&
      reassignmentData.reassignment_reason.trim() !== "" &&
      reassignmentData.new_start_time !== "" &&
      reassignmentData.new_end_time !== ""
    );
  };

  const handleReassign = async () => {
    if (!canReassign()) {
      alert("Compila tutti i campi obbligatori");
      return;
    }

    setReassigning(true);
    try {
      // Simula chiamata API per riassegnare l'intervento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log("Riassegnazione intervento:", {
        intervention_id: id,
        old_technician_id: intervention?.assigned_technician_id,
        reassignment_data: reassignmentData,
      });

      // Naviga alla pagina di dettaglio
      navigate(`/interventions/${id}`);
    } catch (error) {
      console.error("Errore nella riassegnazione:", error);
      alert("Errore nella riassegnazione. Riprova.");
    } finally {
      setReassigning(false);
      onCloseConfirmModal();
    }
  };

  const reasonOptions = [
    "Indisponibilità tecnico originale",
    "Cambio di specializzazione richiesta",
    "Urgenza modificata",
    "Ottimizzazione carico di lavoro",
    "Richiesta specifica del cliente",
    "Problemi tecnici",
    "Altro"
  ];

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-background p-6 gap-6">
        <PageHeader
          title="Riassegna Intervento"
          description="Caricamento..."
          icon="solar:user-check-rounded-bold-duotone"
          size="md"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Icon icon="solar:refresh-circle-bold" width={48} className="animate-spin text-primary" />
            <p className="text-default-600">Caricamento dati intervento...</p>
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
        title={`Riassegna Intervento ${intervention.intervention_code}`}
        description="Modifica l'assegnazione del tecnico e la programmazione"
        icon="solar:user-check-rounded-bold-duotone"
      />
      
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Informazioni Intervento Corrente */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="solar:info-circle-bold-duotone" width={20} />
                Intervento Corrente
              </h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <span className="text-default-500 text-sm">Codice Intervento:</span>
                    <p className="font-medium">{intervention.intervention_code}</p>
                  </div>
                  <div>
                    <span className="text-default-500 text-sm">Titolo:</span>
                    <p className="font-medium">{intervention.title}</p>
                  </div>
                  <div>
                    <span className="text-default-500 text-sm">Cliente:</span>
                    <p className="font-medium">{customer?.name} {customer?.surname}</p>
                  </div>
                  <div>
                    <span className="text-default-500 text-sm">Indirizzo:</span>
                    <p className="font-medium">{intervention.intervention_address}, {intervention.intervention_city}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-default-500 text-sm">Tecnico Attuale:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar 
                        name={`${currentTechnician?.name} ${currentTechnician?.surname}`}
                        size="sm"
                      />
                      <div>
                        <p className="font-medium">{currentTechnician?.name} {currentTechnician?.surname}</p>
                        <p className="text-sm text-default-500">
                          {currentTechnician?.skill_level === "senior" ? "Senior" : "Junior"} - 
                          Specializzazioni: {currentTechnician?.specializations.join(", ")}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="text-default-500 text-sm">Data e Orario:</span>
                    <p className="font-medium">
                      {formatDate(intervention.scheduled_date)} - {intervention.scheduled_start_time} / {intervention.scheduled_end_time}
                    </p>
                  </div>
                  <div>
                    <span className="text-default-500 text-sm">Tipo e Priorità:</span>
                    <div className="flex gap-2 mt-1">
                      <Chip size="sm" color="primary" variant="flat">
                        {getTypeLabel(intervention.intervention_type)}
                      </Chip>
                      <Chip size="sm" color="warning" variant="flat">
                        {getPriorityLabel(intervention.priority)}
                      </Chip>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Riassegnazione */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Icon icon="solar:user-check-rounded-bold-duotone" width={20} />
                  Nuova Assegnazione
                </h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <Select
                  label="Motivo Riassegnazione"
                  placeholder="Seleziona il motivo"
                  selectedKeys={reassignmentData.reassignment_reason ? [reassignmentData.reassignment_reason] : []}
                  onSelectionChange={(keys) => handleInputChange('reassignment_reason', Array.from(keys)[0])}
                  isRequired
                >
                  {reasonOptions.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label="Nuovo Tecnico"
                  placeholder="Seleziona il nuovo tecnico"
                  selectedKeys={reassignmentData.new_technician_id ? [reassignmentData.new_technician_id] : []}
                  onSelectionChange={(keys) => handleInputChange('new_technician_id', Array.from(keys)[0])}
                  isRequired
                >
                  {technicians
                    .filter(t => t.technician_id !== intervention.assigned_technician_id)
                    .map((technician) => {
                      const suitability = getTechnicianSuitability(technician);
                      return (
                        <SelectItem key={technician.technician_id} value={technician.technician_id}>
                          <div className="flex justify-between items-center w-full">
                            <div>
                              <p className="font-medium">{technician.name} {technician.surname}</p>
                              <p className="text-xs text-default-500">
                                {technician.skill_level} - {technician.specializations.join(", ")}
                              </p>
                            </div>
                            <Badge 
                              size="sm" 
                              color={getSuitabilityColor(suitability.score) as any}
                              variant="flat"
                            >
                              {suitability.score}%
                            </Badge>
                          </div>
                        </SelectItem>
                      );
                    })}
                </Select>

                <Select
                  label="Furgone (Opzionale)"
                  placeholder="Seleziona furgone"
                  selectedKeys={reassignmentData.new_van_id ? [reassignmentData.new_van_id] : []}
                  onSelectionChange={(keys) => handleInputChange('new_van_id', Array.from(keys)[0])}
                >
                  {vans
                    .filter(van => !van.assigned_technician || van.assigned_technician === reassignmentData.new_technician_id)
                    .map((van) => (
                      <SelectItem key={van.van_id} value={van.van_id}>
                        {van.name} - {van.license_plate}
                      </SelectItem>
                    ))}
                </Select>

                <Divider />

                <div className="grid grid-cols-1 gap-4">
                  <Input
                    type="date"
                    label="Nuova Data"
                    value={reassignmentData.new_scheduled_date.toISOString().split('T')[0]}
                    onChange={(e) => handleInputChange('new_scheduled_date', new Date(e.target.value))}
                    isRequired
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="time"
                      label="Nuovo Orario Inizio"
                      value={reassignmentData.new_start_time}
                      onChange={(e) => handleInputChange('new_start_time', e.target.value)}
                      isRequired
                    />
                    <Input
                      type="time"
                      label="Nuovo Orario Fine"
                      value={reassignmentData.new_end_time}
                      onChange={(e) => handleInputChange('new_end_time', e.target.value)}
                      isRequired
                    />
                  </div>
                </div>

                <Select
                  label="Modifica Priorità (Opzionale)"
                  placeholder="Mantieni priorità attuale"
                  selectedKeys={reassignmentData.priority_change ? [reassignmentData.priority_change] : []}
                  onSelectionChange={(keys) => handleInputChange('priority_change', Array.from(keys)[0])}
                >
                  <SelectItem key="low" value="low">Bassa</SelectItem>
                  <SelectItem key="medium" value="medium">Media</SelectItem>
                  <SelectItem key="high" value="high">Alta</SelectItem>
                  <SelectItem key="emergency" value="emergency">Emergenza</SelectItem>
                </Select>

                <Textarea
                  label="Note Aggiuntive"
                  placeholder="Informazioni aggiuntive per il nuovo tecnico"
                  value={reassignmentData.additional_notes}
                  onChange={(e) => handleInputChange('additional_notes', e.target.value)}
                  minRows={3}
                />
              </CardBody>
            </Card>

            {/* Analisi Disponibilità */}
            <div className="space-y-6">
              {/* Suitabilità Tecnico Selezionato */}
              {reassignmentData.new_technician_id && (
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Icon icon="solar:user-check-bold-duotone" width={20} />
                      Analisi Idoneità
                    </h3>
                  </CardHeader>
                  <CardBody>
                    {(() => {
                      const technician = technicians.find(t => t.technician_id === reassignmentData.new_technician_id);
                      if (!technician) return null;
                      const suitability = getTechnicianSuitability(technician);
                      
                      return (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar 
                                name={`${technician.name} ${technician.surname}`}
                                size="sm"
                              />
                              <div>
                                <p className="font-medium">{technician.name} {technician.surname}</p>
                                <p className="text-sm text-default-500">{technician.skill_level}</p>
                              </div>
                            </div>
                            <Badge 
                              size="lg" 
                              color={getSuitabilityColor(suitability.score) as any}
                            >
                              {suitability.score}% Idoneo
                            </Badge>
                          </div>
                          
                          <Progress 
                            value={suitability.score} 
                            color={getSuitabilityColor(suitability.score) as any}
                            className="w-full"
                            aria-label="Idoneità tecnico"
                          />
                          
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Valutazione:</p>
                            {suitability.reasons.map((reason, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <Icon 
                                  icon={reason.includes("non") || reason.includes("elevato") || reason.includes("conflitti") 
                                    ? "solar:close-circle-bold" 
                                    : "solar:check-circle-bold"
                                  } 
                                  width={16} 
                                  className={reason.includes("non") || reason.includes("elevato") || reason.includes("conflitti")
                                    ? "text-danger" 
                                    : "text-success"
                                  }
                                />
                                <span className="text-default-600">{reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </CardBody>
                </Card>
              )}

              {/* Conflitti Potenziali */}
              {reassignmentData.new_technician_id && technicianConflicts[reassignmentData.new_technician_id] && (
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Icon icon="solar:danger-triangle-bold-duotone" width={20} />
                      Conflitti Potenziali
                    </h3>
                  </CardHeader>
                  <CardBody>
                    {technicianConflicts[reassignmentData.new_technician_id].length > 0 ? (
                      <div className="space-y-3">
                        {technicianConflicts[reassignmentData.new_technician_id].map((conflict, index) => (
                          <div key={index} className="p-3 bg-warning-50 rounded-lg border border-warning-200">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-warning-800">{conflict.intervention_code}</p>
                                <p className="text-sm text-warning-600">
                                  {conflict.time} - {getTypeLabel(conflict.type)}
                                </p>
                              </div>
                              <Chip size="sm" color="warning" variant="flat">
                                {getPriorityLabel(conflict.priority)}
                              </Chip>
                            </div>
                          </div>
                        ))}
                        <div className="text-sm text-warning-600">
                          ⚠️ Verificare la disponibilità del tecnico per evitare sovrapposizioni
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Icon icon="solar:verified-check-bold-duotone" width={48} className="mx-auto mb-2 text-success" />
                        <p className="text-success">Nessun conflitto rilevato</p>
                      </div>
                    )}
                  </CardBody>
                </Card>
              )}

              {/* Opzioni Notifica */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Icon icon="solar:bell-bold-duotone" width={20} />
                    Notifiche
                  </h3>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Notifica al cliente</span>
                    <input
                      type="checkbox"
                      checked={reassignmentData.notify_customer}
                      onChange={(e) => handleInputChange('notify_customer', e.target.checked)}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Notifica al tecnico precedente</span>
                    <input
                      type="checkbox"
                      checked={reassignmentData.notify_old_technician}
                      onChange={(e) => handleInputChange('notify_old_technician', e.target.checked)}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Notifica al nuovo tecnico</span>
                    <input
                      type="checkbox"
                      checked={reassignmentData.notify_new_technician}
                      onChange={(e) => handleInputChange('notify_new_technician', e.target.checked)}
                      className="rounded"
                    />
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>

          {/* Azioni */}
          <div className="flex justify-end gap-3">
            <Button
              size="lg"
              variant="light"
              onPress={() => navigate(`/interventions/${id}`)}
            >
              Annulla
            </Button>
            <Button
              size="lg"
              color="primary"
              onPress={onOpenConfirmModal}
              isDisabled={!canReassign()}
              startContent={<Icon icon="solar:user-check-rounded-bold" width={20} />}
            >
              Riassegna Intervento
            </Button>
          </div>
        </div>
      </div>

      {/* Modal conferma riassegnazione */}
      <Modal isOpen={isConfirmModalOpen} onClose={onCloseConfirmModal} size="2xl">
        <ModalContent>
          <ModalHeader>Conferma Riassegnazione</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p>Sei sicuro di voler riassegnare questo intervento?</p>
              
              <div className="bg-primary-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Intervento:</span>
                  <span className="font-medium">{intervention.intervention_code}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Da:</span>
                  <span className="font-medium">{currentTechnician?.name} {currentTechnician?.surname}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>A:</span>
                  <span className="font-medium">
                    {technicians.find(t => t.technician_id === reassignmentData.new_technician_id)?.name}{" "}
                    {technicians.find(t => t.technician_id === reassignmentData.new_technician_id)?.surname}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Nuova data:</span>
                  <span className="font-medium">
                    {formatDate(reassignmentData.new_scheduled_date)} - {reassignmentData.new_start_time} / {reassignmentData.new_end_time}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Motivo:</span>
                  <span className="font-medium">{reassignmentData.reassignment_reason}</span>
                </div>
              </div>
              
              {technicianConflicts[reassignmentData.new_technician_id]?.length > 0 && (
                <div className="bg-warning-50 p-4 rounded-lg">
                  <p className="text-warning-800 font-medium text-sm">
                    ⚠️ Attenzione: sono stati rilevati {technicianConflicts[reassignmentData.new_technician_id].length} possibili conflitti
                  </p>
                </div>
              )}
              
              <p className="text-sm text-default-500">
                Le notifiche verranno inviate secondo le impostazioni selezionate.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onCloseConfirmModal}>
              Annulla
            </Button>
            <Button 
              color="primary" 
              onPress={handleReassign}
              isLoading={reassigning}
              startContent={!reassigning ? <Icon icon="solar:user-check-rounded-bold" width={16} /> : null}
            >
              {reassigning ? "Riassegnazione..." : "Conferma Riassegnazione"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
} 