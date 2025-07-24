import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
  Switch,
  Badge,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import PageHeader from "../../Components/Layout/PageHeader";

interface NewEventFormData {
  title: string;
  description: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  event_type: "appointment" | "intervention" | "inspection" | "maintenance" | "consultation";
  priority: "low" | "medium" | "high" | "emergency";
  estimated_duration: number;
  assigned_technician: string;
  location: string;
  notes: string;
  customer_type: "private" | "business";
  contact_method: "phone" | "email" | "whatsapp" | "sms";
  send_reminder: boolean;
  from_external: boolean;
}

const eventTypeOptions = [
  { key: "appointment", label: "Appuntamento", icon: "solar:calendar-bold", color: "primary", duration: 60 },
  { key: "intervention", label: "Intervento", icon: "solar:settings-bold", color: "warning", duration: 120 },
  { key: "inspection", label: "Ispezione", icon: "solar:eye-bold", color: "secondary", duration: 90 },
  { key: "maintenance", label: "Manutenzione", icon: "solar:hammer-bold", color: "success", duration: 180 },
  { key: "consultation", label: "Consulenza", icon: "solar:chat-round-dots-bold", color: "default", duration: 45 },
];

const priorityOptions = [
  { key: "low", label: "Bassa", color: "success" },
  { key: "medium", label: "Media", color: "warning" },
  { key: "high", label: "Alta", color: "danger" },
  { key: "emergency", label: "Emergenza", color: "danger" },
];

