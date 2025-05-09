import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Button,
  Tabs,
  Tab,
  Input,
  Spacer,
  Chip,
  Progress,
  Breadcrumbs,
  BreadcrumbItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { ResponsiveContainer, RadialBarChart, RadialBar, Cell, PolarAngleAxis } from "recharts";

// Definizione dell'interfaccia Warehouse basata sui dati forniti
interface Warehouse {
  warehouse_id: string;
  name: string;
  location: string;
  company_id: string;
  created_at: Date | string;
  created_by: string;
  capacity: string;
  type: string;
  license_plate: string | null;
  last_inspection: string | null;
  type_name: string;
}

interface Company {
  company_id: string;
  name: string;
}

const WarehouseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("overview");

  // Stati per il modal di modifica
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const [editForm, setEditForm] = useState<{
    name: string;
    location: string;
    capacity: string;
    type: string;
  }>({
    name: "",
    location: "",
    capacity: "",
    type: "",
  });
  const [isEditLoading, setIsEditLoading] = useState<boolean>(false);

  // Stati per il modal di eliminazione
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [isDeleteLoading, setIsDeleteLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchWarehouseDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/Warehouse/GET/GetWarehouseById`, {
          params: {
            warehouse_id: id,
          },
        });
        setWarehouse(response.data);

        // Inizializza il form di modifica con i dati attuali
        if (response.data) {
          setEditForm({
            name: response.data.name || "",
            location: response.data.location || "",
            capacity: response.data.capacity || "",
            type: response.data.type || "",
          });
        }

        // Dopo aver caricato i dati del magazzino, recuperiamo le informazioni dell'azienda
        if (response.data && response.data.company_id) {
          fetchCompanyDetails(response.data.company_id);
        }

        setError(null);
      } catch (err) {
        console.error(
          "Errore nel caricamento dei dettagli del magazzino:",
          err
        );
        setError("Impossibile caricare i dettagli del magazzino");
        setLoading(false);
      }
    };

    const fetchCompanyDetails = async (companyId: string) => {
      try {
        const companyResponse = await axios.get(
          `Company/GET/GetCompanyByCompanyId`,
          {
            params: {
              company_id: companyId,
            },
          }
        );

        if (companyResponse.data && companyResponse.data.name) {
          setCompanyName(companyResponse.data.name);
        }
      } catch (err) {
        console.error("Errore nel caricamento dei dettagli dell'azienda:", err);
        // Non interrupiamo il flusso principale in caso di errore nel caricamento dell'azienda
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchWarehouseDetails();
    }
  }, [id]);

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Gestione del form di modifica
  const handleEditFormChange = (field: string, value: string) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Salvataggio delle modifiche
  const handleSaveChanges = async () => {
    if (!warehouse || !id) return;

    setIsEditLoading(true);
    try {
      // Endpoint per l'aggiornamento del magazzino
      await axios.put(`/Warehouse/PUT/UpdateWarehouse`, {
        warehouse_id: id,
        name: editForm.name,
        location: editForm.location,
        capacity: editForm.capacity,
        type: editForm.type,
        company_id: warehouse.company_id,
      });

      // Aggiorna i dati locali
      setWarehouse((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          name: editForm.name,
          location: editForm.location,
          capacity: editForm.capacity,
          type: editForm.type,
        };
      });

      onEditClose();
    } catch (error) {
      console.error("Errore durante l'aggiornamento del magazzino:", error);
      // Gestire l'errore qui (es. mostrare un messaggio all'utente)
    } finally {
      setIsEditLoading(false);
    }
  };

  // Eliminazione del magazzino
  const handleDeleteWarehouse = async () => {
    if (!id) return;

    setIsDeleteLoading(true);
    try {
      // Endpoint per l'eliminazione del magazzino
      await axios.delete(`/Warehouse/DELETE/DeleteWarehouse`, {
        params: {
          warehouse_id: id,
        },
      });

      // Redirect alla lista dei magazzini
      navigate("/dashboard");
    } catch (error) {
      console.error("Errore durante l'eliminazione del magazzino:", error);
      // Gestire l'errore qui (es. mostrare un messaggio all'utente)
    } finally {
      setIsDeleteLoading(false);
      onDeleteClose();
    }
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
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

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center">
          <Icon
            icon="solar:danger-triangle-bold"
            className="text-danger"
            width={48}
          />
          <p className="mt-4">{error}</p>
          <Button
            className="mt-4"
            color="primary"
            onPress={() => (window.location.href = "/dashboard")}
          >
            Torna alla Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center">
          <Icon
            icon="solar:danger-triangle-bold"
            className="text-danger"
            width={48}
          />
          <p className="mt-4">Magazzino non trovato</p>
          <Button
            className="mt-4"
            color="primary"
            onPress={() => (window.location.href = "/dashboard")}
          >
            Torna alla Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Valore fisso al 50% per la percentuale di capacità
  const capacityUsage = 69;
  const capacityColor =
    capacityUsage > 80 ? "danger" : capacityUsage > 60 ? "warning" : "success";

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs className="mb-4">
        <BreadcrumbItem href="/dashboard">Dashboard</BreadcrumbItem>
        <BreadcrumbItem href="/dashboard">Magazzini</BreadcrumbItem>
        <BreadcrumbItem>{warehouse.name}</BreadcrumbItem>
      </Breadcrumbs>

      {/* Header con info principali */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Icon
              icon="mdi:warehouse"
              className="text-primary"
              width={28}
              height={28}
            />
          </div>
          <div className="ml-4">
            <h1 className="text-2xl font-bold">{warehouse.name}</h1>
            <p className="text-default-500">ID: {warehouse.warehouse_id}</p>
            {companyName && (
              <p className="text-default-500">Azienda: {companyName}</p>
            )}
          </div>
        </div>
        <div className="mt-4 flex space-x-2 md:mt-0">
          <Button
            color="primary"
            variant="flat"
            startContent={<Icon icon="solar:pen-bold" width={18} />}
            onPress={onEditOpen}
          >
            Modifica
          </Button>
          <Button
            color="danger"
            variant="flat"
            startContent={<Icon icon="solar:trash-bin-trash-bold" width={18} />}
            onPress={onDeleteOpen}
          >
            Elimina
          </Button>
        </div>
      </div>

      {/* Modal di modifica */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="2xl">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Modifica Magazzino
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm">Nome</p>
                <Input
                  placeholder="Nome del magazzino"
                  value={editForm.name}
                  onChange={(e) => handleEditFormChange("name", e.target.value)}
                />
              </div>
              <div>
                <p className="mb-2 text-sm">Posizione</p>
                <Input
                  placeholder="Posizione del magazzino"
                  value={editForm.location}
                  onChange={(e) =>
                    handleEditFormChange("location", e.target.value)
                  }
                />
              </div>
              <div>
                <p className="mb-2 text-sm">Capacità (m³)</p>
                <Input
                  placeholder="Capacità del magazzino"
                  type="number"
                  value={editForm.capacity}
                  onChange={(e) =>
                    handleEditFormChange("capacity", e.target.value)
                  }
                />
              </div>
              <div>
                <p className="mb-2 text-sm">Tipo</p>
                <Select
                  placeholder="Seleziona il tipo"
                  selectedKeys={editForm.type ? [editForm.type] : []}
                  onChange={(e) => handleEditFormChange("type", e.target.value)}
                >
                  <SelectItem key="1">Magazzino Fisico</SelectItem>
                  <SelectItem key="2">Magazzino Mobile</SelectItem>
                  <SelectItem key="3">Deposito</SelectItem>
                </Select>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={onEditClose}>
              Annulla
            </Button>
            <Button
              color="primary"
              onPress={handleSaveChanges}
              isLoading={isEditLoading}
            >
              Salva Modifiche
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal di conferma eliminazione */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} size="md">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Conferma Eliminazione
          </ModalHeader>
          <ModalBody>
            <p>
              Sei sicuro di voler eliminare il magazzino{" "}
              <strong>{warehouse.name}</strong>?
            </p>
            <p className="mt-2 text-danger">
              Questa azione è irreversibile e comporterà la perdita di tutti i
              dati associati.
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
              Elimina
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Tabs di navigazione */}
      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(key as string)}
        className="mb-6"
      >
        <Tab key="overview" title="Panoramica" />
        <Tab key="inventory" title="Inventario" />
        <Tab key="operations" title="Operazioni" />
        <Tab key="history" title="Storico" />
      </Tabs>

      {/* Contenuto in base alla tab selezionata */}
      {selectedTab === "overview" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {/* Card Informazioni generali */}
          <Card className="col-span-1 xl:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="text-lg font-semibold">Informazioni Generali</h2>
            </CardHeader>
            <Divider />
            <CardBody>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-default-500">Nome</p>
                    <p className="text-foreground">{warehouse.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Posizione</p>
                    <p className="text-foreground">
                      {warehouse.location || "Non specificata"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Tipo</p>
                    <Chip color="primary" variant="flat">
                      {warehouse.type_name}
                    </Chip>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-default-500">
                      Data di creazione
                    </p>
                    <p className="text-foreground">
                      {formatDate(warehouse.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Creato da</p>
                    <p className="text-foreground">
                      ID: {warehouse.created_by}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-default-500">Azienda</p>
                    <p className="text-foreground">
                      {companyName || warehouse.company_id}
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Card Capacità */}
          <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <h2 className="text-lg font-semibold">Capacità</h2>
            </CardHeader>
            <Divider />
            <CardBody>
              <div className="flex flex-col items-center justify-center">
                <div className="relative flex h-48 w-48 items-center justify-center">
                  <ResponsiveContainer width="100%" height={192}>
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      barSize={12}
                      data={[{ name: "Utilizzato", value: capacityUsage, fill: `hsl(var(--heroui-${capacityColor}))` }]}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <PolarAngleAxis
                        type="number"
                        domain={[0, 100]}
                        angleAxisId={0}
                        tick={false}
                      />
                      <RadialBar
                        background
                        dataKey="value"
                        cornerRadius={12}
                      >
                        <Cell fill={`hsl(var(--heroui-${capacityColor}))`} />
                      </RadialBar>
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold">{capacityUsage}%</span>
                    <p className="mt-2 text-sm text-default-500">Utilizzato</p>
                  </div>
                </div>
                <div className="mt-8 text-center">
                  <p className="text-sm text-default-500">Capacità totale</p>
                  <p className="text-xl font-semibold">
                    {parseInt(warehouse.capacity).toLocaleString()} m³
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {selectedTab === "inventory" && (
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-default-200">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Icon
                  icon="solar:box-minimalistic-bold"
                  className="text-primary"
                  width={40}
                />
              </div>
            </div>
            <p className="mt-4 text-default-500">
              Inventario del magazzino non disponibile
            </p>
            <Button color="primary" className="mt-4" size="sm">
              Visualizza Inventario
            </Button>
          </div>
        </div>
      )}

      {selectedTab === "operations" && (
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-default-200">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Icon
                  icon="solar:settings-bold"
                  className="text-primary"
                  width={40}
                />
              </div>
            </div>
            <p className="mt-4 text-default-500">Nessuna operazione recente</p>
            <Button color="primary" className="mt-4" size="sm">
              Registra Operazione
            </Button>
          </div>
        </div>
      )}

      {selectedTab === "history" && (
        <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-default-200">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Icon
                  icon="solar:history-bold"
                  className="text-primary"
                  width={40}
                />
              </div>
            </div>
            <p className="mt-4 text-default-500">Storico non disponibile</p>
            <Button color="primary" className="mt-4" size="sm">
              Visualizza Storico
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseDetail;
