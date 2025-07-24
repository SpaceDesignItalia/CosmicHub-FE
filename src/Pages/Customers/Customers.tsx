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
    <div className="w-full flex flex-col gap-6 min-h-screen p-6">
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
          </CardBody>
        </Card>
      </div>

      {/* SEZIONE 2: GRIGLIA CLIENTI */}
      <div className="px-6">
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon icon="solar:users-group-rounded-bold" width={20} />
                <h3 className="text-lg font-semibold">
                  {searchQuery ? 
                    `Risultati ricerca (${searchResults.length})` : 
                    `Tutti i clienti (${customers.length})`
                  }
                </h3>
              </div>
              {searchQuery && (
                <Button
                  variant="light"
                  size="sm"
                  onPress={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  startContent={<Icon icon="solar:close-circle-bold" width={16} />}
                >
                  Cancella ricerca
                </Button>
              )}
            </div>
          </CardHeader>
          <CardBody>
            {/* Griglia di card clienti */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(searchQuery ? searchResults.map(r => r.customer) : customers).map((customer) => (
                <Card
                  key={customer.customer_id}
                  isPressable
                  onPress={() => navigate(`/customers/${customer.customer_id}`)}
                  className="group bg-white/5 backdrop-blur-lg border border-default-200 rounded-xl transition-shadow hover:shadow-xl cursor-pointer"
                >
                  <CardBody className="p-4">
                    <div className="flex flex-col items-center text-center space-y-3">
                      {/* Avatar */}
                      <Avatar
                        name={`${customer.name.charAt(0)}${customer.surname.charAt(0)}`}
                        size="lg"
                        className="bg-primary text-white text-xl ring-4 ring-primary/30 group-hover:ring-primary/50 transition-all"
                      />
                      
                      {/* Nome e cognome */}
                      <div>
                        <h4 className="font-bold text-lg text-foreground">
                          {customer.name} {customer.surname}
                        </h4>
                        <p className="text-sm text-default-600">
                          {customer.customer_type === "private" ? "Cliente Privato" : "Cliente Business"}
                        </p>
                      </div>
                      
                      {/* Informazioni principali */}
                      <div className="w-full space-y-2">
                        <div className="flex items-center justify-center gap-2 text-sm text-default-600">
                          <Icon icon="solar:phone-bold" width={16} />
                          <span className="truncate">{customer.phone}</span>
                        </div>
                        
                        {customer.email && (
                          <div className="flex items-center justify-center gap-2 text-sm text-default-600">
                            <Icon icon="solar:letter-bold" width={16} />
                            <span className="truncate">{customer.email}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-center gap-2 text-sm text-default-600">
                          <Icon icon="solar:map-point-bold" width={16} />
                          <span className="truncate">{customer.city}</span>
                        </div>
                      </div>
                      
                      {/* Badge status */}
                      <div className="flex gap-2">
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
              ))}
            </div>
            
            {/* Nessun cliente trovato */}
            {searchQuery && searchResults.length === 0 && (
              <div className="text-center py-12">
                <Icon icon="solar:user-cross-bold" width={64} className="text-default-300 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-default-600 mb-2">Nessun cliente trovato</h4>
                <p className="text-default-400">Prova con un altro termine di ricerca</p>
              </div>
            )}
            
            {/* Nessun cliente in generale */}
            {!searchQuery && customers.length === 0 && (
              <div className="text-center py-12">
                <Icon icon="solar:users-group-rounded-bold" width={64} className="text-default-300 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-default-600 mb-2">Nessun cliente presente</h4>
                <p className="text-default-400 mb-4">Inizia aggiungendo il tuo primo cliente</p>
                <Button
                  color="primary"
                  onPress={() => navigate("/customers/add")}
                  startContent={<Icon icon="solar:user-plus-bold" width={20} />}
                >
                  Aggiungi Cliente
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
