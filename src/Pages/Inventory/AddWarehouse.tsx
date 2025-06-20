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
  Modal,
  ModalContent,
  ModalBody,
  useDisclosure,
  Switch,
} from "@heroui/react";
import { Icon } from "@iconify/react";

const AddWarehouse: React.FC = () => {
  const navigate = useNavigate();

  // Stato per il form
  const [formData, setFormData] = useState({
    warehouseName: "",
    warehouseCode: "",
    warehouseCountry: "Italia",
    warehouseAdress: "",
    isActive: true,
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
  // Stato per memorizzare l'UUID del magazzino creato
  const [createdWarehouseUUID, setCreatedWarehouseUUID] = useState<
    string | null
  >(null);

  // Gestione del cambiamento dei campi del form
  const handleChange = (field: string, value: string | boolean) => {
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

    if (!formData.warehouseName.trim()) {
      newErrors.warehouseName = "Il nome è obbligatorio";
    }

    if (!formData.warehouseCode.trim()) {
      newErrors.warehouseCode = "Il codice è obbligatorio";
    }

    if (!formData.warehouseAdress.trim()) {
      newErrors.warehouseAdress = "L'indirizzo è obbligatorio";
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
      const userId = sessionResponse.data.user_id;

      // Crea il magazzino con i nomi dei campi corretti
      const warehouseUUID = crypto.randomUUID();

      const response = await axios.post("/Warehouse/POST/CreateWarehouse", {
        WarehouseUUID: warehouseUUID,
        WarehouseName: formData.warehouseName,
        WarehouseCode: formData.warehouseCode,
        WarehouseCountry: formData.warehouseCountry,
        WarehouseAdress: formData.warehouseAdress,
        IsActive: formData.isActive,
        CreatedBy: userId,
        company_id: companyId,
      });

      if (
        response.data &&
        (response.data.WarehouseUUID || response.data.warehouse_id)
      ) {
        // Memorizza l'UUID del magazzino creato
        const uuid = response.data.WarehouseUUID || response.data.warehouse_id;
        setCreatedWarehouseUUID(uuid);
        // Mostra il modal di successo
        onSuccessOpen();
        // Attendi 3 secondi e poi reindirizza
        setTimeout(() => {
          onSuccessClose();
          navigate(`/warehouses/${uuid}`);
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
        <BreadcrumbItem href="/warehouses">Magazzini</BreadcrumbItem>
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
                value={formData.warehouseName}
                onChange={(e) => handleChange("warehouseName", e.target.value)}
                isInvalid={!!errors.warehouseName}
                errorMessage={errors.warehouseName}
              />
            </div>
            <div>
              <p className="mb-2 text-sm">
                Codice <span className="text-danger">*</span>
              </p>
              <Input
                placeholder="Codice del magazzino"
                value={formData.warehouseCode}
                onChange={(e) => handleChange("warehouseCode", e.target.value)}
                isInvalid={!!errors.warehouseCode}
                errorMessage={errors.warehouseCode}
              />
            </div>
            <div>
              <p className="mb-2 text-sm">
                Paese <span className="text-danger">*</span>
              </p>
              <Input
                placeholder="Paese"
                value={formData.warehouseCountry}
                onChange={(e) =>
                  handleChange("warehouseCountry", e.target.value)
                }
                isInvalid={!!errors.warehouseCountry}
                errorMessage={errors.warehouseCountry}
              />
            </div>
            <div>
              <p className="mb-2 text-sm">
                Indirizzo <span className="text-danger">*</span>
              </p>
              <Input
                placeholder="Indirizzo del magazzino"
                value={formData.warehouseAdress}
                onChange={(e) =>
                  handleChange("warehouseAdress", e.target.value)
                }
                isInvalid={!!errors.warehouseAdress}
                errorMessage={errors.warehouseAdress}
              />
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center">
                <p className="mr-4 text-sm">Stato del magazzino:</p>
                <div className="flex items-center">
                  <Switch
                    isSelected={formData.isActive}
                    onValueChange={(value) => handleChange("isActive", value)}
                    color="success"
                    size="sm"
                  />
                  <span
                    className={`ml-2 text-sm ${
                      formData.isActive ? "text-success-600" : "text-danger-600"
                    }`}
                  >
                    {formData.isActive ? "Attivo" : "Disattivato"}
                  </span>
                </div>
              </div>
              <p className="mt-1 text-xs text-default-500">
                I magazzini disattivati saranno visibili ma evidenziati come non
                attivi nell'interfaccia.
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-4">
            <Button
              color="default"
              variant="light"
              onClick={() => navigate(-1)}
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

export default AddWarehouse;
