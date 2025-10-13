import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Chip,
  Progress,
  Spinner,
  Tabs,
  Tab,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useState, useEffect, useMemo } from "react";
import PageHeader from "../../Components/Layout/PageHeader";

// Interfaces
interface ProductLocation {
  warehouse_id: string;
  warehouse_name: string;
  warehouse_code?: string;
  location_type: "warehouse" | "vehicle";
  vehicle_id?: string;
  vehicle_name?: string;
  license_plate?: string;
  quantity: number;
  status: "Disponibile" | "Esaurito" | "Bassa giacenza";
}

interface GlobalProduct {
  product_id: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  price: number;
  image?: string;
  total_quantity: number;
  locations: ProductLocation[];
  min_stock_threshold: number;
}

interface SearchStats {
  totalProducts: number;
  totalQuantity: number;
  uniqueLocations: number;
  warehouses: number;
  vehicles: number;
  totalValue: number;
}

export default function GlobalProductSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [searchResults, setSearchResults] = useState<GlobalProduct[]>([]);
  const [allProducts, setAllProducts] = useState<GlobalProduct[]>([]);
  const [stats, setStats] = useState<SearchStats>({
    totalProducts: 0,
    totalQuantity: 0,
    uniqueLocations: 0,
    warehouses: 0,
    vehicles: 0,
    totalValue: 0,
  });
  const [sortBy, setSortBy] = useState<"name" | "quantity" | "locations">("name");
  const [filterBy, setFilterBy] = useState<"all" | "warehouses" | "vehicles">("all");

  // Modal states
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();
  const [selectedProduct, setSelectedProduct] = useState<GlobalProduct | null>(null);
  const [productToDelete, setProductToDelete] = useState<GlobalProduct | null>(null);

  // Get critical products (low stock)
  const criticalProducts = useMemo(() => {
    return searchResults.filter(product => 
      product.total_quantity <= product.min_stock_threshold
    );
  }, [searchResults]);

  // Load all products on component mount
  useEffect(() => {
    fetchAllProducts();
  }, []);

  // Update search results when query or filters change
  useEffect(() => {
    // Se non c'è ricerca, mostra tutti i prodotti
    const productsToFilter = searchQuery.trim() ? allProducts.filter((product) => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    }) : allProducts;

    // Applica filtri per tipo di locazione
    const filtered = productsToFilter.filter((product) => {
      if (filterBy === "warehouses") {
        return product.locations.some(loc => loc.location_type === "warehouse");
      } else if (filterBy === "vehicles") {
        return product.locations.some(loc => loc.location_type === "vehicle");
      }
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "quantity":
          return b.total_quantity - a.total_quantity;
        case "locations":
          return b.locations.length - a.locations.length;
        default:
          return 0;
      }
    });

    setSearchResults(sorted);
    updateStats(sorted);
  }, [searchQuery, allProducts, sortBy, filterBy]);

  const fetchAllProducts = async () => {
    setIsLoading(true);
    try {
      setLoadingStep("Caricamento prodotti magazzini...");
      // Fetch warehouse products
      const productsResponse = await axios.get("/Product/GET/GetAllProducts");
      const warehouseProductsData = productsResponse.data;

      setLoadingStep("Caricamento informazioni magazzini e veicoli...");
      // Fetch warehouses and vehicles for location mapping
      const [warehousesResponse, vehiclesResponse] = await Promise.all([
        axios.get("/Warehouse/GET/GetAllWarehouses").catch(() => ({ data: [] })),
        axios.get("/Vehicle/GET/GetAllVehicles").catch(() => ({ data: [] })),
      ]);

      const warehouses = warehousesResponse.data || [];
      const vehicles = vehiclesResponse.data || [];
      
      setLoadingStep(`Elaborazione ${warehouseProductsData.length} prodotti da magazzini...`);

      // Group products by product details and aggregate locations
      const productMap = new Map<string, GlobalProduct>();

      // Process warehouse products
      warehouseProductsData.forEach((product: any) => {
        const productKey = product.product_id;
        
        if (!productMap.has(productKey)) {
          productMap.set(productKey, {
            product_id: product.product_id,
            name: product.name || product.ProductName || "Prodotto sconosciuto",
            sku: product.sku || product.ProductSKU || "",
            category: product.category_name || product.category || "Non categorizzato",
            description: product.description || product.ProductDescription || "",
            price: parseFloat(product.price || product.ProductPrice || "0"),
            image: product.image || product.ProductImageURL,
            total_quantity: 0,
            locations: [],
            min_stock_threshold: parseInt(product.min_stock_treshold || product.ProductMinStockThreshold || "10"),
          });
        }

        const globalProduct = productMap.get(productKey)!;
        const quantity = parseInt(product.stock_unit || product.quantity || "0");
        
        // Find the warehouse info
        const warehouse = warehouses.find((w: any) => 
          w.WarehouseID === product.warehouse_id || 
          w.WarehouseUUID === product.warehouse_id ||
          w.warehouse_id === product.warehouse_id
        );
        
        const location: ProductLocation = {
          warehouse_id: product.warehouse_id || "unknown",
          warehouse_name: warehouse?.WarehouseName || warehouse?.name || product.warehouse_name || "Magazzino sconosciuto",
          warehouse_code: warehouse?.WarehouseCode,
          location_type: "warehouse",
          quantity,
          status: quantity <= 0 ? "Esaurito" : 
                 quantity <= globalProduct.min_stock_threshold ? "Bassa giacenza" : "Disponibile",
        };

        globalProduct.locations.push(location);
        globalProduct.total_quantity += quantity;
      });

      setLoadingStep("Caricamento prodotti veicoli...");
      
      // Process vehicle products
      for (const vehicle of vehicles) {
        try {
          const vehicleInventoryResponse = await axios.get(`/Vehicle/GET/GetVehicleInventory?vehicle_id=${vehicle.vehicle_id || vehicle.id}`);
          const vehicleProducts = vehicleInventoryResponse.data || [];
          
          vehicleProducts.forEach((product: any) => {
            const productKey = product.product_id;
            
            if (!productMap.has(productKey)) {
              productMap.set(productKey, {
                product_id: product.product_id,
                name: product.name || product.ProductName || "Prodotto sconosciuto",
                sku: product.sku || product.ProductSKU || "",
                category: product.category_name || product.category || "Non categorizzato",
                description: product.description || product.ProductDescription || "",
                price: parseFloat(product.price || product.ProductPrice || "0"),
                image: product.image || product.ProductImageURL,
                total_quantity: 0,
                locations: [],
                min_stock_threshold: parseInt(product.min_stock_treshold || product.ProductMinStockThreshold || "10"),
              });
            }

            const globalProduct = productMap.get(productKey)!;
            const quantity = parseInt(product.quantity || product.stock_unit || "0");
            
            const location: ProductLocation = {
              warehouse_id: vehicle.vehicle_id || vehicle.id,
              warehouse_name: vehicle.name || vehicle.vehicle_name || "Veicolo sconosciuto",
              license_plate: vehicle.license_plate,
              location_type: "vehicle",
              vehicle_id: vehicle.vehicle_id || vehicle.id,
              vehicle_name: vehicle.name || vehicle.vehicle_name,
              quantity,
              status: quantity <= 0 ? "Esaurito" : 
                     quantity <= globalProduct.min_stock_threshold ? "Bassa giacenza" : "Disponibile",
            };

            globalProduct.locations.push(location);
            globalProduct.total_quantity += quantity;
          });
        } catch (error) {
          console.warn(`Failed to fetch inventory for vehicle ${vehicle.vehicle_id || vehicle.id}:`, error);
        }
      }

      const allProductsArray = Array.from(productMap.values());
      setAllProducts(allProductsArray);
      setSearchResults(allProductsArray);
      updateStats(allProductsArray);
      
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const updateStats = (products: GlobalProduct[]) => {
    const totalProducts = products.length;
    const totalQuantity = products.reduce((sum, p) => sum + p.total_quantity, 0);
    const uniqueLocations = new Set(products.flatMap(p => p.locations.map(l => l.warehouse_id))).size;
    const warehouses = new Set(products.flatMap(p => p.locations.filter(l => l.location_type === "warehouse").map(l => l.warehouse_id))).size;
    const vehicles = new Set(products.flatMap(p => p.locations.filter(l => l.location_type === "vehicle").map(l => l.warehouse_id))).size;
    const totalValue = products.reduce((sum, p) => sum + (p.total_quantity * (p.price || 0)), 0);

    setStats({
      totalProducts,
      totalQuantity,
      uniqueLocations,
      warehouses,
      vehicles,
      totalValue,
    });
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await axios.delete(`/Product/DELETE/DeleteProduct?product_id=${productId}`);
      fetchAllProducts(); // Refresh data
      onDeleteModalClose();
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  };

  const handleEditProduct = (productId: string) => {
    window.open(`/inventory/products/edit/${productId}`, "_blank");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Disponibile": return "success";
      case "Bassa giacenza": return "warning";
      case "Esaurito": return "danger";
      default: return "default";
    }
  };

  const getLocationIcon = (locationType: string) => {
    return locationType === "vehicle" ? "solar:delivery-bold" : "solar:buildings-3-bold";
  };

  return (
    <div className="w-full flex-1 flex flex-col p-6 gap-6">
      {/* Header */}
      <PageHeader
        title="Distribuzione Globale Prodotti"
        description="Visualizza e gestisci tutti i prodotti distribuiti in magazzini e veicoli"
        icon="solar:widget-2-bold"
        size="lg"
        indicators={[
          {
            label: "Prodotti Totali",
            value: `${stats.totalProducts}`,
            icon: "solar:box-bold",
            color: "primary",
          },
          {
            label: "Quantità Totale",
            value: `${stats.totalQuantity.toLocaleString()}`,
            icon: "solar:calculator-bold",
            color: "success",
          },
          {
            label: "Locazioni",
            value: `${stats.warehouses + stats.vehicles}`,
            icon: "solar:map-point-bold",
            color: "secondary",
          },
          ...(criticalProducts.length > 0 ? [{
            label: "Critici",
            value: `${criticalProducts.length}`,
            icon: "solar:danger-bold",
            color: "warning" as const,
          }] : []),
        ]}
        actions={[
          {
            label: "Vista Magazzino",
            icon: "solar:buildings-3-bold",
            color: "default",
            variant: "flat",
            onClick: () => window.history.back(),
          },
          {
            label: "Nuovo Prodotto",
            icon: "solar:add-circle-bold",
            color: "primary",
            variant: "flat",
            onClick: () => window.open("/inventory/products/add", "_blank"),
          },
        ]}
      />

      {/* Statistics Dashboard */}
      {stats.totalProducts > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950 dark:to-primary-900 border-0">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                    Magazzini Attivi
                  </p>
                  <p className="text-2xl font-bold text-primary-700 dark:text-primary-300">
                    {stats.warehouses}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center">
                  <Icon icon="solar:buildings-3-bold" className="text-primary-600" width={24} />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-warning-50 to-warning-100 dark:from-warning-950 dark:to-warning-900 border-0">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-warning-600 dark:text-warning-400 font-medium">
                    Veicoli Operativi
                  </p>
                  <p className="text-2xl font-bold text-warning-700 dark:text-warning-300">
                    {stats.vehicles}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-warning-500/20 flex items-center justify-center">
                  <Icon icon="solar:delivery-bold" className="text-warning-600" width={24} />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-success-50 to-success-100 dark:from-success-950 dark:to-success-900 border-0">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-success-600 dark:text-success-400 font-medium">
                    Distribuzione
                  </p>
                  <p className="text-2xl font-bold text-success-700 dark:text-success-300">
                    {((stats.vehicles / (stats.warehouses + stats.vehicles)) * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-success-500/20 flex items-center justify-center">
                  <Icon icon="solar:chart-bold" className="text-success-600" width={24} />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-secondary-50 to-secondary-100 dark:from-secondary-950 dark:to-secondary-900 border-0">
            <CardBody className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-secondary-600 dark:text-secondary-400 font-medium">
                    Valore Totale
                  </p>
                  <p className="text-2xl font-bold text-secondary-700 dark:text-secondary-300">
                    €{stats.totalValue.toLocaleString("it-IT", { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-secondary-500/20 flex items-center justify-center">
                  <Icon icon="solar:euro-bold" className="text-secondary-600" width={24} />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Search & Filters */}
      <Card className="border-0 bg-content1/50 backdrop-blur-md">
        <CardBody className="p-6">
          <div className="flex flex-col gap-6">
            {/* Search Bar */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              <div className="flex-1 max-w-2xl">
                <Input
                  placeholder="🔍 Cerca prodotti, SKU, categorie..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="lg"
                  startContent={
                    <Icon icon="solar:magnifer-linear" className="text-default-400" width={20} />
                  }
                  isClearable
                  onClear={() => setSearchQuery("")}
                  className="w-full"
                  classNames={{
                    input: "text-sm",
                    inputWrapper: "bg-default-100 border-0 shadow-sm",
                  }}
                />
              </div>
            </div>

            {/* Filters and Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex gap-3">
                <Tabs
                  selectedKey={filterBy}
                  onSelectionChange={(key) => setFilterBy(key as any)}
                  size="sm"
                  color="primary"
                >
                  <Tab key="all" title="Tutti" />
                  <Tab key="warehouses" title="Solo Magazzini" />
                  <Tab key="vehicles" title="Solo Veicoli" />
                </Tabs>

                <div className="h-6 w-px bg-divider" />

                <Tabs
                  selectedKey={sortBy}
                  onSelectionChange={(key) => setSortBy(key as any)}
                  size="sm"
                  variant="light"
                >
                  <Tab key="name" title="Nome" />
                  <Tab key="quantity" title="Quantità" />
                  <Tab key="locations" title="Locazioni" />
                </Tabs>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner size="lg" color="primary" />
          <p className="mt-4 text-default-500 text-center max-w-md">
            {loadingStep || "Caricamento prodotti..."}
          </p>
          <div className="mt-2 text-sm text-default-400">
            Recupero dati da magazzini e veicoli
          </div>
        </div>
      )}

      {/* Products Overview */}
      {!isLoading && (
        <>
          {searchResults.length === 0 ? (
            <Card className="border-0">
              <CardBody className="py-16">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-full bg-default-100 flex items-center justify-center mb-6">
                    <Icon icon={searchQuery ? "solar:magnifer-cross-bold" : "solar:box-bold"} className="text-default-400" width={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {searchQuery ? "Nessun prodotto trovato" : "Nessun prodotto disponibile"}
                  </h3>
                  <p className="text-default-500 mb-6 max-w-md">
                    {searchQuery 
                      ? `Non ci sono prodotti che corrispondono alla ricerca "${searchQuery}". Prova con termini diversi.`
                      : "Non ci sono prodotti nell'inventario o si è verificato un errore nel caricamento."
                    }
                  </p>
                  {searchQuery && (
                    <Button
                      color="primary"
                      variant="flat"
                      onPress={() => setSearchQuery("")}
                      startContent={<Icon icon="solar:refresh-bold" width={16} />}
                    >
                      Resetta Ricerca
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          ) : (
            /* Products Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((product) => (
                <Card key={product.product_id} className="border-0 shadow-medium hover:shadow-large transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={product.image}
                        className="w-16 h-16 rounded-xl"
                        showFallback
                        fallback={<Icon icon="solar:box-bold" className="text-default-400" width={24} />}
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-foreground">{product.name}</h4>
                        <p className="text-sm text-default-500 font-mono">SKU: {product.sku}</p>
                        <Chip size="sm" color="primary" variant="flat" className="mt-1">
                          {product.category}
                        </Chip>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardBody className="pt-0 space-y-4">
                    {/* Quantity and Price */}
                    <div className="flex items-center justify-between p-3 bg-primary-50 dark:bg-primary-950 rounded-lg">
                      <div>
                        <p className="text-sm text-primary-600 dark:text-primary-400">Quantità Totale</p>
                        <p className="text-2xl font-bold text-primary">{product.total_quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-default-500">Prezzo</p>
                        <p className="text-lg font-bold text-success">€{product.price.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Distribution */}
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">
                        Distribuzione ({product.locations.length} locazion{product.locations.length !== 1 ? 'i' : 'e'})
                      </p>
                      <div className="space-y-2">
                        {product.locations.slice(0, 3).map((location, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-default-50 dark:bg-default-950 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Icon
                                icon={getLocationIcon(location.location_type)}
                                className={location.location_type === "vehicle" ? "text-warning" : "text-primary"}
                                width={16}
                              />
                              <span className="text-sm truncate max-w-32" title={location.warehouse_name}>
                                {location.warehouse_name}
                                {location.license_plate && ` (${location.license_plate})`}
                              </span>
                            </div>
                            <span className="font-bold text-sm">{location.quantity}</span>
                          </div>
                        ))}
                        {product.locations.length > 3 && (
                          <p className="text-xs text-default-500 text-center py-1">
                            +{product.locations.length - 3} altre locazioni
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        color="primary"
                        variant="flat"
                        size="sm"
                        className="flex-1"
                        onPress={() => {
                          setSelectedProduct(product);
                          onOpen();
                        }}
                        startContent={<Icon icon="solar:eye-bold" width={16} />}
                      >
                        Dettagli
                      </Button>
                      
                      <Dropdown>
                        <DropdownTrigger>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="default"
                          >
                            <Icon icon="solar:menu-dots-bold" width={16} />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu>
                          <DropdownItem
                            key="edit"
                            startContent={<Icon icon="solar:pen-bold" width={16} />}
                            onPress={() => handleEditProduct(product.product_id)}
                          >
                            Modifica
                          </DropdownItem>
                          <DropdownItem
                            key="delete"
                            startContent={<Icon icon="solar:trash-bin-bold" width={16} />}
                            className="text-danger"
                            color="danger"
                            onPress={() => {
                              setProductToDelete(product);
                              onDeleteModalOpen();
                            }}
                          >
                            Elimina
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Product Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="5xl" backdrop="blur">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <Icon icon="solar:box-bold" className="text-primary" width={24} />
              <span>Dettagli Distribuzione Prodotto</span>
            </div>
          </ModalHeader>
          <ModalBody className="p-6">
            {selectedProduct && (
              <div className="space-y-6">
                {/* Product Header */}
                <div className="flex gap-6">
                  <Avatar
                    src={selectedProduct.image || "https://via.placeholder.com/120"}
                    className="w-24 h-24 rounded-xl"
                    showFallback
                    fallback={<Icon icon="solar:box-bold" className="text-default-400" width={32} />}
                  />
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      {selectedProduct.name}
                    </h3>
                    <div className="flex items-center gap-4 mb-3">
                      <Chip color="default" variant="flat">
                        SKU: {selectedProduct.sku}
                      </Chip>
                      <Chip color="primary" variant="flat">
                        {selectedProduct.category}
                      </Chip>
                      <Chip color="success" variant="flat">
                        €{selectedProduct.price.toFixed(2)}
                      </Chip>
                    </div>
                    <p className="text-default-600">
                      {selectedProduct.description || "Nessuna descrizione disponibile"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-default-500 mb-1">Quantità Totale</p>
                    <p className="text-4xl font-bold text-primary">{selectedProduct.total_quantity}</p>
                    <p className="text-sm text-default-500">
                      in {selectedProduct.locations.length} locazion{selectedProduct.locations.length !== 1 ? 'i' : 'e'}
                    </p>
                  </div>
                </div>

                <Divider />

                {/* Distribution Details */}
                <div>
                  <h4 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Icon icon="solar:map-point-bold" className="text-secondary" width={20} />
                    Distribuzione Dettagliata
                  </h4>
                  
                  <div className="grid gap-4">
                    {selectedProduct.locations.map((location, index) => (
                      <Card key={index} className="bg-default-50 dark:bg-default-950 border-1">
                        <CardBody className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                location.location_type === "vehicle" 
                                  ? "bg-warning-100 dark:bg-warning-950" 
                                  : "bg-primary-100 dark:bg-primary-950"
                              }`}>
                                <Icon
                                  icon={getLocationIcon(location.location_type)}
                                  className={location.location_type === "vehicle" ? "text-warning" : "text-primary"}
                                  width={20}
                                />
                              </div>
                              <div>
                                <h5 className="font-semibold text-foreground">
                                  {location.warehouse_name}
                                  {location.warehouse_code && ` (${location.warehouse_code})`}
                                </h5>
                                <div className="flex items-center gap-2 mt-1">
                                  <Chip
                                    size="sm"
                                    color={location.location_type === "vehicle" ? "warning" : "primary"}
                                    variant="flat"
                                  >
                                    {location.location_type === "vehicle" ? "Veicolo" : "Magazzino"}
                                  </Chip>
                                  {location.license_plate && (
                                    <Chip size="sm" color="default" variant="flat">
                                      {location.license_plate}
                                    </Chip>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-2xl font-bold text-foreground">{location.quantity}</p>
                              <Chip
                                color={getStatusColor(location.status) as any}
                                size="sm"
                                variant="flat"
                              >
                                {location.status}
                              </Chip>
                            </div>
                          </div>
                          
                          {/* Progress bar showing percentage of total */}
                          <div className="mt-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-default-500">% del totale</span>
                              <span className="text-xs font-medium">
                                {((location.quantity / selectedProduct.total_quantity) * 100).toFixed(1)}%
                              </span>
                            </div>
                            <Progress
                              value={(location.quantity / selectedProduct.total_quantity) * 100}
                              color={location.location_type === "vehicle" ? "warning" : "primary"}
                              size="sm"
                              aria-label="Percentuale quantità"
                            />
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-default-100 dark:bg-default-950 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-default-500">Magazzini</p>
                    <p className="text-xl font-bold text-primary">
                      {selectedProduct.locations.filter(l => l.location_type === "warehouse").length}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-default-500">Veicoli</p>
                    <p className="text-xl font-bold text-warning">
                      {selectedProduct.locations.filter(l => l.location_type === "vehicle").length}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-default-500">Disponibile</p>
                    <p className="text-xl font-bold text-success">
                      {selectedProduct.locations.filter(l => l.status === "Disponibile").reduce((sum, l) => sum + l.quantity, 0)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-default-500">Soglia Min.</p>
                    <p className="text-xl font-bold text-default-600">
                      {selectedProduct.min_stock_threshold}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={onClose}>
              Chiudi
            </Button>
            <Button
              color="primary"
              onPress={() => {
                onClose();
              }}
              startContent={<Icon icon="solar:pen-bold" width={16} />}
            >
              Modifica Prodotto
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={onDeleteModalClose} backdrop="blur">
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-semibold">Conferma Eliminazione</h3>
          </ModalHeader>
          <ModalBody>
            {productToDelete && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-danger-100 flex items-center justify-center mx-auto mb-4">
                  <Icon icon="solar:trash-bin-bold" className="text-danger" width={24} />
                </div>
                <h4 className="text-lg font-semibold mb-2">
                  Eliminare "{productToDelete.name}"?
                </h4>
                <p className="text-default-500 mb-4">
                  Questa azione eliminerà il prodotto da tutte le {productToDelete.locations.length} locazioni.
                  L'operazione non può essere annullata.
                </p>
                <div className="bg-default-100 p-3 rounded-lg">
                  <p className="text-sm text-default-600">
                    <strong>Quantità totale:</strong> {productToDelete.total_quantity}
                  </p>
                  <p className="text-sm text-default-600">
                    <strong>Locazioni:</strong> {productToDelete.locations.map(l => l.warehouse_name).join(", ")}
                  </p>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onDeleteModalClose}>
              Annulla
            </Button>
            <Button 
              color="danger" 
              onPress={() => productToDelete && handleDeleteProduct(productToDelete.product_id)}
              startContent={<Icon icon="solar:trash-bin-bold" width={16} />}
            >
              Elimina Prodotto
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
} 