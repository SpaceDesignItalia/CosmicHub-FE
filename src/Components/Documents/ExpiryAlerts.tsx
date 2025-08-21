import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Chip,
  Badge,
  Tooltip,
  Progress,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface ExpiringDocument {
  id: string;
  title: string;
  entity_type: "vehicle" | "company" | "employee";
  entity_name: string;
  document_type: string;
  expiry_date: string;
  days_until_expiry: number;
  status: "active" | "expiring_soon" | "expired";
}

interface ExpiryData {
  critical: ExpiringDocument[];
  warning: ExpiringDocument[];
  upcoming: ExpiringDocument[];
  total_expiring: number;
}

const getUrgencyColor = (days: number) => {
  if (days < 0) return "danger"; // Scaduto
  if (days <= 3) return "danger"; // Critico
  if (days <= 7) return "warning"; // Attenzione
  if (days <= 30) return "primary"; // Prossimo
  return "default";
};

const getEntityIcon = (entityType: string) => {
  switch (entityType) {
    case "vehicle":
      return "solar:car-bold";
    case "company":
      return "solar:buildings-2-bold";
    case "employee":
      return "solar:user-id-bold";
    default:
      return "solar:document-bold";
  }
};

const getEntityColor = (entityType: string) => {
  switch (entityType) {
    case "vehicle":
      return "primary";
    case "company":
      return "secondary";
    case "employee":
      return "warning";
    default:
      return "default";
  }
};

interface ExpiryAlertsProps {
  showOnlyHeader?: boolean;
  maxItems?: number;
}

