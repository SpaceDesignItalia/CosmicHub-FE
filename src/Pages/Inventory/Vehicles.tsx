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
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from "@heroui/react";
import { Icon } from "@iconify/react";

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
  const [selectedVehicleType, setSelectedVehicleType] = useState("Tutti");
  const selectedVehicleRef = useRef<HTMLDivElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Tipi di veicolo disponibili
  const vehicleTypes = ["Tutti", "Large Van", "Small Van"];

  // Filtra i veicoli in base alla ricerca e al tipo selezionato
  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      selectedVehicleType === "Tutti" || vehicle.type === selectedVehicleType;
    return matchesSearch && matchesType;
  });

  // Carica i dati dei veicoli
  useEffect(() => {
    const fetchVehicles = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get("/Warehouse/GET/GetAllVehicles");

        // Trasforma i dati dal formato db al formato UI
        const formattedVehicles: Vehicle[] = response.data.map((item: any) => ({
          id: item.warehouse_id,
          plate: item.license_plate,
          model: item.name,
          type: item.type === "Furgone grande" ? "Large Van" : "Small Van",
          capacity: item.capacity,
          status: mapStatus(item.status || "Disponibile"),
          lastCheck: item.last_inspection,
          usedCapacity: Math.floor(Math.random() * 75), // Dato di esempio
          position: "Via Roma 123, Milano", // Dato di esempio
          travelTime: "01:30:45", // Dato di esempio
          eta: "15:45", // Dato di esempio
          deliveryPoints: [
            { address: "Via Garibaldi 10, Torino", time: "14:30" },
            { address: "Corso Vittorio Emanuele 25, Milano", time: "15:15" },
          ],
        }));

        setVehicles(formattedVehicles);
        if (formattedVehicles.length > 0) {
          setSelectedVehicle(formattedVehicles[0]);
        }
        setError("");
      } catch (error) {
        setError("Impossibile caricare i veicoli. Riprova più tardi.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  // Funzione per mappare gli stati da italiano a inglese
  const mapStatus = (
    italianStatus: string
  ): "Available" | "In use" | "Maintenance" => {
    switch (italianStatus) {
      case "Disponibile":
        return "Available";
      case "In uso":
        return "In use";
      case "In manutenzione":
        return "Maintenance";
      default:
        return "Available";
    }
  };

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

    setIsDeleting(true);
    try {
      await axios.delete(`/Warehouse/DELETE/DeleteVehicle`, {
        params: {
          vehicleId: selectedVehicle.id,
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
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <VehicleThemeProvider>
      <div className="w-full flex-1 flex flex-col p-5 bg-zinc-50 dark:bg-zinc-950">
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
                  onPress={() => navigate("/inventory/vehicles/add-vehicle")}
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
