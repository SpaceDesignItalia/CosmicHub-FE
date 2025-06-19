import React, { useCallback, useMemo, useState, useEffect } from "react";
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
  Alert,
} from "@heroui/react";
import type { ChipProps } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { useProductTheme } from "./ProductThemeWrapper";
import DeleteProductModal from "./DeleteProductModal";
import LoadProductModal from "./LoadProductModal";
import MoveProductWarehouseModal from "./MoveProductWarehouseModal";
import { Icon } from "@iconify/react/dist/iconify.js";
import axios from "axios";

// Data types
interface Attribute {
  name: string;
  data_type: string;
  value: string;
}

interface Warehouse {
  WarehouseID: number;
  WarehouseUUID: string;
  WarehouseName: string;
  WarehouseCode: string;
  WarehouseCountry: string;
  IsActive: boolean;
}

interface Vehicle {
  vehicle_id: string;
  id?: string;
  name: string;
  license_plate: string;
  VehicleID?: number;
  VehicleName?: string;
  VehiclePlate?: string;
  IsAvailable?: boolean;
}

interface Product {
  product_id: string;
  id?: string;
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
  status: "Disponibile" | "Esaurito" | "Bassa giacenza";
  category: string;
  warehouse_name?: string;
  image?: string;
}

interface ProductTableProps {
  products: Product[];
  categories: string[];
  onDeleteProduct?: (id: string) => Promise<void>;
  onUpdateQuantity?: (productId: string, newQuantity: number) => void;
  onRefreshData?: () => void;
  sortBy?: {
    field: keyof Product;
    direction: "asc" | "desc";
  };
  onSort?: (sort: { field: keyof Product; direction: "asc" | "desc" }) => void;
  isLoading?: boolean;
}

// Constants
const statusColorMap: Record<string, ChipProps["color"]> = {
  Disponibile: "success",
  "Bassa giacenza": "warning",
  Esaurito: "danger",
};

const columns = [
  { name: "PRODOTTO", uid: "name", sortable: true },
  { name: "CATEGORIA", uid: "category", sortable: true },
  { name: "SKU", uid: "sku", sortable: true },
  { name: "QUANTITÀ", uid: "quantity", sortable: true },
  { name: "PREZZO", uid: "price", sortable: true },
  { name: "MAGAZZINO", uid: "warehouse", sortable: true },
  { name: "STATO", uid: "status", sortable: true },
  { name: "AZIONI INVENTARIO", uid: "inventory_actions" },
  { name: "AZIONI", uid: "actions" },
];

// Empty State Component
const EmptyState = React.memo(({ isLoading }: { isLoading?: boolean }) => {
  const navigate = useNavigate();
  const { isDark } = useProductTheme();

  const handleAddProduct = useCallback(() => {
    navigate("/inventory/products/add");
  }, [navigate]);

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
        onPress={handleAddProduct}
      >
        Aggiungi Prodotto
      </Button>
    </div>
  );
});

EmptyState.displayName = "EmptyState";