export default function NewEvent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<NewEventFormData>({
    title: "",
    description: "",
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    customer_address: "",
    event_type: "appointment",
    priority: "medium",
    estimated_duration: 60,
    assigned_technician: "",
    location: "",
    notes: "",
    customer_type: "private",
    contact_method: "phone",
    send_reminder: true,
    from_external: false,
  });

  // Popola form con parametri URL
  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());
    
    if (Object.keys(params).length > 0) {
      const eventType = eventTypeOptions.find(t => t.key === params.intervention_type);
      
      setFormData(prev => ({
        ...prev,
        customer_name: params.customer_name || prev.customer_name,
        customer_phone: params.customer_phone || prev.customer_phone,
        customer_email: params.customer_email || prev.customer_email,
        customer_address: params.customer_address || prev.customer_address,
        description: params.problem_description || prev.description,
        event_type: (params.intervention_type as any) || prev.event_type,
        priority: (params.urgency_level as any) || prev.priority,
        estimated_duration: parseInt(params.estimated_duration) || eventType?.duration || prev.estimated_duration,
        notes: params.notes || prev.notes,
        location: params.location || params.customer_address || prev.location,
        assigned_technician: params.assigned_technician || params.preferred_technician || prev.assigned_technician,
        contact_method: (params.preferred_contact_method as any) || prev.contact_method,
        customer_type: (params.customer_type as any) || prev.customer_type,
        from_external: params.from_ccc === "true" || params.from_external === "true",
        title: params.customer_name ? `${getEventTypeLabel(params.intervention_type || "appointment")} - ${params.customer_name}` : prev.title,
      }));
    }
  }, [searchParams]);

  const handleInputChange = (field: keyof NewEventFormData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-aggiorna durata in base al tipo evento
      if (field === 'event_type') {
        const eventType = eventTypeOptions.find(t => t.key === value);
        if (eventType) {
          newData.estimated_duration = eventType.duration;
        }
      }
      
      // Auto-genera titolo se non è impostato manualmente
      if (field === 'customer_name' || field === 'event_type') {
        if (!prev.title || prev.title === `${getEventTypeLabel(prev.event_type)} - ${prev.customer_name}`) {
          newData.title = `${getEventTypeLabel(newData.event_type)} - ${newData.customer_name}`;
        }
      }
      
      return newData;
    });
  };

  const getEventTypeLabel = (type: string) => {
    const option = eventTypeOptions.find(opt => opt.key === type);
    return option?.label || "Evento";
  };

  const validateForm = () => {
    return (
      formData.title.trim() &&
      formData.customer_name.trim() &&
      formData.customer_phone.trim() &&
      formData.description.trim()
    );
  };

  const handleContinueToCalendar = () => {
    if (!validateForm()) {
      alert("Completa tutti i campi obbligatori prima di continuare");
      return;
    }

    // Prepara i parametri per passare al calendario
    const calendarParams = new URLSearchParams({
      // Dati dell'evento
      title: formData.title,
      description: formData.description,
      event_type: formData.event_type,
      priority: formData.priority,
      estimated_duration: formData.estimated_duration.toString(),
      
      // Dati cliente
      customer_name: formData.customer_name,
      customer_phone: formData.customer_phone,
      customer_email: formData.customer_email || "",
      customer_address: formData.customer_address,
      customer_type: formData.customer_type,
      
      // Dettagli intervento
      assigned_technician: formData.assigned_technician || "",
      location: formData.location || formData.customer_address,
      notes: formData.notes || "",
      contact_method: formData.contact_method,
      send_reminder: formData.send_reminder.toString(),
      from_external: formData.from_external.toString(),
      
      // Flag per indicare che si sta creando un nuovo evento
      creating_event: "true"
    });

    // Naviga al calendario con tutti i dati
    navigate(`/calendar?${calendarParams.toString()}`);
  };

  return (
    <div className="flex flex-col h-screen">
      <PageHeader
        title="Prepara Appuntamento"
        description="Inserisci tutte le informazioni per il nuovo appuntamento"
        icon="solar:calendar-add-bold-duotone"
      />
      
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">

          {formData.from_external && (
            <Card className="border-l-4 border-l-primary">
              <CardBody className="p-4">
                <div className="flex items-center gap-2 text-primary-800">
                  <Icon icon="solar:phone-bold" width={20} />
                  <span className="font-medium">Richiesta da Centro Contatti Cliente</span>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Informazioni Evento */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="solar:calendar-bold-duotone" width={20} />
                Informazioni Evento
              </h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                label="Titolo Evento"
                placeholder="Es: Riparazione caldaia - Mario Rossi"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                isRequired
              />

              <Textarea
                label="Descrizione"
                placeholder="Descrivi l'evento o il problema da risolvere"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                minRows={3}
                isRequired
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Tipo Evento</label>
                  <div className="grid grid-cols-1 gap-2">
                    {eventTypeOptions.map((type) => (
                      <div
                        key={type.key}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.event_type === type.key
                            ? 'border-primary-300 bg-primary-50'
                            : 'border-default-200 hover:border-default-300'
                        }`}
                        onClick={() => handleInputChange('event_type', type.key)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Icon icon={type.icon} width={20} className={`text-${type.color}`} />
                            <span className="font-medium">{type.label}</span>
                          </div>
                          <Badge size="sm" color={type.color as any} variant="flat">
                            {type.duration} min
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Priorità</label>
                  <div className="grid grid-cols-1 gap-2">
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
                          <span className="font-medium">{priority.label}</span>
                          <Chip size="sm" color={priority.color as any} variant="flat">
                            {priority.label}
                          </Chip>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Informazioni Cliente */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="solar:user-bold-duotone" width={20} />
                Informazioni Cliente
              </h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nome Cliente"
                  placeholder="Nome e cognome del cliente"
                  value={formData.customer_name}
                  onChange={(e) => handleInputChange('customer_name', e.target.value)}
                  isRequired
                />
                <Input
                  label="Telefono"
                  placeholder="+39 123 456 7890"
                  value={formData.customer_phone}
                  onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                  isRequired
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Email"
                  placeholder="cliente@email.com"
                  value={formData.customer_email}
                  onChange={(e) => handleInputChange('customer_email', e.target.value)}
                />
                <Select
                  label="Tipo Cliente"
                  selectedKeys={formData.customer_type ? [formData.customer_type] : []}
                  onSelectionChange={(keys) => handleInputChange('customer_type', Array.from(keys)[0])}
                >
                  <SelectItem key="private">Privato</SelectItem>
                  <SelectItem key="business">Azienda</SelectItem>
                </Select>
              </div>

              <Input
                label="Indirizzo Cliente"
                placeholder="Via, numero civico, città"
                value={formData.customer_address}
                onChange={(e) => handleInputChange('customer_address', e.target.value)}
              />
            </CardBody>
          </Card>

          {/* Dettagli Intervento */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Icon icon="solar:settings-bold-duotone" width={20} />
                Dettagli Intervento
              </h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="number"
                  label="Durata Stimata (minuti)"
                  value={formData.estimated_duration.toString()}
                  onChange={(e) => handleInputChange('estimated_duration', parseInt(e.target.value) || 60)}
                  min="15"
                  step="15"
                  description={`Durata suggerita per ${getEventTypeLabel(formData.event_type)}: ${eventTypeOptions.find(t => t.key === formData.event_type)?.duration || 60} minuti`}
                />
                <Input
                  label="Luogo Intervento"
                  placeholder="Indirizzo specifico dell'intervento"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Tecnico Assegnato"
                  placeholder="Nome del tecnico (opzionale)"
                  value={formData.assigned_technician}
                  onChange={(e) => handleInputChange('assigned_technician', e.target.value)}
                />
                <Select
                  label="Metodo di Contatto"
                  selectedKeys={formData.contact_method ? [formData.contact_method] : []}
                  onSelectionChange={(keys) => handleInputChange('contact_method', Array.from(keys)[0])}
                >
                  <SelectItem key="phone">Telefono</SelectItem>
                  <SelectItem key="email">Email</SelectItem>
                  <SelectItem key="whatsapp">WhatsApp</SelectItem>
                  <SelectItem key="sms">SMS</SelectItem>
                </Select>
              </div>

              <Textarea
                label="Note Aggiuntive"
                placeholder="Note aggiuntive, istruzioni speciali o dettagli importanti"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                minRows={3}
              />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Invia Reminder al Cliente</span>
                <Switch
                  isSelected={formData.send_reminder}
                  onValueChange={(value) => handleInputChange('send_reminder', value)}
                />
              </div>
            </CardBody>
          </Card>

          {/* Riepilogo e Pulsanti */}
          <Card className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200">
            <CardBody className="p-6">
              <h4 className="font-semibold text-primary-800 mb-3">Pronto per il prossimo passo?</h4>
              <p className="text-sm text-primary-700 mb-4">
                Dopo aver completato le informazioni, verrai portato al calendario dove potrai vedere tutti gli appuntamenti 
                esistenti e scegliere il giorno e l'ora migliori per questo {getEventTypeLabel(formData.event_type).toLowerCase()}.
              </p>
              
              <div className="flex justify-between items-center">
                <Button
                  size="lg"
                  variant="light"
                  onPress={() => navigate("/calendar")}
                >
                  Annulla
                </Button>
                <Button
                  size="lg"
                  color="primary"
                  onPress={handleContinueToCalendar}
                  isDisabled={!validateForm()}
                  endContent={<Icon icon="solar:calendar-bold" width={20} />}
                >
                  Continua al Calendario →
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
} 