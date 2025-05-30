import React, { useCallback, useMemo, useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Chip,
  User,
  Pagination,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Avatar,
  Select,
  SelectItem,
  Spinner,
  Input,
  Tooltip,
  Textarea,
} from "@heroui/react";
import type { Selection, ChipProps } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { useProductTheme } from "./ProductThemeWrapper";
import DeleteProductModal from "./DeleteProductModal";
import InlineQuantityEditor from "./InlineQuantityEditor";
import { Icon } from "@iconify/react/dist/iconify.js";
import axios from "axios";

// Data types
interface Attribute {
  name: string;
  data_type: string;
  value: string;
}

interface Warehouse {
  WarehouseID: number; // ID numerico per il database
  WarehouseUUID: string;
  WarehouseName: string;
  WarehouseCode: string;
  WarehouseCountry: string;
  IsActive: boolean;
}

interface Product {
  product_id: string;
  id?: string; // Per compatibilità
  name: string;
  category_id: string;
  sku: string;
  description: string;
  price: number;
  min_stock_treshold: number;
  quantity: number;
  barcode: string;
  qr_code: string;
  supplier_id: string;
  brand_id: string;
  weight: string;
  dimensions: string;
  location: string;
  notes: string;
  cost_price: number;
  vat_rate: number;
  reorder_quantity: number;
  stock_unit: string;
  warehouse_id: string;
  attributes: Attribute[];
  // Campi calcolati per UI
  status: "Disponibile" | "Esaurito" | "Bassa giacenza";
  category: string;
  image?: string;
}

interface ProductTableProps {
  products: Product[];
  categories: string[];
  onDeleteProduct?: (id: string) => Promise<void>;
  onUpdateQuantity?: (productId: string, newQuantity: number) => void;
  sortBy?: {
    field: keyof Product;
    direction: "asc" | "desc";
  };
  onSort?: (sort: { field: keyof Product; direction: "asc" | "desc" }) => void;
  isLoading?: boolean;
}

const statusColorMap: Record<string, ChipProps["color"]> = {
  Disponibile: "success",
  "Bassa giacenza": "warning",
  Esaurito: "danger",
};

const columns = [
  { name: "PRODOTTO", uid: "name", sortable: true },
  { name: "CATEGORIA", uid: "category", sortable: true },
  { name: "SKU", uid: "sku", sortable: true },
  {
    name: (
      <div className="flex items-center gap-1 w-full">
        <span>QUANTITÀ</span>
        <Tooltip content="Doppio click sulla cella per modificare" size="sm">
          <Icon
            icon="solar:question-circle-linear"
            className="text-xs text-default-400 cursor-help"
          />
        </Tooltip>
      </div>
    ),
    uid: "quantity",
    sortable: true,
  },
  { name: "PREZZO", uid: "price", sortable: true },
  { name: "MAGAZZINO", uid: "warehouse", sortable: true },
  { name: "STATO", uid: "status", sortable: true },
  { name: "AZIONI INVENTARIO", uid: "inventory_actions" },
  { name: "AZIONI", uid: "actions" },
];

