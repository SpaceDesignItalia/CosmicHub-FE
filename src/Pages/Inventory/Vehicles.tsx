import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import VehicleCard from "../../Components/Inventory/VehicleCard";
import VehicleMap from "../../Components/Inventory/VehicleMap";
import {
  Input,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Chip,
  Divider,
} from "@heroui/react";

// Data types
interface Vehicle {
  id: string;
  plate: string;
  model: string;
  type: "Large Van" | "Small Van";
  capacity: number;
  status: "Available" | "In use" | "Maintenance";
  lastCheck: string;
  usedCapacity?: number;
  position?: string;
  travelTime?: string;
  eta?: string;
  coordinates?: { lat: number; lng: number };
  deliveryPoints?: { address: string; time: string }[];
}

export default function Vehicles() {
  const [searchVehicle, setSearchVehicle] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Example data
  const vehicles: Vehicle[] = [
    {
      id: "1",
      plate: "AB123CD",
      model: "Iveco Daily",
      type: "Large Van",
      capacity: 3500,
      status: "Available",
      lastCheck: "2023-09-15",
    },
    {
      id: "2",
      plate: "EF456GH",
      model: "Fiat Ducato",
      type: "Large Van",
      capacity: 2800,
      status: "In use",
      lastCheck: "2023-08-22",
      usedCapacity: 75,
      position: "Via Roma, Milan",
      travelTime: "01:38:47",
      eta: "14:30",
      coordinates: { lat: 45.4642, lng: 9.19 },
      deliveryPoints: [
        { address: "Via Torino 25, Milan", time: "13:45" },
        { address: "Corso Venezia 12, Milan", time: "14:15" },
      ],
    },
    {
      id: "3",
      plate: "IL789MN",
      model: "Mercedes Sprinter",
      type: "Large Van",
      capacity: 3000,
      status: "Maintenance",
      lastCheck: "2023-07-10",
    },
    {
      id: "4",
      plate: "OP012QR",
      model: "Renault Kangoo",
      type: "Small Van",
      capacity: 1500,
      status: "Available",
      lastCheck: "2023-10-05",
    },
    {
      id: "5",
      plate: "ST345UV",
      model: "Fiat Ducato XL",
      type: "Large Van",
      capacity: 3200,
      status: "In use",
      lastCheck: "2023-11-12",
      usedCapacity: 82,
      position: "Via Napoli, Rome",
      travelTime: "00:55:23",
      eta: "15:45",
      coordinates: { lat: 41.9028, lng: 12.4964 },
      deliveryPoints: [
        { address: "Via del Corso 12, Rome", time: "15:15" },
        { address: "Via Veneto 45, Rome", time: "16:00" },
      ],
    },
    {
      id: "6",
      plate: "WX678YZ",
      model: "Peugeot Partner",
      type: "Small Van",
      capacity: 1300,
      status: "In use",
      lastCheck: "2023-10-25",
      usedCapacity: 45,
      position: "Via Torino, Florence",
      travelTime: "02:17:35",
      eta: "16:10",
      coordinates: { lat: 43.7696, lng: 11.2558 },
      deliveryPoints: [
        { address: "Piazza della Signoria, Florence", time: "15:30" },
        { address: "Via dei Calzaiuoli 8, Florence", time: "16:15" },
      ],
    },
  ];

  // Filter vehicles
  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchSearch =
      vehicle.model.toLowerCase().includes(searchVehicle.toLowerCase()) ||
      vehicle.plate.toLowerCase().includes(searchVehicle.toLowerCase());
    const matchType =
      selectedType === "All" || vehicle.type === selectedType;
    return matchSearch && matchType;
  });

  const vehicleTypes = ["All", "Large Van", "Small Van"];

  // Handle vehicle click
  const selectVehicle = useCallback((vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
  }, []);

  // Select first vehicle on mount
  useEffect(() => {
    if (filteredVehicles.length > 0 && !selectedVehicle) {
      setSelectedVehicle(filteredVehicles[0]);
    }
  }, []);

  // Reset selection when filters change
  useEffect(() => {
    if (filteredVehicles.length === 0) {
      setSelectedVehicle(null);
    } else if (
      selectedVehicle &&
      !filteredVehicles.some((v) => v.id === selectedVehicle.id)
    ) {
      setSelectedVehicle(filteredVehicles[0]);
    }
  }, [searchVehicle, selectedType, filteredVehicles]);

  return (
    <div className="w-full flex-1 flex flex-col p-5 gap-5 bg-zinc-50 dark:bg-zinc-950">
      {/* Header with title and filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
            <Icon icon="mdi:truck" className="text-blue-700 dark:text-blue-300" width={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Vehicle Tracking
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Monitor the real-time status of all vehicles
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search by plate or model..."
            startContent={
              <Icon
                icon="solar:magnifer-line-duotone"
                className="text-zinc-500 dark:text-zinc-400"
              />
            }
            value={searchVehicle}
            onChange={(e) => setSearchVehicle(e.target.value)}
            className="w-60"
            classNames={{
              base: "bg-white dark:bg-zinc-900",
              inputWrapper:
                "border-zinc-200 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-400",
            }}
          />
          <Dropdown>
            <DropdownTrigger>
              <Button className="bg-white text-zinc-800 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-700">
                {selectedType}
                <Icon icon="solar:arrow-down-linear" className="ml-2" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Vehicle types"
              onAction={(key) => setSelectedType(vehicleTypes[Number(key)])}
            >
              {vehicleTypes.map((type, index) => (
                <DropdownItem key={index.toString()}>{type}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* Active filters */}
      {(selectedType !== "All" || searchVehicle) && (
        <div className="flex flex-wrap gap-2 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
          <div className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">
            Active filters:
          </div>
          {selectedType !== "All" && (
            <Chip
              variant="flat"
              size="sm"
              onClose={() => setSelectedType("All")}
              classNames={{
                base: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
                closeButton:
                  "text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900",
              }}
            >
              Type: {selectedType}
            </Chip>
          )}
          {searchVehicle && (
            <Chip
              variant="flat"
              size="sm"
              onClose={() => setSearchVehicle("")}
              classNames={{
                base: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800",
                closeButton:
                  "text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900",
              }}
            >
              Search: {searchVehicle}
            </Chip>
          )}
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-[calc(100vh-260px)]">
        {/* Left column - Vehicle list */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden flex flex-col border border-zinc-100 dark:border-zinc-800">
          <div className="flex justify-between items-center p-4 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Fleet
            </h2>
            <div className="text-sm text-zinc-600 dark:text-zinc-300">
              {filteredVehicles.length} {filteredVehicles.length === 1 ? "vehicle" : "vehicles"}
            </div>
          </div>
          <div className="overflow-y-auto py-2 px-4 flex-1 bg-zinc-50 dark:bg-zinc-950">
            {filteredVehicles.length > 0 ? (
              filteredVehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  veicolo={vehicle}
                  isSelected={selectedVehicle?.id === vehicle.id}
                  onClick={selectVehicle}
                />
              ))
            ) : (
              <div className="text-center py-8 text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 rounded-lg my-2 border border-zinc-100 dark:border-zinc-800">
                <Icon
                  icon="mdi:truck-remove"
                  className="text-4xl mb-2 text-zinc-400 dark:text-zinc-500"
                />
                <p>No vehicles found</p>
                <p className="text-xs mt-2 text-zinc-500 dark:text-zinc-400">
                  Try changing the search filters
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right column - Selected vehicle map */}
        <div className="lg:col-span-2 max-h-full overflow-hidden flex flex-col">
          {selectedVehicle ? (
            <div className="h-full bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800">
              <VehicleMap vehicle={selectedVehicle} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
              <div className="text-center p-6">
                <div className="bg-zinc-50 dark:bg-zinc-950 p-6 rounded-full inline-block mb-4 border border-zinc-100 dark:border-zinc-800">
                  <Icon
                    icon="mdi:map-search"
                    className="text-5xl text-zinc-400 dark:text-zinc-500"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-zinc-800 dark:text-zinc-200">
                  No vehicle selected
                </h3>
                <p className="max-w-md text-zinc-600 dark:text-zinc-300">
                  Select a vehicle from the list on the left to view details and position on the map
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
