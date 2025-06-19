"use client";

import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";

// Interface for Employee type
interface Employee {
  user_id: number;
  name: string;
  role: string;
  photo: string;
}

// Create context for update state
const UpdateContext = createContext<{
  triggerUpdate: () => void;
}>({
  triggerUpdate: () => {},
});

// Component for the employee card
function EmployeeCard({ employee }: { employee: Employee }) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Background color based on role
  const getBgGradient = (role: string) => {
    switch (role) {
      case "Senior Technician":
        return "bg-gradient-to-br from-primary-300 via-primary-400 to-primary-500";
      case "Specialized Technician":
        return "bg-gradient-to-br from-secondary-300 via-secondary-400 to-secondary-500";
      case "Junior Technician":
        return "bg-gradient-to-br from-warning-300 via-warning-400 to-warning-500";
      default:
        return "bg-gradient-to-br from-default-300 via-default-400 to-default-500";
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

  return (
    <>
      <Card className="w-full shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader
          className={`relative flex h-[100px] flex-col justify-end overflow-visible ${getBgGradient(
            displayRole
          )}`}
        >
          <Avatar
            src={avatarPhoto}
            showFallback
            name={avatarName}
            className="h-20 w-20 translate-y-12 border-3 border-white"
          />
          <Button
            className="absolute right-3 top-3 bg-white/90 text-primary-600 dark:bg-white/30 dark:text-white"
            radius="full"
            size="sm"
            variant="light"
            onPress={onOpen}
          >
            Details
          </Button>
        </CardHeader>
        <CardBody>
          <div className="pb-2 pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-large font-medium">{displayName}</p>
                <p className="text-small text-default-500">{displayRole}</p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Modal with details */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Dettagli Dipendente
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center">
                <Avatar
                  src={avatarPhoto}
                  showFallback
                  name={avatarName}
                  className="h-32 w-32 mb-4"
                />
                <h3 className="text-xl font-semibold">{displayName}</h3>
                <p className="text-default-900 mt-1">{displayRole}</p>
              </div>
              <div className="flex-1">
                <h4 className="text-medium font-medium mt-4 mb-2">
                  Informazioni Aggiuntive
                </h4>
                <Card className="bg-default-50">
                  <CardBody className="py-3">
                    <p className="text-small text-default-600">
                      ID Dipendente: {employee.user_id}
                    </p>
                  </CardBody>
                </Card>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Chiudi
            </Button>
            <Button color="primary" onPress={onClose}>
              OK
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default function Team() {
  const [currentEmployees, setCurrentEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [updateCounter, setUpdateCounter] = useState(0);

  const triggerUpdate = () => {
    setUpdateCounter((prev) => prev + 1);
  };

  useEffect(() => {
    const fetchEmployees = () => {
      axios
        .get("/Employee/GET/GetAllEmployees", { withCredentials: true })
        .then((response) => {
          setCurrentEmployees(response.data);
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
        });
    };

    fetchEmployees();
  }, [updateCounter]);

  // Funzione per filtrare i dipendenti in base alla query di ricerca
  const filteredEmployees = currentEmployees.filter((employee) => {
    if (!searchQuery.trim()) return true;
    const searchLower = searchQuery.toLowerCase();

    // Cerca in nome e ruolo
    return (
      (employee.name && employee.name.toLowerCase().includes(searchLower)) ||
      (employee.role && employee.role.toLowerCase().includes(searchLower))
    );
  });

  return (
    <UpdateContext.Provider value={{ triggerUpdate }}>
      <div className="w-full flex-1 flex flex-col p-4 gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon
                icon="solar:users-group-rounded-bold"
                className="text-primary"
                width={28}
              />
            </div>
            <h1 className="text-2xl font-bold">Team Tecnico</h1>
          </div>

          {/* Barra di ricerca */}
          <div className="w-full">
            <Input
              placeholder="Cerca per nome o ruolo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="md"
              startContent={
                <Icon
                  icon="solar:magnifer-linear"
                  className="text-default-400"
                />
              }
              isClearable
              onClear={() => setSearchQuery("")}
              className="max-w-md"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((employee) => (
            <EmployeeCard key={employee.user_id} employee={employee} />
          ))}
          {filteredEmployees.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-8 text-center">
              <Icon
                icon="solar:magnifer-failed-linear"
                className="text-default-400 mb-4"
                width={48}
                height={48}
              />
              <p className="text-xl font-medium text-default-600">
                Nessun dipendente trovato
              </p>
              <p className="text-sm text-default-400 mt-2">
                Prova con termini di ricerca diversi
              </p>
            </div>
          )}
        </div>
      </div>
    </UpdateContext.Provider>
  );
}
