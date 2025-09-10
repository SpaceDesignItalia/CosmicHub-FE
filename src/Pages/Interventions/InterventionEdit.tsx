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
  DatePicker,
  Divider,
  Chip,
  Switch,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Autocomplete,
  AutocompleteItem,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { parseDate } from "@internationalized/date";
import type { Intervention, InterventionFormData, MaterialNeeded } from "../../types/Intervention";
import type { Customer } from "../../types/Customer";
import type { Technician } from "../../types/Technician";
import PageHeader from "../../Components/Layout/PageHeader";

const priorityOptions = [
  { key: "low", label: "Bassa", color: "success" },
  { key: "medium", label: "Media", color: "warning" },
  { key: "high", label: "Alta", color: "danger" },
  { key: "emergency", label: "Emergenza", color: "danger" },
];

const typeOptions = [
  { key: "inspection", label: "Ispezione", color: "primary" },
  { key: "repair", label: "Riparazione", color: "warning" },
  { key: "maintenance", label: "Manutenzione", color: "secondary" },
  { key: "installation", label: "Installazione", color: "success" },
  { key: "emergency", label: "Emergenza", color: "danger" },
];

const statusOptions = [
  { key: "assigned", label: "Assegnato", color: "default" },
  { key: "accepted", label: "Accettato", color: "primary" },
  { key: "in_progress", label: "In Corso", color: "warning" },
  { key: "paused", label: "In Pausa", color: "secondary" },
  { key: "completed", label: "Completato", color: "success" },
  { key: "cancelled", label: "Annullato", color: "danger" },
];

