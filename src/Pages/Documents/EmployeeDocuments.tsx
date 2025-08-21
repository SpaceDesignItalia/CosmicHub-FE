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
  User,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { getLocalTimeZone, parseDate, today } from "@internationalized/date";
import axios from "axios";
import { useEffect, useState } from "react";
import PageHeader from "../../Components/Layout/PageHeader";
import type {
  DocumentFilters,
  DocumentUploadRequest,
  EmployeeDocument,
} from "../../types/Documents";

interface Employee {
  user_id: string;
  name: string;
  surname: string;
  email: string;
  role: string;
  department?: string;
}

const documentTypeLabels = {
  driving_license: "Patente di Guida",
  professional_license: "Abilitazione Professionale",
  safety_training: "Formazione Sicurezza",
  medical_certificate: "Certificato Medico",
  first_aid: "Primo Soccorso",
  crane_license: "Patentino Gru",
  forklift_license: "Patentino Muletto",
  scaffolding: "Abilitazione Ponteggi",
  confined_spaces: "Spazi Confinati",
  height_work: "Lavori in Quota",
  electrical_qualification: "Qualificazione Elettrica",
  welding_certification: "Certificazione Saldatura",
  gas_handling: "Manipolazione Gas",
  dangerous_goods: "Merci Pericolose",
  food_safety: "Sicurezza Alimentare",
  other: "Altro",
};

