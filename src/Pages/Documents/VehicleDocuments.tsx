import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  DatePicker,
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
  Progress,
  Select,
  SelectItem,
  Spinner,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tabs,
  Textarea,
  Tooltip,
  useDisclosure,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { getLocalTimeZone, parseDate, today } from "@internationalized/date";
import axios from "axios";
import { useEffect, useState } from "react";
import PageHeader from "../../Components/Layout/PageHeader";
import type {
  DocumentFilters,
  DocumentUploadRequest,
  VehicleDocument,
} from "../../types/Documents";

interface Vehicle {
  vehicle_id: string;
  name: string;
  license_plate: string;
  year: number;
}

const documentTypeLabels = {
  insurance: "Assicurazione",
  inspection: "Revisione",
  maintenance: "Tagliando/Manutenzione",
  registration: "Carta di Circolazione",
  license: "Patente Conducente",
  certification: "Certificazioni",
  fuel_card: "Carta Carburante",
  highway_pass: "Telepass/Viacard",
  lease_contract: "Contratto Leasing",
  other: "Altro",
};

const statusColors = {
  active: "success",
  expired: "danger",
  expiring_soon: "warning",
  draft: "default",
  cancelled: "default",
} as const;

const statusLabels = {
  active: "Attivo",
  expired: "Scaduto",
  expiring_soon: "In Scadenza",
  draft: "Bozza",
  cancelled: "Annullato",
};

