import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import AnalyticsChart from "../../Components/Analytics/AnalyticsChart";
import CircleCharts from "../../Components/Analytics/CircleCharts";
import PageHeader from "../../Components/Layout/PageHeader";
import axios from "axios";

// Types
interface Movement {
  id: string;
  date: string;
  type: "IN" | "OUT" | "INCREASE" | "DECREASE" | "TRANSFER";
  product: string;
  sku: string;
  quantity: number;
  source: string;
  destination: string;
  status: "PENDING" | "COMPLETED";
  product_id: string;
  from_warehouse_id?: string;
  from_warehouse_name?: string;
  from_vehicle_id?: string;
  from_vehicle_name?: string;
  from_vehicle_license_plate?: string;
  to_warehouse_id?: string;
  to_warehouse_name?: string;
  to_vehicle_id?: string;
  to_vehicle_name?: string;
  to_vehicle_license_plate?: string;
  from_supplier?: string;
  supplier_name?: string;
  created_by?: string;
  movement_name?: string;
  user_name?: string;
}

// Utility functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("it-IT");
};

const getMovementType = (
  movementName: string
): "IN" | "OUT" | "INCREASE" | "DECREASE" | "TRANSFER" => {
  switch (movementName) {
    case "Carico":
      return "IN";
    case "Scarico":
      return "OUT";
    case "Increase":
      return "INCREASE";
    case "Decrease":
      return "DECREASE";
    default:
      return "TRANSFER";
  }
};

const mapApiMovementToMovement = (movement: any): Movement => {
  // Format source
  const source = movement.from_warehouse_name
    ? movement.from_warehouse_name
    : movement.from_vehicle_name
    ? movement.from_vehicle_name
    : movement.from_supplier
    ? movement.SupplierName || movement.from_supplier
    : "N/A";

  // Format destination
  const destination = movement.to_warehouse_name
    ? movement.to_warehouse_name
    : movement.to_vehicle_name
    ? movement.to_vehicle_name
    : "N/A";

  return {
    id: movement.movement_id,
    date: formatDate(movement.movement_date),
    type: getMovementType(movement.movement_name),
    product: movement.product_name,
    sku: movement.sku,
    quantity: parseInt(movement.amount),
    source,
    destination,
    status: "COMPLETED",
    product_id: movement.product_id,
    from_warehouse_id: movement.from_warehouse_id,
    from_warehouse_name: movement.from_warehouse_name,
    from_vehicle_id: movement.from_vehicle_id,
    from_vehicle_name: movement.from_vehicle_name,
    from_vehicle_license_plate: movement.from_vehicle_license_plate,
    to_warehouse_id: movement.to_warehouse_id,
    to_warehouse_name: movement.to_warehouse_name,
    to_vehicle_id: movement.to_vehicle_id,
    to_vehicle_name: movement.to_vehicle_name,
    to_vehicle_license_plate: movement.to_vehicle_license_plate,
    from_supplier: movement.from_supplier,
    supplier_name: movement.SupplierName,
    created_by: movement.created_by,
    movement_name: movement.movement_name,
    user_name: movement.user_name,
  };
};

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [movements, setMovements] = useState<Movement[]>([]);

  useEffect(() => {
    const fetchMovements = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get("/Product/GET/GetAllProductMovements");
        const data = response.data.map(mapApiMovementToMovement);
        // Prendi solo gli ultimi 10 movimenti per la dashboard
        setMovements(data.slice(0, 5));
      } catch (error) {
        console.error("Error fetching movements:", error);
        setMovements([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovements();
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background p-6 gap-6">
      <PageHeader
        title="Dashboard Magazzino"
        description="Panoramica delle performance e delle disponibilità"
        icon="solar:chart-2-bold-duotone"
        size="md"
      />

      {/* Contenuto principale con scroll */}
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="flex flex-col gap-6">
          {/* Metriche principali */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex justify-between">
                <div>
                  <p className="text-default-900">Valore Totale</p>
                  <h3 className="text-2xl font-bold">€184.250</h3>
                </div>
                <div className="bg-primary-200 p-2 mb-4 rounded-full">
                  <Icon
                    icon="solar:box-bold"
                    className="text-primary"
                    width={24}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-success">
                <Icon icon="solar:arrow-up-bold" width={16} />
                <span>8.2%</span>
                <span className="text-default-900 text-xs">
                  vs mese precedente
                </span>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex justify-between">
                <div>
                  <p className="text-default-900">Ricambi Totali</p>
                  <h3 className="text-2xl font-bold">4.382</h3>
                </div>
                <div className="bg-secondary-100 p-2 mb-4 rounded-full">
                  <Icon
                    icon="solar:widget-2-bold"
                    className="text-secondary"
                    width={24}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-success">
                <Icon icon="solar:arrow-up-bold" width={16} />
                <span>3.5%</span>
                <span className="text-default-900 text-xs">
                  vs mese precedente
                </span>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex justify-between">
                <div>
                  <p className="text-default-900">Movimenti</p>
                  <h3 className="text-2xl font-bold">287</h3>
                </div>
                <div className="bg-warning-100 p-2 mb-4 rounded-full">
                  <Icon
                    icon="solar:double-alt-arrow-right-bold"
                    className="text-warning"
                    width={24}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-danger">
                <Icon icon="solar:arrow-down-bold" width={16} />
                <span>2.1%</span>
                <span className="text-default-900 text-xs">
                  vs mese precedente
                </span>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex justify-between">
                <div>
                  <p className="text-default-900">Ricambi Critici</p>
                  <h3 className="text-2xl font-bold">24</h3>
                </div>
                <div className="bg-danger-100 p-2 mb-4 rounded-full">
                  <Icon
                    icon="solar:danger-triangle-bold"
                    className="text-danger"
                    width={24}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-success">
                <Icon icon="solar:arrow-down-bold" width={16} />
                <span>5.8%</span>
                <span className="text-default-900 text-xs">
                  vs mese precedente
                </span>
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
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Spinner size="lg" color="primary" label="Caricamento movimenti..." />
                </div>
              ) : (
                <Table
                  aria-label="Ultimi movimenti magazzino"
                  classNames={{
                    wrapper: "min-w-[800px]",
                    th: "text-left text-sm text-default-600",
                    td: "text-left text-sm",
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
                    {movements.length > 0 ? (
                      movements.map((movement) => (
                        <TableRow key={movement.id}>
                          <TableCell>{movement.sku}</TableCell>
                          <TableCell>{movement.product}</TableCell>
                          <TableCell
                            className={
                              movement.quantity < 0
                                ? "text-danger font-medium"
                                : "text-success font-medium"
                            }
                          >
                            {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
                          </TableCell>
                          <TableCell>
                            <Chip
                              color={movement.type === "IN" || movement.type === "INCREASE" ? "success" : "danger"}
                              size="sm"
                            >
                              {movement.type === "IN" || movement.type === "INCREASE" ? "Entrata" : "Uscita"}
                            </Chip>
                          </TableCell>
                          <TableCell>{movement.date}</TableCell>
                          <TableCell>{movement.user_name || movement.created_by || "N/A"}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <div className="flex flex-col items-center justify-center py-6">
                            <Icon
                              icon="solar:double-alt-arrow-right-outline"
                              className="text-default-400 mb-2"
                              width={36}
                            />
                            <p>Nessun movimento trovato</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
