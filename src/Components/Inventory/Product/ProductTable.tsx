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
} from "@heroui/react";
import { Icon } from "@iconify/react";

// Data types
interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  status: "Disponibile" | "Esaurito" | "Bassa giacenza";
}

interface ProductTableProps {
  products: Product[];
  categories: string[];
}

export default function ProductTable({
  products,
  categories,
}: ProductTableProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tutti");
  const [currentPage, setCurrentPage] = useState(1);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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
    { key: "name", label: "NOME", align: "start" },
    { key: "category", label: "CATEGORIA", align: "start" },
    { key: "quantity", label: "QUANTITÀ", align: "center" },
    { key: "price", label: "PREZZO", align: "end" },
    { key: "status", label: "STATO", align: "center" },
    { key: "actions", label: "AZIONI", align: "end" },
  ];

  // Render custom cells
  const renderCell = (product: Product, columnKey: string) => {
    switch (columnKey) {
      case "name":
        return <div className="font-medium text-left">{product.name}</div>;
      case "category":
        return <div className="text-left">{product.category}</div>;
      case "quantity":
        return <div className="text-center">{product.quantity}</div>;
      case "price":
        return <div className="text-right">€{product.price.toFixed(2)}</div>;
      case "status":
        return (
          <div className="flex justify-center">
            <Chip color={statusColorMap[product.status] as any} variant="flat">
              {product.status}
            </Chip>
          </div>
        );
      case "actions":
        return (
          <div className="flex justify-end gap-2">
            <Tooltip content="View details">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => openProductModal(product)}
              >
                <Icon icon="solar:eye-linear" width={20} />
              </Button>
            </Tooltip>
            <Tooltip content="Edit">
              <Button isIconOnly size="sm" variant="light">
                <Icon icon="solar:pen-linear" width={20} />
              </Button>
            </Tooltip>
            <Tooltip content="Delete">
              <Button isIconOnly size="sm" variant="light" color="danger">
                <Icon icon="solar:trash-bin-trash-linear" width={20} />
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
      <Card className="w-full mt-6 shadow-sm rounded-xl overflow-hidden border-2 border-default-200">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-3">
              <Input
                placeholder="Cerca prodotto..."
                startContent={<Icon icon="solar:magnifer-line-duotone" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-60"
              />
              <Dropdown>
                <DropdownTrigger>
                  <Button variant="light">
                    {selectedCategory}
                    <Icon icon="solar:arrow-down-linear" className="ml-2" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Product categories"
                  onAction={(key) =>
                    setSelectedCategory(categories[Number(key)])
                  }
                >
                  {categories.map((cat, index) => (
                    <DropdownItem key={index.toString()}>{cat}</DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            </div>
            <Button color="primary">
              <Icon
                icon="material-symbols:add"
                className="mr-1"
                width={24}
                height={24}
              />
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
              base: "shadow-none",
              table: "min-w-full",
              thead: "border-none",
              tbody: "border-none",
              tr: "[&:not(:last-child)]:border-b [&:not(:last-child)]:border-default-100 hover:bg-default-50",
              th: "text-default-700 font-medium text-xs uppercase tracking-wider py-3 px-3 border-none",
              td: "py-3 px-3 border-none",
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
            <TableBody emptyContent="No products found">
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
          <div className="flex w-full justify-center py-4 bg-default-100">
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
                item: "w-10 h-10 text-medium",
                cursor: "bg-primary text-white font-medium",
                prev: "bg-default-100 border border-default-300",
                next: "bg-default-100 border border-default-300",
              }}
            />
          </div>
        </CardBody>
      </Card>

      {/* Product details modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          {selectedProduct && (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Product Details
              </ModalHeader>
              <ModalBody>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-small text-default-500">Product ID</p>
                    <p>{selectedProduct.id}</p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">Name</p>
                    <p>{selectedProduct.name}</p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">Category</p>
                    <p>{selectedProduct.category}</p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">Quantity</p>
                    <p>{selectedProduct.quantity}</p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">Price</p>
                    <p>€{selectedProduct.price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">Status</p>
                    <Chip
                      color={statusColorMap[selectedProduct.status] as any}
                      variant="flat"
                    >
                      {selectedProduct.status}
                    </Chip>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onPress={onClose}>
                  Edit
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
