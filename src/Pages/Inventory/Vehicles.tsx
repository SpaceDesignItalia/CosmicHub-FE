import { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
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

export default function Vehicles() {
  const [ricercaVehicle, setRicercaVehicle] = useState("");
  const [tipoVehicleSelezionato, setTipoVehicleSelezionato] = useState("Tutti");
  const [vehicleSelezionato, setVehicleSelezionato] = useState<Vehicle | null>(
    null
  );

  // Dati di esempio aggiornati
  const veicoli: Vehicle[] = [
    {
      id: "1",
      targa: "AB123CD",
      modello: "Iveco Daily",
      tipo: "Furgone grande",
      capacita: 3500,
      stato: "Disponibile",
      ultimaRevisione: "2023-09-15",
    },
    {
      id: "2",
      targa: "EF456GH",
      modello: "Fiat Ducato",
      tipo: "Furgone grande",
      capacita: 2800,
      stato: "In uso",
      ultimaRevisione: "2023-08-22",
      capacitàUtilizzata: 75,
      posizione: "Via Roma, Milano",
      tempoDiViaggio: "01:38:47",
      oraStimaArrivo: "14:30",
      coordinate: { lat: 45.4642, lng: 9.19 },
      puntiConsegna: [
        { indirizzo: "Via Torino 25, Milano", ora: "13:45" },
        { indirizzo: "Corso Venezia 12, Milano", ora: "14:15" },
      ],
    },
    {
      id: "3",
      targa: "IL789MN",
      modello: "Mercedes Sprinter",
      tipo: "Furgone grande",
      capacita: 3000,
      stato: "In manutenzione",
      ultimaRevisione: "2023-07-10",
    },
    {
      id: "4",
      targa: "OP012QR",
      modello: "Renault Kangoo",
      tipo: "Furgone piccolo",
      capacita: 1500,
      stato: "Disponibile",
      ultimaRevisione: "2023-10-05",
    },
    {
      id: "5",
      targa: "ST345UV",
      modello: "Fiat Ducato XL",
      tipo: "Furgone grande",
      capacita: 3200,
      stato: "In uso",
      ultimaRevisione: "2023-11-12",
      capacitàUtilizzata: 82,
      posizione: "Via Napoli, Roma",
      tempoDiViaggio: "00:55:23",
      oraStimaArrivo: "15:45",
      coordinate: { lat: 41.9028, lng: 12.4964 },
      puntiConsegna: [
        { indirizzo: "Via del Corso 12, Roma", ora: "15:15" },
        { indirizzo: "Via Veneto 45, Roma", ora: "16:00" },
      ],
    },
    {
      id: "6",
      targa: "WX678YZ",
      modello: "Peugeot Partner",
      tipo: "Furgone piccolo",
      capacita: 1300,
      stato: "In uso",
      ultimaRevisione: "2023-10-25",
      capacitàUtilizzata: 45,
      posizione: "Via Torino, Firenze",
      tempoDiViaggio: "02:17:35",
      oraStimaArrivo: "16:10",
      coordinate: { lat: 43.7696, lng: 11.2558 },
      puntiConsegna: [
        { indirizzo: "Piazza della Signoria, Firenze", ora: "15:30" },
        { indirizzo: "Via dei Calzaiuoli 8, Firenze", ora: "16:15" },
      ],
    },
  ];

  // Filtro veicoli
  const veicoliFiltrati = veicoli.filter((vehicle) => {
    const matchRicerca =
      vehicle.modello.toLowerCase().includes(ricercaVehicle.toLowerCase()) ||
      vehicle.targa.toLowerCase().includes(ricercaVehicle.toLowerCase());
    const matchTipo =
      tipoVehicleSelezionato === "Tutti" ||
      vehicle.tipo === tipoVehicleSelezionato;
    return matchRicerca && matchTipo;
  });

  const tipiVehicle = ["Tutti", "Furgone grande", "Furgone piccolo"];

  // Gestisce il click su un Vehicle - definito con useCallback per evitare rirender inutili
  const selezionaVehicle = useCallback((vehicle: Vehicle) => {
    setVehicleSelezionato(vehicle);
  }, []);

  // Seleziona il primo Vehicle all'avvio
  useEffect(() => {
    if (veicoliFiltrati.length > 0 && !vehicleSelezionato) {
      setVehicleSelezionato(veicoliFiltrati[0]);
    }
  }, []);

  // Reset selezione quando i filtri cambiano
  useEffect(() => {
    if (veicoliFiltrati.length === 0) {
      setVehicleSelezionato(null);
    } else if (
      vehicleSelezionato &&
      !veicoliFiltrati.some((v) => v.id === vehicleSelezionato.id)
    ) {
      setVehicleSelezionato(veicoliFiltrati[0]);
    }
  }, [ricercaVehicle, tipoVehicleSelezionato, veicoliFiltrati]);

  return (
    <div className="w-full flex-1 flex flex-col p-5 gap-5 bg-zinc-50 dark:bg-zinc-950">
      {/* Header con titolo e filtri */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
            <LocalShippingOutlinedIcon
              className="text-blue-700 dark:text-blue-300"
              style={{ fontSize: 28 }}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Tracking Veicoli
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Monitora in tempo reale lo stato di tutti i veicoli
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Cerca per targa o modello..."
            startContent={
              <Icon
                icon="solar:magnifer-line-duotone"
                className="text-zinc-500 dark:text-zinc-400"
              />
            }
            value={ricercaVehicle}
            onChange={(e) => setRicercaVehicle(e.target.value)}
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
                {tipoVehicleSelezionato}
                <Icon icon="solar:arrow-down-linear" className="ml-2" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Tipi Vehicle"
              onAction={(key) =>
                setTipoVehicleSelezionato(tipiVehicle[Number(key)])
              }
            >
              {tipiVehicle.map((tipo, index) => (
                <DropdownItem key={index.toString()}>{tipo}</DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* Filtri applicati */}
      {(tipoVehicleSelezionato !== "Tutti" || ricercaVehicle) && (
        <div className="flex flex-wrap gap-2 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
          <div className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">
            Filtri attivi:
          </div>
          {tipoVehicleSelezionato !== "Tutti" && (
            <Chip
              variant="flat"
              size="sm"
              onClose={() => setTipoVehicleSelezionato("Tutti")}
              classNames={{
                base: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
                closeButton:
                  "text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900",
              }}
            >
              Tipo: {tipoVehicleSelezionato}
            </Chip>
          )}
          {ricercaVehicle && (
            <Chip
              variant="flat"
              size="sm"
              onClose={() => setRicercaVehicle("")}
              classNames={{
                base: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800",
                closeButton:
                  "text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900",
              }}
            >
              Ricerca: {ricercaVehicle}
            </Chip>
          )}
        </div>
      )}

      {/* Layout a due colonne */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-[calc(100vh-260px)]">
        {/* Colonna sinistra - Lista veicoli */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden flex flex-col border border-zinc-100 dark:border-zinc-800">
          <div className="flex justify-between items-center p-4 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Flotta veicoli
            </h2>
            <div className="text-sm text-zinc-600 dark:text-zinc-300">
              {veicoliFiltrati.length}{" "}
              {veicoliFiltrati.length === 1 ? "Vehicle" : "veicoli"}
            </div>
          </div>
          <div className="overflow-y-auto py-2 px-4 flex-1 bg-zinc-50 dark:bg-zinc-950">
            {veicoliFiltrati.length > 0 ? (
              veicoliFiltrati.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  veicolo={vehicle}
                  isSelected={vehicleSelezionato?.id === vehicle.id}
                  onClick={selezionaVehicle}
                />
              ))
            ) : (
              <div className="text-center py-8 text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 rounded-lg my-2 border border-zinc-100 dark:border-zinc-800">
                <Icon
                  icon="mdi:truck-remove"
                  className="text-4xl mb-2 text-zinc-400 dark:text-zinc-500"
                />
                <p>Nessun Vehicle trovato</p>
                <p className="text-xs mt-2 text-zinc-500 dark:text-zinc-400">
                  Prova a modificare i filtri di ricerca
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Colonna destra - Mappa del Vehicle selezionato */}
        <div className="lg:col-span-2 max-h-full overflow-hidden flex flex-col">
          {vehicleSelezionato ? (
            <div className="h-full bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800">
              <VehicleMap veicolo={vehicleSelezionato} />
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
                  Nessun Vehicle selezionato
                </h3>
                <p className="max-w-md text-zinc-600 dark:text-zinc-300">
                  Seleziona un Vehicle dalla lista a sinistra per visualizzare i
                  dettagli e la posizione sulla mappa
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
