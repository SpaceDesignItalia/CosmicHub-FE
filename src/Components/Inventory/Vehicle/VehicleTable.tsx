import { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardBody,
  CardHeader,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Chip,
  Pagination,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  getKeyValue,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import VehicleMap from "../VehicleMap";

// Tipi di dati
interface Vehicle {
  id: string;
  plate: string;
  model: string;
  type: string;
  capacity: number;
  status: "Disponibile" | "In uso" | "In manutenzione";
  lastInspection: string;
  assignedUser?: string; // Nome dell'utente a cui è assegnato il veicolo
}

interface VehicleTableProps {
  vehicles: Vehicle[];
  vehicleTypes: string[];
}

// Coordinate del deposito
const DEPOSITO_COORDINATES = {
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

export default function VehicleTable({
  vehicles,
  vehicleTypes,
}: VehicleTableProps) {
  const navigate = useNavigate();
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [selectedVehicleType, setSelectedVehicleType] = useState("Tutti");
  const [currentVehiclePage, setCurrentVehiclePage] = useState(1);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [vehiclesWithStatus, setVehiclesWithStatus] =
    useState<Vehicle[]>(vehicles);

  const perPage = 5;

  // Funzione per aggiornare lo stato dei veicoli
  const updateVehiclesStatus = async () => {
    try {
      // Recupera i dati dei veicoli
      const vehiclesResponse = await axios.get(`/Warehouse/GET/GetAllVehicles`);

      if (vehiclesResponse.data) {
        // Per ogni veicolo, recuperiamo anche l'utente assegnato
        const updatedVehicles = await Promise.all(
          vehicles.map(async (vehicle) => {
            const currentVehicle = vehiclesResponse.data.find(
              (v: any) => v.warehouse_id === vehicle.id
            );

            // Inizializza lo stato del veicolo in base alla posizione
            let updatedVehicle = { ...vehicle };

            if (
              currentVehicle &&
              currentVehicle.location &&
              currentVehicle.location !== "N/A"
            ) {
              const [lat, lng] = currentVehicle.location.split(" ").map(Number);
              if (lat && lng) {
                const distance = calculateDistance(
                  lat,
                  lng,
                  DEPOSITO_COORDINATES.lat,
                  DEPOSITO_COORDINATES.lng
                );

                // Aggiorna lo stato in base alla distanza
                if (distance <= PROXIMITY_RADIUS) {
                  updatedVehicle.status = "Disponibile";
                } else {
                  updatedVehicle.status = "In uso";
                }
              }
            } else {
              // Se non ci sono coordinate valide, il veicolo è in manutenzione
              updatedVehicle.status = "In manutenzione";
            }

            // Recupera l'utente assegnato al veicolo
            try {
              // Prima chiamata per ottenere l'ID dell'utente assegnato al veicolo
              const userIdResponse = await axios.get(
                `/Warehouse/GET/GetUserByVehicleId`,
                {
                  params: {
                    vehicleId: vehicle.id,
                  },
                }
              );

              // Se c'è un utente assegnato
              if (userIdResponse.data && userIdResponse.data.user_id) {
                // Seconda chiamata per ottenere i dettagli dell'utente
                const employeeResponse = await axios.get(
                  `/Employee/GET/GetEmployeeById`,
                  {
                    params: {
                      employeeId: userIdResponse.data.user_id,
                    },
                  }
                );

                if (employeeResponse.data && employeeResponse.data.name) {
                  updatedVehicle.assignedUser = `${
                    employeeResponse.data.name
                  } ${employeeResponse.data.surname || ""}`;
                }
              }
            } catch (error) {
              // Se non c'è un utente assegnato o si verifica un errore, continuiamo senza assegnare utente
              console.log(`Nessun utente assegnato al veicolo ${vehicle.id}`);
            }

            return updatedVehicle;
          })
        );

        setVehiclesWithStatus(updatedVehicles);
      }
    } catch (error) {
      console.error("Errore nel recupero delle coordinate dei veicoli:", error);
    }
  };

  // Aggiorna lo stato dei veicoli ogni 30 secondi
  useEffect(() => {
    updateVehiclesStatus();
    const interval = setInterval(updateVehiclesStatus, 30000);
    return () => clearInterval(interval);
  }, [vehicles]);

  // Filter vehicles usando vehiclesWithStatus invece di vehicles
  const filteredVehicles = vehiclesWithStatus.filter((vehicle) => {
    const matchSearch =
      vehicle.model.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      vehicle.plate.toLowerCase().includes(vehicleSearch.toLowerCase());
    const matchType =
      selectedVehicleType === "Tutti" || vehicle.type === selectedVehicleType;
    return matchSearch && matchType;
  });

  // Paginate vehicles
  const vehicleStartIndex = (currentVehiclePage - 1) * perPage;
  const paginatedVehicles = filteredVehicles.slice(
    vehicleStartIndex,
    vehicleStartIndex + perPage
  );

  // Open vehicle modal
  const openVehicleModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    onOpen();
  };

  // Open delete confirmation modal
  const openDeleteModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setDeleteError("");
    setIsDeleteModalOpen(true);
  };

  // Delete vehicle
  const deleteVehicle = async () => {
    if (!selectedVehicle) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      await axios.delete(`/api/v1/warehouses/${selectedVehicle.id}`);
      // Chiudi il modal e aggiorna la pagina
      setIsDeleteModalOpen(false);
      // Qui dovresti aggiornare la lista dei veicoli - in un'applicazione reale
      // potresti fare un refresh dei dati o rimuovere l'elemento dall'array locale
      window.location.reload();
    } catch (error) {
      console.error("Errore durante l'eliminazione del veicolo:", error);
      setDeleteError("Impossibile eliminare il veicolo. Riprova più tardi.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Status color mapping
  const vehicleStatusColorMap = {
    Disponibile: "success",
    "In uso": "primary",
    "In manutenzione": "warning",
  };

  // Definizione delle colonne
  const columns = [
    { key: "plate", label: "TARGA", align: "start" },
    { key: "model", label: "MODELLO", align: "start" },
    { key: "type", label: "TIPO", align: "start" },
    { key: "capacity", label: "CAPACITÀ (KG)", align: "end" },
    { key: "lastInspection", label: "ULTIMA REVISIONE", align: "center" },
    { key: "status", label: "STATO", align: "center" },
    { key: "actions", label: "AZIONI", align: "end" },
  ];

  // Renderizza celle personalizzate
  const renderCell = (vehicle: Vehicle, columnKey: string) => {
    switch (columnKey) {
      case "plate":
        return <div className="font-medium text-left">{vehicle.plate}</div>;
      case "model":
        return <div className="text-left">{vehicle.model}</div>;
      case "type":
        return <div className="text-left">{vehicle.type}</div>;
      case "capacity":
        return (
          <div className="text-right">
            {vehicle.capacity.toLocaleString("it-IT")}
          </div>
        );
      case "lastInspection":
        return (
          <div className="text-center">
            {new Date(vehicle.lastInspection).toLocaleDateString("it-IT")}
          </div>
        );
      case "status":
        return (
          <div className="flex justify-center">
            <Chip
              color={vehicleStatusColorMap[vehicle.status] as any}
              variant="flat"
            >
              {vehicle.status}
            </Chip>
          </div>
        );
      case "actions":
        return (
          <div className="flex justify-end gap-2">
            <Tooltip content="Visualizza dettagli">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => openVehicleModal(vehicle)}
              >
                <Icon icon="solar:eye-linear" width={20} />
              </Button>
            </Tooltip>
            <Tooltip content="Modifica">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => navigate(`/vehicles/edit/${vehicle.id}`)}
              >
                <Icon icon="solar:pen-linear" width={20} />
              </Button>
            </Tooltip>
            <Tooltip content="Elimina">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="danger"
                onPress={() => openDeleteModal(vehicle)}
              >
                <Icon icon="solar:trash-bin-trash-linear" width={20} />
              </Button>
            </Tooltip>
          </div>
        );
      default:
        return (
          <div className="text-left">{getKeyValue(vehicle, columnKey)}</div>
        );
    }
  };

  // Adatta il veicolo al formato richiesto dal componente VehicleMap
  const adaptVehicleForMap = (vehicle: Vehicle) => {
    return {
      id: vehicle.id,
      license_plate: vehicle.plate,
      model: vehicle.model,
      type: vehicle.type,
      capacity: vehicle.capacity,
      stato: vehicle.status,
      last_inspection_date: vehicle.lastInspection,
      // Valori predefiniti per la visualizzazione sulla mappa
      usedCapacity: 0,
      position: "Deposito principale",
      assignedUser: vehicle.assignedUser,
    };
  };

  return (
    <>
      <Card className="w-full mt-6 shadow-sm rounded-xl overflow-hidden border-2 border-default-200">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-3">
              <Input
                placeholder="Cerca per targa o modello..."
                startContent={<Icon icon="solar:magnifer-line-duotone" />}
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
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
        </CardHeader>
        <CardBody className="p-0 ">
          <Table
            aria-label="Tabella veicoli"
            hideHeader={false}
            shadow="none"
            className="rounded-md overflow-hidden"
            classNames={{
              base: "shadow-none",
              table: "min-w-full",
              thead: "border-none",
              tbody: "border-none",
              tr: "[&:not(:last-child)]:border-b [&:not(:last-child)]:border-default-100 hover:bg-default-50",
              th: "text-default-700 font-medium text-xs uppercase tracking-wider py-3 px-3 border-none",
              td: "py-3 px-3 border-none",
              tfoot: "border-none",
              wrapper: "border-none",
            }}
          >
            <TableHeader>
              {columns.map((column) => (
                <TableColumn
                  key={column.key}
                  align={column.align as any}
                  className={`${
                    column.align === "end"
                      ? "text-right"
                      : column.align === "center"
                      ? "text-center"
                      : "text-left"
                  }`}
                >
                  {column.label}
                </TableColumn>
              ))}
            </TableHeader>
            <TableBody emptyContent="Nessun veicolo trovato">
              {paginatedVehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  {(columnKey) => (
                    <TableCell>
                      {renderCell(vehicle, columnKey.toString())}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex w-full justify-center py-4 bg-default-100">
            <Pagination
              total={Math.ceil(filteredVehicles.length / perPage)}
              initialPage={1}
              page={currentVehiclePage}
              onChange={setCurrentVehiclePage}
              showControls
              size="lg"
              radius="lg"
              variant="bordered"
              classNames={{
                wrapper: "gap-2",
                item: "w-10 h-10 text-medium",
                cursor: "bg-primary text-white font-medium",
                prev: "bg-default-100 border border-default-300",
                next: "bg-default-100 border border-default-300",
              }}
            />
          </div>
        </CardBody>
      </Card>

      {/* Modale dettaglio veicolo con VehicleMap */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="4xl"
        classNames={{
          base: "max-w-5xl",
        }}
      >
        <ModalContent>
          {selectedVehicle && (
            <>
              <ModalHeader className="flex flex-col gap-1 border-b">
                Dettagli Veicolo - {selectedVehicle.plate}
              </ModalHeader>
              <ModalBody className="p-0">
                {/* Utilizziamo VehicleMap per mostrare i dettagli del veicolo */}
                <VehicleMap vehicle={adaptVehicleForMap(selectedVehicle)} />
              </ModalBody>
              <ModalFooter className="border-t">
                <Button color="danger" variant="light" onPress={onClose}>
                  Chiudi
                </Button>
                <Button
                  color="primary"
                  onPress={() => {
                    onClose();
                    navigate(`/vehicles/edit/${selectedVehicle.id}`);
                  }}
                >
                  Modifica
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modale conferma eliminazione */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      >
        <ModalContent>
          {selectedVehicle && (
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
                    {selectedVehicle.model} ({selectedVehicle.plate})
                  </p>
                  <p className="text-sm text-danger-500">
                    Questa azione non può essere annullata.
                  </p>
                  {deleteError && (
                    <div className="mt-2 p-3 bg-danger-50 text-danger-700 dark:bg-danger-900 dark:text-danger-300 rounded-lg w-full">
                      {deleteError}
                    </div>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="flat"
                  onPress={() => setIsDeleteModalOpen(false)}
                >
                  Annulla
                </Button>
                <Button
                  color="danger"
                  onPress={deleteVehicle}
                  isLoading={isDeleting}
                >
                  Elimina
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
