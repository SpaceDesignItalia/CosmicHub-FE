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
  Select,
  SelectItem,
  Progress,
  Avatar,
  Badge,
  Image,
  Slider,
  DatePicker,
  Switch,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { parseDate } from "@internationalized/date";
import type { 
  Intervention, 
  MaterialUsed, 
  InterventionCompletionReport 
} from "../../types/Intervention";
import type { Customer } from "../../types/Customer";
import type { Technician } from "../../types/Technician";
import PageHeader from "../../Components/Layout/PageHeader";

interface CompletionData {
  work_performed: string;
  materials_used: MaterialUsed[];
  actual_cost: number;
  customer_satisfaction_rating: number;
  customer_signature: string;
  technician_notes: string;
  photos: string[];
  next_maintenance_date?: Date;
  recommendations: string;
  actual_end_time: string;
  issues_encountered: string;
  work_quality_rating: number;
  customer_present_at_completion: boolean;
}

export default function InterventionComplete() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isOpen: isConfirmModalOpen, onOpen: onOpenConfirmModal, onClose: onCloseConfirmModal } = useDisclosure();
  const { isOpen: isPhotoModalOpen, onOpen: onOpenPhotoModal, onClose: onClosePhotoModal } = useDisclosure();
  const { isOpen: isSignatureModalOpen, onOpen: onOpenSignatureModal, onClose: onCloseSignatureModal } = useDisclosure();
  const { isOpen: isMaterialModalOpen, onOpen: onOpenMaterialModal, onClose: onCloseMaterialModal } = useDisclosure();
  
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [completionData, setCompletionData] = useState<CompletionData>({
    work_performed: "",
    materials_used: [],
    actual_cost: 0,
    customer_satisfaction_rating: 5,
    customer_signature: "",
    technician_notes: "",
    photos: [],
    recommendations: "",
    actual_end_time: "",
    issues_encountered: "",
    work_quality_rating: 5,
    customer_present_at_completion: true,
  });

  // Form per nuovo materiale utilizzato
  const [newMaterial, setNewMaterial] = useState<MaterialUsed>({
    material_id: "",
    material_name: "",
    quantity_used: 1,
    unit: "pz",
    actual_cost: 0,
    serial_numbers: [],
  });

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
    // Imposta automaticamente l'ora di fine
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5); // HH:MM
    setCompletionData(prev => ({
      ...prev,
      actual_end_time: timeString,
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
        description: "Sostituzione guarnizioni e riparazione perdita d'acqua nel rubinetto principale della cucina",
        intervention_type: "repair",
        status: "in_progress",
        priority: "medium",
        scheduled_date: new Date("2024-12-15"),
        scheduled_start_time: "09:30",
        scheduled_end_time: "11:00",
        actual_start_time: "09:25",
        intervention_address: "Via Roma 123",
        intervention_city: "Milano",
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
        technician_notes: "Intervento avviato regolarmente",
        created_at: new Date("2024-12-10"),
        updated_at: new Date(),
        created_by: "operator1",
      };

      setIntervention(mockIntervention);
      setCustomer(mockCustomer);
      setTechnician(mockTechnician);

      // Pre-popola i materiali utilizzati basandosi sui materiali necessari
      if (mockIntervention.materials_needed) {
        const prefilledMaterials: MaterialUsed[] = mockIntervention.materials_needed.map(material => ({
          material_id: material.material_id,
          material_name: material.material_name,
          quantity_used: material.quantity,
          unit: material.unit,
          actual_cost: material.estimated_cost || 0,
          serial_numbers: [],
        }));
        
        setCompletionData(prev => ({
          ...prev,
          materials_used: prefilledMaterials,
          actual_cost: mockIntervention.estimated_cost || 0,
        }));
      }
    } catch (error) {
      console.error("Errore nel caricamento dei dati:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CompletionData, value: any) => {
    setCompletionData(prev => ({ ...prev, [field]: value }));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const calculateDuration = () => {
    if (!intervention?.actual_start_time || !completionData.actual_end_time) return null;
    
    const [startHour, startMinute] = intervention.actual_start_time.split(':').map(Number);
    const [endHour, endMinute] = completionData.actual_end_time.split(':').map(Number);
    
    const startTime = new Date();
    startTime.setHours(startHour, startMinute, 0, 0);
    
    const endTime = new Date();
    endTime.setHours(endHour, endMinute, 0, 0);
    
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    return { hours, minutes, total_minutes: diffMinutes };
  };

  const addMaterial = () => {
    if (!newMaterial.material_name.trim()) return;

    const material: MaterialUsed = {
      ...newMaterial,
      material_id: `MAT-${Date.now()}`, // Genera ID temporaneo
    };

    setCompletionData(prev => ({
      ...prev,
      materials_used: [...prev.materials_used, material],
      actual_cost: prev.actual_cost + material.actual_cost,
    }));

    setNewMaterial({
      material_id: "",
      material_name: "",
      quantity_used: 1,
      unit: "pz",
      actual_cost: 0,
      serial_numbers: [],
    });

    onCloseMaterialModal();
  };

  const removeMaterial = (materialId: string) => {
    const material = completionData.materials_used.find(m => m.material_id === materialId);
    if (material) {
      setCompletionData(prev => ({
        ...prev,
        materials_used: prev.materials_used.filter(m => m.material_id !== materialId),
        actual_cost: prev.actual_cost - material.actual_cost,
      }));
    }
  };

  const updateMaterialCost = (materialId: string, newCost: number) => {
    setCompletionData(prev => {
      const updatedMaterials = prev.materials_used.map(m => 
        m.material_id === materialId ? { ...m, actual_cost: newCost } : m
      );
      const totalCost = updatedMaterials.reduce((sum, m) => sum + m.actual_cost, 0);
      
      return {
        ...prev,
        materials_used: updatedMaterials,
        actual_cost: totalCost,
      };
    });
  };

  const canCompleteIntervention = () => {
    return (
      completionData.work_performed.trim() !== "" &&
      completionData.actual_end_time.trim() !== "" &&
      (completionData.customer_present_at_completion ? completionData.customer_signature.trim() !== "" : true)
    );
  };

  const handleCompleteIntervention = async () => {
    if (!canCompleteIntervention()) {
      alert("Compila tutti i campi obbligatori prima di completare l'intervento");
      return;
    }

    setCompleting(true);
    try {
      // Simula chiamata API per completare l'intervento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const completionReport: InterventionCompletionReport = {
        work_performed: completionData.work_performed,
        materials_used: completionData.materials_used,
        actual_cost: completionData.actual_cost,
        customer_satisfaction_rating: completionData.customer_satisfaction_rating,
        customer_signature: completionData.customer_signature,
        technician_notes: completionData.technician_notes,
        photos: completionData.photos,
        next_maintenance_date: completionData.next_maintenance_date,
        recommendations: completionData.recommendations,
      };

      console.log("Completamento intervento:", {
        intervention_id: id,
        completion_data: completionData,
        completion_report: completionReport,
      });

      // Naviga alla pagina di dettaglio
      navigate(`/interventions/${id}`);
    } catch (error) {
      console.error("Errore nel completamento dell'intervento:", error);
      alert("Errore nel completamento dell'intervento. Riprova.");
    } finally {
      setCompleting(false);
      onCloseConfirmModal();
    }
  };

  const simulatePhotoCapture = () => {
    const newPhoto = `/public/images/intervention-complete-${Date.now()}.jpg`;
    setCompletionData(prev => ({
      ...prev,
      photos: [...prev.photos, newPhoto],
    }));
    onClosePhotoModal();
  };

  const removePhoto = (photoIndex: number) => {
    setCompletionData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, index) => index !== photoIndex),
    }));
  };

  const simulateSignature = () => {
    setCompletionData(prev => ({
      ...prev,
      customer_signature: `Firma_${customer?.name}_${customer?.surname}_${Date.now()}`,
    }));
    onCloseSignatureModal();
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-background p-6 gap-6">
        <PageHeader
          title="Completa Intervento"
          description="Caricamento..."
          icon="solar:check-circle-bold-duotone"
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

  const duration = calculateDuration();

  return (
    <div className="flex flex-col h-screen">
      <PageHeader
        title={`Completa Intervento ${intervention.intervention_code}`}
        description="Finalizza l'intervento e genera il report"
        icon="solar:check-circle-bold-duotone"
      />
      
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header con riepilogo */}
          <Card className="bg-gradient-to-r from-success-50 to-primary-50">
            <CardBody className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h1 className="text-2xl font-bold">{intervention.intervention_code}</h1>
                  <p className="text-lg text-default-600">{intervention.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-mono font-bold">{formatTime(currentTime)}</p>
                  {duration && (
                    <p className="text-sm text-default-500">
                      Durata: {duration.hours}h {duration.minutes}m
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-default-500">Inizio:</span>
                  <p className="font-medium">{intervention.actual_start_time}</p>
                </div>
                <div>
                  <span className="text-default-500">Fine Prevista:</span>
                  <p className="font-medium">{intervention.scheduled_end_time}</p>
                </div>
                <div>
                  <span className="text-default-500">Cliente:</span>
                  <p className="font-medium">{customer?.name} {customer?.surname}</p>
                </div>
                <div>
                  <span className="text-default-500">Costo Stimato:</span>
                  <p className="font-medium">€ {intervention.estimated_cost}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Report Lavoro Eseguito */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="solar:clipboard-text-bold-duotone" width={20} />
                Report Lavoro Eseguito
              </h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="time"
                  label="Ora Fine Effettiva"
                  value={completionData.actual_end_time}
                  onChange={(e) => handleInputChange('actual_end_time', e.target.value)}
                  isRequired
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cliente presente alla fine</span>
                  <Switch
                    isSelected={completionData.customer_present_at_completion}
                    onValueChange={(value) => handleInputChange('customer_present_at_completion', value)}
                  />
                </div>
              </div>

              <Textarea
                label="Descrizione Lavoro Eseguito"
                placeholder="Descrivi dettagliatamente il lavoro svolto e le operazioni effettuate"
                value={completionData.work_performed}
                onChange={(e) => handleInputChange('work_performed', e.target.value)}
                minRows={4}
                isRequired
              />

              <Textarea
                label="Problemi Riscontrati"
                placeholder="Eventuali problemi o difficoltà incontrate durante l'intervento"
                value={completionData.issues_encountered}
                onChange={(e) => handleInputChange('issues_encountered', e.target.value)}
                minRows={2}
              />

              <Textarea
                label="Raccomandazioni"
                placeholder="Consigli per il cliente o raccomandazioni per futuri interventi"
                value={completionData.recommendations}
                onChange={(e) => handleInputChange('recommendations', e.target.value)}
                minRows={2}
              />
            </CardBody>
          </Card>

          {/* Materiali Utilizzati */}
          <Card>
            <CardHeader className="flex justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="solar:box-bold-duotone" width={20} />
                Materiali Utilizzati
              </h3>
              <Button
                size="sm"
                color="primary"
                variant="flat"
                startContent={<Icon icon="solar:add-circle-bold" width={16} />}
                onPress={onOpenMaterialModal}
              >
                Aggiungi Materiale
              </Button>
            </CardHeader>
            <CardBody>
              {completionData.materials_used.length > 0 ? (
                <div className="space-y-3">
                  {completionData.materials_used.map((material) => (
                    <div key={material.material_id} className="flex justify-between items-center p-4 bg-default-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{material.material_name}</p>
                        <p className="text-sm text-default-500">
                          Quantità utilizzata: {material.quantity_used} {material.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          size="sm"
                          className="w-24"
                          value={material.actual_cost.toString()}
                          onChange={(e) => updateMaterialCost(material.material_id, parseFloat(e.target.value) || 0)}
                          startContent={<span className="text-xs">€</span>}
                        />
                        <Button
                          isIconOnly
                          size="sm"
                          color="danger"
                          variant="light"
                          onPress={() => removeMaterial(material.material_id)}
                        >
                          <Icon icon="solar:trash-bin-trash-bold" width={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Divider />
                  <div className="flex justify-between items-center font-semibold">
                    <span>Totale Materiali:</span>
                    <span>€ {completionData.actual_cost.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-default-500 text-center py-4">Nessun materiale utilizzato</p>
              )}
            </CardBody>
          </Card>

          {/* Documentazione Fotografica */}
          <Card>
            <CardHeader className="flex justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="solar:camera-bold-duotone" width={20} />
                Documentazione Finale
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
              {completionData.photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {completionData.photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <Image
                        src={photo}
                        alt={`Foto finale ${index + 1}`}
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
                  <p className="text-sm text-default-400">Scatta foto del lavoro completato</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Valutazione e Soddisfazione */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="solar:star-bold-duotone" width={20} />
                Valutazione e Soddisfazione
              </h3>
            </CardHeader>
            <CardBody className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Soddisfazione Cliente</span>
                  <Badge color="primary" variant="flat">
                    {completionData.customer_satisfaction_rating}/5
                  </Badge>
                </div>
                <Slider
                  size="lg"
                  step={1}
                  maxValue={5}
                  minValue={1}
                  value={completionData.customer_satisfaction_rating}
                  onChange={(value) => handleInputChange('customer_satisfaction_rating', value)}
                  className="w-full"
                  color="primary"
                  showSteps
                />
                <div className="flex justify-between text-xs text-default-400 mt-1">
                  <span>Molto Insoddisfatto</span>
                  <span>Molto Soddisfatto</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Qualità del Lavoro (Auto-valutazione)</span>
                  <Badge color="success" variant="flat">
                    {completionData.work_quality_rating}/5
                  </Badge>
                </div>
                <Slider
                  size="lg"
                  step={1}
                  maxValue={5}
                  minValue={1}
                  value={completionData.work_quality_rating}
                  onChange={(value) => handleInputChange('work_quality_rating', value)}
                  className="w-full"
                  color="success"
                  showSteps
                />
              </div>
            </CardBody>
          </Card>

          {/* Firma Cliente */}
          <Card>
            <CardHeader className="flex justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="solar:pen-new-square-bold-duotone" width={20} />
                Firma Cliente
              </h3>
              {completionData.customer_present_at_completion && (
                <Button
                  size="sm"
                  color="primary"
                  variant="flat"
                  startContent={<Icon icon="solar:pen-bold" width={16} />}
                  onPress={onOpenSignatureModal}
                >
                  Raccolta Firma
                </Button>
              )}
            </CardHeader>
            <CardBody>
              {!completionData.customer_present_at_completion ? (
                <div className="text-center py-8">
                  <Icon icon="solar:user-cross-rounded-bold-duotone" width={48} className="mx-auto mb-4 text-warning" />
                  <p className="text-default-500">Cliente non presente alla fine dell'intervento</p>
                  <p className="text-sm text-default-400">La firma non è richiesta</p>
                </div>
              ) : completionData.customer_signature ? (
                <div className="text-center py-6 bg-success-50 rounded-lg">
                  <Icon icon="solar:verified-check-bold-duotone" width={48} className="mx-auto mb-4 text-success" />
                  <p className="text-success font-medium">Firma cliente acquisita</p>
                  <p className="text-sm text-default-500">{completionData.customer_signature}</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Icon icon="solar:pen-new-square-bold-duotone" width={48} className="mx-auto mb-4 text-default-400" />
                  <p className="text-default-500">Firma cliente non acquisita</p>
                  <p className="text-sm text-default-400">Richiesta per completare l'intervento</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Note Finali */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="solar:notes-bold-duotone" width={20} />
                Note Finali del Tecnico
              </h3>
            </CardHeader>
            <CardBody>
              <Textarea
                placeholder="Note finali, osservazioni aggiuntive o comunicazioni per il follow-up"
                value={completionData.technician_notes}
                onChange={(e) => handleInputChange('technician_notes', e.target.value)}
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
              Salva Bozza
            </Button>
            <Button
              size="lg"
              color="success"
              onPress={onOpenConfirmModal}
              isDisabled={!canCompleteIntervention()}
              startContent={<Icon icon="solar:check-circle-bold" width={20} />}
            >
              Completa Intervento
            </Button>
          </div>
        </div>
      </div>

      {/* Modal conferma completamento */}
      <Modal isOpen={isConfirmModalOpen} onClose={onCloseConfirmModal} size="2xl">
        <ModalContent>
          <ModalHeader>Conferma Completamento Intervento</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p>Sei sicuro di voler completare definitivamente questo intervento?</p>
              
              <div className="bg-success-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Intervento:</span>
                  <span className="font-medium">{intervention.intervention_code}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Durata:</span>
                  <span className="font-medium">
                    {duration ? `${duration.hours}h ${duration.minutes}m` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Costo finale:</span>
                  <span className="font-medium">€ {completionData.actual_cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Soddisfazione cliente:</span>
                  <span className="font-medium">{completionData.customer_satisfaction_rating}/5</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Firma cliente:</span>
                  <span className="font-medium">
                    {completionData.customer_present_at_completion 
                      ? (completionData.customer_signature ? "✓ Acquisita" : "✗ Mancante")
                      : "Non richiesta"
                    }
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-default-500">
                Una volta completato, l'intervento non potrà più essere modificato e verrà generato il report finale.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onCloseConfirmModal}>
              Annulla
            </Button>
            <Button 
              color="success" 
              onPress={handleCompleteIntervention}
              isLoading={completing}
              startContent={!completing ? <Icon icon="solar:check-circle-bold" width={16} /> : null}
            >
              {completing ? "Completamento..." : "Completa Intervento"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal aggiungi materiale */}
      <Modal isOpen={isMaterialModalOpen} onClose={onCloseMaterialModal}>
        <ModalContent>
          <ModalHeader>Aggiungi Materiale Utilizzato</ModalHeader>
          <ModalBody className="space-y-4">
            <Input
              label="Nome Materiale"
              placeholder="Es. Guarnizione O-Ring 25mm"
              value={newMaterial.material_name}
              onChange={(e) => setNewMaterial(prev => ({ ...prev, material_name: e.target.value }))}
              isRequired
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="Quantità Utilizzata"
                value={newMaterial.quantity_used.toString()}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, quantity_used: parseInt(e.target.value) || 1 }))}
                min="1"
                isRequired
              />
              <Select
                label="Unità"
                selectedKeys={[newMaterial.unit]}
                onSelectionChange={(keys) => setNewMaterial(prev => ({ ...prev, unit: Array.from(keys)[0] as string }))}
              >
                <SelectItem key="pz" value="pz">Pezzi</SelectItem>
                <SelectItem key="m" value="m">Metri</SelectItem>
                <SelectItem key="kg" value="kg">Chilogrammi</SelectItem>
                <SelectItem key="l" value="l">Litri</SelectItem>
                <SelectItem key="tubo" value="tubo">Tubo</SelectItem>
                <SelectItem key="conf" value="conf">Confezione</SelectItem>
              </Select>
            </div>
            <Input
              type="number"
              label="Costo Effettivo (€)"
              placeholder="0.00"
              value={newMaterial.actual_cost.toString()}
              onChange={(e) => setNewMaterial(prev => ({ ...prev, actual_cost: parseFloat(e.target.value) || 0 }))}
              startContent={<span className="text-default-400">€</span>}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onCloseMaterialModal}>
              Annulla
            </Button>
            <Button color="primary" onPress={addMaterial}>
              Aggiungi
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal scatta foto */}
      <Modal isOpen={isPhotoModalOpen} onClose={onClosePhotoModal}>
        <ModalContent>
          <ModalHeader>Scatta Foto Finale</ModalHeader>
          <ModalBody>
            <div className="text-center py-8">
              <Icon icon="solar:camera-bold-duotone" width={64} className="mx-auto mb-4 text-primary" />
              <p className="mb-4">Simula scatto foto finale</p>
              <p className="text-sm text-default-500">
                Documenta il lavoro completato per il report finale
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

      {/* Modal firma cliente */}
      <Modal isOpen={isSignatureModalOpen} onClose={onCloseSignatureModal}>
        <ModalContent>
          <ModalHeader>Raccolta Firma Cliente</ModalHeader>
          <ModalBody>
            <div className="text-center py-8">
              <Icon icon="solar:pen-new-square-bold-duotone" width={64} className="mx-auto mb-4 text-primary" />
              <p className="mb-4">Simula raccolta firma cliente</p>
              <p className="text-sm text-default-500">
                Cliente: {customer?.name} {customer?.surname}
              </p>
              <p className="text-sm text-default-500">
                In una applicazione reale, qui si aprirebbe il modulo per la firma digitale
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onCloseSignatureModal}>
              Annulla
            </Button>
            <Button color="primary" onPress={simulateSignature}>
              Simula Firma
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
} 