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
    navigate(`/calendar/new?${bookingParams.toString()}`);
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
    <div className="w-full flex flex-col p-4 gap-6 min-h-screen">
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

      {/* Search and Customer List */}
      {!selectedCustomer && (
        <div className="space-y-6">
          {/* Enhanced Search */}
          <Card>
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

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-default-600">
                      {searchResults.length} risultati trovati
                    </p>
                    <div className="grid gap-2">
                      {searchResults.map((result) => (
                        <Card
                          key={result.customer.customer_id}
                          isPressable
                          onPress={() => selectCustomer(result)}
                          className="hover:shadow-md transition-shadow"
                        >
                          <CardBody className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar
                                  name={`${result.customer.name.charAt(
                                    0
                                  )}${result.customer.surname.charAt(0)}`}
                                  size="sm"
                                  className="bg-primary text-white"
                                />
                                <div>
                                  <p className="font-medium">
                                    {result.customer.name}{" "}
                                    {result.customer.surname}
                                  </p>
                                  <p className="text-sm text-default-600">
                                    {result.customer.phone} •{" "}
                                    {result.customer.city}
                                  </p>
                                  <p className="text-xs text-default-500">
                                    {result.match_reasons.join(", ")}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Chip
                                  size="sm"
                                  color={
                                    customerTypeColorMap[
                                      result.customer.customer_type
                                    ]
                                  }
                                  variant="flat"
                                >
                                  {result.customer.customer_type === "private"
                                    ? "Privato"
                                    : "Azienda"}
                                </Chip>
                                <Chip
                                  size="sm"
                                  color={statusColorMap[result.customer.status]}
                                  variant="flat"
                                >
                                  {result.customer.status === "active"
                                    ? "Attivo"
                                    : "Inattivo"}
                                </Chip>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Customer Grid - when no search */}
          {searchQuery === "" && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">
                  Tutti i Clienti ({customers.length})
                </h3>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customers.map((customer) => (
                    <Card
                      key={customer.customer_id}
                      isPressable
                      onPress={() => selectCustomer(customer)}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardBody className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={`${customer.name.charAt(
                                0
                              )}${customer.surname.charAt(0)}`}
                              size="md"
                              className="bg-primary text-white"
                            />
                            <div className="flex-1">
                              <p className="font-medium">
                                {customer.name} {customer.surname}
                              </p>
                              <p className="text-sm text-default-600">
                                {customer.phone}
                              </p>
                            </div>
                            <Chip
                              size="sm"
                              color={statusColorMap[customer.status]}
                              variant="flat"
                            >
                              {customer.status === "active"
                                ? "Attivo"
                                : "Inattivo"}
                            </Chip>
                          </div>

                          <div className="text-sm text-default-600">
                            <p>{customer.address}</p>
                            <p>{customer.city}</p>
                          </div>

                          <div className="flex items-center justify-between">
                            <Chip
                              size="sm"
                              color={
                                customerTypeColorMap[customer.customer_type]
                              }
                              variant="flat"
                            >
                              {customer.customer_type === "private"
                                ? "Privato"
                                : "Azienda"}
                            </Chip>
                            {customer.last_intervention_date && (
                              <p className="text-xs text-default-500">
                                Ultimo:{" "}
                                {customer.last_intervention_date.toLocaleDateString(
                                  "it-IT"
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* Customer Dashboard */}
      {selectedCustomer && (
        <div className="space-y-6">
          {/* Back to List */}
          <div className="flex items-center gap-3">
            <Button
              variant="light"
              startContent={<Icon icon="solar:arrow-left-bold" width={16} />}
              onPress={() => setSelectedCustomer(null)}
            >
              Torna alla Lista
            </Button>
            <Divider orientation="vertical" className="h-6" />
            <p className="text-sm text-default-600">Dashboard Cliente</p>
          </div>

          {/* Customer Header */}
          <Card>
            <CardBody className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar
                    name={`${selectedCustomer.name.charAt(
                      0
                    )}${selectedCustomer.surname.charAt(0)}`}
                    size="lg"
                    className="bg-primary text-white text-xl"
                  />
                  <div>
                    <h2 className="text-2xl font-bold">
                      {selectedCustomer.name} {selectedCustomer.surname}
                    </h2>
                    {selectedCustomer.company_name && (
                      <p className="text-lg text-primary font-medium">
                        {selectedCustomer.company_name}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Chip
                        color={statusColorMap[selectedCustomer.status]}
                        variant="flat"
                        size="sm"
                      >
                        {selectedCustomer.status === "active"
                          ? "Cliente Attivo"
                          : "Cliente Inattivo"}
                      </Chip>
                      <Chip
                        color={
                          customerTypeColorMap[selectedCustomer.customer_type]
                        }
                        variant="flat"
                        size="sm"
                      >
                        {selectedCustomer.customer_type === "private"
                          ? "Privato"
                          : "Azienda"}
                      </Chip>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="flat"
                    size="sm"
                    startContent={<Icon icon="solar:phone-bold" width={16} />}
                  >
                    <a href={`tel:${selectedCustomer.phone}`}>Chiama</a>
                  </Button>
                  {selectedCustomer.email && (
                    <Button
                      variant="flat"
                      size="sm"
                      startContent={
                        <Icon icon="solar:letter-bold" width={16} />
                      }
                    >
                      <a href={`mailto:${selectedCustomer.email}`}>Email</a>
                    </Button>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer Info & Stats */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats */}
              {customerStats && (
                <Card>
                  <CardHeader>
                    <h4 className="font-semibold">Statistiche Cliente</h4>
                  </CardHeader>
                  <CardBody>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-primary-50 rounded-lg">
                        <p className="text-2xl font-bold text-primary">
                          {customerStats.totalInterventions}
                        </p>
                        <p className="text-sm text-default-600">
                          Interventi Totali
                        </p>
                      </div>
                      <div className="text-center p-3 bg-success-50 rounded-lg">
                        <p className="text-2xl font-bold text-success">
                          €{customerStats.totalSpent.toFixed(0)}
                        </p>
                        <p className="text-sm text-default-600">Spesa Totale</p>
                      </div>
                      <div className="text-center p-3 bg-warning-50 rounded-lg">
                        <p className="text-2xl font-bold text-warning">
                          €{customerStats.averagePerIntervention.toFixed(0)}
                        </p>
                        <p className="text-sm text-default-600">
                          Media per Intervento
                        </p>
                      </div>
                      <div className="text-center p-3 bg-default-50 rounded-lg">
                        <p className="text-lg font-bold text-default-600">
                          {Math.floor(
                            (new Date().getTime() -
                              customerStats.customerSince.getTime()) /
                              (1000 * 60 * 60 * 24)
                          )}
                        </p>
                        <p className="text-sm text-default-600">
                          Giorni Cliente
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Customer Details Tabs */}
              <Card>
                <CardHeader>
                  <h4 className="font-semibold">Dettagli Cliente</h4>
                </CardHeader>
                <CardBody>
                  <Tabs
                    selectedKey={selectedTab}
                    onSelectionChange={(key) => setSelectedTab(key as string)}
                    fullWidth
                  >
                    <Tab key="overview" title="Panoramica">
                      <div className="space-y-4 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-default-500 text-sm">
                              Indirizzo
                            </p>
                            <p className="font-medium">
                              {selectedCustomer.address}
                            </p>
                            <p className="font-medium">
                              {selectedCustomer.city},{" "}
                              {selectedCustomer.zip_code}
                            </p>
                          </div>
                          <div>
                            <p className="text-default-500 text-sm">Contatti</p>
                            <p className="font-medium">
                              {selectedCustomer.phone}
                            </p>
                            {selectedCustomer.email && (
                              <p className="font-medium">
                                {selectedCustomer.email}
                              </p>
                            )}
                          </div>
                        </div>
                        {selectedCustomer.notes && (
                          <div>
                            <p className="text-default-500 text-sm">Note</p>
                            <p className="font-medium">
                              {selectedCustomer.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </Tab>
                    <Tab key="interventions" title="Interventi">
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
                    <Tab key="payments" title="Pagamenti">
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
                  </Tabs>
                </CardBody>
              </Card>
            </div>

            {/* Enhanced Sidebar - Focused on Data Collection */}
            <div className="space-y-6">
              {/* Booking Preparation Form */}
              <Card>
                <CardHeader>
                  <h4 className="font-semibold flex items-center gap-2">
                    <Icon icon="solar:calendar-add-bold" width={20} />
                    Prepara Appuntamento
                  </h4>
                </CardHeader>
                <CardBody>
                  <div className="space-y-4">
                    {/* Customer Info Display */}
                    <div className="p-3 bg-primary-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon
                          icon="solar:user-bold"
                          width={16}
                          className="text-primary"
                        />
                        <span className="font-medium text-sm">
                          {selectedCustomer.name} {selectedCustomer.surname}
                        </span>
                      </div>
                      <div className="text-xs text-default-600 space-y-1">
                        <div className="flex items-center gap-1">
                          <Icon icon="solar:phone-bold" width={12} />
                          <span>{selectedCustomer.phone}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Icon icon="solar:map-point-bold" width={12} />
                          <span>
                            {selectedCustomer.address}, {selectedCustomer.city}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Problem Description */}
                    <Textarea
                      label="Descrizione Problema *"
                      placeholder="Descrivi il problema del cliente..."
                      value={quickBookingData.problem_description}
                      onValueChange={(value) =>
                        setQuickBookingData((prev) => ({
                          ...prev,
                          problem_description: value,
                        }))
                      }
                      rows={3}
                      isRequired
                    />

                    {/* Intervention Type and Urgency */}
                    <div className="grid grid-cols-2 gap-3">
                      <Select
                        label="Tipo"
                        selectedKeys={[quickBookingData.intervention_type]}
                        onSelectionChange={(keys) => {
                          const type = Array.from(keys)[0] as
                            | "inspection"
                            | "repair"
                            | "maintenance"
                            | "installation"
                            | "consultation";
                          setQuickBookingData((prev) => ({
                            ...prev,
                            intervention_type: type,
                          }));
                        }}
                        size="sm"
                      >
                        <SelectItem key="inspection">Sopralluogo</SelectItem>
                        <SelectItem key="repair">Riparazione</SelectItem>
                        <SelectItem key="maintenance">Manutenzione</SelectItem>
                        <SelectItem key="installation">
                          Installazione
                        </SelectItem>
                        <SelectItem key="consultation">Consulenza</SelectItem>
                      </Select>

                      <Select
                        label="Urgenza"
                        selectedKeys={[quickBookingData.urgency_level]}
                        onSelectionChange={(keys) => {
                          const level = Array.from(keys)[0] as
                            | "low"
                            | "medium"
                            | "high"
                            | "emergency";
                          setQuickBookingData((prev) => ({
                            ...prev,
                            urgency_level: level,
                          }));
                        }}
                        size="sm"
                      >
                        <SelectItem key="low">Bassa</SelectItem>
                        <SelectItem key="medium">Media</SelectItem>
                        <SelectItem key="high">Alta</SelectItem>
                        <SelectItem key="emergency">Emergenza</SelectItem>
                      </Select>
                    </div>

                    {/* Technician Assignment */}
                    <Select
                      label="Tecnico Preferito"
                      placeholder="Seleziona tecnico..."
                      selectedKeys={
                        selectedTechnician ? [selectedTechnician] : []
                      }
                      onSelectionChange={(keys) => {
                        const techId = Array.from(keys)[0] as string;
                        setSelectedTechnician(techId);
                      }}
                      size="sm"
                      startContent={<Icon icon="solar:user-bold" width={16} />}
                    >
                      {technicians.map((tech) => (
                        <SelectItem
                          key={tech.technician_id}
                          textValue={tech.name}
                          className={
                            tech.technician_id ===
                            selectedCustomer.preferred_technician_id
                              ? "bg-success-50"
                              : ""
                          }
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm">{tech.name}</span>
                              <div className="text-xs text-default-500">
                                {tech.role}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Chip
                                size="sm"
                                variant="flat"
                                color={
                                  tech.availability_status === "available"
                                    ? "success"
                                    : tech.availability_status === "busy"
                                    ? "warning"
                                    : "danger"
                                }
                              >
                                {tech.availability_status === "available"
                                  ? "Libero"
                                  : tech.availability_status === "busy"
                                  ? "Occupato"
                                  : "Non Disponibile"}
                              </Chip>
                              {tech.technician_id ===
                                selectedCustomer.preferred_technician_id && (
                                <Icon
                                  icon="solar:star-bold"
                                  width={12}
                                  className="text-warning"
                                />
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </Select>

                    {/* Duration */}
                    <Input
                      label="Durata Stimata (minuti)"
                      type="number"
                      value={
                        quickBookingData.estimated_duration?.toString() || "60"
                      }
                      onValueChange={(value) =>
                        setQuickBookingData((prev) => ({
                          ...prev,
                          estimated_duration: parseInt(value) || 60,
                        }))
                      }
                      min={15}
                      max={480}
                      step={15}
                      size="sm"
                      startContent={<Icon icon="solar:timer-bold" width={16} />}
                    />

                    {/* Location Override */}
                    <Input
                      label="Indirizzo (se diverso)"
                      placeholder="Lascia vuoto per usare indirizzo cliente"
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

                    {/* Notes */}
                    <Textarea
                      label="Note per il tecnico"
                      placeholder="Istruzioni speciali, materiali necessari, ecc..."
                      value={quickBookingData.notes || ""}
                      onValueChange={(value) =>
                        setQuickBookingData((prev) => ({
                          ...prev,
                          notes: value,
                        }))
                      }
                      rows={2}
                      size="sm"
                    />

                    {/* Booking Summary */}
                    {quickBookingData.problem_description && (
                      <div className="p-3 bg-default-50 rounded-lg">
                        <div className="text-sm font-medium mb-2">
                          Riepilogo Preparazione:
                        </div>
                        <div className="text-xs space-y-1 text-default-600">
                          <div>
                            <strong>Cliente:</strong> {selectedCustomer.name}{" "}
                            {selectedCustomer.surname}
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
                          <div>
                            <strong>Durata:</strong>{" "}
                            {quickBookingData.estimated_duration} min
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

                    {/* Navigation Button */}
                    <Button
                      color="primary"
                      className="w-full"
                      onPress={handleBookingNavigation}
                      isDisabled={!quickBookingData.problem_description.trim()}
                      startContent={
                        <Icon icon="solar:calendar-search-bold" width={16} />
                      }
                    >
                      Apri Calendario per Prenotare
                    </Button>

                    <div className="text-xs text-default-500 text-center">
                      💡 Ti porteremo al calendario con tutti i dati già pronti
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Contatti Rapidi */}
              <Card>
                <CardHeader>
                  <h4 className="font-semibold flex items-center gap-2">
                    <Icon icon="solar:phone-bold" width={20} />
                    Contatti
                  </h4>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-2 bg-default-50 rounded">
                      <Icon
                        icon="solar:phone-bold"
                        width={16}
                        className="text-primary"
                      />
                      <a
                        href={`tel:${selectedCustomer.phone}`}
                        className="text-sm font-medium text-primary hover:text-primary-600"
                      >
                        {selectedCustomer.phone}
                      </a>
                    </div>

                    {selectedCustomer.email && (
                      <div className="flex items-center gap-2 p-2 bg-default-50 rounded">
                        <Icon
                          icon="solar:letter-bold"
                          width={16}
                          className="text-primary"
                        />
                        <a
                          href={`mailto:${selectedCustomer.email}`}
                          className="text-sm font-medium text-primary hover:text-primary-600 truncate"
                        >
                          {selectedCustomer.email}
                        </a>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>

              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <h4 className="font-semibold flex items-center gap-2">
                    <Icon icon="solar:info-circle-bold" width={20} />
                    Informazioni
                  </h4>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-default-500">Cliente dal:</p>
                      <p className="font-medium">
                        {new Date(
                          selectedCustomer.created_at
                        ).toLocaleDateString("it-IT")}
                      </p>
                    </div>

                    {selectedCustomer.last_intervention_date && (
                      <div>
                        <p className="text-default-500">Ultimo intervento:</p>
                        <p className="font-medium">
                          {new Date(
                            selectedCustomer.last_intervention_date
                          ).toLocaleDateString("it-IT")}
                        </p>
                      </div>
                    )}

                    {selectedCustomer.vat_number && (
                      <div>
                        <p className="text-default-500">Partita IVA:</p>
                        <p className="font-medium">
                          {selectedCustomer.vat_number}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="text-default-500">
                        Metodo contatto preferito:
                      </p>
                      <p className="font-medium capitalize">
                        {selectedCustomer.preferred_contact_method}
                      </p>
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
