"use client";

import { Icon } from "@iconify/react";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Chip,
  Progress,
  Divider,
  Spinner,
} from "@heroui/react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import PageHeader from "../../Components/Layout/PageHeader";

// Interfaces basate sulle API reali del progetto
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

interface DashboardStats {
  totalWarehouses: number;
  activeWarehouses: number;
  totalVehicles: number;
  availableVehicles: number;
  vehiclesInUse: number;
  vehiclesInMaintenance: number;
  lowStockProducts: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>(
    []
  );
  const [stats, setStats] = useState<DashboardStats>({
    totalWarehouses: 0,
    activeWarehouses: 0,
    totalVehicles: 0,
    availableVehicles: 0,
    vehiclesInUse: 0,
    vehiclesInMaintenance: 0,
    lowStockProducts: 0,
  });

  // Caricamento dati dal backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Carica magazzini
        const warehousesResponse = await axios.get(
          "/Warehouse/GET/GetAllWarehouses"
        );
        const warehousesData = warehousesResponse.data || [];
        setWarehouses(warehousesData);

        // Carica veicoli
        const vehiclesResponse = await axios.get(
          "/Vehicle/GET/GetAllVehicles",
          {
            withCredentials: true,
          }
        );
        const vehiclesData = vehiclesResponse.data || [];

