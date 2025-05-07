import { useState } from "react";
import VehicleTable from "../../Components/Inventory/VehicleTable";
import { Icon } from "@iconify/react";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";

// Tipi di dati
interface Veicolo {
  id: string;
  targa: string;
  modello: string;
  tipo: string;
  capacita: number;
  stato: "Disponibile" | "In uso" | "In manutenzione";
  ultimaRevisione: string;
}

export default function Vehicles() {
  // Dati di esempio
  const veicoli: Veicolo[] = [
    {
      id: "1",
      targa: "AB123CD",
      modello: "Iveco Daily",
      tipo: "Furgone",
      capacita: 3500,
      stato: "Disponibile",
      ultimaRevisione: "2023-09-15",
    },
    {
      id: "2",
      targa: "EF456GH",
      modello: "Fiat Ducato",
      tipo: "Furgone",
      capacita: 2800,
      stato: "In uso",
      ultimaRevisione: "2023-08-22",
    },
    {
      id: "3",
      targa: "IL789MN",
      modello: "Mercedes Sprinter",
      tipo: "Furgone",
      capacita: 3000,
      stato: "In manutenzione",
      ultimaRevisione: "2023-07-10",
    },
    {
      id: "4",
      targa: "OP012QR",
      modello: "Renault Master",
      tipo: "Furgone",
      capacita: 2500,
      stato: "Disponibile",
      ultimaRevisione: "2023-10-05",
    },
    {
      id: "5",
      targa: "ST345UV",
      modello: "Iveco Eurocargo",
      tipo: "Camion",
      capacita: 7500,
      stato: "Disponibile",
      ultimaRevisione: "2023-11-12",
    },
  ];

  const tipiVeicolo = ["Tutti", "Furgone", "Camion"];

  return (
    <div className="w-full flex-1 flex flex-col p-4 gap-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <LocalShippingOutlinedIcon
              className="text-primary"
              style={{ fontSize: 28 }}
            />
          </div>
          <h1 className="text-2xl font-bold">Flotta Veicoli</h1>
        </div>
      </div>
      <VehicleTable veicoli={veicoli} tipiVeicolo={tipiVeicolo} />
    </div>
  );
}
