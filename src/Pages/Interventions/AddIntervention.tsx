import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  Switch,
  Tabs,
  Tab,
  Autocomplete,
  AutocompleteItem,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { parseDate, getLocalTimeZone } from "@internationalized/date";
import type { InterventionFormData, MaterialNeeded } from "../../types/Intervention";
import type { Customer } from "../../types/Customer";
import type { Technician } from "../../types/Technician";
import PageHeader from "../../Components/Layout/PageHeader";

type Step = "customer" | "intervention" | "assignment" | "materials" | "review";

const steps: { key: Step; label: string; icon: string }[] = [
  { key: "customer", label: "Cliente", icon: "solar:user-bold" },
  { key: "intervention", label: "Intervento", icon: "solar:clipboard-text-bold" },
  { key: "assignment", label: "Assegnazione", icon: "solar:user-check-rounded-bold" },
  { key: "materials", label: "Materiali", icon: "solar:box-bold" },
  { key: "review", label: "Riepilogo", icon: "solar:eye-bold" },
];

const priorityOptions = [
  { key: "low", label: "Bassa", color: "success", description: "Non urgente, può essere programmato" },
  { key: "medium", label: "Media", color: "warning", description: "Necessita intervento entro qualche giorno" },
  { key: "high", label: "Alta", color: "danger", description: "Richiede intervento rapido" },
  { key: "emergency", label: "Emergenza", color: "danger", description: "Intervento immediato richiesto" },
];

const typeOptions = [
  { key: "inspection", label: "Ispezione", color: "primary", description: "Controllo e verifica" },
  { key: "repair", label: "Riparazione", color: "warning", description: "Risoluzione di problemi esistenti" },
  { key: "maintenance", label: "Manutenzione", color: "secondary", description: "Manutenzione preventiva o programmata" },
  { key: "installation", label: "Installazione", color: "success", description: "Installazione di nuovi componenti" },
  { key: "emergency", label: "Emergenza", color: "danger", description: "Intervento di emergenza" },
];

