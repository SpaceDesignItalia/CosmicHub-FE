import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardBody, Button, Input, Chip, Badge, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Switch, Divider, Avatar, Tabs, Tab } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import type { Intervention } from "../../types/Intervention";
import type { Customer } from "../../types/Customer";
import type { Technician } from "../../types/Technician";
import PageHeader from "../../Components/Layout/PageHeader";
import axios from "axios";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, HeatmapLayer } from "@react-google-maps/api";

// Librerie Google Maps statiche per evitare reload (warning LoadScript)
const MAP_LIBRARIES: ("visualization")[] = ["visualization"];

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

interface CustomerMarker {
  id: string;
  customer: Customer;
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
  // const [mapCenter, setMapCenter] = useState({ lat: 45.4642, lng: 9.1900 }); // Milano centro
  const [mapZoom, setMapZoom] = useState(12);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isInfoWindowOpen, setIsInfoWindowOpen] = useState(false);
  const [activeMarker, setActiveMarker] = useState<MapMarker | null>(null);
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "AIzaSyCiwX6kfGN0syLMPqy1JXLNxct0woowciA",
    libraries: MAP_LIBRARIES,
  });
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [layerMode, setLayerMode] = useState<"interventions" | "customers" | "heatmap">("customers");
  const [timeQuickFilter, setTimeQuickFilter] = useState<"all" | "today" | "week" | "future">("all");
  const [activeCustomerMarker, setActiveCustomerMarker] = useState<CustomerMarker | null>(null);
  
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
      const [customersRes, techniciansRes, interventionsRes] = await Promise.all([
        axios.get("Customer/GET/GetAllCustomers"),
        axios.get("Employee/GET/GetAllEmployees"),
        axios.get("Customer/GET/GetAllEvents"),
      ]);

      const customersDataRaw: any[] = Array.isArray(customersRes.data)
        ? customersRes.data
        : customersRes.data?.customers || customersRes.data?.data || [];

      // Geocoding per clienti senza coordinate (Nominatim)
      const geocodeAddress = async (fullAddress: string) => {
        try {
          const resp = await axios.get(
            "https://nominatim.openstreetmap.org/search",
            {
              params: { format: "json", q: fullAddress, addressdetails: 1, limit: 1 },
              headers: { Accept: "application/json" },
              withCredentials: false,
            }
          );
          if (Array.isArray(resp.data) && resp.data.length > 0) {
            const item = resp.data[0];
            return { lat: Number(item.lat), lng: Number(item.lon) };
          }
        } catch (e) {
          console.warn("Geocoding fallito per:", fullAddress);
        }
        return undefined;
      };

      const customersData: Customer[] = await Promise.all(
        customersDataRaw.map(async (c: any) => {
          const normalized: Customer = {
            ...c,
            customer_id: String(c.customer_id || c.id || c.CustomerId || c.customerId || ""),
            name: c.name,
            surname: c.surname,
            email: c.email,
            phone: c.phone,
            address: c.address,
            city: c.city,
            zip_code: c.zip_code,
            country: c.country,
            status: c.status || "active",
            customer_type: c.customer_type || "private",
            created_at: c.created_at ? new Date(c.created_at) : new Date(),
            created_by: c.created_by || "system",
            coordinates: c.coordinates || (c.lat && c.lng ? { lat: Number(c.lat), lng: Number(c.lng) } : undefined),
          } as Customer;

          if (!normalized.coordinates) {
            const fullAddress = [normalized.address, normalized.zip_code, normalized.city, normalized.country]
              .filter(Boolean)
              .join(", ");
            const coords = await geocodeAddress(fullAddress);
            if (coords) normalized.coordinates = coords;
          }
          return normalized;
        })
      );

      const techniciansData: Technician[] = (Array.isArray(techniciansRes.data)
        ? techniciansRes.data
        : techniciansRes.data?.employees || techniciansRes.data?.data || []
      ).map((emp: any) => ({
        technician_id: emp.user_id,
        user_id: emp.user_id,
        name: emp.name,
        phone: emp.phone || "",
        email: emp.email || "",
        profile_image: emp.profile_image || "",
        created_at: new Date(emp.created_at || Date.now()),
        updated_at: new Date(emp.updated_at || Date.now()),
        specializations: emp.specializations || [],
        skill_level: emp.skill_level || "junior",
        availability_status: emp.availability_status || "available",
        working_hours: emp.working_hours || {
          monday: { is_working_day: true, start_time: "09:00", end_time: "18:00" },
          tuesday: { is_working_day: true, start_time: "09:00", end_time: "18:00" },
          wednesday: { is_working_day: true, start_time: "09:00", end_time: "18:00" },
          thursday: { is_working_day: true, start_time: "09:00", end_time: "18:00" },
          friday: { is_working_day: true, start_time: "09:00", end_time: "18:00" },
            saturday: { is_working_day: false },
            sunday: { is_working_day: false },
          },
      }));

      const rawEvents: any[] = Array.isArray(interventionsRes.data)
        ? interventionsRes.data
        : interventionsRes.data?.events || interventionsRes.data?.data || [];

      const mappedInterventions: Intervention[] = rawEvents.map((ev: any, index: number) => {
        const customerMatch = customersData.find(c => c.customer_id === String(ev.CustomerInfo?.customer_id || ev.customer_id || ""));
        const customerAddress = customerMatch
          ? [customerMatch.address, customerMatch.zip_code, customerMatch.city, customerMatch.country]
              .filter(Boolean)
              .join(", ")
          : "";
        return ({
          intervention_id: String(ev.EventId || ev.id || Date.now() + index),
          appointment_id: String(ev.AppointmentId || ev.EventId || ev.id || ""),
          customer_id: String(ev.CustomerInfo?.customer_id || ev.customer_id || ""),
          assigned_technician_id: String(ev.TechnicianAssignment?.technician_id || ev.technician_id || ""),
          assigned_van_id: ev.assigned_van_id || ev.VanId,
          intervention_code: ev.EventTagName || ev.EventCode || `EV-${ev.EventId || ""}`,
          title: ev.EventTitle || "Intervento",
          description: ev.EventDescription || "",
          intervention_type: (ev.EventType || "inspection").toLowerCase(),
          status: (ev.EventStatus || "assigned").toLowerCase(),
          priority: (() => {
            const p = ev.EventPriority || "Normale";
            if (p === "Emergenza") return "emergency";
            if (p === "Urgente") return "high";
            if (p === "Alta") return "medium";
            return "low";
          })(),
          scheduled_date: new Date(ev.EventStartDate || Date.now()),
          scheduled_start_time: ev.EventStartTime || "09:00",
          scheduled_end_time: ev.EventEndTime || "10:00",
          actual_start_time: undefined,
          actual_end_time: undefined,
          intervention_address: customerAddress,
          intervention_city: customerMatch?.city || "",
          intervention_coordinates: customerMatch?.coordinates,
          estimated_cost: undefined,
          actual_cost: undefined,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: "system",
        });
      });

      setCustomers(customersData);
      setTechnicians(techniciansData);
      setInterventions(mappedInterventions);
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

    // Filtro rapido temporale
    const todayStr = new Date().toISOString().split('T')[0];
    const weekEndStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    if (timeQuickFilter === "today") {
      filtered = filtered.filter(it => it.scheduled_date.toISOString().split('T')[0] === todayStr);
    } else if (timeQuickFilter === "week") {
      filtered = filtered.filter(it => {
        const d = it.scheduled_date.toISOString().split('T')[0];
        return d >= todayStr && d <= weekEndStr;
      });
    } else if (timeQuickFilter === "future") {
      filtered = filtered.filter(it => it.scheduled_date.toISOString().split('T')[0] > todayStr);
    }

    return filtered;
  }, [interventions, filters, timeQuickFilter]);

  const mapMarkers: MapMarker[] = useMemo(() => {
    return filteredInterventions.map(intervention => {
      const customerEntity = customers.find(c => String(c.customer_id) === String(intervention.customer_id));
      return {
        id: intervention.intervention_id,
        intervention,
        customer: customerEntity!,
        technician: technicians.find(t => t.technician_id === intervention.assigned_technician_id) || null,
        position: (customerEntity?.coordinates) || intervention.intervention_coordinates || mockCoordinates[0],
      };
    });
  }, [filteredInterventions, customers, technicians]);

  const customerMarkers: CustomerMarker[] = useMemo(() => {
    return customers
      .filter(c => !!c.coordinates)
      .map(c => ({ id: c.customer_id, customer: c, position: c.coordinates! }));
  }, [customers]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const customerTodayFutureCounts = useMemo(() => {
    const counts = new Map<string, { today: number; future: number }>();
    interventions.forEach(it => {
      const key = String(it.customer_id);
      const d = new Date(it.scheduled_date);
      d.setHours(0, 0, 0, 0);
      const isToday = d.getTime() === today.getTime();
      const isFuture = d.getTime() > today.getTime();
      const prev = counts.get(key) || { today: 0, future: 0 };
      counts.set(key, { today: prev.today + (isToday ? 1 : 0), future: prev.future + (isFuture ? 1 : 0) });
    });
    return counts;
  }, [interventions]);

  const getCustomerMarkerIcon = (customerId: string) => {
    const c = customerTodayFutureCounts.get(String(customerId));
    if (c && c.today > 0) return "https://maps.google.com/mapfiles/ms/icons/green-dot.png";
    if (c && c.future > 0) return "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
    return "https://maps.google.com/mapfiles/ms/icons/red-dot.png";
  };

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
    setActiveMarker(marker);
    setIsInfoWindowOpen(true);
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

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    map.setZoom(mapZoom);
  }, [mapZoom]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleZoomIn = () => {
    if (map) {
      const newZoom = Math.min((map.getZoom() || mapZoom) + 1, 20);
      map.setZoom(newZoom);
      setMapZoom(newZoom);
    }
  };

  const handleZoomOut = () => {
    if (map) {
      const newZoom = Math.max((map.getZoom() || mapZoom) - 1, 3);
      map.setZoom(newZoom);
      setMapZoom(newZoom);
    }
  };

  const handleOpenNavigation = () => {
    if (activeMarker) {
      const coord = `${activeMarker.position.lat},${activeMarker.position.lng}`;
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const url = isMobile
        ? `https://maps.google.com/?q=${coord}`
        : `https://www.google.com/maps/dir/?api=1&destination=${coord}`;
      window.open(url, "_blank");
    }
  };

  const renderMapView = () => (
    <div className="relative h-full">
      <div className="absolute inset-0 rounded-lg overflow-hidden">
        {isLoaded ? (
          <GoogleMap
            mapContainerClassName="w-full h-full"
            center={(layerMode === "customers" ? customerMarkers[0]?.position : mapMarkers[0]?.position) || { lat: 45.4642, lng: 9.19 }}
            zoom={mapZoom}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{ disableDefaultUI: true, zoomControl: false }}
          >
            {layerMode === "interventions" && (
              mapMarkers.map((marker) => (
                <Marker
                  key={marker.id}
                  position={marker.position}
                  onClick={() => handleMarkerClick(marker)}
                />
              ))
            )}

            {layerMode === "customers" && (
              customerMarkers.map((cm) => (
                <Marker
                  key={cm.id}
                  position={cm.position}
                  onClick={() => { setActiveCustomerMarker(cm); setIsInfoWindowOpen(true); }}
                  icon={{ url: getCustomerMarkerIcon(cm.id) }}
                />
              ))
            )}

            {layerMode === "heatmap" && (
              <HeatmapLayer
                data={mapMarkers.map(m => new google.maps.LatLng(m.position.lat, m.position.lng))}
                options={{ radius: 40 }}
              />
            )}

            {isInfoWindowOpen && activeMarker && (
              <InfoWindow
                position={activeMarker.position}
                onCloseClick={() => setIsInfoWindowOpen(false)}
              >
                <div className="p-2">
                  <p className="font-semibold text-sm">
                    {activeMarker.intervention.intervention_code} - {activeMarker.customer.name} {activeMarker.customer.surname}
                  </p>
                  <p className="text-xs text-default-600">{activeMarker.intervention.title}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Chip size="sm" color={statusColorMap[activeMarker.intervention.status]} variant="flat">
                      {getStatusLabel(activeMarker.intervention.status)}
                    </Chip>
                    <Chip size="sm" color={priorityColorMap[activeMarker.intervention.priority]} variant="flat">
                      {getPriorityLabel(activeMarker.intervention.priority)}
                    </Chip>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="flat" onPress={() => { setSelectedIntervention(activeMarker.intervention); onOpenInterventionModal(); }}>
                      Dettagli
                    </Button>
                    <Button size="sm" variant="flat" onPress={handleOpenNavigation}>
                      Naviga
                    </Button>
                  </div>
                </div>
              </InfoWindow>
            )}
            {isInfoWindowOpen && activeCustomerMarker && (
              <InfoWindow
                position={activeCustomerMarker.position}
                onCloseClick={() => setIsInfoWindowOpen(false)}
              >
                <div className="p-2">
                  <p className="font-semibold text-sm">
                    {activeCustomerMarker.customer.name} {activeCustomerMarker.customer.surname}
                  </p>
                  <div className="text-xs text-default-600 space-y-1">
                    <p>Oggi: {customerTodayFutureCounts.get(activeCustomerMarker.customer.customer_id)?.today || 0}</p>
                    <p>Futuri: {customerTodayFutureCounts.get(activeCustomerMarker.customer.customer_id)?.future || 0}</p>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="flat" onPress={() => navigate(`/customers/${activeCustomerMarker.customer.customer_id}`)}>
                      Vai al cliente
                    </Button>
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-default-500">Caricamento mappa...</span>
          </div>
        )}

        {/* Controlli mappa */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center pointer-events-none">
          <Card className="bg-white/90 backdrop-blur-sm pointer-events-auto">
            <CardBody className="p-3">
              <div className="flex items-center gap-2">
                <Icon icon="solar:map-bold-duotone" width={20} className="text-primary" />
                <span className="font-medium">Mappa Interventi</span>
                <Badge color="primary" size="sm">{mapMarkers.length} interventi</Badge>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button size="sm" variant={layerMode === "interventions" ? "solid" : "flat"} onPress={() => setLayerMode("interventions")}>
                  Interventi
                </Button>
                <Button size="sm" variant={layerMode === "customers" ? "solid" : "flat"} onPress={() => setLayerMode("customers")}>
                  Clienti
                </Button>
                <Button size="sm" variant={layerMode === "heatmap" ? "solid" : "flat"} onPress={() => setLayerMode("heatmap")}>
                  Heatmap
                </Button>
                <div className="w-px h-6 bg-divider mx-1" />
                <Button size="sm" variant={timeQuickFilter === "all" ? "solid" : "flat"} onPress={() => setTimeQuickFilter("all")}>
                  Tutti
                </Button>
                <Button size="sm" variant={timeQuickFilter === "today" ? "solid" : "flat"} onPress={() => setTimeQuickFilter("today")}>
                  Oggi
                </Button>
                <Button size="sm" variant={timeQuickFilter === "week" ? "solid" : "flat"} onPress={() => setTimeQuickFilter("week")}>
                  Prossimi 7g
                </Button>
                <Button size="sm" variant={timeQuickFilter === "future" ? "solid" : "flat"} onPress={() => setTimeQuickFilter("future")}>
                  Futuri
                </Button>
              </div>
            </CardBody>
          </Card>

          <div className="flex gap-2 pointer-events-auto">
            <Button isIconOnly size="sm" variant="flat" className="bg-white/90 backdrop-blur-sm" onPress={handleZoomIn}>
              <Icon icon="solar:add-circle-bold" width={20} />
            </Button>
            <Button isIconOnly size="sm" variant="flat" className="bg-white/90 backdrop-blur-sm" onPress={handleZoomOut}>
              <Icon icon="solar:minus-circle-bold" width={20} />
            </Button>
          </div>
        </div>

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
                    <p>{marker.technician?.name}</p>
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
                  className="text-foreground"
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
        actions={[
          {
            label: `Filtri${filters.status.length + filters.priority.length + filters.type.length > 0 ? ` (${filters.status.length + filters.priority.length + filters.type.length})` : ""}`,
            icon: "solar:filter-bold",
            color: "default",
            variant: "flat",
            onClick: onOpenFilterModal,
          },
        ]}
      >
        <div className="flex">
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
      </PageHeader>
      
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
                        <span className="text-sm">{technician.name}</span>
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
                          name={`${technicians.find(t => t.technician_id === selectedIntervention.assigned_technician_id)?.name || ''}`}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium">
                            {technicians.find(t => t.technician_id === selectedIntervention.assigned_technician_id)?.name}
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