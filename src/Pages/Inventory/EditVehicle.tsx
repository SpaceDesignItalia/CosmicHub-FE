import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import axios from "axios";
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
  Select,
  SelectItem,
  DatePicker,
} from "@heroui/react";
import { parseDate } from "@internationalized/date";
import type { DateValue } from "@internationalized/date";

axios.defaults.baseURL = import.meta.env.VITE_API_URL;

export default function EditVehicle() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [formError, setFormError] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Form data state
  const [formData, setFormData] = useState({
    name: "",
    license_plate: "",
    capacity: "",
    type: "Large Van", // Default value
    status: "Available", // Default value
    last_inspection_date: new Date().toISOString().split("T")[0],
  });

  // Caricamento dei dati del veicolo esistente
  useEffect(() => {
    const fetchVehicle = async () => {
      setIsLoadingData(true);
      try {
        // API per ottenere i dettagli del veicolo
        const response = await axios.get("/Warehouse/GET/GetVehicleById", {
          params: {
            vehicleId: id,
          },
        });
        const vehicle = response.data;

        // Mappiamo i dati dal format del backend al nostro formato form
        setFormData({
          name: vehicle.name || "",
          license_plate: vehicle.license_plate || "",
          capacity: vehicle.capacity ? vehicle.capacity.toString() : "",
          type: vehicle.type === "Furgone grande" ? "Large Van" : "Small Van",
          status: mapStatus(vehicle.status || "Disponibile"),
          last_inspection_date:
            vehicle.last_inspection_date ||
            new Date().toISOString().split("T")[0],
        });
      } catch (error) {
        setFormError(
          "Impossibile caricare i dati del veicolo. Riprova più tardi."
        );

        // Dati di fallback per lo sviluppo
        setFormData({
          name: "Veicolo di Esempio",
          license_plate: "AB123CD",
          capacity: "3500",
          type: "Large Van",
          status: "Available",
          last_inspection_date: new Date().toISOString().split("T")[0],
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    if (id) {
      fetchVehicle();
    }
  }, [id]);

  // Funzione per mappare gli stati da italiano a inglese
  const mapStatus = (
    italianStatus: string
  ): "Available" | "In use" | "Maintenance" => {
    switch (italianStatus) {
      case "Disponibile":
        return "Available";
      case "In uso":
        return "In use";
      case "In manutenzione":
        return "Maintenance";
      default:
        return "Available";
    }
  };

  // Funzione per mappare gli stati da inglese a italiano
  const mapStatusToItalian = (
    status: string
  ): "Disponibile" | "In uso" | "In manutenzione" => {
    switch (status) {
      case "Available":
        return "Disponibile";
      case "In use":
        return "In uso";
      case "Maintenance":
        return "In manutenzione";
      default:
        return "Disponibile";
    }
  };

  // Gestisce i cambiamenti nei campi del form
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
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

  // Gestisce il cambio di stato del veicolo
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      status: e.target.value as "Available" | "In use" | "Maintenance",
    });
  };

  // Gestisce il cambio del tipo di veicolo
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      type: e.target.value as "Large Van" | "Small Van",
    });
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
      !formData.last_inspection_date
    ) {
      setFormError("Tutti i campi sono obbligatori");
      setIsLoading(false);
      return;
    }

    try {
      // Prepara i dati per l'API
      const vehicleData = {
        warehouse_id: id,
        name: formData.name,
        license_plate: formData.license_plate,
        capacity: parseInt(formData.capacity),
        type:
          formData.type === "Large Van" ? "Furgone grande" : "Furgone piccolo",
        status: mapStatusToItalian(formData.status),
        last_inspection_date: formData.last_inspection_date,
      };

      // Chiamata API per aggiornare il veicolo
      await axios.put(`/Warehouse/UPDATE/UpdateVehicle`, vehicleData, {
        params: {
          vehicleId: id,
          vehicleData: vehicleData,
        },
      });

      // Apri il modal di successo
      onOpen();
    } catch (error) {
      setFormError(
        "Si è verificato un errore durante l'aggiornamento del veicolo. Riprova più tardi."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Reindirizza alla pagina dei veicoli dopo l'aggiornamento
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
              icon="mdi:truck-edit"
              className="text-2xl text-blue-700 dark:text-blue-300"
              width={28}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Modifica Veicolo
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {formData.license_plate
                ? `Targa: ${formData.license_plate}`
                : "Caricamento..."}
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

          {isLoadingData ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
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

                {/* Tipo */}
                <div>
                  <label
                    htmlFor="type"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Tipo *
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleTypeChange}
                    className="w-full rounded-lg border-2 border-default-200 bg-white dark:bg-zinc-900 dark:border-zinc-700 p-2"
                  >
                    <option value="Large Van">Furgone Grande</option>
                    <option value="Small Van">Furgone Piccolo</option>
                  </select>
                </div>

                {/* Stato */}
                <div>
                  <label
                    htmlFor="status"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Stato *
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleStatusChange}
                    className="w-full rounded-lg border-2 border-default-200 bg-white dark:bg-zinc-900 dark:border-zinc-700 p-2"
                  >
                    <option value="Available">Disponibile</option>
                    <option value="In use">In uso</option>
                    <option value="Maintenance">In manutenzione</option>
                  </select>
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
                  Salva Modifiche
                </Button>
              </div>
            </form>
          )}
        </CardBody>
      </Card>

      {/* Modal di successo */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Veicolo aggiornato con successo
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col items-center justify-center p-4">
              <div className="w-16 h-16 rounded-full bg-success-100 dark:bg-success-900 flex items-center justify-center mb-4">
                <Icon
                  icon="solar:check-circle-bold"
                  className="text-4xl text-success-600 dark:text-success-400"
                />
              </div>
              <p className="text-center text-gray-700 dark:text-gray-300">
                Il veicolo è stato aggiornato correttamente nel sistema.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={handleSuccessConfirm} autoFocus>
              Torna alla Lista
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