        // Elabora i dati dei veicoli per determinare lo stato
        const processedVehicles = await Promise.all(
          vehiclesData.map(async (vehicle: any) => {
            let status: "Available" | "In use" | "Maintenance" = "Maintenance";
            let assignedUser = undefined;
            let position = "Posizione non disponibile";

            // Recupera l'utente assegnato se presente
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
                console.log(
                  `Nessun utente assegnato al veicolo ${vehicle.vehicle_id}`
                );
              }
            }

            // Determina lo stato basato sulla posizione
            if (vehicle.location && vehicle.location !== "N/A") {
              const [lat, lng] = vehicle.location.split(" ").map(Number);
              if (lat && lng) {
                // Logica semplificata per determinare se è in deposito o in uso
                // In una vera implementazione, calcoleresti la distanza dal deposito
                status = Math.random() > 0.5 ? "Available" : "In use";
                position =
                  status === "Available" ? "In deposito" : "In consegna";
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
          const lowStockResponse = await axios.get(
            "/Product/GET/GetLowStockProducts"
          );
          setLowStockProducts(lowStockResponse.data || []);
        } catch (error) {
          console.error(
            "Errore nel caricamento prodotti con bassa giacenza:",
            error
          );
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

        setStats({
          totalWarehouses: warehousesData.length,
          activeWarehouses,
          totalVehicles: processedVehicles.length,
          availableVehicles,
          vehiclesInUse,
          vehiclesInMaintenance,
          lowStockProducts: lowStockProducts.length,
        });
      } catch (error) {
        console.error("Errore nel caricamento dati dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();

    // Aggiorna i dati ogni 2 minuti
    const interval = setInterval(fetchDashboardData, 120000);
    return () => clearInterval(interval);
  }, []);

  // Format numbers
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("it-IT").format(num);
  };

  if (isLoading) {
    return (
      <div className="w-full flex-1 flex flex-col p-4 gap-6">
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
    <div className="w-full flex-1 flex flex-col p-4 gap-6">
      <PageHeader
        title="Dashboard Operativa"
        description="Vista generale di magazzini, flotta e operazioni"
        icon="solar:home-2-bold-duotone"
        size="md"
      />

      {/* Statistiche Rapide */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-default-600">Magazzini Attivi</p>
              <p className="text-2xl font-bold">
                {stats.activeWarehouses}/{stats.totalWarehouses}
              </p>
            </div>
            <div className="bg-primary-100 p-3 rounded-full">
              <Icon
                icon="solar:warehouse-bold-duotone"
                className="text-primary text-xl"
              />
            </div>
          </div>
          <Progress
            value={
              (stats.activeWarehouses / Math.max(stats.totalWarehouses, 1)) *
              100
            }
            color="primary"
            className="mt-2"
            size="sm"
          />
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-default-600">Veicoli Disponibili</p>
              <p className="text-2xl font-bold">
                {stats.availableVehicles}/{stats.totalVehicles}
              </p>
            </div>
            <div className="bg-success-100 p-3 rounded-full">
              <Icon
                icon="solar:delivery-bold-duotone"
                className="text-success text-xl"
              />
            </div>
          </div>
          <Progress
            value={
              (stats.availableVehicles / Math.max(stats.totalVehicles, 1)) * 100
            }
            color="success"
            className="mt-2"
            size="sm"
          />
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-default-600">Veicoli in Uso</p>
              <p className="text-2xl font-bold">{stats.vehiclesInUse}</p>
            </div>
            <div className="bg-warning-100 p-3 rounded-full">
              <Icon
                icon="solar:course-up-bold-duotone"
                className="text-warning text-xl"
              />
            </div>
          </div>
          <div className="mt-2 text-xs text-default-500">
            + {stats.vehiclesInMaintenance} in manutenzione
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-default-600">Prodotti Critici</p>
              <p className="text-2xl font-bold text-danger">
                {stats.lowStockProducts}
              </p>
            </div>
            <div className="bg-danger-100 p-3 rounded-full">
              <Icon
                icon="solar:danger-triangle-bold-duotone"
                className="text-danger text-xl"
              />
            </div>
          </div>
          <Button
            size="sm"
            color="danger"
            variant="light"
            className="mt-2 h-6 text-xs"
            onPress={() => navigate("/suppliers")}
          >
            Gestisci ora
          </Button>
        </Card>
      </div>

      {/* Layout Principale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Magazzini */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex justify-between">
            <div>
              <h3 className="text-lg font-semibold">Magazzini</h3>
              <p className="text-sm text-default-500">
                {stats.totalWarehouses} totali
              </p>
            </div>
            <Button
              as={Link}
              to="/inventory/warehouses/add"
              size="sm"
              color="primary"
              variant="light"
              startContent={<Icon icon="solar:add-circle-bold" width={16} />}
            >
              Nuovo
            </Button>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="space-y-3">
              {warehouses.slice(0, 4).map((warehouse) => (
                <div
                  key={warehouse.warehouse_id}
                  className="flex items-center justify-between p-3 bg-default-50 rounded-lg hover:bg-default-100 transition-colors cursor-pointer"
                  onClick={() =>
                    navigate(
                      `/warehouses/${
                        warehouse.WarehouseUUID || warehouse.warehouse_id
                      }`
                    )
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary-100 p-2 rounded-lg">
                      <Icon
                        icon="solar:warehouse-bold"
                        className="text-primary"
                        width={20}
                      />
                    </div>
                    <div>
                      <p className="font-medium">
                        {warehouse.WarehouseName || warehouse.name}
                      </p>
                      <p className="text-xs text-default-500">
                        {warehouse.WarehouseCode &&
                          `${warehouse.WarehouseCode} • `}
                        {warehouse.location || warehouse.WarehouseAdress}
                      </p>
                    </div>
                  </div>
                  <Chip
                    size="sm"
                    color={warehouse.IsActive !== false ? "success" : "default"}
                    variant="flat"
                  >
                    {warehouse.IsActive !== false ? "Attivo" : "Inattivo"}
                  </Chip>
                </div>
              ))}
              {warehouses.length > 4 && (
                <Button
                  as={Link}
                  to="/warehouses"
                  variant="light"
                  className="w-full mt-2"
                  size="sm"
                >
                  Vedi tutti ({warehouses.length})
                </Button>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Flotta Veicoli */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex justify-between">
            <div>
              <h3 className="text-lg font-semibold">Flotta Veicoli</h3>
              <p className="text-sm text-default-500">
                {stats.availableVehicles} disponibili • {stats.vehiclesInUse} in
                uso • {stats.vehiclesInMaintenance} in manutenzione
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                as={Link}
                to="/inventory/vehicles"
                size="sm"
                variant="light"
                startContent={<Icon icon="solar:eye-bold" width={16} />}
              >
                Vista Mappa
              </Button>
              <Button
                as={Link}
                to="/inventory/vehicles/add"
                size="sm"
                color="primary"
                startContent={<Icon icon="solar:add-circle-bold" width={16} />}
              >
                Nuovo
              </Button>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {vehicles.slice(0, 6).map((vehicle) => (
                <div
                  key={vehicle.vehicle_id}
                  className="flex items-center gap-3 p-3 bg-default-50 rounded-lg hover:bg-default-100 transition-colors cursor-pointer"
                  onClick={() =>
                    navigate(`/inventory/vehicles/edit/${vehicle.vehicle_id}`)
                  }
                >
                  <div
                    className={`p-2 rounded-lg ${
                      vehicle.status === "Available"
                        ? "bg-success-100"
                        : vehicle.status === "In use"
                        ? "bg-warning-100"
                        : "bg-default-200"
                    }`}
                  >
                    <Icon
                      icon="solar:delivery-bold"
                      className={
                        vehicle.status === "Available"
                          ? "text-success"
                          : vehicle.status === "In use"
                          ? "text-warning"
                          : "text-default-600"
                      }
                      width={20}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">
                        {vehicle.license_plate}
                      </p>
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
                      >
                        {vehicle.status === "Available"
                          ? "Disponibile"
                          : vehicle.status === "In use"
                          ? "In uso"
                          : "Manutenzione"}
                      </Chip>
                    </div>
                    <p className="text-xs text-default-500 truncate">
                      {vehicle.name} • {vehicle.assignedUser || "Non assegnato"}
                    </p>
                    <p className="text-xs text-default-400 truncate">
                      {vehicle.position}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {vehicles.length > 6 && (
              <Button
                as={Link}
                to="/inventory/vehicles"
                variant="light"
                className="w-full mt-4"
                size="sm"
              >
                Vedi tutti i veicoli ({vehicles.length})
              </Button>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Azioni Rapide e Prodotti Critici */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Azioni Rapide */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Azioni Rapide</h3>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="grid grid-cols-2 gap-3">
              <Button
                as={Link}
                to="/inventory/products/add"
                className="h-20 flex-col gap-2"
                variant="bordered"
                color="primary"
              >
                <Icon icon="solar:box-plus-bold-duotone" className="text-2xl" />
                <span className="text-sm">Aggiungi Prodotto</span>
              </Button>

              <Button
                as={Link}
                to="/inventory/warehouse-movement"
                className="h-20 flex-col gap-2"
                variant="bordered"
                color="secondary"
              >
                <Icon
                  icon="solar:double-alt-arrow-right-bold-duotone"
                  className="text-2xl"
                />
                <span className="text-sm">Registra Movimento</span>
              </Button>

              <Button
                as={Link}
                to="/suppliers"
                className="h-20 flex-col gap-2"
                variant="bordered"
                color="success"
              >
                <Icon icon="solar:shop-2-bold-duotone" className="text-2xl" />
                <span className="text-sm">Gestisci Fornitori</span>
              </Button>

              <Button
                as={Link}
                to="/analytics"
                className="h-20 flex-col gap-2"
                variant="bordered"
                color="warning"
              >
                <Icon icon="solar:chart-2-bold-duotone" className="text-2xl" />
                <span className="text-sm">Analytics</span>
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Prodotti con Bassa Giacenza */}
        <Card>
          <CardHeader className="flex justify-between">
            <div>
              <h3 className="text-lg font-semibold">Prodotti Critici</h3>
              <p className="text-sm text-default-500">
                {lowStockProducts.length} prodotti richiedono attenzione
              </p>
            </div>
            <Button
              as={Link}
              to="/suppliers"
              size="sm"
              color="danger"
              variant="light"
              startContent={<Icon icon="solar:letter-bold" width={16} />}
            >
              Contatta Fornitori
            </Button>
          </CardHeader>
          <CardBody className="pt-0">
            {lowStockProducts.length > 0 ? (
              <div className="space-y-2">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.product_id}
                    className="flex items-center justify-between p-2 bg-danger-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-default-500">
                        SKU: {product.sku}
                      </p>
                      {product.supplier_name && (
                        <p className="text-xs text-default-400">
                          {product.supplier_name}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <Chip size="sm" color="danger" variant="flat">
                        {product.stock_quantity}/{product.minimum_stock}
                      </Chip>
                    </div>
                  </div>
                ))}
                {lowStockProducts.length > 5 && (
                  <Button
                    as={Link}
                    to="/inventory/products"
                    variant="light"
                    size="sm"
                    className="w-full mt-2"
                  >
                    Vedi tutti ({lowStockProducts.length})
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-default-500">
                <Icon
                  icon="solar:check-circle-bold-duotone"
                  className="text-4xl text-success mb-2"
                />
                <p>Tutti i prodotti hanno scorte sufficienti!</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
