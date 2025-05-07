import React from "react";
import { Card, CardBody, Chip, Badge } from "@heroui/react";
import { Icon } from "@iconify/react";

interface Veicolo {
  id: string;
  targa: string;
  modello: string;
  tipo: "Furgone grande" | "Furgone piccolo";
  capacita: number;
  stato: "Disponibile" | "In uso" | "In manutenzione";
  ultimaRevisione: string;
  capacitàUtilizzata?: number;
  posizione?: string;
  tempoDiViaggio?: string;
  oraStimaArrivo?: string;
  coordinate?: { lat: number; lng: number };
  puntiConsegna?: { indirizzo: string; ora: string }[];
}

interface VehicleCardProps {
  veicolo: Veicolo;
  isSelected: boolean;
  onClick: (veicolo: Veicolo) => void;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ veicolo, isSelected, onClick }) => {
  // Determina lo stato del veicolo
  const isOnRoute = veicolo.stato === "In uso";
  const isWaiting = veicolo.stato === "In manutenzione";
  const isAvailable = veicolo.stato === "Disponibile";

  // Immagine del veicolo
  const getVehicleImage = () => {
    if (veicolo.tipo === "Furgone grande") {
      return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cpath fill='%23C9C9C9' d='M7 39h42v7H7z'/%3E%3Cpath fill='%23AEAEAE' d='M7 35h42v4H7z'/%3E%3Cpath fill='%23ABABAB' d='M7 35v-6h40v6z'/%3E%3Cpath fill='%232563EB' d='M7 22h24v7H7z'/%3E%3Cpath fill='%23AAA' d='M31 22h10v7H31z'/%3E%3Cpath fill='%237B7B7B' d='M40 29h9v6h-9zm9 0 8 6v10h-8z'/%3E%3Cpath fill='%23D9D9D9' d='M14 46a4 4 0 1 1-8 0 4 4 0 0 1 8 0zm36 0a4 4 0 1 1-8 0 4 4 0 0 1 8 0z'/%3E%3Cpath fill='%23545454' d='M14 46a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm36 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0z'/%3E%3C/svg%3E";
    } else {
      return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cpath fill='%23D9D9D9' d='M4 37h35v7H4z'/%3E%3Cpath fill='%23AEAEAE' d='M4 33h35v4H4z'/%3E%3Cpath fill='%23ABABAB' d='M4 33v-6h30v6z'/%3E%3Cpath fill='%232563EB' d='M4 20h18v7H4z'/%3E%3Cpath fill='%23AAA' d='M22 20h8v7h-8z'/%3E%3Cpath fill='%237B7B7B' d='M30 27h9v6h-9z'/%3E%3Cpath fill='%23D9D9D9' d='M11 44a4 4 0 1 1-8 0 4 4 0 0 1 8 0zm28 0a4 4 0 1 1-8 0 4 4 0 0 1 8 0z'/%3E%3Cpath fill='%23545454' d='M11 44a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm28 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0z'/%3E%3C/svg%3E";
    }
  };

  return (
    <Card 
      className={`mb-2 cursor-pointer transition-colors border ${
        isSelected 
          ? 'bg-blue-50 dark:bg-blue-950 border-blue-400 dark:border-blue-700 shadow-sm' 
          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm'
      }`}
      onClick={() => onClick(veicolo)}
    >
      <CardBody className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 flex items-center justify-center rounded-lg border ${
              isOnRoute 
                ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-700' 
                : isAvailable 
                  ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-700' 
                  : 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-700'
            }`}>
              <img 
                src={getVehicleImage()}
                alt={veicolo.tipo}
                className="w-9 h-9 object-contain"
              />
              {isOnRoute && (
                <Badge
                  color="primary"
                  placement="bottom-right"
                  className="animate-pulse"
                >
                  <span className="sr-only">In viaggio</span>
                </Badge>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-50">
                  {veicolo.targa}
                </h3>
              </div>
              <div className="text-xs text-zinc-700 dark:text-zinc-200">
                {veicolo.modello}
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                {veicolo.tipo}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <Chip 
              size="sm"
              classNames={{
                base: isOnRoute 
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800" 
                  : isAvailable 
                    ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 border border-green-200 dark:border-green-800" 
                    : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
              }}
              startContent={
                isOnRoute ? (
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse mr-1"></div>
                ) : null
              }
            >
              {isOnRoute ? "In viaggio" : veicolo.stato}
            </Chip>
            {isOnRoute && (
              <>
                <div className="mt-1 text-xs flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
                  <Icon icon="mdi:clock-outline" className="text-xs text-zinc-500 dark:text-zinc-400" />
                  {veicolo.tempoDiViaggio}
                </div>
                <div className="flex items-center text-xs gap-1 text-zinc-700 dark:text-zinc-300">
                  <Icon icon="mdi:flag-checkered" className="text-xs text-zinc-500 dark:text-zinc-400" />
                  ETA: {veicolo.oraStimaArrivo || "N/D"}
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300 font-medium mt-1">
                  {veicolo.capacitàUtilizzata}% capacità
                </div>
              </>
            )}
          </div>
        </div>
        
        {isOnRoute && veicolo.posizione && (
          <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
            <Icon icon="mdi:map-marker" className="text-blue-600 dark:text-blue-300" />
            {veicolo.posizione}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default VehicleCard; 