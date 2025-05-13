import { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Chip,
  Pagination,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  getKeyValue,
  Avatar,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useProductTheme } from "./ProductThemeWrapper";
import { useNavigate } from "react-router-dom";
import DeleteProductModal from "./DeleteProductModal";

// Data types
interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  status: "Disponibile" | "Esaurito" | "Bassa giacenza";
  image?: string;
}

interface ProductTableProps {
  products: Product[];
  categories: string[];
  onDeleteProduct?: (id: string) => Promise<void>;
}

export default function ProductTable({
  products,
  categories,
  onDeleteProduct,
}: ProductTableProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tutti");
  const [currentPage, setCurrentPage] = useState(1);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Stato per il modale di conferma eliminazione
  const {
    isOpen: isDeleteModalOpen,
    onOpen: openDeleteModal,
    onClose: closeDeleteModal,
  } = useDisclosure();
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Utilizziamo il ProductThemeWrapper
  const { isDark, getCardClasses } = useProductTheme();

  // Otteniamo le classi dal theme wrapper
  const classes = getCardClasses();

  const perPage = 5;

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchCategory =
      selectedCategory === "Tutti" || product.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  // Paginate products
  const startIndex = (currentPage - 1) * perPage;
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + perPage
  );

  // Open product modal
  const openProductModal = (product: Product) => {
    setSelectedProduct(product);
    onOpen();
  };

  // Status color mapping
  const statusColorMap = {
    Disponibile: "success",
    "Bassa giacenza": "warning",
    Esaurito: "danger",
  };

  // Column definitions
  const columns = [
    { key: "name", label: "PRODOTTO", align: "start" },
    { key: "category", label: "CATEGORIA", align: "start" },
    { key: "quantity", label: "QUANTITÀ", align: "center" },
    { key: "price", label: "PREZZO", align: "end" },
    { key: "status", label: "STATO", align: "center" },
    { key: "actions", label: "AZIONI", align: "end" },
  ];

  // Funzione per ottenere un colore casuale ma consistente per una categoria
  const getRandomColor = (
    category: string
  ): "primary" | "secondary" | "success" | "warning" | "danger" => {
    const colors: Array<
      "primary" | "secondary" | "success" | "warning" | "danger"
    > = ["primary", "secondary", "success", "warning", "danger"];
    const sum = category
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[sum % colors.length];
  };

  // Funzioni per la navigazione
  const goToAddProduct = () => {
    navigate("/inventory/products/add");
  };

  const goToEditProduct = (productId: string) => {
    navigate(`/inventory/products/edit/${productId}`);
  };

  // Funzione per confermare l'eliminazione
  const confirmDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    openDeleteModal();
  };

  // Funzione per eliminare il prodotto
  const handleDeleteProduct = async (id: string) => {
    if (onDeleteProduct) {
      await onDeleteProduct(id);
      // Ricarica i dati o aggiorna lo stato locale
    }
  };

  // Render custom cells
  const renderCell = (product: Product, columnKey: string) => {
    switch (columnKey) {
      case "name":
        return (
          <div className="flex items-center gap-3 mb-0.5">
            <Avatar
              src={product.image || "https://via.placeholder.com/40"}
              size="sm"
              radius="lg"
              className="hidden md:flex object-cover border-0"
            />
            <div>
              <p className="font-medium">{product.name}</p>
              <p
                className={`text-xs ${
                  isDark ? "text-zinc-400" : "text-default-500"
                }`}
              >
                ID: {product.id.substring(0, 8)}
              </p>
            </div>
          </div>
        );
      case "category":
        return (
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full bg-${getRandomColor(
                  product.category
                )}`}
              ></span>
              {product.category}
            </div>
          </div>
        );
      case "quantity":
        return (
          <div className="flex justify-center items-center">
            <div
              className={`${
                product.quantity > 0
                  ? product.quantity <= 10
                    ? "text-warning"
                    : "text-success"
                  : "text-danger"
              } font-medium`}
            >
              {product.quantity}
            </div>
          </div>
        );
      case "price":
        return (
          <div className="text-right font-medium">
            €{product.price.toFixed(2)}
          </div>
        );
      case "status":
        return (
          <div className="flex justify-center">
            <Chip
              color={statusColorMap[product.status] as any}
              variant="flat"
              startContent={
                <Icon
                  icon={
                    product.status === "Disponibile"
                      ? "solar:check-circle-bold"
                      : product.status === "Bassa giacenza"
                      ? "solar:clock-circle-bold"
                      : "solar:close-circle-bold"
                  }
                  className="mr-1"
                />
              }
            >
              {product.status}
            </Chip>
          </div>
        );
      case "actions":
        return (
          <div className="flex justify-end gap-2">
            <Tooltip content="Visualizza dettagli">
              <Button
                isIconOnly
                size="sm"
                variant={isDark ? "flat" : "light"}
                className={`${
                  isDark
                    ? "bg-zinc-800 text-white hover:bg-zinc-700"
                    : "hover:bg-zinc-100"
                } rounded-full`}
                onPress={() => openProductModal(product)}
              >
                <Icon icon="solar:eye-bold" width={20} />
              </Button>
            </Tooltip>
            <Tooltip content="Modifica">
              <Button
                isIconOnly
                size="sm"
                variant={isDark ? "flat" : "light"}
                className={`${
                  isDark
                    ? "bg-zinc-800 text-white hover:bg-zinc-700"
                    : "hover:bg-zinc-100"
                } rounded-full`}
                onPress={() => goToEditProduct(product.id)}
              >
                <Icon icon="solar:pen-bold" width={18} />
              </Button>
            </Tooltip>
            <Tooltip content="Elimina">
              <Button
                isIconOnly
                size="sm"
                color="danger"
                variant="light"
                className="rounded-full"
                onPress={() => confirmDeleteProduct(product)}
              >
                <Icon icon="solar:trash-bin-trash-bold" width={18} />
              </Button>
            </Tooltip>
          </div>
        );
      default:
        return (
          <div className="text-left">{getKeyValue(product, columnKey)}</div>
        );
    }
  };

  return (
    <>
      <Card className={classes.card}>
        <CardHeader className={classes.header}>
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-3">
              <Input
                placeholder="Cerca prodotto..."
                startContent={
                  <Icon
                    icon="solar:magnifer-linear-duotone"
                    className={isDark ? "text-zinc-400" : ""}
                  />
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-60"
                size="sm"
                classNames={{
                  inputWrapper: classes.input,
                  input: isDark ? "text-white" : "",
                }}
              />
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    variant={isDark ? "flat" : "light"}
                    className={classes.dropdown.trigger}
                    size="sm"
                    endContent={
                      <Icon
                        icon="solar:alt-arrow-down-linear"
                        className="text-default-500"
                      />
                    }
                  >
                    {selectedCategory}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Product categories"
                  onAction={(key) =>
                    setSelectedCategory(categories[Number(key)])
                  }
                  classNames={{
                    base: classes.dropdown.menu,
                  }}
                >
                  {categories.map((cat, index) => (
                    <DropdownItem
                      key={index.toString()}
                      className={classes.dropdown.item}
                      startContent={
                        <span
                          className={`w-2 h-2 rounded-full bg-${getRandomColor(
                            cat
                          )} mr-2`}
                        ></span>
                      }
                    >
                      {cat}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            </div>
            <Button
              color="primary"
              startContent={
                <Icon icon="material-symbols:add" width={22} height={22} />
              }
              onPress={goToAddProduct}
            >
              Nuovo Prodotto
            </Button>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <Table
            aria-label="Products table"
            hideHeader={false}
            shadow="none"
            className="rounded-md overflow-hidden"
            classNames={{
              base: classes.table.wrapper,
              table: "min-w-full",
              thead: isDark
                ? "border-0 border-none border-transparent bg-zinc-800"
                : classes.table.header,
              tbody: "border-none",
              tr: classes.table.row,
              th: `${
                isDark ? "text-zinc-300" : "text-zinc-700"
              } font-medium text-xs uppercase tracking-wider p-4 border-none border-0 border-transparent`,
              td: "p-4 border-none border-0 border-transparent",
              tfoot: "border-none",
              wrapper: "border-none",
            }}
          >
            <TableHeader>
              {columns.map((column) => (
                <TableColumn
                  key={column.key}
                  align={column.align as any}
                  className={`${
                    column.align === "end"
                      ? "text-right"
                      : column.align === "center"
                      ? "text-center"
                      : "text-left"
                  }`}
                >
                  {column.label}
                </TableColumn>
              ))}
            </TableHeader>
            <TableBody
              emptyContent={
                <div className="py-10 text-center">
                  <Icon
                    icon="solar:box-minimalistic-broken"
                    className={`w-16 h-16 mx-auto mb-4 ${
                      isDark ? "text-zinc-600" : "text-zinc-300"
                    }`}
                  />
                  <p className={isDark ? "text-zinc-500" : "text-zinc-400"}>
                    Nessun prodotto trovato
                  </p>
                </div>
              }
            >
              {paginatedProducts.map((product) => (
                <TableRow key={product.id}>
                  {(columnKey) => (
                    <TableCell>
                      {renderCell(product, columnKey.toString())}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className={classes.table.pagination}>
            <Pagination
              total={Math.ceil(filteredProducts.length / perPage)}
              initialPage={1}
              page={currentPage}
              onChange={setCurrentPage}
              showControls
              size="lg"
              radius="lg"
              variant="bordered"
              classNames={{
                wrapper: "gap-2",
                item: isDark
                  ? "w-10 h-10 text-medium text-white border-zinc-700"
                  : "w-10 h-10 text-medium",
                cursor: "bg-primary text-white font-medium",
                prev: isDark
                  ? "bg-zinc-800 border border-zinc-700 text-white"
                  : "bg-zinc-100 border border-zinc-300",
                next: isDark
                  ? "bg-zinc-800 border border-zinc-700 text-white"
                  : "bg-zinc-100 border border-zinc-300",
              }}
            />
          </div>
        </CardBody>
      </Card>

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
                    <p className="font-medium">{selectedProduct.id}</p>
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
                      Categoria
                    </p>
                    <div className="flex items-center">
                      <span
                        className={`w-2 h-2 rounded-full bg-${getRandomColor(
                          selectedProduct.category
                        )} mr-2`}
                      ></span>
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
                        selectedProduct.quantity > 0
                          ? selectedProduct.quantity <= 10
                            ? "text-warning"
                            : "text-success"
                          : "text-danger"
                      }`}
                    >
                      {selectedProduct.quantity}
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
                      €{selectedProduct.price.toFixed(2)}
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
                      color={statusColorMap[selectedProduct.status] as any}
                      variant="flat"
                      startContent={
                        <Icon
                          icon={
                            selectedProduct.status === "Disponibile"
                              ? "solar:check-circle-bold"
                              : selectedProduct.status === "Bassa giacenza"
                              ? "solar:clock-circle-bold"
                              : "solar:close-circle-bold"
                          }
                          className="mr-1"
                        />
                      }
                    >
                      {selectedProduct.status}
                    </Chip>
                  </div>
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
                  startContent={<Icon icon="solar:pen-bold" />}
                  onPress={() => {
                    onClose();
                    goToEditProduct(selectedProduct.id);
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
