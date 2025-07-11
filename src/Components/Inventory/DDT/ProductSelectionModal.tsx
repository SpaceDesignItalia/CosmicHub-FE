import {
  Badge,
  Button,
  Card,
  CardBody,
  Checkbox,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMemo, useState } from "react";

interface Product {
  product_id: number;
  name: string;
  sku: string;
  weight: number;
  dimensions?: string;
  category: string;
  category_id?: string;
  price: number;
  stock_unit: number;
  warehouse_name?: string;
  is_caldaia?: boolean;
  brand?: string;
  power_kw?: number;
  fuel_type?: string;
}

interface SelectedProduct extends Product {
  selected_quantity: number;
  serial_numbers?: string[];
  notes?: string;
}

interface Category {
  category_id: string;
  category_name: string;
}

interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  onConfirm: (selectedProducts: SelectedProduct[]) => void;
  vehicleCapacity?: number;
}

const categoryColors = {
  Caldaie: "success",
  "Pompe di Calore": "primary",
  Radiatori: "warning",
  "Componenti Idraulici": "secondary",
  "Componenti Elettrici": "danger",
  Ricambi: "default",
} as const;

export default function ProductSelectionModal({
  isOpen,
  onClose,
  products,
  categories,
  onConfirm,
  vehicleCapacity,
}: ProductSelectionModalProps) {
  const [selectedProducts, setSelectedProducts] = useState<
    Map<string, SelectedProduct>
  >(new Map());
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);

  // Create category map
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((cat) => {
      map.set(cat.category_id, cat.category_name);
    });
    return map;
  }, [categories]);

  // Get unique category names
  const categoryNames = useMemo(() => {
    const cats = [
      ...new Set(
        products.map((p) => {
          // Se il prodotto ha category_id, usa quello, altrimenti usa category
          const categoryId = p.category_id || p.category;
          return categoryMap.get(categoryId) || categoryId;
        })
      ),
    ];
    return cats.sort();
  }, [products, categoryMap]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.brand &&
          product.brand.toLowerCase().includes(searchQuery.toLowerCase()));

      const categoryId = product.category_id || product.category;
      const productCategoryName = categoryMap.get(categoryId) || categoryId;
      const matchesCategory =
        categoryFilter === "all" || productCategoryName === categoryFilter;
      const hasStock = !showOnlyAvailable || product.stock_unit > 0;

      return matchesSearch && matchesCategory && hasStock;
    });
  }, [products, searchQuery, categoryFilter, showOnlyAvailable]);

  // Calculate totals
  const totals = useMemo(() => {
    const selectedArray = Array.from(selectedProducts.values());
    return {
      totalWeight: selectedArray.reduce(
        (sum, product) => sum + product.weight * product.selected_quantity,
        0
      ),
      totalValue: selectedArray.reduce(
        (sum, product) => sum + product.price * product.selected_quantity,
        0
      ),
      totalItems: selectedArray.reduce(
        (sum, product) => sum + product.selected_quantity,
        0
      ),
    };
  }, [selectedProducts]);

  const handleQuantityChange = (productId: string, quantity: number) => {
    const newSelectedProducts = new Map(selectedProducts);
    const product = newSelectedProducts.get(productId);

    if (product && quantity > 0 && quantity <= product.stock_unit) {
      newSelectedProducts.set(productId, {
        ...product,
        selected_quantity: quantity,
      });
      setSelectedProducts(newSelectedProducts);
    }
  };

  const handleConfirm = () => {
    const selectedArray = Array.from(selectedProducts.values());
    onConfirm(selectedArray);
    handleClose();
  };

  const handleClose = () => {
    setSelectedProducts(new Map());
    setSearchQuery("");
    setCategoryFilter("all");
    onClose();
  };

  const getCapacityWarning = () => {
    if (!vehicleCapacity) return null;

    const usagePercentage = (totals.totalWeight / vehicleCapacity) * 100;

    if (usagePercentage > 100) {
      return {
        type: "danger" as const,
        message: `Capacità superata! ${usagePercentage.toFixed(1)}% (${
          totals.totalWeight
        }kg / ${vehicleCapacity}kg)`,
      };
    } else if (usagePercentage > 80) {
      return {
        type: "warning" as const,
        message: `Capacità quasi piena: ${usagePercentage.toFixed(1)}% (${
          totals.totalWeight
        }kg / ${vehicleCapacity}kg)`,
      };
    }

    return null;
  };

  const capacityWarning = getCapacityWarning();

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="5xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center gap-3">
            <Icon
              icon="solar:box-bold-duotone"
              className="text-primary"
              width={24}
            />
            <h3 className="text-xl font-semibold">
              Seleziona Prodotti per DDT
            </h3>
          </div>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Cerca prodotti, SKU o marca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startContent={<Icon icon="solar:magnifer-bold" width={20} />}
                className="flex-1"
              />

              <Select
                placeholder="Categoria"
                selectedKeys={categoryFilter ? [categoryFilter] : []}
                onSelectionChange={(keys) =>
                  setCategoryFilter(Array.from(keys)[0] as string)
                }
                className="w-48"
              >
                <SelectItem key="all">Tutte le categorie</SelectItem>
                <>
                  {categoryNames.map((categoryName) => (
                    <SelectItem key={categoryName}>{categoryName}</SelectItem>
                  ))}
                </>
              </Select>

              <div className="flex items-center gap-2">
                <Checkbox
                  isSelected={showOnlyAvailable}
                  onValueChange={setShowOnlyAvailable}
                >
                  Solo disponibili
                </Checkbox>
              </div>
            </div>

            {/* Selection Summary */}
            {selectedProducts.size > 0 && (
              <Card>
                <CardBody>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Riepilogo Selezione</h4>
                      <Badge color="primary" variant="flat">
                        {selectedProducts.size} prodotti selezionati
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-default-500">
                          Articoli totali:
                        </span>
                        <span className="font-medium ml-2">
                          {totals.totalItems}
                        </span>
                      </div>
                      <div>
                        <span className="text-default-500">Peso totale:</span>
                        <span className="font-medium ml-2">
                          {totals.totalWeight.toFixed(1)} kg
                        </span>
                      </div>
                      <div>
                        <span className="text-default-500">Valore totale:</span>
                        <span className="font-medium ml-2">
                          €{totals.totalValue.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {capacityWarning && (
                      <div
                        className={`p-3 rounded-lg ${
                          capacityWarning.type === "danger"
                            ? "bg-danger-50 text-danger-700 border border-danger-200"
                            : "bg-warning-50 text-warning-700 border border-warning-200"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon
                            icon={
                              capacityWarning.type === "danger"
                                ? "solar:danger-triangle-bold"
                                : "solar:info-circle-bold"
                            }
                            width={16}
                          />
                          <span className="text-sm font-medium">
                            {capacityWarning.message}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Products Table */}
            <Table
              aria-label="Tabella prodotti"
              selectionMode="multiple"
              showSelectionCheckboxes={true}
              selectedKeys={
                new Set(
                  Array.from(selectedProducts.keys()).map((key) =>
                    key.toString()
                  )
                )
              }
              onSelectionChange={(keys) => {
                const newSelectedProducts = new Map();

                if (keys === "all") {
                  // Se "all" è selezionato, seleziona tutti i prodotti filtrati
                  filteredProducts.forEach((product) => {
                    const existingProduct = selectedProducts.get(
                      product.product_id.toString()
                    );
                    newSelectedProducts.set(product.product_id.toString(), {
                      ...product,
                      selected_quantity:
                        existingProduct?.selected_quantity || 1,
                    });
                  });
                } else {
                  // Altrimenti, gestisci le chiavi selezionate
                  Array.from(keys).forEach((key) => {
                    const product = filteredProducts.find(
                      (p) => p.product_id.toString() === key
                    );
                    if (product) {
                      const existingProduct = selectedProducts.get(
                        key as string
                      );
                      newSelectedProducts.set(key as string, {
                        ...product,
                        selected_quantity:
                          existingProduct?.selected_quantity || 1,
                      });
                    }
                  });
                }
                setSelectedProducts(newSelectedProducts);
              }}
              classNames={{
                wrapper: "max-h-96",
              }}
            >
              <TableHeader>
                <TableColumn>PRODOTTO</TableColumn>
                <TableColumn>CATEGORIA</TableColumn>
                <TableColumn>DISPONIBILITÀ</TableColumn>
                <TableColumn>PESO</TableColumn>
                <TableColumn>PREZZO</TableColumn>
                <TableColumn>QUANTITÀ</TableColumn>
              </TableHeader>

              <TableBody>
                {filteredProducts.map((product) => {
                  const selectedProduct = selectedProducts.get(
                    product.product_id.toString()
                  );
                  const categoryId = product.category_id || product.category;

                  return (
                    <TableRow key={product.product_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-default-500">
                            SKU: {product.sku}
                            {product.brand && ` • ${product.brand}`}
                            {product.is_caldaia &&
                              product.power_kw &&
                              ` • ${product.power_kw}kW`}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Chip
                          color={
                            categoryColors[
                              (categoryMap.get(categoryId) ||
                                categoryId) as keyof typeof categoryColors
                            ] || "default"
                          }
                          size="sm"
                          variant="flat"
                        >
                          {categoryMap.get(categoryId) || categoryId}
                        </Chip>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col">
                          <span
                            className={`font-medium ${
                              product.stock_unit === 0
                                ? "text-danger"
                                : "text-success"
                            }`}
                          >
                            {product.stock_unit} pz
                          </span>
                          {product.warehouse_name && (
                            <span className="text-xs text-default-500">
                              {product.warehouse_name}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="font-medium">{product.weight} kg</span>
                        {product.dimensions && (
                          <div className="text-xs text-default-500">
                            {product.dimensions}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <span className="font-medium">€{product.price}</span>
                      </TableCell>

                      <TableCell>
                        {selectedProduct ? (
                          <Input
                            type="number"
                            size="sm"
                            min="1"
                            max={product.stock_unit}
                            value={selectedProduct.selected_quantity.toString()}
                            onChange={(e) => {
                              const quantity = parseInt(e.target.value);
                              if (!isNaN(quantity)) {
                                handleQuantityChange(
                                  product.product_id.toString(),
                                  quantity
                                );
                              }
                            }}
                            className="w-20"
                          />
                        ) : (
                          <span className="text-default-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {filteredProducts.length === 0 && (
              <div className="text-center py-8">
                <Icon
                  icon="solar:box-minimalistic-outline"
                  className="text-default-300 mx-auto mb-4"
                  width={48}
                />
                <h4 className="font-semibold text-default-600 mb-2">
                  Nessun prodotto trovato
                </h4>
                <p className="text-sm text-default-500">
                  Prova a modificare i filtri di ricerca
                </p>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={handleClose}>
            Annulla
          </Button>
          <Button
            color="primary"
            onPress={handleConfirm}
            isDisabled={
              selectedProducts.size === 0 || capacityWarning?.type === "danger"
            }
            startContent={<Icon icon="solar:check-circle-bold" width={16} />}
          >
            Conferma Selezione ({selectedProducts.size})
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
