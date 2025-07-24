import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Select,
  SelectItem,
  Chip,
  Badge,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Switch,
  Slider,
  Divider,
  Avatar,
  Tabs,
  Tab,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import type { Intervention } from "../../types/Intervention";
import type { Customer } from "../../types/Customer";
import type { Technician } from "../../types/Technician";
import PageHeader from "../../Components/Layout/PageHeader";

// Mock delle coordinate per Milano e zone limitrofe
const mockCoordinates = [
  { lat: 45.4642, lng: 9.1900 }, // Milano centro
  { lat: 45.4781, lng: 9.1841 }, // Brera
  { lat: 45.4404, lng: 9.2059 }, // Porta Romana
  { lat: 45.4888, lng: 9.2187 }, // Isola
  { lat: 45.4539, lng: 9.1708 }, // Navigli
  { lat: 45.4758, lng: 9.1453 }, // Fiera Milano
  { lat: 45.4390, lng: 9.1604 }, // Ticinese
  { lat: 45.4926, lng: 9.1764 }, // Garibaldi
];

const statusColorMap = {
  assigned: "default",
  accepted: "primary",
  in_progress: "warning",
  paused: "secondary",
  completed: "success",
  cancelled: "danger",
} as const;

const priorityColorMap = {
  low: "success",
  medium: "warning",
  high: "danger",
  emergency: "danger",
} as const;

const typeColorMap = {
  inspection: "primary",
  repair: "warning",
  maintenance: "secondary",
  installation: "success",
  emergency: "danger",
} as const;

interface MapFilters {
  status: string[];
  priority: string[];
  type: string[];
  technician: string[];
  dateRange: {
    start: string;
    end: string;
  };
  showCompleted: boolean;
}

interface MapMarker {
  id: string;
  intervention: Intervention;
  customer: Customer;
  technician: Technician | null;
  position: { lat: number; lng: number };
}

