import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
  Chip,
  Badge,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Progress,
  Avatar,
  AvatarGroup,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import type { Intervention } from "../../types/Intervention";
import type { Customer } from "../../types/Customer";
import type { Technician } from "../../types/Technician";
import PageHeader from "../../Components/Layout/PageHeader";

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

export default function InterventionAssign() {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [selectedTechnician, setSelectedTechnician] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Mock data
  useEffect(() => {
    const mockCustomers: Customer[] = [
      {
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
      },
      {
        customer_id: "2",
        name: "Giulia",
        surname: "Verdi",
        phone: "+39 333 7654321",
        address: "Via Garibaldi 456",
        city: "Roma",
        zip_code: "00100",
        country: "Italia",
        status: "active",
        customer_type: "business",
        created_at: new Date(),
        updated_at: new Date(),
        created_by: "admin",
      },
    ];

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
    ];

    const mockInterventions: Intervention[] = [
      {
        intervention_id: "1",
        appointment_id: "1",
        customer_id: "1",
        assigned_technician_id: null,
        intervention_code: "INT-2024-001",
        title: "Riparazione rubinetto cucina",
        description: "Sostituzione guarnizioni e riparazione perdita d'acqua",
        intervention_type: "repair",
        status: "assigned",
        priority: "medium",
        scheduled_date: new Date("2024-12-15"),
        scheduled_start_time: "09:30",
        scheduled_end_time: "11:00",
        intervention_address: "Via Roma 123",
        intervention_city: "Milano",
        estimated_cost: 150,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: "operator1",
      },
      {
        intervention_id: "2",
        appointment_id: "2",
        customer_id: "2",
        assigned_technician_id: null,
        intervention_code: "INT-2024-002",
        title: "Installazione termostato smart",
        description: "Installazione e configurazione termostato WiFi",
        intervention_type: "installation",
        status: "assigned",
        priority: "high",
        scheduled_date: new Date("2024-12-18"),
        scheduled_start_time: "14:00",
        scheduled_end_time: "16:30",
        intervention_address: "Via Garibaldi 456",
        intervention_city: "Roma",
        estimated_cost: 300,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: "operator1",
      },
    ];

    setCustomers(mockCustomers);
    setTechnicians(mockTechnicians);
    setInterventions(mockInterventions);
  }, []);

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.customer_id === customerId);
    return customer ? `${customer.name} ${customer.surname}` : "N/A";
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

  const getTechnicianWorkload = (technicianId: string) => {
    return interventions.filter(i => 
      i.assigned_technician_id === technicianId && 
      i.status === "in_progress"
    ).length;
  };

  const getTechnicianSpecializations = (technicianId: string) => {
    const technician = technicians.find(t => t.technician_id === technicianId);
    return technician?.specializations || [];
  };

  const isTechnicianSuitable = (technician: Technician, intervention: Intervention) => {
    // Controlla se il tecnico ha le specializzazioni richieste
    const hasSpecialization = technician.specializations.includes(intervention.intervention_type);
    
    // Controlla il carico di lavoro (max 3 interventi simultanei)
    const workload = getTechnicianWorkload(technician.technician_id);
    const isAvailable = workload < 3;
    
    return hasSpecialization && isAvailable;
  };

  const getSuitableTechnicians = (intervention: Intervention) => {
    return technicians.filter(tech => isTechnicianSuitable(tech, intervention));
  };

  const handleAssignIntervention = (intervention: Intervention) => {
    setSelectedIntervention(intervention);
    setSelectedDate(formatDate(intervention.scheduled_date));
    setSelectedTime(intervention.scheduled_start_time);
    setSelectedTechnician("");
    setNotes("");
    onOpen();
  };

  const handleConfirmAssignment = async () => {
    if (!selectedIntervention || !selectedTechnician) return;

    setLoading(true);
    try {
      // Simula chiamata API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Aggiorna l'intervento
      const updatedInterventions = interventions.map(i => 
        i.intervention_id === selectedIntervention.intervention_id
          ? { ...i, assigned_technician_id: selectedTechnician }
          : i
      );
      
      setInterventions(updatedInterventions);
      onClose();
      
      // Naviga alla lista interventi
      navigate("/interventions");
    } catch (error) {
      console.error("Errore nell'assegnazione:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    setLoading(true);
    try {
      // Simula assegnazione automatica
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const updatedInterventions = interventions.map(intervention => {
        if (intervention.assigned_technician_id) return intervention;
        
        const suitableTechnicians = getSuitableTechnicians(intervention);
        if (suitableTechnicians.length > 0) {
          // Scegli il tecnico con meno carico di lavoro
          const bestTechnician = suitableTechnicians.reduce((best, current) => {
            const bestWorkload = getTechnicianWorkload(best.technician_id);
            const currentWorkload = getTechnicianWorkload(current.technician_id);
            return currentWorkload < bestWorkload ? current : best;
          });
          
          return { ...intervention, assigned_technician_id: bestTechnician.technician_id };
        }
        return intervention;
      });
      
      setInterventions(updatedInterventions);
    } catch (error) {
      console.error("Errore nell'assegnazione automatica:", error);
    } finally {
      setLoading(false);
    }
  };

  const unassignedInterventions = interventions.filter(i => !i.assigned_technician_id);
  const assignedInterventions = interventions.filter(i => i.assigned_technician_id);

  return (
    <div className="flex flex-col h-screen">
      <PageHeader
        title="Assegnazione Interventi"
        description="Assegna interventi ai tecnici disponibili o usa l'assegnazione automatica"
        icon="solar:user-check-rounded-bold-duotone"
      />
      
      <div className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Interventi da assegnare */}
          <Card>
            <CardBody>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Interventi da Assegnare</h3>
                <Button
                  color="primary"
                  size="sm"
                  onPress={handleAutoAssign}
                  isLoading={loading}
                  startContent={<Icon icon="solar:magic-stick-bold" width={16} />}
                >
                  Assegnazione Automatica
                </Button>
              </div>
              
              {unassignedInterventions.length === 0 ? (
                <div className="text-center py-8 text-default-400">
                  <Icon icon="solar:check-circle-bold" width={48} className="mx-auto mb-2" />
                  <p>Tutti gli interventi sono stati assegnati!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {unassignedInterventions.map((intervention) => {
                    const suitableTechnicians = getSuitableTechnicians(intervention);
                    
                    return (
                      <Card key={intervention.intervention_id} className="border-2 border-default-200">
                        <CardBody className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold">{intervention.intervention_code}</h4>
                              <p className="text-sm text-default-600">{intervention.title}</p>
                            </div>
                            <div className="flex gap-2">
                              <Chip
                                size="sm"
                                color={priorityColorMap[intervention.priority]}
                                variant="flat"
                              >
                                {getPriorityLabel(intervention.priority)}
                              </Chip>
                              <Chip
                                size="sm"
                                color={typeColorMap[intervention.intervention_type]}
                                variant="flat"
                              >
                                {getTypeLabel(intervention.intervention_type)}
                              </Chip>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                              <span className="text-default-500">Cliente:</span>
                              <p>{getCustomerName(intervention.customer_id)}</p>
                            </div>
                            <div>
                              <span className="text-default-500">Data:</span>
                              <p>{formatDate(intervention.scheduled_date)}</p>
                            </div>
                            <div>
                              <span className="text-default-500">Orario:</span>
                              <p>{intervention.scheduled_start_time} - {intervention.scheduled_end_time}</p>
                            </div>
                            <div>
                              <span className="text-default-500">Indirizzo:</span>
                              <p>{intervention.intervention_address}, {intervention.intervention_city}</p>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-default-500">Tecnici disponibili:</span>
                              <Badge color={suitableTechnicians.length > 0 ? "success" : "danger"}>
                                {suitableTechnicians.length}
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              color="primary"
                              onPress={() => handleAssignIntervention(intervention)}
                              isDisabled={suitableTechnicians.length === 0}
                            >
                              Assegna
                            </Button>
                          </div>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Tecnici e carico di lavoro */}
          <Card>
            <CardBody>
              <h3 className="text-lg font-semibold mb-4">Tecnici e Carico di Lavoro</h3>
              
              <div className="space-y-4">
                {technicians.map((technician) => {
                  const workload = getTechnicianWorkload(technician.technician_id);
                  const assignedInterventions = interventions.filter(i => 
                    i.assigned_technician_id === technician.technician_id
                  );
                  
                  return (
                    <Card key={technician.technician_id} className="border border-default-200">
                      <CardBody className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">
                              {technician.name} {technician.surname}
                            </h4>
                            <p className="text-sm text-default-600">
                              {technician.skill_level === "senior" ? "Tecnico Senior" : "Tecnico Junior"}
                            </p>
                          </div>
                          <Badge
                            color={technician.availability_status === "available" ? "success" : "warning"}
                            variant="flat"
                          >
                            {technician.availability_status === "available" ? "Disponibile" : "Occupato"}
                          </Badge>
                        </div>
                        
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Carico di lavoro</span>
                            <span>{workload}/3 interventi</span>
                          </div>
                          <Progress
                            value={(workload / 3) * 100}
                            color={workload >= 3 ? "danger" : workload >= 2 ? "warning" : "success"}
                            className="w-full"
                            aria-label="Carico di lavoro tecnico"
                          />
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-sm text-default-500 mb-1">Specializzazioni:</p>
                          <div className="flex gap-1 flex-wrap">
                            {technician.specializations.map((spec) => (
                              <Chip key={spec} size="sm" variant="flat">
                                {getTypeLabel(spec)}
                              </Chip>
                            ))}
                          </div>
                        </div>
                        
                        {assignedInterventions.length > 0 && (
                          <div>
                            <p className="text-sm text-default-500 mb-1">Interventi assegnati:</p>
                            <div className="space-y-1">
                              {assignedInterventions.slice(0, 3).map((intervention) => (
                                <div key={intervention.intervention_id} className="flex justify-between text-xs">
                                  <span>{intervention.intervention_code}</span>
                                  <Chip size="sm" color={statusColorMap[intervention.status]} variant="flat">
                                    {intervention.status}
                                  </Chip>
                                </div>
                              ))}
                              {assignedInterventions.length > 3 && (
                                <p className="text-xs text-default-400">
                                  +{assignedInterventions.length - 3} altri...
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Modal assegnazione manuale */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Assegna Intervento
              </ModalHeader>
              <ModalBody>
                {selectedIntervention && (
                  <div className="space-y-4">
                    {/* Dettagli intervento */}
                    <Card className="border border-primary-200 bg-primary-50">
                      <CardBody className="p-4">
                        <h4 className="font-semibold mb-2">{selectedIntervention.intervention_code}</h4>
                        <p className="text-sm mb-2">{selectedIntervention.title}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-default-500">Cliente:</span>
                            <p>{getCustomerName(selectedIntervention.customer_id)}</p>
                          </div>
                          <div>
                            <span className="text-default-500">Tipo:</span>
                            <p>{getTypeLabel(selectedIntervention.intervention_type)}</p>
                          </div>
                          <div>
                            <span className="text-default-500">Priorità:</span>
                            <p>{getPriorityLabel(selectedIntervention.priority)}</p>
                          </div>
                          <div>
                            <span className="text-default-500">Indirizzo:</span>
                            <p>{selectedIntervention.intervention_address}</p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    {/* Selezione tecnico */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Seleziona Tecnico</label>
                      <Select
                        placeholder="Scegli un tecnico"
                        selectedKeys={selectedTechnician ? [selectedTechnician] : []}
                        onSelectionChange={(keys) => setSelectedTechnician(Array.from(keys)[0] as string)}
                      >
                        {getSuitableTechnicians(selectedIntervention).map((technician) => (
                          <SelectItem key={technician.technician_id} value={technician.technician_id}>
                            <div className="flex justify-between items-center w-full">
                              <span>{technician.name} {technician.surname}</span>
                              <Badge size="sm" color="secondary">
                                {getTechnicianWorkload(technician.technician_id)}/3
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </Select>
                    </div>

                    {/* Data e orario */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Data</label>
                        <Input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Orario</label>
                        <Input
                          type="time"
                          value={selectedTime}
                          onChange={(e) => setSelectedTime(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Note */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Note aggiuntive</label>
                      <Textarea
                        placeholder="Inserisci note per il tecnico..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        minRows={3}
                      />
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  Annulla
                </Button>
                <Button
                  color="primary"
                  onPress={handleConfirmAssignment}
                  isLoading={loading}
                  isDisabled={!selectedTechnician}
                >
                  Assegna Intervento
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
} 