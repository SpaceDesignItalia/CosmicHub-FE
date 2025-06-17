import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Chip,
  Button,
  Progress,
  Tabs,
  Tab,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Autocomplete,
  AutocompleteItem,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useVehicleTheme } from "./VehicleThemeWrapper";
import type { VehicleStatus } from "./VehicleThemeWrapper";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import type { Employee } from "../../types/Employee";

// Stili personalizzati per la mappa
const mapStyles = [
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#c8d7d4" }],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [{ color: "#f0f0f0" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#666666" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road.local",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
];

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = [];

// Coordinate del deposito
const DEPOSITO_COORDINATES = {
  lat: 43.8398623,
  lng: 11.1925343,
};

// Raggio di prossimità in metri
const PROXIMITY_RADIUS = 100;

// Modifica dell'interfaccia Vehicle per supportare sia i dati della tabella che quelli della mappa
interface Vehicle {
  id: string;
  plate?: string; // Per compatibilità con i dati della mappa
  license_plate?: string; // Per compatibilità con i dati della tabella
  model: string;
  type: string;
  capacity: number;
  status?: "Available" | "In use" | "Maintenance"; // Per compatibilità con i dati della mappa
  stato?: "Disponibile" | "In uso" | "In manutenzione"; // Per compatibilità con i dati della tabella
  lastCheck?: string;
  last_inspection_date?: string;
  usedCapacity?: number;
  position?: string;
  travelTime?: string;
  eta?: string;
  coordinates?: { lat: number; lng: number };
  deliveryPoints?: { address: string; time: string }[];
  assignedUser?: string; // Nome dell'utente a cui è assegnato il veicolo
}

interface VehicleMapProps {
  vehicle: Vehicle;
  onEdit?: () => void;
  onDelete?: () => void;
}

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

// Interfaccia per le props del componente mappa
interface GoogleMapProps {
  center: { lat: number; lng: number };
  zoom: number;
  onLoad: (map: google.maps.Map) => void;
  onUnmount: () => void;
  mapStyles: any[];
  isInfoWindowOpen: boolean;
  currentCoordinates?: { lat: number; lng: number };
  currentAddress: string;
  plateNumber: string;
  setIsInfoWindowOpen: (isOpen: boolean) => void;
}

// Componente mappa con memo per evitare re-render non necessari
const MemoizedGoogleMap = React.memo(
  ({
    center,
    zoom,
    onLoad,
    onUnmount,
    mapStyles,
    isInfoWindowOpen,
    currentCoordinates,
    currentAddress,
    plateNumber,
    setIsInfoWindowOpen,
  }: GoogleMapProps) => {
    return (
      <GoogleMap
        mapContainerClassName="w-full h-full rounded-lg"
        center={center}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: true,
          styles: mapStyles,
          zoomControl: false,
        }}
      >
        {/* Marker per il deposito */}
        <Marker
          position={DEPOSITO_COORDINATES}
          icon={{
            url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            scaledSize: new window.google.maps.Size(40, 40),
          }}
        />

        {/* Marker per il veicolo */}
        {currentCoordinates && (
          <>
            <Marker
              position={currentCoordinates}
              icon={{
                url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
                scaledSize: new window.google.maps.Size(40, 40),
              }}
              onClick={() => setIsInfoWindowOpen(true)}
              animation={window.google.maps.Animation.DROP}
            />

            {isInfoWindowOpen && (
              <InfoWindow
                position={currentCoordinates}
                onCloseClick={() => setIsInfoWindowOpen(false)}
              >
                <div className="p-2">
                  <p className="font-bold">{plateNumber}</p>
                  <p>{currentAddress || "Indirizzo non disponibile"}</p>
                </div>
              </InfoWindow>
            )}
          </>
        )}
      </GoogleMap>
    );
  }
);

