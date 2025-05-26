import React, { useCallback, useMemo } from "react";
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
} from "@heroui/react";
import type { Selection, ChipProps } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { useProductTheme } from "./ProductThemeWrapper";
import DeleteProductModal from "./DeleteProductModal";
import { Icon } from "@iconify/react/dist/iconify.js";

// Data types
interface Product {
  product_id: string;
  id?: string; // Per compatibilità
  name: string;
  category: string;
  category_id: string;
  quantity: number;
  price: number;
  min_stock_treshold: number;
  status: "Disponibile" | "Esaurito" | "Bassa giacenza";
  image?: string;
  sku?: string;
  description?: string;
  barcode?: string;
  qr_code?: string;
  supplier_id?: string;
  brand_id?: string;
  attributes?: any[];
}

interface ProductTableProps {
  products: Product[];
  categories: string[];
  onDeleteProduct?: (id: string) => Promise<void>;
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
  { name: "QUANTITÀ", uid: "quantity", sortable: true },
  { name: "PREZZO", uid: "price", sortable: true },
  { name: "STATO", uid: "status", sortable: true },
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
              className={`w-2 h-2 rounded-full bg-${product.category.toLowerCase().replace(/\s+/g, '')}`}
            />
            {product.category}
          </div>
        );
      case "quantity":
        return (
          <div className="flex justify-start w-full">
            <div
              className={`font-medium ${
                (product.quantity || 0) > 0
                  ? (product.quantity || 0) <= (product.min_stock_treshold || 10)
                    ? "text-warning"
                    : "text-success"
                  : "text-danger"
              }`}
            >
              {product.quantity || 0}
              {(product.quantity || 0) === 0 && (
                <span className="text-xs ml-1 text-danger"></span>
              )}
            </div>
          </div>
        );
      case "price":
        return (
          <div className="flex justify-start w-full">
            <div className="font-medium">€{parseFloat(product.price.toString()).toFixed(2)}</div>
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
        return product[columnKey as keyof Product];
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
                  color="danger"
                  onPress={() => {
                    if (onDeleteProduct) {
                      if (selectedKeys === "all") {
                        // Delete all products
                        products.forEach((product) => {
                          onDeleteProduct(product.product_id || product.id || "");
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
                <Button
                  color="warning"
                  variant="flat"
                  onPress={() => {
                    const selectedProducts =
                      selectedKeys === "all"
                        ? products
                        : products.filter(
                            (p) =>
                              typeof selectedKeys !== "string" &&
                              selectedKeys.has(p.product_id || p.id || "")
                          );

                    const allAvailable = selectedProducts.every(
                      (p) => p.status === "Disponibile"
                    );
                    const allLow = selectedProducts.every(
                      (p) => p.status === "Bassa giacenza"
                    );

                    let newStatus:
                      | "Disponibile"
                      | "Bassa giacenza"
                      | "Esaurito";
                    if (allAvailable) newStatus = "Bassa giacenza";
                    else if (allLow) newStatus = "Esaurito";
                    else newStatus = "Disponibile";

                    // Here you would call an API to update the status
                    console.log(
                      `Update status to ${newStatus} for:`,
                      selectedKeys === "all" ? "all products" : selectedKeys
                    );
                    setSelectedKeys(new Set([]));
                  }}
                >
                  Cambia Stato
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
            goToEditProduct(selectedProduct.product_id || selectedProduct.id || "");
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

  return (
    <>
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
        <TableBody emptyContent={<EmptyState isLoading={isLoading} />} items={sortedItems}>
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
                    <p className="font-medium">{selectedProduct.product_id || selectedProduct.id}</p>
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
                    <p className="font-medium">{selectedProduct.sku || "N/A"}</p>
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
                        className={`w-2 h-2 rounded-full bg-${selectedProduct.category.toLowerCase().replace(/\s+/g, '')} mr-2`}
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
                          ? (selectedProduct.quantity || 0) <= (selectedProduct.min_stock_treshold || 10)
                            ? "text-warning"
                            : "text-success"
                          : "text-danger"
                      }`}
                    >
                      {selectedProduct.quantity || 0}
                      {(selectedProduct.quantity || 0) === 0 && (
                        <span className="text-xs ml-1">(Non disponibile)</span>
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
                      <p className="font-medium">{selectedProduct.description}</p>
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
                    goToEditProduct(selectedProduct.product_id || selectedProduct.id || "");
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
    </>
  );
}