export default function ProductTable({
  products,
  onDeleteProduct,
  onUpdateQuantity,
  onRefreshData,
  sortBy,
  onSort,
  isLoading = false,
}: ProductTableProps) {
  const navigate = useNavigate();
  const { isDark } = useProductTheme();

  // Table state
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [page, setPage] = useState(1);

  // Modal states
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const {
    isOpen: isDeleteModalOpen,
    onOpen: openDeleteModal,
    onClose: closeDeleteModal,
  } = useDisclosure();
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Stock operation states
  const [stockModalState, setStockModalState] = useState({
    isOpen: false,
    type: "increase" as "increase" | "decrease",
    selectedProduct: null as Product | null,
    amount: "",
    reason: "",
    isProcessing: false,
  });

  // Data states
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Alert states
  const [alerts, setAlerts] = useState({
    success: { isVisible: false, title: "", description: "" },
    error: { isVisible: false, title: "", description: "" },
    load: {
      isVisible: false,
      type: "success" as "success" | "danger",
      title: "",
      description: "",
    },
  });

  // Memoized values
  const filteredItems = useMemo(() => [...products], [products]);

  const pages = useMemo(
    () => Math.ceil(filteredItems.length / rowsPerPage),
    [filteredItems.length, rowsPerPage]
  );

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

  // Memoized callbacks
  const goToEditProduct = useCallback(
    (productId: string) => {
      navigate(`/inventory/products/edit/${productId}`);
    },
    [navigate]
  );

  const confirmDeleteProduct = useCallback(
    (product: Product) => {
      setProductToDelete(product);
      openDeleteModal();
    },
    [openDeleteModal]
  );

  const handleDeleteProduct = useCallback(
    async (id: string) => {
      if (onDeleteProduct) {
        await onDeleteProduct(id);
      }
    },
    [onDeleteProduct]
  );

  const showAlert = useCallback(
    (type: "success" | "error" | "load", alertData: any) => {
      setAlerts((prev) => ({
        ...prev,
        [type]: { ...alertData, isVisible: true },
      }));
    },
    []
  );

  const hideAlert = useCallback((type: "success" | "error" | "load") => {
    setAlerts((prev) => ({
      ...prev,
      [type]: { ...prev[type], isVisible: false },
    }));
  }, []);

  // Load data functions
  const loadWarehouses = useCallback(async () => {
    try {
      const response = await axios.get("/Warehouse/GET/GetAllWarehouses");
      const activeWarehouses = response.data.filter(
        (warehouse: Warehouse) => warehouse.IsActive
      );
      setWarehouses(activeWarehouses);
    } catch (error) {
      console.error("Error loading warehouses:", error);
    }
  }, []);

  const loadVehicles = useCallback(async () => {
    try {
      const response = await axios.get("/Vehicle/GET/GetAllVehicles");
      setVehicles(response.data || []);
    } catch (error) {
      console.error("Errore nel caricamento dei veicoli:", error);
    }
  }, []);

  // Effects
  useEffect(() => {
    loadWarehouses();
    loadVehicles();
  }, [loadWarehouses, loadVehicles]);

  // Auto-hide alerts
  useEffect(() => {
    if (alerts.success.isVisible) {
      const timer = setTimeout(() => hideAlert("success"), 4000);
      return () => clearTimeout(timer);
    }
  }, [alerts.success.isVisible, hideAlert]);

  useEffect(() => {
    if (alerts.error.isVisible) {
      const timer = setTimeout(() => hideAlert("error"), 4000);
      return () => clearTimeout(timer);
    }
  }, [alerts.error.isVisible, hideAlert]);

  useEffect(() => {
    if (alerts.load.isVisible) {
      const timer = setTimeout(() => hideAlert("load"), 4000);
      return () => clearTimeout(timer);
    }
  }, [alerts.load.isVisible, hideAlert]);

  const renderCell = useCallback(
    (product: Product, columnKey: React.Key) => {
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
            <div className="flex justify-start items-center">
              <span
                className={`font-medium ${
                  (product.quantity || 0) > 0
                    ? (product.quantity || 0) <=
                      (product.min_stock_treshold || 10)
                      ? "text-warning"
                      : "text-success"
                    : "text-danger"
                }`}
              >
                {product.quantity || 0}
              </span>
            </div>
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
                className={`w-2 h-2 rounded-full bg-${(
                  product.warehouse_name || product.warehouse_id
                )
                  .toLowerCase()
                  .replace(/\s+/g, "")}`}
              />
              {product.warehouse_name || product.warehouse_id}
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
                  onPress={() =>
                    setStockModalState({
                      isOpen: true,
                      type: "increase",
                      selectedProduct: product,
                      amount: "",
                      reason: "",
                      isProcessing: false,
                    })
                  }
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
                  onPress={() =>
                    setStockModalState({
                      isOpen: true,
                      type: "decrease",
                      selectedProduct: product,
                      amount: "",
                      reason: "",
                      isProcessing: false,
                    })
                  }
                  className="min-w-8 h-8"
                  isDisabled={product.quantity <= 0}
                >
                  <Icon icon="solar:minus-circle-bold" width={16} />
                </Button>
              </Tooltip>

              <MoveProductWarehouseModal
                selectedProduct={product}
                onUpdateQuantity={onUpdateQuantity}
                onSuccess={(message) => {
                  showAlert("success", {
                    title: "Trasferimento completato!",
                    description: message,
                  });
                }}
                onError={(message) => {
                  showAlert("error", {
                    title: "Errore nel trasferimento",
                    description: message,
                  });
                }}
              />

              <LoadProductModal
                selectedProduct={product}
                onSuccess={(message) => {
                  showAlert("load", {
                    type: "success",
                    title: "Caricamento completato!",
                    description: message,
                  });
                }}
                onError={(message) => {
                  showAlert("load", {
                    type: "danger",
                    title: "Errore nel caricamento",
                    description: message,
                  });
                }}
                onRefreshData={onRefreshData}
              />
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
    },
    [showAlert, onRefreshData, goToEditProduct, confirmDeleteProduct, onOpen]
  );

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
  useEffect(() => {
    window.addEventListener("keydown", handleKeyboardShortcuts);
    return () => window.removeEventListener("keydown", handleKeyboardShortcuts);
  }, [handleKeyboardShortcuts]);

  // Stock operation functions
  const resetStockModal = useCallback(() => {
    setStockModalState({
      isOpen: false,
      type: "increase",
      selectedProduct: null,
      amount: "",
      reason: "",
      isProcessing: false,
    });
  }, []);

  const handleStockOperation = async () => {
    if (
      !stockModalState.selectedProduct ||
      !stockModalState.amount ||
      !stockModalState.reason
    )
      return;

    setStockModalState({ ...stockModalState, isProcessing: true });
    try {
      const amount = parseInt(stockModalState.amount);
      const newQuantity =
        stockModalState.type === "increase"
          ? stockModalState.selectedProduct.quantity + amount
          : stockModalState.selectedProduct.quantity - amount;

      if (newQuantity < 0) {
        alert("La quantità non può essere negativa");
        return;
      }

      console.log(
        `Aggiornamento stock da ${stockModalState.selectedProduct.quantity} a ${newQuantity} per prodotto:`,
        stockModalState.selectedProduct.product_id
      );

      // Usa lo stesso endpoint dell'InlineQuantityEditor che funziona
      try {
        const response = await axios.put(
          `/Product/UPDATE/UpdateProductQuantity/`,
          {
            product_id: stockModalState.selectedProduct.product_id,
            stock_unit: newQuantity.toString(),
          }
        );

        if (response.status === 200) {
          // Aggiorna la UI tramite la prop callback
          if (onUpdateQuantity) {
            onUpdateQuantity(
              stockModalState.selectedProduct.product_id,
              newQuantity
            );
          }

          // Mostra messaggio di successo
          showAlert("success", {
            title: `Quantità ${
              stockModalState.type === "increase" ? "aumentata" : "diminuita"
            } con successo!`,
            description: `Quantità aggiornata con successo nel database`,
          });

          // Il movimento viene creato automaticamente dal backend
          try {
            const response = await axios.post(
              `/Movement/POST/CreateMovement/`,
              {
                stockModalState,
              }
            );
            if (response.status === 200) {
              showAlert("success", {
                title: "Movimento creato con successo!",
                description:
                  "Il movimento è stato creato con successo nel database",
              });
            }
          } catch (apiError: any) {
            showAlert("error", {
              title: "Errore nella creazione del movimento",
              description: apiError.response.data.message,
            });
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
            `/Product/PUT/UpdateProduct/${stockModalState.selectedProduct.product_id}`,
            updateData
          );

          // Aggiorna la UI tramite la prop callback
          if (onUpdateQuantity) {
            onUpdateQuantity(
              stockModalState.selectedProduct.product_id,
              newQuantity
            );
          }

          // Mostra messaggio di successo
          showAlert("success", {
            title: `Quantità ${
              stockModalState.type === "increase" ? "aumentata" : "diminuita"
            } con successo!`,
            description: `Quantità aggiornata con successo nel database`,
          });

          // Il movimento viene creato automaticamente dal backend
        } else {
          throw apiError;
        }
      }

      console.log("Quantità aggiornata con successo nel database");

      // Chiudi il modal e resetta lo stato dopo l'operazione completata
      resetStockModal();
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
      // Assicurati che isProcessing sia sempre resettato
      setStockModalState((prev) => ({ ...prev, isProcessing: false }));
    }
  };

  return (
    <>
      {/* Alert per LoadProductModal */}
      {alerts.load.isVisible && (
        <div
          className="fixed top-4 right-4 z-[9999] w-96"
          style={{ zIndex: 9999 }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Alert
            color={alerts.load.type}
            description={alerts.load.description}
            isVisible={alerts.load.isVisible}
            title={alerts.load.title}
            variant="solid"
            onClose={() =>
              setAlerts((prev) => ({
                ...prev,
                load: { ...prev.load, isVisible: false },
              }))
            }
          />
        </div>
      )}

      {/* Notifica di successo */}
      {alerts.success.isVisible && (
        <div
          className="fixed top-20 right-4 z-[9999] w-96"
          style={{ zIndex: 9999 }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Alert
            color="success"
            variant="solid"
            description={alerts.success.description}
            isVisible={alerts.success.isVisible}
            title={alerts.success.title}
            onClose={() =>
              setAlerts((prev) => ({
                ...prev,
                success: { ...prev.success, isVisible: false },
              }))
            }
          />
        </div>
      )}

      {/* Notifica di errore */}
      {alerts.error.isVisible && (
        <div
          className="fixed top-36 right-4 z-[9999] w-96"
          style={{ zIndex: 9999 }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Alert
            color="danger"
            description={alerts.error.description}
            isVisible={alerts.error.isVisible}
            title={alerts.error.title}
            variant="faded"
            onClose={() =>
              setAlerts((prev) => ({
                ...prev,
                error: { ...prev.error, isVisible: false },
              }))
            }
          />
        </div>
      )}

      <Table
        aria-label="Tabella prodotti"
        bottomContent={bottomContent}
        bottomContentPlacement="inside"
        sortDescriptor={{
          column: sortBy?.field || "name",
          direction: sortBy?.direction === "asc" ? "ascending" : "descending",
        }}
        onSortChange={(descriptor) => {
          if (onSort) {
            onSort({
              field: descriptor.column as keyof Product,
              direction: descriptor.direction === "ascending" ? "asc" : "desc",
            });
          }
        }}
        isStriped
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
                        className={`w-2 h-2 rounded-full bg-${(
                          selectedProduct.warehouse_name ||
                          selectedProduct.warehouse_id
                        )
                          .toLowerCase()
                          .replace(/\s+/g, "")}`}
                      />
                      <p className="font-medium">
                        {selectedProduct.warehouse_name ||
                          selectedProduct.warehouse_id}
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
        isOpen={stockModalState.isOpen}
        onClose={resetStockModal}
        size="2xl"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-semibold">
              {stockModalState.type === "increase"
                ? "Aumenta Quantità"
                : "Diminuisci Quantità"}
            </h3>
            <p className="text-sm text-default-500">
              {stockModalState.selectedProduct?.name}
            </p>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-default-100 rounded-lg">
                <div>
                  <p className="text-sm text-default-600">Quantità Attuale</p>
                  <p className="text-2xl font-bold">
                    {stockModalState.selectedProduct?.quantity || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-default-600">Magazzino</p>
                  <p className="font-medium">
                    {stockModalState.selectedProduct?.warehouse_name ||
                      stockModalState.selectedProduct?.warehouse_id}
                  </p>
                </div>
              </div>

              <Input
                type="number"
                label={`Quantità da ${
                  stockModalState.type === "increase"
                    ? "aggiungere"
                    : "rimuovere"
                }`}
                placeholder="Inserisci la quantità"
                value={stockModalState.amount}
                onChange={(e) =>
                  setStockModalState({
                    ...stockModalState,
                    amount: e.target.value,
                  })
                }
                min="1"
                max={
                  stockModalState.type === "decrease"
                    ? stockModalState.selectedProduct?.quantity
                    : undefined
                }
                startContent={
                  <Icon
                    icon={
                      stockModalState.type === "increase"
                        ? "solar:add-circle-bold"
                        : "solar:minus-circle-bold"
                    }
                    className={
                      stockModalState.type === "increase"
                        ? "text-success"
                        : "text-warning"
                    }
                  />
                }
              />

              <Textarea
                label="Motivo dell'operazione"
                placeholder="Inserisci il motivo di questa operazione di inventario"
                value={stockModalState.reason}
                onChange={(e) =>
                  setStockModalState({
                    ...stockModalState,
                    reason: e.target.value,
                  })
                }
                minRows={2}
              />

              {stockModalState.amount && stockModalState.selectedProduct && (
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-default-600 mb-1">
                    Nuova quantità:
                  </p>
                  <p className="text-xl font-bold text-primary">
                    {stockModalState.type === "increase"
                      ? stockModalState.selectedProduct.quantity +
                        parseInt(stockModalState.amount || "0")
                      : stockModalState.selectedProduct.quantity -
                        parseInt(stockModalState.amount || "0")}
                  </p>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={resetStockModal}>
              Annulla
            </Button>
            <Button
              color={
                stockModalState.type === "increase" ? "success" : "warning"
              }
              onPress={handleStockOperation}
              isLoading={stockModalState.isProcessing}
              isDisabled={!stockModalState.amount || !stockModalState.reason}
            >
              {stockModalState.type === "increase"
                ? "Aumenta Quantità"
                : "Diminuisci Quantità"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
