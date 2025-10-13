import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import PageHeader from "../../Components/Layout/PageHeader";
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
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    license_plate?: string;
    capacity?: string;
    type?: string;
    last_inspection_date?: string;
  }>({});

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
          "/Employee/GET/GetEmployeesWithoutVehicle"
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

  // Normalizza la targa in maiuscolo e senza spazi
  const handleLicensePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/\s+/g, "");
    setFormData((prev) => ({ ...prev, license_plate: value }));
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
    setFieldErrors({});

    // Validazione base
    const errors: {
      name?: string;
      license_plate?: string;
      capacity?: string;
      type?: string;
      last_inspection_date?: string;
    } = {};

    if (!formData.name) {
      errors.name = "Inserisci il nome del veicolo";
    }
    if (!formData.license_plate) {
      errors.license_plate = "Inserisci la targa";
    } else if (!/^[A-Z0-9-]{5,10}$/.test(formData.license_plate)) {
      errors.license_plate = "Formato targa non valido";
    }
    if (!formData.capacity) {
      errors.capacity = "Inserisci la capacità";
    } else if (Number(formData.capacity) <= 0) {
      errors.capacity = "La capacità deve essere maggiore di 0";
    }
    if (!formData.type) {
      errors.type = "Seleziona il tipo di veicolo";
    }
    if (!formData.last_inspection_date) {
      errors.last_inspection_date = "Seleziona la data";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Correggi i campi evidenziati");
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
    <div className="h-screen flex flex-col bg-background p-6 gap-6">
      {/* Page Header */}
      <PageHeader
        title="Aggiungi Nuovo Veicolo"
        description="Inserisci i dettagli del nuovo veicolo"
        icon="solar:car-plus-bold-duotone"
        size="md"
        actions={[
          {
            label: "Torna alla Lista",
            icon: "solar:arrow-left-bold",
            color: "default",
            variant: "flat",
            onClick: () => navigate("/inventory/vehicles"),
          },
        ]}
      />

      {/* Form Card */}
      <Card className="shadow-lg rounded-xl overflow-hidden border border-default-200">
        <CardHeader className="border-b bg-default-50/50">
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
                  startContent={<Icon icon="solar:car-bold" className="text-default-400" />}
                  isInvalid={!!fieldErrors.name}
                  errorMessage={fieldErrors.name}
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
                  onChange={handleLicensePlateChange}
                  className="w-full"
                  startContent={<Icon icon="solar:hashtag-linear" className="text-default-400" />}
                  isInvalid={!!fieldErrors.license_plate}
                  errorMessage={fieldErrors.license_plate}
                  maxLength={10}
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
                  startContent={<Icon icon="solar:weight-bold" className="text-default-400" />}
                  isInvalid={!!fieldErrors.capacity}
                  errorMessage={fieldErrors.capacity}
                  min={0}
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
                  isInvalid={!!fieldErrors.type}
                  errorMessage={fieldErrors.type}
                >
                  {vehicleTypes.map((type) => (
                    <SelectItem
                      key={type.key}
                      startContent={<Icon icon={type.key === "Furgone grande" ? "solar:bus-bold" : "solar:delivery-bold"} className="text-default-500" />}
                    >
                      {type.label}
                    </SelectItem>
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
                      ? (parseDate(formData.last_inspection_date) as any)
                      : undefined
                  }
                  onChange={handleDateChange}
                  className="w-full"
                  isInvalid={!!fieldErrors.last_inspection_date}
                  errorMessage={fieldErrors.last_inspection_date}
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
                    <AutocompleteItem key={user.user_id} textValue={user.name}>
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

            {/* Preview sintetica del veicolo */}
            <div className="rounded-lg border border-default-200 p-4 bg-default-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon icon="solar:car-bold-duotone" className="text-primary" width={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-default-500 truncate">
                    {formData.license_plate || "—"}
                  </p>
                  <p className="font-medium text-foreground truncate">
                    {formData.name || "Nuovo veicolo"}
                  </p>
                </div>
                <div className="text-xs text-default-500">
                  {formData.type || "Tipo non selezionato"}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="flat"
                color="default"
                onPress={() => navigate(-1)}
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
