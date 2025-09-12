"use client";

import { Icon } from "@iconify/react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Chip,
  Progress,
  Spinner,
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
} from "@heroui/react";
import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Responsive, WidthProvider, type Layout } from "react-grid-layout";
import axios from "axios";
import PageHeader from "../../Components/Layout/PageHeader";
import CitySelector from "../../Components/Dashboard/CitySelector";
import { weatherService, type WeatherData as WeatherServiceData } from "../../services/weatherService";

// Import CSS per react-grid-layout
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

// Interfaces
interface Warehouse {
  warehouse_id: string;
  WarehouseID?: string;
  WarehouseUUID?: string;
  WarehouseName?: string;
  name: string;
  location: string;
  WarehouseCode?: string;
  WarehouseCountry?: string;
  WarehouseAdress?: string;
  capacity: string;
  type: string;
  IsActive?: boolean;
}

interface Vehicle {
  id?: string;
  vehicle_id: string;
  license_plate: string;
  name: string;
  type: string;
  capacity: number;
  assigned_user_id?: string | null;
  location?: string;
  last_inspection?: string;
  status?: "Available" | "In use" | "Maintenance";
  assignedUser?: string;
  position?: string;
}

interface LowStockProduct {
  product_id: string;
  name: string;
  sku: string;
  stock_quantity: number;
  minimum_stock: number;
  supplier_id?: string;
  supplier_name?: string;
}

interface RecentActivity {
  id: string;
  type: "movement" | "order" | "delivery" | "maintenance";
  title: string;
  description: string;
  time: string;
  status: "completed" | "pending" | "warning";
  user?: string;
}

interface WeatherData {
  temperature: number;
  condition: string;
  icon: string;
  location: string;
  humidity: number;
  windSpeed: number;
}

interface DashboardStats {
  totalWarehouses: number;
  activeWarehouses: number;
  totalVehicles: number;
  availableVehicles: number;
  vehiclesInUse: number;
  vehiclesInMaintenance: number;
  lowStockProducts: number;
  totalValue: number;
  valueChange: number;
  totalProducts: number;
  productsChange: number;
  monthlyMovements: number;
  movementsChange: number;
  efficiency: number;
  efficiencyChange: number;
}

interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  size: { w: number; h: number };
  minSize?: { w: number; h: number };
  maxSize?: { w: number; h: number };
}

