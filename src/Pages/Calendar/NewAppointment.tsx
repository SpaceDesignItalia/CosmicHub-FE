import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  SelectItem,
  Textarea,
  Spacer,
  Switch,
  Autocomplete,
  AutocompleteItem,
  DatePicker,
  TimeInput,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { AppointmentFormData } from "../../types/Appointment";
import type { Customer } from "../../types/Customer";
import type { Call } from "../../types/Call";
import PageHeader from "../../Components/Layout/PageHeader";
import { parseDate, Time } from "@internationalized/date";

const initialFormData: AppointmentFormData = {
  customer_id: "",
  call_id: "",
  title: "",
  description: "",
  appointment_date: new Date(),
  start_time: "09:00",
  end_time: "10:00",
  location: "",
  appointment_type: "inspection",
  priority: "medium",
  estimated_duration: 60,
  notes: "",
  send_reminder: true,
};

export default function NewAppointment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState<AppointmentFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);

  // Mock data
  useEffect(() => {
    const mockCustomers: Customer[] = [
      {
        customer_id: "1",
        name: "Mario",
        surname: "Rossi",
        email: "mario.rossi@email.com",
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
    ];

    const mockCalls: Call[] = [
      {
        call_id: "1",
        customer_id: "1",
        caller_name: "Mario Rossi",
        caller_phone: "+39 333 1234567",
        call_date: new Date(),
        call_time: "09:30",
        problem_description: "Perdita d'acqua dal rubinetto della cucina",
        urgency_level: "medium",
        call_source: "phone",
        status: "pending",
        created_by: "operator1",
        is_new_customer: false,
      },
    ];

    setCustomers(mockCustomers);
    setCalls(mockCalls);

    // Pre-compilazione da parametri URL
    const callId = searchParams.get("call_id");
    const customerId = searchParams.get("customer_id");

    if (callId) {
      const call = mockCalls.find(c => c.call_id === callId);
      if (call) {
        setSelectedCall(call);
        const customer = mockCustomers.find(c => c.customer_id === call.customer_id);
        if (customer) {
          setSelectedCustomer(customer);
          setFormData(prev => ({
            ...prev,
            call_id: callId,
            customer_id: call.customer_id!,
            title: `Intervento: ${call.problem_description}`,
            description: call.problem_description,
            location: customer.address + ", " + customer.city,
            priority: call.urgency_level,
          }));
        }
      }
    } else if (customerId) {
      const customer = mockCustomers.find(c => c.customer_id === customerId);
      if (customer) {
        setSelectedCustomer(customer);
        setFormData(prev => ({
          ...prev,
          customer_id: customerId,
          location: customer.address + ", " + customer.city,
        }));
      }
    }
  }, [searchParams]);

  const handleInputChange = (field: keyof AppointmentFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const handleCustomerSelection = (customerId: string) => {
    const customer = customers.find(c => c.customer_id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      setFormData({
        ...formData,
        customer_id: customerId,
        location: customer.address + ", " + customer.city,
      });
    }
  };

  const handleCallSelection = (callId: string) => {
    const call = calls.find(c => c.call_id === callId);
    if (call) {
      setSelectedCall(call);
      setFormData({
        ...formData,
        call_id: callId,
        title: `Intervento: ${call.problem_description}`,
        description: call.problem_description,
        priority: call.urgency_level,
      });
    }
  };

  const calculateEndTime = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + duration * 60000);
    return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleStartTimeChange = (time: Time | null) => {
    if (!time) return;
    const timeString = `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`;
    const endTime = calculateEndTime(timeString, formData.estimated_duration);
    setFormData({
      ...formData,
      start_time: timeString,
      end_time: endTime,
    });
  };

  const handleDurationChange = (duration: number) => {
    const endTime = calculateEndTime(formData.start_time, duration);
    setFormData({
      ...formData,
      estimated_duration: duration,
      end_time: endTime,
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer_id) {
      newErrors.customer_id = "Seleziona un cliente";
    }

    if (!formData.title.trim()) {
      newErrors.title = "Il titolo è obbligatorio";
    }

    if (!formData.description.trim()) {
      newErrors.description = "La descrizione è obbligatoria";
    }

    if (!formData.location.trim()) {
      newErrors.location = "La location è obbligatoria";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Qui implementare la chiamata API per salvare l'appuntamento
      console.log("Saving appointment:", formData);
      
      // Simulazione API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect al calendario
      navigate("/calendar");
    } catch (error) {
      console.error("Errore nel salvataggio dell'appuntamento:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/calendar");
  };

  return (
    <div className="flex flex-col h-screen">
      <PageHeader
        title="Nuovo Appuntamento"
        description="Programma un nuovo appuntamento con il cliente"
        icon="solar:calendar-add-bold-duotone"
      />
      
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informazioni Cliente e Chiamata */}
              <Card>
                <CardHeader className="flex gap-3">
                  <Icon icon="solar:user-bold-duotone" width={24} />
                  <div className="flex flex-col">
                    <p className="text-md">Cliente e Chiamata</p>
                    <p className="text-small text-default-500">
                      Seleziona cliente e chiamata associata
                    </p>
                  </div>
                </CardHeader>
                <CardBody className="gap-4">
                  <Autocomplete
                    label="Cliente *"
                    placeholder="Cerca cliente..."
                    selectedKey={selectedCustomer?.customer_id}
                    onSelectionChange={(key) => handleCustomerSelection(key as string)}
                    isInvalid={!!errors.customer_id}
                    errorMessage={errors.customer_id}
                    startContent={<Icon icon="solar:user-bold" width={16} />}
                  >
                    {customers.map((customer) => (
                      <AutocompleteItem
                        key={customer.customer_id}
                        textValue={`${customer.name} ${customer.surname}`}
                      >
                        <div className="flex flex-col">
                          <span>{`${customer.name} ${customer.surname}`}</span>
                          <span className="text-small text-default-400">
                            {customer.phone} - {customer.city}
                          </span>
                        </div>
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>

                  <Autocomplete
                    label="Chiamata Associata"
                    placeholder="Seleziona chiamata (opzionale)..."
                    selectedKey={selectedCall?.call_id}
                    onSelectionChange={(key) => handleCallSelection(key as string)}
                    startContent={<Icon icon="solar:phone-bold" width={16} />}
                  >
                    {calls.filter(call => call.customer_id === formData.customer_id).map((call) => (
                      <AutocompleteItem
                        key={call.call_id}
                        textValue={call.problem_description}
                      >
                        <div className="flex flex-col">
                          <span className="truncate">{call.problem_description}</span>
                          <span className="text-small text-default-400">
                            {new Date(call.call_date).toLocaleDateString('it-IT')} - {call.call_time}
                          </span>
                        </div>
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>

                  {selectedCustomer && (
                    <div className="p-3 rounded-lg bg-default-50">
                      <p className="text-small font-medium">Informazioni Cliente:</p>
                      <p className="text-small text-default-600">
                        {selectedCustomer.phone}
                      </p>
                      <p className="text-small text-default-600">
                        {selectedCustomer.address}, {selectedCustomer.city}
                      </p>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Dettagli Appuntamento */}
              <Card>
                <CardHeader className="flex gap-3">
                  <Icon icon="solar:calendar-mark-bold-duotone" width={24} />
                  <div className="flex flex-col">
                    <p className="text-md">Dettagli Appuntamento</p>
                    <p className="text-small text-default-500">
                      Informazioni sull'appuntamento
                    </p>
                  </div>
                </CardHeader>
                <CardBody className="gap-4">
                  <Input
                    label="Titolo *"
                    placeholder="Inserisci il titolo dell'appuntamento"
                    value={formData.title}
                    onValueChange={(value) => handleInputChange("title", value)}
                    isInvalid={!!errors.title}
                    errorMessage={errors.title}
                    startContent={<Icon icon="solar:text-bold" width={16} />}
                  />

                  <Textarea
                    label="Descrizione *"
                    placeholder="Descrivi il lavoro da svolgere..."
                    value={formData.description}
                    onValueChange={(value) => handleInputChange("description", value)}
                    isInvalid={!!errors.description}
                    errorMessage={errors.description}
                    minRows={3}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Tipo Appuntamento"
                      selectedKeys={[formData.appointment_type]}
                      onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0] as string;
                        handleInputChange("appointment_type", value);
                      }}
                      startContent={<Icon icon="solar:settings-bold" width={16} />}
                    >
                      <SelectItem key="inspection">Ispezione</SelectItem>
                      <SelectItem key="repair">Riparazione</SelectItem>
                      <SelectItem key="maintenance">Manutenzione</SelectItem>
                      <SelectItem key="installation">Installazione</SelectItem>
                      <SelectItem key="consultation">Consulenza</SelectItem>
                    </Select>

                    <Select
                      label="Priorità"
                      selectedKeys={[formData.priority]}
                      onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0] as string;
                        handleInputChange("priority", value);
                      }}
                      startContent={<Icon icon="solar:danger-triangle-bold" width={16} />}
                    >
                      <SelectItem key="low">Bassa</SelectItem>
                      <SelectItem key="medium">Media</SelectItem>
                      <SelectItem key="high">Alta</SelectItem>
                      <SelectItem key="emergency">Emergenza</SelectItem>
                    </Select>
                  </div>

                  <Input
                    label="Location *"
                    placeholder="Indirizzo dell'appuntamento"
                    value={formData.location}
                    onValueChange={(value) => handleInputChange("location", value)}
                    isInvalid={!!errors.location}
                    errorMessage={errors.location}
                    startContent={<Icon icon="solar:map-point-bold" width={16} />}
                  />
                </CardBody>
              </Card>
            </div>

            <Spacer y={6} />

            {/* Data e Orario */}
            <Card>
              <CardHeader className="flex gap-3">
                <Icon icon="solar:clock-circle-bold-duotone" width={24} />
                <div className="flex flex-col">
                  <p className="text-md">Data e Orario</p>
                  <p className="text-small text-default-500">
                    Programma data e ora dell'appuntamento
                  </p>
                </div>
              </CardHeader>
              <CardBody className="gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <DatePicker
                    label="Data Appuntamento"
                    value={parseDate(formData.appointment_date.toISOString().split('T')[0])}
                    onChange={(date) => {
                      if (date) {
                        handleInputChange("appointment_date", new Date(date.year, date.month - 1, date.day));
                      }
                    }}
                    minValue={parseDate(new Date().toISOString().split('T')[0])}
                  />

                  <TimeInput
                    label="Ora Inizio"
                    value={new Time(
                      parseInt(formData.start_time.split(':')[0]),
                      parseInt(formData.start_time.split(':')[1])
                    )}
                    onChange={handleStartTimeChange}
                  />

                  <Input
                    label="Durata (minuti)"
                    type="number"
                    value={formData.estimated_duration.toString()}
                    onValueChange={(value) => handleDurationChange(parseInt(value) || 60)}
                    min={15}
                    max={480}
                    step={15}
                    startContent={<Icon icon="solar:timer-bold" width={16} />}
                  />
                </div>

                <div className="p-3 rounded-lg bg-default-50">
                  <p className="text-small">
                    <strong>Orario:</strong> {formData.start_time} - {formData.end_time}
                  </p>
                  <p className="text-small text-default-600">
                    Durata: {formData.estimated_duration} minuti
                  </p>
                </div>

                <Textarea
                  label="Note"
                  placeholder="Note aggiuntive per l'appuntamento..."
                  value={formData.notes || ""}
                  onValueChange={(value) => handleInputChange("notes", value)}
                  minRows={2}
                />

                <div className="flex items-center gap-2">
                  <Switch
                    isSelected={formData.send_reminder}
                    onValueChange={(checked) => handleInputChange("send_reminder", checked)}
                  />
                  <span className="text-small">Invia promemoria al cliente</span>
                </div>
              </CardBody>
            </Card>

            <Spacer y={6} />

            {/* Azioni */}
            <Card>
              <CardBody>
                <div className="flex gap-3 justify-end">
                  <Button
                    color="default"
                    variant="light"
                    onPress={handleCancel}
                    startContent={<Icon icon="solar:close-circle-bold" width={16} />}
                  >
                    Annulla
                  </Button>
                  <Button
                    color="primary"
                    type="submit"
                    isLoading={loading}
                    startContent={
                      !loading && <Icon icon="solar:check-circle-bold" width={16} />
                    }
                  >
                    {loading ? "Salvataggio..." : "Crea Appuntamento"}
                  </Button>
                </div>
              </CardBody>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
} 