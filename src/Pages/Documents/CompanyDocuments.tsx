import {
  Avatar,
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
import { parseDate } from "@internationalized/date";
import axios from "axios";
import { useEffect, useState } from "react";
import PageHeader from "../../Components/Layout/PageHeader";
import type {
  CompanyDocument,
  DocumentFilters,
  DocumentUploadRequest,
} from "../../types/Documents";

interface Warehouse {
  WarehouseID: string;
  WarehouseName: string;
  WarehouseAddress: string;
  WarehouseCode?: string;
}

const documentTypeLabels: Record<string, string> = {
  business_license: "Licenza Commerciale",
  tax_registration: "Registrazione Fiscale",
  safety_certification: "Certificazione Sicurezza",
  fire_prevention: "Prevenzione Incendi",
  environmental_permit: "Permessi Ambientali",
  insurance_policy: "Polizza Aziendale",
  iso_certification: "Certificazione ISO",
  haccp: "Certificazione HACCP",
  professional_registration: "Iscrizione Albi Professionali",
  waste_disposal: "Autorizzazione Smaltimento Rifiuti",
  energy_certification: "Certificazione Energetica",
  building_permit: "Permessi Edilizi",
  machinery_certification: "Certificazioni Macchinari",
  software_license: "Licenze Software",
  other: "Altro",
};

const complianceAreaLabels: Record<string, string> = {
  safety: "Sicurezza",
  environment: "Ambiente",
  quality: "Qualità",
  legal: "Legale",
  financial: "Finanziario",
  technical: "Tecnico",
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

export default function CompanyDocuments() {
  // State management
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("all");

  // Filters
  const [filters, setFilters] = useState<DocumentFilters>({
    entity_type: "company",
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
  const {
    isOpen: isEditModalOpen,
    onOpen: onEditModalOpen,
    onClose: onEditModalClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteModalOpen,
    onOpen: onDeleteModalOpen,
    onClose: onDeleteModalClose,
  } = useDisclosure();
  const [selectedDocument, setSelectedDocument] =
    useState<CompanyDocument | null>(null);
  const [documentToDelete, setDocumentToDelete] =
    useState<CompanyDocument | null>(null);

  // Upload form
  const [uploadForm, setUploadForm] = useState<
    Partial<
      DocumentUploadRequest & {
        compliance_area?: string;
        authority?: string;
        license_number?: string;
        renewal_required?: boolean;
      }
    >
  >({
    entity_type: "company",
    reminder_days: [60, 30, 15, 7],
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Edit form
  const [editForm, setEditForm] = useState<{
    title?: string;
    document_type?: string;
    entity_id?: string;
    issue_date?: string;
    expiry_date?: string;
    authority?: string;
    license_number?: string;
    compliance_area?: string;
    notes?: string;
    reminder_days?: number[];
    file_path?: string;
  }>({});
  const [editFile, setEditFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [fileChanged, setFileChanged] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper function per formattare le date
  const formatDateForPicker = (dateString?: string) => {
    if (!dateString) return undefined;
    return new Date(dateString).toISOString().split("T")[0];
  };

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load warehouses
      const warehouseResponse = await axios.get(
        "/Warehouse/GET/GetAllWarehouses"
      );
      setWarehouses(warehouseResponse.data || []);

      // Load company documents
      const documentsResponse = await axios.get(
        "/Document/GET/GetAllCompanyDocuments"
      );
      setDocuments(documentsResponse.data || []);
    } catch (error) {
      console.error("Errore nel caricamento dati:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter documents
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
      if (selectedTab === "compliance" && !doc.compliance_area) return false;
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      if (
        !doc.title.toLowerCase().includes(searchTerm) &&
        !doc.authority?.toLowerCase().includes(searchTerm) &&
        !doc.license_number?.toLowerCase().includes(searchTerm) &&
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

    // Facility filter
    if (filters.entity_id && doc.facility_id !== filters.entity_id)
      return false;

    return true;
  });

  // Count documents by status and compliance area
  const documentStats = {
    total: documents.length,
    active: documents.filter((d) => d.status === "active").length,
    expiring: documents.filter((d) => d.status === "expiring_soon").length,
    expired: documents.filter((d) => d.status === "expired").length,
    by_compliance: {
      safety: documents.filter((d) => d.compliance_area === "safety").length,
      environment: documents.filter((d) => d.compliance_area === "environment")
        .length,
      quality: documents.filter((d) => d.compliance_area === "quality").length,
      legal: documents.filter((d) => d.compliance_area === "legal").length,
    },
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!uploadFile || !uploadForm.title || !uploadForm.document_type) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("data", JSON.stringify(uploadForm));

      console.log(uploadForm);

      const response = await axios.post(
        "/Document/POST/CreateCompanyDocument",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
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
      entity_type: "company",
      reminder_days: [60, 30, 15, 7],
    });
    setUploadFile(null);
  };

  // Handle edit document
  const handleEditDocument = (document: CompanyDocument) => {
    setSelectedDocument(document);

    setEditForm({
      title: document.title,
      document_type: document.document_type,
      entity_id: document.facility_id,
      issue_date: formatDateForPicker(document.issue_date),
      expiry_date: formatDateForPicker(document.expiry_date),
      authority: document.authority,
      license_number: document.license_number,
      compliance_area: document.compliance_area,
      notes: document.notes,
      reminder_days: document.reminder_days,
      file_path: document.file_path,
    });
    setEditFile(null);
    setFileChanged(false);
    onEditModalOpen();
  };

  const resetEditForm = () => {
    setEditForm({});
    setEditFile(null);
    setFileChanged(false);
    setSelectedDocument(null);
  };

  // Handle file operations in edit modal
  const handleEditFileUpload = (file: File | null) => {
    setEditFile(file);
    setFileChanged(true);
  };

  const handleFileDelete = () => {
    setEditForm((prev) => ({ ...prev, file_path: undefined }));
    setEditFile(null);
    setFileChanged(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedDocument || !editForm.title || !editForm.document_type) {
      return;
    }

    setIsEditing(true);

    try {
      const updateData = {
        document_id: selectedDocument.document_id,
        title: editForm.title,
        document_type: editForm.document_type,
        entity_id: editForm.entity_id,
        issue_date: editForm.issue_date,
        expiry_date: editForm.expiry_date,
        authority: editForm.authority,
        license_number: editForm.license_number,
        compliance_area: editForm.compliance_area,
        notes: editForm.notes,
        reminder_days: editForm.reminder_days,
        fileChanged: fileChanged,
      };

      // Se c'è un nuovo file o il file è stato eliminato, usa FormData
      if (editFile || (fileChanged && !editForm.file_path)) {
        const formData = new FormData();
        if (editFile) {
          formData.append("file", editFile);
        }
        formData.append("data", JSON.stringify(updateData));

        await axios.put(`/Document/UPDATE/UpdateCompanyDocument`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        // Altrimenti invia solo i dati JSON
        await axios.put(`/Document/UPDATE/UpdateCompanyDocument`, updateData);
      }

      await loadData();
      onEditModalClose();
      resetEditForm();
    } catch (error) {
      console.error("Errore nell'aggiornamento del documento:", error);
    } finally {
      setIsEditing(false);
    }
  };

  // Delete document
  const deleteDocument = async (documentId: string) => {
    setIsDeleting(true);
    try {
      await axios.delete(
        `/Document/DELETE/DeleteCompanyDocument/${documentId}`
      );
      await loadData();
    } catch (error) {
      console.error("Errore nell'eliminazione del documento:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteClick = (document: CompanyDocument) => {
    setDocumentToDelete(document);
    onDeleteModalOpen();
  };

  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;

    try {
      await deleteDocument(documentToDelete.document_id);
      onDeleteModalClose();
      setDocumentToDelete(null);
    } catch (error) {
      console.error("Errore nell'eliminazione del documento:", error);
    }
  };

  const handleCancelDelete = () => {
    onDeleteModalClose();
    setDocumentToDelete(null);
  };

  // Download document
  const downloadDocument = async (document: CompanyDocument) => {
    console.log(document);
    try {
      const response = await axios.get(
        `/Document/GET/DownloadCompanyDocument/${document.document_id}`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = document.title
        ? document.title +
          "." +
          document.file_path.split("/").pop()?.split(".")[1]
        : document.file_path;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
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
        title="Documenti Azienda"
        description="Gestione documenti di conformità, certificazioni e licenze aziendali"
        icon="solar:buildings-2-bold-duotone"
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

      {/* Compliance Areas Overview */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Aree di Conformità</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-default-50 rounded-lg">
              <Avatar
                icon={<Icon icon="solar:shield-check-bold" />}
                className="bg-danger/10 text-danger"
                size="sm"
              />
              <div>
                <p className="text-sm font-medium">Sicurezza</p>
                <p className="text-lg font-semibold">
                  {documentStats.by_compliance.safety}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-default-50 rounded-lg">
              <Avatar
                icon={<Icon icon="solar:leaf-bold" />}
                className="bg-success/10 text-success"
                size="sm"
              />
              <div>
                <p className="text-sm font-medium">Ambiente</p>
                <p className="text-lg font-semibold">
                  {documentStats.by_compliance.environment}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-default-50 rounded-lg">
              <Avatar
                icon={<Icon icon="solar:medal-star-bold" />}
                className="bg-warning/10 text-warning"
                size="sm"
              />
              <div>
                <p className="text-sm font-medium">Qualità</p>
                <p className="text-lg font-semibold">
                  {documentStats.by_compliance.quality}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-default-50 rounded-lg">
              <Avatar
                icon={<Icon icon="solar:court-hammer-bold" />}
                className="bg-secondary/10 text-secondary"
                size="sm"
              />
              <div>
                <p className="text-sm font-medium">Legale</p>
                <p className="text-lg font-semibold">
                  {documentStats.by_compliance.legal}
                </p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Filters */}
      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Cerca per titolo, autorità o numero..."
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
              className="w-64"
            >
              {Object.entries(documentTypeLabels).map(([key, label]) => (
                <SelectItem key={key}>{label}</SelectItem>
              ))}
            </Select>

            <Select
              placeholder="Sede/Magazzino"
              selectedKeys={filters.entity_id ? [filters.entity_id] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setFilters((prev) => ({
                  ...prev,
                  entity_id: selected || undefined,
                }));
              }}
              className="w-48"
            >
              <>
                <SelectItem key="general">Generale (Azienda)</SelectItem>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.WarehouseID}>
                    {warehouse.WarehouseName}
                  </SelectItem>
                ))}
              </>
            </Select>

            <Button
              variant="light"
              startContent={<Icon icon="solar:refresh-bold" width={16} />}
              onPress={() => setFilters({ entity_type: "company" })}
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
            <Tab key="compliance" title="Per Conformità" />
          </Tabs>
        </CardHeader>

        <CardBody>
          <Table aria-label="Tabella documenti azienda">
            <TableHeader>
              <TableColumn>DOCUMENTO</TableColumn>
              <TableColumn>TIPO</TableColumn>
              <TableColumn>SEDE/MAGAZZINO</TableColumn>
              <TableColumn>AUTORITÀ</TableColumn>
              <TableColumn>EMISSIONE</TableColumn>
              <TableColumn>SCADENZA</TableColumn>
              <TableColumn>CONFORMITÀ</TableColumn>
              <TableColumn>STATO</TableColumn>
              <TableColumn>AZIONI</TableColumn>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((document) => (
                <TableRow key={document.document_id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{document.title}</p>
                      {document.license_number && (
                        <p className="text-small text-default-500">
                          N. {document.license_number}
                        </p>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Chip size="sm" variant="flat">
                      {documentTypeLabels[document.document_type]}
                    </Chip>
                  </TableCell>

                  <TableCell>
                    {document.facility_name ? (
                      <div>
                        <p className="font-medium text-sm">
                          {document.facility_name}
                        </p>
                      </div>
                    ) : (
                      <Chip size="sm" variant="flat" color="secondary">
                        Generale
                      </Chip>
                    )}
                  </TableCell>

                  <TableCell>
                    {document.authority || (
                      <span className="text-default-400">-</span>
                    )}
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
                    {document.compliance_area ? (
                      <Chip
                        size="sm"
                        variant="flat"
                        color={
                          document.compliance_area === "safety"
                            ? "danger"
                            : document.compliance_area === "environment"
                            ? "success"
                            : document.compliance_area === "quality"
                            ? "warning"
                            : "secondary"
                        }
                      >
                        {complianceAreaLabels[document.compliance_area] ||
                          document.compliance_area}
                      </Chip>
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
                            onPress={() => handleEditDocument(document)}
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
                            onPress={() => handleDeleteClick(document)}
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
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-semibold">
              Carica Nuovo Documento Aziendale
            </h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Titolo Documento"
                placeholder="Es. Licenza Commerciale CosmicHub"
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
                  label="Area di Conformità"
                  placeholder="Seleziona area"
                  selectedKeys={
                    uploadForm.compliance_area
                      ? [uploadForm.compliance_area]
                      : []
                  }
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setUploadForm((prev) => ({
                      ...prev,
                      compliance_area: selected,
                    }));
                  }}
                >
                  {Object.entries(complianceAreaLabels).map(([key, label]) => (
                    <SelectItem key={key}>{label}</SelectItem>
                  ))}
                </Select>
              </div>

              <Select
                label="Sede/Magazzino (Opzionale)"
                placeholder="Generale (applicabile a tutta l'azienda)"
                selectedKeys={
                  uploadForm.entity_id ? [uploadForm.entity_id] : []
                }
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setUploadForm((prev) => ({ ...prev, entity_id: selected }));
                }}
              >
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.WarehouseID}>
                    {warehouse.WarehouseName}
                  </SelectItem>
                ))}
              </Select>

              <div className="grid grid-cols-2 gap-4">
                <DatePicker
                  label="Data Emissione"
                  value={
                    uploadForm.issue_date
                      ? (parseDate(uploadForm.issue_date) as any)
                      : undefined
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
                  label="Data Scadenza (Opzionale)"
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
                  label="Autorità/Ente Emittente"
                  placeholder="Es. Camera di Commercio"
                  value={uploadForm.authority || ""}
                  onChange={(e) =>
                    setUploadForm((prev) => ({
                      ...prev,
                      authority: e.target.value,
                    }))
                  }
                />

                <Input
                  label="Numero Licenza/Certificato"
                  placeholder="Es. LC2024001"
                  value={uploadForm.license_number || ""}
                  onChange={(e) =>
                    setUploadForm((prev) => ({
                      ...prev,
                      license_number: e.target.value,
                    }))
                  }
                />
              </div>

              <Textarea
                label="Note"
                placeholder="Note aggiuntive sul documento..."
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
                !uploadForm.title || !uploadForm.document_type || !uploadFile
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
                  {selectedDocument.compliance_area && (
                    <Chip
                      color={
                        selectedDocument.compliance_area === "safety"
                          ? "danger"
                          : selectedDocument.compliance_area === "environment"
                          ? "success"
                          : selectedDocument.compliance_area === "quality"
                          ? "warning"
                          : "secondary"
                      }
                      variant="flat"
                    >
                      {complianceAreaLabels[selectedDocument.compliance_area]}
                    </Chip>
                  )}
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
                      <p className="text-sm text-default-500">Sede/Magazzino</p>
                      <p className="font-medium">
                        {selectedDocument.facility_name || "Generale (Azienda)"}
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

                  {(selectedDocument.authority ||
                    selectedDocument.license_number) && (
                    <div className="grid grid-cols-2 gap-4">
                      {selectedDocument.authority && (
                        <div>
                          <p className="text-sm text-default-500">
                            Autorità Emittente
                          </p>
                          <p className="font-medium">
                            {selectedDocument.authority}
                          </p>
                        </div>
                      )}
                      {selectedDocument.license_number && (
                        <div>
                          <p className="text-sm text-default-500">
                            Numero Licenza
                          </p>
                          <p className="font-medium">
                            {selectedDocument.license_number}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedDocument.renewal_required && (
                    <div className="p-3 bg-warning-50 rounded-lg border border-warning-200">
                      <div className="flex items-center gap-2">
                        <Icon
                          icon="solar:clock-circle-bold"
                          className="text-warning"
                          width={20}
                        />
                        <p className="text-sm font-medium text-warning">
                          Rinnovo Richiesto
                        </p>
                      </div>
                      <p className="text-xs text-warning mt-1">
                        Questo documento richiede un rinnovo periodico
                      </p>
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

      {/* Edit Document Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={onEditModalClose}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-semibold">
              Modifica Documento Aziendale
            </h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Titolo Documento"
                placeholder="Es. Licenza Commerciale CosmicHub"
                value={editForm.title || ""}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, title: e.target.value }))
                }
                isRequired
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Tipo Documento"
                  placeholder="Seleziona tipo"
                  selectedKeys={
                    editForm.document_type ? [editForm.document_type] : []
                  }
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setEditForm((prev) => ({
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
                  label="Area di Conformità"
                  placeholder="Seleziona area"
                  selectedKeys={
                    editForm.compliance_area ? [editForm.compliance_area] : []
                  }
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setEditForm((prev) => ({
                      ...prev,
                      compliance_area: selected,
                    }));
                  }}
                >
                  {Object.entries(complianceAreaLabels).map(([key, label]) => (
                    <SelectItem key={key}>{label}</SelectItem>
                  ))}
                </Select>
              </div>

              <Select
                label="Sede/Magazzino (Opzionale)"
                placeholder="Generale (applicabile a tutta l'azienda)"
                selectedKeys={editForm.entity_id ? [editForm.entity_id] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setEditForm((prev) => ({ ...prev, entity_id: selected }));
                }}
              >
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.WarehouseID}>
                    {warehouse.WarehouseName}
                  </SelectItem>
                ))}
              </Select>

              <div className="grid grid-cols-2 gap-4">
                <DatePicker
                  label="Data Emissione"
                  value={
                    editForm.issue_date
                      ? (parseDate(editForm.issue_date) as any)
                      : undefined
                  }
                  onChange={(date: any) => {
                    if (date) {
                      const dateString = `${date.year}-${String(
                        date.month
                      ).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
                      setEditForm((prev) => ({
                        ...prev,
                        issue_date: dateString,
                      }));
                    }
                  }}
                  isRequired
                />

                <DatePicker
                  label="Data Scadenza (Opzionale)"
                  value={
                    editForm.expiry_date
                      ? (parseDate(editForm.expiry_date) as any)
                      : undefined
                  }
                  onChange={(date: any) => {
                    if (date) {
                      const dateString = `${date.year}-${String(
                        date.month
                      ).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
                      setEditForm((prev) => ({
                        ...prev,
                        expiry_date: dateString,
                      }));
                    }
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Autorità/Ente Emittente"
                  placeholder="Es. Camera di Commercio"
                  value={editForm.authority || ""}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      authority: e.target.value,
                    }))
                  }
                />

                <Input
                  label="Numero Licenza/Certificato"
                  placeholder="Es. LC2024001"
                  value={editForm.license_number || ""}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      license_number: e.target.value,
                    }))
                  }
                />
              </div>

              <Textarea
                label="Note"
                placeholder="Note aggiuntive sul documento..."
                value={editForm.notes || ""}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, notes: e.target.value }))
                }
              />

              <div>
                <label className="block text-sm font-medium mb-2">
                  File Documento
                </label>

                {/* Mostra file esistente se presente e non è stato eliminato */}
                {editForm.file_path && !fileChanged && (
                  <div className="mb-4 p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon
                          icon="solar:file-bold"
                          className="text-primary"
                          width={20}
                        />
                        <span className="text-sm font-medium">
                          {editForm.file_path.split("/").pop() || "Documento"}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        color="danger"
                        variant="light"
                        startContent={
                          <Icon icon="solar:trash-bin-trash-bold" width={16} />
                        }
                        onPress={handleFileDelete}
                      >
                        Elimina
                      </Button>
                    </div>
                  </div>
                )}

                {/* Mostra upload solo se non c'è file esistente o se è stato eliminato */}
                {(!editForm.file_path || fileChanged) && (
                  <div>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) =>
                        handleEditFileUpload(e.target.files?.[0] || null)
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                    {editFile && (
                      <p className="text-sm text-default-500 mt-1">
                        {editFile.name} (
                        {(editFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                )}
              </div>

              {isEditing && (
                <div>
                  <Progress value={0} color="primary" className="mb-2" />
                  <p className="text-sm text-center">
                    Aggiornamento in corso...
                  </p>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={onEditModalClose}
              isDisabled={isEditing}
            >
              Annulla
            </Button>
            <Button
              color="primary"
              onPress={handleEditSubmit}
              isLoading={isEditing}
              isDisabled={
                !editForm.title ||
                !editForm.document_type ||
                (!editFile &&
                  !editForm.authority &&
                  !editForm.license_number &&
                  !editForm.notes)
              }
            >
              Salva Modifiche
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={onDeleteModalClose}
        isDismissable={false}
        onOpenChange={onDeleteModalClose}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <Icon
                icon="solar:trash-bin-trash-bold"
                className="text-danger"
                width={30}
              />
              <h3 className="text-xl font-semibold">Conferma Eliminazione</h3>
            </div>
            <p className="text-small text-default-500">
              Sei sicuro di voler eliminare il documento "
              {documentToDelete?.title}"? Questa azione è irreversibile.
            </p>
          </ModalHeader>
          <ModalFooter>
            <Button
              variant="light"
              onPress={handleCancelDelete}
              isDisabled={isDeleting}
            >
              Annulla
            </Button>
            <Button
              color="danger"
              onPress={handleConfirmDelete}
              isLoading={isDeleting}
            >
              Elimina
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