// Definizione dei widget disponibili
const AVAILABLE_WIDGETS: WidgetConfig[] = [
  {
    id: "clock-weather",
    type: "clock-weather",
    title: "Orologio & Meteo",
    size: { w: 6, h: 2 },
    minSize: { w: 4, h: 2 },
    maxSize: { w: 8, h: 3 },
  },
  // Nuovi widget separati
  {
    id: "clock-only",
    type: "clock-only", 
    title: "Orologio",
    size: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 4, h: 3 },
  },
  {
    id: "weather-detailed",
    type: "weather-detailed",
    title: "Meteo Dettagliato", 
    size: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
    maxSize: { w: 6, h: 4 },
  },
  {
    id: "mini-calendar",
    type: "mini-calendar",
    title: "Calendario",
    size: { w: 3, h: 3 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 4, h: 4 },
  },
  {
    id: "quick-notes",
    type: "quick-notes", 
    title: "Note Rapide",
    size: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
    maxSize: { w: 6, h: 4 },
  },
  {
    id: "system-status",
    type: "system-status",
    title: "Stato Sistema",
    size: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 4, h: 3 },
  },
  {
    id: "notifications",
    type: "notifications",
    title: "Notifiche",
    size: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
    maxSize: { w: 6, h: 4 },
  },
  {
    id: "timer-stopwatch",
    type: "timer-stopwatch",
    title: "Timer & Cronometro", 
    size: { w: 3, h: 3 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 4, h: 4 },
  },
  {
    id: "quick-links",
    type: "quick-links",
    title: "Link Rapidi",
    size: { w: 3, h: 4 },
    minSize: { w: 2, h: 3 },
    maxSize: { w: 4, h: 5 },
  },
  {
    id: "exchange-rates",
    type: "exchange-rates", 
    title: "Cambi Valute",
    size: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 4, h: 3 },
  },
  // Widget esistenti
  {
    id: "kpi-value",
    type: "kpi",
    title: "Valore Totale",
    size: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 4, h: 3 },
  },
  {
    id: "kpi-products",
    type: "kpi",
    title: "Prodotti Totali",
    size: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 4, h: 3 },
  },
  {
    id: "kpi-movements",
    type: "kpi",
    title: "Movimenti Mensili",
    size: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 4, h: 3 },
  },
  {
    id: "kpi-efficiency",
    type: "kpi",
    title: "Efficienza",
    size: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 4, h: 3 },
  },
  {
    id: "warehouses-status",
    type: "warehouses-status",
    title: "Stato Magazzini",
    size: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 4, h: 3 },
  },
  {
    id: "vehicles-status",
    type: "vehicles-status",
    title: "Stato Veicoli",
    size: { w: 3, h: 2 },
    minSize: { w: 2, h: 2 },
    maxSize: { w: 4, h: 3 },
  },
  {
    id: "recent-activities",
    type: "recent-activities",
    title: "Attività Recenti",
    size: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    maxSize: { w: 8, h: 6 },
  },
  {
    id: "quick-actions",
    type: "quick-actions",
    title: "Azioni Rapide",
    size: { w: 3, h: 4 },
    minSize: { w: 2, h: 3 },
    maxSize: { w: 4, h: 6 },
  },
  {
    id: "warehouses-list",
    type: "warehouses-list",
    title: "Lista Magazzini",
    size: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
    maxSize: { w: 6, h: 4 },
  },
  {
    id: "vehicles-list",
    type: "vehicles-list",
    title: "Lista Veicoli",
    size: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
    maxSize: { w: 6, h: 4 },
  },
  {
    id: "critical-products",
    type: "critical-products",
    title: "Prodotti Critici",
    size: { w: 6, h: 3 },
    minSize: { w: 4, h: 2 },
    maxSize: { w: 8, h: 4 },
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isEditMode, setIsEditMode] = useState(false);
  const [weather, setWeather] = useState<WeatherData>({
    temperature: 22,
    condition: "Soleggiato",
    icon: "solar:sun-2-bold-duotone",
    location: "Milano, IT",
    humidity: 65,
    windSpeed: 12
  });
  
  // Stati per il selettore di città
  const [isCitySelectorOpen, setIsCitySelectorOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>("Milano");
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  
  // Dati del backend
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalWarehouses: 0,
    activeWarehouses: 0,
    totalVehicles: 0,
    availableVehicles: 0,
    vehiclesInUse: 0,
    vehiclesInMaintenance: 0,
    lowStockProducts: 0,
    totalValue: 0,
    valueChange: 0,
    totalProducts: 0,
    productsChange: 0,
    monthlyMovements: 0,
    movementsChange: 0,
    efficiency: 0,
    efficiencyChange: 0,
  });

  // Stati per nuovi widget
  const [quickNotes, setQuickNotes] = useState<string>("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [timerTime, setTimerTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    cpu: 45,
    memory: 67,
    storage: 32,
    uptime: "15 giorni"
  });
  const [exchangeRates, setExchangeRates] = useState({
    usd: 1.09,
    gbp: 0.86,
    chf: 0.92,
    jpy: 163.45
  });
  const [quickLinks] = useState([
    { name: "Analytics", url: "/analytics", icon: "solar:chart-2-bold-duotone", color: "primary" },
    { name: "Inventario", url: "/inventory/products", icon: "solar:box-bold-duotone", color: "secondary" },
    { name: "Veicoli", url: "/inventory/vehicles", icon: "solar:delivery-bold-duotone", color: "success" },
    { name: "Magazzini", url: "/warehouses", icon: "solar:warehouse-bold-duotone", color: "warning" },
    { name: "Team", url: "/team", icon: "solar:users-group-rounded-bold-duotone", color: "danger" },
    { name: "Clienti", url: "/customers", icon: "solar:user-heart-rounded-bold-duotone", color: "default" }
  ]);

  // Configurazione widget
  const [activeWidgets, setActiveWidgets] = useState<string[]>([]);
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>({});

  // Layout predefinito
  const defaultLayout: Layout[] = [
    { i: "clock-weather", x: 0, y: 0, w: 6, h: 2 },
    { i: "kpi-value", x: 6, y: 0, w: 3, h: 2 },
    { i: "kpi-products", x: 9, y: 0, w: 3, h: 2 },
    { i: "kpi-movements", x: 0, y: 2, w: 3, h: 2 },
    { i: "kpi-efficiency", x: 3, y: 2, w: 3, h: 2 },
    { i: "warehouses-status", x: 6, y: 2, w: 3, h: 2 },
    { i: "vehicles-status", x: 9, y: 2, w: 3, h: 2 },
    { i: "recent-activities", x: 0, y: 4, w: 6, h: 4 },
    { i: "quick-actions", x: 6, y: 4, w: 3, h: 4 },
    { i: "notifications", x: 9, y: 4, w: 3, h: 3 },
    { i: "mini-calendar", x: 9, y: 7, w: 3, h: 3 },
  ];

  // Carica configurazione dal localStorage
  useEffect(() => {
    const savedWidgets = localStorage.getItem('dashboard-widgets');
    const savedLayouts = localStorage.getItem('dashboard-layouts');
    
    if (savedWidgets && savedLayouts) {
      setActiveWidgets(JSON.parse(savedWidgets));
      setLayouts(JSON.parse(savedLayouts));
    } else {
      // Configurazione di default
      const defaultWidgets = ["clock-weather", "kpi-value", "kpi-products", "kpi-movements", "kpi-efficiency", "warehouses-status", "vehicles-status", "recent-activities", "quick-actions", "notifications", "mini-calendar"];
      setActiveWidgets(defaultWidgets);
      setLayouts({ lg: defaultLayout });
    }
  }, []);

  // Salva configurazione nel localStorage
  const saveConfiguration = useCallback((widgets: string[], newLayouts: { [key: string]: Layout[] }) => {
    localStorage.setItem('dashboard-widgets', JSON.stringify(widgets));
    localStorage.setItem('dashboard-layouts', JSON.stringify(newLayouts));
    setActiveWidgets(widgets);
    setLayouts(newLayouts);
  }, []);

  // Aggiorna l'orologio ogni secondo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simula aggiornamento meteo
  useEffect(() => {
    const updateWeather = () => {
      const conditions = [
        { condition: "Soleggiato", icon: "solar:sun-2-bold-duotone", temp: 22 + Math.floor(Math.random() * 8) },
        { condition: "Nuvoloso", icon: "solar:cloudy-bold-duotone", temp: 18 + Math.floor(Math.random() * 6) },
        { condition: "Pioggia", icon: "solar:cloud-rain-bold-duotone", temp: 15 + Math.floor(Math.random() * 5) },
      ];
      
      const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
      
      setWeather(prev => ({
        ...prev,
        ...randomCondition,
        humidity: 50 + Math.floor(Math.random() * 40),
        windSpeed: 5 + Math.floor(Math.random() * 20)
      }));
    };

    const weatherTimer = setInterval(updateWeather, 600000);
    updateWeather();
    return () => clearInterval(weatherTimer);
  }, []);

  // Timer per cronometro
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Carica note salvate
  useEffect(() => {
    const savedNotes = localStorage.getItem('dashboard-notes');
    if (savedNotes) {
      setQuickNotes(savedNotes);
    }
  }, []);

  // Inizializza notifiche simulate
  useEffect(() => {
    const simulatedNotifications = [
      {
        id: 1,
        title: "Magazzino Roma",
        message: "Stock prodotto #SKU123 sotto soglia minima",
        type: "warning",
        time: "5 min fa",
        read: false
      },
      {
        id: 2,
        title: "Veicolo EF765GB",
        message: "Consegna completata con successo",
        type: "success", 
        time: "12 min fa",
        read: false
      },
      {
        id: 3,
        title: "Sistema",
        message: "Backup automatico completato",
        type: "info",
        time: "1 ora fa",
        read: true
      },
      {
        id: 4,
        title: "Fornitori",
        message: "Nuovo ordine da Supplier SRL",
        type: "info",
        time: "2 ore fa",
        read: true
      }
    ];
    setNotifications(simulatedNotifications);
  }, []);

  // Simula aggiornamento stato sistema
  useEffect(() => {
    const updateSystemStatus = () => {
      setSystemStatus(prev => ({
        ...prev,
        cpu: 30 + Math.floor(Math.random() * 40),
        memory: 50 + Math.floor(Math.random() * 30),
        storage: 25 + Math.floor(Math.random() * 20)
      }));
    };

    const systemTimer = setInterval(updateSystemStatus, 30000);
    return () => clearInterval(systemTimer);
  }, []);

  // Simula aggiornamento tassi di cambio
  useEffect(() => {
    const updateExchangeRates = () => {
      setExchangeRates(prev => ({
        usd: +(prev.usd + (Math.random() - 0.5) * 0.02).toFixed(4),
        gbp: +(prev.gbp + (Math.random() - 0.5) * 0.02).toFixed(4),
        chf: +(prev.chf + (Math.random() - 0.5) * 0.02).toFixed(4),
        jpy: +(prev.jpy + (Math.random() - 0.5) * 2).toFixed(2)
      }));
    };

    const ratesTimer = setInterval(updateExchangeRates, 60000);
    return () => clearInterval(ratesTimer);
  }, []);

  // Funzione per generare attività simulate
  const generateRecentActivities = (): RecentActivity[] => {
    return [
      {
        id: "1",
        type: "movement",
        title: "Movimento magazzino",
        description: "Carico 50x Filtri olio - Magazzino Centrale",
        time: "2 minuti fa",
        status: "completed",
        user: "Marco R."
      },
      {
        id: "2", 
        type: "delivery",
        title: "Consegna completata",
        description: "Veicolo EF765GB - Via Roma 123, Milano",
        time: "15 minuti fa",
        status: "completed",
        user: "Luca B."
      },
      {
        id: "3",
        type: "order",
        title: "Ordine ricevuto",
        description: "Nuovo ordine #ORD-2024-001 - 15 articoli",
        time: "1 ora fa",
        status: "pending",
        user: "Sistema"
      },
      {
        id: "4",
        type: "maintenance",
        title: "Manutenzione programmata",
        description: "Veicolo GB768FN - Scadenza revisione",
        time: "3 ore fa",
        status: "warning",
        user: "Sistema"
      },
      {
        id: "5",
        type: "movement",
        title: "Scarico materiale",
        description: "Trasferimento 25x Pastiglie freno",
        time: "5 ore fa",
        status: "completed",
        user: "Anna M."
      }
    ];
  };

  // Caricamento dati dal backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Carica magazzini
        const warehousesResponse = await axios.get("/Warehouse/GET/GetAllWarehouses");
        const warehousesData = warehousesResponse.data || [];
        setWarehouses(warehousesData);

        // Carica veicoli
        const vehiclesResponse = await axios.get("/Vehicle/GET/GetAllVehicles", {
          withCredentials: true,
        });
        const vehiclesData = vehiclesResponse.data || [];

        // Elabora i dati dei veicoli
        const processedVehicles = await Promise.all(
          vehiclesData.map(async (vehicle: any) => {
            let status: "Available" | "In use" | "Maintenance" = "Maintenance";
            let assignedUser = undefined;
            let position = "Posizione non disponibile";

            if (vehicle.assigned_user_id) {
              try {
                const employeeResponse = await axios.get(
                  `/Employee/GET/GetEmployeeById`,
                  { params: { employeeId: vehicle.assigned_user_id } }
                );
                if (employeeResponse.data?.name) {
                  assignedUser = `${employeeResponse.data.name} ${
                    employeeResponse.data.surname || ""
                  }`;
                }
              } catch (error) {
                console.log(`Nessun utente assegnato al veicolo ${vehicle.vehicle_id}`);
              }
            }

            if (vehicle.location && vehicle.location !== "N/A") {
              const [lat, lng] = vehicle.location.split(" ").map(Number);
              if (lat && lng) {
                status = Math.random() > 0.5 ? "Available" : "In use";
                position = status === "Available" ? "In deposito" : "In consegna";
              }
            }

            return {
              ...vehicle,
              id: vehicle.vehicle_id,
              status,
              assignedUser,
              position,
            };
          })
        );

        setVehicles(processedVehicles);

        // Carica prodotti con bassa giacenza
        try {
          const lowStockResponse = await axios.get("/Product/GET/GetLowStockProducts");
          setLowStockProducts(lowStockResponse.data || []);
        } catch (error) {
          console.error("Errore nel caricamento prodotti con bassa giacenza:", error);
          setLowStockProducts([]);
        }

        // Calcola statistiche
        const activeWarehouses = warehousesData.filter(
          (w: Warehouse) => w.IsActive !== false
        ).length;
        const availableVehicles = processedVehicles.filter(
          (v) => v.status === "Available"
        ).length;
        const vehiclesInUse = processedVehicles.filter(
          (v) => v.status === "In use"
        ).length;
        const vehiclesInMaintenance = processedVehicles.filter(
          (v) => v.status === "Maintenance"
        ).length;

        // Genera dati simulati per le nuove metriche
        const totalValue = 184250 + Math.floor(Math.random() * 10000);
        const valueChange = (Math.random() - 0.5) * 20;
        const totalProducts = 4382 + Math.floor(Math.random() * 100);
        const productsChange = (Math.random() - 0.5) * 10;
        const monthlyMovements = 287 + Math.floor(Math.random() * 50);
        const movementsChange = (Math.random() - 0.5) * 15;
        const efficiency = 85 + Math.floor(Math.random() * 10);
        const efficiencyChange = (Math.random() - 0.5) * 8;

        setStats({
          totalWarehouses: warehousesData.length,
          activeWarehouses,
          totalVehicles: processedVehicles.length,
          availableVehicles,
          vehiclesInUse,
          vehiclesInMaintenance,
          lowStockProducts: lowStockProducts.length,
          totalValue,
          valueChange,
          totalProducts,
          productsChange,
          monthlyMovements,
          movementsChange,
          efficiency,
          efficiencyChange,
        });

        setRecentActivities(generateRecentActivities());

      } catch (error) {
        console.error("Errore nel caricamento dati dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 120000);
    return () => clearInterval(interval);
  }, []);

  // Funzioni per formattare i valori
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('it-IT').format(value);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Componente per trend indicator
  const TrendIndicator = ({ value, isPositive }: { value: number; isPositive?: boolean }) => {
    const isUp = isPositive !== undefined ? isPositive : value > 0;
    return (
      <div className={`flex items-center gap-1 text-xs ${isUp ? 'text-success' : 'text-danger'}`}>
        <Icon 
          icon={isUp ? "solar:arrow-up-bold" : "solar:arrow-down-bold"} 
          width={12} 
        />
        <span>{Math.abs(value).toFixed(1)}%</span>
        <span className="text-default-500">vs precedente</span>
      </div>
    );
  };

  // Funzioni helper per nuovi widget
  const formatTimerTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const saveNotes = (notes: string) => {
    localStorage.setItem('dashboard-notes', notes);
    setQuickNotes(notes);
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Gestione selezione città
  const handleCitySelect = async (city: any) => {
    setSelectedCity(city.name);
    setIsLoadingWeather(true);
    
    try {
      let weatherData: WeatherServiceData;
      
      if (city.lat && city.lon) {
        // Usa coordinate se disponibili
        weatherData = await weatherService.getWeatherByCoordinates(city.lat, city.lon);
      } else {
        // Altrimenti usa il nome della città
        weatherData = await weatherService.getWeatherByCity(city.name);
      }
      
      setWeather({
        temperature: weatherData.temperature,
        condition: weatherData.condition,
        icon: weatherData.icon,
        location: weatherData.location,
        humidity: weatherData.humidity,
        windSpeed: weatherData.windSpeed
      });
      
    } catch (error) {
      console.error('Errore nel caricamento dati meteo:', error);
      // Fallback ai dati simulati
      setWeather(prev => ({
        ...prev,
        location: city.name,
        condition: "Dati non disponibili"
      }));
    } finally {
      setIsLoadingWeather(false);
    }
    
    // Salva la città selezionata nel localStorage
    localStorage.setItem('dashboard-selected-city', city.name);
    localStorage.setItem('dashboard-selected-city-coords', JSON.stringify({ lat: city.lat, lon: city.lon }));
  };

  // Carica città salvata all'avvio e dati meteo reali
  useEffect(() => {
    const loadInitialWeather = async () => {
      const savedCity = localStorage.getItem('dashboard-selected-city');
      const savedCoords = localStorage.getItem('dashboard-selected-city-coords');
      
      if (savedCity) {
        setSelectedCity(savedCity);
        
        try {
          let weatherData: WeatherServiceData;
          
          if (savedCoords) {
            const coords = JSON.parse(savedCoords);
            weatherData = await weatherService.getWeatherByCoordinates(coords.lat, coords.lon);
          } else {
            weatherData = await weatherService.getWeatherByCity(savedCity);
          }
          
          setWeather({
            temperature: weatherData.temperature,
            condition: weatherData.condition,
            icon: weatherData.icon,
            location: weatherData.location,
            humidity: weatherData.humidity,
            windSpeed: weatherData.windSpeed
          });
          
        } catch (error) {
          console.error('Errore nel caricamento dati meteo iniziali:', error);
          // Mantieni i dati di default se l'API non funziona
        }
      } else {
        // Se non c'è città salvata, prova con la geolocalizzazione
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                const weatherData = await weatherService.getWeatherByCoordinates(
                  position.coords.latitude,
                  position.coords.longitude
                );
                
                setWeather({
                  temperature: weatherData.temperature,
                  condition: weatherData.condition,
                  icon: weatherData.icon,
                  location: weatherData.location,
                  humidity: weatherData.humidity,
                  windSpeed: weatherData.windSpeed
                });
                
                setSelectedCity(weatherData.location);
                
              } catch (error) {
                console.error('Errore nel caricamento dati meteo GPS:', error);
              }
            },
            (error) => {
              console.log('Geolocalizzazione non disponibile:', error);
            }
          );
        }
      }
    };
    
    loadInitialWeather();
  }, []);

  // Gestione layout change
  const onLayoutChange = useCallback((_: Layout[], layouts: { [key: string]: Layout[] }) => {
    setLayouts(layouts);
    if (!isEditMode) return;
    localStorage.setItem('dashboard-layouts', JSON.stringify(layouts));
  }, [isEditMode]);

  // Aggiungi widget
  const addWidget = (widgetId: string) => {
    if (activeWidgets.includes(widgetId)) return;
    
    const widget = AVAILABLE_WIDGETS.find(w => w.id === widgetId);
    if (!widget) return;

    const newWidgets = [...activeWidgets, widgetId];
    const newLayouts = { ...layouts };
    
    // Aggiungi il widget al layout
    Object.keys(newLayouts).forEach(breakpoint => {
      const layout = [...(newLayouts[breakpoint] || [])];
      const maxY = Math.max(...layout.map(item => item.y + item.h), 0);
      
      layout.push({
        i: widgetId,
        x: 0,
        y: maxY,
        w: widget.size.w,
        h: widget.size.h,
        minW: widget.minSize?.w,
        minH: widget.minSize?.h,
        maxW: widget.maxSize?.w,
        maxH: widget.maxSize?.h,
      });
      
      newLayouts[breakpoint] = layout;
    });
    
    saveConfiguration(newWidgets, newLayouts);
    onClose();
  };

  // Rimuovi widget
  const removeWidget = (widgetId: string) => {
    const newWidgets = activeWidgets.filter(id => id !== widgetId);
    const newLayouts = { ...layouts };
    
    Object.keys(newLayouts).forEach(breakpoint => {
      newLayouts[breakpoint] = newLayouts[breakpoint].filter(item => item.i !== widgetId);
    });
    
    saveConfiguration(newWidgets, newLayouts);
  };

  // Handler per rimozione widget che previene il drag
  const handleRemoveWidget = (widgetId: string) => {
    // Conferma prima di rimuovere
    if (window.confirm(`Vuoi rimuovere il widget "${AVAILABLE_WIDGETS.find(w => w.id === widgetId)?.title}"?`)) {
      removeWidget(widgetId);
    }
  };

  // Reset configurazione
  const resetConfiguration = () => {
    const defaultWidgets = ["clock-weather", "kpi-value", "kpi-products", "kpi-movements", "kpi-efficiency", "warehouses-status", "vehicles-status", "recent-activities", "quick-actions", "notifications", "mini-calendar"];
    const newLayouts = { lg: defaultLayout };
    saveConfiguration(defaultWidgets, newLayouts);
    setIsEditMode(false);
    onClose();
  };

  // Renderizza i widget
  const renderWidget = (widgetId: string) => {
    const widget = AVAILABLE_WIDGETS.find(w => w.id === widgetId);
    if (!widget) return null;

    const cardProps = {
      className: `h-full ${isEditMode ? 'cursor-move border-2 border-dashed border-primary-300' : ''}`,
    };

    switch (widget.type) {
      case "clock-weather":
        return (
          <Card {...cardProps}>
            <CardBody className="p-4">
              <div className="flex items-center justify-between gap-4 h-full">
                {/* Orologio */}
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
                    <Icon icon="solar:clock-circle-bold-duotone" className="text-primary text-xl" />
                  </div>
                  <div>
                    <p className="text-xl font-bold font-mono">{formatTime(currentTime)}</p>
                    <p className="text-xs text-default-600 capitalize">{formatDate(currentTime)}</p>
                  </div>
                </div>

                {/* Separatore */}
                <div className="h-8 w-px bg-default-200 dark:bg-default-700" />

                                 {/* Meteo */}
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-warning-100 dark:bg-warning-900/30 rounded-xl">
                    {isLoadingWeather ? (
                      <Spinner size="sm" color="warning" />
                    ) : (
                      <Icon icon={weather.icon} className="text-warning text-xl" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-bold">
                        {isLoadingWeather ? "--" : weather.temperature}°C
                      </p>
                      <p className="text-xs text-default-600">
                        {isLoadingWeather ? "Caricamento..." : weather.condition}
                      </p>
                    </div>
                    <div className="flex items-center justify-between w-full">
                      <span className="flex items-center gap-1 text-xs text-default-500">
                        <Icon icon="solar:map-point-bold" width={10} />
                        {weather.location}
                      </span>
                      <Button 
                        isIconOnly 
                        size="sm" 
                        variant="flat" 
                        color="primary"
                        onPress={() => setIsCitySelectorOpen(true)}
                        className="min-w-unit-6 w-6 h-6 opacity-70 hover:opacity-100 transition-opacity"
                        title="Cambia città"
                        isDisabled={isLoadingWeather}
                      >
                        <Icon icon="solar:map-point-search-bold-duotone" width={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
            {isEditMode && (
              <Button
                isIconOnly
                size="sm"
                color="danger"
                variant="solid"
                className="absolute top-2 right-2 z-10 shadow-lg widget-remove-button"
                onPress={() => handleRemoveWidget(widgetId)}
              >
                <Icon icon="solar:close-circle-bold" width={16} />
              </Button>
            )}
          </Card>
        );

      case "kpi":
        let kpiData: { title: string; value: string; icon: string; color: string; trend: number } = {
          title: "",
          value: "",
          icon: "",
          color: "",
          trend: 0
        };

        switch (widgetId) {
          case "kpi-value":
            kpiData = {
              title: "Valore Totale",
              value: formatCurrency(stats.totalValue),
              icon: "solar:box-bold-duotone",
              color: "primary",
              trend: stats.valueChange
            };
            break;
          case "kpi-products":
            kpiData = {
              title: "Prodotti Totali",
              value: formatNumber(stats.totalProducts),
              icon: "solar:widget-2-bold-duotone",
              color: "secondary",
              trend: stats.productsChange
            };
            break;
          case "kpi-movements":
            kpiData = {
              title: "Movimenti Mensili",
              value: formatNumber(stats.monthlyMovements),
              icon: "solar:double-alt-arrow-right-bold-duotone",
              color: "warning",
              trend: stats.movementsChange
            };
            break;
          case "kpi-efficiency":
            kpiData = {
              title: "Efficienza",
              value: `${stats.efficiency}%`,
              icon: "solar:chart-2-bold-duotone",
              color: "success",
              trend: stats.efficiencyChange
            };
            break;
        }

        return (
          <Card {...cardProps}>
            <CardBody className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="text-xs text-default-600 font-medium">{kpiData.title}</p>
                  <p className="text-lg font-bold">{kpiData.value}</p>
                </div>
                <div className={`p-2 bg-${kpiData.color}-100 dark:bg-${kpiData.color}-900/30 rounded-lg`}>
                  <Icon icon={kpiData.icon} className={`text-${kpiData.color} text-lg`} />
                </div>
              </div>
              <TrendIndicator value={kpiData.trend} />
            </CardBody>
            {isEditMode && (
              <Button
                isIconOnly
                size="sm"
                color="danger"
                variant="solid"
                className="absolute top-2 right-2 z-10 shadow-lg widget-remove-button"
                onPress={() => handleRemoveWidget(widgetId)}
              >
                <Icon icon="solar:close-circle-bold" width={16} />
              </Button>
            )}
          </Card>
        );

      case "warehouses-status":
        return (
          <Card {...cardProps}>
            <CardBody className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <Icon icon="solar:warehouse-bold-duotone" className="text-primary text-lg" />
                </div>
                <div>
                  <p className="text-xs text-default-600 font-medium">Magazzini</p>
                  <p className="text-lg font-bold">{stats.activeWarehouses}<span className="text-sm text-default-500">/{stats.totalWarehouses}</span></p>
                </div>
              </div>
              <Progress
                value={(stats.activeWarehouses / Math.max(stats.totalWarehouses, 1)) * 100}
                color="primary"
                size="sm"
                className="mb-2"
              />
              <p className="text-xs text-default-500">Strutture attive</p>
            </CardBody>
            {isEditMode && (
              <Button
                isIconOnly
                size="sm"
                color="danger"
                variant="solid"
                className="absolute top-2 right-2 z-10 shadow-lg widget-remove-button"
                onPress={() => handleRemoveWidget(widgetId)}
              >
                <Icon icon="solar:close-circle-bold" width={16} />
              </Button>
            )}
          </Card>
        );

      case "vehicles-status":
        return (
          <Card {...cardProps}>
            <CardBody className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-success-100 dark:bg-success-900/30 rounded-lg">
                  <Icon icon="solar:delivery-bold-duotone" className="text-success text-lg" />
                </div>
                <div>
                  <p className="text-xs text-default-600 font-medium">Veicoli</p>
                  <p className="text-lg font-bold">{stats.availableVehicles}<span className="text-sm text-default-500">/{stats.totalVehicles}</span></p>
                </div>
              </div>
              <Progress
                value={(stats.availableVehicles / Math.max(stats.totalVehicles, 1)) * 100}
                color="success"
                size="sm"
                className="mb-2"
              />
              <p className="text-xs text-default-500">Disponibili</p>
            </CardBody>
            {isEditMode && (
              <Button
                isIconOnly
                size="sm"
                color="danger"
                variant="solid"
                className="absolute top-2 right-2 z-10 shadow-lg widget-remove-button"
                onPress={() => handleRemoveWidget(widgetId)}
              >
                <Icon icon="solar:close-circle-bold" width={16} />
              </Button>
            )}
          </Card>
        );

      case "recent-activities":
        return (
          <Card {...cardProps}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-info-100 dark:bg-info-900/30 rounded-lg">
                  <Icon icon="solar:history-3-bold-duotone" className="text-info text-lg" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Attività Recenti</h3>
                </div>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="space-y-3">
                {recentActivities.slice(0, 4).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-2">
                    <div className={`p-1.5 rounded-lg shrink-0 ${
                      activity.type === "movement" ? "bg-primary-100 dark:bg-primary-900/30" :
                      activity.type === "delivery" ? "bg-success-100 dark:bg-success-900/30" :
                      activity.type === "order" ? "bg-warning-100 dark:bg-warning-900/30" :
                      "bg-danger-100 dark:bg-danger-900/30"
                    }`}>
                      <Icon
                        icon={
                          activity.type === "movement" ? "solar:double-alt-arrow-right-bold" :
                          activity.type === "delivery" ? "solar:delivery-bold" :
                          activity.type === "order" ? "solar:cart-check-bold" :
                          "solar:settings-bold"
                        }
                        className={
                          activity.type === "movement" ? "text-primary" :
                          activity.type === "delivery" ? "text-success" :
                          activity.type === "order" ? "text-warning" :
                          "text-danger"
                        }
                        width={14}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs">{activity.title}</p>
                      <p className="text-xs text-default-500 truncate">{activity.description}</p>
                      <p className="text-xs text-default-400">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
            {isEditMode && (
              <Button
                isIconOnly
                size="sm"
                color="danger"
                variant="solid"
                className="absolute top-2 right-2 z-10 shadow-lg widget-remove-button"
                onPress={() => handleRemoveWidget(widgetId)}
              >
                <Icon icon="solar:close-circle-bold" width={16} />
              </Button>
            )}
          </Card>
        );

      case "quick-actions":
        return (
          <Card {...cardProps}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <Icon icon="solar:lightning-bold-duotone" className="text-primary text-lg" />
                </div>
                <h3 className="text-sm font-semibold">Azioni</h3>
              </div>
            </CardHeader>
            <CardBody className="pt-0 space-y-2">
              <Button
                as={Link}
                to="/inventory/products/add"
                className="w-full justify-start h-10"
                variant="flat"
                color="primary"
                size="sm"
                startContent={<Icon icon="solar:box-plus-bold-duotone" width={16} />}
              >
                <span className="text-xs">Aggiungi Prodotto</span>
              </Button>
              <Button
                as={Link}
                to="/inventory/warehouse-movement"
                className="w-full justify-start h-10"
                variant="flat"
                color="secondary"
                size="sm"
                startContent={<Icon icon="solar:double-alt-arrow-right-bold-duotone" width={16} />}
              >
                <span className="text-xs">Registra Movimento</span>
              </Button>
              <Button
                as={Link}
                to="/suppliers"
                className="w-full justify-start h-10"
                variant="flat"
                color="success"
                size="sm"
                startContent={<Icon icon="solar:shop-2-bold-duotone" width={16} />}
              >
                <span className="text-xs">Gestisci Fornitori</span>
              </Button>
            </CardBody>
            {isEditMode && (
              <Button
                isIconOnly
                size="sm"
                color="danger"
                variant="solid"
                className="absolute top-2 right-2 z-10 shadow-lg widget-remove-button"
                onPress={() => handleRemoveWidget(widgetId)}
              >
                <Icon icon="solar:close-circle-bold" width={16} />
              </Button>
            )}
          </Card>
        );

      case "warehouses-list":
        return (
          <Card {...cardProps}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                    <Icon icon="solar:warehouse-bold-duotone" className="text-primary text-lg" />
                  </div>
                  <h3 className="text-sm font-semibold">Magazzini</h3>
                </div>
                <Button
                  as={Link}
                  to="/inventory/warehouses/add"
                  size="sm"
                  color="primary"
                  variant="light"
                  isIconOnly
                >
                  <Icon icon="solar:add-circle-bold" width={14} />
                </Button>
              </div>
            </CardHeader>
            <CardBody className="pt-0 space-y-2">
              {warehouses.slice(0, 3).map((warehouse) => (
                <div
                  key={warehouse.warehouse_id}
                  className="flex items-center gap-2 p-2 bg-default-50 dark:bg-default-100/10 rounded-lg hover:bg-default-100 dark:hover:bg-default-100/20 transition-colors cursor-pointer"
                  onClick={() => navigate(`/warehouses/${warehouse.WarehouseUUID || warehouse.warehouse_id}`)}
                >
                  <div className="p-1 bg-primary-100 dark:bg-primary-900/30 rounded-md">
                    <Icon icon="solar:warehouse-bold" className="text-primary" width={12} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs truncate">
                      {warehouse.WarehouseName || warehouse.name}
                    </p>
                  </div>
                  <Chip
                    size="sm"
                    color={warehouse.IsActive !== false ? "success" : "default"}
                    variant="flat"
                    className="text-xs"
                  >
                    {warehouse.IsActive !== false ? "ON" : "OFF"}
                  </Chip>
                </div>
              ))}
            </CardBody>
            {isEditMode && (
              <Button
                isIconOnly
                size="sm"
                color="danger"
                variant="solid"
                className="absolute top-2 right-2 z-10 shadow-lg widget-remove-button"
                onPress={() => handleRemoveWidget(widgetId)}
              >
                <Icon icon="solar:close-circle-bold" width={16} />
              </Button>
            )}
          </Card>
        );

      case "vehicles-list":
        return (
          <Card {...cardProps}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-success-100 dark:bg-success-900/30 rounded-lg">
                    <Icon icon="solar:delivery-bold-duotone" className="text-success text-lg" />
                  </div>
                  <h3 className="text-sm font-semibold">Veicoli</h3>
                </div>
                <Button
                  as={Link}
                  to="/inventory/vehicles/add"
                  size="sm"
                  color="success"
                  variant="light"
                  isIconOnly
                >
                  <Icon icon="solar:add-circle-bold" width={14} />
                </Button>
              </div>
            </CardHeader>
            <CardBody className="pt-0 space-y-2">
              {vehicles.slice(0, 3).map((vehicle) => (
                <div
                  key={vehicle.vehicle_id}
                  className="flex items-center gap-2 p-2 bg-default-50 dark:bg-default-100/10 rounded-lg hover:bg-default-100 dark:hover:bg-default-100/20 transition-colors cursor-pointer"
                  onClick={() => navigate(`/inventory/vehicles/edit/${vehicle.vehicle_id}`)}
                >
                  <div className={`p-1 rounded-md ${
                    vehicle.status === "Available"
                      ? "bg-success-100 dark:bg-success-900/30"
                      : vehicle.status === "In use"
                      ? "bg-warning-100 dark:bg-warning-900/30"
                      : "bg-default-200 dark:bg-default-700"
                  }`}>
                    <Icon
                      icon="solar:delivery-bold"
                      className={
                        vehicle.status === "Available"
                          ? "text-success"
                          : vehicle.status === "In use"
                          ? "text-warning"
                          : "text-default-600"
                      }
                      width={12}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs">{vehicle.license_plate}</p>
                  </div>
                  <Chip
                    size="sm"
                    color={
                      vehicle.status === "Available"
                        ? "success"
                        : vehicle.status === "In use"
                        ? "warning"
                        : "default"
                    }
                    variant="flat"
                    className="text-xs"
                  >
                    {vehicle.status === "Available"
                      ? "Libero"
                      : vehicle.status === "In use"
                      ? "Attivo"
                      : "Service"}
                  </Chip>
                </div>
              ))}
            </CardBody>
            {isEditMode && (
              <Button
                isIconOnly
                size="sm"
                color="danger"
                variant="solid"
                className="absolute top-2 right-2 z-10 shadow-lg widget-remove-button"
                onPress={() => handleRemoveWidget(widgetId)}
              >
                <Icon icon="solar:close-circle-bold" width={16} />
              </Button>
            )}
          </Card>
        );

      case "critical-products":
        return (
          <Card {...cardProps}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-danger-100 dark:bg-danger-900/30 rounded-lg">
                    <Icon icon="solar:danger-triangle-bold-duotone" className="text-danger text-lg" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Prodotti Critici</h3>
                    <p className="text-xs text-default-500">{lowStockProducts.length} prodotti</p>
                  </div>
                </div>
                <Button
                  as={Link}
                  to="/suppliers"
                  size="sm"
                  color="danger"
                  variant="flat"
                  startContent={<Icon icon="solar:letter-bold" width={12} />}
                >
                  <span className="text-xs">Contatta</span>
                </Button>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              {lowStockProducts.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {lowStockProducts.slice(0, 4).map((product) => (
                    <div
                      key={product.product_id}
                      className="p-2 bg-danger-50 dark:bg-danger-900/10 rounded-lg border border-danger-200 dark:border-danger-800"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="p-1 bg-danger-100 dark:bg-danger-900/30 rounded-lg">
                          <Icon icon="solar:box-minimalistic-bold" className="text-danger" width={12} />
                        </div>
                        <Chip size="sm" color="danger" variant="flat" className="text-xs">
                          {product.stock_quantity}/{product.minimum_stock}
                        </Chip>
                      </div>
                      <p className="font-medium text-xs truncate">{product.name}</p>
                      <p className="text-xs text-default-500">SKU: {product.sku}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Icon icon="solar:check-circle-bold-duotone" className="text-success text-3xl mb-2" />
                  <p className="text-xs text-success">Tutto sotto controllo!</p>
                </div>
              )}
            </CardBody>
            {isEditMode && (
              <Button
                isIconOnly
                size="sm"
                color="danger"
                variant="solid"
                className="absolute top-2 right-2 z-10 shadow-lg widget-remove-button"
                onPress={() => handleRemoveWidget(widgetId)}
              >
                <Icon icon="solar:close-circle-bold" width={16} />
              </Button>
            )}
                     </Card>
         );

      case "clock-only":
        return (
          <Card {...cardProps}>
            <CardBody className="p-4">
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl mb-2">
                  <Icon icon="solar:clock-circle-bold-duotone" className="text-primary text-2xl" />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold font-mono">{formatTime(currentTime)}</p>
                  <p className="text-xs text-default-600 capitalize">{formatDate(currentTime)}</p>
                </div>
              </div>
            </CardBody>
            {isEditMode && (
              <Button
                isIconOnly
                size="sm"
                color="danger"
                variant="solid"
                className="absolute top-2 right-2 z-10 shadow-lg widget-remove-button"
                onPress={() => handleRemoveWidget(widgetId)}
              >
                <Icon icon="solar:close-circle-bold" width={16} />
              </Button>
            )}
          </Card>
        );

      case "weather-detailed":
        return (
          <Card {...cardProps}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-warning-100 dark:bg-warning-900/30 rounded-lg">
                  <Icon icon={weather.icon} className="text-warning text-lg" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Meteo</h3>
                  <p className="text-xs text-default-500">{weather.location}</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-3xl font-bold">{weather.temperature}°C</p>
                  <p className="text-sm text-default-600">{weather.condition}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Icon icon="solar:drop-bold" className="text-blue-500" width={16} />
                    <div>
                      <p className="text-xs text-default-500">Umidità</p>
                      <p className="text-sm font-semibold">{weather.humidity}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon icon="solar:wind-bold" className="text-gray-500" width={16} />
                    <div>
                      <p className="text-xs text-default-500">Vento</p>
                      <p className="text-sm font-semibold">{weather.windSpeed} km/h</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
            {isEditMode && (
              <Button
                isIconOnly
                size="sm"
                color="danger"
                variant="solid"
                className="absolute top-2 right-2 z-10 shadow-lg widget-remove-button"
                onPress={() => handleRemoveWidget(widgetId)}
              >
                <Icon icon="solar:close-circle-bold" width={16} />
              </Button>
            )}
          </Card>
        );

      case "mini-calendar":
        const today = new Date();
        const daysInMonth = getDaysInMonth(today);
        const firstDayOfWeek = getFirstDayOfMonth(today);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const emptyDays = Array.from({ length: firstDayOfWeek }, (_, i) => i);

        return (
          <Card {...cardProps}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg">
                  <Icon icon="solar:calendar-bold-duotone" className="text-secondary text-lg" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">
                    {today.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                  </h3>
                </div>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="grid grid-cols-7 gap-1 text-center">
                {[
                  { key: 'D', label: 'D' },
                  { key: 'L', label: 'L' },
                  { key: 'M1', label: 'M' },
                  { key: 'M2', label: 'M' },
                  { key: 'G', label: 'G' },
                  { key: 'V', label: 'V' },
                  { key: 'S', label: 'S' },
                ].map(({ key, label }) => (
                  <div key={key} className="text-xs font-semibold text-default-500 py-1">
                    {label}
                  </div>
                ))}
                {emptyDays.map(day => (
                  <div key={`empty-${day}`} className="h-6"></div>
                ))}
                {days.map(day => (
                  <div
                    key={day}
                    className={`h-6 flex items-center justify-center text-xs rounded ${
                      day === today.getDate()
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : 'hover:bg-default-100 dark:hover:bg-default-200'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </CardBody>
            {isEditMode && (
              <Button
                isIconOnly
                size="sm"
                color="danger"
                variant="solid"
                className="absolute top-2 right-2 z-10 shadow-lg widget-remove-button"
                onPress={() => handleRemoveWidget(widgetId)}
              >
                <Icon icon="solar:close-circle-bold" width={16} />
              </Button>
            )}
          </Card>
        );

      case "quick-notes":
        return (
          <Card {...cardProps}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-warning-100 dark:bg-warning-900/30 rounded-lg">
                  <Icon icon="solar:notes-bold-duotone" className="text-warning text-lg" />
                </div>
                <h3 className="text-sm font-semibold">Note Rapide</h3>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <textarea
                value={quickNotes}
                onChange={(e) => saveNotes(e.target.value)}
                placeholder="Scrivi le tue note qui..."
                className="w-full h-full resize-none bg-transparent border-none outline-none text-sm"
                style={{ minHeight: '120px' }}
              />
            </CardBody>
            {isEditMode && (
              <Button
                isIconOnly
                size="sm"
                color="danger"
                variant="solid"
                className="absolute top-2 right-2 z-10 shadow-lg widget-remove-button"
                onPress={() => handleRemoveWidget(widgetId)}
              >
                <Icon icon="solar:close-circle-bold" width={16} />
              </Button>
            )}
          </Card>
        );

      case "system-status":
        return (
          <Card {...cardProps}>
            <CardBody className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-success-100 dark:bg-success-900/30 rounded-lg">
                  <Icon icon="solar:server-bold-duotone" className="text-success text-lg" />
                </div>
                <div>
                  <p className="text-xs text-default-600 font-medium">Sistema</p>
                  <p className="text-lg font-bold">Online</p>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>CPU</span>
                    <span>{systemStatus.cpu}%</span>
                  </div>
                  <Progress value={systemStatus.cpu} color="primary" size="sm" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>RAM</span>
                    <span>{systemStatus.memory}%</span>
                  </div>
                  <Progress value={systemStatus.memory} color="warning" size="sm" />
                </div>
                <p className="text-xs text-default-500 mt-2">Uptime: {systemStatus.uptime}</p>
              </div>
            </CardBody>
            {isEditMode && (
              <Button
                isIconOnly
                size="sm"
                color="danger"
                variant="solid"
                className="absolute top-2 right-2 z-10 shadow-lg widget-remove-button"
                onPress={() => handleRemoveWidget(widgetId)}
              >
                <Icon icon="solar:close-circle-bold" width={16} />
              </Button>
            )}
          </Card>
        );

      case "notifications":
        const unreadCount = notifications.filter(n => !n.read).length;
        return (
          <Card {...cardProps}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-danger-100 dark:bg-danger-900/30 rounded-lg">
                    <Icon icon="solar:bell-bold-duotone" className="text-danger text-lg" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Notifiche</h3>
                    <p className="text-xs text-default-500">{unreadCount} non lette</p>
                  </div>
                </div>
                {unreadCount > 0 && (
                  <Chip size="sm" color="danger" variant="flat">
                    {unreadCount}
                  </Chip>
                )}
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="space-y-2">
                {notifications.slice(0, 4).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-2 rounded-lg border ${
                      notification.read
                        ? 'bg-default-50 dark:bg-default-100/10 border-default-200'
                        : 'bg-primary-50 dark:bg-primary-900/10 border-primary-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`p-1 rounded ${
                        notification.type === 'warning' ? 'bg-warning-100 dark:bg-warning-900/30' :
                        notification.type === 'success' ? 'bg-success-100 dark:bg-success-900/30' :
                        'bg-info-100 dark:bg-info-900/30'
                      }`}>
                        <Icon
                          icon={
                            notification.type === 'warning' ? 'solar:danger-triangle-bold' :
                            notification.type === 'success' ? 'solar:check-circle-bold' :
                            'solar:info-circle-bold'
                          }
                          className={
                            notification.type === 'warning' ? 'text-warning' :
                            notification.type === 'success' ? 'text-success' :
                            'text-info'
                          }
                          width={12}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs">{notification.title}</p>
                        <p className="text-xs text-default-500 truncate">{notification.message}</p>
                        <p className="text-xs text-default-400">{notification.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
            {isEditMode && (
              <Button
                isIconOnly
                size="sm"
                color="danger"
                variant="solid"
                className="absolute top-2 right-2 z-10 shadow-lg widget-remove-button"
                onPress={() => handleRemoveWidget(widgetId)}
              >
                <Icon icon="solar:close-circle-bold" width={16} />
              </Button>
            )}
          </Card>
        );

      case "timer-stopwatch":
        return (
          <Card {...cardProps}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-info-100 dark:bg-info-900/30 rounded-lg">
                  <Icon icon="solar:stopwatch-bold-duotone" className="text-info text-lg" />
                </div>
                <h3 className="text-sm font-semibold">Timer</h3>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="text-center space-y-3">
                <div className="text-2xl font-bold font-mono">
                  {formatTimerTime(timerTime)}
                </div>
                <div className="flex gap-2 justify-center">
                  <Button
                    size="sm"
                    color={isTimerRunning ? "danger" : "success"}
                    variant="flat"
                    onPress={() => setIsTimerRunning(!isTimerRunning)}
                  >
                    <Icon
                      icon={isTimerRunning ? "solar:pause-bold" : "solar:play-bold"}
                      width={14}
                    />
                  </Button>
                  <Button
                    size="sm"
                    color="default"
                    variant="flat"
                    onPress={() => {
                      setTimerTime(0);
                      setIsTimerRunning(false);
                    }}
                  >
                    <Icon icon="solar:restart-bold" width={14} />
                  </Button>
                </div>
              </div>
            </CardBody>
            {isEditMode && (
              <Button
                isIconOnly
                size="sm"
                color="danger"
                variant="solid"
                className="absolute top-2 right-2 z-10 shadow-lg widget-remove-button"
                onPress={() => handleRemoveWidget(widgetId)}
              >
                <Icon icon="solar:close-circle-bold" width={16} />
              </Button>
            )}
          </Card>
        );

      case "quick-links":
        return (
          <Card {...cardProps}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-info-100 dark:bg-info-900/30 rounded-lg">
                  <Icon icon="solar:link-bold-duotone" className="text-info text-lg" />
                </div>
                <h3 className="text-sm font-semibold">Link Rapidi</h3>
              </div>
            </CardHeader>
            <CardBody className="pt-0 space-y-2">
              {quickLinks.map((link, index) => (
                <Button
                  key={index}
                  as={Link}
                  to={link.url}
                  className="w-full justify-start h-10"
                  variant="flat"
                  color={link.color as any}
                  size="sm"
                  startContent={<Icon icon={link.icon} width={16} />}
                >
                  <span className="text-xs">{link.name}</span>
                </Button>
              ))}
            </CardBody>
            {isEditMode && (
              <Button
                isIconOnly
                size="sm"
                color="danger"
                variant="solid"
                className="absolute top-2 right-2 z-10 shadow-lg widget-remove-button"
                onPress={() => handleRemoveWidget(widgetId)}
              >
                <Icon icon="solar:close-circle-bold" width={16} />
              </Button>
            )}
          </Card>
        );

      case "exchange-rates":
        return (
          <Card {...cardProps}>
            <CardBody className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-success-100 dark:bg-success-900/30 rounded-lg">
                  <Icon icon="solar:dollar-minimalistic-bold-duotone" className="text-success text-lg" />
                </div>
                <div>
                  <p className="text-xs text-default-600 font-medium">Cambi</p>
                  <p className="text-lg font-bold">EUR</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold">USD</span>
                  <span className="text-xs">{exchangeRates.usd}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold">GBP</span>
                  <span className="text-xs">{exchangeRates.gbp}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold">CHF</span>
                  <span className="text-xs">{exchangeRates.chf}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold">JPY</span>
                  <span className="text-xs">{exchangeRates.jpy}</span>
                </div>
              </div>
            </CardBody>
            {isEditMode && (
              <Button
                isIconOnly
                size="sm"
                color="danger"
                variant="solid"
                className="absolute top-2 right-2 z-10 shadow-lg widget-remove-button"
                onPress={() => handleRemoveWidget(widgetId)}
              >
                <Icon icon="solar:close-circle-bold" width={16} />
              </Button>
            )}
          </Card>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="w-full flex-1 flex flex-col p-6 gap-6">
        <PageHeader
          title="Dashboard"
          description="Caricamento panoramica sistema..."
          icon="solar:home-2-bold-duotone"
          size="md"
        />
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background p-6 gap-6">
      {/* Header con controlli */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <PageHeader
          title="Dashboard Configurabile"
          description={isEditMode ? "Modalità modifica: trascina e ridimensiona i widget" : "Dashboard personalizzata"}
          icon="solar:home-2-bold-duotone"
          size="md"
        />
        
        <div className="flex items-center gap-3">
          {isEditMode && (
            <Button
              size="sm"
              color="primary"
              variant="flat"
              onPress={onOpen}
              startContent={<Icon icon="solar:add-circle-bold" width={16} />}
            >
              Aggiungi Widget
            </Button>
          )}
          
          <Dropdown>
            <DropdownTrigger>
              <Button
                size="sm"
                color="default"
                variant="flat"
                endContent={<Icon icon="solar:settings-bold" width={16} />}
              >
                Configurazione
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Azioni dashboard">
              <DropdownItem
                key="edit"
                startContent={<Icon icon="solar:pen-bold" width={16} />}
                onPress={() => setIsEditMode(!isEditMode)}
              >
                {isEditMode ? "Esci da modifica" : "Modalità modifica"}
              </DropdownItem>
              <DropdownItem
                key="reset"
                startContent={<Icon icon="solar:restart-bold" width={16} />}
                onPress={resetConfiguration}
                className="text-warning"
              >
                Reset configurazione
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* Grid configurabile */}
      <div className="flex-1">
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          onLayoutChange={onLayoutChange}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={60}
          margin={[16, 16]}
          containerPadding={[0, 0]}
          isDraggable={isEditMode}
          isResizable={isEditMode}
          compactType="vertical"
          preventCollision={false}
          draggableCancel=".widget-remove-button"
        >
          {activeWidgets.map((widgetId) => (
            <div key={widgetId} className="relative">
              {renderWidget(widgetId)}
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>

      {/* Modal per aggiungere widget */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold">Aggiungi Widget</h3>
            <p className="text-sm text-default-500">Seleziona i widget da aggiungere alla tua dashboard</p>
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {AVAILABLE_WIDGETS.filter(widget => !activeWidgets.includes(widget.id)).map((widget) => (
                <Card
                  key={widget.id}
                  isPressable
                  onPress={() => addWidget(widget.id)}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardBody className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                                                 <Icon 
                           icon={
                             widget.type === "clock-weather" ? "solar:clock-circle-bold-duotone" :
                             widget.type === "clock-only" ? "solar:clock-circle-bold-duotone" :
                             widget.type === "weather-detailed" ? "solar:cloud-sun-bold-duotone" :
                             widget.type === "mini-calendar" ? "solar:calendar-bold-duotone" :
                             widget.type === "quick-notes" ? "solar:notes-bold-duotone" :
                             widget.type === "system-status" ? "solar:server-bold-duotone" :
                             widget.type === "notifications" ? "solar:bell-bold-duotone" :
                             widget.type === "timer-stopwatch" ? "solar:stopwatch-bold-duotone" :
                             widget.type === "quick-links" ? "solar:link-bold-duotone" :
                             widget.type === "exchange-rates" ? "solar:dollar-minimalistic-bold-duotone" :
                             widget.type === "kpi" ? "solar:chart-square-bold-duotone" :
                             widget.type === "warehouses-status" ? "solar:warehouse-bold-duotone" :
                             widget.type === "vehicles-status" ? "solar:delivery-bold-duotone" :
                             widget.type === "recent-activities" ? "solar:history-3-bold-duotone" :
                             widget.type === "quick-actions" ? "solar:lightning-bold-duotone" :
                             widget.type === "warehouses-list" ? "solar:warehouse-bold-duotone" :
                             widget.type === "vehicles-list" ? "solar:delivery-bold-duotone" :
                             widget.type === "critical-products" ? "solar:danger-triangle-bold-duotone" :
                             "solar:widget-bold-duotone"
                           }
                           className="text-primary text-xl" 
                         />
                      </div>
                      <div>
                        <h4 className="font-semibold">{widget.title}</h4>
                        <p className="text-xs text-default-500">
                          {widget.size.w}×{widget.size.h} - {widget.type.replace('-', ' ')}
                        </p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
            
            {AVAILABLE_WIDGETS.filter(widget => !activeWidgets.includes(widget.id)).length === 0 && (
              <div className="text-center py-8">
                <Icon icon="solar:widget-bold-duotone" className="text-4xl text-default-400 mb-2" />
                <p className="text-default-500">Tutti i widget disponibili sono già stati aggiunti</p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={onClose}>
              Chiudi
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Selettore città per il widget meteo */}
      <CitySelector
        isOpen={isCitySelectorOpen}
        onClose={() => setIsCitySelectorOpen(false)}
        onCitySelect={handleCitySelect}
        currentCity={selectedCity}
      />
    </div>
  );
}
