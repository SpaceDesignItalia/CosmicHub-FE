"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardBody, Button, Avatar, Tabs, Tab, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Input } from "@heroui/react";
import { Icon } from "@iconify/react";
import axios from 'axios';

// Interface for Van type
interface Van {
  id: string;
  licensePlate: string;
  model: string;
}

// Interface for Employee type
interface Employee {
  id: number;
  name: string;
  password?: string;
  role: string;
  photo: string;
  assignedVan?: Van;
}


// Component for the employee card
function EmployeeCard({ employee }: { employee: Employee }) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Background color based on role - simplified or could be removed if not strictly warehouse related
  const getBgGradient = (role: string) => {
    switch (role) {
      case "Senior Technician": return "bg-gradient-to-br from-primary-300 via-primary-400 to-primary-500";
      case "Specialized Technician": return "bg-gradient-to-br from-secondary-300 via-secondary-400 to-secondary-500";
      case "Junior Technician": return "bg-gradient-to-br from-warning-300 via-warning-400 to-warning-500";
      default: return "bg-gradient-to-br from-default-300 via-default-400 to-default-500";
    }
  };

  // Gestione per employee.name e employee.photo mancanti
  const avatarName = employee.name ? employee.name.split(' ').map((n: string) => n[0]).join('') : '';
  const displayName = employee.name || 'Nome non disponibile';
  const displayRole = employee.role || 'Ruolo non specificato';
  const avatarPhoto = employee.photo; // Lasciamo che Avatar gestisca il fallback se photo è undefined

  return (
    <>
      <Card className="w-full shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className={`relative flex h-[100px] flex-col justify-end overflow-visible ${getBgGradient(displayRole)}`}>
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
          {employee.assignedVan && (
            <div className="absolute left-3 top-3 bg-white/90 dark:bg-black/70 rounded-lg p-1.5 flex items-center gap-1.5 shadow-sm border border-primary/10">
              <Icon icon="solar:truck-bold" className="text-primary-600 dark:text-primary" />
              <span className="text-xs font-medium text-primary-600 dark:text-white">{employee.assignedVan.licensePlate}</span>
            </div>
          )}
        </CardHeader>
        <CardBody>
          <div className="pb-2 pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-large font-medium">{displayName}</p>
                <p className="text-small text-default-500">{displayRole}</p>
              </div>
            </div>
            {employee.assignedVan && (
              <div className="py-2 mt-2">
                <p className="text-small text-default-900">Assigned Van:</p>
                <p className="text-small font-medium">
                  {employee.assignedVan.model} - {employee.assignedVan.licensePlate}
                </p>
              </div>
            )}
        
          </div>
        </CardBody>
      </Card>

      {/* Modal with details */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Employee Details
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
                {employee.assignedVan && (
                  <>
                    <h4 className="text-medium font-medium mt-4 mb-2">Assigned Van</h4>
                    <Card className="bg-default-50">
                      <CardBody className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-primary/10">
                            <Icon icon="solar:truck-bold" width={24} height={24} className="text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{employee.assignedVan.model}</p>
                            <p className="text-small text-default-500">License Plate: {employee.assignedVan.licensePlate}</p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </>
                )}
                {!employee.assignedVan && (
                    <p className="text-default-700 mt-4">No van assigned to this employee.</p>
                )}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Close
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

export default function Dashboard() {
  const [currentEmployees, setCurrentEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const fetchEmployees = () => {
      axios.get("/Employee/GET/GetAllEmployees", { withCredentials: true })
        .then((response) => {
          setCurrentEmployees(response.data);
        })
        .catch((error) => {
          console.error("Failed to fetch employees:", error);
          if (axios.isAxiosError(error)) {
            console.error("Axios error details:", error.response?.data, error.response?.status, error.response?.headers);
          }
        });
    };

    fetchEmployees();
  }, []);

  // Funzione per filtrare i dipendenti in base alla query di ricerca
  const filteredEmployees = currentEmployees.filter(employee => {
    if (!searchQuery.trim()) return true;
    const searchLower = searchQuery.toLowerCase();
    
    // Cerca in nome, ruolo e targa del veicolo (se assegnato)
    return (
      (employee.name && employee.name.toLowerCase().includes(searchLower)) || 
      (employee.role && employee.role.toLowerCase().includes(searchLower)) ||
      (employee.assignedVan && employee.assignedVan.licensePlate.toLowerCase().includes(searchLower)) ||
      (employee.assignedVan && employee.assignedVan.model.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="w-full flex-1 flex flex-col p-4 gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon icon="solar:users-group-rounded-bold" className="text-primary" width={28} />
          </div>
          <h1 className="text-2xl font-bold">Team Tecnico</h1>
        </div>
        
        {/* Barra di ricerca */}
        <div className="w-full">
          <Input
            placeholder="Cerca per nome, ruolo o veicolo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="md"
            startContent={<Icon icon="solar:magnifer-linear" className="text-default-400" />}
            isClearable
            onClear={() => setSearchQuery("")}
            className="max-w-md"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map(employee => (
          <EmployeeCard key={employee.id} employee={employee} />
        ))}
        {filteredEmployees.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center p-8 text-center">
            <Icon icon="solar:magnifer-failed-linear" className="text-default-400 mb-4" width={48} height={48} />
            <p className="text-xl font-medium text-default-600">Nessun dipendente trovato</p>
            <p className="text-sm text-default-400 mt-2">Prova con termini di ricerca diversi</p>
          </div>
        )}
      </div>
    </div>
  );
}