export default function VehicleDocuments() {
  // State management
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("all");

  // Filters
  const [filters, setFilters] = useState<DocumentFilters>({
    entity_type: "vehicle",
  });

  // Modals
  const {
    isOpen: isUploadModalOpen,
    onOpen: onUploadModalOpen,
    onClose: onUploadModalClose,
  } = useDisclosure();
  const {
    isOpen: isViewModalOpen,
    onOpen: onViewModalOpen,
    onClose: onViewModalClose,
  } = useDisclosure();
  const [selectedDocument, setSelectedDocument] =
    useState<VehicleDocument | null>(null);

  // Upload form
  const [uploadForm, setUploadForm] = useState<Partial<DocumentUploadRequest>>({
    entity_type: "vehicle",
    reminder_days: [30, 15, 7, 1],
    issue_date: new Date().toISOString().split("T")[0],
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load vehicles
      const vehicleResponse = await axios.get("/Vehicle/GET/GetAllVehicles");
      setVehicles(vehicleResponse.data || []);

      // Load vehicle documents
      const documentsResponse = await axios.get(
        "/Document/GET/GetAllVehicleDocuments"
      );
      setDocuments(documentsResponse.data || []);
    } catch (error) {
      console.error("Errore nel caricamento dati:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter documents based on selected tab and filters
  const filteredDocuments = documents.filter((doc) => {
    // Tab filter
    if (selectedTab !== "all") {
      if (
        selectedTab === "expiring" &&
        doc.status !== "expiring_soon" &&
        doc.status !== "expired"
      )
        return false;
      if (selectedTab === "active" && doc.status !== "active") return false;
      if (selectedTab === "expired" && doc.status !== "expired") return false;
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      if (
        !doc.title.toLowerCase().includes(searchTerm) &&
        !doc.vehicle_license_plate.toLowerCase().includes(searchTerm) &&
        !doc.vehicle_name?.toLowerCase().includes(searchTerm) &&
        !documentTypeLabels[doc.document_type]
          .toLowerCase()
          .includes(searchTerm)
      ) {
        return false;
      }
    }

    // Document type filter
    if (filters.document_type && doc.document_type !== filters.document_type)
      return false;

    // Vehicle filter
    if (filters.entity_id && doc.vehicle_id !== filters.entity_id) return false;

    return true;
  });

  // Count documents by status
  const documentStats = {
    total: documents.length,
    active: documents.filter((d) => d.status === "active").length,
    expiring: documents.filter((d) => d.status === "expiring_soon").length,
    expired: documents.filter((d) => d.status === "expired").length,
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (
      !uploadFile ||
      !uploadForm.title ||
      !uploadForm.document_type ||
      !uploadForm.entity_id
    ) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("data", JSON.stringify(uploadForm));

      const response = await axios.post(
        "/Document/POST/CreateVehicleDocument",
        formData,
        {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(progress);
            }
          },
        }
      );

      if (response.status === 200) {
        await loadData();
        onUploadModalClose();
        resetUploadForm();
      }
    } catch (error) {
      console.error("Errore nell'upload del documento:", error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resetUploadForm = () => {
    setUploadForm({
      entity_type: "vehicle",
      reminder_days: [30, 15, 7, 1],
    });
    setUploadFile(null);
  };

  // Delete document
  const deleteDocument = async (documentId: string) => {
    try {
      await axios.delete(
        `/Documents/Vehicle/DELETE/DeleteDocument/${documentId}`
      );
      await loadData();
    } catch (error) {
      console.error("Errore nell'eliminazione del documento:", error);
    }
  };

  // Download document
  const downloadDocument = async (doc: VehicleDocument) => {
    try {
      const response = await axios.get(
        `/Document/GET/DownloadDocument/${doc.document_id}`,
        {
          responseType: "blob",
        }
      );

      console.log(doc.file_path);

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.title || doc.file_path;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Errore nel download del documento:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" color="primary" label="Caricamento documenti..." />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col p-4 gap-6 min-h-screen">
      <PageHeader
        title="Documenti Veicoli"
        description="Gestione completa dei documenti per furgoni e veicoli aziendali"
        icon="solar:car-bold-duotone"
        size="md"
        actions={[
          {
            label: "Carica Documento",
            icon: "solar:upload-bold",
            color: "primary",
            variant: "solid",
            onClick: onUploadModalOpen,
          },
        ]}
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon
                  icon="solar:documents-bold"
                  className="text-primary"
                  width={24}
                />
              </div>
              <div>
                <p className="text-small text-default-500">Totale Documenti</p>
                <p className="text-2xl font-semibold">{documentStats.total}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Icon
                  icon="solar:check-circle-bold"
                  className="text-success"
                  width={24}
                />
              </div>
              <div>
                <p className="text-small text-default-500">Attivi</p>
                <p className="text-2xl font-semibold text-success">
                  {documentStats.active}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Icon
                  icon="solar:clock-circle-bold"
                  className="text-warning"
                  width={24}
                />
              </div>
              <div>
                <p className="text-small text-default-500">In Scadenza</p>
                <p className="text-2xl font-semibold text-warning">
                  {documentStats.expiring}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-danger/10 rounded-lg">
                <Icon
                  icon="solar:close-circle-bold"
                  className="text-danger"
                  width={24}
                />
              </div>
              <div>
                <p className="text-small text-default-500">Scaduti</p>
                <p className="text-2xl font-semibold text-danger">
                  {documentStats.expired}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Cerca per titolo, veicolo o targa..."
              value={filters.search || ""}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              startContent={<Icon icon="solar:magnifer-bold" width={20} />}
              className="flex-1"
            />

            <Select
              placeholder="Tipo Documento"
              selectedKeys={
                filters.document_type ? [filters.document_type] : []
              }
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setFilters((prev) => ({
                  ...prev,
                  document_type: selected || undefined,
                }));
              }}
              className="w-48"
            >
              {Object.entries(documentTypeLabels).map(([key, label]) => (
                <SelectItem key={key}>{label}</SelectItem>
              ))}
            </Select>

            <Select
              placeholder="Veicolo"
              selectedKeys={
                filters.entity_id ? new Set([filters.entity_id]) : new Set()
              }
              renderValue={() => {
                const selectedVehicle = vehicles.find(
                  (v) => v.vehicle_id === filters.entity_id
                );
                return selectedVehicle ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-small">
                        {selectedVehicle.name} - {selectedVehicle.license_plate}
                      </span>
                    </div>
                  </div>
                ) : null;
              }}
              onSelectionChange={(keys) => {
                const vehicleId = Array.from(keys)[0] as string;
                setFilters((prev) => ({
                  ...prev,
                  entity_id: vehicleId,
                }));
              }}
              className="w-48"
            >
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.vehicle_id}>
                  {vehicle.name} - {vehicle.license_plate}
                </SelectItem>
              ))}
            </Select>

            <Button
              variant="light"
              startContent={<Icon icon="solar:refresh-bold" width={16} />}
              onPress={() => setFilters({ entity_type: "vehicle" })}
            >
              Reset
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Documents Table with Tabs */}
      <Card>
        <CardHeader className="flex justify-between">
          <Tabs
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key as string)}
            color="primary"
          >
            <Tab key="all" title={`Tutti (${documentStats.total})`} />
            <Tab key="active" title={`Attivi (${documentStats.active})`} />
            <Tab
              key="expiring"
              title={`In Scadenza (${documentStats.expiring})`}
            />
            <Tab key="expired" title={`Scaduti (${documentStats.expired})`} />
          </Tabs>
        </CardHeader>

        <CardBody>
          <Table aria-label="Tabella documenti veicoli">
            <TableHeader>
              <TableColumn>DOCUMENTO</TableColumn>
              <TableColumn>VEICOLO</TableColumn>
              <TableColumn>TIPO</TableColumn>
              <TableColumn>EMISSIONE</TableColumn>
              <TableColumn>SCADENZA</TableColumn>
              <TableColumn>FORNITORE</TableColumn>
              <TableColumn>COSTO</TableColumn>
              <TableColumn>STATO</TableColumn>
              <TableColumn>AZIONI</TableColumn>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((document) => (
                <TableRow key={document.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{document.title}</p>
                      {document.certificate_number && (
                        <p className="text-small text-default-500">
                          N. {document.certificate_number}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div>
                      <p className="font-medium">{document.vehicle_name}</p>
                      <p className="text-small text-default-500">
                        {document.vehicle_license_plate}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Chip size="sm" variant="flat">
                      {documentTypeLabels[document.document_type]}
                    </Chip>
                  </TableCell>

                  <TableCell>
                    {new Date(document.issue_date).toLocaleDateString("it-IT")}
                  </TableCell>

                  <TableCell>
                    {document.expiry_date ? (
                      <div>
                        <p>
                          {new Date(document.expiry_date).toLocaleDateString(
                            "it-IT"
                          )}
                        </p>
                        {document.status === "expiring_soon" && (
                          <p className="text-small text-warning">
                            {Math.ceil(
                              (new Date(document.expiry_date).getTime() -
                                new Date().getTime()) /
                                (1000 * 60 * 60 * 24)
                            )}{" "}
                            giorni
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-default-400">Non specificata</span>
                    )}
                  </TableCell>

                  <TableCell>
                    {document.provider || (
                      <span className="text-default-400">-</span>
                    )}
                  </TableCell>

                  <TableCell>
                    {document.cost ? (
                      `€${document.cost}`
                    ) : (
                      <span className="text-default-400">-</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <Chip
                      color={statusColors[document.status]}
                      variant="flat"
                      size="sm"
                    >
                      {statusLabels[document.status]}
                    </Chip>
                  </TableCell>

                  <TableCell>
                    <div className="flex gap-2">
                      <Tooltip content="Visualizza">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => {
                            setSelectedDocument(document);
                            onViewModalOpen();
                          }}
                        >
                          <Icon icon="solar:eye-bold" width={16} />
                        </Button>
                      </Tooltip>

                      <Dropdown>
                        <DropdownTrigger>
                          <Button isIconOnly size="sm" variant="light">
                            <Icon icon="solar:menu-dots-bold" width={16} />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu>
                          <DropdownItem
                            key="download"
                            startContent={
                              <Icon icon="solar:download-bold" width={16} />
                            }
                            onPress={() => downloadDocument(document)}
                          >
                            Scarica
                          </DropdownItem>
                          <DropdownItem
                            key="edit"
                            startContent={
                              <Icon icon="solar:pen-bold" width={16} />
                            }
                          >
                            Modifica
                          </DropdownItem>
                          <DropdownItem
                            key="delete"
                            className="text-danger"
                            color="danger"
                            startContent={
                              <Icon
                                icon="solar:trash-bin-trash-bold"
                                width={16}
                              />
                            }
                            onPress={() => deleteDocument(document.id)}
                          >
                            Elimina
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Upload Document Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={onUploadModalClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-semibold">Carica Nuovo Documento</h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Titolo Documento"
                placeholder="Es. Assicurazione Furgone Milano"
                value={uploadForm.title || ""}
                onChange={(e) =>
                  setUploadForm((prev) => ({ ...prev, title: e.target.value }))
                }
                isRequired
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Tipo Documento"
                  placeholder="Seleziona tipo"
                  selectedKeys={
                    uploadForm.document_type ? [uploadForm.document_type] : []
                  }
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setUploadForm((prev) => ({
                      ...prev,
                      document_type: selected,
                    }));
                  }}
                  isRequired
                >
                  {Object.entries(documentTypeLabels).map(([key, label]) => (
                    <SelectItem key={key}>{label}</SelectItem>
                  ))}
                </Select>

                <Select
                  label="Veicolo"
                  placeholder="Seleziona veicolo"
                  selectedKeys={
                    uploadForm.entity_id
                      ? new Set([uploadForm.entity_id])
                      : new Set()
                  }
                  renderValue={() => {
                    const selectedVehicle = vehicles.find(
                      (v) => v.vehicle_id === uploadForm.entity_id
                    );
                    return selectedVehicle ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-small">
                            {selectedVehicle.name} -{" "}
                            {selectedVehicle.license_plate}
                          </span>
                        </div>
                      </div>
                    ) : null;
                  }}
                  onSelectionChange={(keys) => {
                    const vehicleId = Array.from(keys)[0] as string;
                    setUploadForm((prev) => ({
                      ...prev,
                      entity_id: vehicleId,
                    }));
                  }}
                  isRequired
                >
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.vehicle_id}>
                      {vehicle.name} - {vehicle.license_plate}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <DatePicker
                  label="Data Emissione"
                  value={
                    uploadForm.issue_date
                      ? (parseDate(uploadForm.issue_date) as any)
                      : (today(getLocalTimeZone()) as any)
                  }
                  onChange={(date: any) => {
                    if (date) {
                      const dateString = `${date.year}-${String(
                        date.month
                      ).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
                      setUploadForm((prev) => ({
                        ...prev,
                        issue_date: dateString,
                      }));
                    }
                  }}
                  isRequired
                />

                <DatePicker
                  label="Data Scadenza"
                  value={
                    uploadForm.expiry_date
                      ? (parseDate(uploadForm.expiry_date) as any)
                      : undefined
                  }
                  onChange={(date: any) => {
                    if (date) {
                      const dateString = `${date.year}-${String(
                        date.month
                      ).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
                      setUploadForm((prev) => ({
                        ...prev,
                        expiry_date: dateString,
                      }));
                    }
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Fornitore/Ente"
                  placeholder="Es. Generali Assicurazioni"
                  value={uploadForm.provider || ""}
                  onChange={(e) =>
                    setUploadForm((prev) => ({
                      ...prev,
                      provider: e.target.value,
                    }))
                  }
                />

                <Input
                  label="Numero Certificato"
                  placeholder="Es. POL123456789"
                  value={uploadForm.certificate_number || ""}
                  onChange={(e) =>
                    setUploadForm((prev) => ({
                      ...prev,
                      certificate_number: e.target.value,
                    }))
                  }
                />
              </div>

              <Input
                label="Costo (€)"
                type="number"
                placeholder="0.00"
                value={uploadForm.cost?.toString() || ""}
                onChange={(e) =>
                  setUploadForm((prev) => ({
                    ...prev,
                    cost: parseFloat(e.target.value) || undefined,
                  }))
                }
              />

              <Textarea
                label="Note"
                placeholder="Note aggiuntive..."
                value={uploadForm.notes || ""}
                onChange={(e) =>
                  setUploadForm((prev) => ({ ...prev, notes: e.target.value }))
                }
              />

              <div>
                <label className="block text-sm font-medium mb-2">
                  File Documento
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
                {uploadFile && (
                  <p className="text-sm text-default-500 mt-1">
                    {uploadFile.name} (
                    {(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {isUploading && (
                <div>
                  <Progress
                    value={uploadProgress}
                    color="primary"
                    className="mb-2"
                  />
                  <p className="text-sm text-center">
                    Caricamento in corso... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={onUploadModalClose}
              isDisabled={isUploading}
            >
              Annulla
            </Button>
            <Button
              color="primary"
              onPress={handleFileUpload}
              isLoading={isUploading}
              isDisabled={
                !uploadForm.title ||
                !uploadForm.document_type ||
                !uploadForm.entity_id ||
                !uploadFile
              }
            >
              Carica Documento
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* View Document Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={onViewModalClose}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {selectedDocument && (
            <>
              <ModalHeader>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold">
                    {selectedDocument.title}
                  </h3>
                  <Chip
                    color={statusColors[selectedDocument.status]}
                    variant="flat"
                  >
                    {statusLabels[selectedDocument.status]}
                  </Chip>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-default-500">Tipo Documento</p>
                      <p className="font-medium">
                        {documentTypeLabels[selectedDocument.document_type]}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-default-500">Veicolo</p>
                      <p className="font-medium">
                        {selectedDocument.vehicle_name} (
                        {selectedDocument.vehicle_license_plate})
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-default-500">Data Emissione</p>
                      <p className="font-medium">
                        {new Date(
                          selectedDocument.issue_date
                        ).toLocaleDateString("it-IT")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-default-500">Data Scadenza</p>
                      <p className="font-medium">
                        {selectedDocument.expiry_date
                          ? new Date(
                              selectedDocument.expiry_date
                            ).toLocaleDateString("it-IT")
                          : "Non specificata"}
                      </p>
                    </div>
                  </div>

                  {(selectedDocument.provider ||
                    selectedDocument.certificate_number) && (
                    <div className="grid grid-cols-2 gap-4">
                      {selectedDocument.provider && (
                        <div>
                          <p className="text-sm text-default-500">
                            Fornitore/Ente
                          </p>
                          <p className="font-medium">
                            {selectedDocument.provider}
                          </p>
                        </div>
                      )}
                      {selectedDocument.certificate_number && (
                        <div>
                          <p className="text-sm text-default-500">
                            Numero Certificato
                          </p>
                          <p className="font-medium">
                            {selectedDocument.certificate_number}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedDocument.cost && (
                    <div>
                      <p className="text-sm text-default-500">Costo</p>
                      <p className="font-medium">€{selectedDocument.cost}</p>
                    </div>
                  )}

                  {selectedDocument.notes && (
                    <div>
                      <p className="text-sm text-default-500">Note</p>
                      <p className="font-medium">{selectedDocument.notes}</p>
                    </div>
                  )}

                  {selectedDocument.reminder_days &&
                    selectedDocument.reminder_days.length > 0 && (
                      <div>
                        <p className="text-sm text-default-500">
                          Reminder Attivi
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {selectedDocument.reminder_days.map((days) => (
                            <Chip key={days} size="sm" variant="flat">
                              {days} giorni prima
                            </Chip>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onViewModalClose}>
                  Chiudi
                </Button>
                <Button
                  color="primary"
                  startContent={<Icon icon="solar:download-bold" width={16} />}
                  onPress={() => downloadDocument(selectedDocument)}
                >
                  Scarica
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