const VehicleMap: React.FC<VehicleMapProps> = ({
  vehicle,
  onEdit,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState("map");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [animationProgress, setAnimationProgress] = useState(50);
  const [currentVehicleStatus, setCurrentVehicleStatus] =
    useState<VehicleStatus>(
      (vehicle.status ||
        (vehicle.stato === "Disponibile"
          ? "Available"
          : vehicle.stato === "In uso"
          ? "In use"
          : "Maintenance")) as VehicleStatus
    );
  const [currentCoordinates, setCurrentCoordinates] = useState(
    vehicle.coordinates
  );
  const [currentAddress, setCurrentAddress] = useState<string>("");
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Stato per la mappa Google Maps
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [zoom, setZoom] = useState(14);
  const [isInfoWindowOpen, setIsInfoWindowOpen] = useState(false);

  // Carica Google Maps
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "AIzaSyCiwX6kfGN0syLMPqy1JXLNxct0woowciA",
    libraries: libraries,
  });

  // Utilizziamo il tema dei veicoli
  const { colors } = useVehicleTheme();

  // Normalizzazione dei dati del veicolo
  const plateNumber = vehicle.plate || vehicle.license_plate || "";

  const lastInspectionDate =
    vehicle.lastCheck || vehicle.last_inspection_date || "";

  // Funzioni della mappa
  const onLoad = useCallback(
    (map: google.maps.Map) => {
      map.setZoom(zoom);
      setMap(map);
    },
    [zoom]
  );

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleZoomIn = () => {
    if (map) {
      const newZoom = Math.min((map.getZoom() || 14) + 1, 20);
      map.setZoom(newZoom);
      setZoom(newZoom);
    }
  };

  const handleZoomOut = () => {
    if (map) {
      const currentZoom = map.getZoom() || 14;
      const newZoom = Math.max(currentZoom - 1, 1);
      map.setZoom(newZoom);
      setZoom(newZoom);
    }
  };

  const handleOpenNavigation = () => {
    if (currentCoordinates) {
      const coord = `${currentCoordinates.lat},${currentCoordinates.lng}`;
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const url = isMobile
        ? `https://maps.google.com/?q=${coord}`
        : `https://www.google.com/maps/dir/?api=1&destination=${coord}`;
      window.open(url, "_blank");
    }
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

  // Funzione per ottenere le coordinate aggiornate dal database con aggiornamento forzato
  const updateCoordinates = async (forceUpdate = false) => {
    try {
      const response = await axios.get(`/Warehouse/GET/GetAllVehicles`, {
        // Evita la cache per ottenere sempre i dati aggiornati
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      if (response.data) {
        // Trova il veicolo con il warehouse_id corrispondente
        const currentVehicle = response.data.find(
          (v: any) => v.warehouse_id === vehicle.id
        );

        if (currentVehicle) {
          // Recupera l'utente assegnato al veicolo
          try {
            // Se c'è un utente assegnato
            if (currentVehicle.assigned_user_id) {
              // Seconda chiamata per ottenere i dettagli dell'utente
              const employeeResponse = await axios.get(
                `/Employee/GET/GetEmployeeById`,
                {
                  params: {
                    employeeId: currentVehicle.assigned_user_id,
                  },
                }
              );
              if (employeeResponse.data && employeeResponse.data.name) {
                vehicle.assignedUser = `${employeeResponse.data.name} ${
                  employeeResponse.data.surname || ""
                }`;
              }
            }
          } catch (error) {
            // Se non c'è un utente assegnato o si verifica un errore, continuiamo senza assegnare utente
            console.log(`Nessun utente assegnato al veicolo ${vehicle.id}`);
          }

          // Aggiorna i dati del veicolo
          if (currentVehicle.location && currentVehicle.location !== "N/A") {
            // Converti la stringa "lat lng" in oggetto coordinates
            const [lat, lng] = currentVehicle.location.split(" ").map(Number);

            // Solo se sono numeri validi
            if (!isNaN(lat) && !isNaN(lng)) {
              const coordinates = { lat, lng };

              // Controlla se le coordinate sono cambiate o se è richiesto un aggiornamento forzato
              const hasChanged =
                forceUpdate ||
                !currentCoordinates ||
                Math.abs(lat - currentCoordinates.lat) > 0.0000001 ||
                Math.abs(lng - currentCoordinates.lng) > 0.0000001;

              if (hasChanged) {
                // Aggiorna le coordinate e l'indirizzo
                setCurrentCoordinates(coordinates);

                // Ottieni l'indirizzo dalle coordinate
                getAddressFromCoordinates(lat, lng)
                  .then((address) => {
                    if (address !== currentAddress) {
                      setCurrentAddress(address);
                    }
                  })
                  .catch(() => {
                    // Gestisci l'errore silenziosamente
                  });

                // Calcola la distanza dal deposito
                const distance = calculateDistance(
                  lat,
                  lng,
                  DEPOSITO_COORDINATES.lat,
                  DEPOSITO_COORDINATES.lng
                );

                // Imposta lo stato in base alla distanza
                const newStatus =
                  distance <= PROXIMITY_RADIUS ? "Available" : "In use";
                if (currentVehicleStatus !== newStatus) {
                  setCurrentVehicleStatus(newStatus as VehicleStatus);

                  // Aggiorna i punti di consegna in base allo stato
                  if (newStatus === "Available") {
                    vehicle.deliveryPoints = [];
                  } else {
                    vehicle.deliveryPoints = [
                      {
                        address: currentAddress || "Posizione attuale",
                        time: new Date().toLocaleTimeString("it-IT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }),
                      },
                    ];
                  }
                }

                // Se la posizione è cambiata, aggiorna i deliveryPoints anche se lo stato non è cambiato
                if (newStatus === "In use") {
                  vehicle.deliveryPoints = [
                    {
                      address: currentAddress || "Posizione attuale",
                      time: new Date().toLocaleTimeString("it-IT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                    },
                  ];
                }

                return true; // Posizione aggiornata con successo
              }
            }
          } else if (currentVehicleStatus !== "Maintenance") {
            // Se la location è "N/A", imposta il veicolo in manutenzione
            setCurrentVehicleStatus("Maintenance");
            setCurrentAddress("In manutenzione");
            vehicle.deliveryPoints = [];
            return true; // Stato aggiornato con successo
          }

          // Aggiorna altri dati del veicolo solo se sono cambiati
          let dataChanged = false;

          if (currentVehicle.capacity) {
            const newCapacity = parseInt(currentVehicle.capacity);
            if (vehicle.capacity !== newCapacity) {
              vehicle.capacity = newCapacity;
              dataChanged = true;
            }
          }

          if (
            currentVehicle.license_plate &&
            vehicle.license_plate !== currentVehicle.license_plate
          ) {
            vehicle.license_plate = currentVehicle.license_plate;
            dataChanged = true;
          }

          if (
            currentVehicle.last_inspection &&
            vehicle.last_inspection_date !== currentVehicle.last_inspection
          ) {
            vehicle.last_inspection_date = currentVehicle.last_inspection;
            dataChanged = true;
          }

          return dataChanged; // Ritorna true se sono stati aggiornati i dati
        }
      }
      return false; // Nessun aggiornamento
    } catch (error) {
      console.error("Errore nel recupero delle coordinate del veicolo:", error);
      return false;
    }
  };

  const [userWithoutVehicle, setUserWithoutVehicle] = useState<Employee[]>([]);
  const [update, setUpdate] = useState(false);

  // Aggiorna i dati quando cambia il veicolo
  useEffect(() => {
    if (vehicle) {
      // Imposta lo stato iniziale
      setCurrentVehicleStatus(
        (vehicle.status ||
          (vehicle.stato === "Disponibile"
            ? "Available"
            : vehicle.stato === "In uso"
            ? "In use"
            : "Maintenance")) as VehicleStatus
      );

      // Reset delle coordinate
      setCurrentCoordinates(undefined);
      setCurrentAddress("");
      setIsInfoWindowOpen(false);

      // Fetch iniziale forzato delle coordinate
      updateCoordinates(true);
    }
  }, [vehicle.id, update]); // Dipendenza solo dall'ID del veicolo

  // Update current time and coordinates more frequently
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Intervallo per aggiornare le coordinate dal database più frequentemente (ogni 5 secondi)
    const coordinatesInterval = setInterval(() => {
      if (vehicle && vehicle.id) {
        updateCoordinates();
      }
    }, 5000); // Ridotto a 5 secondi per rilevare rapidamente i cambiamenti

    // Fetch iniziale delle coordinate
    if (vehicle && vehicle.id) {
      updateCoordinates(true); // Forza l'aggiornamento iniziale
    }

    return () => {
      clearInterval(timeInterval);
      clearInterval(coordinatesInterval);
    };
  }, [vehicle.id]); // Dipendenza solo dall'ID del veicolo

  const isOnRoute = currentVehicleStatus === "In use";
  const isWaiting = currentVehicleStatus === "Maintenance";
  const isAvailable = currentVehicleStatus === "Available";
  const capacityUsed = vehicle.usedCapacity || 0;

  // Calculate current position on map based on real coordinates
  const getCurrentPosition = () => {
    // Se abbiamo coordinate reali dal database, le utilizziamo per la posizione sulla mappa
    if (
      currentCoordinates &&
      currentCoordinates.lat &&
      currentCoordinates.lng
    ) {
      // Utilizziamo coordinate fisse basate sulla posizione reale ma senza calcoli eccessivi
      // che potrebbero causare instabilità visiva
      return {
        x: 250,
        y: 150,
      };
    }

    // Utilizziamo una posizione fissa anche nel fallback per evitare animazioni che causano problemi di rendering
    return {
      x: 250,
      y: 150,
    };
  };

  // Calculate estimated remaining time
  const getRemainingTime = () => {
    if (!vehicle.travelTime) return "N/A";

    // Example of remaining time calculation in mm:ss format
    const [hours, minutes, seconds] = vehicle.travelTime.split(":").map(Number);
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    const remainingSeconds = totalSeconds * (1 - animationProgress / 100);

    const rHours = Math.floor(remainingSeconds / 3600);
    const rMinutes = Math.floor((remainingSeconds % 3600) / 60);
    const rSeconds = Math.floor(remainingSeconds % 60);

    return `${rHours.toString().padStart(2, "0")}:${rMinutes
      .toString()
      .padStart(2, "0")}:${rSeconds.toString().padStart(2, "0")}`;
  };

  // Current time format
  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const position = getCurrentPosition();

  // Gestione dell'eliminazione con conferma
  const handleDeleteClick = () => {
    if (onDelete) {
      onOpen();
    }
  };

  // Conferma eliminazione
  const confirmDelete = () => {
    if (onDelete) {
      onDelete();
      onClose();
    }
  };

  // Funzione per aggiornare manualmente la posizione (per test)
  const refreshPosition = () => {
    updateCoordinates(true); // Forza l'aggiornamento
  };

  // Determina il centro della mappa
  const mapCenter = currentCoordinates || DEPOSITO_COORDINATES;

  // Aggiungiamo un ref per la mappa per evitare re-render
  const mapRef = React.useRef(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await axios.get(
        "/Employee/GET/GetEmplyeesWithoutVehicle"
      );
      setUserWithoutVehicle(response.data);
    };
    fetchUsers();
  }, []);

  async function updateUserVehicle(e: any) {
    console.log(e);
    const response = await axios.put("/Employee/UPDATE/UpdateEmployeeVan", {
      van_id: vehicle.id,
      employee_id: e,
    });
    if (response.status === 200) {
      setUpdate(true);
    }
  }

  return (
    <Card className="h-full border-none bg-transparent">
      <CardHeader className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center px-5 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="w-full md:w-auto">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-50">
              {plateNumber} - {vehicle.model}
            </h3>
            {isOnRoute && (
              <Chip
                size="sm"
                color="primary"
                variant="dot"
                classNames={{
                  base: "animate-pulse bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
                }}
              >
                Real-time
              </Chip>
            )}
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-300 flex items-center gap-1 mt-1 flex-wrap">
            <Icon
              icon="mdi:map-marker"
              className="text-blue-600 dark:text-blue-300"
            />
            <span className="truncate max-w-[300px]">
              {currentAddress ||
                vehicle.position ||
                "Posizione non disponibile"}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 justify-end w-full md:w-auto">
          <div className="flex items-center gap-2">
            {isOnRoute && (
              <div className="flex items-center">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded-full">
                  {capacityUsed}%
                </div>
              </div>
            )}
            <div className="text-sm bg-zinc-100 dark:bg-zinc-800 py-1 px-3 rounded-full text-zinc-600 dark:text-zinc-200">
              {formattedTime}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {vehicle.assignedUser === undefined && (
              <Autocomplete
                label="Assegna a"
                defaultItems={userWithoutVehicle}
                placeholder="Seleziona un utente"
                classNames={{
                  base: "w-full",
                }}
                onSelectionChange={(e) => {
                  updateUserVehicle(e);
                }}
              >
                {userWithoutVehicle.map((user) => (
                  <AutocompleteItem key={user.id}>
                    <p>{user.name}</p>
                  </AutocompleteItem>
                ))}
              </Autocomplete>
            )}
            {onDelete && (
              <Button
                size="sm"
                color="danger"
                variant="flat"
                startContent={
                  <Icon icon="solar:trash-bin-trash-bold" className="text-sm" />
                }
                onPress={handleDeleteClick}
              >
                Elimina
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardBody className="p-0">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as string)}
          color="primary"
          variant="light"
          classNames={{
            base: "bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800",
            tabList: "px-5",
            tab: "py-3 text-zinc-600 dark:text-zinc-400 data-[selected=true]:text-blue-600 dark:data-[selected=true]:text-blue-300",
          }}
        >
          <Tab
            key="map"
            title={
              <div className="flex items-center gap-2">
                <Icon icon="mdi:map" />
                <span>Mappa</span>
              </div>
            }
          >
            <div className="p-5 bg-white dark:bg-zinc-900">
              {/* Google Maps */}
              <div className="w-full bg-zinc-50 dark:bg-zinc-950 rounded-xl overflow-hidden relative mb-5 border border-zinc-200 dark:border-zinc-800">
                <div className="h-[350px] relative">
                  {isLoaded ? (
                    <div className="w-full h-full" ref={mapRef}>
                      <MemoizedGoogleMap
                        center={mapCenter}
                        zoom={zoom}
                        onLoad={onLoad}
                        onUnmount={onUnmount}
                        mapStyles={mapStyles}
                        isInfoWindowOpen={isInfoWindowOpen}
                        currentCoordinates={currentCoordinates}
                        currentAddress={currentAddress}
                        plateNumber={plateNumber}
                        setIsInfoWindowOpen={setIsInfoWindowOpen}
                      />

                      {/* Controlli mappa */}
                      <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-10">
                        <Button
                          isIconOnly
                          className="bg-white text-foreground shadow-md hover:bg-primary hover:text-white border border-default-200"
                          size="md"
                          onClick={handleZoomIn}
                        >
                          <Icon icon="solar:add-bold" width={20} />
                        </Button>
                        <Button
                          isIconOnly
                          className="bg-white text-foreground shadow-md hover:bg-primary hover:text-white border border-default-200"
                          size="md"
                          onClick={handleZoomOut}
                        >
                          <Icon icon="solar:minus-bold" width={20} />
                        </Button>
                      </div>

                      {/* Pulsante navigazione */}
                      {currentCoordinates && (
                        <div className="absolute bottom-6 left-6 z-10">
                          <Button
                            className="bg-white text-foreground shadow-md hover:bg-primary hover:text-white border border-default-200 flex items-center gap-2 px-4"
                            onClick={handleOpenNavigation}
                            size="md"
                            startContent={
                              <Icon icon="solar:map-point-bold" width={18} />
                            }
                          >
                            Apri navigazione
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-zinc-500">
                        Caricamento mappa...
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Storico posizioni */}
              <div className="mt-4 bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-md font-semibold text-zinc-800 dark:text-zinc-50 flex items-center gap-2">
                    <Icon
                      icon="mdi:history"
                      className="text-blue-600 dark:text-blue-300"
                    />
                    <span>Storico Posizioni</span>
                  </h4>
                  <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 py-1 px-3 rounded-full text-zinc-600 dark:text-zinc-200">
                    <Icon
                      icon="mdi:clock-outline"
                      className="text-zinc-500 dark:text-zinc-300"
                    />
                    <span className="text-sm font-medium">Ultimi 7 giorni</span>
                  </div>
                </div>

                <div className="space-y-0 ml-4 max-h-80 overflow-y-auto">
                  {/* Posizione attuale */}
                  <div className="relative pl-8 pb-4">
                    <div className="absolute left-[11px] top-[24px] bottom-0 w-[2px] bg-gradient-to-b from-green-500 to-zinc-300 dark:to-zinc-600"></div>
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-green-50 dark:bg-green-950 flex items-center justify-center border-2 border-green-500 dark:border-green-700 z-10">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                          {currentAddress ||
                            vehicle.position ||
                            "Posizione attuale"}
                        </span>
                        <Chip
                          size="sm"
                          color="success"
                          variant="flat"
                          className="text-xs"
                        >
                          {isOnRoute
                            ? "In movimento"
                            : isAvailable
                            ? "In deposito"
                            : "Fermo"}
                        </Chip>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-300">
                        Ora: {new Date().toLocaleString("it-IT")}
                      </p>
                    </div>
                  </div>

                  {/* Storico posizioni precedenti */}
                  {[
                    {
                      address: "Via Roma 123, Firenze",
                      status: "Consegna completata",
                      time: "Oggi, 14:30",
                      duration: "45 min",
                      color: "blue",
                    },
                    {
                      address: "Piazza del Duomo, Firenze",
                      status: "Sosta",
                      time: "Oggi, 13:15",
                      duration: "30 min",
                      color: "amber",
                    },
                    {
                      address: "Deposito centrale",
                      status: "Partenza",
                      time: "Oggi, 08:00",
                      duration: "2 ore",
                      color: "green",
                    },
                    {
                      address: "Deposito centrale",
                      status: "Parcheggiato",
                      time: "Ieri, 18:30",
                      duration: "13 ore",
                      color: "zinc",
                    },
                    {
                      address: "Via Nazionale 67, Pistoia",
                      status: "Consegna completata",
                      time: "Ieri, 16:45",
                      duration: "1 ora",
                      color: "blue",
                    },
                    {
                      address: "Corso Italia 12, Pistoia",
                      status: "Consegna completata",
                      time: "Ieri, 15:30",
                      duration: "45 min",
                      color: "blue",
                    },
                    {
                      address: "Viale dei Mille 45, Prato",
                      status: "Consegna completata",
                      time: "Ieri, 14:00",
                      duration: "1 ora 15 min",
                      color: "blue",
                    },
                  ].map((entry, index, array) => (
                    <div key={index} className="relative pl-8 pb-4">
                      <div
                        className={`absolute left-[11px] top-0 bottom-0 w-[2px] ${
                          index === array.length - 1
                            ? "bg-zinc-300 dark:bg-zinc-600 h-6"
                            : "bg-zinc-300 dark:bg-zinc-600 h-full"
                        }`}
                      ></div>
                      <div
                        className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 z-10 ${
                          entry.color === "blue"
                            ? "bg-blue-50 dark:bg-blue-950 border-blue-500 dark:border-blue-700"
                            : entry.color === "amber"
                            ? "bg-amber-50 dark:bg-amber-950 border-amber-500 dark:border-amber-700"
                            : entry.color === "green"
                            ? "bg-green-50 dark:bg-green-950 border-green-500 dark:border-green-700"
                            : "bg-zinc-50 dark:bg-zinc-950 border-zinc-500 dark:border-zinc-700"
                        }`}
                      >
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            entry.color === "blue"
                              ? "bg-blue-500"
                              : entry.color === "amber"
                              ? "bg-amber-500"
                              : entry.color === "green"
                              ? "bg-green-500"
                              : "bg-zinc-500"
                          }`}
                        ></div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                            {entry.address}
                          </span>
                          <Chip
                            size="sm"
                            variant="flat"
                            className={`text-xs ${
                              entry.color === "blue"
                                ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300"
                                : entry.color === "amber"
                                ? "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300"
                                : entry.color === "green"
                                ? "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-300"
                                : "bg-zinc-50 text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300"
                            }`}
                          >
                            {entry.status}
                          </Chip>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-zinc-500 dark:text-zinc-300 flex items-center gap-1">
                            <Icon icon="mdi:clock-outline" width={12} />
                            {entry.time}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-300 flex items-center gap-1">
                            <Icon icon="mdi:timer-outline" width={12} />
                            Durata: {entry.duration}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pulsante per vedere tutto lo storico */}
                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <Button
                    variant="flat"
                    size="sm"
                    className="w-full"
                    startContent={<Icon icon="mdi:history" width={16} />}
                  >
                    Visualizza storico completo
                  </Button>
                </div>
              </div>
            </div>
          </Tab>

          <Tab
            key="info"
            title={
              <div className="flex items-center gap-2">
                <Icon icon="mdi:information" />
                <span>Dettagli</span>
              </div>
            }
          >
            <div className="p-5 bg-white dark:bg-zinc-900">
              {/* Vehicle info */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div 
                  className="col-span-2 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                  onDoubleClick={() => onEdit && onEdit()}
                  title="Doppio click per modificare"
                >
                  <p className="text-xs text-zinc-500 dark:text-zinc-300 mb-1">
                    Tipo veicolo
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
                      <Icon
                        icon={
                          vehicle.type === "Large Van"
                            ? "mdi:truck"
                            : "mdi:car-estate"
                        }
                        className="text-blue-600 dark:text-blue-300 text-2xl"
                      />
                    </div>
                    <p className="font-medium text-lg text-zinc-800 dark:text-zinc-50">
                      {vehicle.type}
                    </p>
                  </div>
                  <div className="mt-2 text-xs text-blue-600 dark:text-blue-300 opacity-70">
                    💡 Doppio click per modificare
                  </div>
                </div>

                <div 
                  className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                  onDoubleClick={() => onEdit && onEdit()}
                  title="Doppio click per modificare"
                >
                  <p className="text-xs text-zinc-500 dark:text-zinc-300 mb-1">
                    Targa
                  </p>
                  <p className="font-medium text-lg text-zinc-800 dark:text-zinc-50">
                    {plateNumber}
                  </p>
                </div>

                <div 
                  className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                  onDoubleClick={() => onEdit && onEdit()}
                  title="Doppio click per modificare"
                >
                  <p className="text-xs text-zinc-500 dark:text-zinc-300 mb-1">
                    Modello
                  </p>
                  <p className="font-medium text-lg text-zinc-800 dark:text-zinc-50">
                    {vehicle.model}
                  </p>
                </div>

                <div 
                  className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                  onDoubleClick={() => onEdit && onEdit()}
                  title="Doppio click per modificare"
                >
                  <p className="text-xs text-zinc-500 dark:text-zinc-300 mb-1">
                    Capacità
                  </p>
                  <p className="font-medium text-lg text-zinc-800 dark:text-zinc-50">
                    {vehicle.capacity.toLocaleString("it-IT")} kg
                  </p>
                </div>

                <div 
                  className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                  onDoubleClick={() => onEdit && onEdit()}
                  title="Doppio click per modificare"
                >
                  <p className="text-xs text-zinc-500 dark:text-zinc-300 mb-1">
                    Ultima revisione
                  </p>
                  <p className="font-medium text-zinc-800 dark:text-zinc-50">
                    {lastInspectionDate
                      ? new Date(lastInspectionDate).toLocaleDateString("it-IT")
                      : "N/A"}
                  </p>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <p className="text-xs text-zinc-500 dark:text-zinc-300 mb-1">
                    Stato
                  </p>
                  <Chip
                    size="md"
                    classNames={{
                      base: isOnRoute
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300"
                        : isAvailable
                        ? "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-300"
                        : "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
                    }}
                  >
                    {isOnRoute
                      ? "In uso"
                      : isAvailable
                      ? "Disponibile"
                      : "In manutenzione"}
                  </Chip>
                </div>

                {vehicle.assignedUser && (
                  <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <p className="text-xs text-zinc-500 dark:text-zinc-300 mb-1">
                      Assegnato a:
                    </p>
                    <div className="flex items-center gap-2">
                      <Icon
                        icon="mdi:account"
                        className="text-blue-600 dark:text-blue-300 text-xl"
                      />
                      <p className="font-medium text-zinc-800 dark:text-zinc-50">
                        {vehicle.assignedUser}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Vehicle statistics */}
              <div className="mb-5">
                <h4 className="text-md font-semibold mb-3 text-zinc-800 dark:text-zinc-50 flex items-center gap-2">
                  <Icon
                    icon="mdi:chart-box"
                    className="text-blue-600 dark:text-blue-300"
                  />
                  <span>Statistiche</span>
                </h4>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl flex flex-col items-center border border-zinc-200 dark:border-zinc-800">
                    <Icon
                      icon="mdi:calendar-check"
                      className="text-green-600 dark:text-green-300 text-2xl mb-1"
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-300">
                      Consegne
                    </p>
                    <p className="font-bold text-lg text-zinc-800 dark:text-zinc-50">
                      127
                    </p>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl flex flex-col items-center border border-zinc-200 dark:border-zinc-800">
                    <Icon
                      icon="mdi:map-marker-distance"
                      className="text-blue-600 dark:text-blue-300 text-2xl mb-1"
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-300">
                      Km totali
                    </p>
                    <p className="font-bold text-lg text-zinc-800 dark:text-zinc-50">
                      12.586
                    </p>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl flex flex-col items-center border border-zinc-200 dark:border-zinc-800">
                    <Icon
                      icon="mdi:fuel"
                      className="text-amber-600 dark:text-amber-300 text-2xl mb-1"
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-300">
                      Consumo
                    </p>
                    <p className="font-bold text-lg text-zinc-800 dark:text-zinc-50">
                      8,2 l/100km
                    </p>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl flex flex-col items-center border border-zinc-200 dark:border-zinc-800">
                    <Icon
                      icon="mdi:wrench"
                      className="text-red-600 dark:text-red-300 text-2xl mb-1"
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-300">
                      Manutenzioni
                    </p>
                    <p className="font-bold text-lg text-zinc-800 dark:text-zinc-50">
                      3
                    </p>
                  </div>
                </div>
              </div>

              {isOnRoute && (
                <div className="mb-4">
                  <h4 className="text-md font-semibold mb-3 text-zinc-800 dark:text-zinc-50 flex items-center gap-2">
                    <Icon
                      icon="mdi:package-variant"
                      className="text-blue-600 dark:text-blue-300"
                    />
                    <span>Carico attuale</span>
                  </h4>

                  <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div className="flex justify-between mb-2">
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                        Capacità utilizzata
                      </p>
                      <p className="text-sm font-bold text-blue-600 dark:text-blue-300">
                        {capacityUsed}%
                      </p>
                    </div>
                    <Progress
                      value={capacityUsed}
                      color="primary"
                      size="md"
                      showValueLabel={false}
                      classNames={{
                        base: "bg-zinc-200 dark:bg-zinc-800",
                        indicator: "bg-blue-600 dark:bg-blue-400",
                      }}
                    />
                    <div className="flex justify-between mt-3 text-xs text-zinc-500 dark:text-zinc-300">
                      <span>0 kg</span>
                      <span>{vehicle.capacity.toLocaleString("it-IT")} kg</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Dettagli tecnici del veicolo */}
              <div className="w-full dark:bg-content1/50 bg-gray-50/80 p-4 rounded-lg mt-3">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm justify-between">
                      <span className="text-default-500">Targa:</span>
                      <span className="font-medium">{plateNumber}</span>
                    </div>
                    <div className="flex items-center text-sm justify-between">
                      <span className="text-default-500">Modello:</span>
                      <span className="font-medium">{vehicle.model}</span>
                    </div>
                    <div className="flex items-center text-sm justify-between">
                      <span className="text-default-500">Tipo:</span>
                      <span className="font-medium">{vehicle.type}</span>
                    </div>
                    <div className="flex items-center text-sm justify-between">
                      <span className="text-default-500">Capacità:</span>
                      <span className="font-medium">{vehicle.capacity} kg</span>
                    </div>
                    <div className="flex items-center text-sm justify-between">
                      <span className="text-default-500">
                        Ultima Revisione:
                      </span>
                      <span className="font-medium">
                        {new Date(lastInspectionDate).toLocaleDateString()}
                      </span>
                    </div>
                    {vehicle.assignedUser && (
                      <div className="flex items-center text-sm justify-between">
                        <span className="text-default-500">Assegnato a:</span>
                        <span className="font-medium">
                          {vehicle.assignedUser}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Statistiche di utilizzo */}
                  <div className="space-y-3">{/* ... existing code ... */}</div>
                </div>
              </div>
            </div>
          </Tab>

          <Tab
            key="inventory"
            title={
              <div className="flex items-center gap-2">
                <Icon icon="mdi:package-variant" />
                <span>Inventario</span>
              </div>
            }
          >
            <div className="p-5 bg-white dark:bg-zinc-900">
              {/* Header inventario */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h4 className="text-xl font-bold text-zinc-800 dark:text-zinc-50 flex items-center gap-2">
                    <Icon
                      icon="mdi:package-variant"
                      className="text-blue-600 dark:text-blue-300"
                    />
                    <span>Inventario Furgone</span>
                  </h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-300 mt-1">
                    Prodotti e materiali attualmente caricati nel veicolo
                  </p>
                </div>
                <div className="flex items-center gap-4">
                 
                  <div className="text-center">
                    <p className="text-xs text-zinc-500 dark:text-zinc-300">Articoli</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-300">
                      {isOnRoute ? "18" : isAvailable ? "11" : "7"}
                    </p>
                  </div>
                 
                </div>
              </div>

             

              {/* Contenuto inventario */}
              {isOnRoute || isAvailable || true ? (
                <div className="space-y-4">
                  

                  {/* Lista dettagliata prodotti */}
                  <div className="space-y-3">
                    <h5 className="text-lg font-semibold text-zinc-800 dark:text-zinc-50 flex items-center gap-2">
                      <Icon icon="mdi:format-list-bulleted" className="text-blue-600 dark:text-blue-300" />
                      Lista Prodotti Caricati
                    </h5>
                    
                    {[
                      {
                        id: "1",
                        name: "Moduli Fotovoltaici Premium",
                        category: "Energia",
                        sku: "PV-2024-001",
                        quantity: isOnRoute ? 12 : isAvailable ? 8 : 4,
                        weight: isOnRoute ? 180.5 : isAvailable ? 120.3 : 60.2,
                        destination: "Via Roma 123, Firenze",
                        icon: "mdi:solar-panel",
                        color: "amber"
                      },
                      {
                        id: "2",
                        name: "Componenti Elettronici Avanzati",
                        category: "Elettronica",
                        sku: "EL-2024-045",
                        quantity: isOnRoute ? 85 : isAvailable ? 45 : 25,
                        weight: isOnRoute ? 45.2 : isAvailable ? 28.5 : 15.8,
                        destination: "Piazza del Duomo, Firenze",
                        icon: "mdi:chip",
                        color: "blue"
                      },
                      {
                        id: "3",
                        name: "Materiali Isolanti Termici",
                        category: "Materiali",
                        sku: "MT-2024-012",
                        quantity: isOnRoute ? 50 : isAvailable ? 30 : 15,
                        weight: isOnRoute ? 120.8 : isAvailable ? 75.4 : 38.2,
                        destination: "Viale dei Mille 45, Prato",
                        icon: "mdi:cube-outline",
                        color: "green"
                      },
                      {
                        id: "4",
                        name: "Kit Strumentazione Precisione",
                        category: "Strumenti",
                        sku: "ST-2024-008",
                        quantity: isOnRoute ? 15 : isAvailable ? 10 : 5,
                        weight: isOnRoute ? 67.5 : isAvailable ? 45.0 : 22.5,
                        destination: "Via Nazionale 67, Pistoia",
                        icon: "mdi:tools",
                        color: "purple"
                      },
                      {
                        id: "5",
                        name: "Cavi Elettrici Industriali",
                        category: "Elettronica",
                        sku: "EL-2024-078",
                        quantity: isOnRoute ? 35 : isAvailable ? 20 : 10,
                        weight: isOnRoute ? 89.3 : isAvailable ? 52.1 : 26.0,
                        destination: "Via Pisana 234, Firenze",
                        icon: "mdi:cable-data",
                        color: "blue"
                      },
                      {
                        id: "6",
                        name: "Cemento Rapido Pro",
                        category: "Materiali",
                        sku: "MT-2024-089",
                        quantity: isOnRoute ? 25 : isAvailable ? 15 : 8,
                        weight: isOnRoute ? 156.7 : isAvailable ? 94.0 : 47.1,
                        destination: "Borgo San Lorenzo, Firenze",
                        icon: "mdi:sack",
                        color: "green"
                      },
                      {
                        id: "7",
                        name: "Trapano Professionale",
                        category: "Strumenti",
                        sku: "ST-2024-034",
                        quantity: isOnRoute ? 8 : isAvailable ? 5 : 3,
                        weight: isOnRoute ? 24.8 : isAvailable ? 15.5 : 9.3,
                        destination: "Via del Corso 12, Prato",
                        icon: "mdi:drill",
                        color: "purple"
                      }
                    ].filter((_, index) => {
                      if (isOnRoute) return true; // Mostra tutti i prodotti se in viaggio
                      if (isAvailable) return index < 5; // Mostra 5 prodotti se disponibile
                      return index < 3; // Mostra 3 prodotti se in manutenzione
                    }).map((product) => (
                      <div key={product.id} className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-700">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                          {/* Icona e info principale */}
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              product.color === "blue" ? "bg-blue-100 dark:bg-blue-900" :
                              product.color === "green" ? "bg-green-100 dark:bg-green-900" :
                              product.color === "purple" ? "bg-purple-100 dark:bg-purple-900" :
                              "bg-amber-100 dark:bg-amber-900"
                            }`}>
                              <Icon
                                icon={product.icon}
                                className={`text-2xl ${
                                  product.color === "blue" ? "text-blue-600 dark:text-blue-300" :
                                  product.color === "green" ? "text-green-600 dark:text-green-300" :
                                  product.color === "purple" ? "text-purple-600 dark:text-purple-300" :
                                  "text-amber-600 dark:text-amber-300"
                                }`}
                              />
                            </div>
                            <div className="flex-1">
                              <h6 className="font-bold text-zinc-800 dark:text-zinc-50 text-lg">
                                {product.name}
                              </h6>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                                  SKU: {product.sku}
                                </span>
                                <span className="text-sm text-zinc-500 dark:text-zinc-400">•</span>
                                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                                  {product.category}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Dettagli prodotto */}
                          <div className="grid grid-cols-2 gap-4 lg:gap-6">
                            <div className="text-center">
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Quantità</p>
                              <p className="font-bold text-zinc-800 dark:text-zinc-50">
                                {product.quantity} pz
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Peso</p>
                              <p className="font-bold text-zinc-800 dark:text-zinc-50">
                                {product.weight} kg
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Destinazione (solo per veicoli in movimento) */}
                        {isOnRoute && (
                          <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                            <div className="flex items-center gap-2">
                              <Icon
                                icon="mdi:map-marker"
                                className="text-blue-600 dark:text-blue-300"
                              />
                              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                                Destinazione:
                              </span>
                              <span className="text-sm text-zinc-600 dark:text-zinc-300">
                                {product.destination}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Azioni inventario */}
              {(isOnRoute || isAvailable || true) && (
                <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="flat"
                      size="md"
                      startContent={<Icon icon="mdi:plus" width={18} />}
                      className="bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-300 dark:hover:bg-green-900 font-medium"
                    >
                      Aggiungi Prodotto
                    </Button>
                    <Button
                      variant="flat"
                      size="md"
                      startContent={<Icon icon="mdi:file-export" width={18} />}
                      className="bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900 font-medium"
                    >
                      Esporta Inventario
                    </Button>
                  
                 
                  </div>
                </div>
              )}
            </div>
          </Tab>
        </Tabs>
      </CardBody>

      <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-3 px-5">
        <div className="flex items-center gap-2">
          <Icon
            icon="mdi:clock-time-four"
            className="text-zinc-500 dark:text-zinc-300"
          />
          <span className="text-sm text-zinc-500 dark:text-zinc-300">
            Ultima attività: {new Date().toLocaleDateString("it-IT")}{" "}
            {formattedTime}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="flat"
            className="bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-950 dark:text-green-300 dark:hover:bg-green-900"
            onPress={refreshPosition}
          >
            Aggiorna Posizione
          </Button>
          <Button
            size="sm"
            variant="flat"
            className="bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
          >
            Storico
          </Button>
        </div>
      </CardFooter>

      {/* Modale di conferma eliminazione */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <>
            <ModalHeader className="flex flex-col gap-1">
              Conferma Eliminazione
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-16 h-16 rounded-full bg-danger-100 dark:bg-danger-900 flex items-center justify-center mb-2">
                  <Icon
                    icon="solar:danger-triangle-bold"
                    className="text-4xl text-danger-500"
                  />
                </div>
                <p className="text-lg font-medium">
                  Sei sicuro di voler eliminare questo veicolo?
                </p>
                <p>
                  {vehicle.model} ({plateNumber})
                </p>
                <p className="text-sm text-danger-500">
                  Questa azione non può essere annullata.
                </p>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                Annulla
              </Button>
              <Button color="danger" onPress={confirmDelete}>
                Elimina
              </Button>
            </ModalFooter>
          </>
        </ModalContent>
      </Modal>
    </Card>
  );
};

export default VehicleMap;
