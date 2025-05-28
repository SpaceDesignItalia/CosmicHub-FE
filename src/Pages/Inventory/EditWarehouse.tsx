import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  ModalHeader,
  ModalFooter,
  useDisclosure,
  Switch,
} from "@heroui/react";
import { Icon } from "@iconify/react";

const EditWarehouse: React.FC = () => {
  const navigate = useNavigate();
  const { UUID } = useParams<{ UUID: string }>();

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
  // Stato per il loading dei dati
  const [isLoadingData, setIsLoadingData] = useState(true);
  // Stato per gli errori del form
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Stato per il modal di successo
  const {
    isOpen: isSuccessOpen,
    onOpen: onSuccessOpen,
    onClose: onSuccessClose,
  } = useDisclosure();

  // Stato per il modal di eliminazione
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  // Stato per l'eliminazione
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  // Aggiungi lo stile CSS per l'animazione
  useEffect(() => {
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

    return () => {
      // Cleanup: rimuovi lo stile quando il componente viene smontato
      document.head.removeChild(style);
    };
  }, []);

  // Carica i dati del magazzino
  useEffect(() => {
    const fetchWarehouseData = async () => {
      try {
        setIsLoadingData(true);
        const response = await axios.get(`/Warehouse/GET/GetWarehouseByUUID`, {
          params: {
            warehouse_uuid: UUID, // Utilizza UUID invece di id
          },
        });

        // Normalizza i nomi dei campi dal backend
        setFormData({
          warehouseName:
            response.data.WarehouseName || response.data.name || "",
          warehouseCode: response.data.WarehouseCode || "",
          warehouseCountry: response.data.WarehouseCountry || "Italia",
          warehouseAdress:
            response.data.WarehouseAdress || response.data.location || "",
          isActive: response.data.IsActive !== false, // Se undefined o null, considera true
        });
      } catch (error) {
        setErrors({
          submit:
            "Impossibile caricare i dati del magazzino. Riprova più tardi.",
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    if (UUID) {
      fetchWarehouseData();
    } else {
      setIsLoadingData(false);
    }
  }, [UUID]);

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
      // Ottieni l'ID dell'azienda dalla sessione per coerenza
      const sessionResponse = await axios.get(
        "/Authentication/GET/GetSessionData"
      );
      const companyId = sessionResponse.data.company_id;
      const userId = sessionResponse.data.user_id;

      // Aggiorna il magazzino con i nomi dei campi corretti
      const response = await axios.put("/Warehouse/UPDATE/UpdateWarehouse", {
        warehouse_uuid: UUID, // Utilizza UUID invece di id
        WarehouseName: formData.warehouseName,
        WarehouseCode: formData.warehouseCode,
        WarehouseCountry: formData.warehouseCountry,
        WarehouseAdress: formData.warehouseAdress,
        IsActive: formData.isActive,
        company_id: companyId,
      });

      if (response.status === 200) {
        // Mostra il modal di successo
        onSuccessOpen();
        // Attendi 3 secondi e poi reindirizza
        setTimeout(() => {
          onSuccessClose();
          navigate(`/warehouses/${UUID}`);
        }, 3000);
      } else {
        throw new Error("Errore nell'aggiornamento del magazzino");
      }
    } catch (error) {
      setErrors({
        submit:
          "Si è verificato un errore durante l'aggiornamento del magazzino. Riprova più tardi.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Gestisci eliminazione (disattivazione) del magazzino
  const handleDeleteWarehouse = async () => {
    if (!UUID) return;

    setIsDeleteLoading(true);
    try {
      // Endpoint per la disattivazione del magazzino (soft delete)
      await axios.put(`/Warehouse/UPDATE/DeactivateWarehouse`, {
        warehouse_uuid: UUID, // Utilizza UUID invece di id
      });

      // Redirect alla lista dei magazzini
      navigate("/inventory/products");
    } catch (error) {
      // Gestire l'errore qui (es. mostrare un messaggio all'utente)
    } finally {
      setIsDeleteLoading(false);
      onDeleteClose();
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6">
        <div className="flex flex-col items-center">
          <Icon
            icon="solar:spinner-outline"
            className="animate-spin"
            width={48}
          />
          <p className="mt-4">Caricamento in corso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs className="mb-4">
        <BreadcrumbItem href="/dashboard">Dashboard</BreadcrumbItem>
        <BreadcrumbItem href="/inventory/products">Inventario</BreadcrumbItem>
        <BreadcrumbItem>Modifica Magazzino</BreadcrumbItem>
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
              <h3 className="mb-2 text-xl font-bold">Magazzino Aggiornato!</h3>
              <p className="text-default-500">
                Il magazzino è stato aggiornato con successo. Verrai
                reindirizzato alla pagina del magazzino...
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

      {/* Modal di conferma eliminazione */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} size="md">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Conferma Disattivazione
          </ModalHeader>
          <ModalBody>
            <p>
              Sei sicuro di voler disattivare il magazzino{" "}
              <strong>{formData.warehouseName}</strong>?
            </p>
            <p className="mt-2 text-danger">
              Il magazzino verrà disattivato ma i dati non saranno eliminati
              definitivamente.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={onDeleteClose}>
              Annulla
            </Button>
            <Button
              color="danger"
              onPress={handleDeleteWarehouse}
              isLoading={isDeleteLoading}
            >
              Disattiva
            </Button>
          </ModalFooter>
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
            <h1 className="text-2xl font-bold">Modifica Magazzino</h1>
            <p className="text-default-500">
              Aggiorna le informazioni del magazzino
            </p>
          </div>
        </div>
        <div className="mt-4 flex space-x-2 md:mt-0">
          <Button
            variant="light"
            color="default"
            startContent={<Icon icon="solar:arrow-left-linear" />}
            onPress={() => navigate(`/warehouses/${UUID}`)}
          >
            Torna al Magazzino
          </Button>
        </div>
      </div>

      {/* Form per la modifica del magazzino */}
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
              onClick={() => navigate(`/warehouses/${UUID}`)}
            >
              Annulla
            </Button>
            <Button
              color="primary"
              onClick={handleSubmit}
              isLoading={isLoading}
            >
              Salva
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default EditWarehouse;
