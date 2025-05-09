import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Button,
  Input,
  Breadcrumbs,
  BreadcrumbItem,
  Textarea,
  Modal,
  ModalContent,
  ModalBody,
  useDisclosure,
} from "@heroui/react";
import { Icon } from "@iconify/react";

const WarehouseNew: React.FC = () => {
  const navigate = useNavigate();

  // Stato per il form
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    capacity: "",
  });

  // Stato per il loading durante il salvataggio
  const [isLoading, setIsLoading] = useState(false);
  // Stato per gli errori del form
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Stato per il modal di successo
  const {
    isOpen: isSuccessOpen,
    onOpen: onSuccessOpen,
    onClose: onSuccessClose,
  } = useDisclosure();
  // Stato per memorizzare l'ID del magazzino creato
  const [createdWarehouseId, setCreatedWarehouseId] = useState<string | null>(
    null
  );

  // Gestione del cambiamento dei campi del form
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Pulisce l'errore quando l'utente modifica il campo
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validazione del form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Il nome è obbligatorio";
    }

    if (!formData.location.trim()) {
      newErrors.location = "La posizione è obbligatoria";
    }

    if (!formData.capacity.trim()) {
      newErrors.capacity = "La capacità è obbligatoria";
    } else if (
      isNaN(Number(formData.capacity)) ||
      Number(formData.capacity) <= 0
    ) {
      newErrors.capacity = "La capacità deve essere un numero positivo";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Invio del form
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Ottieni l'ID dell'azienda dalla sessione
      const sessionResponse = await axios.get(
        "/Authentication/GET/GetSessionData"
      );
      const companyId = sessionResponse.data.company_id;

      // Crea il magazzino
      const response = await axios.post("/Warehouse/POST/CreateWarehouse", {
        name: formData.name,
        location: formData.location,
        capacity: formData.capacity,
        company_id: companyId,
      });

      if (response.data && response.data.warehouse_id) {
        // Memorizza l'ID del magazzino creato
        setCreatedWarehouseId(response.data.warehouse_id);
        // Mostra il modal di successo
        onSuccessOpen();
        // Attendi 3 secondi e poi reindirizza
        setTimeout(() => {
          onSuccessClose();
          navigate(`/warehouses/${response.data.warehouse_id}`);
        }, 3000);
      } else {
        throw new Error("Errore nella creazione del magazzino");
      }
    } catch (error) {
      console.error("Errore durante la creazione del magazzino:", error);
      setErrors({
        submit:
          "Si è verificato un errore durante la creazione del magazzino. Riprova più tardi.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs className="mb-4">
        <BreadcrumbItem href="/dashboard">Dashboard</BreadcrumbItem>
        <BreadcrumbItem href="/dashboard">Magazzini</BreadcrumbItem>
        <BreadcrumbItem>Nuovo Magazzino</BreadcrumbItem>
      </Breadcrumbs>

      {/* Modal di successo */}
      <Modal
        isOpen={isSuccessOpen}
        onClose={onSuccessClose}
        hideCloseButton
        isDismissable={false}
      >
        <ModalContent>
          <ModalBody className="py-6">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success-100">
                <Icon
                  icon="solar:check-circle-bold"
                  className="text-success"
                  width={40}
                />
              </div>
              <h3 className="mb-2 text-xl font-bold">Magazzino Creato!</h3>
              <p className="text-default-500">
                Il magazzino è stato creato con successo. Verrai reindirizzato
                alla pagina del magazzino...
              </p>
              <div className="mt-4 w-full">
                <div className="h-1 w-full overflow-hidden rounded-full bg-default-100">
                  <div
                    className="h-full bg-success animate-progress"
                    style={{
                      animation: "progress 3s linear forwards",
                    }}
                  />
                </div>
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Icon
              icon="solar:warehouse-3-bold-duotone"
              className="text-primary"
              width={28}
              height={28}
            />
          </div>
          <div className="ml-4">
            <h1 className="text-2xl font-bold">Nuovo Magazzino</h1>
            <p className="text-default-500">
              Compila il form per creare un nuovo magazzino
            </p>
          </div>
        </div>
      </div>

      {/* Form per la creazione di un nuovo magazzino */}
      <Card className="mx-auto w-full max-w-3xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-lg font-semibold">Informazioni Magazzino</h2>
        </CardHeader>
        <Divider />
        <CardBody className="py-6">
          {errors.submit && (
            <div className="mb-4 rounded-md bg-danger-100 p-4 text-danger-700">
              <p>{errors.submit}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <p className="mb-2 text-sm">
                Nome <span className="text-danger">*</span>
              </p>
              <Input
                placeholder="Nome del magazzino"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                isInvalid={!!errors.name}
                errorMessage={errors.name}
              />
            </div>
            <div>
              <p className="mb-2 text-sm">
                Posizione <span className="text-danger">*</span>
              </p>
              <Input
                placeholder="Posizione del magazzino"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                isInvalid={!!errors.location}
                errorMessage={errors.location}
              />
            </div>
            <div className="md:col-span-2">
              <p className="mb-2 text-sm">
                Capacità (m³) <span className="text-danger">*</span>
              </p>
              <Input
                placeholder="Capacità del magazzino"
                type="number"
                value={formData.capacity}
                onChange={(e) => handleChange("capacity", e.target.value)}
                isInvalid={!!errors.capacity}
                errorMessage={errors.capacity}
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <Button
              color="default"
              variant="light"
              onClick={() => navigate("/dashboard")}
            >
              Annulla
            </Button>
            <Button
              color="primary"
              isLoading={isLoading}
              onClick={handleSubmit}
            >
              Crea Magazzino
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

// Aggiungo un'animazione CSS per la barra di progresso
const style = document.createElement("style");
style.innerHTML = `
@keyframes progress {
  0% { width: 0; }
  100% { width: 100%; }
}
.animate-progress {
  animation: progress 3s linear forwards;
}
`;
document.head.appendChild(style);

export default WarehouseNew;
