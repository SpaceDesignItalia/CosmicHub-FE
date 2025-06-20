"use client";

import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Progress,
  Select,
  SelectItem,
  useDisclosure,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import PageHeader from "../../Components/Layout/PageHeader";

// Interface for Employee type
interface Employee {
  user_id: number;
  name: string;
  role: string;
  photo: string;
  assigned_vehicle?: {
    id: number;
    name: string;
    license_plate: string;
  };
}

// Interface for Vehicle type
interface Vehicle {
  id: number;
  name: string;
  license_plate: string;
  status: string;
}

// Create context for update state
const UpdateContext = createContext<{
  triggerUpdate: () => void;
}>({
  triggerUpdate: () => {},
});

// Component for the employee card with enhanced design
function EmployeeCard({ employee }: { employee: Employee }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const { triggerUpdate } = useContext(UpdateContext);

  // Fetch vehicles when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchVehicles();
      if (employee.assigned_vehicle) {
        setSelectedVehicle(employee.assigned_vehicle.id);
      } else {
        setSelectedVehicle(null);
      }
    }
  }, [isOpen, employee.assigned_vehicle]);

  // Reset selectedVehicle when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedVehicle(null);
    }
  }, [isOpen]);

  const fetchVehicles = async () => {
    try {
      const response = await axios.get("/Vehicle/GET/GetAvailableVehicles", {
        withCredentials: true,
      });
      setVehicles(
        response.data.map((vehicle: any) => ({
          id: vehicle.vehicle_id,
          name: vehicle.name,
          license_plate: vehicle.license_plate,
          status: vehicle.status || "available",
        }))
      );
    } catch (error) {
      console.error("Failed to fetch vehicles:", error);
    }
  };

  console.log(vehicles);
  console.log("Selected vehicle:", selectedVehicle);
  console.log(
    "Selected keys:",
    selectedVehicle ? [selectedVehicle.toString()] : []
  );

  const handleVehicleAssignment = async () => {
    if (!selectedVehicle) return;

    setIsAssigning(true);
    try {
      await axios.put(
        "/Employee/UPDATE/UpdateEmployeeVehicle",
        {
          employee_id: employee.user_id,
          vehicle_id: selectedVehicle,
        },
        { withCredentials: true }
      );

      triggerUpdate();
      onClose();
    } catch (error) {
      console.error("Failed to assign vehicle:", error);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleVehicleUnassignment = async () => {
    setIsAssigning(true);
    try {
      await axios.put("/Employee/UPDATE/UpdateEmployeeVehicle", {
        employee_id: employee.user_id,
        vehicle_id: null,
      });

      setSelectedVehicle(null);
      triggerUpdate();
      onClose();
    } catch (error) {
      console.error("Failed to unassign vehicle:", error);
    } finally {
      setIsAssigning(false);
    }
  };

  // Enhanced role styling with icons and colors
  const getRoleConfig = (role: string) => {
    switch (role) {
      case "Senior Technician":
        return {
          gradient: "bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700",
          icon: "solar:medal-star-bold",
          color: "primary",
          chipColor: "primary" as const,
        };
      case "Specialized Technician":
        return {
          gradient:
            "bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700",
          icon: "solar:star-bold",
          color: "secondary",
          chipColor: "secondary" as const,
        };
      case "Junior Technician":
        return {
          gradient:
            "bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700",
          icon: "solar:user-bold",
          color: "warning",
          chipColor: "warning" as const,
        };
      default:
        return {
          gradient: "bg-gradient-to-br from-gray-500 via-gray-600 to-gray-700",
          icon: "solar:user-circle-bold",
          color: "default",
          chipColor: "default" as const,
        };
    }
  };

  // Gestione per employee.name e employee.photo mancanti
  const avatarName = employee.name
    ? employee.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
    : "";
  const displayName = employee.name || "Nome non disponibile";
  const displayRole = employee.role || "Ruolo non specificato";
  const avatarPhoto = employee.photo;
  const roleConfig = getRoleConfig(displayRole);

  return (
    <>
      <Card className="w-full shadow-medium hover:shadow-large transition-all duration-300 border-0 bg-content1/50 backdrop-blur-md">
        <CardHeader
          className={`relative flex h-[120px] flex-col justify-end overflow-visible ${roleConfig.gradient}`}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />

          {/* Role icon in top left */}
          <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Icon icon={roleConfig.icon} className="text-white" width={18} />
          </div>

          {/* Avatar with enhanced styling */}
          <Avatar
            src={avatarPhoto}
            showFallback
            name={avatarName}
            className="h-24 w-24 translate-y-12 border-4 border-white shadow-large ring-2 ring-white/20"
          />

          {/* Details button */}
          <Button
            className="absolute right-3 top-3 bg-white/20 backdrop-blur-md text-white border-white/30"
            radius="full"
            size="sm"
            variant="bordered"
            onPress={onOpen}
            startContent={<Icon icon="solar:eye-bold" width={16} />}
          >
            Dettagli
          </Button>
        </CardHeader>
        <CardBody className="pt-8">
          <div className="text-center space-y-3">
            <div>
              <h3 className="text-xl font-bold text-foreground">
                {displayName}
              </h3>
              <Chip
                color={roleConfig.chipColor}
                variant="flat"
                size="sm"
                className="mt-2"
                startContent={<Icon icon={roleConfig.icon} width={14} />}
              >
                {displayRole}
              </Chip>
            </div>

            {/* Vehicle assignment status */}
            {employee.assigned_vehicle && (
              <div className="mt-3">
                <Chip
                  color="success"
                  variant="flat"
                  size="sm"
                  startContent={<Icon icon="solar:car-bold" width={14} />}
                >
                  {employee.assigned_vehicle.license_plate}
                </Chip>
              </div>
            )}

            {/* Status indicators */}
            <div className="flex justify-center gap-2 pt-2">
              <Badge
                content=""
                color="success"
                size="sm"
                placement="bottom-right"
              >
                <div className="w-3 h-3 rounded-full bg-success-500" />
              </Badge>
              <span className="text-xs text-success-600 font-medium">
                Online
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Enhanced Modal with more details */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" backdrop="blur">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 bg-content1/50 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <Icon
                icon="solar:user-id-bold"
                className="text-primary"
                width={24}
              />
              <span>Profilo Dipendente</span>
            </div>
          </ModalHeader>
          <ModalBody className="p-6">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left side - Avatar and basic info */}
              <div className="flex flex-col items-center lg:w-1/3">
                <div className="relative">
                  <Avatar
                    src={avatarPhoto}
                    showFallback
                    name={avatarName}
                    className="h-32 w-32 mb-4 shadow-large"
                  />
                  <Badge
                    content=""
                    color="success"
                    size="lg"
                    placement="bottom-right"
                  >
                    <div />
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold text-center">
                  {displayName}
                </h3>
                <Chip
                  color={roleConfig.chipColor}
                  variant="flat"
                  size="lg"
                  className="mt-2"
                  startContent={<Icon icon={roleConfig.icon} width={16} />}
                >
                  {displayRole}
                </Chip>

                {/* Quick stats */}
                <div className="mt-6 w-full space-y-3">
                  <Card className="bg-success-50 dark:bg-success-950">
                    <CardBody className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon
                            icon="solar:calendar-bold"
                            className="text-success-600"
                            width={18}
                          />
                          <span className="text-sm font-medium">Stato</span>
                        </div>
                        <Chip color="success" size="sm">
                          Attivo
                        </Chip>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              </div>

              {/* Right side - Detailed information */}
              <div className="flex-1 space-y-6">
                {/* Personal Information */}
                <div>
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Icon
                      icon="solar:user-bold"
                      className="text-primary"
                      width={20}
                    />
                    Informazioni Personali
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-default-50 dark:bg-default-950">
                      <CardBody className="py-4">
                        <div className="space-y-2">
                          <p className="text-sm text-default-500">
                            ID Dipendente
                          </p>
                          <p className="font-semibold text-lg">
                            #{employee.user_id}
                          </p>
                        </div>
                      </CardBody>
                    </Card>
                    <Card className="bg-default-50 dark:bg-default-950">
                      <CardBody className="py-4">
                        <div className="space-y-2">
                          <p className="text-sm text-default-500">Ruolo</p>
                          <p className="font-semibold text-lg">{displayRole}</p>
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                </div>

                {/* Vehicle Assignment Section */}
                <div>
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Icon
                      icon="solar:car-bold"
                      className="text-warning"
                      width={20}
                    />
                    Assegnazione Veicolo
                  </h4>
                  <Card className="bg-warning-50 dark:bg-warning-950">
                    <CardBody className="py-4">
                      {employee.assigned_vehicle ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-warning-600 dark:text-warning-400">
                                Veicolo Assegnato
                              </p>
                              <p className="font-semibold text-lg">
                                {employee.assigned_vehicle.name}
                              </p>
                              <p className="text-sm text-default-500">
                                Targa: {employee.assigned_vehicle.license_plate}
                              </p>
                            </div>
                            <Icon
                              icon="solar:car-bold"
                              className="text-warning-600"
                              width={32}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Select
                              label="Cambia Veicolo"
                              placeholder="Seleziona nuovo veicolo"
                              selectedKeys={
                                selectedVehicle
                                  ? [selectedVehicle.toString()]
                                  : []
                              }
                              onSelectionChange={(keys) => {
                                const selectedKey = parseInt(
                                  Array.from(keys)[0] as string
                                );
                                setSelectedVehicle(selectedKey);
                              }}
                              renderValue={(items) => {
                                return items.map((item) => {
                                  const vehicle = vehicles.find(
                                    (v) => v.id.toString() === item.key
                                  );
                                  return vehicle
                                    ? `${vehicle.name} - ${vehicle.license_plate}`
                                    : item.textValue;
                                });
                              }}
                              size="sm"
                              className="flex-1"
                            >
                              {vehicles
                                .filter(
                                  (v) =>
                                    v.status === "available" ||
                                    v.id === employee.assigned_vehicle?.id
                                )
                                .map((vehicle) => (
                                  <SelectItem key={vehicle.id}>
                                    {vehicle.name} - {vehicle.license_plate}
                                  </SelectItem>
                                ))}
                            </Select>
                            <Button
                              color="danger"
                              variant="flat"
                              size="sm"
                              onPress={handleVehicleUnassignment}
                              isLoading={isAssigning}
                              startContent={
                                <Icon
                                  icon="solar:close-circle-bold"
                                  width={16}
                                />
                              }
                            >
                              Rimuovi
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 mb-3">
                            <Icon
                              icon="solar:info-circle-bold"
                              className="text-warning-600"
                              width={20}
                            />
                            <p className="text-sm text-warning-600 dark:text-warning-400">
                              Nessun veicolo assegnato
                            </p>
                          </div>
                          <Select
                            label="Assegna Veicolo"
                            placeholder="Seleziona veicolo da assegnare"
                            selectedKeys={
                              selectedVehicle
                                ? [selectedVehicle.toString()]
                                : []
                            }
                            onSelectionChange={(keys) => {
                              const selectedKey = parseInt(
                                Array.from(keys)[0] as string
                              );
                              setSelectedVehicle(selectedKey);
                            }}
                            renderValue={(items) => {
                              return items.map((item) => {
                                const vehicle = vehicles.find(
                                  (v) => v.id.toString() === item.key
                                );
                                return vehicle
                                  ? `${vehicle.name} - ${vehicle.license_plate}`
                                  : item.textValue;
                              });
                            }}
                            size="sm"
                          >
                            {vehicles
                              .filter((v) => v.status === "available")
                              .map((vehicle) => (
                                <SelectItem key={vehicle.id}>
                                  {vehicle.name} - {vehicle.license_plate}
                                </SelectItem>
                              ))}
                          </Select>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </div>

                {/* Performance Metrics */}
                <div>
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Icon
                      icon="solar:chart-bold"
                      className="text-secondary"
                      width={20}
                    />
                    Metriche Performance
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Efficienza</span>
                        <span className="text-sm font-bold text-success-600">
                          92%
                        </span>
                      </div>
                      <Progress value={92} color="success" size="md" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">
                          Progetti Completati
                        </span>
                        <span className="text-sm font-bold text-primary-600">
                          87%
                        </span>
                      </div>
                      <Progress value={87} color="primary" size="md" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">
                          Valutazione Cliente
                        </span>
                        <span className="text-sm font-bold text-warning-600">
                          95%
                        </span>
                      </div>
                      <Progress value={95} color="warning" size="md" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter className="bg-default-50 dark:bg-default-950">
            <Button color="default" variant="light" onPress={onClose}>
              Chiudi
            </Button>
            {selectedVehicle &&
              selectedVehicle !== (employee.assigned_vehicle?.id || 0) && (
                <Button
                  color="primary"
                  onPress={handleVehicleAssignment}
                  isLoading={isAssigning}
                  startContent={<Icon icon="solar:car-bold" width={16} />}
                >
                  Assegna Veicolo
                </Button>
              )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default function Team() {
  const [currentEmployees, setCurrentEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("Tutti");
  const [sortBy, setSortBy] = useState<string>("name");
  const [viewMode, setViewMode] = useState<string>("grid");
  const [updateCounter, setUpdateCounter] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const triggerUpdate = () => {
    setUpdateCounter((prev) => prev + 1);
  };

  useEffect(() => {
    const fetchEmployees = () => {
      setIsLoading(true);
      axios
        .get("/Employee/GET/GetAllEmployees", { withCredentials: true })
        .then((response) => {
          console.log(response.data);
          setCurrentEmployees(
            response.data.map((employee: any) => ({
              ...employee,
              assigned_vehicle: employee.vehicle_id
                ? {
                    id: employee.vehicle_id,
                    name: employee.vehicle_name,
                    license_plate: employee.license_plate,
                  }
                : null,
            }))
          );
        })
        .catch((error) => {
          console.error("Failed to fetch employees:", error);
          if (axios.isAxiosError(error)) {
            console.error(
              "Axios error details:",
              error.response?.data,
              error.response?.status,
              error.response?.headers
            );
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    };

    fetchEmployees();
  }, [updateCounter]);

  // Get unique roles for filter
  const availableRoles = useMemo(() => {
    const roles = [
      "Tutti",
      ...new Set(currentEmployees.map((emp) => emp.role)),
    ];
    return roles;
  }, [currentEmployees]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = currentEmployees.length;
    const senior = currentEmployees.filter(
      (emp) => emp.role === "Senior Technician"
    ).length;
    const specialized = currentEmployees.filter(
      (emp) => emp.role === "Specialized Technician"
    ).length;
    const junior = currentEmployees.filter(
      (emp) => emp.role === "Junior Technician"
    ).length;
    const others = total - senior - specialized - junior;

    return {
      total,
      senior,
      specialized,
      junior,
      others,
      avgExperience: "4.2 anni", // Mock data
      satisfaction: 94, // Mock data
    };
  }, [currentEmployees]);

  // Filter and sort employees
  const filteredAndSortedEmployees = useMemo(() => {
    let filtered = currentEmployees.filter((employee) => {
      const matchesSearch =
        !searchQuery.trim() ||
        (employee.name &&
          employee.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (employee.role &&
          employee.role.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRole =
        selectedRole === "Tutti" || employee.role === selectedRole;

      return matchesSearch && matchesRole;
    });

    // Sort employees
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "role":
          return (a.role || "").localeCompare(b.role || "");
        case "id":
          return a.user_id - b.user_id;
        default:
          return 0;
      }
    });

    return filtered;
  }, [currentEmployees, searchQuery, selectedRole, sortBy]);

  if (isLoading) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <div className="text-center">
            <p className="text-xl font-semibold text-foreground">
              Caricamento Team
            </p>
            <p className="text-sm text-default-500 mt-1">
              Recupero informazioni dipendenti...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <UpdateContext.Provider value={{ triggerUpdate }}>
      <div className="w-full flex-1 flex flex-col p-6 gap-8">
        {/* Enhanced Header */}
        <PageHeader
          title="Team Tecnico"
          description="Gestisci e monitora il tuo team di tecnici"
          icon="solar:users-group-rounded-bold"
          size="lg"
          actions={[
            {
              label: "Aggiungi Tecnico",
              icon: "solar:user-plus-bold",
              color: "primary",
              variant: "flat",
            },
            {
              label: "Report",
              icon: "solar:document-text-bold",
              color: "secondary",
              variant: "flat",
            },
          ]}
        />

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-930 dark:to-primary-930 border-0">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                    Totale Tecnici
                  </p>
                  <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                    {statistics.total}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                  <Icon
                    icon="solar:users-group-rounded-bold"
                    className="text-primary-600"
                    width={24}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-0">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                    Senior
                  </p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {statistics.senior}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Icon
                    icon="solar:medal-star-bold"
                    className="text-blue-600"
                    width={24}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-0">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                    Specializzati
                  </p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {statistics.specialized}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Icon
                    icon="solar:star-bold"
                    className="text-purple-600"
                    width={24}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-0">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                    Junior
                  </p>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                    {statistics.junior}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Icon
                    icon="solar:user-bold"
                    className="text-amber-600"
                    width={24}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-success-50 to-success-100 dark:from-success-950 dark:to-success-930 border-0">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-success-600 dark:text-success-400 font-medium">
                    Soddisfazione
                  </p>
                  <p className="text-2xl font-bold text-success-700 dark:text-success-300">
                    {statistics.satisfaction}%
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-success-500/20 flex items-center justify-center">
                  <Icon
                    icon="solar:heart-bold"
                    className="text-success-600"
                    width={24}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-secondary-50 to-secondary-100 dark:from-secondary-950 dark:to-secondary-930 border-0">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600 dark:text-secondary-500 font-medium">
                    Esperienza Media
                  </p>
                  <p className="text-xl font-bold text-secondary-700 dark:text-secondary-400">
                    {statistics.avgExperience}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-secondary-500/20 flex items-center justify-center">
                  <Icon
                    icon="solar:clock-circle-bold"
                    className="text-secondary-600"
                    width={24}
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Enhanced Filters and Controls */}
        <Card className="border-0 bg-content1/50 backdrop-blur-md">
          <CardBody className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <Input
                  placeholder="Cerca per nome o ruolo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="lg"
                  startContent={
                    <Icon
                      icon="solar:magnifer-linear"
                      className="text-default-400"
                      width={20}
                    />
                  }
                  isClearable
                  onClear={() => setSearchQuery("")}
                  className="max-w-md"
                  classNames={{
                    input: "text-sm",
                    inputWrapper: "bg-default-100 border-0 shadow-sm",
                  }}
                />

                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      variant="flat"
                      size="lg"
                      startContent={
                        <Icon icon="solar:filter-bold" width={18} />
                      }
                      endContent={
                        <Icon icon="solar:arrow-down-linear" width={16} />
                      }
                      className="bg-default-100"
                    >
                      {selectedRole}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Filtro ruoli"
                    selectedKeys={[selectedRole]}
                    onAction={(key) => setSelectedRole(key as string)}
                  >
                    {availableRoles.map((role) => (
                      <DropdownItem key={role}>{role}</DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>

                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      variant="flat"
                      size="lg"
                      startContent={<Icon icon="solar:sort-bold" width={18} />}
                      endContent={
                        <Icon icon="solar:arrow-down-linear" width={16} />
                      }
                      className="bg-default-100"
                    >
                      Ordina per{" "}
                      {sortBy === "name"
                        ? "Nome"
                        : sortBy === "role"
                        ? "Ruolo"
                        : "ID"}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Ordinamento"
                    selectedKeys={[sortBy]}
                    onAction={(key) => setSortBy(key as string)}
                  >
                    <DropdownItem key="name">Nome</DropdownItem>
                    <DropdownItem key="role">Ruolo</DropdownItem>
                    <DropdownItem key="id">ID</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>

              {/* View Mode Toggle */}
              <div className="flex gap-2 bg-default-100 p-1 rounded-lg">
                <Button
                  size="sm"
                  variant={viewMode === "grid" ? "solid" : "light"}
                  color={viewMode === "grid" ? "primary" : "default"}
                  onPress={() => setViewMode("grid")}
                  isIconOnly
                >
                  <Icon icon="solar:widget-4-bold" width={16} />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "list" ? "solid" : "light"}
                  color={viewMode === "list" ? "primary" : "default"}
                  onPress={() => setViewMode("list")}
                  isIconOnly
                >
                  <Icon icon="solar:list-bold" width={16} />
                </Button>
              </div>
            </div>

            {/* Results counter */}
            <div className="mt-4 pt-4 border-t border-divider">
              <p className="text-sm text-default-500">
                Mostrando{" "}
                <span className="font-semibold text-foreground">
                  {filteredAndSortedEmployees.length}
                </span>{" "}
                di{" "}
                <span className="font-semibold text-foreground">
                  {currentEmployees.length}
                </span>{" "}
                tecnici
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Employee Grid/List */}
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "flex flex-col gap-4"
          }
        >
          {filteredAndSortedEmployees.map((employee) => (
            <EmployeeCard key={employee.user_id} employee={employee} />
          ))}
        </div>

        {/* Empty State */}
        {filteredAndSortedEmployees.length === 0 && (
          <Card className="border-0">
            <CardBody className="py-16">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-default-100 flex items-center justify-center mb-6">
                  <Icon
                    icon="solar:user-cross-rounded-bold"
                    className="text-default-400"
                    width={40}
                  />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Nessun tecnico trovato
                </h3>
                <p className="text-default-500 mb-6 max-w-md">
                  Non ci sono tecnici che corrispondono ai criteri di ricerca.
                  Prova a modificare i filtri o la ricerca.
                </p>
                <div className="flex gap-3">
                  <Button
                    color="primary"
                    variant="flat"
                    onPress={() => {
                      setSearchQuery("");
                      setSelectedRole("Tutti");
                    }}
                    startContent={<Icon icon="solar:refresh-bold" width={16} />}
                  >
                    Resetta Filtri
                  </Button>
                  <Button
                    color="secondary"
                    variant="flat"
                    startContent={
                      <Icon icon="solar:user-plus-bold" width={16} />
                    }
                  >
                    Aggiungi Tecnico
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </UpdateContext.Provider>
  );
}
