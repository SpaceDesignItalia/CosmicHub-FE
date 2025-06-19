import React, { useMemo } from "react";
import { Card, CardBody, Chip, Badge } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useVehicleTheme } from "./VehicleThemeWrapper";
import type { VehicleStatus, VehicleType } from "./VehicleThemeWrapper";

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
  assignedUser?: string;
}

interface VehicleCardProps {
  veicolo: Vehicle;
  isSelected: boolean;
  onClick: (veicolo: Vehicle) => void;
}

const VehicleCard: React.FC<VehicleCardProps> = ({
  veicolo,
  isSelected,
  onClick,
}) => {
  // Utilizziamo il hook per accedere al tema dei veicoli
  const { getStatusStyles, getCardClasses, colors } = useVehicleTheme();

  // Determine vehicle status
  const isOnRoute = veicolo.status === "In use";
  const isWaiting = veicolo.status === "Maintenance";
  const isAvailable = veicolo.status === "Available";

  // Otteniamo gli stili per questo veicolo
  const { bgColor, borderColor, textColor } = getStatusStyles(veicolo.status);

  // Classi per la card
  const cardClasses = getCardClasses(isSelected);

  // Vehicle image
  const getVehicleImage = () => {
    if (veicolo.type === "Large Van") {
      return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cpath fill='%23C9C9C9' d='M7 39h42v7H7z'/%3E%3Cpath fill='%23AEAEAE' d='M7 35h42v4H7z'/%3E%3Cpath fill='%23ABABAB' d='M7 35v-6h40v6z'/%3E%3Cpath fill='%232563EB' d='M7 22h24v7H7z'/%3E%3Cpath fill='%23AAA' d='M31 22h10v7H31z'/%3E%3Cpath fill='%237B7B7B' d='M40 29h9v6h-9zm9 0 8 6v10h-8z'/%3E%3Cpath fill='%23D9D9D9' d='M14 46a4 4 0 1 1-8 0 4 4 0 0 1 8 0zm36 0a4 4 0 1 1-8 0 4 4 0 0 1 8 0z'/%3E%3Cpath fill='%23545454' d='M14 46a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm36 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0z'/%3E%3C/svg%3E";
    } else {
      return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cpath fill='%23D9D9D9' d='M4 37h35v7H4z'/%3E%3Cpath fill='%23AEAEAE' d='M4 33h35v4H4z'/%3E%3Cpath fill='%23ABABAB' d='M4 33v-6h30v6z'/%3E%3Cpath fill='%232563EB' d='M4 20h18v7H4z'/%3E%3Cpath fill='%23AAA' d='M22 20h8v7h-8z'/%3E%3Cpath fill='%237B7B7B' d='M30 27h9v6h-9z'/%3E%3Cpath fill='%23D9D9D9' d='M11 44a4 4 0 1 1-8 0 4 4 0 0 1 8 0zm28 0a4 4 0 1 1-8 0 4 4 0 0 1 8 0z'/%3E%3Cpath fill='%23545454' d='M11 44a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm28 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0z'/%3E%3C/svg%3E";
    }
  };

  return (
    <Card className={cardClasses} onClick={() => onClick(veicolo)}>
      <CardBody className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 flex items-center justify-center rounded-lg border"
              style={{
                backgroundColor: bgColor,
                borderColor: borderColor,
              }}
            >
              <img
                src={getVehicleImage()}
                alt={veicolo.type}
                className="w-9 h-9 object-contain"
              />
              {isOnRoute && (
                <Badge
                  color="primary"
                  placement="bottom-right"
                  className="animate-pulse"
                >
                  <span className="sr-only">On route</span>
                </Badge>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-50">
                  {veicolo.plate}
                </h3>
              </div>
              <div className="text-xs text-zinc-700 dark:text-zinc-200">
                {veicolo.model}
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                {veicolo.type}
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 flex items-center gap-1">
                <Icon
                  icon="mdi:account"
                  className="text-blue-600 dark:text-blue-300"
                  width={14}
                />
                {veicolo.assignedUser || "Non assegnato"}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <Chip
              size="sm"
              style={{
                backgroundColor: bgColor,
                color: textColor,
                borderColor: borderColor,
              }}
              classNames={{
                base: "border",
              }}
              startContent={
                isOnRoute ? (
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse mr-1"></div>
                ) : null
              }
            >
              {isOnRoute ? "In use" : veicolo.status}
            </Chip>
            {isOnRoute && (
              <>
                <div className="mt-1 text-xs flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
                  <Icon
                    icon="mdi:clock-outline"
                    className="text-xs text-zinc-500 dark:text-zinc-400"
                  />
                  {veicolo.travelTime}
                </div>
                <div className="flex items-center text-xs gap-1 text-zinc-700 dark:text-zinc-300">
                  <Icon
                    icon="mdi:flag-checkered"
                    className="text-xs text-zinc-500 dark:text-zinc-400"
                  />
                  ETA: {veicolo.eta || "N/A"}
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300 font-medium mt-1">
                  {veicolo.usedCapacity}% capacity
                </div>
              </>
            )}
          </div>
        </div>

        {isOnRoute && veicolo.position && (
          <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
            <Icon
              icon="mdi:map-marker"
              className="text-blue-600 dark:text-blue-300"
            />
            {veicolo.position}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default VehicleCard;