export default function InterventionsMap() {
  const navigate = useNavigate();
  const { isOpen: isFilterModalOpen, onOpen: onOpenFilterModal, onClose: onCloseFilterModal } = useDisclosure();
  const { isOpen: isInterventionModalOpen, onOpen: onOpenInterventionModal, onClose: onCloseInterventionModal } = useDisclosure();
  
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 45.4642, lng: 9.1900 }); // Milano centro
  const [mapZoom, setMapZoom] = useState(12);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  
  const [filters, setFilters] = useState<MapFilters>({
    status: [],
    priority: [],
    type: [],
    technician: [],
    dateRange: {
      start: new Date().toISOString().split('T')[0],
      end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    showCompleted: false,
  });

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    setLoading(true);
    try {
      // Mock data con coordinate simulate
      const mockCustomers: Customer[] = [
        {
          customer_id: "1",
          name: "Mario",
          surname: "Rossi",
          phone: "+39 333 1234567",
          address: "Via Roma 123",
          city: "Milano",
          zip_code: "20100",
          country: "Italia",
          status: "active",
          customer_type: "private",
          created_at: new Date(),
          updated_at: new Date(),
          created_by: "admin",
        },
        {
          customer_id: "2",
          name: "Giulia",
          surname: "Verdi",
          phone: "+39 333 7654321",
          address: "Via Garibaldi 456",
          city: "Milano",
          zip_code: "20100",
          country: "Italia",
          status: "active",
          customer_type: "business",
          created_at: new Date(),
          updated_at: new Date(),
          created_by: "admin",
        },
        {
          customer_id: "3",
          name: "Luca",
          surname: "Bianchi",
          phone: "+39 333 5555555",
          address: "Corso Buenos Aires 100",
          city: "Milano",
          zip_code: "20100",
          country: "Italia",
          status: "active",
          customer_type: "private",
          created_at: new Date(),
          updated_at: new Date(),
          created_by: "admin",
        },
      ];

      const mockTechnicians: Technician[] = [
        {
          technician_id: "1",
          user_id: "tech1",
          name: "Giuseppe",
          surname: "Bianchi",
          role: "technician",
          status: "active",
          specializations: ["repair", "maintenance"],
          skill_level: "senior",
          availability_status: "available",
          working_hours: {
            monday: { is_working_day: true, start_time: "08:00", end_time: "18:00" },
            tuesday: { is_working_day: true, start_time: "08:00", end_time: "18:00" },
            wednesday: { is_working_day: true, start_time: "08:00", end_time: "18:00" },
            thursday: { is_working_day: true, start_time: "08:00", end_time: "18:00" },
            friday: { is_working_day: true, start_time: "08:00", end_time: "18:00" },
            saturday: { is_working_day: false },
            sunday: { is_working_day: false },
          },
        },
        {
          technician_id: "2",
          user_id: "tech2",
          name: "Marco",
          surname: "Neri",
          role: "technician",
          status: "active",
          specializations: ["installation", "inspection"],
          skill_level: "junior",
          availability_status: "available",
          working_hours: {
            monday: { is_working_day: true, start_time: "08:00", end_time: "18:00" },
            tuesday: { is_working_day: true, start_time: "08:00", end_time: "18:00" },
            wednesday: { is_working_day: true, start_time: "08:00", end_time: "18:00" },
            thursday: { is_working_day: true, start_time: "08:00", end_time: "18:00" },
            friday: { is_working_day: true, start_time: "08:00", end_time: "18:00" },
            saturday: { is_working_day: false },
            sunday: { is_working_day: false },
          },
        },
      ];

      // Genera interventi con coordinate simulate
      const mockInterventions: Intervention[] = Array.from({ length: 8 }, (_, index) => ({
        intervention_id: `${index + 1}`,
        appointment_id: `APP-${index + 1}`,
        customer_id: mockCustomers[index % mockCustomers.length].customer_id,
        assigned_technician_id: mockTechnicians[index % mockTechnicians.length].technician_id,
        assigned_van_id: index % 2 === 0 ? `VAN-00${index + 1}` : undefined,
        intervention_code: `INT-2024-${(index + 1).toString().padStart(3, '0')}`,
        title: [
          "Riparazione rubinetto cucina",
          "Installazione termostato smart", 
          "Manutenzione impianto elettrico",
          "Ispezione caldaia",
          "Riparazione perdita bagno",
          "Installazione videocitofono",
          "Manutenzione climatizzatore",
          "Riparazione serratura porta"
        ][index],
        description: `Intervento di ${['riparazione', 'installazione', 'manutenzione', 'ispezione'][index % 4]} presso cliente`,
        intervention_type: ["repair", "installation", "maintenance", "inspection", "emergency"][index % 5] as any,
        status: ["assigned", "accepted", "in_progress", "completed", "paused"][index % 5] as any,
        priority: ["low", "medium", "high", "emergency"][index % 4] as any,
        scheduled_date: new Date(Date.now() + (index - 2) * 24 * 60 * 60 * 1000),
        scheduled_start_time: ["09:00", "10:30", "14:00", "15:30"][index % 4],
        scheduled_end_time: ["10:30", "12:00", "15:30", "17:00"][index % 4],
        intervention_address: mockCustomers[index % mockCustomers.length].address,
        intervention_city: "Milano",
        intervention_coordinates: mockCoordinates[index],
        estimated_cost: 100 + (index * 50),
        created_at: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
        updated_at: new Date(),
        created_by: "operator1",
      }));

      setCustomers(mockCustomers);
      setTechnicians(mockTechnicians);
      setInterventions(mockInterventions);
    } catch (error) {
      console.error("Errore nel caricamento dei dati mappa:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInterventions = useMemo(() => {
    let filtered = interventions.filter(intervention => {
      // Filtro per stato
      if (filters.status.length > 0 && !filters.status.includes(intervention.status)) {
        return false;
      }

      // Filtro per priorità
      if (filters.priority.length > 0 && !filters.priority.includes(intervention.priority)) {
        return false;
      }

      // Filtro per tipo
      if (filters.type.length > 0 && !filters.type.includes(intervention.intervention_type)) {
        return false;
      }

      // Filtro per tecnico
      if (filters.technician.length > 0 && !filters.technician.includes(intervention.assigned_technician_id)) {
        return false;
      }

      // Filtro per range date
      const interventionDate = intervention.scheduled_date.toISOString().split('T')[0];
      if (interventionDate < filters.dateRange.start || interventionDate > filters.dateRange.end) {
        return false;
      }

      // Filtro mostra completati
      if (!filters.showCompleted && intervention.status === "completed") {
        return false;
      }

      return true;
    });

    return filtered;
  }, [interventions, filters]);

  const mapMarkers: MapMarker[] = useMemo(() => {
    return filteredInterventions.map(intervention => ({
      id: intervention.intervention_id,
      intervention,
      customer: customers.find(c => c.customer_id === intervention.customer_id)!,
      technician: technicians.find(t => t.technician_id === intervention.assigned_technician_id) || null,
      position: intervention.intervention_coordinates || mockCoordinates[0],
    }));
  }, [filteredInterventions, customers, technicians]);

  const getStatusLabel = (status: string) => {
    const labels = {
      assigned: "Assegnato",
      accepted: "Accettato",
      in_progress: "In Corso",
      paused: "In Pausa",
      completed: "Completato",
      cancelled: "Annullato"
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      low: "Bassa",
      medium: "Media",
      high: "Alta",
      emergency: "Emergenza"
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      inspection: "Ispezione",
      repair: "Riparazione",
      maintenance: "Manutenzione",
      installation: "Installazione",
      emergency: "Emergenza"
    };
    return labels[type as keyof typeof labels] || type;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const handleMarkerClick = (marker: MapMarker) => {
    setSelectedIntervention(marker.intervention);
    onOpenInterventionModal();
  };

  const handleFilterChange = (filterType: keyof MapFilters, value: any) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      priority: [],
      type: [],
      technician: [],
      dateRange: {
        start: new Date().toISOString().split('T')[0],
        end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      showCompleted: false,
    });
  };

  const getMarkerIcon = (intervention: Intervention) => {
    const statusIcons = {
      assigned: "solar:clock-circle-bold",
      accepted: "solar:check-circle-bold",
      in_progress: "solar:play-circle-bold",
      paused: "solar:pause-circle-bold",
      completed: "solar:verified-check-bold",
      cancelled: "solar:close-circle-bold"
    };
    return statusIcons[intervention.status] || "solar:map-point-bold";
  };

  const renderMapView = () => (
    <div className="relative h-full">
      {/* Simulazione Mappa */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg overflow-hidden">
        {/* Header mappa simulata */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardBody className="p-3">
              <div className="flex items-center gap-2">
                <Icon icon="solar:map-bold-duotone" width={20} className="text-primary" />
                <span className="font-medium">Milano e Provincia</span>
                <Badge color="primary" size="sm">{mapMarkers.length} interventi</Badge>
              </div>
            </CardBody>
          </Card>
          
          <div className="flex gap-2">
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              className="bg-white/90 backdrop-blur-sm"
              onPress={() => setMapZoom(prev => Math.min(prev + 1, 18))}
            >
              <Icon icon="solar:add-circle-bold" width={20} />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              className="bg-white/90 backdrop-blur-sm"
              onPress={() => setMapZoom(prev => Math.max(prev - 1, 8))}
            >
              <Icon icon="solar:minus-circle-bold" width={20} />
            </Button>
          </div>
        </div>

        {/* Marcatori simulati */}
        <div className="absolute inset-0 p-8">
          <div className="relative w-full h-full">
            {mapMarkers.map((marker, index) => {
              const x = 10 + (index % 4) * 20 + Math.random() * 10;
              const y = 15 + Math.floor(index / 4) * 25 + Math.random() * 10;
              
              return (
                <div
                  key={marker.id}
                  className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
                  style={{ left: `${x}%`, top: `${y}%` }}
                  onClick={() => handleMarkerClick(marker)}
                >
                  <div className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-lg ${
                    marker.intervention.status === 'completed' ? 'bg-success' :
                    marker.intervention.status === 'in_progress' ? 'bg-warning' :
                    marker.intervention.status === 'cancelled' ? 'bg-danger' :
                    'bg-primary'
                  }`}>
                    <Icon 
                      icon={getMarkerIcon(marker.intervention)} 
                      width={16} 
                      className="text-white" 
                    />
                    {marker.intervention.priority === 'emergency' && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-danger rounded-full animate-pulse"></div>
                    )}
                  </div>
                  
                  {/* Tooltip su hover */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity z-20">
                    {marker.intervention.intervention_code} - {marker.customer.name} {marker.customer.surname}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legenda */}
        <Card className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm">
          <CardBody className="p-3">
            <p className="text-sm font-medium mb-2">Legenda Stati</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span>Assegnato</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-warning rounded-full"></div>
                <span>In Corso</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-success rounded-full"></div>
                <span>Completato</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-danger rounded-full"></div>
                <span>Urgente</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Info zoom */}
        <Card className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm">
          <CardBody className="p-3">
            <div className="flex items-center gap-2 text-sm">
              <Icon icon="solar:eye-bold" width={16} />
              <span>Zoom: {mapZoom}</span>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );

  const renderListView = () => (
    <div className="space-y-3">
      {mapMarkers.map((marker) => (
        <Card key={marker.id} className="hover:shadow-md transition-shadow cursor-pointer">
          <CardBody className="p-4" onClick={() => handleMarkerClick(marker)}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold">{marker.intervention.intervention_code}</h4>
                  <Chip
                    size="sm"
                    color={statusColorMap[marker.intervention.status]}
                    variant="flat"
                  >
                    {getStatusLabel(marker.intervention.status)}
                  </Chip>
                  <Chip
                    size="sm"
                    color={priorityColorMap[marker.intervention.priority]}
                    variant="flat"
                  >
                    {getPriorityLabel(marker.intervention.priority)}
                  </Chip>
                </div>
                <p className="text-sm text-default-600 mb-2">{marker.intervention.title}</p>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-default-500">Cliente:</span>
                    <p>{marker.customer.name} {marker.customer.surname}</p>
                  </div>
                  <div>
                    <span className="text-default-500">Tecnico:</span>
                    <p>{marker.technician?.name} {marker.technician?.surname}</p>
                  </div>
                  <div>
                    <span className="text-default-500">Data:</span>
                    <p>{formatDate(marker.intervention.scheduled_date)}</p>
                  </div>
                  <div>
                    <span className="text-default-500">Orario:</span>
                    <p>{marker.intervention.scheduled_start_time}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Icon 
                  icon={getMarkerIcon(marker.intervention)} 
                  width={20} 
                  className={`text-${statusColorMap[marker.intervention.status]}`}
                />
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={() => navigate(`/interventions/${marker.intervention.intervention_id}`)}
                >
                  <Icon icon="solar:eye-bold" width={16} />
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col h-screen">
        <PageHeader
          title="Mappa Interventi"
          description="Caricamento..."
          icon="solar:map-bold-duotone"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Icon icon="solar:refresh-circle-bold" width={48} className="animate-spin text-primary" />
            <p className="text-default-600">Caricamento mappa interventi...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <PageHeader
        title="Mappa Interventi"
        description="Visualizza la distribuzione geografica degli interventi"
        icon="solar:map-bold-duotone"
        actions={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="flat"
              startContent={<Icon icon="solar:filter-bold" width={16} />}
              onPress={onOpenFilterModal}
            >
              Filtri {filters.status.length + filters.priority.length + filters.type.length > 0 && 
                <Badge size="sm" color="primary">{filters.status.length + filters.priority.length + filters.type.length}</Badge>
              }
            </Button>
            <Tabs
              selectedKey={viewMode}
              onSelectionChange={(key) => setViewMode(key as "map" | "list")}
              size="sm"
            >
              <Tab key="map" title={
                <div className="flex items-center gap-2">
                  <Icon icon="solar:map-bold" width={16} />
                  Mappa
                </div>
              } />
              <Tab key="list" title={
                <div className="flex items-center gap-2">
                  <Icon icon="solar:list-bold" width={16} />
                  Lista
                </div>
              } />
            </Tabs>
          </div>
        }
      />
      
      <div className="flex-1 p-6 overflow-hidden">
        <div className="h-full">
          {viewMode === "map" ? renderMapView() : (
            <div className="h-full overflow-auto">
              {renderListView()}
            </div>
          )}
        </div>
      </div>

      {/* Modal Filtri */}
      <Modal isOpen={isFilterModalOpen} onClose={onCloseFilterModal} size="2xl">
        <ModalContent>
          <ModalHeader>Filtri Mappa</ModalHeader>
          <ModalBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Stati</label>
                  <div className="space-y-2">
                    {[
                      { key: "assigned", label: "Assegnato" },
                      { key: "accepted", label: "Accettato" },
                      { key: "in_progress", label: "In Corso" },
                      { key: "paused", label: "In Pausa" },
                      { key: "completed", label: "Completato" },
                      { key: "cancelled", label: "Annullato" },
                    ].map((status) => (
                      <label key={status.key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={filters.status.includes(status.key)}
                          onChange={(e) => {
                            const newStatus = e.target.checked
                              ? [...filters.status, status.key]
                              : filters.status.filter(s => s !== status.key);
                            handleFilterChange('status', newStatus);
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{status.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Priorità</label>
                  <div className="space-y-2">
                    {[
                      { key: "low", label: "Bassa" },
                      { key: "medium", label: "Media" },
                      { key: "high", label: "Alta" },
                      { key: "emergency", label: "Emergenza" },
                    ].map((priority) => (
                      <label key={priority.key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={filters.priority.includes(priority.key)}
                          onChange={(e) => {
                            const newPriority = e.target.checked
                              ? [...filters.priority, priority.key]
                              : filters.priority.filter(p => p !== priority.key);
                            handleFilterChange('priority', newPriority);
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{priority.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Tipi Intervento</label>
                  <div className="space-y-2">
                    {[
                      { key: "inspection", label: "Ispezione" },
                      { key: "repair", label: "Riparazione" },
                      { key: "maintenance", label: "Manutenzione" },
                      { key: "installation", label: "Installazione" },
                      { key: "emergency", label: "Emergenza" },
                    ].map((type) => (
                      <label key={type.key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={filters.type.includes(type.key)}
                          onChange={(e) => {
                            const newType = e.target.checked
                              ? [...filters.type, type.key]
                              : filters.type.filter(t => t !== type.key);
                            handleFilterChange('type', newType);
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Tecnici</label>
                  <div className="space-y-2">
                    {technicians.map((technician) => (
                      <label key={technician.technician_id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={filters.technician.includes(technician.technician_id)}
                          onChange={(e) => {
                            const newTechnician = e.target.checked
                              ? [...filters.technician, technician.technician_id]
                              : filters.technician.filter(t => t !== technician.technician_id);
                            handleFilterChange('technician', newTechnician);
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{technician.name} {technician.surname}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Divider />

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  label="Data Inizio"
                  value={filters.dateRange.start}
                  onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
                />
                <Input
                  type="date"
                  label="Data Fine"
                  value={filters.dateRange.end}
                  onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Mostra interventi completati</span>
                <Switch
                  isSelected={filters.showCompleted}
                  onValueChange={(value) => handleFilterChange('showCompleted', value)}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={clearFilters}>
              Pulisci Filtri
            </Button>
            <Button color="primary" onPress={onCloseFilterModal}>
              Applica Filtri
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Dettaglio Intervento */}
      <Modal isOpen={isInterventionModalOpen} onClose={onCloseInterventionModal} size="2xl">
        <ModalContent>
          {selectedIntervention && (
            <>
              <ModalHeader>
                <div className="flex items-center gap-2">
                  <Icon icon="solar:clipboard-text-bold-duotone" width={20} />
                  {selectedIntervention.intervention_code}
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-lg">{selectedIntervention.title}</h4>
                    <p className="text-default-600">{selectedIntervention.description}</p>
                  </div>

                  <div className="flex gap-2">
                    <Chip
                      color={statusColorMap[selectedIntervention.status]}
                      variant="flat"
                    >
                      {getStatusLabel(selectedIntervention.status)}
                    </Chip>
                    <Chip
                      color={priorityColorMap[selectedIntervention.priority]}
                      variant="flat"
                    >
                      {getPriorityLabel(selectedIntervention.priority)}
                    </Chip>
                    <Chip
                      color={typeColorMap[selectedIntervention.intervention_type]}
                      variant="flat"
                    >
                      {getTypeLabel(selectedIntervention.intervention_type)}
                    </Chip>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-default-500 text-sm">Cliente:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Avatar 
                          name={`${customers.find(c => c.customer_id === selectedIntervention.customer_id)?.name} ${customers.find(c => c.customer_id === selectedIntervention.customer_id)?.surname}`}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium">
                            {customers.find(c => c.customer_id === selectedIntervention.customer_id)?.name}{" "}
                            {customers.find(c => c.customer_id === selectedIntervention.customer_id)?.surname}
                          </p>
                          <p className="text-sm text-default-500">
                            {customers.find(c => c.customer_id === selectedIntervention.customer_id)?.phone}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-default-500 text-sm">Tecnico:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Avatar 
                          name={`${technicians.find(t => t.technician_id === selectedIntervention.assigned_technician_id)?.name} ${technicians.find(t => t.technician_id === selectedIntervention.assigned_technician_id)?.surname}`}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium">
                            {technicians.find(t => t.technician_id === selectedIntervention.assigned_technician_id)?.name}{" "}
                            {technicians.find(t => t.technician_id === selectedIntervention.assigned_technician_id)?.surname}
                          </p>
                          <p className="text-sm text-default-500">
                            {technicians.find(t => t.technician_id === selectedIntervention.assigned_technician_id)?.skill_level}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-default-500 text-sm">Data e Orario:</span>
                      <p className="font-medium">
                        {formatDate(selectedIntervention.scheduled_date)}
                      </p>
                      <p className="text-sm text-default-500">
                        {selectedIntervention.scheduled_start_time} - {selectedIntervention.scheduled_end_time}
                      </p>
                    </div>

                    <div>
                      <span className="text-default-500 text-sm">Indirizzo:</span>
                      <p className="font-medium">{selectedIntervention.intervention_address}</p>
                      <p className="text-sm text-default-500">{selectedIntervention.intervention_city}</p>
                    </div>
                  </div>

                  {selectedIntervention.estimated_cost && (
                    <div>
                      <span className="text-default-500 text-sm">Costo Stimato:</span>
                      <p className="font-medium">€ {selectedIntervention.estimated_cost}</p>
                    </div>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onCloseInterventionModal}>
                  Chiudi
                </Button>
                <Button 
                  color="primary" 
                  onPress={() => {
                    onCloseInterventionModal();
                    navigate(`/interventions/${selectedIntervention.intervention_id}`);
                  }}
                  startContent={<Icon icon="solar:eye-bold" width={16} />}
                >
                  Visualizza Dettagli
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
} 