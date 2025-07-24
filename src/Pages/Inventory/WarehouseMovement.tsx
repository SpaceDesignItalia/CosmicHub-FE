import { useState, useEffect } from "react";
import MovementData from "../../Components/Inventory/WarehouseMovement/MovementData";
import MovementTable from "../../Components/Inventory/WarehouseMovement/MovementTable";
import axios from "axios";
import { Spinner, Button } from "@heroui/react";
import PageHeader from "../../Components/Layout/PageHeader";

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

export default function WarehouseMovement() {
  const [isLoading, setIsLoading] = useState(false);
  const [movements, setMovements] = useState<Movement[]>([]);

  useEffect(() => {
    const fetchMovements = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get("/Product/GET/GetAllProductMovements");
        const data = response.data.map(mapApiMovementToMovement);
        setMovements(data);
      } catch (error) {
        console.error("Error fetching movements:", error);
        setMovements([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovements();
  }, []);

  const handleDeleteMovement = async (id: string) => {
    try {
      // TODO: Implement delete API call
      setMovements((prev) => prev.filter((m) => m.id !== id));
    } catch (error) {
      console.error("Error deleting movement:", error);
    }
  };

  const handleUpdateStatus = async (
    movementId: string,
    newStatus: "PENDING" | "COMPLETED"
  ) => {
    try {
      // TODO: Implement status update API call
      setMovements((prev) =>
        prev.map((m) => (m.id === movementId ? { ...m, status: newStatus } : m))
      );
    } catch (error) {
      console.error("Error updating movement status:", error);
    }
  };

  console.log(movements);

  return (
    <div className="min-h-screen h-full w-full flex-1 flex flex-col p-6 gap-6">
      <PageHeader
        title="Movimenti Magazzino"
        description="Gestione dei movimenti di carico, scarico e trasferimenti"
        icon="solar:arrows-right-left-bold"
        size="md"
      />

      <MovementData />

      <MovementTable
        movements={movements}
        onDeleteMovement={handleDeleteMovement}
        onUpdateStatus={handleUpdateStatus}
        isLoading={isLoading}
      />
    </div>
  );
}
