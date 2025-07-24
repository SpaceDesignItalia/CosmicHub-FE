import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Input,
  Select,
  SelectItem,
  Tab,
  Tabs,
  Textarea,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../Components/Layout/PageHeader";
import type {
  Customer,
  InterventionSummary,
  PaymentSummary,
  QuickBookingData,
} from "../../types/Customer";
import type { Technician } from "../../types/Technician";
import axios from "axios";

const statusColorMap = {
  active: "success",
  inactive: "danger",
} as const;

const customerTypeColorMap = {
  private: "primary",
  business: "warning",
} as const;

const urgencyColorMap = {
  low: "default",
  medium: "warning",
  high: "danger",
  emergency: "danger",
} as const;

export default function CustomerDetail() {
  const navigate = useNavigate();
  const { customerId } = useParams<{ customerId: string }>();

  // State
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("overview");

  // Enhanced booking state
  const [quickBookingData, setQuickBookingData] = useState<QuickBookingData>({
    customer_id: "",
    problem_description: "",
    urgency_level: "medium",
    intervention_type: "inspection",
    estimated_duration: 60,
    preferred_date: new Date(),
    preferred_time: "09:00",
    notes: "",
    location: "",
  });

  const [selectedTechnician, setSelectedTechnician] = useState<string>("");

  // Mock data
  const mockInterventions: InterventionSummary[] = [
    {
      intervention_id: "1",
      date: new Date("2024-01-15"),
      problem_description: "Riparazione impianto elettrico",
      status: "completed",
      cost: 180.0,
      technician_name: "Marco Rossi",
    },
    {
      intervention_id: "2",
      date: new Date("2024-02-20"),
      problem_description: "Manutenzione caldaia",
      status: "completed",
      cost: 120.0,
      technician_name: "Laura Bianchi",
    },
  ];

  const mockPayments: PaymentSummary[] = [
    {
      payment_id: "1",
      date: new Date("2024-01-16"),
      amount: 180.0,
      method: "card",
      invoice_number: "INV-2024-001",
    },
    {
      payment_id: "2",
      date: new Date("2024-02-21"),
      amount: 120.0,
      method: "bank_transfer",
      invoice_number: "INV-2024-002",
    },
  ];

  // Load data
  useEffect(() => {
    loadCustomerData();
  }, [customerId]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      
      // Mock data for customers and technicians
      const mockCustomers: Customer[] = [
        {
          customer_id: "1",
          name: "Mario",
          surname: "Rossi",
          email: "mario.rossi@email.com",
          phone: "+39 331 123 4567",
          address: "Via Roma 123",
          city: "Milano",
          zip_code: "20121",
          customer_type: "private",
          status: "active",
          created_at: "2023-01-15T00:00:00.000Z",
          last_intervention_date: "2024-02-20T00:00:00.000Z",
          preferred_contact_method: "phone",
          notes: "Cliente molto puntuale, preferisce appuntamenti mattutini",
          vat_number: null,
          referred_by: null,
        },
        {
          customer_id: "2",
          name: "Anna",
          surname: "Verdi",
          email: "anna.verdi@email.com",
          phone: "+39 334 567 8901",
          address: "Corso Italia 45",
          city: "Roma",
          zip_code: "00184",
          customer_type: "business",
          status: "active",
          created_at: "2023-03-20T00:00:00.000Z",
          last_intervention_date: "2024-01-10T00:00:00.000Z",
          preferred_contact_method: "email",
          notes: null,
          vat_number: "IT12345678901",
          referred_by: "1",
        },
      ];

      const mockTechnicians: Technician[] = [
        {
          technician_id: "1",
          name: "Marco Rossi",
          email: "marco.rossi@company.com",
          phone: "+39 345 123 4567",
          specializations: ["Elettrico", "Idraulico"],
          status: "active",
        },
        {
          technician_id: "2",
          name: "Laura Bianchi",
          email: "laura.bianchi@company.com",
          phone: "+39 345 234 5678",
          specializations: ["Riscaldamento", "Climatizzazione"],
          status: "active",
        },
      ];

      setCustomers(mockCustomers);
      setTechnicians(mockTechnicians);
      
      // Find specific customer
      const foundCustomer = mockCustomers.find(c => c.customer_id === customerId);
      if (foundCustomer) {
        setCustomer(foundCustomer);
        setQuickBookingData(prev => ({
          ...prev,
          customer_id: foundCustomer.customer_id,
        }));
      }
    } catch (error) {
      console.error("Errore nel caricamento dati cliente:", error);
    } finally {
      setLoading(false);
    }
  };

  // Navigation handler for booking
  const handleBookingNavigation = () => {
    if (!customer) return;

    const bookingParams = new URLSearchParams({
      creating_event: "true",
      
      // Dati evento base
      title: quickBookingData.problem_description,
      description: quickBookingData.notes || "",
      event_type: quickBookingData.intervention_type,
      priority: quickBookingData.urgency_level,
      estimated_duration: quickBookingData.estimated_duration.toString(),
      
      // Dati cliente
      customer_name: `${customer.name} ${customer.surname}`,
      customer_phone: customer.phone,
      customer_email: customer.email || "",
      customer_address: `${customer.address}, ${customer.city} ${customer.zip_code}`,
      customer_type: customer.customer_type,
      
      // Dettagli intervento
      assigned_technician: selectedTechnician ? technicians.find(t => t.technician_id === selectedTechnician)?.name || "" : "",
      location: quickBookingData.location || customer.address,
      notes: quickBookingData.notes || "",
      contact_method: customer.preferred_contact_method,
      send_reminder: "true",
      from_external: "false",
    });

    // Navigate to calendar with all the data
    navigate(`/calendar?${bookingParams.toString()}`);
  };

  // Customer stats calculation
  const customerStats = useMemo(() => {
    if (!customer) return null;

    const interventions = mockInterventions.length;
    const totalSpent = mockPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const avgPerIntervention = interventions > 0 ? totalSpent / interventions : 0;

    return {
      totalInterventions: interventions,
      totalSpent: totalSpent,
      averagePerIntervention: avgPerIntervention,
      lastInterventionDate: customer.last_intervention_date,
      customerSince: new Date(customer.created_at),
    };
  }, [customer]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-default-600">Caricamento cliente...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <Icon icon="solar:user-cross-bold" width={64} className="text-default-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-default-600 mb-2">Cliente non trovato</h2>
          <p className="text-default-400 mb-4">Il cliente richiesto non esiste o è stato eliminato</p>
          <Button
            color="primary"
            onPress={() => navigate("/customers")}
            startContent={<Icon icon="solar:arrow-left-bold" width={20} />}
          >
            Torna ai Clienti
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 min-h-screen">
      <PageHeader
        title={`${customer.name} ${customer.surname}`}
        description="Dettagli completi del cliente e gestione appuntamenti"
        icon="solar:user-id-bold"
        size="md"
        actions={[
          {
            label: "Torna ai Clienti",
            icon: "solar:arrow-left-bold",
            color: "default",
            variant: "light",
            onClick: () => navigate("/customers"),
          },
          {
            label: "Modifica Cliente",
            icon: "solar:pen-bold",
            color: "primary",
            variant: "flat",
            onClick: () => navigate(`/customers/${customer.customer_id}/edit`),
          },
        ]}
      />

      <div className="px-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* COLONNA PRINCIPALE: Dettagli Cliente */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Header Cliente */}
            <Card className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200">
              <CardBody className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar
                      name={`${customer.name.charAt(0)}${customer.surname.charAt(0)}`}
                      size="lg"
                      className="bg-primary text-white text-xl"
                    />
                    <div>
                      <h2 className="text-2xl font-bold text-primary-800">
                        {customer.name} {customer.surname}
                      </h2>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-primary-600 font-medium">
                          📞 {customer.phone}
                        </p>
                        {customer.email && (
                          <p className="text-primary-600 font-medium">
                            ✉️ {customer.email}
                          </p>
                        )}
                      </div>
                      <p className="text-primary-600 mt-1">
                        📍 {customer.address}, {customer.city} {customer.zip_code}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Chip
                      size="sm"
                      color={customerTypeColorMap[customer.customer_type]}
                      variant="flat"
                      className="font-medium"
                    >
                      {customer.customer_type === "private" ? "Privato" : "Azienda"}
                    </Chip>
                    <Chip
                      size="sm"
                      color={statusColorMap[customer.status]}
                      variant="flat"
                    >
                      {customer.status === "active" ? "Attivo" : "Inattivo"}
                    </Chip>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Statistiche Cliente */}
            {customerStats && (
              <Card>
                <CardHeader>
                  <h4 className="font-semibold flex items-center gap-2">
                    <Icon icon="solar:chart-square-bold" width={20} />
                    Statistiche Cliente
                  </h4>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-primary-50 rounded-lg border border-primary-100">
                      <p className="text-2xl font-bold text-primary">
                        {customerStats.totalInterventions}
                      </p>
                      <p className="text-sm text-primary-700">Interventi</p>
                    </div>
                    <div className="text-center p-4 bg-success-50 rounded-lg border border-success-100">
                      <p className="text-2xl font-bold text-success">
                        €{customerStats.totalSpent.toFixed(0)}
                      </p>
                      <p className="text-sm text-success-700">Spesa Totale</p>
                    </div>
                    <div className="text-center p-4 bg-warning-50 rounded-lg border border-warning-100">
                      <p className="text-2xl font-bold text-warning">
                        €{customerStats.averagePerIntervention.toFixed(0)}
                      </p>
                      <p className="text-sm text-warning-700">Media/Intervento</p>
                    </div>
                    <div className="text-center p-4 bg-default-50 rounded-lg border border-default-200">
                      <p className="text-xl font-bold text-default-600">
                        {Math.floor((new Date().getTime() - customerStats.customerSince.getTime()) / (1000 * 60 * 60 * 24))}
                      </p>
                      <p className="text-sm text-default-600">Giorni Cliente</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Tabs Dettagli */}
            <Card>
              <CardHeader>
                <h4 className="font-semibold">Dettagli Cliente</h4>
              </CardHeader>
              <CardBody>
                <Tabs
                  selectedKey={selectedTab}
                  onSelectionChange={(key) => setSelectedTab(key as string)}
                  fullWidth
                  color="primary"
                >
                  <Tab key="overview" title="📋 Panoramica">
                    <div className="space-y-4 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-default-50 rounded-lg">
                          <h5 className="font-medium text-default-700 mb-2">📍 Indirizzo</h5>
                          <p className="font-medium">{customer.address}</p>
                          <p className="font-medium">{customer.city}, {customer.zip_code}</p>
                        </div>
                        <div className="p-4 bg-default-50 rounded-lg">
                          <h5 className="font-medium text-default-700 mb-2">📞 Contatti</h5>
                          <p className="font-medium">{customer.phone}</p>
                          {customer.email && (
                            <p className="font-medium">{customer.email}</p>
                          )}
                        </div>
                      </div>
                      {customer.notes && (
                        <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
                          <h5 className="font-medium text-warning-700 mb-2">📝 Note</h5>
                          <p className="text-warning-800">{customer.notes}</p>
                        </div>
                      )}
                    </div>
                  </Tab>
                  <Tab key="interventions" title="🔧 Interventi">
                    <div className="space-y-3 pt-4">
                      {mockInterventions.map((intervention) => (
                        <Card
                          key={intervention.intervention_id}
                          className="p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {intervention.problem_description}
                              </p>
                              <p className="text-sm text-default-600">
                                {intervention.date.toLocaleDateString(
                                  "it-IT"
                                )}{" "}
                                • {intervention.technician_name}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                €{intervention.cost.toFixed(2)}
                              </p>
                              <Chip size="sm" color="success" variant="flat">
                                {intervention.status === "completed"
                                  ? "Completato"
                                  : intervention.status}
                              </Chip>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </Tab>
                  <Tab key="payments" title="💳 Pagamenti">
                    <div className="space-y-3 pt-4">
                      {mockPayments.map((payment) => (
                        <Card key={payment.payment_id} className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                Fattura {payment.invoice_number}
                              </p>
                              <p className="text-sm text-default-600">
                                {payment.date.toLocaleDateString("it-IT")} •{" "}
                                {payment.method === "card"
                                  ? "Carta"
                                  : "Bonifico"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                €{payment.amount.toFixed(2)}
                              </p>
                              <Chip size="sm" color="success" variant="flat">
                                Pagato
                              </Chip>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </Tab>
                  <Tab key="references" title="👥 Referenze">
                    {(() => {
                      const refCustomer = customer.referred_by
                        ? customers.find(
                            (c) =>
                              c.customer_id === customer.referred_by
                          )
                        : null;
                      const segnalati = customers.filter(
                        (c) => c.referred_by === customer.customer_id
                      );
                      const hasReferences =
                        !!refCustomer || segnalati.length > 0;
                      return (
                        <div className="space-y-4 pt-4">
                          {refCustomer && (
                            <div className="p-3 bg-default-50 rounded-lg">
                              <p className="text-default-500 text-sm mb-1">
                                Cliente segnalato da:
                              </p>
                              <p className="font-medium">
                                {refCustomer.name} {refCustomer.surname}
                              </p>
                            </div>
                          )}
                          {segnalati.length > 0 && (
                            <div className="p-3 bg-default-50 rounded-lg">
                              <p className="text-default-500 text-sm mb-1">
                                Clienti segnalati da questo cliente:
                              </p>
                              <ul className="list-disc list-inside">
                                {segnalati.map((c) => (
                                  <li key={c.customer_id}>
                                    {c.name} {c.surname}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {!hasReferences && (
                            <div className="text-default-500 text-sm">
                              Nessuna referenza.
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </Tab>
                </Tabs>
              </CardBody>
            </Card>
          </div>

          {/* COLONNA SIDEBAR: Panel Azioni */}
          <div className="space-y-6">
            
            {/* Panel Preparazione Appuntamento */}
            <Card className="shadow-lg border-2 border-primary-200">
              <CardHeader className="bg-primary-50">
                <h4 className="font-bold text-primary-800 flex items-center gap-2">
                  <Icon icon="solar:calendar-add-bold" width={20} />
                  Prepara Appuntamento
                </h4>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="space-y-4">
                  {/* Descrizione Problema */}
                  <Textarea
                    label="Descrizione Problema"
                    placeholder="Descrivi il problema del cliente..."
                    value={quickBookingData.problem_description}
                    onValueChange={(value) =>
                      setQuickBookingData(prev => ({ ...prev, problem_description: value }))
                    }
                    isRequired
                    size="sm"
                    rows={3}
                  />

                  {/* Tipo e Urgenza */}
                  <div className="grid grid-cols-1 gap-3">
                    <Select
                      label="Tipo Intervento"
                      selectedKeys={[quickBookingData.intervention_type]}
                      onSelectionChange={(keys) =>
                        setQuickBookingData(prev => ({
                          ...prev,
                          intervention_type: Array.from(keys)[0] as "inspection" | "repair" | "maintenance" | "installation" | "consultation",
                        }))
                      }
                      size="sm"
                    >
                      <SelectItem key="inspection">Ispezione</SelectItem>
                      <SelectItem key="repair">Riparazione</SelectItem>
                      <SelectItem key="maintenance">Manutenzione</SelectItem>
                      <SelectItem key="installation">Installazione</SelectItem>
                      <SelectItem key="consultation">Consulenza</SelectItem>
                    </Select>

                    <Select
                      label="Livello Urgenza"
                      selectedKeys={[quickBookingData.urgency_level]}
                      onSelectionChange={(keys) =>
                        setQuickBookingData(prev => ({
                          ...prev,
                          urgency_level: Array.from(keys)[0] as "low" | "medium" | "high" | "emergency",
                        }))
                      }
                      size="sm"
                    >
                      <SelectItem key="low">🟢 Bassa</SelectItem>
                      <SelectItem key="medium">🟡 Media</SelectItem>
                      <SelectItem key="high">🟠 Alta</SelectItem>
                      <SelectItem key="emergency">🔴 Emergenza</SelectItem>
                    </Select>
                  </div>

                  {/* Durata e Tecnico */}
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Durata (min)"
                      type="number"
                      value={(quickBookingData.estimated_duration || 60).toString()}
                      onValueChange={(value) =>
                        setQuickBookingData(prev => ({
                          ...prev,
                          estimated_duration: parseInt(value) || 60,
                        }))
                      }
                      size="sm"
                    />

                    <Select
                      label="Tecnico"
                      selectedKeys={selectedTechnician ? [selectedTechnician] : []}
                      onSelectionChange={(keys) => setSelectedTechnician(Array.from(keys)[0] as string)}
                      size="sm"
                    >
                      {technicians.map(tech => (
                        <SelectItem key={tech.technician_id}>
                          {tech.name}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  {/* Ubicazione */}
                  <Input
                    label="Ubicazione Specifica"
                    placeholder="Es: Piano terra, garage..."
                    value={quickBookingData.location || ""}
                    onValueChange={(value) =>
                      setQuickBookingData(prev => ({ ...prev, location: value }))
                    }
                    size="sm"
                    startContent={<Icon icon="solar:map-point-bold" width={16} />}
                  />

                  {/* Note */}
                  <Textarea
                    label="Note per il tecnico"
                    placeholder="Istruzioni speciali, materiali necessari..."
                    value={quickBookingData.notes || ""}
                    onValueChange={(value) =>
                      setQuickBookingData(prev => ({ ...prev, notes: value }))
                    }
                    rows={2}
                    size="sm"
                  />

                  {/* Riepilogo */}
                  {quickBookingData.problem_description && (
                    <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
                      <div className="text-sm font-medium mb-2 text-primary-800">
                        📋 Riepilogo:
                      </div>
                      <div className="text-xs space-y-1 text-primary-700">
                        <div><strong>Cliente:</strong> {customer.name} {customer.surname}</div>
                        <div><strong>Problema:</strong> {quickBookingData.problem_description}</div>
                        <div><strong>Tipo:</strong> {quickBookingData.intervention_type}</div>
                        <div><strong>Urgenza:</strong> {quickBookingData.urgency_level}</div>
                        <div><strong>Durata:</strong> {quickBookingData.estimated_duration} min</div>
                        {selectedTechnician && (
                          <div><strong>Tecnico:</strong> {technicians.find(t => t.technician_id === selectedTechnician)?.name}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pulsante Principale */}
                  <Button
                    color="primary"
                    size="lg"
                    className="w-full font-semibold"
                    onPress={handleBookingNavigation}
                    isDisabled={!quickBookingData.problem_description.trim()}
                    startContent={<Icon icon="solar:calendar-search-bold" width={20} />}
                  >
                    Apri Calendario per Prenotare
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Panel Contatti Rapidi */}
            <Card>
              <CardHeader>
                <h4 className="font-semibold flex items-center gap-2">
                  <Icon icon="solar:phone-bold" width={20} />
                  Contatti Rapidi
                </h4>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <Button
                    variant="flat"
                    color="primary"
                    className="w-full justify-start"
                    startContent={<Icon icon="solar:phone-bold" width={16} />}
                    onPress={() => window.open(`tel:${customer.phone}`)}
                  >
                    Chiama {customer.phone}
                  </Button>
                  
                  {customer.email && (
                    <Button
                      variant="flat"
                      color="primary"
                      className="w-full justify-start"
                      startContent={<Icon icon="solar:letter-bold" width={16} />}
                      onPress={() => window.open(`mailto:${customer.email}`)}
                    >
                      Email
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Panel Info Cliente */}
            <Card>
              <CardHeader>
                <h4 className="font-semibold flex items-center gap-2">
                  <Icon icon="solar:info-circle-bold" width={20} />
                  Informazioni
                </h4>
              </CardHeader>
              <CardBody>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-default-500">Cliente dal:</span>
                    <span className="font-medium">
                      {new Date(customer.created_at).toLocaleDateString("it-IT")}
                    </span>
                  </div>
                  
                  {customer.last_intervention_date && (
                    <div className="flex justify-between">
                      <span className="text-default-500">Ultimo intervento:</span>
                      <span className="font-medium">
                        {new Date(customer.last_intervention_date).toLocaleDateString("it-IT")}
                      </span>
                    </div>
                  )}
                  
                  {customer.vat_number && (
                    <div className="flex justify-between">
                      <span className="text-default-500">P.IVA:</span>
                      <span className="font-medium">{customer.vat_number}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-default-500">Contatto preferito:</span>
                    <span className="font-medium capitalize">{customer.preferred_contact_method}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 