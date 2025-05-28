import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import axios from "axios";
import type { Key } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Divider,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  DatePicker,
  Select,
  SelectItem,
  Autocomplete,
  AutocompleteItem,
} from "@heroui/react";
import { parseDate } from "@internationalized/date";
import type { DateValue } from "@internationalized/date";
import type { Employee } from "../../types/Employee";

axios.defaults.baseURL = import.meta.env.VITE_API_URL;

export default function AddVehicle() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Form data state
  const [formData, setFormData] = useState({
    name: "",
    license_plate: "",
    capacity: "",
    type: "",
    assignedUser: "",
    last_inspection_date: new Date().toISOString().split("T")[0],
  });

  // Stati per gli utenti
  const [availableUsers, setAvailableUsers] = useState<Employee[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Tipi di veicolo disponibili
  const vehicleTypes = [
    { key: "Furgone grande", label: "Large Van" },
    { key: "Furgone piccolo", label: "Small Van" },
  ];

  // Carica gli utenti disponibili (senza veicolo assegnato)
  useEffect(() => {
    const fetchAvailableUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const response = await axios.get(
          "/Employee/GET/GetEmplyeesWithoutVehicle"
        );
        setAvailableUsers(response.data || []);
      } catch (error) {
        console.error("Errore nel caricamento degli utenti:", error);
        // In caso di errore, impostiamo un array vuoto
        setAvailableUsers([]);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchAvailableUsers();
  }, []);

  // Gestisce i cambiamenti nei campi del form
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Gestisce il cambio del tipo di veicolo
  const handleTypeChange = (value: string) => {
    setFormData({
      ...formData,
      type: value,
    });
  };

  // Gestisce l'assegnazione utente
  const handleUserAssignment = (key: Key | null) => {
    setFormData({
      ...formData,
      assignedUser: key ? String(key) : "",
    });
  };

  // Gestisce il cambio della data
  const handleDateChange = (value: DateValue | null) => {
    if (value) {
      // Converte il DateValue in una stringa di data nel formato YYYY-MM-DD
      const year = value.year;
      const month = value.month.toString().padStart(2, "0");
      const day = value.day.toString().padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      setFormData({
        ...formData,
        last_inspection_date: dateString,
      });
    }
  };

  // Gestisce l'invio del form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError("");

    // Validazione base
    if (
      !formData.name ||
      !formData.license_plate ||
      !formData.capacity ||
      !formData.type ||
      !formData.last_inspection_date
    ) {
      setFormError("Tutti i campi sono obbligatori");
      setIsLoading(false);
      return;
    }

    try {
      // Prepara i dati per l'API
      const warehouseData = {
        name: formData.name,
        location: "N/A",
        license_plate: formData.license_plate,
        capacity: parseInt(formData.capacity),
        type: formData.type,
        company_id: 1, // Valore predefinito o da ottenere dal contesto dell'applicazione
        assigned_user_id: formData.assignedUser,
        last_inspection: formData.last_inspection_date,
      };

      // Chiamata API per aggiungere il veicolo
      const vehicleResponse = await axios.post(
        "/Warehouse/POST/CreateNewVehicle",
        warehouseData
      );

      // Apri il modal di successo
      if (vehicleResponse.status === 200) {
        onOpen();
      }
    } catch (error) {
      console.error("Errore nella creazione del veicolo:", error);
      setFormError(
        "Si è verificato un errore durante l'aggiunta del veicolo. Riprova più tardi."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Reindirizza alla pagina dei veicoli dopo l'aggiunta
  const handleSuccessConfirm = () => {
    onClose();
    navigate("/inventory/vehicles");
  };

  return (
    <div className="w-full flex-1 flex flex-col p-5 gap-5 bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
            <Icon
              icon="mdi:truck-plus"
              className="text-2xl text-blue-700 dark:text-blue-300"
              width={28}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Aggiungi Veicolo
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Inserisci i dettagli del nuovo veicolo
            </p>
          </div>
        </div>

        <Button
          variant="light"
          color="default"
          startContent={<Icon icon="solar:arrow-left-linear" />}
          onPress={() => navigate("/inventory/vehicles")}
        >
          Torna ai Veicoli
        </Button>
      </div>

      {/* Form Card */}
      <Card className="shadow-sm rounded-xl overflow-hidden border-2 border-default-200">
        <CardHeader className="border-b">
          <h2 className="text-xl font-semibold">Informazioni Veicolo</h2>
        </CardHeader>
        <CardBody className="p-6">
          {formError && (
            <div className="mb-4 p-3 bg-danger-50 text-danger-700 dark:bg-danger-900 dark:text-danger-300 rounded-lg border border-danger-200 dark:border-danger-800">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome veicolo */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Nome Veicolo *
                </label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Es. Iveco Daily"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full"
                />
              </div>

              {/* Targa */}
              <div>
                <label
                  htmlFor="license_plate"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Targa *
                </label>
                <Input
                  id="license_plate"
                  name="license_plate"
                  placeholder="Es. AB123CD"
                  value={formData.license_plate}
                  onChange={handleChange}
                  className="w-full"
                />
              </div>

              {/* Capacità */}
              <div>
                <label
                  htmlFor="capacity"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Capacità (kg) *
                </label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  placeholder="Es. 3500"
                  value={formData.capacity}
                  onChange={handleChange}
                  className="w-full"
                />
              </div>

              {/* Tipo di veicolo */}
              <div>
                <label
                  htmlFor="type"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Tipo di Veicolo *
                </label>
                <Select
                  id="type"
                  placeholder="Seleziona tipo veicolo"
                  selectedKeys={formData.type ? [formData.type] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    handleTypeChange(selectedKey);
                  }}
                  className="w-full"
                >
                  {vehicleTypes.map((type) => (
                    <SelectItem key={type.key}>{type.label}</SelectItem>
                  ))}
                </Select>
              </div>

              {/* Data ultima ispezione */}
              <div>
                <label
                  htmlFor="last_inspection_date"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Data Ultima Ispezione *
                </label>
                <DatePicker
                  id="last_inspection_date"
                  value={
                    formData.last_inspection_date
                      ? parseDate(formData.last_inspection_date)
                      : null
                  }
                  onChange={handleDateChange}
                  className="w-full"
                />
              </div>

              {/* Assegnazione utente */}
              <div>
                <label
                  htmlFor="assignedUser"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Assegna a Utente (opzionale)
                </label>
                <Autocomplete
                  id="assignedUser"
                  placeholder={
                    isLoadingUsers
                      ? "Caricamento utenti..."
                      : "Seleziona un utente"
                  }
                  selectedKey={formData.assignedUser}
                  onSelectionChange={handleUserAssignment}
                  isLoading={isLoadingUsers}
                  className="w-full"
                  allowsCustomValue={false}
                  items={availableUsers}
                >
                  {(user) => (
                    <AutocompleteItem key={user.id} textValue={user.name}>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-xs text-gray-500">
                          {user.role}
                        </span>
                      </div>
                    </AutocompleteItem>
                  )}
                </Autocomplete>
                {availableUsers.length === 0 && !isLoadingUsers && (
                  <p className="text-xs text-gray-500 mt-1">
                    Nessun utente disponibile (tutti gli utenti hanno già un
                    veicolo assegnato)
                  </p>
                )}
              </div>
            </div>

            <Divider className="my-6" />

            <div className="flex justify-end space-x-3">
              <Button
                variant="flat"
                color="default"
                onPress={() => navigate("/inventory/vehicles")}
              >
                Annulla
              </Button>
              <Button type="submit" color="primary" isLoading={isLoading}>
                Aggiungi Veicolo
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Modal di successo */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Veicolo aggiunto con successo
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col items-center justify-center p-4">
              <div className="w-16 h-16 rounded-full bg-success-100 dark:bg-success-900 flex items-center justify-center mb-4">
                <Icon
                  icon="mdi:check"
                  className="text-4xl text-success-600 dark:text-success-400"
                />
              </div>
              <p className="text-center">
                Il veicolo è stato aggiunto correttamente al sistema.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={handleSuccessConfirm} fullWidth>
              Torna ai Veicoli
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
