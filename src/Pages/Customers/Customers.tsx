import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Input,
  Select,
  SelectItem,
  Tab,
  Tabs,
  Textarea,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../Components/Layout/PageHeader";
import type {
  Customer,
  CustomerSearchResult,
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

export default function Customers() {
  const navigate = useNavigate();

  // State principale
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CustomerSearchResult[]>(
    []
  );
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
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

  // Load data
  useEffect(() => {
    loadMockData();
  }, []);

  // Intelligent search function
  const performSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    // Assicuriamoci che customers sia sempre un array
    if (!Array.isArray(customers)) {
      console.warn("customers non è un array in performSearch:", customers);
      setSearchResults([]);
      return;
    }

    // Simulate API search with enhanced results
    const results: CustomerSearchResult[] = customers
      .filter(
        (customer) =>
          customer.name.toLowerCase().includes(query.toLowerCase()) ||
          customer.surname.toLowerCase().includes(query.toLowerCase()) ||
          customer.phone.includes(query) ||
          customer.email?.toLowerCase().includes(query.toLowerCase()) ||
          customer.address.toLowerCase().includes(query.toLowerCase()) ||
          customer.city.toLowerCase().includes(query.toLowerCase())
      )
      .map((customer) => ({
        customer: customer,
        match_score: Math.random() * 100,
        match_reasons: [
          query.includes("@")
            ? "Email"
            : query.match(/^\+?\d/)
            ? "Telefono"
            : "Nome",
        ],
      }))
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 10);

    setSearchResults(results);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    performSearch(query);
  };

  const selectCustomer = (customer: Customer | CustomerSearchResult) => {
    // Convert CustomerSearchResult to Customer if needed
    const fullCustomer: Customer =
      "customer" in customer ? customer.customer : customer;

    setSelectedCustomer(fullCustomer);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Enhanced booking handler - Navigate to calendar with pre-filled data
  const handleBookingNavigation = () => {
    if (!selectedCustomer || !quickBookingData.problem_description.trim()) {
      return;
    }

    // Prepare booking data for calendar
    const bookingParams = new URLSearchParams({
      // Customer data
      customer_id: selectedCustomer.customer_id,
      customer_name: `${selectedCustomer.name} ${selectedCustomer.surname}`,
      customer_phone: selectedCustomer.phone,
      customer_email: selectedCustomer.email || "",
      customer_address: `${selectedCustomer.address}, ${selectedCustomer.city}`,

      // Booking details
      problem_description: quickBookingData.problem_description,
      intervention_type: quickBookingData.intervention_type,
      urgency_level: quickBookingData.urgency_level,
      estimated_duration:
        quickBookingData.estimated_duration?.toString() || "60",
      notes: quickBookingData.notes || "",
      location:
        quickBookingData.location ||
        `${selectedCustomer.address}, ${selectedCustomer.city}`,

      // Technician
      assigned_technician: selectedTechnician,
      preferred_technician: selectedCustomer.preferred_technician_id || "",

      // System data
      preferred_contact_method:
        selectedCustomer.preferred_contact_method || "phone",
      customer_type: selectedCustomer.customer_type,

      // Booking flow identifier
      from_ccc: "true",
    });

    // Navigate to calendar with all the data
    navigate(`/calendar?${bookingParams.toString()}`);
  };

  // Update booking data when customer changes
  useEffect(() => {
    if (selectedCustomer) {
      setQuickBookingData((prev) => ({
        ...prev,
        customer_id: selectedCustomer.customer_id,
        location: `${selectedCustomer.address}, ${selectedCustomer.city}`,
      }));

      // Pre-select preferred technician if available
      if (selectedCustomer.preferred_technician_id) {
        setSelectedTechnician(selectedCustomer.preferred_technician_id);
      }
    }
  }, [selectedCustomer]);

  const loadMockData = async () => {
    setLoading(true);

    try {
      const response = await axios.get("Customer/GET/GetAllCustomers");
      console.log("API Response:", response.data);

      // Assicuriamoci che customers sia sempre un array
      let customers: Customer[] = [];

      if (Array.isArray(response.data)) {
        customers = response.data;
      } else if (response.data && typeof response.data === "object") {
        // Se la risposta è un oggetto singolo, lo convertiamo in array
        if (response.data.customer_id) {
          customers = [response.data];
        } else if (response.data.customers) {
          // Se la risposta ha una proprietà 'customers'
          customers = Array.isArray(response.data.customers)
            ? response.data.customers
            : [];
        } else if (response.data.data) {
          // Se la risposta ha una proprietà 'data'
          customers = Array.isArray(response.data.data)
            ? response.data.data
            : [];
        }
      }

      console.log("Processed customers:", customers);

      // Mock technicians data
      const mockTechnicians: Technician[] = [
        {
          technician_id: "1",
          user_id: "1",
          name: "Marco Fontana",
          role: "Tecnico Senior",
          status: "active",
          specializations: [
            {
              specialization_id: "1",
              name: "Climatizzazione",
              category: "hvac",
              skill_level: "expert",
            },
            {
              specialization_id: "2",
              name: "Riscaldamento",
              category: "hvac",
              skill_level: "advanced",
            },
          ],
          skill_level: "senior",
          availability_status: "available",
          phone: "+39 320 1111111",
          email: "marco.fontana@company.com",
          profile_image: "",
          created_at: new Date(),
          updated_at: new Date(),
          working_hours: {
            monday: {
              is_working_day: true,
              start_time: "08:00",
              end_time: "17:00",
            },
            tuesday: {
              is_working_day: true,
              start_time: "08:00",
              end_time: "17:00",
            },
            wednesday: {
              is_working_day: true,
              start_time: "08:00",
              end_time: "17:00",
            },
            thursday: {
              is_working_day: true,
              start_time: "08:00",
              end_time: "17:00",
            },
            friday: {
              is_working_day: true,
              start_time: "08:00",
              end_time: "17:00",
            },
            saturday: { is_working_day: false },
            sunday: { is_working_day: false },
          },
        },
        {
          technician_id: "2",
          user_id: "2",
          name: "Andrea Lombardi",
          role: "Tecnico Specializzato",
          status: "active",
          specializations: [
            {
              specialization_id: "3",
              name: "Idraulica",
              category: "plumbing",
              skill_level: "expert",
            },
            {
              specialization_id: "4",
              name: "Elettricità",
              category: "electrical",
              skill_level: "advanced",
            },
          ],
          skill_level: "senior",
          availability_status: "busy",
          phone: "+39 320 2222222",
          email: "andrea.lombardi@company.com",
          profile_image: "",
          created_at: new Date(),
          updated_at: new Date(),
          working_hours: {
            monday: {
              is_working_day: true,
              start_time: "08:00",
              end_time: "17:00",
            },
            tuesday: {
              is_working_day: true,
              start_time: "08:00",
              end_time: "17:00",
            },
            wednesday: {
              is_working_day: true,
              start_time: "08:00",
              end_time: "17:00",
            },
            thursday: {
              is_working_day: true,
              start_time: "08:00",
              end_time: "17:00",
            },
            friday: {
              is_working_day: true,
              start_time: "08:00",
              end_time: "17:00",
            },
            saturday: { is_working_day: false },
            sunday: { is_working_day: false },
          },
        },
        {
          technician_id: "3",
          user_id: "3",
          name: "Simone Ricci",
          role: "Tecnico Junior",
          status: "active",
          specializations: [
            {
              specialization_id: "5",
              name: "Manutenzione Generale",
              category: "other",
              skill_level: "intermediate",
            },
          ],
          skill_level: "junior",
          availability_status: "offline",
          phone: "+39 320 3333333",
          email: "simone.ricci@company.com",
          profile_image: "",
          created_at: new Date(),
          updated_at: new Date(),
          working_hours: {
            monday: {
              is_working_day: true,
              start_time: "08:00",
              end_time: "17:00",
            },
            tuesday: {
              is_working_day: true,
              start_time: "08:00",
              end_time: "17:00",
            },
            wednesday: {
              is_working_day: true,
              start_time: "08:00",
              end_time: "17:00",
            },
            thursday: {
              is_working_day: true,
              start_time: "08:00",
              end_time: "17:00",
            },
            friday: {
              is_working_day: true,
              start_time: "08:00",
              end_time: "17:00",
            },
            saturday: { is_working_day: false },
            sunday: { is_working_day: false },
          },
        },
      ];

      setCustomers(customers);
      setTechnicians(mockTechnicians);
    } catch (error) {
      console.error("Errore nel caricamento dei clienti:", error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for tabs
  const mockInterventions: InterventionSummary[] = [
    {
      intervention_id: "1",
      date: new Date("2024-11-15"),
      type: "Riparazione",
      problem_description: "Riparazione perdita rubinetto cucina",
      technician_name: "Marco Fontana",
      status: "completed",
      cost: 85.0,
    },
    {
      intervention_id: "2",
      date: new Date("2024-10-20"),
      type: "Manutenzione",
      problem_description: "Controllo caldaia annuale",
      technician_name: "Andrea Lombardi",
      status: "completed",
      cost: 120.0,
    },
  ];

  const mockPayments: PaymentSummary[] = [
    {
      payment_id: "1",
      intervention_id: "1",
      date: new Date("2024-11-16"),
      amount: 85.0,
      method: "card",
      status: "paid",
      invoice_number: "INV-2024-001",
    },
    {
      payment_id: "2",
      intervention_id: "2",
      date: new Date("2024-10-21"),
      amount: 120.0,
      method: "bank_transfer",
      status: "paid",
      invoice_number: "INV-2024-002",
    },
  ];

  // Computed values
  const filteredCustomers = useMemo(() => {
    // Assicuriamoci che customers sia sempre un array
    if (!Array.isArray(customers)) {
      console.warn("customers non è un array:", customers);
      return [];
    }

    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.surname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.includes(searchQuery) ||
        customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [customers, searchQuery]);

  const customerStats = useMemo(() => {
    if (!selectedCustomer) return null;

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
      lastInterventionDate: selectedCustomer.last_intervention_date,
      customerSince: new Date(selectedCustomer.created_at),
    };
  }, [selectedCustomer]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-default-600">Caricamento clienti...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 min-h-screen">
      <PageHeader
        title="Customer Control Center"
        description="Centro di controllo completo per la gestione clienti e prenotazioni"
        icon="solar:users-group-two-rounded-bold-duotone"
        size="md"
        actions={[
          {
            label: "Nuovo Cliente",
            icon: "solar:user-plus-bold",
            color: "primary",
            variant: "solid",
            onClick: () => navigate("/customers/add"),
          },
        ]}
      />

      {/* SEZIONE 1: RICERCA CLIENTE */}
      <div className="px-6">
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Icon icon="solar:magnifer-bold" width={20} />
              <h3 className="text-lg font-semibold">Ricerca Cliente</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <Input
                placeholder="Cerca per nome, cognome, telefono, email..."
                value={searchQuery}
                onValueChange={handleSearch}
                startContent={<Icon icon="solar:magnifer-bold" width={20} />}
                size="lg"
                isClearable
                onClear={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
              />

              {/* Risultati Ricerca */}
              {searchResults.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-default-600 font-medium">
                    {searchResults.length} risultati trovati
                  </p>
                  <div className="grid gap-3 max-h-96 overflow-y-auto">
                    {searchResults.map((result) => (
                      <Card
                        key={result.customer.customer_id}
                        isPressable
                        onPress={() => selectCustomer(result)}
                        className="hover:shadow-md transition-all duration-200 border-l-4 border-l-primary"
                      >
                        <CardBody className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar
                                name={`${result.customer.name.charAt(0)}${result.customer.surname.charAt(0)}`}
                                size="md"
                                className="bg-primary text-white"
                              />
                              <div>
                                <p className="font-semibold text-base">
                                  {result.customer.name} {result.customer.surname}
                                </p>
                                <p className="text-sm text-default-600">
                                  📞 {result.customer.phone} • 📍 {result.customer.city}
                                </p>
                                <p className="text-xs text-primary">
                                  Corrispondenza: {result.match_reasons.join(", ")}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Chip
                                size="sm"
                                color={customerTypeColorMap[result.customer.customer_type]}
                                variant="flat"
                                className="font-medium"
                              >
                                {result.customer.customer_type === "private" ? "Privato" : "Azienda"}
                              </Chip>
                              <Chip
                                size="sm"
                                color={statusColorMap[result.customer.status]}
                                variant="flat"
                              >
                                {result.customer.status === "active" ? "Attivo" : "Inattivo"}
                              </Chip>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Nessun risultato */}
              {searchQuery && searchResults.length === 0 && (
                <div className="text-center py-8">
                  <Icon icon="solar:user-cross-bold" width={48} className="text-default-300 mx-auto mb-2" />
                  <p className="text-default-500">Nessun cliente trovato</p>
                  <p className="text-sm text-default-400">Prova con un altro termine di ricerca</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* SEZIONE 2: DETTAGLI CLIENTE (solo se selezionato) */}
      {selectedCustomer && (
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
                        name={`${selectedCustomer.name.charAt(0)}${selectedCustomer.surname.charAt(0)}`}
                        size="lg"
                        className="bg-primary text-white text-xl"
                      />
                      <div>
                        <h2 className="text-2xl font-bold text-primary-800">
                          {selectedCustomer.name} {selectedCustomer.surname}
                        </h2>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-primary-600 font-medium">
                            📞 {selectedCustomer.phone}
                          </p>
                          {selectedCustomer.email && (
                            <p className="text-primary-600 font-medium">
                              ✉️ {selectedCustomer.email}
                            </p>
                          )}
                        </div>
                        <p className="text-primary-600 mt-1">
                          📍 {selectedCustomer.address}, {selectedCustomer.city} {selectedCustomer.zip_code}
                        </p>
                      </div>
                    </div>
                    <Button
                      color="danger"
                      variant="light"
                      onPress={() => setSelectedCustomer(null)}
                      isIconOnly
                    >
                      <Icon icon="solar:close-circle-bold" width={20} />
                    </Button>
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
                            <p className="font-medium">{selectedCustomer.address}</p>
                            <p className="font-medium">{selectedCustomer.city}, {selectedCustomer.zip_code}</p>
                          </div>
                          <div className="p-4 bg-default-50 rounded-lg">
                            <h5 className="font-medium text-default-700 mb-2">📞 Contatti</h5>
                            <p className="font-medium">{selectedCustomer.phone}</p>
                            {selectedCustomer.email && (
                              <p className="font-medium">{selectedCustomer.email}</p>
                            )}
                          </div>
                        </div>
                        {selectedCustomer.notes && (
                          <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
                            <h5 className="font-medium text-warning-700 mb-2">📝 Note</h5>
                            <p className="text-warning-800">{selectedCustomer.notes}</p>
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
                        const refCustomer = selectedCustomer.referred_by
                          ? customers.find(
                              (c) =>
                                c.customer_id === selectedCustomer.referred_by
                            )
                          : null;
                        const segnalati = customers.filter(
                          (c) => c.referred_by === selectedCustomer.customer_id
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
                          <div><strong>Cliente:</strong> {selectedCustomer.name} {selectedCustomer.surname}</div>
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
                      onPress={() => window.open(`tel:${selectedCustomer.phone}`)}
                    >
                      Chiama {selectedCustomer.phone}
                    </Button>
                    
                    {selectedCustomer.email && (
                      <Button
                        variant="flat"
                        color="primary"
                        className="w-full justify-start"
                        startContent={<Icon icon="solar:letter-bold" width={16} />}
                        onPress={() => window.open(`mailto:${selectedCustomer.email}`)}
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
                        {new Date(selectedCustomer.created_at).toLocaleDateString("it-IT")}
                      </span>
                    </div>
                    
                    {selectedCustomer.last_intervention_date && (
                      <div className="flex justify-between">
                        <span className="text-default-500">Ultimo intervento:</span>
                        <span className="font-medium">
                          {new Date(selectedCustomer.last_intervention_date).toLocaleDateString("it-IT")}
                        </span>
                      </div>
                    )}
                    
                    {selectedCustomer.vat_number && (
                      <div className="flex justify-between">
                        <span className="text-default-500">P.IVA:</span>
                        <span className="font-medium">{selectedCustomer.vat_number}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-default-500">Contatto preferito:</span>
                      <span className="font-medium capitalize">{selectedCustomer.preferred_contact_method}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
