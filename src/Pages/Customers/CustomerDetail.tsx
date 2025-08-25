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
import type { CalendarEvent } from "../../Pages/CalendarAurora/types";
import axios from "axios";

const statusColorMap = {
  active: "success",
  inactive: "danger",
} as const;

const customerTypeColorMap = {
  private: "primary",
  business: "warning",
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
    urgency_level: "Normale", // Cambiato da stringa vuota a "Normale"
    intervention_type: "inspection",
    estimated_duration: 60,
    preferred_date: new Date(),
    preferred_time: "09:00",
    notes: "",
    location: "",
  });

  const [selectedTechnician, setSelectedTechnician] = useState<string>("");

  // Mock data
  const [mockInterventions, setMockInterventions] = useState<
    InterventionSummary[]
  >([]);
  const [mockPayments, setMockPayments] = useState<PaymentSummary[]>([]);

  // Nuovo state per gli eventi del calendario
  const [customerEvents, setCustomerEvents] = useState<CalendarEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  // Load data
  useEffect(() => {
    loadCustomerData();
  }, [customerId]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);

      // Chiamate API reali per recuperare i dati
      const [customersResponse, techniciansResponse] = await Promise.all([
        axios.get("Customer/GET/GetAllCustomers"),
        axios.get("Employee/GET/GetAllEmployees"),
      ]);

      // Processa i dati dei clienti
      let customers: Customer[] = [];
      if (Array.isArray(customersResponse.data)) {
        customers = customersResponse.data;
      } else if (
        customersResponse.data &&
        typeof customersResponse.data === "object"
      ) {
        if (customersResponse.data.customer_id) {
          customers = [customersResponse.data];
        } else if (customersResponse.data.customers) {
          customers = Array.isArray(customersResponse.data.customers)
            ? customersResponse.data.customers
            : [];
        } else if (customersResponse.data.data) {
          customers = Array.isArray(customersResponse.data.data)
            ? customersResponse.data.data
            : [];
        }
      }

      // Processa i dati dei tecnici
      let technicians: Technician[] = [];
      if (Array.isArray(techniciansResponse.data)) {
        technicians = techniciansResponse.data.map((emp: any) => ({
          user_id: emp.user_id,
          technician_id: emp.user_id,
          name: emp.name,
          surname: emp.surname || "",
          role: emp.role || "technician",
          status: emp.status || "active",
          email: emp.email,
          phone: emp.phone,
          profile_image: emp.profile_image || "",
          created_at: new Date(emp.created_at || Date.now()),
          updated_at: new Date(emp.updated_at || Date.now()),
          specializations: emp.specializations || [
            {
              specialization_id: "1",
              name: "Generale",
              category: "other",
              skill_level: "basic",
            },
          ],
          skill_level: emp.skill_level || "junior",
          availability_status: emp.availability_status || "available",
          working_hours: emp.working_hours || {
            monday: {
              is_working_day: true,
              start_time: "09:00",
              end_time: "18:00",
            },
            tuesday: {
              is_working_day: true,
              start_time: "09:00",
              end_time: "18:00",
            },
            wednesday: {
              is_working_day: true,
              start_time: "09:00",
              end_time: "18:00",
            },
            thursday: {
              is_working_day: true,
              start_time: "09:00",
              end_time: "18:00",
            },
            friday: {
              is_working_day: true,
              start_time: "09:00",
              end_time: "18:00",
            },
            saturday: { is_working_day: false },
            sunday: { is_working_day: false },
          },
        }));
      }

      setCustomers(customers);
      setTechnicians(technicians);

      // Trova il cliente specifico
      const foundCustomer = customers.find((c) => c.customer_id === customerId);
      if (foundCustomer) {
        setCustomer(foundCustomer);
        setQuickBookingData((prev) => ({
          ...prev,
          customer_id: foundCustomer.customer_id,
          location: foundCustomer.address, // Pre-compila l'ubicazione con l'indirizzo del cliente
        }));

        // Carica interventi per questo cliente
        try {
          const [interventionsResponse] = await Promise.all([
            axios.get(`Intervention/GET/GetInterventionsByCustomerId`, {
              params: { customer_id: customerId },
            }),
          ]);

          // Processa interventi
          let interventions: InterventionSummary[] = [];
          if (
            interventionsResponse.data &&
            Array.isArray(interventionsResponse.data)
          ) {
            interventions = interventionsResponse.data.map((int: any) => ({
              intervention_id: int.intervention_id,
              date: new Date(int.date),
              type: int.type || "repair",
              problem_description: int.problem_description,
              status: int.status,
              cost: int.cost || 0,
              technician_name: int.technician_name || "N/A",
            }));
          }

          // Aggiorna i dati mock con quelli reali
          setMockInterventions(interventions);
        } catch (error) {
          console.error("Errore nel caricamento interventi/pagamenti:", error);
          // Mantieni i dati mock in caso di errore
        }
      }
    } catch (error) {
      console.error("Errore nel caricamento dati cliente:", error);
    } finally {
      setLoading(false);
    }
  };

  // Nuova funzione per caricare gli eventi del calendario associati al cliente
  const loadCustomerEvents = async () => {
    if (!customerId) return;

    try {
      setEventsLoading(true);

      // Calcola le date per il filtro (ultimi 30 giorni e prossimi 90 giorni)
      const now = new Date();
      const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 giorni fa
      const endDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 giorni da ora

      const response = await axios.get("Customer/GET/GetAllEvents", {
        params: {
          customer_id: customerId,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          include_past: true,
          include_future: true,
        },
      });

      let allEvents: CalendarEvent[] = [];
      if (Array.isArray(response.data)) {
        allEvents = response.data;
      } else if (response.data && response.data.events) {
        allEvents = Array.isArray(response.data.events)
          ? response.data.events
          : [];
      } else if (response.data && response.data.data) {
        allEvents = Array.isArray(response.data.data) ? response.data.data : [];
      }

      // Se l'API non supporta il filtro per cliente, filtra localmente
      const filteredEvents = allEvents.filter(
        (event: CalendarEvent) => event.CustomerInfo?.customer_id === customerId
      );

      // Processa le date degli eventi - assicurati che siano sempre Date
      const processedEvents = filteredEvents.map((event: CalendarEvent) => ({
        ...event,
        EventStartDate:
          typeof event.EventStartDate === "string"
            ? new Date(event.EventStartDate)
            : event.EventStartDate,
        EventEndDate:
          typeof event.EventEndDate === "string"
            ? new Date(event.EventEndDate)
            : event.EventEndDate,
      }));

      setCustomerEvents(processedEvents);
    } catch (error) {
      console.error("Errore nel caricamento eventi cliente:", error);
    } finally {
      setEventsLoading(false);
    }
  };

  // Carica gli eventi quando cambia la tab
  useEffect(() => {
    if (selectedTab === "interventions" && customerId) {
      loadCustomerEvents();
    }
  }, [selectedTab, customerId]);

  // Navigation handler for booking
  const handleBookingNavigation = () => {
    if (!customer) return;

    const bookingParams = new URLSearchParams({
      creating_event: "true", // Flag per indicare che si sta creando un nuovo evento
      from_ccc: "true", // Flag per indicare che viene da CCC e aprire automaticamente il modal

      // Dati evento base
      title: quickBookingData.problem_description,
      description: quickBookingData.notes || "",
      event_type: quickBookingData.intervention_type,
      priority: quickBookingData.urgency_level,
      estimated_duration: (
        quickBookingData.estimated_duration || 60
      ).toString(),

      // Dati cliente
      customer_id: customer.customer_id,
      customer_name: `${customer.name} ${customer.surname}`,
      customer_phone: customer.phone,
      customer_email: customer.email || "",
      customer_address: `${customer.address}, ${customer.city} ${customer.zip_code}`,
      customer_type: customer.customer_type,

      // Dettagli intervento
      assigned_technician: selectedTechnician
        ? technicians.find((t) => t.technician_id === selectedTechnician)
            ?.name || ""
        : "",
      assigned_technician_id: selectedTechnician
        ? technicians.find((t) => t.technician_id === selectedTechnician)
            ?.technician_id || ""
        : "",
      location: quickBookingData.location || customer.address,
      notes: quickBookingData.notes || "",
      contact_method: customer.preferred_contact_method || "phone",
      send_reminder: "true",
      from_external: "false",
    });

    console.log(bookingParams.toString());

    // Navigate to calendar - the modal will open automatically with prefilled data
    navigate(`/calendar?${bookingParams.toString()}`);
  };

  // Customer stats calculation
  const customerStats = useMemo(() => {
    if (!customer) return null;

    const interventions = mockInterventions.length;
    const totalSpent = mockPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const avgPerIntervention =
      interventions > 0 ? totalSpent / interventions : 0;

    return {
      totalInterventions: interventions,
      totalSpent: totalSpent,
      averagePerIntervention: avgPerIntervention,
      lastInterventionDate: customer.last_intervention_date,
      customerSince: new Date(customer.created_at),
    };
  }, [customer, mockInterventions, mockPayments]);

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
          <Icon
            icon="solar:user-cross-bold"
            width={64}
            className="text-default-300 mx-auto mb-4"
          />
          <h2 className="text-xl font-semibold text-default-600 mb-2">
            Cliente non trovato
          </h2>
          <p className="text-default-400 mb-4">
            Il cliente richiesto non esiste o è stato eliminato
          </p>
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
            <Card className="bg-default-50 dark:bg-default-100/60 backdrop-blur-lg border border-default-200 shadow-sm rounded-xl">
              <CardBody className="px-4 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar
                      name={`${customer.name.charAt(
                        0
                      )}${customer.surname.charAt(0)}`}
                      size="lg"
                      className="bg-primary text-white text-xl ring-2 ring-primary/40"
                    />
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-foreground">
                        {customer.name} {customer.surname}
                      </h2>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-default-700 dark:text-default-300 font-medium">
                          📞 {customer.phone}
                        </p>
                        {customer.email && (
                          <p className="text-default-700 dark:text-default-300 font-medium">
                            ✉️ {customer.email}
                          </p>
                        )}
                      </div>
                      <p className="text-default-700 dark:text-default-300 mt-1">
                        📍 {customer.address}, {customer.city}{" "}
                        {customer.zip_code}
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
                      {customer.customer_type === "private"
                        ? "Privato"
                        : "Azienda"}
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
                      <p className="text-sm text-warning-700">
                        Media/Intervento
                      </p>
                    </div>
                    <div className="text-center p-4 bg-default-50 rounded-lg border border-default-200">
                      <p className="text-xl font-bold text-default-600">
                        {Math.floor(
                          (new Date().getTime() -
                            customerStats.customerSince.getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}
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
                          <h5 className="font-medium text-default-700 mb-2">
                            📍 Indirizzo
                          </h5>
                          <p className="font-medium">{customer.address}</p>
                          <p className="font-medium">
                            {customer.city}, {customer.zip_code}
                          </p>
                        </div>
                        <div className="p-4 bg-default-50 rounded-lg">
                          <h5 className="font-medium text-default-700 mb-2">
                            📞 Contatti
                          </h5>
                          <p className="font-medium">{customer.phone}</p>
                          {customer.email && (
                            <p className="font-medium">{customer.email}</p>
                          )}
                        </div>
                      </div>
                      {customer.notes && (
                        <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
                          <h5 className="font-medium text-warning-700 mb-2">
                            📝 Note
                          </h5>
                          <p className="text-warning-800">{customer.notes}</p>
                        </div>
                      )}
                    </div>
                  </Tab>
                  <Tab key="interventions" title="🔧 Interventi">
                    <div className="space-y-3 pt-4">
                      {/* Sezione Eventi Calendario */}
                      <div className="mb-6">
                        {eventsLoading ? (
                          <div className="flex justify-center items-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            <p className="ml-2 text-sm text-default-600">
                              Caricamento eventi...
                            </p>
                          </div>
                        ) : customerEvents.length > 0 ? (
                          <div className="space-y-3">
                            {(() => {
                              const now = new Date();
                              console.log(
                                "🔍 DEBUG - Ora attuale:",
                                now.toISOString()
                              );

                              console.log(
                                "🔍 DEBUG - Tutti gli eventi del cliente:",
                                customerEvents
                              );

                              // Identifica interventi in corso (eventi che sono iniziati ma non ancora finiti)
                              const ongoingEvents = customerEvents.filter(
                                (event) => {
                                  // Combina data e ora per creare timestamp completi
                                  const startDate = new Date(
                                    event.EventStartDate
                                  );
                                  const endDate = new Date(event.EventEndDate);

                                  // Se abbiamo orari separati, combinali con le date
                                  let eventStart, eventEnd;

                                  if (
                                    event.EventStartTime &&
                                    event.EventEndTime
                                  ) {
                                    // Combina data con ora (es: "2025-08-24" + "19:30:00")
                                    // IMPORTANTE: Usa la data locale, non UTC
                                    const startDateLocal = new Date(
                                      startDate.getFullYear(),
                                      startDate.getMonth(),
                                      startDate.getDate()
                                    );
                                    const endDateLocal = new Date(
                                      endDate.getFullYear(),
                                      endDate.getMonth(),
                                      endDate.getDate()
                                    );

                                    // Estrai ore e minuti dalle stringhe orario
                                    const [startHour, startMinute] =
                                      event.EventStartTime.split(":").map(
                                        Number
                                      );
                                    const [endHour, endMinute] =
                                      event.EventEndTime.split(":").map(Number);

                                    // Crea timestamp locali
                                    eventStart = new Date(startDateLocal);
                                    eventStart.setHours(
                                      startHour,
                                      startMinute,
                                      0,
                                      0
                                    );

                                    eventEnd = new Date(endDateLocal);
                                    eventEnd.setHours(endHour, endMinute, 0, 0);
                                  } else {
                                    // Usa solo le date se non ci sono orari separati
                                    eventStart = startDate;
                                    eventEnd = endDate;
                                  }

                                  const isOngoing =
                                    eventStart <= now && eventEnd > now;

                                  console.log("🔍 DEBUG Evento:", {
                                    title: event.EventTitle,
                                    startDate: startDate.toISOString(),
                                    endDate: endDate.toISOString(),
                                    startTime: event.EventStartTime,
                                    endTime: event.EventEndTime,
                                    eventStart: eventStart.toISOString(),
                                    eventEnd: eventEnd.toISOString(),
                                    eventStartLocal: eventStart.toString(),
                                    eventEndLocal: eventEnd.toString(),
                                    now: now.toISOString(),
                                    nowLocal: now.toString(),
                                    isOngoing: isOngoing,
                                  });

                                  return isOngoing;
                                }
                              );

                              console.log(
                                "🔍 DEBUG - Eventi in corso trovati:",
                                ongoingEvents.length
                              );

                              const futureEvents = customerEvents
                                .filter((event) => {
                                  // Combina data e ora per creare timestamp completi
                                  const endDate = new Date(event.EventEndDate);
                                  let eventEnd;

                                  if (event.EventEndTime) {
                                    // Combina data con ora
                                    // IMPORTANTE: Usa la data locale, non UTC
                                    const endDateLocal = new Date(
                                      endDate.getFullYear(),
                                      endDate.getMonth(),
                                      endDate.getDate()
                                    );

                                    // Estrai ore e minuti dalle stringhe orario
                                    const [endHour, endMinute] =
                                      event.EventEndTime.split(":").map(Number);

                                    // Crea timestamp locale
                                    eventEnd = new Date(endDateLocal);
                                    eventEnd.setHours(endHour, endMinute, 0, 0);
                                  } else {
                                    eventEnd = endDate;
                                  }

                                  // IMPORTANTE: Escludi eventi già classificati come "in corso"
                                  const startDate = new Date(
                                    event.EventStartDate
                                  );
                                  let eventStart;

                                  if (event.EventStartTime) {
                                    const startDateLocal = new Date(
                                      startDate.getFullYear(),
                                      startDate.getMonth(),
                                      startDate.getDate()
                                    );
                                    const [startHour, startMinute] =
                                      event.EventStartTime.split(":").map(
                                        Number
                                      );
                                    eventStart = new Date(startDateLocal);
                                    eventStart.setHours(
                                      startHour,
                                      startMinute,
                                      0,
                                      0
                                    );
                                  } else {
                                    eventStart = startDate;
                                  }

                                  const isOngoing =
                                    eventStart <= now && eventEnd > now;

                                  // Un evento è futuro solo se NON è in corso e finisce dopo ora attuale
                                  return !isOngoing && eventEnd > now;
                                })
                                .sort((a, b) => {
                                  // Prima ordina per priorità (Emergenza > Urgente > Alta > Normale)
                                  const priorityOrder = {
                                    Emergenza: 4,
                                    Urgente: 3,
                                    Alta: 2,
                                    Normale: 1,
                                  };
                                  const aPriority =
                                    priorityOrder[
                                      a.EventPriority || "Normale"
                                    ] || 0;
                                  const bPriority =
                                    priorityOrder[
                                      b.EventPriority || "Normale"
                                    ] || 0;

                                  if (aPriority !== bPriority) {
                                    return bPriority - aPriority; // Priorità più alta prima
                                  }

                                  // Se stessa priorità, ordina per data di inizio (prima quelli più vicini)
                                  return (
                                    new Date(a.EventStartDate).getTime() -
                                    new Date(b.EventStartDate).getTime()
                                  );
                                });

                              const pastEvents = customerEvents
                                .filter((event) => {
                                  // Combina data e ora per creare timestamp completi
                                  const endDate = new Date(event.EventEndDate);
                                  let eventEnd;

                                  if (event.EventEndTime) {
                                    // Combina data con ora
                                    // IMPORTANTE: Usa la data locale, non UTC
                                    const endDateLocal = new Date(
                                      endDate.getFullYear(),
                                      endDate.getMonth(),
                                      endDate.getDate()
                                    );

                                    // Estrai ore e minuti dalle stringhe orario
                                    const [endHour, endMinute] =
                                      event.EventEndTime.split(":").map(Number);

                                    // Crea timestamp locale
                                    eventEnd = new Date(endDateLocal);
                                    eventEnd.setHours(endHour, endMinute, 0, 0);
                                  } else {
                                    eventEnd = endDate;
                                  }

                                  // IMPORTANTE: Escludi eventi già classificati come "in corso"
                                  const startDate = new Date(
                                    event.EventStartDate
                                  );
                                  let eventStart;

                                  if (event.EventStartTime) {
                                    const startDateLocal = new Date(
                                      startDate.getFullYear(),
                                      startDate.getMonth(),
                                      startDate.getDate()
                                    );
                                    const [startHour, startMinute] =
                                      event.EventStartTime.split(":").map(
                                        Number
                                      );
                                    eventStart = new Date(startDateLocal);
                                    eventStart.setHours(
                                      startHour,
                                      startMinute,
                                      0,
                                      0
                                    );
                                  } else {
                                    eventStart = startDate;
                                  }

                                  const isOngoing =
                                    eventStart <= now && eventEnd > now;

                                  // Un evento è passato solo se NON è in corso ed è completamente finito
                                  return !isOngoing && eventEnd <= now;
                                })
                                .sort((a, b) => {
                                  // Eventi passati ordinati per data (più recenti prima)
                                  return (
                                    new Date(b.EventStartDate).getTime() -
                                    new Date(a.EventStartDate).getTime()
                                  );
                                });

                              console.log(
                                "🔍 DEBUG - Eventi futuri trovati:",
                                futureEvents.length
                              );
                              console.log(
                                "🔍 DEBUG - Eventi passati trovati:",
                                pastEvents.length
                              );

                              return (
                                <>
                                  {/* Sezione Interventi in Corso - SEMPRE VISIBILE */}
                                  <div className="mb-6">
                                    <h6 className="font-semibold text-yellow-400 mb-3 flex items-center gap-2 border-b border-yellow-600 pb-2">
                                      <div className="relative">
                                        <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                                        <div className="absolute inset-0 w-3 h-3 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
                                      </div>
                                      <Icon
                                        icon="solar:play-circle-bold"
                                        width={16}
                                      />
                                      Interventi in Corso (
                                      {ongoingEvents.length})
                                    </h6>
                                    {ongoingEvents.length > 0 ? (
                                      <div className="space-y-3">
                                        {ongoingEvents.map((event) => {
                                          // Determina il colore in base alla priorità
                                          const getPriorityColor = (
                                            priority: string
                                          ) => {
                                            switch (priority) {
                                              case "Normale":
                                                return "border-l-green-500";
                                              case "Alta":
                                                return "border-l-yellow-500";
                                              case "Urgente":
                                                return "border-l-orange-500";
                                              case "Emergenza":
                                                return "border-l-red-500";
                                              default:
                                                return "border-l-gray-500";
                                            }
                                          };

                                          const priorityColor =
                                            getPriorityColor(
                                              event.EventPriority || "Normale"
                                            );

                                          return (
                                            <Card
                                              key={`event-ongoing-${event.EventId}`}
                                              className={`p-4 border-l-4 ${priorityColor} bg-yellow-900/20 dark:bg-yellow-900/30 border border-yellow-600 dark:border-yellow-700 hover:shadow-xl hover:bg-yellow-900/30 transition-all duration-200 group ring-2 ring-yellow-500/30`}
                                            >
                                              <div className="space-y-3">
                                                {/* Header evento con icona priorità e stato "IN CORSO" */}
                                                <div className="flex items-start justify-between">
                                                  <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                      <span className="text-2xl">
                                                        {event.EventPriority ===
                                                          "Normale" && "🟢"}
                                                        {event.EventPriority ===
                                                          "Alta" && "🟡"}
                                                        {event.EventPriority ===
                                                          "Urgente" && "🟠"}
                                                        {event.EventPriority ===
                                                          "Emergenza" && "🔴"}
                                                      </span>
                                                      <div className="flex-1">
                                                        <h4 className="font-semibold text-white text-lg">
                                                          {event.EventTitle ||
                                                            "Evento"}
                                                        </h4>
                                                        <p className="text-gray-300 text-sm">
                                                          {new Date(
                                                            event.EventStartDate
                                                          ).toLocaleDateString(
                                                            "it-IT",
                                                            {
                                                              weekday: "long",
                                                              year: "numeric",
                                                              month: "long",
                                                              day: "numeric",
                                                            }
                                                          )}
                                                        </p>
                                                        <p className="text-gray-400 text-xs">
                                                          {event.EventStartTime ||
                                                            new Date(
                                                              event.EventStartDate
                                                            ).toLocaleTimeString(
                                                              "it-IT",
                                                              {
                                                                hour: "2-digit",
                                                                minute:
                                                                  "2-digit",
                                                              }
                                                            )}{" "}
                                                          -{" "}
                                                          {event.EventEndTime ||
                                                            new Date(
                                                              event.EventEndDate
                                                            ).toLocaleTimeString(
                                                              "it-IT",
                                                              {
                                                                hour: "2-digit",
                                                                minute:
                                                                  "2-digit",
                                                              }
                                                            )}
                                                        </p>
                                                      </div>
                                                    </div>
                                                  </div>
                                                  <div className="flex flex-col gap-2">
                                                    <Chip
                                                      size="sm"
                                                      variant="flat"
                                                      className="bg-yellow-600 text-yellow-100 border-yellow-500 animate-pulse"
                                                    >
                                                      IN CORSO
                                                    </Chip>
                                                    <Chip
                                                      size="sm"
                                                      variant="flat"
                                                      className={`${
                                                        event.EventPriority ===
                                                        "Normale"
                                                          ? "bg-green-900 text-green-100 border-green-700"
                                                          : event.EventPriority ===
                                                            "Alta"
                                                          ? "bg-yellow-900 text-yellow-100 border-yellow-700"
                                                          : event.EventPriority ===
                                                            "Urgente"
                                                          ? "bg-orange-900 text-orange-100 border-orange-700"
                                                          : "bg-red-900 text-red-100 border-red-700"
                                                      }`}
                                                    >
                                                      {event.EventPriority}
                                                    </Chip>
                                                    {event.EventType && (
                                                      <Chip
                                                        size="sm"
                                                        variant="flat"
                                                        className="bg-yellow-900 text-yellow-100 border-yellow-700"
                                                      >
                                                        {event.EventType}
                                                      </Chip>
                                                    )}
                                                  </div>
                                                </div>

                                                {/* Descrizione */}
                                                {event.EventDescription && (
                                                  <div className="p-3 bg-yellow-800/30 dark:bg-yellow-800/40 rounded-lg border border-yellow-600 dark:border-yellow-700">
                                                    <p className="text-sm text-yellow-200 font-medium mb-1">
                                                      Descrizione
                                                    </p>
                                                    <p className="text-white text-sm">
                                                      {event.EventDescription}
                                                    </p>
                                                  </div>
                                                )}

                                                {/* Ubicazione */}
                                                {event.EventLocation && (
                                                  <div className="p-3 bg-yellow-800/30 dark:bg-yellow-800/40 rounded-lg border border-yellow-600 dark:border-yellow-700">
                                                    <p className="text-sm text-yellow-200 font-medium mb-1">
                                                      Ubicazione
                                                    </p>
                                                    <p className="text-white text-sm">
                                                      {event.EventLocation}
                                                    </p>
                                                  </div>
                                                )}

                                                {/* Tecnico Assegnato */}
                                                {event.TechnicianAssignment && (
                                                  <div className="p-3 bg-yellow-800/30 dark:bg-yellow-800/40 rounded-lg border border-yellow-600 dark:border-yellow-700">
                                                    <p className="text-sm text-yellow-200 font-medium mb-1">
                                                      Tecnico Assegnato
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                      <p className="text-white text-sm">
                                                        {
                                                          event
                                                            .TechnicianAssignment
                                                            .technician_name
                                                        }
                                                      </p>
                                                      <Chip
                                                        size="sm"
                                                        variant="flat"
                                                        className="bg-green-900 text-green-100 border-green-700"
                                                      >
                                                        In Lavoro
                                                      </Chip>
                                                    </div>
                                                  </div>
                                                )}

                                                {/* Durata Stimata */}
                                                {event.EstimatedDuration && (
                                                  <div className="p-3 bg-yellow-800/30 dark:bg-yellow-800/40 rounded-lg border border-yellow-600 dark:border-yellow-700">
                                                    <p className="text-sm text-yellow-200 font-medium mb-1">
                                                      Durata Stimata
                                                    </p>
                                                    <p className="text-white text-sm">
                                                      {typeof event.EstimatedDuration ===
                                                      "string"
                                                        ? event.EventDescription
                                                        : `${event.EstimatedDuration} min`}
                                                    </p>
                                                  </div>
                                                )}

                                                {/* Azioni */}
                                                <div className="flex gap-2 pt-2">
                                                  <Button
                                                    size="sm"
                                                    variant="flat"
                                                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                                                    startContent={
                                                      <Icon
                                                        icon="solar:eye-bold"
                                                        width={16}
                                                      />
                                                    }
                                                  >
                                                    Visualizza
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="flat"
                                                    className="bg-gray-600 hover:bg-gray-700 text-white"
                                                    startContent={
                                                      <Icon
                                                        icon="solar:pen-bold"
                                                        width={16}
                                                      />
                                                    }
                                                  >
                                                    Modifica
                                                  </Button>
                                                </div>
                                              </div>
                                            </Card>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <div className="text-center py-6 bg-yellow-900/10 rounded-lg border-2 border-dashed border-yellow-600/50">
                                        <Icon
                                          icon="solar:play-circle-bold"
                                          width={32}
                                          className="text-yellow-400 mx-auto mb-2"
                                        />
                                        <p className="text-yellow-300 text-sm font-medium mb-1">
                                          Nessun intervento in corso
                                        </p>
                                        <p className="text-yellow-400 text-xs">
                                          Tutti gli interventi sono programmati
                                          o completati
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Separatore tra interventi in corso e futuri */}
                                  {ongoingEvents.length > 0 &&
                                    futureEvents.length > 0 && (
                                      <div className="border-t-2 border-yellow-600 my-6"></div>
                                    )}

                                  {/* Sezione Interventi Futuri - SEMPRE VISIBILE */}
                                  <div className="mb-6">
                                    <h6 className="font-semibold text-green-400 mb-3 flex items-center gap-2 border-b border-green-700 pb-2">
                                      <Icon
                                        icon="solar:clock-circle-bold"
                                        width={16}
                                      />
                                      Interventi Futuri ({futureEvents.length})
                                    </h6>
                                    {futureEvents.length > 0 ? (
                                      <div className="space-y-3">
                                        {futureEvents.map((event) => {
                                          // Determina il colore in base alla priorità
                                          const getPriorityColor = (
                                            priority: string
                                          ) => {
                                            switch (priority) {
                                              case "Normale":
                                                return "border-l-green-500";
                                              case "Alta":
                                                return "border-l-yellow-500";
                                              case "Urgente":
                                                return "border-l-orange-500";
                                              case "Emergenza":
                                                return "border-l-red-500";
                                              default:
                                                return "border-l-gray-500";
                                            }
                                          };

                                          const priorityColor =
                                            getPriorityColor(
                                              event.EventPriority || "Normale"
                                            );

                                          return (
                                            <Card
                                              key={`event-future-${event.EventId}`}
                                              className={`p-4 border-l-4 ${priorityColor} bg-gray-900 dark:bg-black border border-gray-700 dark:border-gray-800 hover:shadow-xl hover:bg-gray-800 transition-all duration-200 group`}
                                            >
                                              <div className="space-y-3">
                                                {/* Header evento con icona priorità */}
                                                <div className="flex items-start justify-between">
                                                  <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                      <span className="text-2xl">
                                                        {event.EventPriority ===
                                                          "Normale" && "🟢"}
                                                        {event.EventPriority ===
                                                          "Alta" && "🟡"}
                                                        {event.EventPriority ===
                                                          "Urgente" && "🟠"}
                                                        {event.EventPriority ===
                                                          "Emergenza" && "🔴"}
                                                      </span>
                                                      <div className="flex-1">
                                                        <h4 className="font-semibold text-white text-lg">
                                                          {event.EventTitle ||
                                                            "Evento"}
                                                        </h4>
                                                        <p className="text-gray-300 text-sm">
                                                          {new Date(
                                                            event.EventStartDate
                                                          ).toLocaleDateString(
                                                            "it-IT",
                                                            {
                                                              weekday: "long",
                                                              year: "numeric",
                                                              month: "long",
                                                              day: "numeric",
                                                            }
                                                          )}
                                                        </p>
                                                        <p className="text-gray-400 text-xs">
                                                          {event.EventStartTime ||
                                                            new Date(
                                                              event.EventStartDate
                                                            ).toLocaleTimeString(
                                                              "it-IT",
                                                              {
                                                                hour: "2-digit",
                                                                minute:
                                                                  "2-digit",
                                                              }
                                                            )}{" "}
                                                          -{" "}
                                                          {event.EventEndTime ||
                                                            new Date(
                                                              event.EventEndDate
                                                            ).toLocaleTimeString(
                                                              "it-IT",
                                                              {
                                                                hour: "2-digit",
                                                                minute:
                                                                  "2-digit",
                                                              }
                                                            )}
                                                        </p>
                                                      </div>
                                                    </div>
                                                  </div>
                                                  <div className="flex flex-col gap-2">
                                                    <Chip
                                                      size="sm"
                                                      variant="flat"
                                                      className={`${
                                                        event.EventPriority ===
                                                        "Normale"
                                                          ? "bg-green-900 text-green-100 border-green-700"
                                                          : event.EventPriority ===
                                                            "Alta"
                                                          ? "bg-yellow-900 text-yellow-100 border-yellow-700"
                                                          : event.EventPriority ===
                                                            "Urgente"
                                                          ? "bg-orange-900 text-orange-100 border-orange-700"
                                                          : "bg-red-900 text-red-100 border-red-700"
                                                      }`}
                                                    >
                                                      {event.EventPriority}
                                                    </Chip>
                                                    {event.EventType && (
                                                      <Chip
                                                        size="sm"
                                                        variant="flat"
                                                        className="bg-yellow-900 text-yellow-100 border-yellow-700"
                                                      >
                                                        {event.EventType}
                                                      </Chip>
                                                    )}
                                                  </div>
                                                </div>

                                                {/* Descrizione */}
                                                {event.EventDescription && (
                                                  <div className="p-3 bg-gray-800 dark:bg-gray-900 rounded-lg border border-gray-700 dark:border-gray-800">
                                                    <p className="text-sm text-gray-300 font-medium mb-1">
                                                      Descrizione
                                                    </p>
                                                    <p className="text-white text-sm">
                                                      {event.EventDescription}
                                                    </p>
                                                  </div>
                                                )}

                                                {/* Ubicazione */}
                                                {event.EventLocation && (
                                                  <div className="p-3 bg-gray-800 dark:bg-gray-900 rounded-lg border border-gray-700 dark:border-gray-800">
                                                    <p className="text-sm text-gray-300 font-medium mb-1">
                                                      Ubicazione
                                                    </p>
                                                    <p className="text-white text-sm">
                                                      {event.EventLocation}
                                                    </p>
                                                  </div>
                                                )}

                                                {/* Tecnico Assegnato */}
                                                {event.TechnicianAssignment && (
                                                  <div className="p-3 bg-gray-800 dark:bg-gray-900 rounded-lg border border-gray-700 dark:border-gray-800">
                                                    <p className="text-sm text-gray-300 font-medium mb-1">
                                                      Tecnico Assegnato
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                      <p className="text-white text-sm">
                                                        {
                                                          event
                                                            .TechnicianAssignment
                                                            .technician_name
                                                        }
                                                      </p>
                                                      <Chip
                                                        size="sm"
                                                        variant="flat"
                                                        className="bg-green-900 text-green-100 border-green-700"
                                                      >
                                                        Disponibile
                                                      </Chip>
                                                    </div>
                                                  </div>
                                                )}

                                                {/* Durata Stimata */}
                                                {event.EstimatedDuration && (
                                                  <div className="p-3 bg-gray-800 dark:bg-gray-900 rounded-lg border border-gray-700 dark:border-gray-800">
                                                    <p className="text-sm text-gray-300 font-medium mb-1">
                                                      Durata Stimata
                                                    </p>
                                                    <p className="text-white text-sm">
                                                      {typeof event.EstimatedDuration ===
                                                      "string"
                                                        ? event.EventDescription
                                                        : `${event.EstimatedDuration} min`}
                                                    </p>
                                                  </div>
                                                )}

                                                {/* Azioni */}
                                                <div className="flex gap-2 pt-2">
                                                  <Button
                                                    size="sm"
                                                    variant="flat"
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                    startContent={
                                                      <Icon
                                                        icon="solar:eye-bold"
                                                        width={16}
                                                      />
                                                    }
                                                  >
                                                    Visualizza
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="flat"
                                                    className="bg-gray-600 hover:bg-gray-700 text-white"
                                                    startContent={
                                                      <Icon
                                                        icon="solar:pen-bold"
                                                        width={16}
                                                      />
                                                    }
                                                  >
                                                    Modifica
                                                  </Button>
                                                </div>
                                              </div>
                                            </Card>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <div className="text-center py-6 bg-green-900/10 rounded-lg border-2 border-dashed border-green-600/50">
                                        <Icon
                                          icon="solar:clock-circle-bold"
                                          width={32}
                                          className="text-green-400 mx-auto mb-2"
                                        />
                                        <p className="text-green-300 text-sm font-medium mb-1">
                                          Nessun evento programmato
                                        </p>
                                        <p className="text-green-400 text-xs">
                                          Non ci sono interventi futuri per
                                          questo cliente
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Separatore tra eventi futuri e passati */}
                                  {futureEvents.length > 0 &&
                                    pastEvents.length > 0 && (
                                      <div className="border-t-2 border-gray-600 my-6"></div>
                                    )}

                                  {/* Sezione Storico Interventi */}
                                  {pastEvents.length > 0 && (
                                    <div className="mb-6">
                                      <h6 className="font-semibold text-gray-400 mb-3 flex items-center gap-2 border-b border-gray-700 pb-2">
                                        <Icon
                                          icon="solar:history-bold"
                                          width={16}
                                        />
                                        Storico Interventi ({pastEvents.length})
                                      </h6>
                                      <div className="space-y-3">
                                        {pastEvents.map((event, index) => {
                                          // Determina il colore in base alla priorità
                                          const getPriorityColor = (
                                            priority: string
                                          ) => {
                                            switch (priority) {
                                              case "Normale":
                                                return "border-l-green-500";
                                              case "Alta":
                                                return "border-l-yellow-500";
                                              case "Urgente":
                                                return "border-l-orange-500";
                                              case "Emergenza":
                                                return "border-l-red-500";
                                              default:
                                                return "border-l-gray-500";
                                            }
                                          };

                                          const priorityColor =
                                            getPriorityColor(
                                              event.EventPriority || "Normale"
                                            );

                                          return (
                                            <Card
                                              key={`past-${index}`}
                                              className={`p-4 border-l-4 ${priorityColor} bg-gray-900 dark:bg-black text-white border border-gray-700 dark:border-gray-800 hover:shadow-xl hover:bg-gray-800 transition-all duration-200 group`}
                                            >
                                              <div className="space-y-3">
                                                {/* Header evento con icona priorità */}
                                                <div className="flex items-start justify-between">
                                                  <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                      <span className="text-2xl">
                                                        {event.EventPriority ===
                                                          "Normale" && "🟢"}
                                                        {event.EventPriority ===
                                                          "Alta" && "🟡"}
                                                        {event.EventPriority ===
                                                          "Urgente" && "🟠"}
                                                        {event.EventPriority ===
                                                          "Emergenza" && "🔴"}
                                                      </span>
                                                      <div className="flex-1">
                                                        <h4 className="font-semibold text-white text-lg">
                                                          {event.EventTitle ||
                                                            "Evento"}
                                                        </h4>
                                                        <p className="text-gray-300 text-sm">
                                                          {new Date(
                                                            event.EventStartDate
                                                          ).toLocaleDateString(
                                                            "it-IT",
                                                            {
                                                              weekday: "long",
                                                              year: "numeric",
                                                              month: "long",
                                                              day: "numeric",
                                                            }
                                                          )}
                                                        </p>
                                                        <p className="text-gray-400 text-xs">
                                                          {event.EventStartTime ||
                                                            new Date(
                                                              event.EventStartDate
                                                            ).toLocaleTimeString(
                                                              "it-IT",
                                                              {
                                                                hour: "2-digit",
                                                                minute:
                                                                  "2-digit",
                                                              }
                                                            )}{" "}
                                                          -{" "}
                                                          {event.EventEndTime ||
                                                            new Date(
                                                              event.EventEndDate
                                                            ).toLocaleTimeString(
                                                              "it-IT",
                                                              {
                                                                hour: "2-digit",
                                                                minute:
                                                                  "2-digit",
                                                              }
                                                            )}
                                                        </p>
                                                      </div>
                                                    </div>
                                                  </div>
                                                  <div className="flex flex-col gap-2">
                                                    <Chip
                                                      size="sm"
                                                      variant="flat"
                                                      className={`${
                                                        event.EventPriority ===
                                                        "Normale"
                                                          ? "bg-green-900 text-green-100 border-green-700"
                                                          : event.EventPriority ===
                                                            "Alta"
                                                          ? "bg-yellow-900 text-yellow-100 border-yellow-700"
                                                          : event.EventPriority ===
                                                            "Urgente"
                                                          ? "bg-orange-900 text-orange-100 border-orange-700"
                                                          : "bg-red-900 text-red-100 border-red-700"
                                                      }`}
                                                    >
                                                      {event.EventPriority}
                                                    </Chip>
                                                    {event.EventType && (
                                                      <Chip
                                                        size="sm"
                                                        variant="flat"
                                                        className="bg-gray-900 text-gray-100 border-gray-700"
                                                      >
                                                        {event.EventType}
                                                      </Chip>
                                                    )}
                                                  </div>
                                                </div>

                                                {/* Descrizione */}
                                                {event.EventDescription && (
                                                  <div className="p-3 bg-gray-800 dark:bg-gray-900 rounded-lg border border-gray-700 dark:border-gray-800">
                                                    <p className="text-sm text-gray-300 font-medium mb-1">
                                                      Descrizione
                                                    </p>
                                                    <p className="text-white text-sm">
                                                      {event.EventDescription}
                                                    </p>
                                                  </div>
                                                )}

                                                {/* Ubicazione */}
                                                {event.EventLocation && (
                                                  <div className="p-3 bg-gray-800 dark:bg-gray-900 rounded-lg border border-gray-700 dark:border-gray-800">
                                                    <p className="text-sm text-gray-300 font-medium mb-1">
                                                      Ubicazione
                                                    </p>
                                                    <p className="text-white text-sm">
                                                      {event.EventLocation}
                                                    </p>
                                                  </div>
                                                )}

                                                {/* Azioni */}
                                                <div className="flex gap-2 pt-2">
                                                  <Button
                                                    size="sm"
                                                    variant="flat"
                                                    className="bg-gray-600 hover:bg-gray-700 text-white"
                                                    startContent={
                                                      <Icon
                                                        icon="solar:eye-bold"
                                                        width={16}
                                                      />
                                                    }
                                                  >
                                                    Visualizza
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="flat"
                                                    className="bg-gray-600 hover:bg-gray-700 text-white"
                                                    startContent={
                                                      <Icon
                                                        icon="solar:pen-bold"
                                                        width={16}
                                                      />
                                                    }
                                                  >
                                                    Modifica
                                                  </Button>
                                                </div>
                                              </div>
                                            </Card>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-gradient-to-br from-default-50 to-default-100 rounded-xl border-2 border-dashed border-default-300">
                            <Icon
                              icon="solar:calendar-cross-bold"
                              width={48}
                              className="text-default-300 mx-auto mb-3"
                            />
                            <p className="text-lg text-default-600 mb-2 font-medium">
                              Nessun evento calendario
                            </p>
                            <p className="text-sm text-default-500 mb-4">
                              Questo cliente non ha eventi programmati nel
                              calendario
                            </p>
                            <Button
                              size="sm"
                              color="primary"
                              variant="flat"
                              onPress={() => setSelectedTab("overview")}
                              startContent={
                                <Icon
                                  icon="solar:calendar-add-bold"
                                  width={16}
                                />
                              }
                              className="font-medium"
                            >
                              Crea Nuovo Evento
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Separatore */}
                      <div className="border-t border-default-200 my-4"></div>
                    </div>
                  </Tab>
                  <Tab key="references" title="👥 Referenze">
                    {(() => {
                      const refCustomer = customer.referred_by
                        ? customers.find(
                            (c) => c.customer_id === customer.referred_by
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
                      setQuickBookingData((prev) => ({
                        ...prev,
                        problem_description: value,
                      }))
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
                        setQuickBookingData((prev) => ({
                          ...prev,
                          intervention_type: Array.from(keys)[0] as
                            | "inspection"
                            | "repair"
                            | "maintenance"
                            | "installation"
                            | "consultation",
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
                        setQuickBookingData((prev) => ({
                          ...prev,
                          urgency_level: Array.from(keys)[0] as string,
                        }))
                      }
                      size="sm"
                    >
                      <SelectItem key="Normale">🟢 Normale</SelectItem>
                      <SelectItem key="Alta">🟡 Alta</SelectItem>
                      <SelectItem key="Urgente">🟠 Urgente</SelectItem>
                      <SelectItem key="Emergenza">🔴 Emergenza</SelectItem>
                    </Select>
                  </div>

                  {/* Tecnico */}
                  <Select
                    label="Tecnico"
                    selectedKeys={
                      selectedTechnician ? [selectedTechnician] : []
                    }
                    onSelectionChange={(keys) =>
                      setSelectedTechnician(Array.from(keys)[0] as string)
                    }
                    size="sm"
                  >
                    {technicians.map((tech) => (
                      <SelectItem key={tech.technician_id}>
                        {tech.name}
                      </SelectItem>
                    ))}
                  </Select>

                  {/* Ubicazione */}
                  <Input
                    label="Ubicazione Specifica"
                    placeholder="Es: Piano terra, garage..."
                    value={quickBookingData.location || ""}
                    onValueChange={(value) =>
                      setQuickBookingData((prev) => ({
                        ...prev,
                        location: value,
                      }))
                    }
                    size="sm"
                    startContent={
                      <Icon icon="solar:map-point-bold" width={16} />
                    }
                  />

                  {/* Note */}
                  <Textarea
                    label="Note per il tecnico"
                    placeholder="Istruzioni speciali, materiali necessari..."
                    value={quickBookingData.notes || ""}
                    onValueChange={(value) =>
                      setQuickBookingData((prev) => ({ ...prev, notes: value }))
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
                        <div>
                          <strong>Cliente:</strong> {customer.name}{" "}
                          {customer.surname}
                        </div>
                        <div>
                          <strong>Problema:</strong>{" "}
                          {quickBookingData.problem_description}
                        </div>
                        <div>
                          <strong>Tipo:</strong>{" "}
                          {quickBookingData.intervention_type}
                        </div>
                        <div>
                          <strong>Urgenza:</strong>{" "}
                          {quickBookingData.urgency_level}
                        </div>
                        {selectedTechnician && (
                          <div>
                            <strong>Tecnico:</strong>{" "}
                            {
                              technicians.find(
                                (t) => t.technician_id === selectedTechnician
                              )?.name
                            }
                          </div>
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
                    isDisabled={
                      !quickBookingData.problem_description.trim() ||
                      !selectedTechnician
                    }
                    startContent={
                      <Icon icon="solar:calendar-search-bold" width={20} />
                    }
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
                      startContent={
                        <Icon icon="solar:letter-bold" width={16} />
                      }
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
                      {new Date(customer.created_at).toLocaleDateString(
                        "it-IT"
                      )}
                    </span>
                  </div>

                  {customer.last_intervention_date && (
                    <div className="flex justify-between">
                      <span className="text-default-500">
                        Ultimo intervento:
                      </span>
                      <span className="font-medium">
                        {new Date(
                          customer.last_intervention_date
                        ).toLocaleDateString("it-IT")}
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
                    <span className="text-default-500">
                      Contatto preferito:
                    </span>
                    <span className="font-medium capitalize">
                      {customer.preferred_contact_method}
                    </span>
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
