import { useState, useEffect } from "react";
import MovementData from "../../Components/Inventory/WarehouseMovement/MovementData";
import MovementTable from "../../Components/Inventory/WarehouseMovement/MovementTable";
import axios from "axios";
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
  movementName: string,
  fromWarehouse?: string,
  toWarehouse?: string,
  fromVehicle?: string,
  toVehicle?: string,
  selectedWarehouseId?: string
): "IN" | "OUT" | "INCREASE" | "DECREASE" | "TRANSFER" => {
  // Se abbiamo informazioni sulla direzione, usiamole per determinare il tipo
  if (fromWarehouse && toVehicle) {
    // Movimento da magazzino a veicolo = OUT (uscita dal magazzino)
    return "OUT";
  }

  if (fromVehicle && toWarehouse) {
    // Movimento da veicolo a magazzino = IN (entrata nel magazzino)
    return "IN";
  }

  if (fromWarehouse && toWarehouse) {
    // Movimento tra magazzini - considera la prospettiva del magazzino selezionato
    if (selectedWarehouseId) {
      const fromWarehouseId = String(fromWarehouse);
      const toWarehouseId = String(toWarehouse);
      const selectedId = String(selectedWarehouseId);

      if (toWarehouseId === selectedId) {
        // Il magazzino selezionato è la destinazione = IN (entrata)
        return "IN";
      } else if (fromWarehouseId === selectedId) {
        // Il magazzino selezionato è l'origine = OUT (uscita)
        return "OUT";
      }
    }
    // Se non abbiamo il magazzino selezionato o non corrisponde, usa TRANSFER
    return "TRANSFER";
  }

  // Fallback alla logica originale basata sul nome del movimento
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

const mapApiMovementToMovement = (
  movement: any,
  selectedWarehouseId?: string
): Movement => {
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

  // Determina il tipo di movimento
  const movementType = getMovementType(
    movement.movement_name,
    movement.from_warehouse_name,
    movement.to_warehouse_name,
    movement.from_vehicle_name,
    movement.to_vehicle_name,
    selectedWarehouseId
  );

  // Calcola la quantità con il segno corretto
  let quantity = parseInt(movement.amount);

  // Se il movimento è OUT, DECREASE o se il magazzino selezionato è nell'origine, rendi la quantità negativa
  if (
    movementType === "OUT" ||
    movementType === "DECREASE" ||
    (selectedWarehouseId && movement.from_warehouse_id === selectedWarehouseId)
  ) {
    quantity = -Math.abs(quantity);
  }

  return {
    id: movement.movement_id,
    date: formatDate(movement.movement_date),
    type: movementType,
    product: movement.product_name,
    sku: movement.sku,
    quantity: quantity,
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

  // Stato per il magazzino selezionato
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(
    () => {
      return localStorage.getItem("selectedWarehouse");
    }
  );

  // Stato per i dettagli del magazzino selezionato
  const [warehouseDetails, setWarehouseDetails] = useState<{
    name: string;
    code?: string;
    id?: string | number;
  } | null>(null);

  // Stato per tracciare se stiamo caricando i dettagli del magazzino
  const [, setIsLoadingWarehouse] = useState(false);

  // Stato per tutti i magazzini (per mappatura UUID -> ID)
  const [allWarehouses, setAllWarehouses] = useState<any[]>([]);

  // Effetto per caricare tutti i magazzini
  useEffect(() => {
    const fetchAllWarehouses = async () => {
      try {
        const response = await axios.get("/Warehouse/GET/GetAllWarehouses");
        setAllWarehouses(response.data);
      } catch (error) {
        console.error("Errore nel caricamento dei magazzini:", error);
      }
    };

    fetchAllWarehouses();
  }, []);

  // Funzione per recuperare i dettagli del magazzino
  const fetchWarehouseDetails = async (warehouseId: string) => {
    setIsLoadingWarehouse(true);
    try {
      const response = await axios.get("/Warehouse/GET/GetWarehouseByUUID", {
        params: {
          warehouse_uuid: warehouseId,
        },
      });

      if (response.data) {
        setWarehouseDetails({
          name:
            response.data.name || response.data.WarehouseName || "Magazzino",
          code: response.data.WarehouseCode,
          id:
            response.data.WarehouseID ||
            response.data.warehouse_id ||
            response.data.id,
        });
      }
    } catch (error) {
      console.error("Errore nel caricamento dettagli magazzino:", error);
      // Fallback: prova con GetAllWarehouses e trova il magazzino
      try {
        const allWarehousesResponse = await axios.get(
          "/Warehouse/GET/GetAllWarehouses"
        );
        const warehouse = allWarehousesResponse.data.find(
          (w: any) => (w.WarehouseUUID || w.warehouse_id) === warehouseId
        );

        if (warehouse) {
          setWarehouseDetails({
            name: warehouse.name || warehouse.WarehouseName || "Magazzino",
            code: warehouse.WarehouseCode,
            id: warehouse.WarehouseID || warehouse.warehouse_id || warehouse.id,
          });
        }
      } catch (fallbackError) {
        console.error(
          "Errore nel fallback per dettagli magazzino:",
          fallbackError
        );
        setWarehouseDetails(null);
      }
    } finally {
      setIsLoadingWarehouse(false);
    }
  };

  // Stato per tutti i movimenti (senza filtro)
  const [allMovements, setAllMovements] = useState<Movement[]>([]);

  useEffect(() => {
    const fetchMovements = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get("/Product/GET/GetAllProductMovements");

        if (Array.isArray(response.data)) {
          // Ottieni l'ID numerico del magazzino selezionato se disponibile
          let selectedWarehouseNumericId: string | undefined;
          if (selectedWarehouse && allWarehouses.length > 0) {
            const selectedWarehouseData = allWarehouses.find(
              (warehouse) =>
                warehouse.WarehouseUUID === selectedWarehouse ||
                warehouse.warehouse_id === selectedWarehouse
            );
            if (selectedWarehouseData) {
              selectedWarehouseNumericId = String(
                selectedWarehouseData.WarehouseID ||
                  selectedWarehouseData.warehouse_id ||
                  selectedWarehouseData.id
              );
            }
          }

          const data = response.data.map((movement: any) =>
            mapApiMovementToMovement(movement, selectedWarehouseNumericId)
          );
          setAllMovements(data);
        } else {
          console.error("Response data is not an array:", response.data);
          setAllMovements([]);
        }
      } catch (error) {
        console.error("Error fetching movements:", error);
        setAllMovements([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovements();
  }, [selectedWarehouse, allWarehouses]);

  // Effetto per caricare i dettagli del magazzino quando cambia
  useEffect(() => {
    if (selectedWarehouse) {
      fetchWarehouseDetails(selectedWarehouse);
    } else {
      setWarehouseDetails(null);
      setIsLoadingWarehouse(false);
    }
  }, [selectedWarehouse]);

  // Effetto per monitorare i cambiamenti del magazzino selezionato nel localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const newSelectedWarehouse = localStorage.getItem("selectedWarehouse");
      setSelectedWarehouse(newSelectedWarehouse);
    };

    // Ascolta i cambiamenti nel localStorage
    window.addEventListener("storage", handleStorageChange);

    // Controlla periodicamente per cambiamenti locali
    const interval = setInterval(() => {
      const currentWarehouse = localStorage.getItem("selectedWarehouse");
      if (currentWarehouse !== selectedWarehouse) {
        setSelectedWarehouse(currentWarehouse);
      }
    }, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [selectedWarehouse]);

  // Effetto per filtrare i movimenti basati sul magazzino selezionato
  useEffect(() => {
    if (!selectedWarehouse || allWarehouses.length === 0) {
      // Se nessun magazzino è selezionato o i magazzini non sono ancora caricati, mostra tutti i movimenti
      console.log(
        `Nessun filtro: mostrando tutti i ${allMovements.length} movimenti`
      );
      setMovements(allMovements);
    } else {
      // Trova il magazzino selezionato per ottenere l'ID numerico
      const selectedWarehouseData = allWarehouses.find(
        (warehouse) =>
          warehouse.WarehouseUUID === selectedWarehouse ||
          warehouse.warehouse_id === selectedWarehouse
      );

      if (!selectedWarehouseData) {
        // Se non troviamo il magazzino, mostra tutti i movimenti
        setMovements(allMovements);
        return;
      }

      // Ottieni l'ID numerico del magazzino
      const warehouseNumericId =
        selectedWarehouseData.WarehouseID ||
        selectedWarehouseData.warehouse_id ||
        selectedWarehouseData.id;

      // Filtra i movimenti che riguardano il magazzino selezionato
      const filteredMovements = allMovements.filter((movement) => {
        const matchesFrom =
          movement.from_warehouse_id === String(warehouseNumericId);
        const matchesTo =
          movement.to_warehouse_id === String(warehouseNumericId);

        // Include anche movimenti di aggiornamento quantità che hanno solo il magazzino di destinazione
        // (questo può accadere quando si fa + o - per aggiornare la quantità)
        const isQuantityUpdate =
          !movement.from_warehouse_id &&
          movement.to_warehouse_id === String(warehouseNumericId);

        return matchesFrom || matchesTo || isQuantityUpdate;
      });

      console.log(
        `Filtro magazzino ${warehouseNumericId}: ${filteredMovements.length} movimenti su ${allMovements.length} totali`
      );
      setMovements(filteredMovements);
    }
  }, [allMovements, selectedWarehouse, allWarehouses]);

  const handleDeleteMovement = async (id: string) => {
    try {
      // TODO: Implement delete API call
      setAllMovements((prev) => prev.filter((m) => m.id !== id));
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
      setAllMovements((prev) =>
        prev.map((m) => (m.id === movementId ? { ...m, status: newStatus } : m))
      );
    } catch (error) {
      console.error("Error updating movement status:", error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background p-6 gap-6">
      <PageHeader
        title={
          selectedWarehouse && warehouseDetails
            ? `Movimenti Magazzino: ${warehouseDetails.name}`
            : "Movimenti Magazzino"
        }
        description="Gestione dei movimenti di carico, scarico e trasferimenti"
        icon="solar:calendar-bold-duotone"
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
