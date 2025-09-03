"use client";

import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
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
  Pagination,
  Progress,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { createContext, useEffect, useMemo, useState } from "react";
import PageHeader from "../../Components/Layout/PageHeader";
import { useCustomTheme } from "../../providers/ThemeProvider";

// Interface for Employee type
interface Employee {
  user_id: number;
  name: string;
  surname?: string;
  email?: string;
  role_id: number;
  role: string;
  photo: string;
  assigned_vehicle?: {
    id: number;
    name: string;
    license_plate: string;
  } | null;
}

// Create context for update state
const UpdateContext = createContext<{
  triggerUpdate: () => void;
}>({
  triggerUpdate: () => {},
});

// Helper functions for role styling
const getRoleColor = (role: string) => {
  switch (role) {
    case "Senior Technician":
      return "primary";
    case "Specialized Technician":
      return "secondary";
    case "Junior Technician":
      return "warning";
    default:
      return "default";
  }
};

const getRoleIcon = (role: string) => {
  switch (role) {
    case "Senior Technician":
      return "solar:medal-star-bold";
    case "Specialized Technician":
      return "solar:star-bold";
    case "Junior Technician":
      return "solar:user-bold";
    default:
      return "solar:user-circle-bold";
  }
};

export default function Team() {
  const { isDark } = useCustomTheme();
  const [currentEmployees, setCurrentEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<string>("Tutti");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [updateCounter, setUpdateCounter] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Stati per la modifica
  const [editFormData, setEditFormData] = useState({
    name: "",
    surname: "",
    email: "",
    role: "",
  });

  // Stati per la gestione veicoli
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehicleSelectionModalOpen, setVehicleSelectionModalOpen] =
    useState(false);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Stati per le categorie/ruoli
  const [roles, setRoles] = useState<any[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  // Stato per le modifiche temporanee del veicolo
  const [tempVehicleAssignment, setTempVehicleAssignment] = useState<{
    id: number;
    name: string;
    license_plate: string;
  } | null>(null);

  const triggerUpdate = () => {
    setUpdateCounter((prev) => prev + 1);
  };

  // Funzione per gestire l'ordinamento
  const handleSort = (field: string) => {
    if (sortBy === field) {
      if (sortDirection === "asc") {
        // Secondo click: cambia in decrescente
        setSortDirection("desc");
      } else {
        // Terzo click: rimuovi l'ordinamento
        setSortBy("");
        setSortDirection("asc");
      }
    } else {
      // Se clicchi su una nuova colonna, imposta come ascendente
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  // Handler functions for table actions
  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setViewModalOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);

    // Trova il ruolo corrispondente per ottenere l'ID
    const findRoleId = (roleName: string) => {
      // Prima cerca nei ruoli già caricati
      const existingRole = roles.find((r) => r.name === roleName);
      if (existingRole) return existingRole.role_id?.toString() || "";

      // Fallback: cerca per nome (case-insensitive)
      const roleByName = roles.find(
        (r) => r.name?.toLowerCase() === roleName?.toLowerCase()
      );
      return roleByName?.role_id?.toString() || "";
    };

    setEditFormData({
      name: employee.name || "",
      surname: employee.surname || "",
      email: employee.email || "",
      role: findRoleId(employee.role),
    });

    // Inizializza lo stato temporaneo del veicolo
    setTempVehicleAssignment(employee.assigned_vehicle || null);

    // Carica i veicoli e i ruoli quando si apre il modal
    fetchVehicles();
    fetchRoles();
    setEditModalOpen(true);
  };

  // Funzione per caricare i veicoli
  const fetchVehicles = async () => {
    setIsLoadingVehicles(true);
    try {
      const response = await axios.get("/Vehicle/GET/GetAllVehicles", {
        withCredentials: true,
      });
      setVehicles(response.data);
    } catch (error) {
      console.error("Failed to fetch vehicles:", error);
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  // Funzione per caricare i ruoli/categorie
  const fetchRoles = async () => {
    setIsLoadingRoles(true);
    try {
      const response = await axios.get("/Role/GET/GetAllRoles", {
        withCredentials: true,
      });

      if (response.data && Array.isArray(response.data)) {
        setRoles(response.data);
      } else {
        setRoles([]);
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error);
      setRoles([]);
    } finally {
      setIsLoadingRoles(false);
    }
  };

  // Funzione per salvare le modifiche del tecnico
  const handleSaveEmployeeChanges = async () => {
    if (!selectedEmployee) return;

    setIsSaving(true);
    try {
      // Controlla se ci sono modifiche ai dati dell'utente
      const hasUserDataChanges =
        editFormData.name !== selectedEmployee.name ||
        editFormData.surname !== (selectedEmployee.surname || "") ||
        editFormData.email !== (selectedEmployee.email || "") ||
        editFormData.role !== "";

      // Controlla se ci sono modifiche al veicolo
      const hasVehicleChanges =
        tempVehicleAssignment !== selectedEmployee.assigned_vehicle;

      // Se non ci sono modifiche, non fare nulla
      if (!hasUserDataChanges && !hasVehicleChanges) {
        setEditModalOpen(false);
        return;
      }

      // Aggiorna i dati personali del tecnico solo se sono cambiati
      if (hasUserDataChanges) {
        // Validazione dei campi obbligatori
        if (!editFormData.name.trim()) {
          alert("Il nome è obbligatorio");
          return;
        }

        if (!editFormData.role || editFormData.role === "") {
          alert("Il ruolo è obbligatorio");
          return;
        }

        await axios.put(
          "/Employee/UPDATE/UpdateEmployeeData",
          {
            userData: {
              user_id: selectedEmployee.user_id,
              name: editFormData.name,
              surname: editFormData.surname,
              email: editFormData.email,
              role_id: parseInt(editFormData.role) || null,
            },
          },
          { withCredentials: true }
        );
      }

      // Applica le modifiche del veicolo se sono cambiate
      if (hasVehicleChanges) {
        if (tempVehicleAssignment) {
          // Se il veicolo è già assegnato ad un altro tecnico, rimuovilo prima
          const currentOwner = currentEmployees.find(
            (emp) => emp.assigned_vehicle?.id === tempVehicleAssignment.id
          );

          if (
            currentOwner &&
            currentOwner.user_id !== selectedEmployee.user_id
          ) {
            // Rimuovi il veicolo dal tecnico precedente
            await axios.put(
              "/Employee/UPDATE/UpdateEmployeeVehicle",
              {
                employee_id: currentOwner.user_id,
                vehicle_id: null,
              },
              { withCredentials: true }
            );
          }

          // Assegna il veicolo al tecnico selezionato
          await axios.put(
            "/Employee/UPDATE/UpdateEmployeeVehicle",
            {
              employee_id: selectedEmployee.user_id,
              vehicle_id: tempVehicleAssignment.id,
            },
            { withCredentials: true }
          );
        } else {
          // Rimuovi assegnazione veicolo
          await axios.put(
            "/Employee/UPDATE/UpdateEmployeeVehicle",
            {
              employee_id: selectedEmployee.user_id,
              vehicle_id: null,
            },
            { withCredentials: true }
          );
        }
      }

      // Aggiorna lo stato locale
      setCurrentEmployees((prev) => {
        let updated = prev.map((emp) =>
          emp.user_id === selectedEmployee.user_id
            ? {
                ...emp,
                // Aggiorna i dati dell'utente solo se sono cambiati
                ...(hasUserDataChanges && {
                  name: editFormData.name,
                  surname: editFormData.surname,
                  email: editFormData.email,
                  role: (() => {
                    const selectedRole = roles.find(
                      (r) =>
                        r.role_id?.toString() === editFormData.role?.toString()
                    );
                    return selectedRole ? selectedRole.name : editFormData.role;
                  })(),
                }),
                // Aggiorna sempre il veicolo se è cambiato
                ...(hasVehicleChanges && {
                  assigned_vehicle: tempVehicleAssignment,
                }),
              }
            : emp
        );

        // Se abbiamo assegnato un veicolo che era già assegnato ad un altro tecnico,
        // rimuovilo anche dallo stato locale
        if (
          tempVehicleAssignment &&
          tempVehicleAssignment !== selectedEmployee.assigned_vehicle
        ) {
          updated = updated.map((emp) =>
            emp.assigned_vehicle?.id === tempVehicleAssignment.id &&
            emp.user_id !== selectedEmployee.user_id
              ? { ...emp, assigned_vehicle: null }
              : emp
          );
        }

        return updated;
      });

      setEditModalOpen(false);
      triggerUpdate();
    } catch (error) {
      console.error("Failed to save employee changes:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Funzione per assegnare un veicolo
  const handleAssignVehicle = async (vehicleId: number) => {
    if (!selectedEmployee) return;

    try {
      await axios.put(
        "/Employee/UPDATE/UpdateEmployeeVehicle",
        {
          employee_id: selectedEmployee.user_id,
          vehicle_id: vehicleId,
        },
        { withCredentials: true }
      );

      // Aggiorna lo stato locale
      setCurrentEmployees((prev) =>
        prev.map((emp) =>
          emp.user_id === selectedEmployee.user_id
            ? {
                ...emp,
                assigned_vehicle: vehicles.find(
                  (v) => v.vehicle_id === vehicleId
                )
                  ? {
                      id: vehicleId,
                      name:
                        vehicles.find((v) => v.vehicle_id === vehicleId)
                          ?.name || "",
                      license_plate:
                        vehicles.find((v) => v.vehicle_id === vehicleId)
                          ?.license_plate || "",
                    }
                  : undefined,
              }
            : emp
        )
      );

      setVehicleSelectionModalOpen(false);
      triggerUpdate();
    } catch (error) {
      console.error("Failed to assign vehicle:", error);
    }
  };

  // Funzione per rimuovere l'assegnazione veicolo
  const handleRemoveVehicle = async () => {
    if (!selectedEmployee) return;

    try {
      await axios.put(
        "/Employee/UPDATE/UpdateEmployeeVehicle",
        {
          employee_id: selectedEmployee.user_id,
          vehicle_id: null,
        },
        { withCredentials: true }
      );

      // Aggiorna lo stato locale
      setCurrentEmployees((prev) =>
        prev.map((emp) =>
          emp.user_id === selectedEmployee.user_id
            ? { ...emp, assigned_vehicle: undefined }
            : emp
        )
      );

      triggerUpdate();
    } catch (error) {
      console.error("Failed to remove vehicle:", error);
    }
  };

  // Funzioni per le modifiche temporanee del veicolo
  const handleTempAssignVehicle = (vehicleId: number) => {
    const vehicle = vehicles.find((v) => v.vehicle_id === vehicleId);
    if (vehicle) {
      setTempVehicleAssignment({
        id: vehicle.vehicle_id,
        name: vehicle.name || vehicle.model || "Modello non specificato",
        license_plate: vehicle.license_plate || "Targa non disponibile",
      });
    }
  };

  const handleTempRemoveVehicle = () => {
    setTempVehicleAssignment(null);
  };

  useEffect(() => {
    const fetchEmployees = () => {
      setIsLoading(true);
      axios
        .get("/Employee/GET/GetAllEmployees", { withCredentials: true })
        .then((response) => {
          setCurrentEmployees(
            response.data.map((employee: any) => ({
              ...employee,
              name: employee.name || "",
              surname: employee.surname || "",
              email: employee.email || "",
              role: employee.role || "",
              photo: employee.photo || "",
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

    // Carica anche i ruoli all'avvio per avere sempre i dati disponibili
    fetchRoles();
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
    if (sortBy) {
      filtered.sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
          case "name":
            comparison = (a.name || "").localeCompare(b.name || "");
            break;
          case "role":
            comparison = (a.role || "").localeCompare(b.role || "");
            break;
          case "vehicle":
            // Ordina per targa del veicolo assegnato
            const aPlate = a.assigned_vehicle?.license_plate || "";
            const bPlate = b.assigned_vehicle?.license_plate || "";
            comparison = aPlate.localeCompare(bPlate);
            break;
          case "id":
            comparison = a.user_id - b.user_id;
            break;
          default:
            return 0;
        }

        // Applica la direzione dell'ordinamento
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return filtered;
  }, [currentEmployees, searchQuery, selectedRole, sortBy, sortDirection]);

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
              <div className="flex flex-col sm:flex-row gap-6 mb-6">
                <Input
                  aria-label="Cerca tecnici per nome o ruolo"
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
                  className="flex-1"
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

        {/* Employee Table */}
        <Card className="border-0 bg-content1/50 backdrop-blur-md">
          <CardBody className="p-0">
            <Table
              aria-label="Tabella tecnici"
              classNames={{
                wrapper: "min-h-[400px]",
                th: "bg-transparent border-b border-divider",
                td: "border-b border-divider",
              }}
            >
              <TableHeader>
                <TableColumn className="w-[25%] font-semibold">
                  <div
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleSort("name")}
                  >
                    <span>DIPENDENTE</span>
                    <Icon
                      icon={
                        sortBy === "name"
                          ? sortDirection === "asc"
                            ? "solar:alt-arrow-up-linear"
                            : "solar:alt-arrow-down-linear"
                          : "solar:alt-arrow-up-linear"
                      }
                      className={`text-xs ${
                        sortBy === "name"
                          ? "text-warning-600"
                          : isDark
                          ? "text-white"
                          : "text-black"
                      }`}
                      width={12}
                    />
                  </div>
                </TableColumn>
                <TableColumn className="w-[20%] font-semibold">
                  <div
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleSort("role")}
                  >
                    <span>RUOLO</span>
                    <Icon
                      icon={
                        sortBy === "role"
                          ? sortDirection === "asc"
                            ? "solar:alt-arrow-up-linear"
                            : "solar:alt-arrow-down-linear"
                          : "solar:alt-arrow-up-linear"
                      }
                      className={`text-xs ${
                        sortBy === "role"
                          ? "text-warning-600"
                          : isDark
                          ? "text-white"
                          : "text-black"
                      }`}
                      width={12}
                    />
                  </div>
                </TableColumn>
                <TableColumn className="w-[25%] font-semibold">
                  <div
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleSort("vehicle")}
                  >
                    <span>VEICOLO ASSEGNATO</span>
                    <Icon
                      icon={
                        sortBy === "vehicle"
                          ? sortDirection === "asc"
                            ? "solar:alt-arrow-up-linear"
                            : "solar:alt-arrow-down-linear"
                          : "solar:alt-arrow-up-linear"
                      }
                      className={`text-xs ${
                        sortBy === "vehicle"
                          ? "text-warning-600"
                          : isDark
                          ? "text-white"
                          : "text-black"
                      }`}
                      width={12}
                    />
                  </div>
                </TableColumn>
                <TableColumn className="w-[15%] font-semibold">
                  STATO
                </TableColumn>
                <TableColumn className="w-[15%] font-semibold text-center">
                  AZIONI
                </TableColumn>
              </TableHeader>
              <TableBody>
                {filteredAndSortedEmployees
                  .slice((page - 1) * rowsPerPage, page * rowsPerPage)
                  .map((employee) => (
                    <TableRow
                      key={employee.user_id}
                      className="hover:bg-default-50 dark:hover:bg-default-950"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={employee.photo}
                            showFallback
                            name={
                              employee.name && employee.surname
                                ? `${employee.name.charAt(
                                    0
                                  )}${employee.surname.charAt(0)}`
                                : employee.name
                                ? employee.name.charAt(0)
                                : ""
                            }
                            className="h-10 w-10"
                          />
                          <div>
                            <p className="font-semibold text-foreground">
                              {employee.name && employee.surname
                                ? `${employee.name} ${employee.surname}`
                                : employee.name || "Nome non disponibile"}
                            </p>
                            <p className="text-sm text-default-500">
                              ID: #{employee.user_id}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={getRoleColor(employee.role)}
                          variant="flat"
                          size="sm"
                          startContent={
                            <Icon
                              icon={getRoleIcon(employee.role)}
                              width={14}
                            />
                          }
                        >
                          {employee.role || "Ruolo non specificato"}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        {employee.assigned_vehicle ? (
                          <div className="flex items-center gap-2">
                            <Icon
                              icon="solar:car-bold"
                              className="text-primary"
                              width={16}
                            />
                            <div>
                              <p className="font-medium text-foreground">
                                {employee.assigned_vehicle.name}
                              </p>
                              <p className="text-sm text-default-500 font-mono">
                                {employee.assigned_vehicle.license_plate}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Icon
                              icon="solar:car-cross-bold"
                              className="text-default-400"
                              width={16}
                            />
                            <span className="text-sm text-default-500">
                              Nessun veicolo
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            content=""
                            color="success"
                            size="sm"
                            placement="bottom-right"
                          >
                            <div className="w-3 h-3 rounded-full bg-success-500" />
                          </Badge>
                          <span className="text-sm text-success-600 font-medium">
                            Online
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3 justify-center">
                          <Button
                            aria-label="Visualizza dettagli tecnico"
                            size="sm"
                            variant="light"
                            color="default"
                            onPress={() => handleViewEmployee(employee)}
                            isIconOnly
                            className={`${
                              isDark ? "text-white" : "text-black"
                            } hover:bg-white/20`}
                          >
                            <Icon icon="solar:eye-bold" width={16} />
                          </Button>
                          <Button
                            aria-label="Modifica tecnico"
                            size="sm"
                            variant="light"
                            color="warning"
                            onPress={() => handleEditEmployee(employee)}
                            isIconOnly
                          >
                            <Icon icon="solar:pen-bold" width={16} />
                          </Button>
                          <Dropdown>
                            <DropdownTrigger>
                              <Button
                                aria-label="Azioni per tecnico"
                                size="sm"
                                variant="light"
                                color="danger"
                                isIconOnly
                              >
                                <Icon
                                  icon="solar:trash-bin-trash-bold"
                                  width={16}
                                />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                              aria-label="Azioni eliminazione"
                              color="danger"
                              variant="flat"
                            >
                              <DropdownItem
                                key="delete"
                                color="danger"
                                className="text-danger-600"
                                startContent={
                                  <Icon
                                    icon="solar:trash-bin-trash-bold"
                                    width={16}
                                  />
                                }
                                onPress={() => {
                                  // TODO: Implement actual deletion
                                  // Eliminazione tecnico implementata in futuro
                                }}
                              >
                                <div className="flex flex-col items-start">
                                  <span>Elimina Definitivamente</span>
                                  <span className="text-xs text-default-400">
                                    Sei sicuro?
                                  </span>
                                </div>
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex flex-col items-center gap-4 px-6 py-4 border-t border-divider">
              {/* Info e controlli righe per pagina */}
              <div className="flex items-center justify-between w-full max-w-md">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-default-500">
                    Righe per pagina:
                  </span>
                  <Select
                    size="sm"
                    selectedKeys={[rowsPerPage.toString()]}
                    onSelectionChange={(keys) => {
                      const newRowsPerPage = Number(Array.from(keys)[0]);
                      setRowsPerPage(newRowsPerPage);
                      setPage(1);
                    }}
                    className="w-20"
                  >
                    <SelectItem key="5">5</SelectItem>
                    <SelectItem key="10">10</SelectItem>
                    <SelectItem key="20">20</SelectItem>
                    <SelectItem key="50">50</SelectItem>
                  </Select>
                </div>

                <div className="text-sm text-default-500">
                  Mostrando {(page - 1) * rowsPerPage + 1} -{" "}
                  {Math.min(
                    page * rowsPerPage,
                    filteredAndSortedEmployees.length
                  )}{" "}
                  di {filteredAndSortedEmployees.length} tecnici
                </div>
              </div>

              {/* Paginazione centrata */}
              <Pagination
                total={Math.ceil(
                  filteredAndSortedEmployees.length / rowsPerPage
                )}
                page={page}
                onChange={setPage}
                showControls
                size="sm"
                color="primary"
                variant="bordered"
                aria-label="Paginazione tecnici"
                classNames={{
                  item: "rounded-full",
                  cursor: "rounded-full",
                  prev: "rounded-full",
                  next: "rounded-full",
                }}
              />
            </div>
          </CardBody>
        </Card>

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

        {/* View Employee Modal */}
        <Modal
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          size="2xl"
          backdrop="blur"
          aria-label="Visualizza profilo dipendente"
        >
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
            <ModalBody className="p-8">
              {selectedEmployee && (
                <div className="flex flex-col lg:flex-row gap-10">
                  {/* Left side - Avatar and basic info */}
                  <div className="flex flex-col items-center lg:w-1/3">
                    <div className="relative">
                      <Avatar
                        src={selectedEmployee.photo}
                        showFallback
                        name={
                          selectedEmployee.name && selectedEmployee.surname
                            ? `${selectedEmployee.name.charAt(
                                0
                              )}${selectedEmployee.surname.charAt(0)}`
                            : selectedEmployee.name
                            ? selectedEmployee.name.charAt(0)
                            : ""
                        }
                        className="h-32 w-32 mb-6 shadow-large"
                      />
                    </div>
                    <h3 className="text-2xl font-bold text-center">
                      {selectedEmployee.name && selectedEmployee.surname
                        ? `${selectedEmployee.name} ${selectedEmployee.surname}`
                        : selectedEmployee.name || "Nome non disponibile"}
                    </h3>
                    <Chip
                      color={getRoleColor(selectedEmployee.role)}
                      variant="flat"
                      size="lg"
                      className="mt-3"
                      startContent={
                        <Icon
                          icon={getRoleIcon(selectedEmployee.role)}
                          width={16}
                        />
                      }
                    >
                      {selectedEmployee.role || "Ruolo non specificato"}
                    </Chip>

                    {/* Quick stats */}
                    <div className="mt-8 w-full space-y-4">
                      <Card className="bg-success-50 dark:bg-success-950">
                        <CardBody className="py-4">
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
                  <div className="flex-1 space-y-8">
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
                      <div className="space-y-4">
                        {/* Prima riga: ID e Ruolo */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card className="bg-default-50 dark:bg-default-950">
                            <CardBody className="py-4">
                              <div className="space-y-2">
                                <p className="text-sm text-default-500">
                                  ID Dipendente
                                </p>
                                <p className="font-semibold text-lg">
                                  #{selectedEmployee.user_id}
                                </p>
                              </div>
                            </CardBody>
                          </Card>
                          <Card className="bg-default-50 dark:bg-default-950">
                            <CardBody className="py-4">
                              <div className="space-y-2">
                                <p className="text-sm text-default-500">
                                  Ruolo
                                </p>
                                <p className="font-semibold text-lg">
                                  {selectedEmployee.role ||
                                    "Ruolo non specificato"}
                                </p>
                              </div>
                            </CardBody>
                          </Card>
                        </div>

                        {/* Seconda riga: Email a tutta larghezza */}
                        <Card className="bg-default-50 dark:bg-default-950">
                          <CardBody className="py-4">
                            <div className="space-y-2">
                              <p className="text-sm text-default-500">Email</p>
                              <p className="font-semibold text-lg break-words">
                                {selectedEmployee.email ||
                                  "Email non disponibile"}
                              </p>
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

                      {selectedEmployee.assigned_vehicle ? (
                        <Card className="bg-success-50 dark:bg-success-950">
                          <CardBody className="py-4">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-success-100 dark:bg-success-900">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-success-500/20 flex items-center justify-center">
                                  <Icon
                                    icon="solar:car-bold"
                                    className="text-success-600"
                                    width={20}
                                  />
                                </div>
                                <div>
                                  <p className="font-semibold text-success-700 dark:text-success-300">
                                    {selectedEmployee.assigned_vehicle.name}
                                  </p>
                                  <p className="text-sm text-success-600 dark:text-success-400">
                                    Targa:{" "}
                                    {
                                      selectedEmployee.assigned_vehicle
                                        .license_plate
                                    }
                                  </p>
                                </div>
                              </div>
                              <Chip color="success" size="sm" variant="flat">
                                Assegnato
                              </Chip>
                            </div>
                          </CardBody>
                        </Card>
                      ) : (
                        <Card className="bg-default-50 dark:bg-default-950">
                          <CardBody className="py-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Icon
                                icon="solar:info-circle-bold"
                                className="text-default-600"
                                width={20}
                              />
                              <p className="text-sm text-default-600 dark:text-default-400">
                                Nessun veicolo assegnato
                              </p>
                            </div>
                          </CardBody>
                        </Card>
                      )}
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
                            <span className="text-sm font-medium">
                              Efficienza
                            </span>
                            <span className="text-sm font-bold text-success-600">
                              92%
                            </span>
                          </div>
                          <Progress
                            value={92}
                            color="success"
                            size="md"
                            aria-label="Efficienza membro team"
                          />
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
                          <Progress
                            value={87}
                            color="primary"
                            size="md"
                            aria-label="Progetti completati"
                          />
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
                          <Progress
                            value={95}
                            color="warning"
                            size="md"
                            aria-label="Valutazione performance"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </ModalBody>
            <ModalFooter className="bg-default-50 dark:bg-default-950">
              <Button
                color="default"
                variant="light"
                onPress={() => setViewModalOpen(false)}
              >
                Chiudi
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Edit Employee Modal */}
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          size="2xl"
          backdrop="blur"
          aria-label="Modifica dipendente"
        >
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1 bg-content1/50 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <Icon
                  icon="solar:pen-bold"
                  className="text-warning"
                  width={24}
                />
                <span>Modifica Tecnico</span>
              </div>
            </ModalHeader>
            <ModalBody className="p-8">
              {selectedEmployee && (
                <div className="flex flex-col lg:flex-row gap-10">
                  {/* Left side - Avatar and basic info */}
                  <div className="flex flex-col items-center lg:w-1/3">
                    <div className="relative">
                      <Avatar
                        src={selectedEmployee.photo}
                        showFallback
                        name={
                          selectedEmployee.name && selectedEmployee.surname
                            ? `${selectedEmployee.name.charAt(
                                0
                              )}${selectedEmployee.surname.charAt(0)}`
                            : selectedEmployee.name
                            ? selectedEmployee.name.charAt(0)
                            : ""
                        }
                        className="h-32 w-32 mb-6 shadow-large"
                      />
                    </div>
                    <h3 className="text-2xl font-bold text-center">
                      {selectedEmployee.name && selectedEmployee.surname
                        ? `${selectedEmployee.name} ${selectedEmployee.surname}`
                        : selectedEmployee.name || "Nome non disponibile"}
                    </h3>
                    <Chip
                      color={getRoleColor(selectedEmployee.role)}
                      variant="flat"
                      size="lg"
                      className="mt-3"
                      startContent={
                        <Icon
                          icon={getRoleIcon(selectedEmployee.role)}
                          width={16}
                        />
                      }
                    >
                      {selectedEmployee.role || "Ruolo non specificato"}
                    </Chip>

                    {/* Quick stats */}
                    <div className="mt-8 w-full space-y-4">
                      <Card className="bg-success-50 dark:bg-success-950">
                        <CardBody className="py-4">
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
                  <div className="flex-1 space-y-8">
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
                        <Input
                          label="Nome"
                          placeholder="Nome"
                          value={editFormData.name}
                          onChange={(e) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          size="md"
                          startContent={
                            <Icon
                              icon="solar:user-bold"
                              className="text-default-400"
                              width={20}
                            />
                          }
                        />
                        <Input
                          label="Cognome"
                          placeholder="Cognome"
                          value={editFormData.surname}
                          onChange={(e) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              surname: e.target.value,
                            }))
                          }
                          size="md"
                          startContent={
                            <Icon
                              icon="solar:user-bold"
                              className="text-default-400"
                              width={20}
                            />
                          }
                        />
                        <Input
                          label="Email"
                          placeholder="email@esempio.com"
                          type="email"
                          size="md"
                          value={editFormData.email}
                          onChange={(e) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          startContent={
                            <Icon
                              icon="solar:letter-bold"
                              className="text-default-400"
                              width={20}
                            />
                          }
                        />
                        <Dropdown>
                          <DropdownTrigger>
                            <Button
                              variant="bordered"
                              size="md"
                              className="justify-start h-14 w-full"
                              startContent={
                                <Icon
                                  icon="solar:medal-star-bold"
                                  className="text-default-400"
                                  width={20}
                                />
                              }
                            >
                              {(() => {
                                const selectedRole = roles.find(
                                  (r) =>
                                    r.role_id?.toString() ===
                                    editFormData.role?.toString()
                                );
                                return selectedRole
                                  ? selectedRole.name
                                  : "Seleziona ruolo";
                              })()}
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu
                            aria-label="Selezione ruolo"
                            selectedKeys={[editFormData.role]}
                            onAction={(key) => {
                              setEditFormData((prev) => ({
                                ...prev,
                                role: key as string,
                              }));
                            }}
                          >
                            {isLoadingRoles ? (
                              <DropdownItem key="loading" isReadOnly>
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                  <span>Caricamento ruoli...</span>
                                </div>
                              </DropdownItem>
                            ) : roles.length === 0 ? (
                              <DropdownItem key="no-roles" isReadOnly>
                                <span className="text-default-400">
                                  Nessun ruolo disponibile
                                </span>
                              </DropdownItem>
                            ) : (
                              (() => {
                                return roles.map((role) => (
                                  <DropdownItem
                                    key={role.role_id?.toString() || ""}
                                  >
                                    {role.name || "Ruolo non specificato"}
                                  </DropdownItem>
                                ));
                              })()
                            )}
                          </DropdownMenu>
                        </Dropdown>
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

                      <Card className="bg-default-50 dark:bg-default-950">
                        <CardBody className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="text-sm font-medium text-default-600 dark:text-default-400">
                              Assegnazione Veicolo
                            </h5>
                            <Chip
                              color={
                                tempVehicleAssignment ? "success" : "default"
                              }
                              size="sm"
                              variant="flat"
                            >
                              {tempVehicleAssignment !==
                              selectedEmployee.assigned_vehicle
                                ? "Modificato"
                                : tempVehicleAssignment
                                ? "Assegnato"
                                : "Nessun veicolo"}
                            </Chip>
                          </div>

                          {tempVehicleAssignment ? (
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-success-100 dark:bg-success-900 mb-4">
                              <div className="w-10 h-10 rounded-full bg-success-500/20 flex items-center justify-center">
                                <Icon
                                  icon="solar:car-bold"
                                  className="text-success-600"
                                  width={20}
                                />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-success-700 dark:text-success-300">
                                  {tempVehicleAssignment.name}
                                </p>
                                <p className="text-sm text-success-600 dark:text-success-400">
                                  Targa: {tempVehicleAssignment.license_plate}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-default-100 dark:bg-default-800 mb-4">
                              <Icon
                                icon="solar:info-circle-bold"
                                className="text-default-600"
                                width={20}
                              />
                              <p className="text-sm text-default-600 dark:text-default-400">
                                {selectedEmployee.assigned_vehicle
                                  ? "Veicolo rimosso"
                                  : "Nessun veicolo assegnato"}
                              </p>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              variant="bordered"
                              size="md"
                              className="justify-start h-12 flex-1"
                              startContent={
                                <Icon icon="solar:car-bold" width={16} />
                              }
                              onPress={() => setVehicleSelectionModalOpen(true)}
                            >
                              {tempVehicleAssignment
                                ? `${tempVehicleAssignment.name} - ${tempVehicleAssignment.license_plate}`
                                : "Seleziona veicolo"}
                            </Button>
                            {tempVehicleAssignment && (
                              <Button
                                variant="light"
                                color="danger"
                                size="md"
                                isIconOnly
                                onPress={handleTempRemoveVehicle}
                                className="h-12 w-12"
                              >
                                <Icon
                                  icon="solar:trash-bin-trash-bold"
                                  width={16}
                                />
                              </Button>
                            )}
                          </div>
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
                            <span className="text-sm font-medium">
                              Efficienza
                            </span>
                            <span className="text-sm font-bold text-success-600">
                              92%
                            </span>
                          </div>
                          <Progress
                            value={92}
                            color="success"
                            size="md"
                            aria-label="Efficienza membro team"
                          />
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
                          <Progress
                            value={87}
                            color="primary"
                            size="md"
                            aria-label="Progetti completati"
                          />
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
                          <Progress
                            value={95}
                            color="warning"
                            size="md"
                            aria-label="Valutazione performance"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </ModalBody>
            <ModalFooter className="bg-default-50 dark:bg-default-950">
              <Button
                color="default"
                variant="light"
                onPress={() => setEditModalOpen(false)}
                startContent={
                  <Icon icon="solar:close-circle-bold" width={16} />
                }
              >
                Annulla
              </Button>
              <Button
                color="primary"
                variant="flat"
                startContent={
                  <Icon icon="solar:check-circle-bold" width={16} />
                }
                onPress={handleSaveEmployeeChanges}
                isDisabled={(() => {
                  if (!selectedEmployee) return true;

                  // Trova il ruolo ID corrispondente per il confronto
                  const getCurrentRoleId = () => {
                    const currentRole = roles.find(
                      (r) => r.name === selectedEmployee.role
                    );
                    return currentRole?.role_id?.toString() || "";
                  };

                  const currentRoleId = getCurrentRoleId();

                  // Se non riusciamo a trovare il ruolo ID, non disabilitare il pulsante
                  if (!currentRoleId) {
                    return false;
                  }

                  // Controlla se ci sono modifiche reali ai dati dell'utente
                  const hasUserDataChanges =
                    editFormData.name.trim() !==
                      (selectedEmployee.name || "").trim() ||
                    editFormData.surname.trim() !==
                      (selectedEmployee.surname || "").trim() ||
                    editFormData.email.trim() !==
                      (selectedEmployee.email || "").trim() ||
                    editFormData.role !== currentRoleId;

                  // Controlla se ci sono modifiche al veicolo
                  const hasVehicleChanges =
                    tempVehicleAssignment !== selectedEmployee.assigned_vehicle;

                  // Controlla se i campi obbligatori sono vuoti
                  const hasRequiredFields =
                    editFormData.name.trim() !== "" && editFormData.role !== "";

                  // Il pulsante è disabilitato se:
                  // 1. I campi obbligatori sono vuoti OPPURE
                  // 2. Non ci sono modifiche
                  return (
                    !hasRequiredFields ||
                    (!hasUserDataChanges && !hasVehicleChanges)
                  );
                })()}
              >
                Salva Modifiche
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Vehicle Selection Modal */}
        <Modal
          isOpen={vehicleSelectionModalOpen}
          onClose={() => setVehicleSelectionModalOpen(false)}
          size="2xl"
          backdrop="blur"
          aria-label="Selezione veicolo"
          classNames={{
            base: "bg-white/95 dark:bg-content1/95 backdrop-blur-xl border-0 shadow-2xl",
            header:
              "bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 border-b border-amber-100 dark:border-amber-800",
            body: "bg-gradient-to-b from-white to-gray-50 dark:from-content1 dark:to-content2",
            footer:
              "bg-gradient-to-r from-gray-50 to-white dark:from-content2 dark:to-content1 border-t border-gray-100 dark:border-gray-800",
          }}
        >
          <ModalContent>
            <ModalHeader className="flex flex-col gap-2 p-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <Icon
                    icon="solar:car-bold"
                    className="text-gray-600 dark:text-gray-300"
                    width={18}
                  />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                    Seleziona Veicolo
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Assegna un veicolo al tecnico
                  </p>
                </div>
              </div>
            </ModalHeader>
            <ModalBody className="p-5">
              <div className="space-y-5">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="solar:info-circle-bold"
                      className="text-gray-600 dark:text-gray-400"
                      width={16}
                    />
                    <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                      Seleziona un veicolo da assegnare al tecnico. I veicoli
                      già assegnati ad altri tecnici sono marcati come
                      "Occupato".
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 max-h-96 overflow-y-auto pr-1">
                  {vehicles.map((vehicle) => {
                    const isAssigned = currentEmployees.some(
                      (emp) => emp.assigned_vehicle?.id === vehicle.vehicle_id
                    );
                    const isAssignedToCurrent =
                      selectedEmployee?.assigned_vehicle?.id ===
                      vehicle.vehicle_id;
                    const isCurrentlySelected =
                      tempVehicleAssignment?.id === vehicle.vehicle_id;

                    return (
                      <Card
                        key={vehicle.vehicle_id}
                        className={`cursor-pointer transition-all duration-300 hover:scale-[1.01] ${
                          isCurrentlySelected
                            ? "ring-2 ring-gray-400 shadow-lg bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 ml-2"
                            : "hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700"
                        } border-2`}
                        isPressable
                        onPress={() => {
                          if (isCurrentlySelected) {
                            handleTempRemoveVehicle();
                          } else {
                            handleTempAssignVehicle(vehicle.vehicle_id);
                          }
                          setVehicleSelectionModalOpen(false);
                        }}
                      >
                        <CardBody className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-md transition-all duration-300 ${
                                  isCurrentlySelected
                                    ? "bg-gray-600 dark:bg-gray-400"
                                    : "bg-gray-100 dark:bg-gray-700"
                                }`}
                              >
                                <Icon
                                  icon="solar:car-bold"
                                  className={`${
                                    isCurrentlySelected
                                      ? "text-white"
                                      : "text-gray-600 dark:text-gray-300"
                                  }`}
                                  width={20}
                                />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-gray-800 dark:text-white text-base">
                                  {vehicle.name ||
                                    vehicle.model ||
                                    "Modello non specificato"}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                  {vehicle.license_plate ||
                                    "Targa non disponibile"}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {isAssignedToCurrent && (
                                <Chip
                                  color="primary"
                                  size="sm"
                                  variant="flat"
                                  className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
                                >
                                  Attuale
                                </Chip>
                              )}
                              {isAssigned && !isAssignedToCurrent && (
                                <Chip
                                  color="warning"
                                  size="sm"
                                  variant="flat"
                                  className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-700"
                                >
                                  Occupato
                                </Chip>
                              )}
                              {isCurrentlySelected && (
                                <Chip
                                  color="success"
                                  size="sm"
                                  variant="flat"
                                  className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border border-green-200 dark:border-green-700 shadow-md"
                                >
                                  Selezionato
                                </Chip>
                              )}
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>

                {vehicles.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Icon
                        icon="solar:car-cross-bold"
                        className="text-gray-400 dark:text-gray-500"
                        width={32}
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      Nessun veicolo disponibile
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Non ci sono veicoli da assegnare al momento
                    </p>
                  </div>
                )}
              </div>
            </ModalBody>
            <ModalFooter className="p-6">
              <Button
                color="default"
                variant="light"
                onPress={() => setVehicleSelectionModalOpen(false)}
                className="px-6 py-2 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Chiudi
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </UpdateContext.Provider>
  );
}
