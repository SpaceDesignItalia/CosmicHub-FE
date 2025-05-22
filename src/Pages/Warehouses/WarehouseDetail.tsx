import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Button,
  Tabs,
  Tab,
  Input,
  Breadcrumbs,
  BreadcrumbItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Cell,
  PolarAngleAxis,
} from "recharts";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";

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

// Definizione dell'interfaccia Warehouse basata sui dati forniti
interface Warehouse {
  warehouse_id: string;
  WarehouseID?: string;
  WarehouseUUID?: string;
  name: string;
  WarehouseName?: string;
  location: string;
  WarehouseAdress?: string;
  WarehouseCode?: string;
  WarehouseCountry?: string;
  company_id: string;
  created_at: Date | string;
  created_by: string;
  CreatedAt?: Date;
  CreatedBy?: string;
  UpdatedAt?: Date;
  capacity: string;
  type: string;
  license_plate: string | null;
  last_inspection: string | null;
  type_name: string;
  IsActive?: boolean;
  latitude?: number;
  longitude?: number;
  last_updated?: Date | string;
  floorplan_url?: string;
}

interface Employee {
  user_id: string;
  name: string;
  surname: string;
  email: string;
  company_id: string;
}

const WarehouseDetail: React.FC = () => {
  const { UUID } = useParams<{ UUID: string }>();
  const navigate = useNavigate();

  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("overview");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [createdByUser, setCreatedByUser] = useState<Employee | null>(null);

  // Stati per la mappa Google Maps
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [zoom, setZoom] = useState(15);
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "AIzaSyCiwX6kfGN0syLMPqy1JXLNxct0woowciA",
    libraries: libraries,
  });

  // Stato per la finestra info della mappa (per compatibilità)
  const [infoOpen, setInfoOpen] = useState<boolean>(true);

  // Stati per il modal di modifica
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const [editForm, setEditForm] = useState<{
    name: string;
    location: string;
    capacity: string;
  }>({
    name: "",
    location: "",
    capacity: "",
  });
  const [isEditLoading, setIsEditLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Stati per il modal di eliminazione
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [isDeleteLoading, setIsDeleteLoading] = useState<boolean>(false);

  // Stati per la planimetria interattiva
  const [floorplanScale, setFloorplanScale] = useState(1);
  const [floorplanPosition, setFloorplanPosition] = useState({ x: 0, y: 0 });
  const floorplanRef = useRef<HTMLImageElement>(null);
  const floorplanContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // URL della planimetria (DA SOSTITUIRE CON QUELLO REALE o prenderlo da warehouse.floorplan_url)
  const ACTUAL_FLOORPLAN_URL =
    warehouse?.floorplan_url ||
    "https://www.ilgigantecentricommerciali.it/media/corporate/proprieta/immobiliare/curtatone/magazzini-1_piano/gallery/magazzini_1_piano_curtatone-il-gigante-centri-commerciali_5.jpg";

  // Funzioni per la mappa
  const onLoad = useCallback(
    (map: google.maps.Map) => {
      map.setZoom(zoom);
      setMap(map);
      // Assicuriamo che l'InfoWindow sia aperta
      setInfoOpen(true);
    },
    [zoom]
  );

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleZoomIn = () => {
    if (map) {
      const newZoom = Math.min((map.getZoom() || 15) + 1, 20);
      map.setZoom(newZoom);
      setZoom(newZoom);
    }
  };

  const handleZoomOut = () => {
    if (map) {
      const currentZoom = map.getZoom() || 15;
      const newZoom = Math.max(currentZoom - 1, 1);
      map.setZoom(newZoom);
      setZoom(newZoom);
    }
  };

  const handleOpenNavigation = () => {
    if (warehouse && warehouse.location) {
      const address = encodeURIComponent(warehouse.location);
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const url = isMobile
        ? `https://maps.google.com/?q=${address}`
        : `https://www.google.com/maps/dir/?api=1&destination=${address}`;
      window.open(url, "_blank");
    }
  };

  const handleMarkerClick = () => {
    // Toggle dell'infoWindow
    setInfoOpen((prev) => !prev);
  };

  useEffect(() => {
    const fetchWarehouseDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/Warehouse/GET/GetWarehouseByUUID`, {
          params: {
            warehouse_uuid: UUID,
          },
        });

        // Normalizziamo i nomi dei campi per compatibilità
        const warehouseData = {
          ...response.data,
          name: response.data.name || response.data.WarehouseName,
          location: response.data.location || response.data.WarehouseAdress,
        };

        setWarehouse(warehouseData);

        // Inizializza il form di modifica con i dati attuali
        if (warehouseData) {
          setEditForm({
            name: warehouseData.name || warehouseData.WarehouseName || "",
            location:
              warehouseData.location || warehouseData.WarehouseAdress || "",
            capacity: warehouseData.capacity || "",
          });

          // Recupera i dettagli dell'utente che ha creato il magazzino
          const creatorId = warehouseData.CreatedBy || warehouseData.created_by;
          if (creatorId) {
            const employeeData = await fetchEmployeeDetails(creatorId);
            if (employeeData && employeeData.company_id) {
              await fetchCompanyDetails(employeeData.company_id);
            }
          }
        }

        setError(null);
      } catch (err) {
        setError("Impossibile caricare i dettagli del magazzino");
        setLoading(false);
      }
    };

    const fetchEmployeeDetails = async (employeeId: string) => {
      try {
        const employeeResponse = await axios.get(
          `/Employee/GET/GetEmployeeById`,
          {
            params: {
              employeeId: employeeId,
            },
          }
        );

        if (employeeResponse.data) {
          setCreatedByUser(employeeResponse.data);
          return employeeResponse.data;
        }
        return null;
      } catch (err) {
        // Non interrompiamo il flusso principale in caso di errore
        return null;
      }
    };

    const fetchCompanyDetails = async (companyId: string) => {
      try {
        const companyResponse = await axios.get(
          `/Company/GET/GetCompanyByCompanyId`,
          {
            params: {
              company_id: companyId,
            },
          }
        );

        if (companyResponse.data && companyResponse.data.name) {
          setCompanyName(companyResponse.data.name);
        }
      } catch (err) {
        // Non interrompiamo il flusso principale in caso di errore nel caricamento dell'azienda
      } finally {
        setLoading(false);
      }
    };

    const fetchWarehouses = async () => {
      try {
        const response = await axios.get("/Warehouse/GET/GetAllWarehouses");
        setWarehouses(response.data || []);
      } catch (err) {
        // Gestione errore
      }
    };

    if (UUID) {
      fetchWarehouseDetails();
      fetchWarehouses();
    }
  }, [UUID]);

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Gestione del form di modifica
  const handleEditFormChange = (field: string, value: string) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Salvataggio delle modifiche
  const handleSaveChanges = async () => {
    if (!warehouse || !UUID) return;

    setIsEditLoading(true);
    try {
      // Endpoint per l'aggiornamento del magazzino
      await axios.put(`/Warehouse/UPDATE/UpdateWarehouse`, {
        warehouse_uuid: UUID,
        WarehouseID: warehouse.WarehouseID,
        WarehouseUUID: warehouse.WarehouseUUID,
        WarehouseName: editForm.name,
        WarehouseAdress: editForm.location,
        capacity: editForm.capacity,
        company_id: warehouse.company_id,
        IsActive: warehouse.IsActive !== false, // Manteniamo lo stato attivo
      });

      // Aggiorna i dati locali
      setWarehouse((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          name: editForm.name,
          WarehouseName: editForm.name,
          location: editForm.location,
          WarehouseAdress: editForm.location,
          capacity: editForm.capacity,
        };
      });

      onEditClose();
      // Mostra il messaggio di successo
      setSuccessMessage("Magazzino modificato con successo!");
      // Nascondi il messaggio dopo 3 secondi
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Errore durante l'aggiornamento del magazzino:", error);
      // Gestire l'errore qui (es. mostrare un messaggio all'utente)
    } finally {
      setIsEditLoading(false);
    }
  };

  // Eliminazione del magazzino
  const handleDeleteWarehouse = async () => {
    if (!UUID) return;

    setIsDeleteLoading(true);
    try {
      await axios.delete(`/Warehouse/DELETE/DeleteWarehouse`, {
        params: {
          warehouse_uuid: UUID,
        },
      });

      // Mostra il messaggio di successo
      setSuccessMessage("Magazzino eliminato con successo!");

      // Chiudi il modal di conferma
      onDeleteClose();

      // Attendi un breve momento per far vedere il messaggio
      setTimeout(() => {
        // Reindirizza alla home
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Errore durante l'eliminazione del magazzino:", error);
      // Gestire l'errore qui (es. mostrare un messaggio all'utente)
      setIsDeleteLoading(false);
      onDeleteClose();
    }
  };

  // Funzioni per lo zoom della planimetria
  const handleFloorplanZoomIn = () => {
    setFloorplanScale((prevScale) => Math.min(prevScale * 1.2, 3));
  };

  const handleFloorplanZoomOut = () => {
    setFloorplanScale((prevScale) => Math.max(prevScale / 1.2, 0.5));
  };

  const handleResetFloorplanView = () => {
    setFloorplanScale(1);
    setFloorplanPosition({ x: 0, y: 0 });
  };

  // Gestori eventi per il drag (pan) della planimetria
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!floorplanRef.current) return;
    setIsDragging(true);
    // Posizione del mouse relativa al contenitore dell'immagine
    setDragStart({
      x: e.clientX - floorplanPosition.x,
      y: e.clientY - floorplanPosition.y,
    });
    e.preventDefault(); // Previene il drag di default dell'immagine
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !floorplanRef.current || !floorplanContainerRef.current)
      return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    setFloorplanPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center">
          <Icon
            icon="solar:spinner-outline"
            className="animate-spin"
            width={48}
          />
          <p className="mt-4">Caricamento in corso...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center">
          <Icon
            icon="solar:danger-triangle-bold"
            className="text-danger"
            width={48}
          />
          <p className="mt-4">{error}</p>
          <Button
            className="mt-4"
            color="primary"
            onPress={() => navigate("/dashboard")}
          >
            Torna alla Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center">
          <Icon
            icon="solar:danger-triangle-bold"
            className="text-danger"
            width={48}
          />
          <p className="mt-4">Magazzino non trovato</p>
          <Button
            className="mt-4"
            color="primary"
            onPress={() => navigate("/dashboard")}
          >
            Torna alla Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Valore fisso al 50% per la percentuale di capacità
  const capacityUsage = 69;
  const capacityColor =
    capacityUsage > 80 ? "danger" : capacityUsage > 60 ? "warning" : "success";

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs className="mb-4">
        <BreadcrumbItem onPress={() => navigate("/dashboard")}>
          Dashboard
        </BreadcrumbItem>
        <BreadcrumbItem onPress={() => navigate("/dashboard")}>
          Magazzini
        </BreadcrumbItem>
        <BreadcrumbItem>{warehouse.name}</BreadcrumbItem>
      </Breadcrumbs>

      {/* Messaggio di successo */}
      {successMessage && (
        <div className="mb-4 rounded-md bg-success-100 p-4 text-success-700">
          <div className="flex items-center">
            <Icon icon="solar:check-circle-bold" className="mr-2" width={20} />
            <p>{successMessage}</p>
          </div>
        </div>
      )}

      {/* Header con info principali */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Icon
              icon="mdi:warehouse"
              className="text-primary"
              width={28}
              height={28}
            />
          </div>
          <div className="ml-4">
            <h1 className="text-2xl font-bold">{warehouse.name}</h1>
            <div className="flex items-center">
              <p className="text-default-500">
                Codice: {warehouse.WarehouseCode || "#N/A"}
              </p>
            </div>
            {companyName && (
              <p className="text-default-500">Azienda: {companyName}</p>
            )}
          </div>
        </div>
        <div className="mt-4 flex space-x-2 md:mt-0">
          <Button
            color="primary"
            variant="flat"
            startContent={<Icon icon="solar:pen-bold" width={18} />}
            onPress={onEditOpen}
          >
            Modifica
          </Button>
          <Button
            color="danger"
            variant="flat"
            startContent={<Icon icon="solar:trash-bin-trash-bold" width={18} />}
            onPress={onDeleteOpen}
          >
            {warehouse.IsActive === false ? "Elimina" : "Disattiva"}
          </Button>
        </div>
      </div>

      {/* Avviso magazzino disattivato */}
      {warehouse.IsActive === false && (
        <div className="mb-6 flex items-center rounded-lg bg-danger-50 p-4 text-danger-700">
          <Icon icon="solar:info-circle-bold" className="mr-3" width={24} />
          <div>
            <p className="font-medium">Questo magazzino è disattivato</p>
            <p className="text-sm">
              Questo magazzino non è attualmente utilizzabile ma è possibile
              riattivarlo dalla pagina di modifica.
            </p>
          </div>
        </div>
      )}

      {/* Modal di modifica */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="2xl">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Modifica Magazzino
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm">Nome</p>
                <Input
                  placeholder="Nome del magazzino"
                  value={editForm.name}
                  onChange={(e) => handleEditFormChange("name", e.target.value)}
                />
              </div>
              <div>
                <p className="mb-2 text-sm">Posizione</p>
                <Input
                  placeholder="Posizione del magazzino"
                  value={editForm.location}
                  onChange={(e) =>
                    handleEditFormChange("location", e.target.value)
                  }
                />
              </div>
              <div>
                <p className="mb-2 text-sm">Capacità (m³)</p>
                <Input
                  placeholder="Capacità del magazzino"
                  type="number"
                  value={editForm.capacity}
                  onChange={(e) =>
                    handleEditFormChange("capacity", e.target.value)
                  }
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={onEditClose}>
              Annulla
            </Button>
            <Button
              color="primary"
              onPress={handleSaveChanges}
              isLoading={isEditLoading}
            >
              Salva Modifiche
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal di conferma eliminazione */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} size="md">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Conferma Eliminazione
          </ModalHeader>
          <ModalBody>
            <p>
              Sei sicuro di voler eliminare il magazzino{" "}
              <strong>{warehouse.name}</strong>?
            </p>
            <p className="mt-2 text-danger">
              Questa azione è irreversibile e comporterà la perdita di tutti i
              dati associati.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={onDeleteClose}>
              Annulla
            </Button>
            <Button
              color="danger"
              onPress={handleDeleteWarehouse}
              isLoading={isDeleteLoading}
            >
              Elimina
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Tabs di navigazione */}
      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(key as string)}
        className="mb-6"
      >
        <Tab key="overview" title="Panoramica" />
        <Tab key="floorplan" title="Planimetria" />
        <Tab key="inventory" title="Inventario" />
        <Tab key="operations" title="Operazioni" />
        <Tab key="history" title="Storico" />
      </Tabs>

      {/* Contenuto in base alla tab selezionata */}
      {selectedTab === "overview" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Card Informazioni generali - Occupazione 2/3 in prima riga */}
          <Card className="col-span-1 md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center">
                <Icon
                  icon="solar:info-circle-bold"
                  className="mr-2 text-primary"
                  width={20}
                />
                <h2 className="text-lg font-semibold">Informazioni Generali</h2>
              </div>
            </CardHeader>
            <Divider />
            <CardBody>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-default-500">Nome</p>
                    <p className="text-foreground font-medium">
                      {warehouse.name || warehouse.WarehouseName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Codice</p>
                    <p className="text-foreground font-medium">
                      {warehouse.WarehouseCode || "Non specificato"}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-default-500">
                      Data di creazione
                    </p>
                    <p className="text-foreground font-medium">
                      {warehouse.CreatedAt
                        ? formatDate(warehouse.CreatedAt)
                        : formatDate(warehouse.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Creato da</p>
                    <p className="text-foreground font-medium">
                      {createdByUser
                        ? `${createdByUser.name} ${createdByUser.surname}`
                        : `ID: ${warehouse.CreatedBy || warehouse.created_by}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Ultima modifica</p>
                    <p className="text-foreground font-medium">
                      {warehouse.UpdatedAt
                        ? formatDate(warehouse.UpdatedAt)
                        : warehouse.last_updated
                        ? formatDate(warehouse.last_updated)
                        : "Mai modificato"}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-default-500">Azienda</p>
                    <p className="text-foreground font-medium">
                      {companyName || warehouse.company_id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Indirizzo</p>
                    <p className="text-foreground font-medium">
                      {warehouse.WarehouseAdress ||
                        warehouse.location ||
                        "Non specificato"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Paese</p>
                    <p className="text-foreground font-medium">
                      {warehouse.WarehouseCountry || "Non specificato"}
                    </p>
                  </div>
                  {warehouse.last_inspection && (
                    <div>
                      <p className="text-sm text-default-500">
                        Ultima ispezione
                      </p>
                      <p className="text-foreground font-medium">
                        {formatDate(warehouse.last_inspection)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Card Capacità - Occupazione 1/3 in prima riga */}
          <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center">
                <Icon
                  icon="solar:box-minimalistic-bold"
                  className="mr-2 text-primary"
                  width={20}
                />
                <h2 className="text-lg font-semibold">Capacità</h2>
              </div>
            </CardHeader>
            <Divider />
            <CardBody>
              <div className="flex flex-col items-center justify-center">
                <div className="relative flex h-48 w-48 items-center justify-center">
                  <ResponsiveContainer width="100%" height={192}>
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      barSize={12}
                      data={[
                        {
                          name: "Utilizzato",
                          value: capacityUsage,
                          fill: `hsl(var(--heroui-${capacityColor}))`,
                        },
                      ]}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <PolarAngleAxis
                        type="number"
                        domain={[0, 100]}
                        angleAxisId={0}
                        tick={false}
                      />
                      <RadialBar background dataKey="value" cornerRadius={12}>
                        <Cell fill={`hsl(var(--heroui-${capacityColor}))`} />
                      </RadialBar>
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold">{capacityUsage}%</span>
                    <p className="mt-2 text-sm text-default-500">Utilizzato</p>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-default-500">Capacità totale</p>
                  <p className="text-xl font-semibold">
                    {parseInt(warehouse.capacity, 10).toLocaleString()} m³
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Card Mappa posizione - Spostata in fondo a tutta larghezza */}
          <Card className="col-span-1 md:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center">
                <Icon
                  icon="solar:map-point-linear"
                  className="mr-2 text-primary"
                  width={20}
                />
                <h2 className="text-lg font-semibold">Mappa Posizione</h2>
              </div>
            </CardHeader>
            <Divider />
            <CardBody>
              <div className="relative h-96 w-full rounded-lg overflow-hidden">
                {(() => {
                  // Controllo se abbiamo informazioni sufficienti per la posizione
                  const address =
                    warehouse.WarehouseAdress || warehouse.location;
                  const country = warehouse.WarehouseCountry;
                  const fullAddress =
                    address && country
                      ? `${address}, ${country}`
                      : address || country;

                  // Coordinate di fallback per Milano
                  const latitude = warehouse.latitude || 45.4642;
                  const longitude = warehouse.longitude || 9.19;
                  const center = { lat: latitude, lng: longitude };

                  // Messaggio se non è possibile recuperare la posizione
                  if (!fullAddress) {
                    return (
                      <div className="flex h-full w-full items-center justify-center rounded-lg bg-default-100">
                        <div className="text-center p-6">
                          <Icon
                            icon="solar:map-linear"
                            className="mx-auto mb-4 text-default-400"
                            width={48}
                          />
                          <p className="text-default-600 font-medium">
                            Impossibile visualizzare la mappa
                          </p>
                          <p className="text-default-500 mt-2">
                            Non ci sono informazioni sufficienti sulla posizione
                            del magazzino.
                          </p>
                        </div>
                      </div>
                    );
                  }

                  if (!isLoaded) {
                    return (
                      <div className="flex h-full w-full items-center justify-center rounded-lg bg-default-100">
                        <span className="text-default-500">
                          Caricamento mappa...
                        </span>
                      </div>
                    );
                  }

                  const mapOptions = {
                    disableDefaultUI: true,
                    styles: mapStyles,
                    zoomControl: false,
                  };

                  return (
                    <div className="relative h-full w-full">
                      <GoogleMap
                        mapContainerClassName="w-full h-full rounded-lg"
                        center={center}
                        zoom={zoom}
                        onLoad={onLoad}
                        onUnmount={onUnmount}
                        options={mapOptions}
                      >
                        <Marker position={center} onClick={handleMarkerClick} />
                        {infoOpen && (
                          <InfoWindow
                            position={center}
                            onCloseClick={() => setInfoOpen(false)}
                          >
                            <div
                              style={{
                                padding: "12px",
                                backgroundColor: "#ffffff",
                                borderRadius: "4px",
                                width: "250px",
                              }}
                            >
                              <div
                                style={{
                                  marginBottom: "6px",
                                  fontSize: "14px",
                                  fontWeight: 600,
                                  color: "#333333",
                                  textAlign: "left",
                                }}
                              >
                                {warehouse.name || warehouse.WarehouseName}
                              </div>
                              <div
                                style={{
                                  fontSize: "13px",
                                  color: "#555555",
                                  textAlign: "left",
                                }}
                              >
                                {fullAddress}
                              </div>
                            </div>
                          </InfoWindow>
                        )}
                      </GoogleMap>

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
                    </div>
                  );
                })()}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Contenuto Tab Planimetria */}
      {selectedTab === "floorplan" && (
        <Card className="col-span-1 md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center">
              <Icon
                icon="solar:map-arrow-square-bold"
                className="mr-2 text-primary"
                width={20}
              />
              <h2 className="text-lg font-semibold">Planimetria Magazzino</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                onPress={handleFloorplanZoomIn}
                title="Zoom In"
              >
                <Icon icon="solar:magnifer-zoom-in-linear" width={18} />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                onPress={handleFloorplanZoomOut}
                title="Zoom Out"
              >
                <Icon icon="solar:magnifer-zoom-out-linear" width={18} />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                onPress={handleResetFloorplanView}
                title="Reset View"
              >
                <Icon icon="solar:refresh-linear" width={18} />
              </Button>
            </div>
          </CardHeader>
          <Divider />
          <CardBody>
            <div
              ref={floorplanContainerRef}
              className="relative h-[600px] w-full rounded-lg overflow-hidden bg-default-100 cursor-grab select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            >
              {ACTUAL_FLOORPLAN_URL ? (
                <img
                  ref={floorplanRef}
                  src={ACTUAL_FLOORPLAN_URL}
                  alt={`Planimetria ${warehouse.name}`}
                  className="absolute top-0 left-0 origin-top-left transition-transform duration-100 ease-out"
                  style={{
                    transform: `translate(${floorplanPosition.x}px, ${floorplanPosition.y}px) scale(${floorplanScale})`,
                    cursor: isDragging ? "grabbing" : "grab",
                    willChange: "transform",
                    maxWidth: "none",
                    maxHeight: "none",
                  }}
                  draggable="false"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <p className="text-default-500">
                    URL planimetria non specificato.
                  </p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {selectedTab === "inventory" && (
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-default-200">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Icon
                  icon="solar:box-minimalistic-bold"
                  className="text-primary"
                  width={40}
                />
              </div>
            </div>
            <p className="mt-4 text-default-500">
              Inventario del magazzino non disponibile
            </p>
            <Button color="primary" className="mt-4" size="sm">
              Visualizza Inventario
            </Button>
          </div>
        </div>
      )}

      {selectedTab === "operations" && (
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-default-200">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Icon
                  icon="solar:settings-bold"
                  className="text-primary"
                  width={40}
                />
              </div>
            </div>
            <p className="mt-4 text-default-500">Nessuna operazione recente</p>
            <Button color="primary" className="mt-4" size="sm">
              Registra Operazione
            </Button>
          </div>
        </div>
      )}

      {selectedTab === "history" && warehouses && warehouses.length === 0 ? (
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-default-200">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Icon
                  icon="solar:add-circle-bold"
                  className="text-primary"
                  width={40}
                />
              </div>
            </div>
            <p className="mt-4 text-default-500">
              Non ci sono magazzini disponibili
            </p>
            <Button
              color="primary"
              className="mt-4"
              size="sm"
              startContent={<Icon icon="solar:add-circle-bold" width={18} />}
              onPress={() => navigate("/warehouses/new")}
            >
              Aggiungi Magazzino
            </Button>
          </div>
        </div>
      ) : (
        selectedTab === "history" && (
          <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-default-200">
            <div className="text-center">
              <div className="flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <Icon
                    icon="solar:history-bold"
                    className="text-primary"
                    width={40}
                  />
                </div>
              </div>
              <p className="mt-4 text-default-500">Storico non disponibile</p>
              <Button color="primary" className="mt-4" size="sm">
                Visualizza Storico
              </Button>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default WarehouseDetail;
