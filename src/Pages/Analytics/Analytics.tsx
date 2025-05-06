import React from "react";
import {
  Select,
  SelectItem,
  Button,
  Card,
  CardHeader,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip
} from "@heroui/react";
import { Icon } from "@iconify/react";
import AnalyticsChart from "../../Components/Analytics/AnalyticsChart";
import CircleCharts from "../../Components/Analytics/CircleCharts";

export default function Dashboard() {
  return (
    <div className="min-h-screen h-full w-full flex-1 flex flex-col p-3 md:p-6 gap-6">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Magazzino</h1>
          <p className="text-default-900">Panoramica delle performance e delle disponibilità</p>
        </div>
      </header>

      {/* Contenuto principale con scroll */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-6">
          {/* Metriche principali */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex justify-between">
                <div>
                  <p className="text-default-900">Valore Totale</p>
                  <h3 className="text-2xl font-bold">€184.250</h3>
                </div>
                <div className="bg-primary-100 p-2 rounded-full">
                  <Icon icon="solar:box-bold" className="text-primary" width={24} />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-success">
                <Icon icon="solar:arrow-up-bold" width={16} />
                <span>8.2%</span>
                <span className="text-default-900 text-xs">vs mese precedente</span>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex justify-between">
                <div>
                  <p className="text-default-900">Ricambi Totali</p>
                  <h3 className="text-2xl font-bold">4.382</h3>
                </div>
                <div className="bg-secondary-100 p-2 rounded-full">
                  <Icon icon="solar:widget-2-bold" className="text-secondary" width={24} />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-success">
                <Icon icon="solar:arrow-up-bold" width={16} />
                <span>3.5%</span>
                <span className="text-default-900 text-xs">vs mese precedente</span>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex justify-between">
                <div>
                  <p className="text-default-900">Movimenti</p>
                  <h3 className="text-2xl font-bold">287</h3>
                </div>
                <div className="bg-warning-100 p-2 rounded-full">
                  <Icon icon="solar:double-alt-arrow-right-bold" className="text-warning" width={24} />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-danger">
                <Icon icon="solar:arrow-down-bold" width={16} />
                <span>2.1%</span>
                <span className="text-default-900 text-xs">vs mese precedente</span>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex justify-between">
                <div>
                  <p className="text-default-900">Ricambi Critici</p>
                  <h3 className="text-2xl font-bold">24</h3>
                </div>
                <div className="bg-danger-100 p-2 rounded-full">
                  <Icon icon="solar:danger-triangle-bold" className="text-danger" width={24} />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-success">
                <Icon icon="solar:arrow-down-bold" width={16} />
                <span>5.8%</span>
                <span className="text-default-900 text-xs">vs mese precedente</span>
              </div>
            </Card>
          </div>

          {/* Grafici analitici principali */}
          <div className="w-full">
            <AnalyticsChart />
          </div>

          {/* Grafici a torta */}
          <CircleCharts />

          {/* Tabella ultimi movimenti */}
          <Card className="w-full">
            <CardHeader className="flex justify-between">
              <h3 className="text-lg font-semibold">Ultimi Movimenti</h3>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table
                aria-label="Ultimi movimenti magazzino"
                classNames={{
                  wrapper: "min-w-[800px]",
                  th: "text-left text-sm text-default-600",
                  td: "text-left text-sm"
                }}
              >
                <TableHeader>
                  <TableColumn>Codice</TableColumn>
                  <TableColumn>Articolo</TableColumn>
                  <TableColumn>Quantità</TableColumn>
                  <TableColumn>Tipo</TableColumn>
                  <TableColumn>Data</TableColumn>
                  <TableColumn>Operatore</TableColumn>
                </TableHeader>
                <TableBody>
                  {[
                    {
                      codice: "R45892",
                      articolo: "Scheda elettronica Riello",
                      quantita: -2,
                      tipo: "Uscita",
                      data: "24/10/2023",
                      operatore: "Marco Rossi"
                    },
                    {
                      codice: "V78301",
                      articolo: "Valvola a 3 vie Vaillant",
                      quantita: 10,
                      tipo: "Entrata",
                      data: "23/10/2023",
                      operatore: "Laura Bianchi"
                    },
                    {
                      codice: "D90123",
                      articolo: "Compressore Daikin 2.5kW",
                      quantita: 5,
                      tipo: "Entrata",
                      data: "22/10/2023",
                      operatore: "Antonio Verdi"
                    },
                    {
                      codice: "R12385",
                      articolo: "Ventilatore tangenziale",
                      quantita: -1,
                      tipo: "Uscita",
                      data: "22/10/2023",
                      operatore: "Marco Rossi"
                    },
                    {
                      codice: "V30156",
                      articolo: "Sonda NTC Vaillant",
                      quantita: -3,
                      tipo: "Uscita",
                      data: "21/10/2023",
                      operatore: "Paolo Neri"
                    }
                  ].map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.codice}</TableCell>
                      <TableCell>{row.articolo}</TableCell>
                      <TableCell className={row.quantita < 0 ? "text-danger font-medium" : "text-success font-medium"}>
                        {row.quantita > 0 ? `+${row.quantita}` : row.quantita}
                      </TableCell>
                      <TableCell>
                        <Chip
                          color={row.tipo === "Entrata" ? "success" : "danger"}
                          size="sm"
                        >
                          {row.tipo}
                        </Chip>
                      </TableCell>
                      <TableCell>{row.data}</TableCell>
                      <TableCell>{row.operatore}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
