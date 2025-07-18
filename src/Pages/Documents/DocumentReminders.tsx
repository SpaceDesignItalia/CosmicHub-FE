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
  Switch,
  Spinner,
  Divider,
  Tabs,
  Tab,
  Progress,
  Avatar,
  AvatarGroup,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import PageHeader from "../../Components/Layout/PageHeader";
import type { DocumentReminder, ReminderConfig, DocumentAnalytics } from "../../types/Documents";

interface ReminderDashboardData {
  critical_expiring: DocumentReminder[];
  upcoming_reminders: DocumentReminder[];
  overdue_documents: DocumentReminder[];
  recent_sent: DocumentReminder[];
  analytics: DocumentAnalytics;
}

const urgencyColors = {
  critical: "danger",
  high: "warning", 
  medium: "primary",
  low: "default",
} as const;

const statusColors = {
  pending: "warning",
  sent: "primary",
  acknowledged: "success", 
  expired: "danger",
} as const;

const statusLabels = {
  pending: "In Attesa",
  sent: "Inviato",
  acknowledged: "Confermato",
  expired: "Scaduto",
};

export default function DocumentReminders() {
  // State management
  const [dashboardData, setDashboardData] = useState<ReminderDashboardData | null>(null);
  const [reminderConfigs, setReminderConfigs] = useState<ReminderConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("dashboard");

  // Raw document data from APIs
  const [vehicleDocuments, setVehicleDocuments] = useState<any[]>([]);
  const [employeeDocuments, setEmployeeDocuments] = useState<any[]>([]);
  const [companyDocuments, setCompanyDocuments] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Modals
  const { isOpen: isConfigModalOpen, onOpen: onConfigModalOpen, onClose: onConfigModalClose } = useDisclosure();

  // Load data
  useEffect(() => {
    loadAllDocuments();
    loadReminderConfigs();
  }, []);

  // Load all documents from the 3 categories using existing APIs
  const loadAllDocuments = async () => {
    setIsLoading(true);
    try {
      // Load documents from all categories in parallel
      const [vehicleResponse, employeeResponse, companyResponse] = await Promise.all([
        axios.get("/Document/GET/GetAllVehicleDocuments"),
        axios.get("/Document/GET/GetAllEmployeeDocuments"),
        axios.get("/Document/GET/GetAllCompanyDocuments")
      ]);

      const vehicleDocs = vehicleResponse.data || [];
      const employeeDocs = employeeResponse.data || [];
      const companyDocs = companyResponse.data || [];

      setVehicleDocuments(vehicleDocs);
      setEmployeeDocuments(employeeDocs);
      setCompanyDocuments(companyDocs);

      // Process data to create dashboard
      const processedData = processDashboardData(vehicleDocs, employeeDocs, companyDocs);
      setDashboardData(processedData);
      setLastUpdated(new Date());

    } catch (error) {
      console.error("Errore nel caricamento documenti:", error);
      // Load mock data as fallback
      loadMockDashboardData();
    } finally {
      setIsLoading(false);
    }
  };

  const loadReminderConfigs = async () => {
    try {
      const response = await axios.get("/Documents/Reminders/GET/GetReminderConfigs");
      setReminderConfigs(response.data || []);
    } catch (error) {
      console.error("Errore nel caricamento configurazioni:", error);
      loadMockConfigs();
    }
  };

  // Process all documents to create dashboard data
  const processDashboardData = (vehicleDocs: any[], employeeDocs: any[], companyDocs: any[]): ReminderDashboardData => {
    const allDocuments = [
      ...vehicleDocs.map(doc => ({ ...doc, entity_type: 'vehicle' as const })),
      ...employeeDocs.map(doc => ({ ...doc, entity_type: 'employee' as const })),
      ...companyDocs.map(doc => ({ ...doc, entity_type: 'company' as const }))
    ];

    const now = new Date();
    const documentsWithExpiry = allDocuments.filter(doc => doc.expiry_date);

    // Calculate days until expiry for each document
    const processedDocuments = documentsWithExpiry.map(doc => {
      const expiryDate = new Date(doc.expiry_date);
      const timeDiff = expiryDate.getTime() - now.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      return {
        id: doc.document_id || doc.id,
        document_id: doc.document_id || doc.id,
        document_type: doc.entity_type,
        document_title: doc.title,
        expiry_date: doc.expiry_date,
        days_until_expiry: daysDiff,
        reminder_type: "email" as const,
        status: daysDiff < 0 ? "expired" as const : daysDiff <= 7 ? "pending" as const : "sent" as const,
        recipients: ["admin@cosmichub.it"],
        created_at: new Date().toISOString(),
      };
    });

    // Categorize documents
    const critical_expiring = processedDocuments.filter(doc => 
      doc.days_until_expiry >= 0 && doc.days_until_expiry <= 7
    );
    
    const upcoming_reminders = processedDocuments.filter(doc => 
      doc.days_until_expiry > 7 && doc.days_until_expiry <= 30
    );
    
    const overdue_documents = processedDocuments.filter(doc => 
      doc.days_until_expiry < 0
    );

    const recent_sent = processedDocuments.filter(doc => 
      doc.days_until_expiry > 30 && doc.days_until_expiry <= 60
    );

    // Calculate analytics
    const analytics: DocumentAnalytics = {
      total_documents: allDocuments.length,
      expiring_soon: critical_expiring.length + upcoming_reminders.length,
      expired: overdue_documents.length,
      by_type: {
        vehicle_documents: vehicleDocs.length,
        company_documents: companyDocs.length,
        employee_documents: employeeDocs.length,
      },
      by_status: {
        active: allDocuments.filter(d => d.status === "active").length,
        expiring_soon: critical_expiring.length + upcoming_reminders.length,
        expired: overdue_documents.length,
        draft: allDocuments.filter(d => d.status === "draft").length,
      },
      recent_uploads: allDocuments.filter(doc => {
        if (!doc.created_at) return false;
        const createdDate = new Date(doc.created_at);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return createdDate > weekAgo;
      }).length,
      pending_renewals: critical_expiring.length + upcoming_reminders.length + overdue_documents.length,
    };

    return {
      critical_expiring,
      upcoming_reminders,
      overdue_documents,
      recent_sent,
      analytics
    };
  };

  const loadMockDashboardData = () => {
    const mockData: ReminderDashboardData = {
      critical_expiring: [
        {
          id: "1",
          document_id: "doc_1",
          document_type: "vehicle",
          document_title: "Revisione Furgone Milano",
          expiry_date: "2024-12-25",
          days_until_expiry: 3,
          reminder_type: "email",
          status: "pending",
          recipients: ["admin@cosmichub.it"],
          created_at: "2024-12-22T10:00:00Z",
        },
        {
          id: "2", 
          document_id: "doc_2",
          document_type: "company",
          document_title: "Certificazione Sicurezza Magazzino",
          expiry_date: "2024-12-30",
          days_until_expiry: 8,
          reminder_type: "notification",
          status: "sent",
          recipients: ["safety@cosmichub.it"],
          sent_at: "2024-12-22T08:30:00Z",
          created_at: "2024-12-22T08:30:00Z",
        },
      ],
      upcoming_reminders: [
        {
          id: "3",
          document_id: "doc_3", 
          document_type: "employee",
          document_title: "Patente Mario Rossi",
          expiry_date: "2025-01-15",
          days_until_expiry: 24,
          reminder_type: "email",
          status: "pending",
          recipients: ["mario.rossi@cosmichub.it", "hr@cosmichub.it"],
          created_at: "2024-12-22T12:00:00Z",
        },
      ],
      overdue_documents: [
        {
          id: "4",
          document_id: "doc_4",
          document_type: "vehicle", 
          document_title: "Assicurazione Furgone Roma",
          expiry_date: "2024-12-15",
          days_until_expiry: -7,
          reminder_type: "email",
          status: "expired",
          recipients: ["fleet@cosmichub.it"],
          created_at: "2024-12-15T09:00:00Z",
        },
      ],
      recent_sent: [
        {
          id: "5",
          document_id: "doc_5",
          document_type: "company",
          document_title: "Licenza Commerciale",
          expiry_date: "2025-03-01",
          days_until_expiry: 69,
          reminder_type: "email",
          status: "acknowledged",
          recipients: ["admin@cosmichub.it"],
          sent_at: "2024-12-20T14:30:00Z",
          acknowledged_at: "2024-12-20T15:45:00Z",
          acknowledged_by: "Admin",
          created_at: "2024-12-20T14:30:00Z",
        },
      ],
      analytics: {
        total_documents: 45,
        expiring_soon: 8,
        expired: 3,
        by_type: {
          vehicle_documents: 18,
          company_documents: 15,
          employee_documents: 12,
        },
        by_status: {
          active: 39,
          expiring_soon: 8,
          expired: 3,
          draft: 2,
        },
        recent_uploads: 5,
        pending_renewals: 11,
      },
    };

    setDashboardData(mockData);
  };

  const loadMockConfigs = () => {
    const mockConfigs: ReminderConfig[] = [
      {
        id: "1",
        document_type: "insurance",
        entity_type: "vehicle",
        reminder_days: [60, 30, 15, 7, 1],
        reminder_methods: ["email", "notification"],
        recipients: {
          roles: ["fleet_manager", "admin"],
          emails: ["insurance@cosmichub.it"],
        },
        active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "2",
        document_type: "inspection",
        entity_type: "vehicle", 
        reminder_days: [30, 15, 7, 1],
        reminder_methods: ["email", "dashboard"],
        recipients: {
          roles: ["maintenance_manager"],
          emails: ["revisioni@cosmichub.it"],
        },
        active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    ];

    setReminderConfigs(mockConfigs);
  };

  // Get urgency level based on days until expiry
  const getUrgencyLevel = (days: number) => {
    if (days < 0) return "critical"; // Scaduto
    if (days <= 3) return "critical"; // Scade tra 3 giorni o meno
    if (days <= 7) return "high"; // Scade tra 7 giorni o meno
    if (days <= 30) return "medium"; // Scade tra 30 giorni o meno
    return "low"; // Scade tra più di 30 giorni
  };

  // Send manual reminder
  const sendManualReminder = async (documentId: string, reminderType: string) => {
    try {
      await axios.post("/Documents/Reminders/POST/SendManualReminder", {
        document_id: documentId,
        reminder_type: reminderType,
      });
      await loadAllDocuments();
    } catch (error) {
      console.error("Errore nell'invio reminder:", error);
    }
  };

  // Acknowledge reminder
  const acknowledgeReminder = async (reminderId: string) => {
    try {
      await axios.put(`/Documents/Reminders/PUT/AcknowledgeReminder/${reminderId}`);
      await loadAllDocuments();
    } catch (error) {
      console.error("Errore nella conferma reminder:", error);
    }
  };

  // Toggle reminder config
  const toggleReminderConfig = async (configId: string, active: boolean) => {
    try {
      await axios.put(`/Documents/Reminders/PUT/UpdateReminderConfig/${configId}`, { active });
      await loadReminderConfigs();
    } catch (error) {
      console.error("Errore nell'aggiornamento configurazione:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" color="primary" label="Caricamento scadenze..." />
      </div>
    );
  }

  if (!dashboardData) {
    return <div>Errore nel caricamento dei dati</div>;
  }

  return (
    <div className="w-full flex flex-col p-4 gap-6 min-h-screen">
      <PageHeader
        title="Scadenze & Reminder"
        description={`Monitoraggio scadenze documenti e gestione notifiche automatiche${lastUpdated ? ` • Ultimo aggiornamento: ${lastUpdated.toLocaleTimeString('it-IT')}` : ''}`}
        icon="solar:bell-bing-bold-duotone"
        size="md"
        actions={[
          {
            label: "Ricarica Dati",
            icon: "solar:refresh-bold",
            color: "default",
            variant: "flat",
            onClick: loadAllDocuments,
          },
          {
            label: "Configura Reminder",
            icon: "solar:settings-bold",
            color: "primary",
            variant: "flat",
            onClick: onConfigModalOpen,
          },
        ]}
      />

      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(key as string)}
        color="primary"
        className="w-full"
      >
        <Tab key="dashboard" title="Dashboard">
          {/* Critical Alerts */}
          {dashboardData.critical_expiring.length > 0 && (
            <Card className="mb-6 border-danger-200">
              <CardHeader className="bg-danger-50">
                <div className="flex items-center gap-2">
                  <Icon icon="solar:danger-bold" className="text-danger" width={24} />
                  <h3 className="text-lg font-semibold text-danger">Documenti in Scadenza Critica</h3>
                  <Badge color="danger">{dashboardData.critical_expiring.length}</Badge>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {dashboardData.critical_expiring.map((reminder) => (
                    <div key={reminder.id} className="flex items-center justify-between p-3 bg-danger-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Icon 
                          icon={reminder.document_type === "vehicle" ? "solar:car-bold" : 
                                reminder.document_type === "company" ? "solar:buildings-2-bold" : 
                                "solar:user-id-bold"} 
                          width={20} 
                          className="text-danger"
                        />
                        <div>
                          <p className="font-medium">{reminder.document_title}</p>
                          <p className="text-sm text-danger">
                            {reminder.days_until_expiry < 0 
                              ? `Scaduto da ${Math.abs(reminder.days_until_expiry)} giorni`
                              : `Scade tra ${reminder.days_until_expiry} giorni`
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                          startContent={<Icon icon="solar:bell-bold" width={16} />}
                          onPress={() => sendManualReminder(reminder.document_id, "email")}
                        >
                          Invia Reminder
                        </Button>
                        {reminder.status === "sent" && (
                          <Button
                            size="sm"
                            color="success"
                            variant="flat"
                            startContent={<Icon icon="solar:check-bold" width={16} />}
                            onPress={() => acknowledgeReminder(reminder.id)}
                          >
                            Conferma
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon icon="solar:documents-bold" className="text-primary" width={24} />
                  </div>
                  <div>
                    <p className="text-small text-default-500">Totale Documenti</p>
                    <p className="text-2xl font-semibold">{dashboardData.analytics.total_documents}</p>
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
                    <p className="text-2xl font-semibold text-warning">{dashboardData.analytics.expiring_soon}</p>
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
                    <p className="text-2xl font-semibold text-danger">{dashboardData.analytics.expired}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <Icon icon="solar:refresh-circle-bold" className="text-secondary" width={24} />
                  </div>
                  <div>
                    <p className="text-small text-default-500">Da Rinnovare</p>
                    <p className="text-2xl font-semibold text-secondary">{dashboardData.analytics.pending_renewals}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Data Sources Summary */}
          <Card className="mb-6">
            <CardHeader>
              <h3 className="text-lg font-semibold">Fonti Dati Caricate</h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-lg">
                  <Icon icon="solar:car-bold" className="text-primary" width={24} />
                  <div>
                    <p className="text-sm font-medium">Documenti Veicoli</p>
                    <p className="text-lg font-semibold">{vehicleDocuments.length}</p>
                    <p className="text-xs text-default-500">
                      {vehicleDocuments.filter(d => d.expiry_date).length} con scadenza
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-warning-50 rounded-lg">
                  <Icon icon="solar:user-id-bold" className="text-warning" width={24} />
                  <div>
                    <p className="text-sm font-medium">Documenti Dipendenti</p>
                    <p className="text-lg font-semibold">{employeeDocuments.length}</p>
                    <p className="text-xs text-default-500">
                      {employeeDocuments.filter(d => d.expiry_date).length} con scadenza
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-secondary-50 rounded-lg">
                  <Icon icon="solar:buildings-2-bold" className="text-secondary" width={24} />
                  <div>
                    <p className="text-sm font-medium">Documenti Azienda</p>
                    <p className="text-lg font-semibold">{companyDocuments.length}</p>
                    <p className="text-xs text-default-500">
                      {companyDocuments.filter(d => d.expiry_date).length} con scadenza
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Distribution Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Distribuzione per Tipo</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Icon icon="solar:car-bold" width={20} className="text-primary" />
                      <span>Documenti Veicoli</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(dashboardData.analytics.by_type.vehicle_documents / dashboardData.analytics.total_documents) * 100} 
                        className="w-20" 
                        color="primary"
                      />
                      <span className="text-sm font-medium">{dashboardData.analytics.by_type.vehicle_documents}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Icon icon="solar:buildings-2-bold" width={20} className="text-secondary" />
                      <span>Documenti Azienda</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(dashboardData.analytics.by_type.company_documents / dashboardData.analytics.total_documents) * 100} 
                        className="w-20" 
                        color="secondary"
                      />
                      <span className="text-sm font-medium">{dashboardData.analytics.by_type.company_documents}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Icon icon="solar:user-id-bold" width={20} className="text-warning" />
                      <span>Documenti Dipendenti</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(dashboardData.analytics.by_type.employee_documents / dashboardData.analytics.total_documents) * 100} 
                        className="w-20" 
                        color="warning"
                      />
                      <span className="text-sm font-medium">{dashboardData.analytics.by_type.employee_documents}</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Stato Documenti</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Icon icon="solar:check-circle-bold" width={20} className="text-success" />
                      <span>Attivi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(dashboardData.analytics.by_status.active / dashboardData.analytics.total_documents) * 100} 
                        className="w-20" 
                        color="success"
                      />
                      <span className="text-sm font-medium">{dashboardData.analytics.by_status.active}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Icon icon="solar:clock-circle-bold" width={20} className="text-warning" />
                      <span>In Scadenza</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(dashboardData.analytics.by_status.expiring_soon / dashboardData.analytics.total_documents) * 100} 
                        className="w-20" 
                        color="warning"
                      />
                      <span className="text-sm font-medium">{dashboardData.analytics.by_status.expiring_soon}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Icon icon="solar:close-circle-bold" width={20} className="text-danger" />
                      <span>Scaduti</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={(dashboardData.analytics.by_status.expired / dashboardData.analytics.total_documents) * 100} 
                        className="w-20" 
                        color="danger"
                      />
                      <span className="text-sm font-medium">{dashboardData.analytics.by_status.expired}</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Recent Activity & Upcoming */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Prossimi Reminder</h3>
                <Badge color="primary">{dashboardData.upcoming_reminders.length}</Badge>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {dashboardData.upcoming_reminders.map((reminder) => (
                    <div key={reminder.id} className="flex items-center justify-between p-3 bg-default-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar
                          icon={<Icon icon="solar:bell-bold" />}
                          className="bg-primary/10 text-primary"
                          size="sm"
                        />
                        <div>
                          <p className="font-medium text-sm">{reminder.document_title}</p>
                          <p className="text-xs text-default-500">
                            Scade tra {reminder.days_until_expiry} giorni
                          </p>
                        </div>
                      </div>
                      <Chip
                        color={urgencyColors[getUrgencyLevel(reminder.days_until_expiry)]}
                        size="sm"
                        variant="flat"
                      >
                        {reminder.days_until_expiry}g
                      </Chip>
                    </div>
                  ))}
                  {dashboardData.upcoming_reminders.length === 0 && (
                    <p className="text-center text-default-500 py-4">Nessun reminder in programma</p>
                  )}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Attività Recente</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {dashboardData.recent_sent.map((reminder) => (
                    <div key={reminder.id} className="flex items-center justify-between p-3 bg-default-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar
                          icon={<Icon icon={reminder.status === "acknowledged" ? "solar:check-circle-bold" : "solar:mail-bold"} />}
                          className={`${reminder.status === "acknowledged" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}`}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium text-sm">{reminder.document_title}</p>
                          <p className="text-xs text-default-500">
                            {reminder.sent_at && new Date(reminder.sent_at).toLocaleDateString("it-IT")}
                          </p>
                        </div>
                      </div>
                      <Chip
                        color={statusColors[reminder.status]}
                        size="sm"
                        variant="flat"
                      >
                        {statusLabels[reminder.status]}
                      </Chip>
                    </div>
                  ))}
                  {dashboardData.recent_sent.length === 0 && (
                    <p className="text-center text-default-500 py-4">Nessuna attività recente</p>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="configurations" title="Configurazioni">
          <Card>
            <CardHeader className="flex justify-between">
              <h3 className="text-lg font-semibold">Configurazioni Reminder Automatici</h3>
              <Button
                color="primary"
                startContent={<Icon icon="solar:add-circle-bold" width={16} />}
                onPress={onConfigModalOpen}
              >
                Nuova Configurazione
              </Button>
            </CardHeader>
            <CardBody>
              <Table aria-label="Configurazioni reminder">
                <TableHeader>
                  <TableColumn>TIPO DOCUMENTO</TableColumn>
                  <TableColumn>ENTITÀ</TableColumn>
                  <TableColumn>GIORNI REMINDER</TableColumn>
                  <TableColumn>METODI</TableColumn>
                  <TableColumn>DESTINATARI</TableColumn>
                  <TableColumn>STATO</TableColumn>
                  <TableColumn>AZIONI</TableColumn>
                </TableHeader>
                <TableBody>
                  {reminderConfigs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell>
                        <Chip size="sm" variant="flat">
                          {config.document_type}
                        </Chip>
                      </TableCell>
                      
                      <TableCell>
                        <Chip size="sm" variant="flat" color="secondary">
                          {config.entity_type}
                        </Chip>
                      </TableCell>

                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {config.reminder_days.map((days) => (
                            <Chip key={days} size="sm" variant="flat">
                              {days}g
                            </Chip>
                          ))}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {config.reminder_methods.map((method) => (
                            <Chip key={method} size="sm" variant="flat">
                              {method}
                            </Chip>
                          ))}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          {config.recipients.roles && (
                            <p>Ruoli: {config.recipients.roles.join(", ")}</p>
                          )}
                          {config.recipients.emails && (
                            <p>Email: {config.recipients.emails.length}</p>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Switch
                          isSelected={config.active}
                          onValueChange={(value) => toggleReminderConfig(config.id, value)}
                          color="success"
                          size="sm"
                        />
                      </TableCell>

                      <TableCell>
                        <Dropdown>
                          <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                              <Icon icon="solar:menu-dots-bold" width={16} />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu>
                            <DropdownItem
                              key="edit"
                              startContent={<Icon icon="solar:pen-bold" width={16} />}
                            >
                              Modifica
                            </DropdownItem>
                            <DropdownItem
                              key="duplicate"
                              startContent={<Icon icon="solar:copy-bold" width={16} />}
                            >
                              Duplica
                            </DropdownItem>
                            <DropdownItem
                              key="delete"
                              className="text-danger"
                              color="danger"
                              startContent={<Icon icon="solar:trash-bin-trash-bold" width={16} />}
                            >
                              Elimina
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
} 