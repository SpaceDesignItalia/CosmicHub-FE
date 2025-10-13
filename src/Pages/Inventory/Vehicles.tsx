import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import VehicleCard from "../../Components/Inventory/VehicleCard";
import VehicleMap from "../../Components/Inventory/VehicleMap";
import { VehicleThemeProvider } from "../../Components/Inventory/VehicleThemeWrapper";
import {
  Card,
  CardBody,
  CardHeader,
  Tabs,
  Tab,
  Input,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import PageHeader from "../../Components/Layout/PageHeader";

// Coordinate del deposito
const WAREHOUSE_COORDINATES = {
  lat: 43.8398623,
  lng: 11.1925343,
};

// Raggio di prossimità in metri
const PROXIMITY_RADIUS = 100;

// Funzione per calcolare la distanza tra due punti geografici in metri
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371e3; // raggio della Terra in metri
  const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radianti
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metri
};

// Funzione per ottenere l'indirizzo dalle coordinate (geocodifica inversa)
const getAddressFromCoordinates = async (lat: number, lng: number) => {
  try {
    // Utilizziamo OpenStreetMap Nominatim per la geocodifica inversa
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          Accept: "application/json",
        },
        withCredentials: false,
      }
    );

    if (response.data && response.data.display_name) {
      return response.data.display_name;
    }
    return "Indirizzo non disponibile";
  } catch (error) {
    console.error("Errore nella geocodifica inversa:", error);
    return "Indirizzo non disponibile";
  }
};

// Tipi di dati
interface Vehicle {
  id: string;
  plate: string;
  model: string;
  type: "Large Van" | "Small Van";
  capacity: number;
  status: "Available" | "In use" | "Maintenance";
  lastCheck: string;
  usedCapacity?: number;
  position?: string;
  travelTime?: string;
  eta?: string;
  coordinates?: { lat: number; lng: number };
  deliveryPoints?: { address: string; time: string }[];
  assignedUser?: string; // Nome dell'utente assegnato al veicolo
}

axios.defaults.baseURL = import.meta.env.VITE_API_URL;

