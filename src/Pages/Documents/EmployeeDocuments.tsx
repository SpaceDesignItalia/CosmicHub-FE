import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
  Badge,
  Tooltip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DatePicker,
  Textarea,
  Spinner,
  Progress,
  Divider,
  Tabs,
  Tab,
  Avatar,
  User,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { parseDate } from "@internationalized/date";
import PageHeader from "../../Components/Layout/PageHeader";
import { EmployeeDocument, DocumentFilters, DocumentUploadRequest } from "../../types/Documents";

interface Employee {
  employee_id: string;
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
  driving_license: ["AM", "A1", "A2", "A", "B", "C1", "C", "D1", "D", "BE", "C1E", "CE", "D1E", "DE"],
  // Livelli abilitazioni
  professional_license: ["Base", "Intermedio", "Avanzato", "Specialista", "Esperto"],
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
  const { isOpen: isUploadModalOpen, onOpen: onUploadModalOpen, onClose: onUploadModalClose } = useDisclosure();
  const { isOpen: isViewModalOpen, onOpen: onViewModalOpen, onClose: onViewModalClose } = useDisclosure();
  const [selectedDocument, setSelectedDocument] = useState<EmployeeDocument | null>(null);

  // Upload form
  const [uploadForm, setUploadForm] = useState<Partial<DocumentUploadRequest & { 
    license_category?: string;
    issuing_authority?: string;
    training_hours?: number;
    instructor?: string;
    renewal_required?: boolean;
  }>>({
    entity_type: "employee",
    reminder_days: [30, 15, 7, 1],
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
      // Load employees
      const employeeResponse = await axios.get("/Employee/GET/GetAllEmployees");
      setEmployees(employeeResponse.data || []);

      // Load employee documents
      const documentsResponse = await axios.get("/Documents/Employee/GET/GetAllEmployeeDocuments");
      setDocuments(documentsResponse.data || []);
    } catch (error) {
      console.error("Errore nel caricamento dati:", error);
      // Load mock data for development
      loadMockData();
    } finally {
      setIsLoading(false);
    }
  };