// Empty State Component
const EmptyState = ({ isLoading }: { isLoading?: boolean }) => {
  const navigate = useNavigate();
  const { isDark } = useProductTheme();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <Spinner size="lg" color="primary" />
        <p className="mt-4 text-default-500">Caricamento prodotti...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div
        className={`p-4 rounded-full mb-4 ${
          isDark ? "bg-zinc-800" : "bg-zinc-100"
        }`}
      >
        <svg
          className={`w-12 h-12 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <h3
        className={`text-xl font-semibold mb-2 ${
          isDark ? "text-zinc-200" : "text-zinc-800"
        }`}
      >
        Nessun prodotto trovato
      </h3>
      <p
        className={`text-sm mb-6 text-center ${
          isDark ? "text-zinc-400" : "text-zinc-500"
        }`}
      >
        Non ci sono prodotti che corrispondono ai criteri di ricerca.
        <br />
        Prova a modificare i filtri o aggiungi nuovi prodotti.
      </p>
      <Button
        color="primary"
        variant="shadow"
        startContent={<Icon icon="solar:add-circle-bold" className="text-xl" />}
        onPress={() => navigate("/inventory/products/add")}
      >
        Aggiungi Prodotto
      </Button>
    </div>
  );
};

export default function ProductTable({
  products,
  onDeleteProduct,
  onUpdateQuantity,
  sortBy,
  onSort,
  isLoading = false,
}: ProductTableProps) {
  const navigate = useNavigate();
  const [selectedKeys, setSelectedKeys] = React.useState<Selection>(
    new Set([])
  );
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const [page, setPage] = React.useState(1);
  const { isDark } = useProductTheme();

  // Modals
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(
    null
  );
  const {
    isOpen: isDeleteModalOpen,
    onOpen: openDeleteModal,
    onClose: closeDeleteModal,
  } = useDisclosure();
  const [productToDelete, setProductToDelete] = React.useState<Product | null>(
    null
  );

  // Stati per i modali di inventario
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockModalType, setStockModalType] = useState<"increase" | "decrease">(
    "increase"
  );
  const [selectedProductForStock, setSelectedProductForStock] =
    useState<Product | null>(null);
  const [stockAmount, setStockAmount] = useState("");
  const [stockReason, setStockReason] = useState("");
  const [isProcessingStock, setIsProcessingStock] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [selectedProductForMove, setSelectedProductForMove] =
    useState<Product | null>(null);
  const [moveQuantity, setMoveQuantity] = useState("");
  const [targetWarehouse, setTargetWarehouse] = useState("");
  const [isProcessingMove, setIsProcessingMove] = useState(false);

  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [selectedProductForLoad, setSelectedProductForLoad] =
    useState<Product | null>(null);
  const [loadQuantity, setLoadQuantity] = useState("");
  const [targetVehicle, setTargetVehicle] = useState("");
  const [isProcessingLoad, setIsProcessingLoad] = useState(false);

  // Dati reali per magazzini caricati dall'API
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // Stato per veicoli caricati da API
  const [vehicles, setVehicles] = useState<any[]>([]);

  // Carica i veicoli all'avvio del componente
  React.useEffect(() => {
    const loadVehicles = async () => {
      try {
        const response = await axios.get("/Vehicle/GET/GetAllVehicles");
        setVehicles(response.data || []);
        console.log(response.data);
      } catch (error) {
        console.error("Errore nel caricamento dei veicoli:", error);
      }
    };
    loadVehicles();
  }, []);

  // Stati per operazioni batch
  const [isBatchStockModalOpen, setIsBatchStockModalOpen] = useState(false);
  const [batchStockType, setBatchStockType] = useState<"increase" | "decrease">(
    "increase"
  );
  const [batchStockReason, setBatchStockReason] = useState("");
  const [batchStockData, setBatchStockData] = useState<{
    [key: string]: string;
  }>({});
  const [isProcessingBatchStock, setIsProcessingBatchStock] = useState(false);

  const [isBatchMoveModalOpen, setIsBatchMoveModalOpen] = useState(false);
  const [batchMoveData, setBatchMoveData] = useState<{ [key: string]: string }>(
    {}
  );
  const [batchTargetWarehouse, setBatchTargetWarehouse] = useState("");
  const [isProcessingBatchMove, setIsProcessingBatchMove] = useState(false);

  const [isBatchLoadModalOpen, setIsBatchLoadModalOpen] = useState(false);
  const [batchLoadData, setBatchLoadData] = useState<{ [key: string]: string }>(
    {}
  );
  const [batchTargetVehicle, setBatchTargetVehicle] = useState("");
  const [isProcessingBatchLoad, setIsProcessingBatchLoad] = useState(false);

  const [batchProducts, setBatchProducts] = useState<Product[]>([]);

  const filteredItems = useMemo(() => {
    let filteredProducts = [...products];
    return filteredProducts;
  }, [products]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a: Product, b: Product) => {
      const first = a[sortBy?.field || "name"];
      const second = b[sortBy?.field || "name"];
      const direction = sortBy?.direction === "asc" ? 1 : -1;

      if (typeof first === "string" && typeof second === "string") {
        return direction * first.localeCompare(second);
      }
      return direction * ((first as number) - (second as number));
    });
  }, [items, sortBy]);

  const goToEditProduct = (productId: string) =>
    navigate(`/inventory/products/edit/${productId}`);

  // Delete functions
  const confirmDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    openDeleteModal();
  };

  const handleDeleteProduct = async (id: string) => {
    if (onDeleteProduct) {
      await onDeleteProduct(id);
    }
  };

  // Funzioni per gestire le operazioni di inventario
  const openStockModal = (product: Product, type: "increase" | "decrease") => {
    setSelectedProductForStock(product);
    setStockModalType(type);
    setStockAmount("");
    setStockReason("");
    setIsStockModalOpen(true);
  };

  const handleStockOperation = async () => {
    if (!selectedProductForStock || !stockAmount || !stockReason) return;

    setIsProcessingStock(true);
    try {
      const amount = parseInt(stockAmount);
      const newQuantity =
        stockModalType === "increase"
          ? selectedProductForStock.quantity + amount
          : selectedProductForStock.quantity - amount;

      if (newQuantity < 0) {
        alert("La quantità non può essere negativa");
        return;
      }

      console.log(
        `Aggiornamento stock da ${selectedProductForStock.quantity} a ${newQuantity} per prodotto:`,
        selectedProductForStock.product_id
      );

      // Usa lo stesso endpoint dell'InlineQuantityEditor che funziona
      try {
        const response = await axios.put(
          `/Product/UPDATE/UpdateProductQuantity/`,
          {
            product_id: selectedProductForStock.product_id,
            stock_unit: newQuantity.toString(),
          }
        );

        if (response.status === 200) {
          // Aggiorna la UI tramite la prop callback
          if (onUpdateQuantity) {
            onUpdateQuantity(selectedProductForStock.product_id, newQuantity);
          }

          // Mostra messaggio di successo
          setShowSuccessMessage(true);
          setSuccessMessage(
            `Quantità ${
              stockModalType === "increase" ? "aumentata" : "diminuita"
            } con successo!`
          );
          setIsStockModalOpen(false);

          // Dopo aver aggiornato la quantità, registra il movimento
          try {
            const movementEndpoint =
              stockModalType === "increase"
                ? "/Movement/POST/CreateLoadMovement"
                : "/Movement/POST/CreateUnloadMovement";

            const movementData = {
              product_id: selectedProductForStock.product_id,
              quantity: amount,
              reason: stockReason,
              warehouse_id: selectedProductForStock.warehouse_id,
              timestamp: new Date().toISOString(),
              movement_type: stockModalType === "increase" ? "LOAD" : "UNLOAD",
              notes: stockReason,
              user_id: "current_user", // TODO: Sostituire con l'ID utente reale
              created_at: new Date().toISOString(),
            };

            await axios.post(movementEndpoint, movementData);
            console.log(`Movimento ${stockModalType} registrato con successo`);
          } catch (movementError) {
            console.warn(
              "Errore nella registrazione del movimento:",
              movementError
            );
            // Non blocchiamo l'operazione se la registrazione del movimento fallisce
            // L'aggiornamento della quantità è già avvenuto con successo
          }
        }
      } catch (apiError: any) {
        // Fallback con endpoint generico come fa InlineQuantityEditor
        if (
          apiError.response?.status === 404 ||
          apiError.code === "ERR_NETWORK"
        ) {
          console.log(
            "Endpoint specifico non trovato, provo con aggiornamento generico..."
          );

          const updateData = {
            stock_unit: newQuantity.toString(),
          };

          await axios.put(
            `/Product/PUT/UpdateProduct/${selectedProductForStock.product_id}`,
            updateData
          );

          // Aggiorna la UI tramite la prop callback
          if (onUpdateQuantity) {
            onUpdateQuantity(selectedProductForStock.product_id, newQuantity);
          }

          // Mostra messaggio di successo
          setShowSuccessMessage(true);
          setSuccessMessage(
            `Quantità ${
              stockModalType === "increase" ? "aumentata" : "diminuita"
            } con successo!`
          );
          setIsStockModalOpen(false);

          // Reset dei campi
          setStockAmount("");
          setStockReason("");

          // Dopo aver aggiornato la quantità, registra il movimento
          try {
            const movementEndpoint =
              stockModalType === "increase"
                ? "/Movement/POST/CreateLoadMovement"
                : "/Movement/POST/CreateUnloadMovement";

            const movementData = {
              product_id: selectedProductForStock.product_id,
              quantity: amount,
              reason: stockReason,
              warehouse_id: selectedProductForStock.warehouse_id,
              timestamp: new Date().toISOString(),
              movement_type: stockModalType === "increase" ? "LOAD" : "UNLOAD",
              notes: stockReason,
              user_id: "current_user", // TODO: Sostituire con l'ID utente reale
              created_at: new Date().toISOString(),
            };

            await axios.post(movementEndpoint, movementData);
            console.log(
              `Movimento ${stockModalType} registrato con successo nel fallback`
            );
          } catch (movementError) {
            console.warn(
              "Errore nella registrazione del movimento (fallback):",
              movementError
            );
            // Non blocchiamo l'operazione se la registrazione del movimento fallisce
            // L'aggiornamento della quantità è già avvenuto con successo
          }
        } else {
          throw apiError;
        }
      }

      console.log("Quantità aggiornata con successo nel database");
    } catch (error: any) {
      console.error("Errore nell'operazione di stock:", error);

      // Gestione errori più specifica come InlineQuantityEditor
      let errorMessage = "Errore nell'aggiornamento della quantità";
      if (error.response?.status === 404) {
        errorMessage = "Prodotto non trovato";
      } else if (error.response?.status === 400) {
        errorMessage = "Dati non validi";
      } else if (error.code === "ERR_NETWORK") {
        errorMessage = "Errore di connessione al server";
      }

      alert(`Errore nell'operazione: ${errorMessage}`);
    } finally {
      setIsProcessingStock(false);
    }
  };

  const openMoveModal = (product: Product) => {
    setSelectedProductForMove(product);
    setMoveQuantity("");
    setTargetWarehouse(""); // Reset esplicito per mostrare il placeholder
    setIsMoveModalOpen(true);
  };

  const handleMoveOperation = async () => {
    if (!selectedProductForMove || !moveQuantity || !targetWarehouse) return;

    setIsProcessingMove(true);
    try {
      const amount = parseInt(moveQuantity);

      if (amount > selectedProductForMove.quantity) {
        alert("Quantità da spostare superiore alla disponibilità");
        return;
      }

      // Trova il magazzino di destinazione per ottenere il WarehouseID numerico
      const targetWarehouseData = warehouses.find(
        (w) => (w.WarehouseUUID || w.WarehouseID.toString()) === targetWarehouse
      );

      // Trova il magazzino di origine per ottenere il WarehouseID numerico
      const sourceWarehouseData = warehouses.find(
        (w) =>
          (w.WarehouseUUID || w.WarehouseID.toString()) ===
            selectedProductForMove.warehouse_id ||
          w.WarehouseName === selectedProductForMove.warehouse_id ||
          w.WarehouseCode === selectedProductForMove.warehouse_id
      );

      if (!targetWarehouseData || !sourceWarehouseData) {
        alert(
          "Impossibile trovare i dati del magazzino. Verifica che i magazzini siano validi."
        );
        return;
      }

      // Chiamata API per il trasferimento usando gli ID numerici
      const transferData = {
        product_id: selectedProductForMove.product_id,
        amount: amount,
        from_warehouse_id: sourceWarehouseData.WarehouseID, // ID numerico
        to_warehouse_id: targetWarehouseData.WarehouseID, // ID numerico
        movement_date: new Date().toISOString(),
        notes: `Trasferimento di ${amount} unità di ${selectedProductForMove.name}`,
        reason: "Trasferimento tra magazzini",
      };

      console.log("Dati trasferimento:", {
        ...transferData,
        sourceWarehouse: sourceWarehouseData.WarehouseName,
        targetWarehouse: targetWarehouseData.WarehouseName,
      });

      const response = await axios.post(
        "/Movement/POST/CreateTransferMovement",
        transferData
      );

      if (response.status === 201) {
        // Aggiorna la quantità del prodotto nel magazzino di origine
        const newQuantity = selectedProductForMove.quantity - amount;
        if (onUpdateQuantity) {
          onUpdateQuantity(selectedProductForMove.product_id, newQuantity);
        }

        // Mostra messaggio di successo
        setShowSuccessMessage(true);
        setSuccessMessage(
          `${amount} unità di "${selectedProductForMove.name}" spostate con successo da ${sourceWarehouseData.WarehouseName} a ${targetWarehouseData.WarehouseName}!`
        );
        setIsMoveModalOpen(false);

        // Reset dei campi
        setMoveQuantity("");
        setTargetWarehouse("");

        console.log("Trasferimento completato con successo:", response.data);
      }
    } catch (error: any) {
      console.error("Errore nello spostamento:", error);

      let errorMessage = "Errore nello spostamento. Riprova.";
      if (error.response?.status === 400) {
        errorMessage =
          error.response.data?.error || "Dati non validi per il trasferimento";
      } else if (error.response?.status === 404) {
        errorMessage = "Endpoint di trasferimento non trovato";
      } else if (error.code === "ERR_NETWORK") {
        errorMessage = "Errore di connessione al server";
      }

      alert(`Errore: ${errorMessage}`);
    } finally {
      setIsProcessingMove(false);
    }
  };

  const openLoadModal = (product: Product) => {
    setSelectedProductForLoad(product);
    setLoadQuantity("");
    setTargetVehicle("");
    setIsLoadModalOpen(true);
  };

  const handleLoadOperation = async () => {
    if (!selectedProductForLoad || !loadQuantity || !targetVehicle) return;

    setIsProcessingLoad(true);
    try {
      const amount = parseInt(loadQuantity);

      if (amount > selectedProductForLoad.quantity) {
        alert("Quantità da caricare superiore alla disponibilità");
        return;
      }

      // Chiamata API per caricare su furgone
      const warehouseObj = warehouses.find(
        (w) =>
          w.WarehouseUUID === selectedProductForLoad?.warehouse_id ||
          w.WarehouseID.toString() === selectedProductForLoad?.warehouse_id ||
          w.WarehouseName === selectedProductForLoad?.warehouse_id ||
          w.WarehouseCode === selectedProductForLoad?.warehouse_id
      );
      const fromWarehouseId = warehouseObj
        ? warehouseObj.WarehouseID
        : selectedProductForLoad?.warehouse_id;
      await axios.post("/Movement/POST/CreateLoadToVehicleMovement", {
        product_id: selectedProductForLoad.product_id,
        from_warehouse_id: fromWarehouseId,
        to_vehicle_id: parseInt(targetVehicle),
        amount: parseInt(loadQuantity),
      });

      alert(
        `${amount} unità di "${selectedProductForLoad.name}" caricate su furgone con successo!`
      );
      setIsLoadModalOpen(false);
    } catch (error: any) {
      console.error("Errore nel caricamento:", error);
      let errorMessage = "Errore nel caricamento. Riprova.";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      alert(errorMessage);
    } finally {
      setIsProcessingLoad(false);
    }
  };

  const renderCell = useCallback((product: Product, columnKey: React.Key) => {
    const productId = product.product_id || product.id || "";

    switch (columnKey) {
      case "name":
        return (
          <User
            avatarProps={{
              radius: "lg",
              src: product.image || "https://via.placeholder.com/40",
              className: "hidden md:flex object-cover border-0",
            }}
            description={`SKU: ${product.sku || "N/A"}`}
            name={product.name}
          >
            {product.name}
          </User>
        );
      case "category":
        return (
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full bg-${product.category
                .toLowerCase()
                .replace(/\s+/g, "")}`}
            />
            {product.category}
          </div>
        );
      case "quantity":
        return (
          <InlineQuantityEditor
            product={{
              product_id: product.product_id,
              quantity: product.quantity,
              min_stock_treshold: product.min_stock_treshold,
              warehouse_id: product.warehouse_id,
            }}
            onUpdate={(id, newQuantity) => {
              if (onUpdateQuantity) {
                onUpdateQuantity(id, newQuantity);
              }
            }}
            onStockOperation={(p, type) => {
              openStockModal(product, type);
            }}
            onMoveOperation={() => {
              openMoveModal(product);
            }}
            onBatchSelect={() => {
              const productKey = product.product_id || product.id || "";
              if (typeof selectedKeys === "string") {
                setSelectedKeys(new Set([productKey]));
              } else {
                const newSelection = new Set(selectedKeys);
                if (newSelection.has(productKey)) {
                  newSelection.delete(productKey);
                } else {
                  newSelection.add(productKey);
                }
                setSelectedKeys(newSelection);
              }
            }}
            isSelected={
              typeof selectedKeys === "string"
                ? selectedKeys === "all"
                : selectedKeys.has(product.product_id || product.id || "")
            }
          />
        );
      case "price":
        return (
          <div className="flex justify-start w-full">
            <div className="font-medium">
              €{parseFloat(product.price.toString()).toFixed(2)}
            </div>
          </div>
        );
      case "warehouse":
        return (
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full bg-${product.warehouse_id
                .toLowerCase()
                .replace(/\s+/g, "")}`}
            />
            {product.warehouse_id}
          </div>
        );
      case "status":
        return (
          <Chip
            className="capitalize"
            color={statusColorMap[product.status]}
            size="sm"
            variant="flat"
          >
            {product.status}
          </Chip>
        );
      case "inventory_actions":
        return (
          <div className="flex justify-start items-center gap-1">
            <Tooltip content="Aumenta quantità">
              <Button
                isIconOnly
                size="sm"
                color="success"
                variant="flat"
                onPress={() => openStockModal(product, "increase")}
                className="min-w-8 h-8"
              >
                <Icon icon="solar:add-circle-bold" width={16} />
              </Button>
            </Tooltip>

            <Tooltip content="Diminuisci quantità">
              <Button
                isIconOnly
                size="sm"
                color="warning"
                variant="flat"
                onPress={() => openStockModal(product, "decrease")}
                className="min-w-8 h-8"
                isDisabled={product.quantity <= 0}
              >
                <Icon icon="solar:minus-circle-bold" width={16} />
              </Button>
            </Tooltip>

            <Tooltip content="Sposta tra magazzini">
              <Button
                isIconOnly
                size="sm"
                color="primary"
                variant="flat"
                onPress={() => openMoveModal(product)}
                className="min-w-8 h-8"
                isDisabled={product.quantity <= 0}
              >
                <Icon icon="solar:transfer-horizontal-bold" width={16} />
              </Button>
            </Tooltip>

            <Tooltip content="Carica su furgone">
              <Button
                isIconOnly
                size="sm"
                color="secondary"
                variant="flat"
                onPress={() => openLoadModal(product)}
                className="min-w-8 h-8"
                isDisabled={product.quantity <= 0}
              >
                <Icon icon="solar:delivery-bold" width={16} />
              </Button>
            </Tooltip>
          </div>
        );
      case "actions":
        return (
          <div className="flex justify-start items-center gap-2">
            <Dropdown showArrow placement="bottom-end">
              <DropdownTrigger>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="hover:bg-default-100"
                >
                  <Icon icon="nimbus:ellipsis" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                variant="bordered"
                aria-label="Azioni prodotto"
                className="min-w-[180px]"
              >
                <DropdownItem
                  key="view"
                  onClick={() => {
                    setSelectedProduct(product);
                    onOpen();
                  }}
                  className="text-default-700 data-[hover=true]:text-default-900 data-[hover=true]:bg-default-100"
                  startContent={
                    <Icon
                      icon="solar:eye-bold"
                      className="text-lg text-default-600"
                    />
                  }
                >
                  Visualizza
                </DropdownItem>
                <DropdownItem
                  key="edit"
                  onClick={() => goToEditProduct(productId)}
                  className="text-primary-600 data-[hover=true]:text-primary-700 data-[hover=true]:bg-primary-50"
                  startContent={
                    <Icon
                      icon="solar:pen-line-duotone"
                      className="text-lg text-primary-500"
                    />
                  }
                >
                  Modifica
                </DropdownItem>
                <DropdownItem
                  key="delete"
                  onClick={() => confirmDeleteProduct(product)}
                  className="text-danger-600 data-[hover=true]:text-danger-700 data-[hover=true]:bg-danger-50"
                  startContent={
                    <Icon
                      icon="solar:trash-bin-minimalistic-linear"
                      className="text-lg text-danger-500"
                    />
                  }
                >
                  Elimina
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        const value = product[columnKey as keyof Product];
        if (Array.isArray(value)) {
          return value.map((item) => item.name || "").join(", ");
        }
        return value?.toString() || "";
    }
  }, []);

  const onNextPage = useCallback(() => {
    if (page < pages) {
      setPage(page + 1);
    }
  }, [page, pages]);

  const onPreviousPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

  const onRowsPerPageChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setRowsPerPage(Number(e.target.value));
      setPage(1);
    },
    []
  );

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          <div className="flex gap-3">
            {((typeof selectedKeys !== "string" && selectedKeys.size > 0) ||
              selectedKeys === "all") && (
              <div className="flex gap-2">
                <Button
                  color="success"
                  variant="flat"
                  startContent={<Icon icon="solar:add-circle-bold" />}
                  onPress={() => openBatchStockModal("increase")}
                >
                  Aumenta Stock (
                  {typeof selectedKeys !== "string"
                    ? selectedKeys.size
                    : products.length}
                  )
                </Button>

                <Button
                  color="warning"
                  variant="flat"
                  startContent={<Icon icon="solar:minus-circle-bold" />}
                  onPress={() => openBatchStockModal("decrease")}
                >
                  Diminuisci Stock (
                  {typeof selectedKeys !== "string"
                    ? selectedKeys.size
                    : products.length}
                  )
                </Button>

                <Button
                  color="primary"
                  variant="flat"
                  startContent={<Icon icon="solar:transfer-horizontal-bold" />}
                  onPress={() => openBatchMoveModal()}
                >
                  Sposta Prodotti (
                  {typeof selectedKeys !== "string"
                    ? selectedKeys.size
                    : products.length}
                  )
                </Button>

                <Button
                  color="secondary"
                  variant="flat"
                  startContent={<Icon icon="solar:delivery-bold" />}
                  onPress={() => openBatchLoadModal()}
                >
                  Carica su Furgone (
                  {typeof selectedKeys !== "string"
                    ? selectedKeys.size
                    : products.length}
                  )
                </Button>

                <Button
                  color="danger"
                  onPress={() => {
                    if (onDeleteProduct) {
                      if (selectedKeys === "all") {
                        // Delete all products
                        products.forEach((product) => {
                          onDeleteProduct(
                            product.product_id || product.id || ""
                          );
                        });
                      } else if (typeof selectedKeys !== "string") {
                        // Delete selected products
                        Array.from(selectedKeys).forEach((id) => {
                          onDeleteProduct(id.toString());
                        });
                      }
                      setSelectedKeys(new Set([]));
                    }
                  }}
                >
                  Elimina Selezionati{" "}
                  {typeof selectedKeys !== "string"
                    ? selectedKeys.size
                    : products.length}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }, [
    selectedKeys,
    products.length,
    onRowsPerPageChange,
    onDeleteProduct,
    products,
  ]);

  const bottomContent = useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <div className="flex gap-2"></div>
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={page}
          total={pages}
          onChange={setPage}
        />
        <div className="flex items-center gap-2">
          <span className="text-small text-default-400">Righe per pagina:</span>
          <Select
            size="sm"
            selectedKeys={[rowsPerPage.toString()]}
            className="w-20"
            onChange={onRowsPerPageChange}
          >
            <SelectItem key="10">10</SelectItem>
            <SelectItem key="20">20</SelectItem>
            <SelectItem key="50">50</SelectItem>
          </Select>
        </div>
      </div>
    );
  }, [page, pages, rowsPerPage, onRowsPerPageChange]);

  // Add keyboard shortcuts handler near the top of the component
  const handleKeyboardShortcuts = useCallback(
    (e: KeyboardEvent) => {
      if (e.altKey && selectedProduct) {
        switch (e.key.toLowerCase()) {
          case "v":
            setSelectedProduct(selectedProduct);
            onOpen();
            break;
          case "e":
            goToEditProduct(
              selectedProduct.product_id || selectedProduct.id || ""
            );
            break;
          case "d":
            confirmDeleteProduct(selectedProduct);
            break;
        }
      }
    },
    [selectedProduct, onOpen, goToEditProduct, confirmDeleteProduct]
  );

  // Add effect to handle keyboard shortcuts
  React.useEffect(() => {
    window.addEventListener("keydown", handleKeyboardShortcuts);
    return () => window.removeEventListener("keydown", handleKeyboardShortcuts);
  }, [handleKeyboardShortcuts]);

  // Effetto per nascondere automaticamente il messaggio di successo
  React.useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
        setSuccessMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  // Funzione per ottenere i prodotti selezionati
  const getSelectedProducts = () => {
    if (selectedKeys === "all") {
      return products;
    } else if (typeof selectedKeys !== "string") {
      const selectedSet = new Set(
        Array.from(selectedKeys).map((k) => k.toString())
      );
      return products.filter((product) => {
        const productKey = (product.product_id || product.id || "").toString();
        return selectedSet.has(productKey);
      });
    }
    return [];
  };

  // Funzioni per operazioni batch
  const openBatchStockModal = (type: "increase" | "decrease") => {
    setBatchProducts(getSelectedProducts());
    setBatchStockType(type);
    setBatchStockReason("");
    setBatchStockData({});
    setIsBatchStockModalOpen(true);
  };

  const openBatchMoveModal = () => {
    setBatchProducts(getSelectedProducts());
    setBatchMoveData({});
    setBatchTargetWarehouse(""); // Reset esplicito per mostrare il placeholder
    setIsBatchMoveModalOpen(true);
  };

  const openBatchLoadModal = () => {
    setBatchProducts(getSelectedProducts());
    setBatchLoadData({});
    setBatchTargetVehicle("");
    setIsBatchLoadModalOpen(true);
  };

  const handleBatchStockOperation = async () => {
    if (batchProducts.length === 0 || !batchStockReason) return;

    setIsProcessingBatchStock(true);
    try {
      const validOperations = [];
      const invalidOperations = [];

      // Valida tutte le operazioni prima di eseguirle
      for (const product of batchProducts) {
        const productId = product.product_id || product.id || "";
        const amount = parseInt(batchStockData[productId] || "0");

        if (amount > 0) {
          const newQuantity =
            batchStockType === "increase"
              ? product.quantity + amount
              : product.quantity - amount;

          if (newQuantity >= 0) {
            validOperations.push({
              product,
              productId,
              amount,
              newQuantity,
            });
          } else {
            invalidOperations.push({
              product,
              amount,
              available: product.quantity,
              deficit: Math.abs(newQuantity),
            });
          }
        }
      }

      // Se ci sono operazioni non valide, mostra errore
      if (invalidOperations.length > 0) {
        const errorMessages = invalidOperations
          .map(
            (op) =>
              `${op.product.name}: richiesto ${op.amount}, disponibile ${op.available} (deficit: ${op.deficit})`
          )
          .join("\n");

        alert(
          `Le seguenti operazioni non possono essere eseguite perché porterebbero a quantità negative:\n\n${errorMessages}\n\nCorreggi le quantità e riprova.`
        );
        return;
      }

      // Esegui solo le operazioni valide
      let successCount = 0;
      let errorCount = 0;

      for (const operation of validOperations) {
        try {
          // Usa lo stesso endpoint dell'InlineQuantityEditor
          await axios.put(`/Product/UPDATE/UpdateProductQuantity/`, {
            product_id: operation.productId,
            stock_unit: operation.newQuantity.toString(),
          });

          // Registra il movimento
          const movementEndpoint =
            batchStockType === "increase"
              ? "/Movement/POST/CreateLoadMovement"
              : "/Movement/POST/CreateUnloadMovement";

          const movementData = {
            product_id: operation.productId,
            quantity: operation.amount,
            reason: batchStockReason,
            warehouse_id: operation.product.warehouse_id,
            timestamp: new Date().toISOString(),
            movement_type: batchStockType === "increase" ? "LOAD" : "UNLOAD",
            notes: `${
              batchStockType === "increase" ? "Carico" : "Scarico"
            } batch: ${batchStockReason}`,
            user_id: "current_user",
            created_at: new Date().toISOString(),
          };

          try {
            await axios.post(movementEndpoint, movementData);
          } catch (movementError) {
            console.warn(
              "Errore nella registrazione del movimento:",
              movementError
            );
          }

          // Aggiorna l'UI
          if (onUpdateQuantity) {
            onUpdateQuantity(operation.productId, operation.newQuantity);
          }
          successCount++;
        } catch (error) {
          console.error(
            `Errore nell'aggiornamento del prodotto ${operation.product.name}:`,
            error
          );
          errorCount++;
        }
      }

      // Mostra risultati
      let message = `Operazione completata: ${successCount} prodotti aggiornati con successo`;
      if (errorCount > 0) {
        message += `, ${errorCount} errori`;
      }

      setShowSuccessMessage(true);
      setSuccessMessage(message);
      setIsBatchStockModalOpen(false);
      setSelectedKeys(new Set([]));
    } catch (error) {
      console.error("Errore nell'operazione batch:", error);
      alert("Errore nell'operazione. Riprova.");
    } finally {
      setIsProcessingBatchStock(false);
    }
  };

  const handleBatchMoveOperation = async () => {
    if (batchProducts.length === 0 || !batchTargetWarehouse) return;

    setIsProcessingBatchMove(true);
    try {
      const validOperations = [];
      const invalidOperations = [];

      // Valida tutte le operazioni prima di eseguirle
      for (const product of batchProducts) {
        const productId = product.product_id || product.id || "";
        const amount = parseInt(batchMoveData[productId] || "0");

        if (amount > 0) {
          if (amount <= product.quantity) {
            validOperations.push({
              product,
              productId,
              amount,
            });
          } else {
            invalidOperations.push({
              product,
              amount,
              available: product.quantity,
              excess: amount - product.quantity,
            });
          }
        }
      }

      // Se ci sono operazioni non valide, mostra errore
      if (invalidOperations.length > 0) {
        const errorMessages = invalidOperations
          .map(
            (op) =>
              `${op.product.name}: richiesto ${op.amount}, disponibile ${op.available} (eccesso: ${op.excess})`
          )
          .join("\n");

        alert(
          `Le seguenti operazioni non possono essere eseguite perché la quantità richiesta supera quella disponibile:\n\n${errorMessages}\n\nCorreggi le quantità e riprova.`
        );
        return;
      }

      // Trova il magazzino di destinazione
      const targetWarehouseData = warehouses.find(
        (w) =>
          (w.WarehouseUUID || w.WarehouseID.toString()) === batchTargetWarehouse
      );

      if (!targetWarehouseData) {
        alert("Impossibile trovare i dati del magazzino di destinazione.");
        return;
      }

      // Esegui i trasferimenti
      let successCount = 0;
      let errorCount = 0;

      for (const operation of validOperations) {
        try {
          // Trova il magazzino di origine per questo prodotto
          const sourceWarehouseData = warehouses.find(
            (w) =>
              (w.WarehouseUUID || w.WarehouseID.toString()) ===
                operation.product.warehouse_id ||
              w.WarehouseName === operation.product.warehouse_id ||
              w.WarehouseCode === operation.product.warehouse_id
          );

          if (!sourceWarehouseData) {
            console.error(
              `Magazzino di origine non trovato per prodotto ${operation.product.name}`
            );
            errorCount++;
            continue;
          }

          const transferData = {
            product_id: operation.productId,
            amount: operation.amount,
            from_warehouse_id: sourceWarehouseData.WarehouseID,
            to_warehouse_id: targetWarehouseData.WarehouseID,
            movement_date: new Date().toISOString(),
            notes: `Trasferimento batch di ${operation.amount} unità di ${operation.product.name}`,
            reason: "Trasferimento batch tra magazzini",
          };

          const response = await axios.post(
            "/Movement/POST/CreateTransferMovement",
            transferData
          );

          if (response.status === 201) {
            // Aggiorna la quantità del prodotto nel magazzino di origine
            const newQuantity = operation.product.quantity - operation.amount;
            if (onUpdateQuantity) {
              onUpdateQuantity(operation.productId, newQuantity);
            }
            successCount++;
          }
        } catch (error) {
          console.error(
            `Errore nel trasferimento del prodotto ${operation.product.name}:`,
            error
          );
          errorCount++;
        }
      }

      // Mostra risultati
      let message = `${successCount} prodotti trasferiti con successo a ${targetWarehouseData.WarehouseName}`;
      if (errorCount > 0) {
        message += `, ${errorCount} errori`;
      }

      setShowSuccessMessage(true);
      setSuccessMessage(message);
      setIsBatchMoveModalOpen(false);
      setSelectedKeys(new Set([]));

      // Reset dei dati
      setBatchMoveData({});
      setBatchTargetWarehouse("");
    } catch (error) {
      console.error("Errore nello spostamento batch:", error);
      alert(
        "Errore nello spostamento. Alcuni prodotti potrebbero non essere stati trasferiti."
      );
    } finally {
      setIsProcessingBatchMove(false);
    }
  };

  const handleBatchLoadOperation = async () => {
    if (batchProducts.length === 0 || !batchTargetVehicle) return;

    setIsProcessingBatchLoad(true);
    try {
      const validOperations = [];
      const invalidOperations = [];

      // Valida tutte le operazioni prima di eseguirle
      for (const product of batchProducts) {
        const productId = product.product_id || product.id || "";
        const amount = parseInt(batchLoadData[productId] || "0");

        if (amount > 0) {
          if (amount <= product.quantity) {
            validOperations.push({
              product,
              productId,
              amount,
            });
          } else {
            invalidOperations.push({
              product,
              amount,
              available: product.quantity,
              excess: amount - product.quantity,
            });
          }
        }
      }

      // Se ci sono operazioni non valide, mostra errore
      if (invalidOperations.length > 0) {
        const errorMessages = invalidOperations
          .map(
            (op) =>
              `${op.product.name}: richiesto ${op.amount}, disponibile ${op.available} (eccesso: ${op.excess})`
          )
          .join("\n");

        alert(
          `Le seguenti operazioni non possono essere eseguite perché la quantità richiesta supera quella disponibile:\n\n${errorMessages}\n\nCorreggi le quantità e riprova.`
        );
        return;
      }

      // Chiamata API per ogni prodotto valido
      let successCount = 0;
      let errorCount = 0;
      for (const operation of validOperations) {
        try {
          const warehouseObj = warehouses.find(
            (w) =>
              w.WarehouseUUID === operation.product.warehouse_id ||
              w.WarehouseID.toString() === operation.product.warehouse_id ||
              w.WarehouseName === operation.product.warehouse_id ||
              w.WarehouseCode === operation.product.warehouse_id
          );
          const fromWarehouseId = warehouseObj
            ? warehouseObj.WarehouseID
            : operation.product.warehouse_id;
          await axios.post("/Movement/POST/CreateLoadToVehicleMovement", {
            product_id: operation.productId,
            from_warehouse_id: fromWarehouseId,
            to_vehicle_id: parseInt(batchTargetVehicle),
            amount: operation.amount,
          });
          successCount++;
        } catch (error: any) {
          console.error(
            `Errore nel caricamento batch del prodotto ${operation.product.name}:`,
            error
          );
          errorCount++;
        }
      }

      let message = `${successCount} prodotti caricati su furgone con successo`;
      if (errorCount > 0) {
        message += `, ${errorCount} errori`;
      }

      setShowSuccessMessage(true);
      setSuccessMessage(message);
      setIsBatchLoadModalOpen(false);
      setSelectedKeys(new Set([]));
    } catch (error) {
      console.error("Errore nel caricamento batch:", error);
      alert("Errore nel caricamento. Riprova.");
    } finally {
      setIsProcessingBatchLoad(false);
    }
  };

  // Funzione per caricare i magazzini dall'API
  const loadWarehouses = async () => {
    try {
      const response = await axios.get("/Warehouse/GET/GetAllWarehouses");
      // Filtra solo i magazzini attivi
      const activeWarehouses = response.data.filter(
        (warehouse: Warehouse) => warehouse.IsActive
      );
      setWarehouses(activeWarehouses);
    } catch (error) {
      console.error("Error loading warehouses:", error);
    }
  };

  // Carica i magazzini all'avvio del componente
  React.useEffect(() => {
    loadWarehouses();
  }, []);

  // Funzioni di validazione per i modali batch
  const getBatchStockValidationErrors = () => {
    return batchProducts.filter((product) => {
      const productId = product.product_id || product.id || "";
      const amount = parseInt(batchStockData[productId] || "0");
      return (
        amount > 0 && batchStockType === "decrease" && amount > product.quantity
      );
    });
  };

  const getBatchMoveValidationErrors = () => {
    return batchProducts.filter((product) => {
      const productId = product.product_id || product.id || "";
      const amount = parseInt(batchMoveData[productId] || "0");
      return amount > 0 && amount > product.quantity;
    });
  };

  const getBatchLoadValidationErrors = () => {
    return batchProducts.filter((product) => {
      const productId = product.product_id || product.id || "";
      const amount = parseInt(batchLoadData[productId] || "0");
      return amount > 0 && amount > product.quantity;
    });
  };

  return (
    <>
      {/* Notifica di successo */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-full duration-300">
          <div className="flex items-center gap-3 bg-success-50 border border-success-200 text-success-800 px-4 py-3 rounded-lg shadow-lg min-w-[300px]">
            <div className="flex-shrink-0">
              <Icon
                icon="solar:check-circle-bold"
                className="text-success-600 text-xl"
              />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{successMessage}</p>
            </div>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              className="text-success-600 hover:bg-success-100"
              onPress={() => {
                setShowSuccessMessage(false);
                setSuccessMessage("");
              }}
            >
              <Icon icon="solar:close-circle-bold" className="text-lg" />
            </Button>
          </div>
        </div>
      )}

      <Table
        aria-label="Tabella prodotti"
        bottomContent={bottomContent}
        bottomContentPlacement="inside"
        selectedKeys={selectedKeys}
        selectionMode="multiple"
        sortDescriptor={{
          column: sortBy?.field || "name",
          direction: sortBy?.direction === "asc" ? "ascending" : "descending",
        }}
        topContent={topContent}
        topContentPlacement="inside"
        onSelectionChange={setSelectedKeys}
        onSortChange={(descriptor) => {
          if (onSort) {
            onSort({
              field: descriptor.column as keyof Product,
              direction: descriptor.direction === "ascending" ? "asc" : "desc",
            });
          }
        }}
        isStriped
        selectionBehavior="toggle"
        classNames={{
          th: [
            "bg-default-100",
            "text-default-800",
            "border-b border-divider",
            "py-3 px-4",
          ],
          td: ["py-3 px-4", "border-b border-divider"],
          wrapper: "border border-divider rounded-lg",
          tr: "cursor-pointer hover:bg-default-50",
        }}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn
              key={column.uid}
              align="start"
              allowsSorting={column.sortable}
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody
          emptyContent={<EmptyState isLoading={isLoading} />}
          items={sortedItems}
        >
          {(item) => (
            <TableRow key={item.product_id || item.id}>
              {(columnKey) => (
                <TableCell>
                  <div
                    className={
                      columnKey === "actions" ? "flex justify-start" : ""
                    }
                  >
                    {renderCell(item, columnKey)}
                  </div>
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Product details modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        backdrop="blur"
        radius="lg"
        classNames={{
          base: isDark
            ? "bg-zinc-900 text-white border border-zinc-700"
            : "border border-zinc-200",
          header: isDark ? "border-b border-zinc-700" : "",
          body: isDark ? "text-zinc-300" : "",
          footer: isDark ? "border-t border-zinc-700" : "",
        }}
      >
        <ModalContent>
          {selectedProduct && (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-xl font-semibold">Dettagli Prodotto</h3>
                <p className="text-sm text-default-500">
                  Informazioni su {selectedProduct.name}
                </p>
              </ModalHeader>
              <ModalBody>
                <div className="flex justify-center mb-6">
                  <Avatar
                    src={
                      selectedProduct.image || "https://via.placeholder.com/200"
                    }
                    className="w-32 h-32 object-cover"
                    radius="lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <p
                      className={`text-small ${
                        isDark ? "text-zinc-400" : "text-zinc-500"
                      }`}
                    >
                      ID Prodotto
                    </p>
                    <p className="font-medium">
                      {selectedProduct.product_id || selectedProduct.id}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-small ${
                        isDark ? "text-zinc-400" : "text-zinc-500"
                      }`}
                    >
                      Nome
                    </p>
                    <p className="font-medium">{selectedProduct.name}</p>
                  </div>
                  <div>
                    <p
                      className={`text-small ${
                        isDark ? "text-zinc-400" : "text-zinc-500"
                      }`}
                    >
                      SKU
                    </p>
                    <p className="font-medium">
                      {selectedProduct.sku || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-small ${
                        isDark ? "text-zinc-400" : "text-zinc-500"
                      }`}
                    >
                      Categoria
                    </p>
                    <div className="flex items-center">
                      <span
                        className={`w-2 h-2 rounded-full bg-${selectedProduct.category
                          .toLowerCase()
                          .replace(/\s+/g, "")} mr-2`}
                      />
                      <p className="font-medium">{selectedProduct.category}</p>
                    </div>
                  </div>
                  <div>
                    <p
                      className={`text-small ${
                        isDark ? "text-zinc-400" : "text-zinc-500"
                      }`}
                    >
                      Quantità
                    </p>
                    <p
                      className={`font-medium ${
                        (selectedProduct.quantity || 0) > 0
                          ? (selectedProduct.quantity || 0) <=
                            (selectedProduct.min_stock_treshold || 10)
                            ? "text-warning"
                            : "text-success"
                          : "text-danger"
                      }`}
                    >
                      {selectedProduct.quantity || 0}
                      {(selectedProduct.quantity || 0) === 0 && (
                        <span className="text-xs ml-1"></span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-small ${
                        isDark ? "text-zinc-400" : "text-zinc-500"
                      }`}
                    >
                      Prezzo
                    </p>
                    <p className="font-medium">
                      €{parseFloat(selectedProduct.price.toString()).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-small ${
                        isDark ? "text-zinc-400" : "text-zinc-500"
                      }`}
                    >
                      Magazzino
                    </p>
                    <div className="flex items-center">
                      <span
                        className={`w-2 h-2 rounded-full bg-${selectedProduct.warehouse_id
                          .toLowerCase()
                          .replace(/\s+/g, "")} mr-2`}
                      />
                      <p className="font-medium">
                        {selectedProduct.warehouse_id}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p
                      className={`text-small ${
                        isDark ? "text-zinc-400" : "text-zinc-500"
                      }`}
                    >
                      Stato
                    </p>
                    <Chip
                      color={statusColorMap[selectedProduct.status]}
                      variant="flat"
                      size="sm"
                    >
                      {selectedProduct.status}
                    </Chip>
                  </div>
                  {selectedProduct.description && (
                    <div className="col-span-2">
                      <p
                        className={`text-small ${
                          isDark ? "text-zinc-400" : "text-zinc-500"
                        }`}
                      >
                        Descrizione
                      </p>
                      <p className="font-medium">
                        {selectedProduct.description}
                      </p>
                    </div>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant={isDark ? "flat" : "light"}
                  onPress={onClose}
                >
                  Chiudi
                </Button>
                <Button
                  color="primary"
                  onPress={() => {
                    onClose();
                    goToEditProduct(
                      selectedProduct.product_id || selectedProduct.id || ""
                    );
                  }}
                >
                  Modifica
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Delete confirmation modal */}
      <DeleteProductModal
        product={productToDelete}
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onDelete={handleDeleteProduct}
      />

      {/* Modal Gestione Stock */}
      <Modal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        size="2xl"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-semibold">
              {stockModalType === "increase"
                ? "Aumenta Quantità"
                : "Diminuisci Quantità"}
            </h3>
            <p className="text-sm text-default-500">
              {selectedProductForStock?.name}
            </p>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-default-100 rounded-lg">
                <div>
                  <p className="text-sm text-default-600">Quantità Attuale</p>
                  <p className="text-2xl font-bold">
                    {selectedProductForStock?.quantity || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-default-600">Magazzino</p>
                  <p className="font-medium">
                    {selectedProductForStock?.warehouse_id}
                  </p>
                </div>
              </div>

              <Input
                type="number"
                label={`Quantità da ${
                  stockModalType === "increase" ? "aggiungere" : "rimuovere"
                }`}
                placeholder="Inserisci la quantità"
                value={stockAmount}
                onChange={(e) => setStockAmount(e.target.value)}
                min="1"
                max={
                  stockModalType === "decrease"
                    ? selectedProductForStock?.quantity
                    : undefined
                }
                startContent={
                  <Icon
                    icon={
                      stockModalType === "increase"
                        ? "solar:add-circle-bold"
                        : "solar:minus-circle-bold"
                    }
                    className={
                      stockModalType === "increase"
                        ? "text-success"
                        : "text-warning"
                    }
                  />
                }
              />

              <Textarea
                label="Motivo dell'operazione"
                placeholder="Inserisci il motivo di questa operazione di inventario"
                value={stockReason}
                onChange={(e) => setStockReason(e.target.value)}
                minRows={2}
              />

              {stockAmount && selectedProductForStock && (
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-default-600 mb-1">
                    Nuova quantità:
                  </p>
                  <p className="text-xl font-bold text-primary">
                    {stockModalType === "increase"
                      ? selectedProductForStock.quantity +
                        parseInt(stockAmount || "0")
                      : selectedProductForStock.quantity -
                        parseInt(stockAmount || "0")}
                  </p>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsStockModalOpen(false)}>
              Annulla
            </Button>
            <Button
              color={stockModalType === "increase" ? "success" : "warning"}
              onPress={handleStockOperation}
              isLoading={isProcessingStock}
              isDisabled={!stockAmount || !stockReason}
            >
              {stockModalType === "increase"
                ? "Aumenta Quantità"
                : "Diminuisci Quantità"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Spostamento tra Magazzini */}
      <Modal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        size="2xl"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-semibold">Sposta tra Magazzini</h3>
            <p className="text-sm text-default-500">
              {selectedProductForMove?.name}
            </p>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-default-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon="solar:home-bold" className="text-default-600" />
                    <p className="text-sm text-default-600 font-medium">
                      Magazzino Attuale
                    </p>
                  </div>
                  <p className="font-medium text-lg">
                    {selectedProductForMove?.warehouse_id}
                  </p>
                  <p className="text-xs text-default-500">
                    Disponibili: {selectedProductForMove?.quantity} unità
                  </p>
                </div>
                <div
                  className={`p-4 rounded-lg border-2 transition-all ${
                    targetWarehouse
                      ? "border-success bg-success/10"
                      : "border-dashed border-primary bg-primary/5"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon
                      icon={
                        targetWarehouse
                          ? "solar:home-bold"
                          : "solar:home-linear"
                      }
                      className={
                        targetWarehouse ? "text-success" : "text-primary"
                      }
                    />
                    <p
                      className={`text-sm font-medium ${
                        targetWarehouse ? "text-success" : "text-primary"
                      }`}
                    >
                      Magazzino Destinazione
                    </p>
                  </div>
                  <p
                    className={`font-medium text-lg ${
                      targetWarehouse ? "text-success" : "text-primary"
                    }`}
                  >
                    {targetWarehouse
                      ? warehouses.find(
                          (w) =>
                            (w.WarehouseUUID || w.WarehouseID.toString()) ===
                            targetWarehouse
                        )?.WarehouseName
                      : "Seleziona destinazione"}
                  </p>
                  {targetWarehouse && (
                    <p className="text-xs text-success-600">
                      Magazzino selezionato ✓
                    </p>
                  )}
                </div>
              </div>

              {/* Visual separator with arrow */}
              <div className="flex items-center justify-center py-2">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                  <Icon icon="solar:arrow-down-bold" className="text-primary" />
                  <span className="text-sm font-medium text-primary">
                    Sposta prodotto
                  </span>
                  <Icon icon="solar:arrow-down-bold" className="text-primary" />
                </div>
              </div>

              <Input
                type="number"
                label="Quantità da spostare"
                placeholder="Inserisci la quantità"
                value={moveQuantity}
                onChange={(e) => setMoveQuantity(e.target.value)}
                min="1"
                max={selectedProductForMove?.quantity}
                startContent={
                  <Icon
                    icon="solar:transfer-horizontal-bold"
                    className="text-primary"
                  />
                }
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-default-700 flex items-center gap-2">
                  <Icon icon="solar:buildings-bold" className="text-primary" />
                  Seleziona Magazzino di Destinazione
                </label>
                <Select
                  placeholder="Scegli dove spostare il prodotto"
                  selectedKeys={targetWarehouse ? [targetWarehouse] : undefined}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    setTargetWarehouse(selectedKey || "");
                  }}
                  size="lg"
                  variant="bordered"
                  classNames={{
                    trigger: targetWarehouse ? "border-success" : "",
                  }}
                  startContent={
                    <Icon
                      icon="solar:buildings-2-bold"
                      className={
                        targetWarehouse ? "text-success" : "text-default-400"
                      }
                    />
                  }
                  aria-label="Seleziona magazzino di destinazione"
                >
                  {warehouses
                    .filter((warehouse) => {
                      if (!selectedProductForMove) return true;

                      const warehouseUUID = warehouse.WarehouseUUID;
                      const warehouseID = warehouse.WarehouseID.toString();
                      const warehouseCode = warehouse.WarehouseCode;
                      const sourceWarehouseId =
                        selectedProductForMove.warehouse_id;

                      return (
                        warehouseUUID !== sourceWarehouseId &&
                        warehouseID !== sourceWarehouseId &&
                        warehouseCode !== sourceWarehouseId &&
                        warehouse.WarehouseName !== sourceWarehouseId
                      );
                    })
                    .map((warehouse) => (
                      <SelectItem
                        key={
                          warehouse.WarehouseUUID ||
                          warehouse.WarehouseID.toString()
                        }
                        textValue={warehouse.WarehouseName}
                        startContent={
                          <Icon
                            icon="solar:home-bold"
                            className="text-primary"
                          />
                        }
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {warehouse.WarehouseName}
                          </span>
                          <span className="text-xs text-default-500">
                            {warehouse.WarehouseCode}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                </Select>
                {!targetWarehouse && (
                  <p className="text-xs text-warning-600 flex items-center gap-1">
                    <Icon icon="solar:info-circle-bold" width={12} />
                    Devi selezionare un magazzino di destinazione
                  </p>
                )}
              </div>

              {/* Riepilogo operazione */}
              {moveQuantity && targetWarehouse && selectedProductForMove && (
                <div className="p-4 bg-gradient-to-r from-primary/10 to-success/10 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon
                      icon="solar:document-text-bold"
                      className="text-primary"
                    />
                    <h4 className="font-semibold text-primary">
                      Riepilogo Operazione
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-default-600">Prodotto:</span>
                        <span className="font-medium">
                          {selectedProductForMove.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-default-600">
                          Quantità da spostare:
                        </span>
                        <span className="font-bold text-primary">
                          {moveQuantity} unità
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-default-600">
                          Quantità rimanente:
                        </span>
                        <span className="font-bold text-default-700">
                          {selectedProductForMove.quantity -
                            parseInt(moveQuantity || "0")}{" "}
                          unità
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-default-600">Da:</span>
                        <span className="font-medium">
                          {selectedProductForMove.warehouse_id}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-default-600">Verso:</span>
                        <span className="font-bold text-success">
                          {
                            warehouses.find(
                              (w) =>
                                (w.WarehouseUUID ||
                                  w.WarehouseID.toString()) === targetWarehouse
                            )?.WarehouseName
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-success-600">
                        <Icon icon="solar:check-circle-bold" width={14} />
                        <span className="text-xs">
                          Pronto per il trasferimento
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsMoveModalOpen(false)}>
              Annulla
            </Button>
            <Button
              color="primary"
              onPress={handleMoveOperation}
              isLoading={isProcessingMove}
              isDisabled={!moveQuantity || !targetWarehouse}
              startContent={<Icon icon="solar:transfer-horizontal-bold" />}
            >
              Sposta Prodotto
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Caricamento su Furgone */}
      <Modal
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
        size="2xl"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-semibold">Carica su Furgone</h3>
            <p className="text-sm text-default-500">
              {selectedProductForLoad?.name}
            </p>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="p-4 bg-default-100 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-default-600">Magazzino</p>
                    <p className="font-medium">
                      {selectedProductForLoad?.warehouse_id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-default-600">Disponibili</p>
                    <p className="font-medium">
                      {selectedProductForLoad?.quantity} unità
                    </p>
                  </div>
                </div>
              </div>

              <Input
                type="number"
                label="Quantità da caricare"
                placeholder="Inserisci la quantità"
                value={loadQuantity}
                onChange={(e) => setLoadQuantity(e.target.value)}
                min="1"
                max={selectedProductForLoad?.quantity}
                startContent={
                  <Icon icon="solar:delivery-bold" className="text-secondary" />
                }
              />

              <Select
                label="Furgone destinazione"
                placeholder="Seleziona il furgone"
                selectedKeys={targetVehicle ? [targetVehicle] : []}
                onChange={(e) => setTargetVehicle(e.target.value)}
              >
                {vehicles.map((vehicle) => (
                  <SelectItem
                    key={vehicle.vehicle_id}
                    textValue={`${vehicle.name} ${vehicle.license_plate}`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        icon="solar:delivery-bold"
                        className="text-secondary"
                        width={16}
                      />
                      <span className="font-medium">{vehicle.name}</span>
                      <span className="text-xs text-default-500">
                        {vehicle.license_plate}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </Select>

              {vehicles.filter((v) => !v.IsAvailable).length > 0 && (
                <div className="p-3 bg-warning/10 rounded-lg">
                  <p className="text-sm text-warning-600 mb-2">
                    <Icon
                      icon="solar:info-circle-bold"
                      className="inline mr-1"
                    />
                    Furgoni non disponibili:
                  </p>
                  <div className="space-y-1">
                    {vehicles
                      .filter((v) => !v.IsAvailable)
                      .map((vehicle, idx) => (
                        <p
                          key={vehicle.VehicleID || idx}
                          className="text-xs text-warning-600"
                        >
                          • {vehicle.VehicleName} {vehicle.VehiclePlate}
                        </p>
                      ))}
                  </div>
                </div>
              )}

              {loadQuantity && targetVehicle && selectedProductForLoad && (
                <div className="p-4 bg-secondary/10 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-default-600">Quantità da caricare:</p>
                      <p className="font-bold text-secondary">
                        {loadQuantity} unità
                      </p>
                    </div>
                    <div>
                      <p className="text-default-600">Su furgone:</p>
                      <p className="font-bold">
                        {(function () {
                          const v = vehicles.find(
                            (v) => v.vehicle_id === targetVehicle
                          );
                          return v
                            ? `${v.name} ${v.license_plate}`
                            : targetVehicle;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsLoadModalOpen(false)}>
              Annulla
            </Button>
            <Button
              color="secondary"
              onPress={handleLoadOperation}
              isLoading={isProcessingLoad}
              isDisabled={!loadQuantity || !targetVehicle}
              startContent={<Icon icon="solar:delivery-bold" />}
            >
              Carica su Furgone
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Operazioni Stock Batch */}
      <Modal
        isOpen={isBatchStockModalOpen}
        onClose={() => setIsBatchStockModalOpen(false)}
        size="5xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-semibold">
              {batchStockType === "increase"
                ? "Aumenta Stock Multipli"
                : "Diminuisci Stock Multipli"}
            </h3>
            <p className="text-sm text-default-500">
              {batchProducts.length} prodotti selezionati
            </p>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Textarea
                label="Motivo dell'operazione (obbligatorio)"
                placeholder="Inserisci il motivo di questa operazione di inventario"
                value={batchStockReason}
                onChange={(e) => setBatchStockReason(e.target.value)}
                minRows={2}
                isRequired
              />

              <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                <h4 className="font-semibold mb-4">
                  Imposta quantità per ogni prodotto:
                </h4>
                <div className="space-y-3">
                  {batchProducts.map((product) => {
                    const productId = product.product_id || product.id || "";
                    const inputAmount = parseInt(
                      batchStockData[productId] || "0"
                    );
                    const isValidAmount =
                      batchStockType === "increase"
                        ? true
                        : inputAmount <= product.quantity;
                    const wouldBeNegative =
                      batchStockType === "decrease" &&
                      inputAmount > product.quantity;

                    return (
                      <div
                        key={productId}
                        className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                          wouldBeNegative
                            ? "bg-danger-50 border border-danger-200"
                            : "bg-default-50"
                        }`}
                      >
                        <div className="flex-1">
                          <p className="font-medium">{product.name}</p>
                          <div className="flex items-center gap-4 text-sm text-default-600">
                            <span>SKU: {product.sku}</span>
                            <span>Attuale: {product.quantity}</span>
                            <span>Magazzino: {product.warehouse_id}</span>
                            {wouldBeNegative && (
                              <span className="text-danger font-medium">
                                ⚠️ Quantità insufficiente
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-32">
                          <Input
                            type="number"
                            size="sm"
                            placeholder="Qta"
                            min="1"
                            max={
                              batchStockType === "decrease"
                                ? product.quantity
                                : undefined
                            }
                            value={batchStockData[productId] || ""}
                            onChange={(e) =>
                              setBatchStockData((prev) => ({
                                ...prev,
                                [productId]: e.target.value,
                              }))
                            }
                            startContent={
                              <Icon
                                icon={
                                  batchStockType === "increase"
                                    ? "solar:add-circle-bold"
                                    : "solar:minus-circle-bold"
                                }
                                className={
                                  wouldBeNegative
                                    ? "text-danger"
                                    : batchStockType === "increase"
                                    ? "text-success"
                                    : "text-warning"
                                }
                                width={16}
                              />
                            }
                            isInvalid={wouldBeNegative}
                            errorMessage={
                              wouldBeNegative
                                ? "Quantità troppo alta"
                                : undefined
                            }
                          />
                        </div>
                        <div className="w-20 text-right">
                          {batchStockData[productId] && (
                            <div className="text-sm">
                              <p
                                className={`font-bold ${
                                  wouldBeNegative
                                    ? "text-danger"
                                    : "text-primary"
                                }`}
                              >
                                {batchStockType === "increase"
                                  ? product.quantity + inputAmount
                                  : Math.max(0, product.quantity - inputAmount)}
                              </p>
                              <p className="text-xs text-default-500">Nuovo</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="flat"
                  onClick={() => {
                    const newData: { [key: string]: string } = {};
                    batchProducts.forEach((product) => {
                      const productId = product.product_id || product.id || "";
                      newData[productId] = "1";
                    });
                    setBatchStockData(newData);
                  }}
                >
                  Imposta tutto a 1
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  onClick={() => {
                    const newData: { [key: string]: string } = {};
                    batchProducts.forEach((product) => {
                      const productId = product.product_id || product.id || "";
                      newData[productId] = "5";
                    });
                    setBatchStockData(newData);
                  }}
                >
                  Imposta tutto a 5
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  onClick={() => {
                    const newData: { [key: string]: string } = {};
                    batchProducts.forEach((product) => {
                      const productId = product.product_id || product.id || "";
                      newData[productId] = "10";
                    });
                    setBatchStockData(newData);
                  }}
                >
                  Imposta tutto a 10
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  color="warning"
                  onClick={() => setBatchStockData({})}
                >
                  Azzera tutto
                </Button>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setIsBatchStockModalOpen(false)}
            >
              Annulla
            </Button>
            <Button
              color={batchStockType === "increase" ? "success" : "warning"}
              onPress={handleBatchStockOperation}
              isLoading={isProcessingBatchStock}
              isDisabled={
                !batchStockReason ||
                Object.keys(batchStockData).length === 0 ||
                getBatchStockValidationErrors().length > 0
              }
            >
              {batchStockType === "increase"
                ? "Aumenta Stock"
                : "Diminuisci Stock"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Spostamento Batch */}
      <Modal
        isOpen={isBatchMoveModalOpen}
        onClose={() => setIsBatchMoveModalOpen(false)}
        size="5xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-semibold">
              Sposta Prodotti tra Magazzini
            </h3>
            <p className="text-sm text-default-500">
              {batchProducts.length} prodotti selezionati
            </p>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Select
                label="Magazzino di destinazione"
                placeholder="Seleziona il magazzino di destinazione"
                selectedKeys={
                  batchTargetWarehouse ? [batchTargetWarehouse] : undefined
                }
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  setBatchTargetWarehouse(selectedKey || "");
                }}
                isRequired
                aria-label="Seleziona magazzino di destinazione per trasferimento batch"
              >
                {warehouses
                  .filter((warehouse) => {
                    const sourceWarehouseIds = batchProducts.map(
                      (p) => p.warehouse_id
                    );
                    const warehouseUUID = warehouse.WarehouseUUID;
                    const warehouseID = warehouse.WarehouseID.toString();
                    const warehouseCode = warehouse.WarehouseCode;
                    const warehouseName = warehouse.WarehouseName;

                    return !sourceWarehouseIds.some(
                      (sourceId) =>
                        sourceId === warehouseUUID ||
                        sourceId === warehouseID ||
                        sourceId === warehouseCode ||
                        sourceId === warehouseName
                    );
                  })
                  .map((warehouse) => (
                    <SelectItem
                      key={
                        warehouse.WarehouseUUID ||
                        warehouse.WarehouseID.toString()
                      }
                      textValue={warehouse.WarehouseName}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {warehouse.WarehouseName}
                        </span>
                        <span className="text-xs text-default-500">
                          {warehouse.WarehouseCode}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
              </Select>

              {/* Riquadro informativo sui magazzini di origine */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Icon
                    icon="solar:info-circle-bold"
                    className="text-blue-600"
                  />
                  <h4 className="font-semibold text-blue-800">
                    Magazzini di Origine
                  </h4>
                </div>
                <p className="text-sm text-blue-700 mb-2">
                  I prodotti selezionati provengono da questi magazzini (esclusi
                  dalla destinazione):
                </p>
                <div className="flex flex-wrap gap-2">
                  {Array.from(
                    new Set(batchProducts.map((p) => p.warehouse_id))
                  ).map((warehouseId) => {
                    const warehouseInfo = warehouses.find(
                      (w) =>
                        (w.WarehouseUUID || w.WarehouseID.toString()) ===
                        warehouseId
                    );
                    const productCount = batchProducts.filter(
                      (p) => p.warehouse_id === warehouseId
                    ).length;

                    return (
                      <Chip
                        key={warehouseId}
                        size="sm"
                        variant="flat"
                        color="primary"
                      >
                        {warehouseInfo?.WarehouseName || warehouseId} (
                        {productCount} prodotti)
                      </Chip>
                    );
                  })}
                </div>
              </div>

              <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                <h4 className="font-semibold mb-4">
                  Imposta quantità da spostare per ogni prodotto:
                </h4>
                <div className="space-y-3">
                  {batchProducts.map((product) => {
                    const productId = product.product_id || product.id || "";
                    const inputAmount = parseInt(
                      batchMoveData[productId] || "0"
                    );
                    const isValidAmount = inputAmount <= product.quantity;
                    const exceedsAvailable = inputAmount > product.quantity;

                    return (
                      <div
                        key={productId}
                        className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                          exceedsAvailable
                            ? "bg-danger-50 border border-danger-200"
                            : "bg-default-50"
                        }`}
                      >
                        <div className="flex-1">
                          <p className="font-medium">{product.name}</p>
                          <div className="flex items-center gap-4 text-sm text-default-600">
                            <span>SKU: {product.sku}</span>
                            <span>Disponibili: {product.quantity}</span>
                            <span>Da: {product.warehouse_id}</span>
                            {batchTargetWarehouse && (
                              <span className="text-primary">
                                →{" "}
                                {
                                  warehouses.find(
                                    (w) =>
                                      (w.WarehouseUUID ||
                                        w.WarehouseID.toString()) ===
                                      batchTargetWarehouse
                                  )?.WarehouseName
                                }
                              </span>
                            )}
                            {exceedsAvailable && (
                              <span className="text-danger font-medium">
                                ⚠️ Quantità eccessiva
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-32">
                          <Input
                            type="number"
                            size="sm"
                            placeholder="Qta"
                            min="1"
                            max={product.quantity}
                            value={batchMoveData[productId] || ""}
                            onChange={(e) =>
                              setBatchMoveData((prev) => ({
                                ...prev,
                                [productId]: e.target.value,
                              }))
                            }
                            startContent={
                              <Icon
                                icon="solar:transfer-horizontal-bold"
                                className={
                                  exceedsAvailable
                                    ? "text-danger"
                                    : "text-primary"
                                }
                                width={16}
                              />
                            }
                            isInvalid={exceedsAvailable}
                            errorMessage={
                              exceedsAvailable
                                ? "Quantità troppo alta"
                                : undefined
                            }
                          />
                        </div>
                        <div className="w-20 text-right">
                          {batchMoveData[productId] && (
                            <div className="text-sm">
                              <p
                                className={`font-bold ${
                                  exceedsAvailable
                                    ? "text-danger"
                                    : "text-default-700"
                                }`}
                              >
                                {Math.max(0, product.quantity - inputAmount)}
                              </p>
                              <p className="text-xs text-default-500">
                                Rimangono
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setIsBatchMoveModalOpen(false)}
            >
              Annulla
            </Button>
            <Button
              color="primary"
              onPress={handleBatchMoveOperation}
              isLoading={isProcessingBatchMove}
              isDisabled={
                !batchTargetWarehouse ||
                Object.keys(batchMoveData).length === 0 ||
                getBatchMoveValidationErrors().length > 0
              }
              startContent={<Icon icon="solar:transfer-horizontal-bold" />}
            >
              Sposta Prodotti
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Caricamento Batch */}
      <Modal
        isOpen={isBatchLoadModalOpen}
        onClose={() => setIsBatchLoadModalOpen(false)}
        size="5xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-semibold">
              Carica Prodotti su Furgone
            </h3>
            <p className="text-sm text-default-500">
              {batchProducts.length} prodotti selezionati
            </p>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Select
                label="Furgone destinazione"
                placeholder="Seleziona il furgone"
                selectedKeys={batchTargetVehicle ? [batchTargetVehicle] : []}
                onChange={(e) => setBatchTargetVehicle(e.target.value)}
                isRequired
              >
                {vehicles.map((vehicle) => (
                  <SelectItem
                    key={vehicle.vehicle_id}
                    textValue={`${vehicle.name} ${vehicle.license_plate}`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        icon="solar:delivery-bold"
                        className="text-secondary"
                        width={16}
                      />
                      <span className="font-medium">{vehicle.name}</span>
                      <span className="text-xs text-default-500">
                        {vehicle.license_plate}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </Select>

              {vehicles.filter((v) => !v.IsAvailable).length > 0 && (
                <div className="p-3 bg-warning/10 rounded-lg">
                  <p className="text-sm text-warning-600 mb-2">
                    <Icon
                      icon="solar:info-circle-bold"
                      className="inline mr-1"
                    />
                    Furgoni non disponibili:
                  </p>
                  <div className="space-y-1">
                    {vehicles
                      .filter((v) => !v.IsAvailable)
                      .map((vehicle, idx) => (
                        <p
                          key={vehicle.VehicleID || idx}
                          className="text-xs text-warning-600"
                        >
                          • {vehicle.VehicleName} {vehicle.VehiclePlate}
                        </p>
                      ))}
                  </div>
                </div>
              )}

              <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                <h4 className="font-semibold mb-4">
                  Imposta quantità da caricare per ogni prodotto:
                </h4>
                <div className="space-y-3">
                  {batchProducts.map((product) => {
                    const productId = product.product_id || product.id || "";
                    const inputAmount = parseInt(
                      batchLoadData[productId] || "0"
                    );
                    const exceedsAvailable = inputAmount > product.quantity;

                    return (
                      <div
                        key={productId}
                        className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                          exceedsAvailable
                            ? "bg-danger-50 border border-danger-200"
                            : "bg-default-50"
                        }`}
                      >
                        <div className="flex-1">
                          <p className="font-medium">{product.name}</p>
                          <div className="flex items-center gap-4 text-sm text-default-600">
                            <span>SKU: {product.sku}</span>
                            <span>Disponibili: {product.quantity}</span>
                            <span>Magazzino: {product.warehouse_id}</span>
                            {batchTargetVehicle && (
                              <span className="text-secondary">
                                →{" "}
                                {
                                  vehicles.find(
                                    (v) => v.id === batchTargetVehicle
                                  )?.name
                                }
                              </span>
                            )}
                            {exceedsAvailable && (
                              <span className="text-danger font-medium">
                                ⚠️ Quantità eccessiva
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-32">
                          <Input
                            type="number"
                            size="sm"
                            placeholder="Qta"
                            min="1"
                            max={product.quantity}
                            value={batchLoadData[productId] || ""}
                            onChange={(e) =>
                              setBatchLoadData((prev) => ({
                                ...prev,
                                [productId]: e.target.value,
                              }))
                            }
                            startContent={
                              <Icon
                                icon="solar:delivery-bold"
                                className={
                                  exceedsAvailable
                                    ? "text-danger"
                                    : "text-secondary"
                                }
                                width={16}
                              />
                            }
                            isInvalid={exceedsAvailable}
                            errorMessage={
                              exceedsAvailable
                                ? "Quantità troppo alta"
                                : undefined
                            }
                          />
                        </div>
                        <div className="w-20 text-right">
                          {batchLoadData[productId] && (
                            <div className="text-sm">
                              <p
                                className={`font-bold ${
                                  exceedsAvailable
                                    ? "text-danger"
                                    : "text-secondary"
                                }`}
                              >
                                {inputAmount}
                              </p>
                              <p className="text-xs text-default-500">
                                Da caricare
                              </p>
                              {batchTargetVehicle && (
                                <p className="text-xs text-secondary">
                                  Su furgone:{" "}
                                  {(function () {
                                    const v = vehicles.find(
                                      (v) => v.vehicle_id === batchTargetVehicle
                                    );
                                    return v
                                      ? `${v.name} ${v.license_plate}`
                                      : batchTargetVehicle;
                                  })()}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setIsBatchLoadModalOpen(false)}
            >
              Annulla
            </Button>
            <Button
              color="secondary"
              onPress={handleBatchLoadOperation}
              isLoading={isProcessingBatchLoad}
              isDisabled={
                !batchTargetVehicle ||
                Object.keys(batchLoadData).length === 0 ||
                getBatchLoadValidationErrors().length > 0
              }
              startContent={<Icon icon="solar:delivery-bold" />}
            >
              Carica su Furgone
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
