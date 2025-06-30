import React, { useState, useMemo } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Select,
  SelectItem,
  Checkbox,
  Badge,
  Card,
  CardBody,
  Divider,
} from "@heroui/react";
import { Icon } from "@iconify/react";

interface Product {
  product_id: string;
  name: string;
  sku: string;
  weight: number;
  dimensions?: string;
  category: string;
  price: number;
  quantity: number;
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

interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onConfirm: (selectedProducts: SelectedProduct[]) => void;
  vehicleCapacity?: number;
}

const categoryColors = {
  "Caldaie": "success",
  "Pompe di Calore": "primary",
  "Radiatori": "warning",
  "Componenti Idraulici": "secondary",
  "Componenti Elettrici": "danger",
  "Ricambi": "default",
} as const;

export default function ProductSelectionModal({
  isOpen,
  onClose,
  products,
  onConfirm,
  vehicleCapacity,
}: ProductSelectionModalProps) {
  const [selectedProducts, setSelectedProducts] = useState<Map<string, SelectedProduct>>(new Map());
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category))];
    return cats.sort();
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (product.brand && product.brand.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
      const hasStock = !showOnlyAvailable || product.quantity > 0;
      
      return matchesSearch && matchesCategory && hasStock;
    });
  }, [products, searchQuery, categoryFilter, showOnlyAvailable]);

  // Calculate totals
  const totals = useMemo(() => {
    const selectedArray = Array.from(selectedProducts.values());
    return {
      totalWeight: selectedArray.reduce((sum, product) => sum + (product.weight * product.selected_quantity), 0),
      totalValue: selectedArray.reduce((sum, product) => sum + (product.price * product.selected_quantity), 0),
      totalItems: selectedArray.reduce((sum, product) => sum + product.selected_quantity, 0),
    };
  }, [selectedProducts]);

  const handleProductSelect = (product: Product, selected: boolean) => {
    const newSelectedProducts = new Map(selectedProducts);
    
    if (selected) {
      newSelectedProducts.set(product.product_id, {
        ...product,
        selected_quantity: 1,
      });
    } else {
      newSelectedProducts.delete(product.product_id);
    }
    
    setSelectedProducts(newSelectedProducts);
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    const newSelectedProducts = new Map(selectedProducts);
    const product = newSelectedProducts.get(productId);
    
    if (product && quantity > 0 && quantity <= product.quantity) {
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

  const isProductSelected = (productId: string) => selectedProducts.has(productId);

  const getCapacityWarning = () => {
    if (!vehicleCapacity) return null;
    
    const usagePercentage = (totals.totalWeight / vehicleCapacity) * 100;
    
    if (usagePercentage > 100) {
      return {
        type: "danger" as const,
        message: `Capacità superata! ${usagePercentage.toFixed(1)}% (${totals.totalWeight}kg / ${vehicleCapacity}kg)`,
      };
    } else if (usagePercentage > 80) {
      return {
        type: "warning" as const,
        message: `Capacità quasi piena: ${usagePercentage.toFixed(1)}% (${totals.totalWeight}kg / ${vehicleCapacity}kg)`,
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
            <Icon icon="solar:box-bold-duotone" className="text-primary" width={24} />
            <h3 className="text-xl font-semibold">Seleziona Prodotti per DDT</h3>
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
                onSelectionChange={(keys) => setCategoryFilter(Array.from(keys)[0] as string)}
                className="w-48"
              >
                <SelectItem key="all">Tutte le categorie</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category}>{category}</SelectItem>
                ))}
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
                        <span className="text-default-500">Articoli totali:</span>
                        <span className="font-medium ml-2">{totals.totalItems}</span>
                      </div>
                      <div>
                        <span className="text-default-500">Peso totale:</span>
                        <span className="font-medium ml-2">{totals.totalWeight.toFixed(1)} kg</span>
                      </div>
                      <div>
                        <span className="text-default-500">Valore totale:</span>
                        <span className="font-medium ml-2">€{totals.totalValue.toFixed(2)}</span>
                      </div>
                    </div>

                    {capacityWarning && (
                      <div className={`p-3 rounded-lg ${
                        capacityWarning.type === "danger" 
                          ? "bg-danger-50 text-danger-700 border border-danger-200" 
                          : "bg-warning-50 text-warning-700 border border-warning-200"
                      }`}>
                        <div className="flex items-center gap-2">
                          <Icon 
                            icon={capacityWarning.type === "danger" ? "solar:danger-triangle-bold" : "solar:info-circle-bold"} 
                            width={16} 
                          />
                          <span className="text-sm font-medium">{capacityWarning.message}</span>
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
              classNames={{
                wrapper: "max-h-96",
              }}
            >
              <TableHeader>
                <TableColumn>SELEZIONA</TableColumn>
                <TableColumn>PRODOTTO</TableColumn>
                <TableColumn>CATEGORIA</TableColumn>
                <TableColumn>DISPONIBILITÀ</TableColumn>
                <TableColumn>PESO</TableColumn>
                <TableColumn>PREZZO</TableColumn>
                <TableColumn>QUANTITÀ</TableColumn>
              </TableHeader>
              
              <TableBody>
                {filteredProducts.map((product) => {
                  const isSelected = isProductSelected(product.product_id);
                  const selectedProduct = selectedProducts.get(product.product_id);
                  
                  return (
                    <TableRow key={product.product_id}>
                      <TableCell>
                        <Checkbox
                          isSelected={isSelected}
                          onValueChange={(selected) => handleProductSelect(product, selected)}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-default-500">
                            SKU: {product.sku}
                            {product.brand && ` • ${product.brand}`}
                            {product.is_caldaia && product.power_kw && ` • ${product.power_kw}kW`}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          color={categoryColors[product.category as keyof typeof categoryColors] || "default"}
                          size="sm"
                          variant="flat"
                        >
                          {product.category}
                        </Chip>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col">
                          <span className={`font-medium ${product.quantity === 0 ? 'text-danger' : 'text-success'}`}>
                            {product.quantity} pz
                          </span>
                          {product.warehouse_name && (
                            <span className="text-xs text-default-500">{product.warehouse_name}</span>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <span className="font-medium">{product.weight} kg</span>
                        {product.dimensions && (
                          <div className="text-xs text-default-500">{product.dimensions}</div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <span className="font-medium">€{product.price.toFixed(2)}</span>
                      </TableCell>
                      
                      <TableCell>
                        {isSelected ? (
                          <Input
                            type="number"
                            size="sm"
                            min="1"
                            max={product.quantity}
                            value={selectedProduct?.selected_quantity?.toString() || "1"}
                            onChange={(e) => {
                              const quantity = parseInt(e.target.value);
                              if (!isNaN(quantity)) {
                                handleQuantityChange(product.product_id, quantity);
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
            isDisabled={selectedProducts.size === 0 || (capacityWarning?.type === "danger")}
            startContent={<Icon icon="solar:check-circle-bold" width={16} />}
          >
            Conferma Selezione ({selectedProducts.size})
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}