export default function ExpiryAlerts({ showOnlyHeader = false, maxItems = 5 }: ExpiryAlertsProps) {
  const [expiryData, setExpiryData] = useState<ExpiryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();

  useEffect(() => {
    loadExpiryData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(loadExpiryData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadExpiryData = async () => {
    try {
      const response = await axios.get("/Documents/GET/GetExpiringDocuments");
      setExpiryData(response.data);
    } catch (error) {
      console.error("Errore nel caricamento scadenze:", error);
      // Load mock data for development
      loadMockData();
    } finally {
      setIsLoading(false);
    }
  };

  const loadMockData = () => {
    const mockData: ExpiryData = {
      critical: [
        {
          id: "1",
          title: "Revisione Furgone Milano",
          entity_type: "vehicle",
          entity_name: "Furgone Milano (AB123CD)",
          document_type: "inspection",
          expiry_date: "2024-12-25",
          days_until_expiry: 3,
          status: "expiring_soon",
        },
        {
          id: "2",
          title: "Certificato Medico Mario Rossi",
          entity_type: "employee",
          entity_name: "Mario Rossi",
          document_type: "medical_certificate",
          expiry_date: "2024-12-20",
          days_until_expiry: -2,
          status: "expired",
        },
      ],
      warning: [
        {
          id: "3",
          title: "Certificazione Sicurezza Magazzino",
          entity_type: "company",
          entity_name: "Magazzino Centrale Milano",
          document_type: "safety_certification",
          expiry_date: "2024-12-30",
          days_until_expiry: 8,
          status: "expiring_soon",
        },
        {
          id: "4",
          title: "Assicurazione Furgone Roma",
          entity_type: "vehicle",
          entity_name: "Furgone Roma (EF456GH)",
          document_type: "insurance",
          expiry_date: "2025-01-05",
          days_until_expiry: 14,
          status: "expiring_soon",
        },
      ],
      upcoming: [
        {
          id: "5",
          title: "Patente Giuseppe Verdi",
          entity_type: "employee",
          entity_name: "Giuseppe Verdi",
          document_type: "driving_license",
          expiry_date: "2025-01-15",
          days_until_expiry: 24,
          status: "active",
        },
      ],
      total_expiring: 5,
    };
    setExpiryData(mockData);
  };

  const navigateToDocuments = (entityType: string) => {
    switch (entityType) {
      case "vehicle":
        navigate("/documents/vehicles");
        break;
      case "company":
        navigate("/documents/company");
        break;
      case "employee":
        navigate("/documents/employees");
        break;
      default:
        navigate("/documents/reminders");
    }
  };

  const sendManualReminder = async (documentId: string) => {
    try {
      await axios.post("/Documents/Reminders/POST/SendManualReminder", {
        document_id: documentId,
        reminder_type: "email",
      });
      // Ricarica i dati dopo l'invio del reminder
      await loadExpiryData();
    } catch (error) {
      console.error("Errore nell'invio reminder:", error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardBody className="p-4">
          <div className="flex items-center gap-3">
            <div className="animate-pulse w-6 h-6 bg-default-200 rounded"></div>
            <div className="animate-pulse w-32 h-4 bg-default-200 rounded"></div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!expiryData || expiryData.total_expiring === 0) {
    return (
      <Card>
        <CardBody className="p-4">
          <div className="flex items-center gap-3">
            <Icon icon="solar:check-circle-bold" className="text-success" width={24} />
            <div>
              <p className="font-semibold text-success">Tutti i documenti sono in regola</p>
              <p className="text-sm text-default-500">Nessuna scadenza imminente</p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  // Se showOnlyHeader è true, mostra solo l'header del card
  if (showOnlyHeader) {
    return (
      <Card 
        className="cursor-pointer hover:shadow-lg transition-shadow"
        isPressable
        onPress={onModalOpen}
      >
        <CardBody className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-danger/10 rounded-lg">
                <Icon icon="solar:danger-triangle-bold" className="text-danger" width={24} />
              </div>
              <div>
                <p className="font-semibold">Documenti in Scadenza</p>
                <p className="text-sm text-default-500">
                  {expiryData.critical.length} critici, {expiryData.warning.length} in attenzione
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge color="danger" content={expiryData.critical.length}>
                <Icon icon="solar:bell-bold" width={20} />
              </Badge>
              <Icon icon="solar:alt-arrow-right-linear" width={16} className="text-default-400" />
            </div>
          </div>
        </CardBody>

        {/* Modal per visualizzare tutti gli alert */}
        <Modal isOpen={isModalOpen} onClose={onModalClose} size="2xl" scrollBehavior="inside">
          <ModalContent>
            <ModalHeader>
              <div className="flex items-center gap-2">
                <Icon icon="solar:danger-triangle-bold" className="text-danger" width={24} />
                <h3 className="text-xl font-semibold">Documenti in Scadenza</h3>
                <Badge color="danger">{expiryData.total_expiring}</Badge>
              </div>
            </ModalHeader>
            <ModalBody>
              <ExpiryAlerts showOnlyHeader={false} maxItems={20} />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onModalClose}>
                Chiudi
              </Button>
              <Button
                color="primary"
                onPress={() => {
                  navigate("/documents/reminders");
                  onModalClose();
                }}
              >
                Vai alle Scadenze
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Card>
    );
  }

  const allDocuments = [
    ...expiryData.critical,
    ...expiryData.warning,
    ...expiryData.upcoming
  ].slice(0, maxItems);

  return (
    <Card>
      <CardHeader className="flex justify-between">
        <div className="flex items-center gap-2">
          <Icon icon="solar:danger-triangle-bold" className="text-danger" width={24} />
          <h3 className="text-lg font-semibold">Documenti in Scadenza</h3>
          <Badge color="danger">{expiryData.total_expiring}</Badge>
        </div>
        <Button
          size="sm"
          variant="light"
          color="primary"
          onPress={() => navigate("/documents/reminders")}
          startContent={<Icon icon="solar:eye-bold" width={16} />}
        >
          Vedi Tutti
        </Button>
      </CardHeader>

      <CardBody className="pt-0">
        {/* Critical Documents */}
        {expiryData.critical.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon icon="solar:danger-bold" className="text-danger" width={16} />
              <span className="text-sm font-semibold text-danger">Critici</span>
              <Badge color="danger" size="sm">{expiryData.critical.length}</Badge>
            </div>
            <div className="space-y-2">
              {expiryData.critical.map((doc) => (
                <div 
                  key={doc.id} 
                  className="flex items-center justify-between p-3 bg-danger-50 border border-danger-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Icon 
                      icon={getEntityIcon(doc.entity_type)} 
                      width={20} 
                      className="text-danger"
                    />
                    <div>
                      <p className="font-medium text-sm">{doc.title}</p>
                      <p className="text-xs text-danger">
                        {doc.entity_name} • {doc.days_until_expiry < 0 
                          ? `Scaduto da ${Math.abs(doc.days_until_expiry)} giorni`
                          : `Scade tra ${doc.days_until_expiry} giorni`
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Tooltip content="Invia reminder">
                      <Button
                        isIconOnly
                        size="sm"
                        color="danger"
                        variant="flat"
                        onPress={() => sendManualReminder(doc.id)}
                      >
                        <Icon icon="solar:bell-bold" width={14} />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Vai ai documenti">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => navigateToDocuments(doc.entity_type)}
                      >
                        <Icon icon="solar:eye-bold" width={14} />
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warning Documents */}
        {expiryData.warning.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon icon="solar:clock-circle-bold" className="text-warning" width={16} />
              <span className="text-sm font-semibold text-warning">In Attenzione</span>
              <Badge color="warning" size="sm">{expiryData.warning.length}</Badge>
            </div>
            <div className="space-y-2">
              {expiryData.warning.map((doc) => (
                <div 
                  key={doc.id} 
                  className="flex items-center justify-between p-3 bg-warning-50 border border-warning-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Icon 
                      icon={getEntityIcon(doc.entity_type)} 
                      width={20} 
                      className="text-warning"
                    />
                    <div>
                      <p className="font-medium text-sm">{doc.title}</p>
                      <p className="text-xs text-warning">
                        {doc.entity_name} • Scade tra {doc.days_until_expiry} giorni
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Tooltip content="Vai ai documenti">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => navigateToDocuments(doc.entity_type)}
                      >
                        <Icon icon="solar:eye-bold" width={14} />
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Documents */}
        {expiryData.upcoming.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Icon icon="solar:calendar-bold" className="text-primary" width={16} />
              <span className="text-sm font-semibold text-primary">Prossimi</span>
              <Badge color="primary" size="sm">{expiryData.upcoming.length}</Badge>
            </div>
            <div className="space-y-2">
              {expiryData.upcoming.map((doc) => (
                <div 
                  key={doc.id} 
                  className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Icon 
                      icon={getEntityIcon(doc.entity_type)} 
                      width={20} 
                      className="text-primary"
                    />
                    <div>
                      <p className="font-medium text-sm">{doc.title}</p>
                      <p className="text-xs text-primary">
                        {doc.entity_name} • Scade tra {doc.days_until_expiry} giorni
                      </p>
                    </div>
                  </div>
                  <Chip
                    size="sm"
                    variant="flat"
                    color={getEntityColor(doc.entity_type) as any}
                  >
                    {doc.days_until_expiry}g
                  </Chip>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <Divider className="my-4" />
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Documenti monitorati</span>
            <span className="font-medium">{expiryData.total_expiring} in scadenza</span>
          </div>
          <Progress 
            value={(expiryData.critical.length + expiryData.warning.length) * 20} 
            color={expiryData.critical.length > 0 ? "danger" : "warning"}
            className="max-w-full"
            aria-label="Livello di allerta documenti"
          />
          <div className="flex justify-between text-xs text-default-500">
            <span>Critici: {expiryData.critical.length}</span>
            <span>Attenzione: {expiryData.warning.length}</span>
            <span>Prossimi: {expiryData.upcoming.length}</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
} 