export default function InterventionEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isOpen: isMaterialModalOpen, onOpen: onOpenMaterialModal, onClose: onCloseMaterialModal } = useDisclosure();
  const { isOpen: isDiscardModalOpen, onOpen: onOpenDiscardModal, onClose: onCloseDiscardModal } = useDisclosure();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [vans, setVans] = useState<any[]>([]);
  
  // Form data
  const [formData, setFormData] = useState<InterventionFormData>({
    appointment_id: "",
    customer_id: "",
    assigned_technician_id: "",
    assigned_van_id: "",
    title: "",
    description: "",
    intervention_type: "repair",
    priority: "medium",
    scheduled_date: new Date(),
    scheduled_start_time: "",
    scheduled_end_time: "",
    intervention_address: "",
    intervention_city: "",
    estimated_cost: 0,
    materials_needed: [],
    technician_notes: "",
  });

  // Material form
  const [newMaterial, setNewMaterial] = useState<MaterialNeeded>({
    material_id: "",
    material_name: "",
    quantity: 1,
    unit: "pz",
    estimated_cost: 0,
  });

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const loadData = async () => {
    if (!id) return;

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
        { van_id: "VAN-001", name: "Furgone 1", license_plate: "AB123CD" },
        { van_id: "VAN-002", name: "Furgone 2", license_plate: "EF456GH" },
      ];

      // Carica i dati dell'intervento esistente
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
        materials_needed: [
          {
            material_id: "MAT-001",
            material_name: "Guarnizione O-Ring 25mm",
            quantity: 2,
            unit: "pz",
            estimated_cost: 15,
          },
        ],
        technician_notes: "Portare strumenti per idraulica",
        created_at: new Date(),
        updated_at: new Date(),
        created_by: "operator1",
      };

      setCustomers(mockCustomers);
      setTechnicians(mockTechnicians);
      setVans(mockVans);

      // Popola il form con i dati esistenti
      setFormData({
        appointment_id: mockIntervention.appointment_id,
        customer_id: mockIntervention.customer_id,
        assigned_technician_id: mockIntervention.assigned_technician_id,
        assigned_van_id: mockIntervention.assigned_van_id || "",
        title: mockIntervention.title,
        description: mockIntervention.description,
        intervention_type: mockIntervention.intervention_type,
        priority: mockIntervention.priority,
        scheduled_date: mockIntervention.scheduled_date,
        scheduled_start_time: mockIntervention.scheduled_start_time,
        scheduled_end_time: mockIntervention.scheduled_end_time,
        intervention_address: mockIntervention.intervention_address,
        intervention_city: mockIntervention.intervention_city,
        estimated_cost: mockIntervention.estimated_cost || 0,
        materials_needed: mockIntervention.materials_needed || [],
        technician_notes: mockIntervention.technician_notes || "",
      });
    } catch (error) {
      console.error("Errore nel caricamento dei dati:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof InterventionFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
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
      setHasUnsavedChanges(true);
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

    setHasUnsavedChanges(true);
    onCloseMaterialModal();
  };

  const removeMaterial = (materialId: string) => {
    setFormData(prev => ({
      ...prev,
      materials_needed: prev.materials_needed.filter(m => m.material_id !== materialId),
    }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validazione base
      if (!formData.title.trim() || !formData.customer_id || !formData.assigned_technician_id) {
        alert("Compila tutti i campi obbligatori");
        return;
      }

      // Simula chiamata API
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Salvataggio intervento:", formData);

      setHasUnsavedChanges(false);
      navigate(`/interventions/${id}`);
    } catch (error) {
      console.error("Errore nel salvataggio:", error);
      alert("Errore nel salvataggio. Riprova.");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setHasUnsavedChanges(false);
    navigate(`/interventions/${id}`);
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-background p-6 gap-6">
        <PageHeader
          title="Modifica Intervento"
          description="Caricamento..."
          icon="solar:pen-bold-duotone"
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

  return (
    <div className="flex flex-col h-screen">
      <PageHeader
        title="Modifica Intervento"
        description="Modifica i dettagli dell'intervento"
        icon="solar:pen-bold-duotone"
        actions={
          <div className="flex gap-2">
            <Button
              variant="light"
              onPress={hasUnsavedChanges ? onOpenDiscardModal : () => navigate(`/interventions/${id}`)}
            >
              Annulla
            </Button>
            <Button
              color="primary"
              onPress={handleSave}
              isLoading={saving}
              startContent={<Icon icon="solar:diskette-bold" width={16} />}
            >
              Salva Modifiche
            </Button>
          </div>
        }
      />
      
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <form className="space-y-6">
            {/* Informazioni Base */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Informazioni Base</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Titolo Intervento"
                    placeholder="Inserisci il titolo dell'intervento"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    isRequired
                  />
                  <Select
                    label="Tipo Intervento"
                    selectedKeys={formData.intervention_type ? [formData.intervention_type] : []}
                    onSelectionChange={(keys) => handleInputChange('intervention_type', Array.from(keys)[0])}
                    isRequired
                  >
                    {typeOptions.map((type) => (
                      <SelectItem key={type.key} value={type.key}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <Textarea
                  label="Descrizione"
                  placeholder="Descrivi dettagliatamente l'intervento da effettuare"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  minRows={3}
                  isRequired
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Priorità"
                    selectedKeys={formData.priority ? [formData.priority] : []}
                    onSelectionChange={(keys) => handleInputChange('priority', Array.from(keys)[0])}
                    isRequired
                  >
                    {priorityOptions.map((priority) => (
                      <SelectItem key={priority.key} value={priority.key}>
                        <Chip size="sm" color={priority.color as any} variant="flat">
                          {priority.label}
                        </Chip>
                      </SelectItem>
                    ))}
                  </Select>
                  <Input
                    type="number"
                    label="Costo Stimato (€)"
                    placeholder="0.00"
                    value={formData.estimated_cost.toString()}
                    onChange={(e) => handleInputChange('estimated_cost', parseFloat(e.target.value) || 0)}
                    startContent={<span className="text-default-400">€</span>}
                  />
                </div>
              </CardBody>
            </Card>

            {/* Cliente e Indirizzo */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Cliente e Indirizzo</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <Select
                  label="Cliente"
                  selectedKeys={formData.customer_id ? [formData.customer_id] : []}
                  onSelectionChange={(keys) => handleCustomerSelect(Array.from(keys)[0] as string)}
                  isRequired
                >
                  {customers.map((customer) => (
                    <SelectItem key={customer.customer_id} value={customer.customer_id}>
                      {customer.name} {customer.surname} - {customer.phone}
                    </SelectItem>
                  ))}
                </Select>

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
              </CardBody>
            </Card>

            {/* Assegnazione e Programmazione */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Assegnazione e Programmazione</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Tecnico Assegnato"
                    selectedKeys={formData.assigned_technician_id ? [formData.assigned_technician_id] : []}
                    onSelectionChange={(keys) => handleInputChange('assigned_technician_id', Array.from(keys)[0])}
                    isRequired
                  >
                    {technicians.map((technician) => (
                      <SelectItem key={technician.technician_id} value={technician.technician_id}>
                        <div className="flex justify-between items-center w-full">
                          <span>{technician.name} {technician.surname}</span>
                          <div className="flex gap-1">
                            {technician.specializations.map((spec) => (
                              <Chip key={spec} size="sm" variant="flat">
                                {spec}
                              </Chip>
                            ))}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                  <Select
                    label="Furgone (Opzionale)"
                    selectedKeys={formData.assigned_van_id ? [formData.assigned_van_id] : []}
                    onSelectionChange={(keys) => handleInputChange('assigned_van_id', Array.from(keys)[0])}
                  >
                    {vans.map((van) => (
                      <SelectItem key={van.van_id} value={van.van_id}>
                        {van.name} - {van.license_plate}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

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

            {/* Materiali Necessari */}
            <Card>
              <CardHeader className="flex justify-between">
                <h3 className="text-lg font-semibold">Materiali Necessari</h3>
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
                  <p className="text-default-500 text-center py-4">Nessun materiale aggiunto</p>
                )}
              </CardBody>
            </Card>

            {/* Note */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Note per il Tecnico</h3>
              </CardHeader>
              <CardBody>
                <Textarea
                  placeholder="Inserisci note aggiuntive per il tecnico (strumenti necessari, accessi speciali, ecc.)"
                  value={formData.technician_notes}
                  onChange={(e) => handleInputChange('technician_notes', e.target.value)}
                  minRows={3}
                />
              </CardBody>
            </Card>
          </form>
        </div>
      </div>

      {/* Modal per aggiungere materiale */}
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

      {/* Modal conferma scarto modifiche */}
      <Modal isOpen={isDiscardModalOpen} onClose={onCloseDiscardModal}>
        <ModalContent>
          <ModalHeader>Scarta Modifiche</ModalHeader>
          <ModalBody>
            <p>Hai modifiche non salvate. Sei sicuro di voler scartare le modifiche?</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onCloseDiscardModal}>
              Continua Modifica
            </Button>
            <Button color="danger" onPress={handleDiscard}>
              Scarta Modifiche
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
} 