  const loadMockData = () => {
    const mockEmployees: Employee[] = [
      { employee_id: "1", name: "Mario", surname: "Rossi", email: "mario.rossi@cosmichub.it", role: "Tecnico", department: "Installazioni" },
      { employee_id: "2", name: "Giuseppe", surname: "Verdi", email: "giuseppe.verdi@cosmichub.it", role: "Autista", department: "Logistica" },
      { employee_id: "3", name: "Anna", surname: "Bianchi", email: "anna.bianchi@cosmichub.it", role: "Responsabile Sicurezza", department: "Sicurezza" },
      { employee_id: "4", name: "Luigi", surname: "Neri", email: "luigi.neri@cosmichub.it", role: "Magazziniere", department: "Magazzino" },
    ];

    const mockDocuments: EmployeeDocument[] = [
      {
        id: "1",
        title: "Patente C Giuseppe Verdi",
        document_type: "driving_license",
        employee_id: "2",
        employee_name: "Giuseppe Verdi",
        employee_email: "giuseppe.verdi@cosmichub.it",
        issue_date: "2020-03-15",
        expiry_date: "2030-03-15",
        status: "active",
        license_category: "C",
        issuing_authority: "Motorizzazione Civile Roma",
        certificate_number: "RM1234567890",
        renewal_required: true,
        created_at: "2020-03-15T10:00:00Z",
        updated_at: "2020-03-15T10:00:00Z",
        created_by: "hr_manager",
        reminder_days: [60, 30, 15, 7],
      },
      {
        id: "2",
        title: "Corso Sicurezza Anna Bianchi",
        document_type: "safety_training",
        employee_id: "3",
        employee_name: "Anna Bianchi",
        employee_email: "anna.bianchi@cosmichub.it",
        issue_date: "2024-01-15",
        expiry_date: "2025-01-15",
        status: "expiring_soon",
        training_hours: 40,
        instructor: "Ing. Paolo Rossi",
        issuing_authority: "INAIL",
        certificate_number: "SF2024001",
        renewal_required: true,
        created_at: "2024-01-15T14:30:00Z",
        updated_at: "2024-01-15T14:30:00Z",
        created_by: "safety_manager",
        reminder_days: [30, 15, 7, 1],
      },
      {
        id: "3",
        title: "Patentino Muletto Luigi Neri",
        document_type: "forklift_license",
        employee_id: "4",
        employee_name: "Luigi Neri",
        employee_email: "luigi.neri@cosmichub.it",
        issue_date: "2023-06-01",
        expiry_date: "2026-06-01",
        status: "active",
        training_hours: 12,
        instructor: "Centro Formazione Milano",
        issuing_authority: "Regione Lombardia",
        certificate_number: "ML2023001",
        renewal_required: true,
        created_at: "2023-06-01T09:00:00Z",
        updated_at: "2023-06-01T09:00:00Z",
        created_by: "warehouse_manager",
        reminder_days: [90, 60, 30, 15],
      },
      {
        id: "4",
        title: "Certificato Medico Mario Rossi",
        document_type: "medical_certificate",
        employee_id: "1",
        employee_name: "Mario Rossi",
        employee_email: "mario.rossi@cosmichub.it",
        issue_date: "2024-06-01",
        expiry_date: "2024-12-01",
        status: "expired",
        issuing_authority: "Dr. Medico Milano",
        certificate_number: "MED2024001",
        renewal_required: true,
        created_at: "2024-06-01T11:00:00Z",
        updated_at: "2024-06-01T11:00:00Z",
        created_by: "hr_manager",
        reminder_days: [30, 15, 7, 1],
      },
      {
        id: "5",
        title: "Abilitazione Ponteggi Mario Rossi",
        document_type: "scaffolding",
        employee_id: "1",
        employee_name: "Mario Rossi",
        employee_email: "mario.rossi@cosmichub.it",
        issue_date: "2024-02-01",
        expiry_date: "2027-02-01",
        status: "active",
        training_hours: 28,
        instructor: "Scuola Edile Milano",
        issuing_authority: "Regione Lombardia",
        certificate_number: "PON2024001",
        renewal_required: true,
        created_at: "2024-02-01T15:00:00Z",
        updated_at: "2024-02-01T15:00:00Z",
        created_by: "safety_manager",
        reminder_days: [90, 60, 30, 15],
      },
    ];

    setEmployees(mockEmployees);
    setDocuments(mockDocuments);
  };

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    // Tab filter
    if (selectedTab !== "all") {
      if (selectedTab === "expiring" && doc.status !== "expiring_soon" && doc.status !== "expired") return false;
      if (selectedTab === "active" && doc.status !== "active") return false;
      if (selectedTab === "expired" && doc.status !== "expired") return false;
      if (selectedTab === "training" && !["safety_training", "first_aid", "scaffolding", "confined_spaces", "height_work"].includes(doc.document_type)) return false;
      if (selectedTab === "licenses" && !["driving_license", "professional_license", "crane_license", "forklift_license", "electrical_qualification", "welding_certification"].includes(doc.document_type)) return false;
    }

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      if (
        !doc.title.toLowerCase().includes(searchTerm) &&
        !doc.employee_name.toLowerCase().includes(searchTerm) &&
        !doc.employee_email?.toLowerCase().includes(searchTerm) &&
        !documentTypeLabels[doc.document_type].toLowerCase().includes(searchTerm)
      ) {
        return false;
      }
    }

    // Document type filter
    if (filters.document_type && doc.document_type !== filters.document_type) return false;

    // Employee filter
    if (filters.entity_id && doc.employee_id !== filters.entity_id) return false;

    return true;
  });

  // Count documents by status and type
  const documentStats = {
    total: documents.length,
    active: documents.filter(d => d.status === "active").length,
    expiring: documents.filter(d => d.status === "expiring_soon").length,
    expired: documents.filter(d => d.status === "expired").length,
    by_type: {
      licenses: documents.filter(d => ["driving_license", "professional_license", "crane_license", "forklift_license", "electrical_qualification", "welding_certification"].includes(d.document_type)).length,
      training: documents.filter(d => ["safety_training", "first_aid", "scaffolding", "confined_spaces", "height_work"].includes(d.document_type)).length,
      medical: documents.filter(d => ["medical_certificate"].includes(d.document_type)).length,
      other: documents.filter(d => ["gas_handling", "dangerous_goods", "food_safety", "other"].includes(d.document_type)).length,
    },
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!uploadFile || !uploadForm.title || !uploadForm.document_type || !uploadForm.entity_id) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("data", JSON.stringify(uploadForm));

      const response = await axios.post("/Documents/Employee/POST/UploadDocument", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });

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

  // Delete document
  const deleteDocument = async (documentId: string) => {
    try {
      await axios.delete(`/Documents/Employee/DELETE/DeleteDocument/${documentId}`);
      await loadData();
    } catch (error) {
      console.error("Errore nell'eliminazione del documento:", error);
    }
  };

  // Download document
  const downloadDocument = async (document: EmployeeDocument) => {
    try {
      const response = await axios.get(`/Documents/Employee/GET/DownloadDocument/${document.id}`, {
        responseType: "blob",
      });

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
                <Icon icon="solar:documents-bold" className="text-primary" width={24} />
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
                <Icon icon="solar:check-circle-bold" className="text-success" width={24} />
              </div>
              <div>
                <p className="text-small text-default-500">Attivi</p>
                <p className="text-2xl font-semibold text-success">{documentStats.active}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Icon icon="solar:clock-circle-bold" className="text-warning" width={24} />
              </div>
              <div>
                <p className="text-small text-default-500">In Scadenza</p>
                <p className="text-2xl font-semibold text-warning">{documentStats.expiring}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-danger/10 rounded-lg">
                <Icon icon="solar:close-circle-bold" className="text-danger" width={24} />
              </div>
              <div>
                <p className="text-small text-default-500">Scaduti</p>
                <p className="text-2xl font-semibold text-danger">{documentStats.expired}</p>
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
                <p className="text-lg font-semibold">{documentStats.by_type.licenses}</p>
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
                <p className="text-lg font-semibold">{documentStats.by_type.training}</p>
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
                <p className="text-lg font-semibold">{documentStats.by_type.medical}</p>
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
                <p className="text-lg font-semibold">{documentStats.by_type.other}</p>
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
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              startContent={<Icon icon="solar:magnifer-bold" width={20} />}
              className="flex-1"
            />
            
            <Select
              placeholder="Tipo Documento"
              selectedKeys={filters.document_type ? [filters.document_type] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setFilters(prev => ({ ...prev, document_type: selected || undefined }));
              }}
              className="w-64"
            >
              {Object.entries(documentTypeLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </Select>

            <Select
              placeholder="Dipendente"
              selectedKeys={filters.entity_id ? [filters.entity_id] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setFilters(prev => ({ ...prev, entity_id: selected || undefined }));
              }}
              className="w-48"
            >
              {employees.map((employee) => (
                <SelectItem key={employee.employee_id} value={employee.employee_id}>
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
            <Tab key="expiring" title={`In Scadenza (${documentStats.expiring})`} />
            <Tab key="expired" title={`Scaduti (${documentStats.expired})`} />
            <Tab key="licenses" title={`Patenti (${documentStats.by_type.licenses})`} />
            <Tab key="training" title={`Formazione (${documentStats.by_type.training})`} />
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
                <TableRow key={document.id}>
                  <TableCell>
                    <User
                      name={document.employee_name}
                      description={document.employee_email}
                      avatarProps={{
                        src: `https://ui-avatars.com/api/?name=${encodeURIComponent(document.employee_name)}&background=random`,
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
                        <p>{new Date(document.expiry_date).toLocaleDateString("it-IT")}</p>
                        {document.status === "expiring_soon" && (
                          <p className="text-small text-warning">
                            {Math.ceil((new Date(document.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} giorni
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-default-400">Non specificata</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      {document.issuing_authority || <span className="text-default-400">-</span>}
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
                            startContent={<Icon icon="solar:download-bold" width={16} />}
                            onPress={() => downloadDocument(document)}
                          >
                            Scarica
                          </DropdownItem>
                          <DropdownItem
                            key="edit"
                            startContent={<Icon icon="solar:pen-bold" width={16} />}
                          >
                            Modifica
                          </DropdownItem>
                          <DropdownItem
                            key="renewal"
                            startContent={<Icon icon="solar:refresh-circle-bold" width={16} />}
                          >
                            Rinnova
                          </DropdownItem>
                          <DropdownItem
                            key="delete"
                            className="text-danger"
                            color="danger"
                            startContent={<Icon icon="solar:trash-bin-trash-bold" width={16} />}
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
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-semibold">Carica Nuovo Documento Dipendente</h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Titolo Documento"
                placeholder="Es. Patente C Giuseppe Verdi"
                value={uploadForm.title || ""}
                onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                isRequired
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Dipendente"
                  placeholder="Seleziona dipendente"
                  selectedKeys={uploadForm.entity_id ? [uploadForm.entity_id] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setUploadForm(prev => ({ ...prev, entity_id: selected }));
                  }}
                  isRequired
                >
                  {employees.map((employee) => (
                    <SelectItem key={employee.employee_id} value={employee.employee_id}>
                      {employee.name} {employee.surname} - {employee.role}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label="Tipo Documento"
                  placeholder="Seleziona tipo"
                  selectedKeys={uploadForm.document_type ? [uploadForm.document_type] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setUploadForm(prev => ({ ...prev, document_type: selected }));
                  }}
                  isRequired
                >
                  {Object.entries(documentTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <DatePicker
                  label="Data Emissione"
                  value={uploadForm.issue_date ? parseDate(uploadForm.issue_date) : null}
                  onChange={(date) => {
                    if (date) {
                      const dateString = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
                      setUploadForm(prev => ({ ...prev, issue_date: dateString }));
                    }
                  }}
                  isRequired
                />

                <DatePicker
                  label="Data Scadenza"
                  value={uploadForm.expiry_date ? parseDate(uploadForm.expiry_date) : null}
                  onChange={(date) => {
                    if (date) {
                      const dateString = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
                      setUploadForm(prev => ({ ...prev, expiry_date: dateString }));
                    }
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Autorità Emittente"
                  placeholder="Es. Motorizzazione Civile"
                  value={uploadForm.issuing_authority || ""}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, issuing_authority: e.target.value }))}
                />

                <Input
                  label="Numero Certificato"
                  placeholder="Es. RM1234567890"
                  value={uploadForm.certificate_number || ""}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, certificate_number: e.target.value }))}
                />
              </div>

              {uploadForm.document_type && licenseCategories[uploadForm.document_type as keyof typeof licenseCategories] && (
                <Select
                  label="Categoria/Livello"
                  placeholder="Seleziona categoria"
                  selectedKeys={uploadForm.license_category ? [uploadForm.license_category] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setUploadForm(prev => ({ ...prev, license_category: selected }));
                  }}
                >
                  {licenseCategories[uploadForm.document_type as keyof typeof licenseCategories].map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </Select>
              )}

              {["safety_training", "first_aid", "scaffolding", "confined_spaces", "height_work", "electrical_qualification", "welding_certification", "forklift_license", "crane_license"].includes(uploadForm.document_type || "") && (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Ore Formazione"
                    type="number"
                    placeholder="40"
                    value={uploadForm.training_hours?.toString() || ""}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, training_hours: parseInt(e.target.value) || undefined }))}
                  />

                  <Input
                    label="Istruttore/Centro"
                    placeholder="Nome istruttore o centro formazione"
                    value={uploadForm.instructor || ""}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, instructor: e.target.value }))}
                  />
                </div>
              )}

              <Textarea
                label="Note"
                placeholder="Note aggiuntive sul documento..."
                value={uploadForm.notes || ""}
                onChange={(e) => setUploadForm(prev => ({ ...prev, notes: e.target.value }))}
              />

              <div>
                <label className="block text-sm font-medium mb-2">File Documento</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
                {uploadFile && (
                  <p className="text-sm text-default-500 mt-1">
                    {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              {isUploading && (
                <div>
                  <Progress value={uploadProgress} color="primary" className="mb-2" />
                  <p className="text-sm text-center">Caricamento in corso... {uploadProgress}%</p>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onUploadModalClose} isDisabled={isUploading}>
              Annulla
            </Button>
            <Button
              color="primary"
              onPress={handleFileUpload}
              isLoading={isUploading}
              isDisabled={!uploadForm.title || !uploadForm.document_type || !uploadForm.entity_id || !uploadFile}
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
                  <h3 className="text-xl font-semibold">{selectedDocument.title}</h3>
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
                        src: `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedDocument.employee_name)}&background=random`,
                        size: "lg",
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-default-500">Tipo Documento</p>
                      <p className="font-medium">{documentTypeLabels[selectedDocument.document_type]}</p>
                    </div>
                    {selectedDocument.license_category && (
                      <div>
                        <p className="text-sm text-default-500">Categoria</p>
                        <p className="font-medium">{selectedDocument.license_category}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-default-500">Data Emissione</p>
                      <p className="font-medium">{new Date(selectedDocument.issue_date).toLocaleDateString("it-IT")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-default-500">Data Scadenza</p>
                      <p className="font-medium">
                        {selectedDocument.expiry_date 
                          ? new Date(selectedDocument.expiry_date).toLocaleDateString("it-IT")
                          : "Non specificata"
                        }
                      </p>
                    </div>
                  </div>

                  {(selectedDocument.issuing_authority || selectedDocument.certificate_number) && (
                    <div className="grid grid-cols-2 gap-4">
                      {selectedDocument.issuing_authority && (
                        <div>
                          <p className="text-sm text-default-500">Autorità Emittente</p>
                          <p className="font-medium">{selectedDocument.issuing_authority}</p>
                        </div>
                      )}
                      {selectedDocument.certificate_number && (
                        <div>
                          <p className="text-sm text-default-500">Numero Certificato</p>
                          <p className="font-medium">{selectedDocument.certificate_number}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {(selectedDocument.training_hours || selectedDocument.instructor) && (
                    <div className="grid grid-cols-2 gap-4">
                      {selectedDocument.training_hours && (
                        <div>
                          <p className="text-sm text-default-500">Ore Formazione</p>
                          <p className="font-medium">{selectedDocument.training_hours}h</p>
                        </div>
                      )}
                      {selectedDocument.instructor && (
                        <div>
                          <p className="text-sm text-default-500">Istruttore/Centro</p>
                          <p className="font-medium">{selectedDocument.instructor}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedDocument.renewal_required && (
                    <div className="p-3 bg-warning-50 rounded-lg border border-warning-200">
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:clock-circle-bold" className="text-warning" width={20} />
                        <p className="text-sm font-medium text-warning">Rinnovo Richiesto</p>
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

                  {selectedDocument.reminder_days && selectedDocument.reminder_days.length > 0 && (
                    <div>
                      <p className="text-sm text-default-500">Reminder Attivi</p>
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