export default function AddIntervention() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isOpen: isMaterialModalOpen, onOpen: onOpenMaterialModal, onClose: onCloseMaterialModal } = useDisclosure();
  const { isOpen: isConfirmModalOpen, onOpen: onOpenConfirmModal, onClose: onCloseConfirmModal } = useDisclosure();
  
  const [currentStep, setCurrentStep] = useState<Step>("customer");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [vans, setVans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState<InterventionFormData>({
    appointment_id: "",
    customer_id: searchParams.get("customer_id") || "",
    assigned_technician_id: "",
    assigned_van_id: "",
    title: "",
    description: "",
    intervention_type: "repair",
    priority: "medium",
    scheduled_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Domani
    scheduled_start_time: "09:00",
    scheduled_end_time: "10:00",
    intervention_address: "",
    intervention_city: "",
    estimated_cost: 0,
    materials_needed: [],
    technician_notes: "",
  });

  // Form per nuovo materiale
  const [newMaterial, setNewMaterial] = useState<MaterialNeeded>({
    material_id: "",
    material_name: "",
    quantity: 1,
    unit: "pz",
    estimated_cost: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Mock data - sostituire con chiamate API reali
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
        {
          customer_id: "3",
          name: "Luca",
          surname: "Bianchi",
          phone: "+39 333 5555555",
          address: "Via Torino 789",
          city: "Torino",
          zip_code: "10100",
          country: "Italia",
          status: "active",
          customer_type: "private",
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

      const mockVans = [
        { van_id: "VAN-001", name: "Furgone 1", license_plate: "AB123CD", assigned_technician: null },
        { van_id: "VAN-002", name: "Furgone 2", license_plate: "EF456GH", assigned_technician: null },
        { van_id: "VAN-003", name: "Furgone 3", license_plate: "IJ789KL", assigned_technician: "1" },
      ];

      setCustomers(mockCustomers);
      setTechnicians(mockTechnicians);
      setVans(mockVans);

      // Se c'è un customer_id nei parametri URL, precompila i dati
      const customerId = searchParams.get("customer_id");
      if (customerId) {
        const customer = mockCustomers.find(c => c.customer_id === customerId);
        if (customer) {
          setFormData(prev => ({
            ...prev,
            customer_id: customerId,
            intervention_address: customer.address,
            intervention_city: customer.city,
          }));
        }
      }
    } catch (error) {
      console.error("Errore nel caricamento dei dati:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof InterventionFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.customer_id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer_id: customerId,
        intervention_address: customer.address,
        intervention_city: customer.city,
      }));
    }
  };

  const addMaterial = () => {
    if (!newMaterial.material_name.trim()) return;

    const material: MaterialNeeded = {
      ...newMaterial,
      material_id: `MAT-${Date.now()}`, // Genera ID temporaneo
    };

    setFormData(prev => ({
      ...prev,
      materials_needed: [...prev.materials_needed, material],
    }));

    setNewMaterial({
      material_id: "",
      material_name: "",
      quantity: 1,
      unit: "pz",
      estimated_cost: 0,
    });

    onCloseMaterialModal();
  };

  const removeMaterial = (materialId: string) => {
    setFormData(prev => ({
      ...prev,
      materials_needed: prev.materials_needed.filter(m => m.material_id !== materialId),
    }));
  };

  const validateStep = (step: Step): boolean => {
    switch (step) {
      case "customer":
        return formData.customer_id !== "";
      case "intervention":
        return formData.title.trim() !== "" && formData.description.trim() !== "";
      case "assignment":
        return formData.assigned_technician_id !== "" && 
               formData.scheduled_start_time !== "" && 
               formData.scheduled_end_time !== "";
      case "materials":
        return true; // Materiali sono opzionali
      case "review":
        return true;
      default:
        return false;
    }
  };

  const canProceedToNext = (): boolean => {
    return validateStep(currentStep);
  };

  const handleNext = () => {
    if (!canProceedToNext()) return;
    
    const currentIndex = steps.findIndex(s => s.key === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].key);
    }
  };

  const handlePrevious = () => {
    const currentIndex = steps.findIndex(s => s.key === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].key);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      // Validazione finale
      if (!validateStep("customer") || !validateStep("intervention") || !validateStep("assignment")) {
        alert("Compila tutti i campi obbligatori");
        return;
      }

      // Simula chiamata API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const interventionData = {
        ...formData,
        intervention_code: `INT-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        appointment_id: `APP-${Date.now()}`,
      };

      console.log("Creazione nuovo intervento:", interventionData);
      
      // Naviga alla lista interventi
      navigate("/interventions");
    } catch (error) {
      console.error("Errore nella creazione dell'intervento:", error);
      alert("Errore nella creazione dell'intervento. Riprova.");
    } finally {
      setSaving(false);
      onCloseConfirmModal();
    }
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getStepProgress = () => {
    const currentIndex = steps.findIndex(s => s.key === currentStep);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  const getSuggestedTechnicians = () => {
    return technicians.filter(tech => 
      tech.specializations.includes(formData.intervention_type) &&
      tech.availability_status === "available"
    );
  };

  const getSelectedCustomer = () => {
    return customers.find(c => c.customer_id === formData.customer_id);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "customer":
        return (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="solar:user-bold-duotone" width={20} />
                Seleziona Cliente
              </h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <Autocomplete
                label="Cliente"
                placeholder="Cerca cliente per nome, cognome o telefono"
                selectedKey={formData.customer_id}
                onSelectionChange={(key) => handleCustomerSelect(key as string)}
                isRequired
              >
                {customers.map((customer) => (
                  <AutocompleteItem key={customer.customer_id} value={customer.customer_id}>
                    <div className="flex justify-between items-center w-full">
                      <div>
                        <p className="font-medium">{customer.name} {customer.surname}</p>
                        <p className="text-sm text-default-500">{customer.phone}</p>
                      </div>
                      <Chip size="sm" variant="flat">
                        {customer.customer_type === "private" ? "Privato" : "Azienda"}
                      </Chip>
                    </div>
                  </AutocompleteItem>
                ))}
              </Autocomplete>

              {formData.customer_id && (
                <Card className="bg-primary-50 border-primary-200">
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar 
                        name={`${getSelectedCustomer()?.name} ${getSelectedCustomer()?.surname}`}
                        size="sm"
                      />
                      <div>
                        <p className="font-medium">{getSelectedCustomer()?.name} {getSelectedCustomer()?.surname}</p>
                        <p className="text-sm text-default-600">{getSelectedCustomer()?.phone}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-default-500">Indirizzo:</span>
                        <p>{getSelectedCustomer()?.address}</p>
                      </div>
                      <div>
                        <span className="text-default-500">Città:</span>
                        <p>{getSelectedCustomer()?.city}</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Indirizzo Intervento"
                  placeholder="Via, numero civico"
                  value={formData.intervention_address}
                  onChange={(e) => handleInputChange('intervention_address', e.target.value)}
                  isRequired
                />
                <Input
                  label="Città"
                  placeholder="Città"
                  value={formData.intervention_city}
                  onChange={(e) => handleInputChange('intervention_city', e.target.value)}
                  isRequired
                />
              </div>

              <Button
                color="primary"
                variant="flat"
                size="sm"
                startContent={<Icon icon="solar:user-plus-bold" width={16} />}
                onPress={() => navigate("/customers/add")}
              >
                Aggiungi Nuovo Cliente
              </Button>
            </CardBody>
          </Card>
        );

      case "intervention":
        return (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="solar:clipboard-text-bold-duotone" width={20} />
                Dettagli Intervento
              </h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                label="Titolo Intervento"
                placeholder="Inserisci il titolo dell'intervento"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                isRequired
              />

              <Textarea
                label="Descrizione"
                placeholder="Descrivi dettagliatamente l'intervento da effettuare"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                minRows={4}
                isRequired
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Tipo Intervento</label>
                  <div className="space-y-2">
                    {typeOptions.map((type) => (
                      <div
                        key={type.key}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.intervention_type === type.key
                            ? 'border-primary-300 bg-primary-50'
                            : 'border-default-200 hover:border-default-300'
                        }`}
                        onClick={() => handleInputChange('intervention_type', type.key)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{type.label}</p>
                            <p className="text-sm text-default-500">{type.description}</p>
                          </div>
                          <Chip size="sm" color={type.color as any} variant="flat">
                            {type.label}
                          </Chip>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Priorità</label>
                  <div className="space-y-2">
                    {priorityOptions.map((priority) => (
                      <div
                        key={priority.key}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.priority === priority.key
                            ? 'border-primary-300 bg-primary-50'
                            : 'border-default-200 hover:border-default-300'
                        }`}
                        onClick={() => handleInputChange('priority', priority.key)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{priority.label}</p>
                            <p className="text-sm text-default-500">{priority.description}</p>
                          </div>
                          <Chip size="sm" color={priority.color as any} variant="flat">
                            {priority.label}
                          </Chip>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Input
                type="number"
                label="Costo Stimato (€)"
                placeholder="0.00"
                value={formData.estimated_cost.toString()}
                onChange={(e) => handleInputChange('estimated_cost', parseFloat(e.target.value) || 0)}
                startContent={<span className="text-default-400">€</span>}
              />
            </CardBody>
          </Card>
        );

      case "assignment":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Icon icon="solar:calendar-bold-duotone" width={20} />
                  Programmazione
                </h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    type="date"
                    label="Data Programmata"
                    value={formatDate(formData.scheduled_date)}
                    onChange={(e) => handleInputChange('scheduled_date', new Date(e.target.value))}
                    isRequired
                  />
                  <Input
                    type="time"
                    label="Ora Inizio"
                    value={formData.scheduled_start_time}
                    onChange={(e) => handleInputChange('scheduled_start_time', e.target.value)}
                    isRequired
                  />
                  <Input
                    type="time"
                    label="Ora Fine"
                    value={formData.scheduled_end_time}
                    onChange={(e) => handleInputChange('scheduled_end_time', e.target.value)}
                    isRequired
                  />
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Icon icon="solar:user-check-rounded-bold-duotone" width={20} />
                  Assegnazione Tecnico
                </h3>
              </CardHeader>
              <CardBody className="space-y-4">
                {getSuggestedTechnicians().length > 0 && (
                  <div className="bg-success-50 p-4 rounded-lg">
                    <p className="text-success-800 font-medium text-sm mb-2">
                      <Icon icon="solar:star-bold" width={16} className="inline mr-1" />
                      Tecnici Consigliati per {typeOptions.find(t => t.key === formData.intervention_type)?.label}
                    </p>
                    <div className="space-y-2">
                      {getSuggestedTechnicians().map((technician) => (
                        <div
                          key={technician.technician_id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            formData.assigned_technician_id === technician.technician_id
                              ? 'border-primary-300 bg-primary-50'
                              : 'border-success-200 hover:border-success-300 bg-white'
                          }`}
                          onClick={() => handleInputChange('assigned_technician_id', technician.technician_id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar 
                                name={`${technician.name} ${technician.surname}`}
                                size="sm"
                              />
                              <div>
                                <p className="font-medium">{technician.name} {technician.surname}</p>
                                <p className="text-sm text-default-500">
                                  {technician.skill_level} - {technician.specializations.join(", ")}
                                </p>
                              </div>
                            </div>
                            <Badge color="success" size="sm">
                              Consigliato
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium mb-2">Altri Tecnici Disponibili</p>
                  <div className="space-y-2">
                    {technicians
                      .filter(tech => !getSuggestedTechnicians().includes(tech))
                      .map((technician) => (
                        <div
                          key={technician.technician_id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            formData.assigned_technician_id === technician.technician_id
                              ? 'border-primary-300 bg-primary-50'
                              : 'border-default-200 hover:border-default-300'
                          }`}
                          onClick={() => handleInputChange('assigned_technician_id', technician.technician_id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar 
                                name={`${technician.name} ${technician.surname}`}
                                size="sm"
                              />
                              <div>
                                <p className="font-medium">{technician.name} {technician.surname}</p>
                                <p className="text-sm text-default-500">
                                  {technician.skill_level} - {technician.specializations.join(", ")}
                                </p>
                              </div>
                            </div>
                            <Badge 
                              color={technician.availability_status === "available" ? "success" : "warning"}
                              size="sm"
                            >
                              {technician.availability_status === "available" ? "Disponibile" : "Occupato"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <Select
                  label="Furgone (Opzionale)"
                  placeholder="Seleziona furgone"
                  selectedKeys={formData.assigned_van_id ? [formData.assigned_van_id] : []}
                  onSelectionChange={(keys) => handleInputChange('assigned_van_id', Array.from(keys)[0])}
                >
                  {vans
                    .filter(van => !van.assigned_technician || van.assigned_technician === formData.assigned_technician_id)
                    .map((van) => (
                      <SelectItem key={van.van_id} value={van.van_id}>
                        {van.name} - {van.license_plate}
                      </SelectItem>
                    ))}
                </Select>

                <Textarea
                  label="Note per il Tecnico"
                  placeholder="Inserisci note aggiuntive per il tecnico (strumenti necessari, accessi speciali, ecc.)"
                  value={formData.technician_notes}
                  onChange={(e) => handleInputChange('technician_notes', e.target.value)}
                  minRows={3}
                />
              </CardBody>
            </Card>
          </div>
        );

      case "materials":
        return (
          <Card>
            <CardHeader className="flex justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="solar:box-bold-duotone" width={20} />
                Materiali Necessari
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
              {formData.materials_needed.length > 0 ? (
                <div className="space-y-3">
                  {formData.materials_needed.map((material) => (
                    <div key={material.material_id} className="flex justify-between items-center p-3 bg-default-50 rounded-lg">
                      <div>
                        <p className="font-medium">{material.material_name}</p>
                        <p className="text-sm text-default-500">
                          Quantità: {material.quantity} {material.unit} - Costo stimato: €{material.estimated_cost}
                        </p>
                      </div>
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
                  ))}
                  <Divider />
                  <div className="flex justify-between items-center font-semibold">
                    <span>Totale Materiali Stimato:</span>
                    <span>€ {formData.materials_needed.reduce((sum, m) => sum + (m.estimated_cost || 0), 0).toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Icon icon="solar:box-add-bold-duotone" width={48} className="mx-auto mb-4 text-default-400" />
                  <p className="text-default-500">Nessun materiale aggiunto</p>
                  <p className="text-sm text-default-400">I materiali sono opzionali e possono essere aggiunti successivamente</p>
                </div>
              )}
            </CardBody>
          </Card>
        );

      case "review":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Icon icon="solar:eye-bold-duotone" width={20} />
                  Riepilogo Intervento
                </h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-default-700">Cliente</h4>
                      <div className="bg-default-50 p-3 rounded-lg mt-2">
                        <p className="font-medium">{getSelectedCustomer()?.name} {getSelectedCustomer()?.surname}</p>
                        <p className="text-sm text-default-600">{getSelectedCustomer()?.phone}</p>
                        <p className="text-sm text-default-600">{formData.intervention_address}, {formData.intervention_city}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-default-700">Dettagli Intervento</h4>
                      <div className="bg-default-50 p-3 rounded-lg mt-2 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-default-500">Titolo:</span>
                          <span className="text-sm font-medium">{formData.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-default-500">Tipo:</span>
                          <Chip size="sm" color="primary" variant="flat">
                            {typeOptions.find(t => t.key === formData.intervention_type)?.label}
                          </Chip>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-default-500">Priorità:</span>
                          <Chip size="sm" color="warning" variant="flat">
                            {priorityOptions.find(p => p.key === formData.priority)?.label}
                          </Chip>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-default-500">Costo Stimato:</span>
                          <span className="text-sm font-medium">€ {formData.estimated_cost}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-sm text-default-500">Descrizione:</span>
                          <p className="text-sm mt-1">{formData.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-default-700">Assegnazione</h4>
                      <div className="bg-default-50 p-3 rounded-lg mt-2">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar 
                            name={`${technicians.find(t => t.technician_id === formData.assigned_technician_id)?.name} ${technicians.find(t => t.technician_id === formData.assigned_technician_id)?.surname}`}
                            size="sm"
                          />
                          <div>
                            <p className="font-medium">
                              {technicians.find(t => t.technician_id === formData.assigned_technician_id)?.name}{" "}
                              {technicians.find(t => t.technician_id === formData.assigned_technician_id)?.surname}
                            </p>
                            <p className="text-sm text-default-600">
                              {technicians.find(t => t.technician_id === formData.assigned_technician_id)?.skill_level}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-default-500">Data:</span>
                            <p className="font-medium">{formatDate(formData.scheduled_date)}</p>
                          </div>
                          <div>
                            <span className="text-default-500">Orario:</span>
                            <p className="font-medium">{formData.scheduled_start_time} - {formData.scheduled_end_time}</p>
                          </div>
                        </div>
                        {formData.assigned_van_id && (
                          <div className="mt-2">
                            <span className="text-sm text-default-500">Furgone:</span>
                            <p className="text-sm font-medium">
                              {vans.find(v => v.van_id === formData.assigned_van_id)?.name} - 
                              {vans.find(v => v.van_id === formData.assigned_van_id)?.license_plate}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {formData.materials_needed.length > 0 && (
                      <div>
                        <h4 className="font-medium text-default-700">Materiali</h4>
                        <div className="bg-default-50 p-3 rounded-lg mt-2">
                          <div className="space-y-2">
                            {formData.materials_needed.map((material) => (
                              <div key={material.material_id} className="flex justify-between text-sm">
                                <span>{material.material_name}</span>
                                <span>€ {material.estimated_cost}</span>
                              </div>
                            ))}
                            <Divider />
                            <div className="flex justify-between font-medium">
                              <span>Totale:</span>
                              <span>€ {formData.materials_needed.reduce((sum, m) => sum + (m.estimated_cost || 0), 0).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.technician_notes && (
                      <div>
                        <h4 className="font-medium text-default-700">Note per il Tecnico</h4>
                        <div className="bg-warning-50 p-3 rounded-lg mt-2">
                          <p className="text-sm">{formData.technician_notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-background p-6 gap-6">
        <PageHeader
          title="Nuovo Intervento"
          description="Caricamento..."
          icon="solar:add-circle-bold-duotone"
          size="md"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Icon icon="solar:refresh-circle-bold" width={48} className="animate-spin text-primary" />
            <p className="text-default-600">Caricamento dati...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <PageHeader
        title="Nuovo Intervento"
        description="Crea un nuovo intervento seguendo la procedura guidata"
        icon="solar:add-circle-bold-duotone"
      />
      
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <Card className="mb-6">
            <CardBody className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Creazione Intervento</h2>
                <span className="text-sm text-default-500">
                  Passo {steps.findIndex(s => s.key === currentStep) + 1} di {steps.length}
                </span>
              </div>
              
              <Progress value={getStepProgress()} className="w-full mb-4" color="primary" aria-label="Progresso creazione intervento" />
              
              <div className="flex justify-between">
                {steps.map((step, index) => {
                  const isActive = step.key === currentStep;
                  const isCompleted = steps.findIndex(s => s.key === currentStep) > index;
                  
                  return (
                    <div key={step.key} className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-2 ${
                        isActive ? 'bg-primary text-white' :
                        isCompleted ? 'bg-success text-white' :
                        'bg-default-200 text-default-500'
                      }`}>
                        {isCompleted ? (
                          <Icon icon="solar:check-bold" width={16} />
                        ) : (
                          <Icon icon={step.icon} width={16} />
                        )}
                      </div>
                      <span className={`text-xs text-center ${
                        isActive ? 'text-primary font-medium' :
                        isCompleted ? 'text-success' :
                        'text-default-500'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* Step Content */}
          {renderStepContent()}

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              size="lg"
              variant="light"
              onPress={currentStep === "customer" ? () => navigate("/interventions") : handlePrevious}
              startContent={<Icon icon="solar:arrow-left-bold" width={16} />}
            >
              {currentStep === "customer" ? "Annulla" : "Indietro"}
            </Button>
            
            <div className="flex gap-3">
              {currentStep === "review" ? (
                <Button
                  size="lg"
                  color="success"
                  onPress={onOpenConfirmModal}
                  startContent={<Icon icon="solar:check-circle-bold" width={16} />}
                >
                  Crea Intervento
                </Button>
              ) : (
                <Button
                  size="lg"
                  color="primary"
                  onPress={handleNext}
                  isDisabled={!canProceedToNext()}
                  endContent={<Icon icon="solar:arrow-right-bold" width={16} />}
                >
                  Avanti
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal aggiungi materiale */}
      <Modal isOpen={isMaterialModalOpen} onClose={onCloseMaterialModal}>
        <ModalContent>
          <ModalHeader>Aggiungi Materiale</ModalHeader>
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
                label="Quantità"
                value={newMaterial.quantity.toString()}
                onChange={(e) => setNewMaterial(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
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
              label="Costo Stimato (€)"
              placeholder="0.00"
              value={newMaterial.estimated_cost.toString()}
              onChange={(e) => setNewMaterial(prev => ({ ...prev, estimated_cost: parseFloat(e.target.value) || 0 }))}
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

      {/* Modal conferma creazione */}
      <Modal isOpen={isConfirmModalOpen} onClose={onCloseConfirmModal}>
        <ModalContent>
          <ModalHeader>Conferma Creazione Intervento</ModalHeader>
          <ModalBody>
            <div className="space-y-3">
              <p>Sei sicuro di voler creare questo intervento?</p>
              <div className="bg-primary-50 p-3 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Cliente:</span>
                  <span className="font-medium">{getSelectedCustomer()?.name} {getSelectedCustomer()?.surname}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Titolo:</span>
                  <span className="font-medium">{formData.title}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tecnico:</span>
                  <span className="font-medium">
                    {technicians.find(t => t.technician_id === formData.assigned_technician_id)?.name}{" "}
                    {technicians.find(t => t.technician_id === formData.assigned_technician_id)?.surname}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Data:</span>
                  <span className="font-medium">{formatDate(formData.scheduled_date)} - {formData.scheduled_start_time}</span>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onCloseConfirmModal}>
              Annulla
            </Button>
            <Button 
              color="success" 
              onPress={handleSubmit}
              isLoading={saving}
              startContent={!saving ? <Icon icon="solar:check-circle-bold" width={16} /> : null}
            >
              {saving ? "Creazione..." : "Crea Intervento"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
} 