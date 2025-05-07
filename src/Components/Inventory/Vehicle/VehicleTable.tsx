import { useState } from "react";
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
// Tipi di dati
interface Vehicle {
  id: string;
  plate: string;
  model: string;
  type: string;
  capacity: number;
  status: "Disponibile" | "In uso" | "In manutenzione";
  lastInspection: string;
}

interface VehicleTableProps {
  vehicles: Vehicle[];
  vehicleTypes: string[];
}

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

  const perPage = 5;

  // Filter vehicles
  const filteredVehicles = vehicles.filter((vehicle) => {
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
            <Tooltip content="View details">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => openVehicleModal(vehicle)}
              >
                <Icon icon="solar:eye-linear" width={20} />
              </Button>
            </Tooltip>
            <Tooltip content="Edit">
              <Button isIconOnly size="sm" variant="light">
                <Icon icon="solar:pen-linear" width={20} />
              </Button>
            </Tooltip>
            <Tooltip content="Delete">
              <Button isIconOnly size="sm" variant="light" color="danger">
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
              onPress={() => navigate("/vehicles/add-vehicle")}
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

      {/* Modale dettaglio veicolo */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          {selectedVehicle && (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Vehicle Details
              </ModalHeader>
              <ModalBody>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-small text-default-500">ID Veicolo</p>
                    <p>{selectedVehicle.id}</p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">Targa</p>
                    <p>{selectedVehicle.plate}</p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">Modello</p>
                    <p>{selectedVehicle.model}</p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">Tipo</p>
                    <p>{selectedVehicle.type}</p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">Capacità</p>
                    <p>{selectedVehicle.capacity.toLocaleString("it-IT")} kg</p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">
                      Ultima Revisione
                    </p>
                    <p>
                      {new Date(
                        selectedVehicle.lastInspection
                      ).toLocaleDateString("it-IT")}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-small text-default-500">Stato</p>
                    <Chip
                      color={
                        vehicleStatusColorMap[selectedVehicle.status] as any
                      }
                      variant="flat"
                    >
                      {selectedVehicle.status}
                    </Chip>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Chiudi
                </Button>
                <Button color="primary" onPress={onClose}>
                  Modifica
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
