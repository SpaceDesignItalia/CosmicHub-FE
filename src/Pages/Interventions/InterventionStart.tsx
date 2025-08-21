import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Textarea,
  Chip,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Switch,
  Select,
  SelectItem,
  Progress,
  Avatar,
  Badge,
  Image,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import type { Intervention } from "../../types/Intervention";
import type { Customer } from "../../types/Customer";
import type { Technician } from "../../types/Technician";
import PageHeader from "../../Components/Layout/PageHeader";

interface CheckinData {
  arrival_time: string;
  actual_start_time: string;
  initial_assessment: string;
  customer_present: boolean;
  access_issues: string;
  preliminary_notes: string;
  photos_taken: string[];
  materials_check: boolean;
  tools_check: boolean;
  safety_check: boolean;
}

export default function InterventionStart() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isOpen: isConfirmModalOpen, onOpen: onOpenConfirmModal, onClose: onCloseConfirmModal } = useDisclosure();
  const { isOpen: isPhotoModalOpen, onOpen: onOpenPhotoModal, onClose: onClosePhotoModal } = useDisclosure();
  
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [checkinData, setCheckinData] = useState<CheckinData>({
    arrival_time: "",
    actual_start_time: "",
    initial_assessment: "",
    customer_present: true,
    access_issues: "",
    preliminary_notes: "",
    photos_taken: [],
    materials_check: false,
    tools_check: false,
    safety_check: false,
  });

  // Aggiorna l'ora corrente ogni secondo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadInterventionData();
  }, [id]);

  useEffect(() => {
    // Imposta automaticamente l'ora di arrivo all'orario corrente
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5); // HH:MM
    setCheckinData(prev => ({
      ...prev,
      arrival_time: timeString,
      actual_start_time: timeString,
    }));
  }, []);

  const loadInterventionData = async () => {
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
        status: "assigned",
        priority: "medium",
        scheduled_date: new Date("2024-12-15"),
        scheduled_start_time: "09:30",
        scheduled_end_time: "11:00",
        intervention_address: "Via Roma 123",
        intervention_city: "Milano",
        intervention_coordinates: { lat: 45.4642, lng: 9.1900 },
        estimated_cost: 150,
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
        technician_notes: "Portare strumenti per idraulica. Cliente disponibile dalle 9:00 alle 12:00.",
        created_at: new Date("2024-12-10"),
        updated_at: new Date(),
        created_by: "operator1",
      };

      setIntervention(mockIntervention);
      setCustomer(mockCustomer);
      setTechnician(mockTechnician);
    } catch (error) {
      console.error("Errore nel caricamento dei dati:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CheckinData, value: any) => {
    setCheckinData(prev => ({ ...prev, [field]: value }));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('it-IT', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const canStartIntervention = () => {
    return (
      checkinData.materials_check &&
      checkinData.tools_check &&
      checkinData.safety_check &&
      checkinData.actual_start_time.trim() !== ""
    );
  };

  const handleStartIntervention = async () => {
    if (!canStartIntervention()) {
      alert("Completa tutti i controlli prima di iniziare l'intervento");
      return;
    }

    setStarting(true);
    try {
      // Simula chiamata API per avviare l'intervento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log("Avvio intervento:", {
        intervention_id: id,
        checkin_data: checkinData,
      });

      // Aggiorna lo stato dell'intervento
      if (intervention) {
        const updatedIntervention = {
          ...intervention,
          status: "in_progress" as const,
          actual_start_time: checkinData.actual_start_time,
        };
        setIntervention(updatedIntervention);
      }

      // Naviga alla pagina di dettaglio o completa
      navigate(`/interventions/${id}`);
    } catch (error) {
      console.error("Errore nell'avvio dell'intervento:", error);
      alert("Errore nell'avvio dell'intervento. Riprova.");
    } finally {
      setStarting(false);
      onCloseConfirmModal();
    }
  };

  const simulatePhotoCapture = () => {
    const newPhoto = `/public/images/intervention-start-${Date.now()}.jpg`;
    setCheckinData(prev => ({
      ...prev,
      photos_taken: [...prev.photos_taken, newPhoto],
    }));
    onClosePhotoModal();
  };

  const removePhoto = (photoIndex: number) => {
    setCheckinData(prev => ({
      ...prev,
      photos_taken: prev.photos_taken.filter((_, index) => index !== photoIndex),
    }));
  };

  const getDelayStatus = () => {
    if (!intervention) return null;
    
    const scheduledTime = intervention.scheduled_start_time;
    const [scheduledHour, scheduledMinute] = scheduledTime.split(':').map(Number);
    const scheduledDateTime = new Date(intervention.scheduled_date);
    scheduledDateTime.setHours(scheduledHour, scheduledMinute, 0, 0);
    
    const now = new Date();
    const diffMs = now.getTime() - scheduledDateTime.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes > 15) {
      return { type: "late", minutes: diffMinutes, color: "danger" };
    } else if (diffMinutes > 0) {
      return { type: "slight_delay", minutes: diffMinutes, color: "warning" };
    } else if (diffMinutes > -15) {
      return { type: "on_time", minutes: Math.abs(diffMinutes), color: "success" };
    } else {
      return { type: "early", minutes: Math.abs(diffMinutes), color: "primary" };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen">
        <PageHeader
          title="Avvio Intervento"
          description="Caricamento..."
          icon="solar:play-circle-bold-duotone"
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

  const delayStatus = getDelayStatus();

  return (
    <div className="flex flex-col h-screen">
      <PageHeader
        title={`Avvio Intervento ${intervention.intervention_code}`}
        description="Completa il check-in e avvia l'intervento"
        icon="solar:play-circle-bold-duotone"
      />
      
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header con orario e stato */}
          <Card className="bg-gradient-to-r from-primary-50 to-secondary-50">
            <CardBody className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h1 className="text-2xl font-bold">{intervention.intervention_code}</h1>
                  <p className="text-lg text-default-600">{intervention.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-mono font-bold">{formatTime(currentTime)}</p>
                  <p className="text-sm text-default-500">{formatDate(currentTime)}</p>
                </div>
              </div>
              
              {delayStatus && (
                <div className="flex items-center gap-2 mb-4">
                  <Icon 
                    icon={delayStatus.type === "late" ? "solar:clock-circle-bold" : "solar:check-circle-bold"} 
                    width={20} 
                    className={`text-${delayStatus.color}`}
                  />
                  <Chip color={delayStatus.color as any} variant="flat">
                    {delayStatus.type === "late" ? `In ritardo di ${delayStatus.minutes} min` :
                     delayStatus.type === "slight_delay" ? `Leggero ritardo: ${delayStatus.minutes} min` :
                     delayStatus.type === "on_time" ? "In orario" :
                     `In anticipo di ${delayStatus.minutes} min`}
                  </Chip>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-default-500">Orario Programmato:</span>
                  <p className="font-medium">{intervention.scheduled_start_time} - {intervention.scheduled_end_time}</p>
                </div>
                <div>
                  <span className="text-default-500">Cliente:</span>
                  <p className="font-medium">{customer?.name} {customer?.surname}</p>
                </div>
                <div>
                  <span className="text-default-500">Indirizzo:</span>
                  <p className="font-medium">{intervention.intervention_address}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Check-in Form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informazioni Intervento */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Icon icon="solar:info-circle-bold-duotone" width={20} />
                  Dettagli Intervento
                </h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div>
                  <span className="text-default-500 text-sm">Descrizione:</span>
                  <p className="text-sm mt-1">{intervention.description}</p>
                </div>
                
                {intervention.technician_notes && (
                  <div>
                    <span className="text-default-500 text-sm">Note del Tecnico:</span>
                    <p className="text-sm mt-1 bg-warning-50 p-3 rounded-lg">
                      {intervention.technician_notes}
                    </p>
                  </div>
                )}

                {intervention.materials_needed && intervention.materials_needed.length > 0 && (
                  <div>
                    <span className="text-default-500 text-sm">Materiali Necessari:</span>
                    <div className="mt-2 space-y-2">
                      {intervention.materials_needed.map((material) => (
                        <div key={material.material_id} className="flex justify-between text-sm bg-default-50 p-2 rounded">
                          <span>{material.material_name}</span>
                          <span>{material.quantity} {material.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
              </CardBody>
            </Card>

            {/* Check-in Data */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Icon icon="solar:clipboard-check-bold-duotone" width={20} />
                  Check-in
                </h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="time"
                    label="Ora di Arrivo"
                    value={checkinData.arrival_time}
                    onChange={(e) => handleInputChange('arrival_time', e.target.value)}
                  />
                  <Input
                    type="time"
                    label="Ora Inizio Effettiva"
                    value={checkinData.actual_start_time}
                    onChange={(e) => handleInputChange('actual_start_time', e.target.value)}
                    isRequired
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Cliente presente</span>
                  <Switch
                    isSelected={checkinData.customer_present}
                    onValueChange={(value) => handleInputChange('customer_present', value)}
                  />
                </div>

                <Textarea
                  label="Valutazione Iniziale"
                  placeholder="Descrivi la situazione iniziale e eventuali problemi riscontrati"
                  value={checkinData.initial_assessment}
                  onChange={(e) => handleInputChange('initial_assessment', e.target.value)}
                  minRows={2}
                />

                <Textarea
                  label="Problemi di Accesso"
                  placeholder="Eventuali difficoltà di accesso o situazioni particolari"
                  value={checkinData.access_issues}
                  onChange={(e) => handleInputChange('access_issues', e.target.value)}
                  minRows={2}
                />
              </CardBody>
            </Card>
          </div>

          {/* Controlli Pre-Intervento */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="solar:shield-check-bold-duotone" width={20} />
                Controlli Pre-Intervento
              </h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center justify-between p-4 bg-default-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon icon="solar:box-bold-duotone" width={24} className="text-primary" />
                    <div>
                      <p className="font-medium">Controllo Materiali</p>
                      <p className="text-sm text-default-500">Verifica disponibilità materiali</p>
                    </div>
                  </div>
                  <Switch
                    isSelected={checkinData.materials_check}
                    onValueChange={(value) => handleInputChange('materials_check', value)}
                    color="success"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-default-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon icon="solar:hammer-bold-duotone" width={24} className="text-warning" />
                    <div>
                      <p className="font-medium">Controllo Strumenti</p>
                      <p className="text-sm text-default-500">Verifica strumenti necessari</p>
                    </div>
                  </div>
                  <Switch
                    isSelected={checkinData.tools_check}
                    onValueChange={(value) => handleInputChange('tools_check', value)}
                    color="success"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-default-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon icon="solar:shield-warning-bold-duotone" width={24} className="text-danger" />
                    <div>
                      <p className="font-medium">Controllo Sicurezza</p>
                      <p className="text-sm text-default-500">Verifica condizioni sicurezza</p>
                    </div>
                  </div>
                  <Switch
                    isSelected={checkinData.safety_check}
                    onValueChange={(value) => handleInputChange('safety_check', value)}
                    color="success"
                  />
                </div>
              </div>

              <Divider className="my-4" />

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-sm">Completamento Controlli:</span>
                  <Progress 
                    value={[checkinData.materials_check, checkinData.tools_check, checkinData.safety_check].filter(Boolean).length * 33.33}
                    className="w-32"
                    color="success"
                    aria-label="Completamento controlli"
                  />
                </div>
                {canStartIntervention() && (
                  <Badge color="success" variant="flat">
                    <Icon icon="solar:check-circle-bold" width={16} className="mr-1" />
                    Pronto per l'avvio
                  </Badge>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Documentazione Fotografica */}
          <Card>
            <CardHeader className="flex justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="solar:camera-bold-duotone" width={20} />
                Documentazione Iniziale
              </h3>
              <Button
                size="sm"
                color="primary"
                variant="flat"
                startContent={<Icon icon="solar:camera-add-bold" width={16} />}
                onPress={onOpenPhotoModal}
              >
                Scatta Foto
              </Button>
            </CardHeader>
            <CardBody>
              {checkinData.photos_taken.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {checkinData.photos_taken.map((photo, index) => (
                    <div key={index} className="relative">
                      <Image
                        src={photo}
                        alt={`Foto iniziale ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <Button
                        isIconOnly
                        size="sm"
                        color="danger"
                        className="absolute top-1 right-1"
                        onPress={() => removePhoto(index)}
                      >
                        <Icon icon="solar:trash-bin-trash-bold" width={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Icon icon="solar:camera-add-bold-duotone" width={48} className="mx-auto mb-4 text-default-400" />
                  <p className="text-default-500">Nessuna foto scattata</p>
                  <p className="text-sm text-default-400">Scatta foto della situazione iniziale</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Note Preliminari */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="solar:notes-bold-duotone" width={20} />
                Note Preliminari
              </h3>
            </CardHeader>
            <CardBody>
              <Textarea
                placeholder="Inserisci note preliminari sull'intervento, osservazioni iniziali o comunicazioni con il cliente"
                value={checkinData.preliminary_notes}
                onChange={(e) => handleInputChange('preliminary_notes', e.target.value)}
                minRows={3}
              />
            </CardBody>
          </Card>

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
              isDisabled={!canStartIntervention()}
              startContent={<Icon icon="solar:play-circle-bold" width={20} />}
            >
              Avvia Intervento
            </Button>
          </div>
        </div>
      </div>

      {/* Modal conferma avvio */}
      <Modal isOpen={isConfirmModalOpen} onClose={onCloseConfirmModal}>
        <ModalContent>
          <ModalHeader>Conferma Avvio Intervento</ModalHeader>
          <ModalBody>
            <div className="space-y-3">
              <p>Sei sicuro di voler avviare l'intervento?</p>
              <div className="bg-primary-50 p-3 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Intervento:</span>
                  <span className="font-medium">{intervention.intervention_code}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Ora di inizio:</span>
                  <span className="font-medium">{checkinData.actual_start_time}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Cliente presente:</span>
                  <span className="font-medium">{checkinData.customer_present ? "Sì" : "No"}</span>
                </div>
              </div>
              <p className="text-sm text-default-500">
                Una volta avviato, l'intervento passerà allo stato "In Corso" e inizierà il conteggio del tempo.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onCloseConfirmModal}>
              Annulla
            </Button>
            <Button 
              color="primary" 
              onPress={handleStartIntervention}
              isLoading={starting}
              startContent={!starting ? <Icon icon="solar:play-circle-bold" width={16} /> : null}
            >
              {starting ? "Avvio in corso..." : "Avvia Intervento"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal scatta foto */}
      <Modal isOpen={isPhotoModalOpen} onClose={onClosePhotoModal}>
        <ModalContent>
          <ModalHeader>Scatta Foto</ModalHeader>
          <ModalBody>
            <div className="text-center py-8">
              <Icon icon="solar:camera-bold-duotone" width={64} className="mx-auto mb-4 text-primary" />
              <p className="mb-4">Simula scatto foto iniziale</p>
              <p className="text-sm text-default-500">
                In una applicazione reale, qui si aprirebbe la fotocamera del dispositivo
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClosePhotoModal}>
              Annulla
            </Button>
            <Button color="primary" onPress={simulatePhotoCapture}>
              Simula Scatto
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
} 