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
  Pagination,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../Components/Layout/PageHeader";
import type { Customer, CustomerSearchResult } from "../../types/Customer";
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
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CustomerSearchResult[]>(
    []
  );

  // State per paginazione
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

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

      console.log("Total customers loaded:", customers.length);

      setCustomers(customers);
    } catch (error) {
      console.error("Errore nel caricamento dei clienti:", error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

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

  // Logica di paginazione
  const paginatedCustomers = useMemo(() => {
    const customersToShow = searchQuery
      ? searchResults.map((r) => r.customer)
      : filteredCustomers;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return customersToShow.slice(startIndex, endIndex);
  }, [
    filteredCustomers,
    searchResults,
    searchQuery,
    currentPage,
    itemsPerPage,
  ]);

  const totalPages = useMemo(() => {
    const customersToShow = searchQuery
      ? searchResults.map((r) => r.customer)
      : filteredCustomers;
    return Math.ceil(customersToShow.length / itemsPerPage);
  }, [filteredCustomers, searchResults, searchQuery, itemsPerPage]);

  const totalCustomers = useMemo(() => {
    return searchQuery ? searchResults.length : filteredCustomers.length;
  }, [filteredCustomers, searchResults, searchQuery]);

  // Reset paginazione quando cambia la ricerca
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

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
                  {searchQuery
                    ? `Risultati ricerca (${totalCustomers})`
                    : `Tutti i clienti (${totalCustomers})`}
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
                  startContent={
                    <Icon icon="solar:close-circle-bold" width={16} />
                  }
                >
                  Cancella ricerca
                </Button>
              )}
            </div>
          </CardHeader>
          <CardBody>
            {/* Griglia di card clienti */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedCustomers.map((customer) => (
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
                        name={`${customer.name.charAt(
                          0
                        )}${customer.surname.charAt(0)}`}
                        size="lg"
                        className="bg-primary text-white text-xl ring-4 ring-primary/30 group-hover:ring-primary/50 transition-all"
                      />

                      {/* Nome e cognome */}
                      <div>
                        <h4 className="font-bold text-lg text-foreground">
                          {customer.name} {customer.surname}
                        </h4>
                        <p className="text-sm text-default-600">
                          {customer.customer_type === "private"
                            ? "Cliente Privato"
                            : "Cliente Business"}
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
                <Icon
                  icon="solar:user-cross-bold"
                  width={64}
                  className="text-default-300 mx-auto mb-4"
                />
                <h4 className="text-lg font-semibold text-default-600 mb-2">
                  Nessun cliente trovato
                </h4>
                <p className="text-default-400">
                  Prova con un altro termine di ricerca
                </p>
              </div>
            )}

            {/* Nessun cliente in generale */}
            {!searchQuery && customers.length === 0 && (
              <div className="text-center py-12">
                <Icon
                  icon="solar:users-group-rounded-bold"
                  width={64}
                  className="text-default-300 mx-auto mb-4"
                />
                <h4 className="text-lg font-semibold text-default-600 mb-2">
                  Nessun cliente presente
                </h4>
                <p className="text-default-400 mb-4">
                  Inizia aggiungendo il tuo primo cliente
                </p>
                <Button
                  color="primary"
                  onPress={() => navigate("/customers/add")}
                  startContent={<Icon icon="solar:user-plus-bold" width={20} />}
                >
                  Aggiungi Cliente
                </Button>
              </div>
            )}

            {/* Paginazione semplice con numeri e frecce */}
            {totalCustomers > itemsPerPage ? (
              <div className="flex justify-center mt-8">
                <div className="flex items-center gap-2 bg-default-100/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-default-200">
                  {/* Freccia sinistra */}
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => setCurrentPage(currentPage - 1)}
                    isDisabled={currentPage === 1}
                    className="min-w-8 h-8 text-default-600 hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Icon icon="solar:alt-arrow-left-bold" width={16} />
                  </Button>

                  {/* Numeri delle pagine */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, index) => {
                      const pageNumber = index + 1;
                      return (
                        <Button
                          key={pageNumber}
                          size="sm"
                          variant={
                            currentPage === pageNumber ? "solid" : "light"
                          }
                          color={
                            currentPage === pageNumber ? "primary" : "default"
                          }
                          onPress={() => setCurrentPage(pageNumber)}
                          className="min-w-8 h-8 text-sm font-medium transition-all"
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                  </div>

                  {/* Freccia destra */}
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => setCurrentPage(currentPage + 1)}
                    isDisabled={currentPage === totalPages}
                    className="min-w-8 h-8 text-default-600 hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Icon icon="solar:alt-arrow-right-bold" width={16} />
                  </Button>
                </div>
              </div>
            ) : (
              /* Mostra sempre le informazioni sulla paginazione */
              <div className="flex justify-center mt-8">
                <div className="text-sm text-default-500 bg-default-100/30 rounded-lg px-4 py-2">
                  Mostrando tutti i {totalCustomers} clienti
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