export default function Vehicles() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [activeTab, setActiveTab] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const selectedVehicleRef = useRef<HTMLDivElement>(null);

  // Filtra i veicoli in base alla ricerca
  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });



  // Carica i dati dei veicoli
  useEffect(() => {
    const fetchVehicles = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get("/Warehouse/GET/GetAllVehicles");



        // Trasforma i dati dal formato db al formato UI
        const formattedVehicles: Vehicle[] = await Promise.all(
          response.data.map(async (item: any) => {
            // Determina lo stato in base alla posizione del veicolo
            let status: "Available" | "In use" | "Maintenance" = "Maintenance";
            let coordinates = undefined;
            let position = "Posizione non disponibile";
            let assignedUser = undefined;

            // Recupera l'utente assegnato al veicolo
            try {
              // Prima chiamata per ottenere l'ID dell'utente assegnato al veicolo

              // Se c'è un utente assegnato
              if (item.assigned_user_id) {
                // Seconda chiamata per ottenere i dettagli dell'utente
                const employeeResponse = await axios.get(
                  `/Employee/GET/GetEmployeeById`,
                  {
                    params: {
                      employeeId: item.assigned_user_id,
                    },
                  }
                );
                if (employeeResponse.data && employeeResponse.data.name) {
                  assignedUser = `${employeeResponse.data.name} ${
                    employeeResponse.data.surname || ""
                  }`;
                }
              }
            } catch (error) {
              // Se non c'è un utente assegnato o si verifica un errore, continuiamo senza assegnare utente
              console.log(
                `Nessun utente assegnato al veicolo ${item.vehicle_id}`
              );
            }

            if (item.location && item.location !== "N/A") {
              const [lat, lng] = item.location.split(" ").map(Number);
              if (lat && lng) {
                coordinates = { lat, lng };

                // Ottieni l'indirizzo dalle coordinate
                position = await getAddressFromCoordinates(lat, lng);

                // Calcola la distanza dal deposito
                const distance = calculateDistance(
                  lat,
                  lng,
                  WAREHOUSE_COORDINATES.lat,
                  WAREHOUSE_COORDINATES.lng
                );

                // Imposta lo stato in base alla distanza
                if (distance <= PROXIMITY_RADIUS) {
                  status = "Available";
                  position = "In deposito";
                } else {
                  status = "In use";
                }
              }
            } else {
              position = "In manutenzione";
            }

            return {
              id: item.vehicle_id,
              plate: item.license_plate,
              model: item.name,
              type: item.type === "Furgone grande" ? "Large Van" : "Small Van",
              capacity: item.capacity,
              status: status,
              lastCheck: item.last_inspection,
              usedCapacity: Math.floor(Math.random() * 75), // Dato di esempio
              position: position,
              travelTime: "01:30:45", // Dato di esempio
              eta: "15:45", // Dato di esempio
              coordinates: coordinates,
              assignedUser: assignedUser,
              deliveryPoints:
                status === "In use"
                  ? [
                      {
                        address: position,
                        time: new Date().toLocaleTimeString("it-IT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }),
                      },
                    ]
                  : [],
            };
          })
        );

        setVehicles(formattedVehicles);
        if (formattedVehicles.length > 0 && !selectedVehicle) {
          setSelectedVehicle(formattedVehicles[0]);
        }
        setError("");
      } catch (error) {
        console.log("API non disponibile, carico veicoli di prova...");
      } finally {
        setIsLoading(false);
      }
    };

    // Funzione per aggiornamento silenzioso dei veicoli
    const silentlyUpdateVehicles = async () => {
      try {
        const response = await axios.get("/Warehouse/GET/GetAllVehicles");
        console.log("response", response.data);

        // Trasforma i dati dal formato db al formato UI senza mostrare loading
        const formattedVehicles: Vehicle[] = await Promise.all(
          response.data.map(async (item: any) => {
            // Determina lo stato in base alla posizione del veicolo
            let status: "Available" | "In use" | "Maintenance" = "Maintenance";
            let coordinates = undefined;
            let position = "Posizione non disponibile";
            let assignedUser = undefined;

            // Recupera l'utente assegnato al veicolo
            try {
              // Prima chiamata per ottenere l'ID dell'utente assegnato al veicolo

              // Se c'è un utente assegnato
              if (item.assigned_user_id) {
                // Seconda chiamata per ottenere i dettagli dell'utente
                const employeeResponse = await axios.get(
                  `/Employee/GET/GetEmployeeById`,
                  {
                    params: {
                      employeeId: item.assigned_user_id,
                    },
                  }
                );
                if (employeeResponse.data && employeeResponse.data.name) {
                  assignedUser = `${employeeResponse.data.name} ${
                    employeeResponse.data.surname || ""
                  }`;
                }
              }
            } catch (error) {
              // Se non c'è un utente assegnato o si verifica un errore, continuiamo senza assegnare utente
              console.log(
                `Nessun utente assegnato al veicolo ${item.vehicle_id}`
              );
            }

            if (item.location && item.location !== "N/A") {
              const [lat, lng] = item.location.split(" ").map(Number);
              if (lat && lng) {
                coordinates = { lat, lng };

                // Ottieni l'indirizzo dalle coordinate, ma evita di attendere se non necessario
                // per non rallentare l'aggiornamento
                try {
                  position = await getAddressFromCoordinates(lat, lng);
                } catch {
                  // Ignora errori di geocodifica durante l'aggiornamento silenzioso
                }

                // Calcola la distanza dal deposito
                const distance = calculateDistance(
                  lat,
                  lng,
                  WAREHOUSE_COORDINATES.lat,
                  WAREHOUSE_COORDINATES.lng
                );

                // Imposta lo stato in base alla distanza
                if (distance <= PROXIMITY_RADIUS) {
                  status = "Available";
                  position = "In deposito";
                } else {
                  status = "In use";
                }
              }
            } else {
              position = "In manutenzione";
            }

            return {
              id: item.vehicle_id,
              plate: item.license_plate,
              model: item.name,
              type: item.type === "Furgone grande" ? "Large Van" : "Small Van",
              capacity: item.capacity,
              status: status,
              lastCheck: item.last_inspection,
              usedCapacity: Math.floor(Math.random() * 75), // Dato di esempio
              position: position,
              travelTime: "01:30:45", // Dato di esempio
              eta: "15:45", // Dato di esempio
              coordinates: coordinates,
              assignedUser: assignedUser,
              deliveryPoints:
                status === "In use"
                  ? [
                      {
                        address: position,
                        time: new Date().toLocaleTimeString("it-IT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }),
                      },
                    ]
                  : [],
            };
          })
        );

        // Aggiorna i veicoli mantenendo il veicolo selezionato
        setVehicles(() => {
          // Se abbiamo un veicolo selezionato, manteniamolo aggiornato
          if (selectedVehicle) {
            const updatedSelectedVehicle = formattedVehicles.find(
              (v) => v.id === selectedVehicle.id
            );
            if (updatedSelectedVehicle) {
              setSelectedVehicle(updatedSelectedVehicle);
            }
          }
          return formattedVehicles;
        });
      } catch (error) {
        // Gestisci l'errore silenziosamente, senza mostrare messaggi all'utente
        console.error(
          "Errore nell'aggiornamento silenzioso dei veicoli:",
          error
        );
      }
    };

    fetchVehicles();

    // Aggiorna i veicoli ogni 30 secondi senza mostrare loading solo se non stiamo usando dati di prova
    let intervalId: NodeJS.Timeout | null = null;
    intervalId = setInterval(() => {
      silentlyUpdateVehicles();
    }, 30000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []); // Aggiungo usingMockData come dipendenza

  // Gestisci selezione veicolo
  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);

    // Aggiungiamo un timeout per assicurarci che il DOM si aggiorna prima di effettuare lo scroll
    setTimeout(() => {
      if (selectedVehicleRef.current) {
        selectedVehicleRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }, 100);
  };

  // Gestisci eliminazione veicolo
  const handleDeleteVehicle = async () => {
    if (!selectedVehicle) return;

    try {
      await axios.delete(`/Warehouse/DELETE/DeleteVehicle`, {
        params: {
          vehicle_id: selectedVehicle.id,
        },
      });

      // Rimuovi il veicolo dall'array locale
      setVehicles((prevVehicles) =>
        prevVehicles.filter((v) => v.id !== selectedVehicle.id)
      );

      // Se il veicolo eliminato è quello selezionato, deselezionalo
      if (selectedVehicle && vehicles.length > 1) {
        const index = vehicles.findIndex((v) => v.id === selectedVehicle.id);
        const nextIndex = index === vehicles.length - 1 ? index - 1 : index + 1;
        setSelectedVehicle(vehicles[nextIndex]);
      } else {
        setSelectedVehicle(null);
      }

      // Feedback all'utente - in una vera applicazione useremmo un sistema di toast
      console.log(`Veicolo ${selectedVehicle.plate} eliminato con successo`);
    } catch (error) {
      console.error("Errore durante l'eliminazione del veicolo:", error);
      setError("Impossibile eliminare il veicolo. Riprova più tardi.");
    }
  };

  return (
    <VehicleThemeProvider>
      <div className="h-screen flex flex-col bg-background p-6 gap-6 overflow-hidden">
        {/* Page Header */}
        <PageHeader
          title="Gestione Veicoli"
          description="Monitora e gestisci la flotta aziendale"
          icon="solar:bus-bold-duotone"
          size="md"
          actions={[
            {
              label: "Nuovo Veicolo",
              icon: "solar:add-circle-bold",
              color: "primary",
              variant: "solid",
              onClick: () => navigate("/inventory/vehicles/add"),
            },
          ]}
        />

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="bg-danger-50 text-danger-700 dark:bg-danger-900 dark:text-danger-300 p-4 rounded-lg">
            {error}
          </div>
        ) : (
          <>
            {/* Barra degli strumenti */}
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-3">
                <Input
                  placeholder="Cerca per targa o modello..."
                  startContent={<Icon icon="solar:magnifer-line-duotone" />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-60"
                />
                <Dropdown>
                  <DropdownTrigger>
                    <Button variant="light">
                      {selectedVehicleType}
                      <Icon icon="solar:arrow-down-linear" className="ml-2" />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Tipi veicolo"
                    onAction={(key) =>
                      setSelectedVehicleType(vehicleTypes[Number(key)])
                    }
                  >
                    {vehicleTypes.map((tipo, index) => (
                      <DropdownItem key={index.toString()}>{tipo}</DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              </div>

              <div className="flex items-center gap-3">
                <Tabs
                  selectedKey={activeTab}
                  onSelectionChange={(key) => setActiveTab(key as string)}
                  color="primary"
                  radius="full"
                  size="md"
                >
                  <Tab
                    key="grid"
                    title={
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:widget-2-linear" />
                        <span className="hidden sm:inline">Griglia</span>
                      </div>
                    }
                  />
                  <Tab
                    key="list"
                    title={
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:list-linear" />
                        <span className="hidden sm:inline">Lista</span>
                      </div>
                    }
                  />
                </Tabs>

                <Button
                  color="primary"
                  onPress={() => navigate("/inventory/vehicles/add")}
                >
                  <Icon
                    icon="material-symbols:add"
                    className="mr-1"
                    width={24}
                    height={24}
                  />
                  Nuovo Veicolo
                </Button>
              </div>
            </div>

            {/* Layout principale */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Lista veicoli (occupa tutta la larghezza su mobile, 4 colonne su desktop) */}
              <div
                className={
                  activeTab === "grid" ? "lg:col-span-4" : "lg:col-span-12"
                }
              >
                <Card className="shadow-sm">
                  <CardHeader className="border-b">
                    <h3 className="text-xl font-semibold">
                      Veicoli ({filteredVehicles.length})
                    </h3>
                  </CardHeader>
                  <CardBody className="p-3">
                    {filteredVehicles.length > 0 ? (
                      <div
                        className={`${
                          activeTab === "grid"
                            ? "space-y-2"
                            : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
                        }`}
                      >
                        {filteredVehicles.map((vehicle) => (
                          <div
                            key={vehicle.id}
                            ref={
                              selectedVehicle?.id === vehicle.id
                                ? selectedVehicleRef
                                : null
                            }
                            onClick={() => handleVehicleSelect(vehicle)}
                          >
                            <VehicleCard
                              veicolo={vehicle}
                              isSelected={selectedVehicle?.id === vehicle.id}
                              onClick={() => handleVehicleSelect(vehicle)}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-zinc-400 dark:text-zinc-500">
                        <Icon
                          icon="solar:sad-circle-linear"
                          className="text-5xl mb-2"
                        />
                        <p>Nessun veicolo trovato</p>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>

              {/* Dettaglio veicolo (nascosto in modalità lista, 8 colonne in modalità griglia) */}
              {activeTab === "grid" && selectedVehicle && (
                <div className="lg:col-span-8">
                  <VehicleMap
                    vehicle={selectedVehicle}
                    onEdit={() =>
                      navigate(`/inventory/vehicles/edit/${selectedVehicle.id}`)
                    }
                    onDelete={handleDeleteVehicle}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </VehicleThemeProvider>
  );
}
