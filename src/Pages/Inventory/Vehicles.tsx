import { Icon } from "@iconify/react";
import VehicleTable from "../../Components/Inventory/Vehicle/VehicleTable";

// Data types
interface Vehicle {
  id: string;
  plate: string;
  model: string;
  type: string;
  capacity: number;
  status: "Disponibile" | "In uso" | "In manutenzione";
  lastInspection: string;
}

export default function Vehicles() {
  // Example data
  const vehicles: Vehicle[] = [
    {
      id: "1",
      plate: "AB123CD",
      model: "Iveco Daily",
      type: "Van",
      capacity: 3500,
      status: "Disponibile",
      lastInspection: "2023-09-15",
    },
    {
      id: "2",
      plate: "EF456GH",
      model: "Fiat Ducato",
      type: "Van",
      capacity: 2800,
      status: "In uso",
      lastInspection: "2023-08-22",
    },
    {
      id: "3",
      plate: "IL789MN",
      model: "Mercedes Sprinter",
      type: "Van",
      capacity: 3000,
      status: "In manutenzione",
      lastInspection: "2023-07-10",
    },
    {
      id: "4",
      plate: "OP012QR",
      model: "Renault Master",
      type: "Van",
      capacity: 2500,
      status: "Disponibile",
      lastInspection: "2023-10-05",
    },
    {
      id: "5",
      plate: "ST345UV",
      model: "Iveco Eurocargo",
      type: "Camion",
      capacity: 7500,
      status: "Disponibile",
      lastInspection: "2023-11-12",
    },
  ];

  const vehicleTypes = ["Tutti", "Van", "Camion"];

  return (
    <div className="w-full flex-1 flex flex-col p-4 gap-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon
              icon="mingcute:truck-line"
              className="text-primary"
              style={{ fontSize: 28 }}
            />
          </div>
          <h1 className="text-2xl font-bold">Flotta Veicoli</h1>
        </div>
      </div>
      <VehicleTable vehicles={vehicles} vehicleTypes={vehicleTypes} />
    </div>
  );
}