const licenseCategories = {
  // Patenti di guida
  driving_license: [
    "AM",
    "A1",
    "A2",
    "A",
    "B",
    "C1",
    "C",
    "D1",
    "D",
    "BE",
    "C1E",
    "CE",
    "D1E",
    "DE",
  ],
  // Livelli abilitazioni
  professional_license: [
    "Base",
    "Intermedio",
    "Avanzato",
    "Specialista",
    "Esperto",
  ],
  // Ore formazione
  safety_training: ["4h", "8h", "16h", "24h", "40h"],
  electrical_qualification: ["PES", "PAV", "PEI"],
  welding_certification: ["1G", "2G", "3G", "4G", "5G", "6G"],
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

export default function EmployeeDocuments() {
  // State management
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("all");

  // Filters
  const [filters, setFilters] = useState<DocumentFilters>({
    entity_type: "employee",
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
    useState<EmployeeDocument | null>(null);
  const [documentToDelete, setDocumentToDelete] =
    useState<EmployeeDocument | null>(null);

  // Upload form
  const [uploadForm, setUploadForm] = useState<
    Partial<
      DocumentUploadRequest & {
        license_category?: string;
        issuing_authority?: string;
        training_hours?: number;
        instructor?: string;
        renewal_required?: boolean;
      }
    >
  >({
    issue_date: today(getLocalTimeZone()).toString(),
    entity_type: "employee",
    reminder_days: [30, 15, 7, 1],
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Edit form
  const [editForm, setEditForm] = useState<{
    title?: string;
    document_type?: string;
    employee_id?: string;
    issue_date?: string;
    expiry_date?: string;
    license_category?: string;
    issuing_authority?: string;
    certificate_number?: string;
    training_hours?: number;
    instructor?: string;
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
      // Load employees
      const employeeResponse = await axios.get("/Employee/GET/GetAllEmployees");
      setEmployees(employeeResponse.data || []);

      // Load employee documents
      const documentsResponse = await axios.get(
        "/Document/GET/GetAllEmployeeDocuments"
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
      if (
        selectedTab === "training" &&
        ![
          "safety_training",
          "first_aid",
          "scaffolding",
          "confined_spaces",
          "height_work",
        ].includes(doc.document_type)
      )
        return false;
      if (
        selectedTab === "licenses" &&
        ![
          "driving_license",
          "professional_license",
          "crane_license",
          "forklift_license",
          "electrical_qualification",
          "welding_certification",
        ].includes(doc.document_type)
      )
        return false;
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      if (
        !doc.title.toLowerCase().includes(searchTerm) &&
        !doc.employee_name.toLowerCase().includes(searchTerm) &&
        !doc.employee_email?.toLowerCase().includes(searchTerm) &&
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

    // Employee filter
    if (filters.entity_id && doc.employee_id !== filters.entity_id)
      return false;

    return true;
  });

  // Count documents by status and type
  const documentStats = {
    total: documents.length,
    active: documents.filter((d) => d.status === "active").length,
    expiring: documents.filter((d) => d.status === "expiring_soon").length,
    expired: documents.filter((d) => d.status === "expired").length,
    by_type: {
      licenses: documents.filter((d) =>
        [
          "driving_license",
          "professional_license",
          "crane_license",
          "forklift_license",
          "electrical_qualification",
          "welding_certification",
        ].includes(d.document_type)
      ).length,
      training: documents.filter((d) =>
        [
          "safety_training",
          "first_aid",
          "scaffolding",
          "confined_spaces",
          "height_work",
        ].includes(d.document_type)
      ).length,
      medical: documents.filter((d) =>
        ["medical_certificate"].includes(d.document_type)
      ).length,
      other: documents.filter((d) =>
        ["gas_handling", "dangerous_goods", "food_safety", "other"].includes(
          d.document_type
        )
      ).length,
    },
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
        "/Document/POST/CreateEmployeeDocument",
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
      entity_type: "employee",
      reminder_days: [30, 15, 7, 1],
    });
    setUploadFile(null);
  };

  // Handle edit document
  const handleEditDocument = (document: EmployeeDocument) => {
    setSelectedDocument(document);

    setEditForm({
      title: document.title,
      document_type: document.document_type,
      employee_id: document.employee_id,
      issue_date: formatDateForPicker(document.issue_date),
      expiry_date: formatDateForPicker(document.expiry_date),
      license_category: document.license_category,
      issuing_authority: document.issuing_authority,
      certificate_number: document.certificate_number,
      training_hours: document.training_hours,
      instructor: document.instructor,
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

  console.log(editForm);

  const handleEditSubmit = async () => {
    if (
      !selectedDocument ||
      !editForm.title ||
      !editForm.document_type ||
      !editForm.employee_id
    ) {
      return;
    }

    setIsEditing(true);

    try {
      const updateData = {
        document_id: selectedDocument.document_id,
        title: editForm.title,
        document_type: editForm.document_type,
        entity_id: editForm.employee_id,
        issue_date: editForm.issue_date,
        expiry_date: editForm.expiry_date,
        license_category: editForm.license_category,
        issuing_authority: editForm.issuing_authority,
        certificate_number: editForm.certificate_number,
        training_hours: editForm.training_hours,
        instructor: editForm.instructor,
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

        await axios.put(`/Document/UPDATE/UpdateEmployeeDocument`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        // Altrimenti invia solo i dati JSON
        await axios.put(`/Document/UPDATE/UpdateEmployeeDocument`, updateData);
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
        `/Document/DELETE/DeleteEmployeeDocument/${documentId}`
      );
      await loadData();
    } catch (error) {
      console.error("Errore nell'eliminazione del documento:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteClick = (document: EmployeeDocument) => {
    setDocumentToDelete(document);
    onDeleteModalOpen();
  };

  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;

    try {
      await deleteDocument(documentToDelete.document_id);
      onDeleteModalOpen();
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
  const downloadDocument = async (document: EmployeeDocument) => {
    try {
      const response = await axios.get(
        `/Document/GET/DownloadEmployeeDocument/${document.document_id}`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = document.file_name || `${document.title}.pdf`;
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
        title="Documenti Dipendenti"
        description="Gestione patenti, abilitazioni, certificazioni e formazione del personale"
        icon="solar:user-id-bold-duotone"
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

      {/* Document Types Overview */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Tipologie Documenti</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-default-50 rounded-lg">
              <Avatar
                icon={<Icon icon="solar:card-2-bold" />}
                className="bg-primary/10 text-primary"
                size="sm"
              />
              <div>
                <p className="text-sm font-medium">Patenti & Abilitazioni</p>
                <p className="text-lg font-semibold">
                  {documentStats.by_type.licenses}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-default-50 rounded-lg">
              <Avatar
                icon={<Icon icon="solar:course-up-bold" />}
                className="bg-warning/10 text-warning"
                size="sm"
              />
              <div>
                <p className="text-sm font-medium">Formazione</p>
                <p className="text-lg font-semibold">
                  {documentStats.by_type.training}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-default-50 rounded-lg">
              <Avatar
                icon={<Icon icon="solar:health-bold" />}
                className="bg-success/10 text-success"
                size="sm"
              />
              <div>
                <p className="text-sm font-medium">Certificati Medici</p>
                <p className="text-lg font-semibold">
                  {documentStats.by_type.medical}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-default-50 rounded-lg">
              <Avatar
                icon={<Icon icon="solar:bookmark-bold" />}
                className="bg-secondary/10 text-secondary"
                size="sm"
              />
              <div>
                <p className="text-sm font-medium">Altri Documenti</p>
                <p className="text-lg font-semibold">
                  {documentStats.by_type.other}
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
              placeholder="Cerca per dipendente, documento o email..."
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
              placeholder="Dipendente"
              selectedKeys={
                filters.entity_id ? new Set([filters.entity_id]) : new Set()
              }
              renderValue={() => {
                const selectedEmployee = employees.find(
                  (e) => e.user_id === filters.entity_id
                );
                return selectedEmployee ? (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-small">
                        {selectedEmployee.name} {selectedEmployee.surname}
                      </span>
                    </div>
                  </div>
                ) : null;
              }}
              onSelectionChange={(keys) => {
                const employeeId = Array.from(keys)[0] as string;
                setFilters((prev) => ({
                  ...prev,
                  entity_id: employeeId,
                }));
              }}
              className="w-48"
            >
              {employees.map((employee) => (
                <SelectItem key={employee.user_id}>
                  {employee.name} {employee.surname}
                </SelectItem>
              ))}
            </Select>

            <Button
              variant="light"
              startContent={<Icon icon="solar:refresh-bold" width={16} />}
              onPress={() => setFilters({ entity_type: "employee" })}
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
            <Tab
              key="licenses"
              title={`Patenti (${documentStats.by_type.licenses})`}
            />
            <Tab
              key="training"
              title={`Formazione (${documentStats.by_type.training})`}
            />
          </Tabs>
        </CardHeader>

        <CardBody>
          <Table aria-label="Tabella documenti dipendenti">
            <TableHeader>
              <TableColumn>DIPENDENTE</TableColumn>
              <TableColumn>DOCUMENTO</TableColumn>
              <TableColumn>TIPO</TableColumn>
              <TableColumn>CATEGORIA</TableColumn>
              <TableColumn>EMISSIONE</TableColumn>
              <TableColumn>SCADENZA</TableColumn>
              <TableColumn>AUTORITÀ</TableColumn>
              <TableColumn>STATO</TableColumn>
              <TableColumn>AZIONI</TableColumn>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((document) => (
                <TableRow key={document.document_id}>
                  <TableCell>
                    <User
                      name={document.employee_name}
                      description={document.employee_email}
                      avatarProps={{
                        src: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          document.employee_name
                        )}&background=random`,
                        size: "sm",
                      }}
                    />
                  </TableCell>

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
                    <Chip size="sm" variant="flat">
                      {documentTypeLabels[document.document_type]}
                    </Chip>
                  </TableCell>

                  <TableCell>
                    {document.license_category && (
                      <Chip size="sm" variant="flat" color="secondary">
                        {document.license_category}
                      </Chip>
                    )}
                    {document.training_hours && (
                      <Chip size="sm" variant="flat" color="warning">
                        {document.training_hours}h
                      </Chip>
                    )}
                    {!document.license_category && !document.training_hours && (
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
                    <div className="text-sm">
                      {document.issuing_authority || (
                        <span className="text-default-400">-</span>
                      )}
                    </div>
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
              Carica Nuovo Documento Dipendente
            </h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Titolo Documento"
                placeholder="Es. Patente C Giuseppe Verdi"
                value={uploadForm.title || ""}
                onChange={(e) =>
                  setUploadForm((prev) => ({ ...prev, title: e.target.value }))
                }
                isRequired
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Dipendente"
                  placeholder="Seleziona dipendente"
                  selectedKeys={
                    uploadForm.entity_id
                      ? new Set([uploadForm.entity_id])
                      : new Set()
                  }
                  renderValue={() => {
                    const selectedEmployee = employees.find(
                      (e) => e.user_id === uploadForm.entity_id
                    );
                    return selectedEmployee ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-small">
                            {selectedEmployee.name} {selectedEmployee.surname} -{" "}
                            {selectedEmployee.role}
                          </span>
                        </div>
                      </div>
                    ) : null;
                  }}
                  onSelectionChange={(keys) => {
                    const employeeId = Array.from(keys)[0] as string;
                    setUploadForm((prev) => ({
                      ...prev,
                      entity_id: employeeId,
                    }));
                  }}
                  isRequired
                >
                  {employees.map((employee) => (
                    <SelectItem key={employee.user_id}>
                      {employee.name} {employee.surname} - {employee.role}
                    </SelectItem>
                  ))}
                </Select>

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
                  label="Autorità Emittente"
                  placeholder="Es. Motorizzazione Civile"
                  value={uploadForm.issuing_authority || ""}
                  onChange={(e) =>
                    setUploadForm((prev) => ({
                      ...prev,
                      issuing_authority: e.target.value,
                    }))
                  }
                />

                <Input
                  label="Numero Certificato"
                  placeholder="Es. RM1234567890"
                  value={uploadForm.certificate_number || ""}
                  onChange={(e) =>
                    setUploadForm((prev) => ({
                      ...prev,
                      certificate_number: e.target.value,
                    }))
                  }
                />
              </div>

              {uploadForm.document_type &&
                licenseCategories[
                  uploadForm.document_type as keyof typeof licenseCategories
                ] && (
                  <Select
                    label="Categoria/Livello"
                    placeholder="Seleziona categoria"
                    selectedKeys={
                      uploadForm.license_category
                        ? [uploadForm.license_category]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;
                      setUploadForm((prev) => ({
                        ...prev,
                        license_category: selected,
                      }));
                    }}
                  >
                    {licenseCategories[
                      uploadForm.document_type as keyof typeof licenseCategories
                    ].map((category) => (
                      <SelectItem key={category}>{category}</SelectItem>
                    ))}
                  </Select>
                )}

              {[
                "safety_training",
                "first_aid",
                "scaffolding",
                "confined_spaces",
                "height_work",
                "electrical_qualification",
                "welding_certification",
                "forklift_license",
                "crane_license",
              ].includes(uploadForm.document_type || "") && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Ore Formazione"
                    type="number"
                    placeholder="40"
                    value={uploadForm.training_hours?.toString() || ""}
                    onChange={(e) =>
                      setUploadForm((prev) => ({
                        ...prev,
                        training_hours: parseInt(e.target.value) || undefined,
                      }))
                    }
                  />

                  <Input
                    label="Istruttore/Centro"
                    placeholder="Nome istruttore o centro formazione"
                    value={uploadForm.instructor || ""}
                    onChange={(e) =>
                      setUploadForm((prev) => ({
                        ...prev,
                        instructor: e.target.value,
                      }))
                    }
                  />
                </div>
              )}

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
                    aria-label="Progresso caricamento"
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
                  <div className="p-4 bg-default-50 rounded-lg">
                    <User
                      name={selectedDocument.employee_name}
                      description={selectedDocument.employee_email}
                      avatarProps={{
                        src: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          selectedDocument.employee_name
                        )}&background=random`,
                        size: "lg",
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-default-500">Tipo Documento</p>
                      <p className="font-medium">
                        {documentTypeLabels[selectedDocument.document_type]}
                      </p>
                    </div>
                    {selectedDocument.license_category && (
                      <div>
                        <p className="text-sm text-default-500">Categoria</p>
                        <p className="font-medium">
                          {selectedDocument.license_category}
                        </p>
                      </div>
                    )}
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

                  {(selectedDocument.issuing_authority ||
                    selectedDocument.certificate_number) && (
                    <div className="grid grid-cols-2 gap-4">
                      {selectedDocument.issuing_authority && (
                        <div>
                          <p className="text-sm text-default-500">
                            Autorità Emittente
                          </p>
                          <p className="font-medium">
                            {selectedDocument.issuing_authority}
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

                  {(selectedDocument.training_hours ||
                    selectedDocument.instructor) && (
                    <div className="grid grid-cols-2 gap-4">
                      {selectedDocument.training_hours && (
                        <div>
                          <p className="text-sm text-default-500">
                            Ore Formazione
                          </p>
                          <p className="font-medium">
                            {selectedDocument.training_hours}h
                          </p>
                        </div>
                      )}
                      {selectedDocument.instructor && (
                        <div>
                          <p className="text-sm text-default-500">
                            Istruttore/Centro
                          </p>
                          <p className="font-medium">
                            {selectedDocument.instructor}
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
              Modifica Documento Dipendente
            </h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Titolo Documento"
                placeholder="Es. Patente C Giuseppe Verdi"
                value={editForm.title || ""}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, title: e.target.value }))
                }
                isRequired
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Dipendente"
                  placeholder="Seleziona dipendente"
                  selectedKeys={
                    editForm.employee_id
                      ? new Set([editForm.employee_id])
                      : new Set()
                  }
                  renderValue={() => {
                    const selectedEmployee = employees.find(
                      (e) => e.user_id === editForm.employee_id
                    );
                    return selectedEmployee ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-small">
                            {selectedEmployee.name} {selectedEmployee.surname} -{" "}
                            {selectedEmployee.role}
                          </span>
                        </div>
                      </div>
                    ) : null;
                  }}
                  onSelectionChange={(keys) => {
                    const employeeId = Array.from(keys)[0] as string;
                    setEditForm((prev) => ({
                      ...prev,
                      employee_id: employeeId,
                    }));
                  }}
                  isRequired
                >
                  {employees.map((employee) => (
                    <SelectItem key={employee.user_id}>
                      {employee.name} {employee.surname} - {employee.role}
                    </SelectItem>
                  ))}
                </Select>

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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <DatePicker
                  label="Data Emissione"
                  value={
                    editForm.issue_date
                      ? (parseDate(editForm.issue_date) as any)
                      : (today(getLocalTimeZone()) as any)
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
                  label="Data Scadenza"
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
                  label="Autorità Emittente"
                  placeholder="Es. Motorizzazione Civile"
                  value={editForm.issuing_authority || ""}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      issuing_authority: e.target.value,
                    }))
                  }
                />

                <Input
                  label="Numero Certificato"
                  placeholder="Es. RM1234567890"
                  value={editForm.certificate_number || ""}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      certificate_number: e.target.value,
                    }))
                  }
                />
              </div>

              {editForm.document_type &&
                licenseCategories[
                  editForm.document_type as keyof typeof licenseCategories
                ] && (
                  <Select
                    label="Categoria/Livello"
                    placeholder="Seleziona categoria"
                    selectedKeys={
                      editForm.license_category
                        ? [editForm.license_category]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0] as string;
                      setEditForm((prev) => ({
                        ...prev,
                        license_category: selected,
                      }));
                    }}
                  >
                    {licenseCategories[
                      editForm.document_type as keyof typeof licenseCategories
                    ].map((category) => (
                      <SelectItem key={category}>{category}</SelectItem>
                    ))}
                  </Select>
                )}

              {[
                "safety_training",
                "first_aid",
                "scaffolding",
                "confined_spaces",
                "height_work",
                "electrical_qualification",
                "welding_certification",
                "forklift_license",
                "crane_license",
              ].includes(editForm.document_type || "") && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Ore Formazione"
                    type="number"
                    placeholder="40"
                    value={editForm.training_hours?.toString() || ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        training_hours: parseInt(e.target.value) || undefined,
                      }))
                    }
                  />

                  <Input
                    label="Istruttore/Centro"
                    placeholder="Nome istruttore o centro formazione"
                    value={editForm.instructor || ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        instructor: e.target.value,
                      }))
                    }
                  />
                </div>
              )}

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
                  <Progress value={0} color="primary" className="mb-2" aria-label="Progresso modifica" />
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
                !editForm.employee_id ||
                (!editFile &&
                  !editForm.issuing_authority &&
                  !editForm.certificate_number &&
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
