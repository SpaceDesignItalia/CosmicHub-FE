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
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Avatar,
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
  });
  const [selectedView, setSelectedView] = useState<"grid" | "table">("grid");
  const [sortBy, setSortBy] = useState<"name" | "quantity" | "locations">("name");
  const [filterBy, setFilterBy] = useState<"all" | "warehouses" | "vehicles">("all");

  // Modal states
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedProduct, setSelectedProduct] = useState<GlobalProduct | null>(null);

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

      // Now fetch vehicle inventories
      console.log(`Recupero inventario di ${vehicles.length} veicoli...`);
      setLoadingStep(`Caricamento inventari da ${vehicles.length} veicoli...`);
      
      for (let i = 0; i < vehicles.length; i++) {
        const vehicle = vehicles[i];
        setLoadingStep(`Caricamento inventario veicolo ${i + 1}/${vehicles.length}: ${vehicle.name || vehicle.license_plate}...`);
        try {
          const vehicleInventoryResponse = await axios.get("/Vehicle/GET/GetVehicleInventory", {
            params: {
              vehicle_id: vehicle.vehicle_id || vehicle.id,
            },
          });

          const vehicleInventory = vehicleInventoryResponse.data || [];
          
          vehicleInventory.forEach((item: any) => {
            // Use vehicle_inventory_id as the key, but map to the actual product
            const productId = item.product_id || item.vehicle_inventory_id || item.id;
            const productName = item.name || "Prodotto sconosciuto";
            const quantity = parseInt(item.amount || item.quantity || "0");
            
            // Check if this product already exists in our map
            let productKey = productId;
            let globalProduct = productMap.get(productKey);
            
            // If not found by ID, try to find by name (in case IDs don't match)
            if (!globalProduct) {
              // Search for existing product by name
              for (const [key, product] of productMap.entries()) {
                if (product.name.toLowerCase() === productName.toLowerCase()) {
                  productKey = key;
                  globalProduct = product;
                  break;
                }
              }
            }
            
            // If still not found, create a new product entry
            if (!globalProduct) {
              globalProduct = {
                product_id: productId,
                name: productName,
                sku: item.sku || item.stock_unit || "",
                category: item.category_name || item.category || "Non categorizzato",
                description: item.description || "",
                price: parseFloat(item.price || "0"),
                image: item.image,
                total_quantity: 0,
                locations: [],
                min_stock_threshold: parseInt(item.min_stock_threshold || "10"),
              };
              productMap.set(productKey, globalProduct);
            }

            // Add vehicle location
            const vehicleLocation: ProductLocation = {
              warehouse_id: vehicle.vehicle_id || vehicle.id,
              warehouse_name: vehicle.name || "Veicolo sconosciuto",
              location_type: "vehicle",
              vehicle_id: vehicle.vehicle_id || vehicle.id,
              vehicle_name: vehicle.name,
              license_plate: vehicle.license_plate,
              quantity,
              status: quantity <= 0 ? "Esaurito" : 
                     quantity <= globalProduct.min_stock_threshold ? "Bassa giacenza" : "Disponibile",
            };

            globalProduct.locations.push(vehicleLocation);
            globalProduct.total_quantity += quantity;
          });
        } catch (error) {
          console.log(`Errore nel recuperare inventario del veicolo ${vehicle.name || vehicle.vehicle_id}:`, error);
        }
      }

      const globalProducts = Array.from(productMap.values());
      const vehicleProducts = globalProducts.filter(p => p.locations.some(l => l.location_type === "vehicle")).length;
      
      setLoadingStep("Finalizzazione dati...");
      console.log(`Caricati ${globalProducts.length} prodotti totali, inclusi ${vehicleProducts} con inventario veicoli`);
      
      setAllProducts(globalProducts);
      
    } catch (error) {
      console.error("Errore nel caricamento dei prodotti globali:", error);
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  };

  const updateStats = (products: GlobalProduct[]) => {
    const totalQuantity = products.reduce((sum, p) => sum + p.total_quantity, 0);
    const allLocations = products.flatMap(p => p.locations);
    const uniqueWarehouses = new Set(
      allLocations.filter(l => l.location_type === "warehouse").map(l => l.warehouse_id)
    ).size;
    const uniqueVehicles = new Set(
      allLocations.filter(l => l.location_type === "vehicle").map(l => l.warehouse_id)
    ).size;

    setStats({
      totalProducts: products.length,
      totalQuantity,
      uniqueLocations: uniqueWarehouses + uniqueVehicles,
      warehouses: uniqueWarehouses,
      vehicles: uniqueVehicles,
    });
  };

  // Prodotti in bassa giacenza o esauriti
  const criticalProducts = useMemo(() => {
    return allProducts.filter(product => 
      product.total_quantity <= product.min_stock_threshold || 
      product.total_quantity === 0
    ).slice(0, 5); // Mostra solo i primi 5
  }, [allProducts]);

  // Prodotti più distribuiti (presenti in più locazioni)
  const mostDistributedProducts = useMemo(() => {
    return [...allProducts]
      .filter(product => product.locations.length > 1)
      .sort((a, b) => b.locations.length - a.locations.length)
      .slice(0, 3);
  }, [allProducts]);

  // Statistiche avanzate per categorie
  const categoryStats = useMemo(() => {
    const stats = new Map<string, {
      count: number;
      totalQuantity: number;
      warehouses: number;
      vehicles: number;
    }>();

    allProducts.forEach(product => {
      const category = product.category;
      if (!stats.has(category)) {
        stats.set(category, { count: 0, totalQuantity: 0, warehouses: 0, vehicles: 0 });
      }
      
      const stat = stats.get(category)!;
      stat.count++;
      stat.totalQuantity += product.total_quantity;
      
      const warehouseLocations = product.locations.filter(l => l.location_type === "warehouse");
      const vehicleLocations = product.locations.filter(l => l.location_type === "vehicle");
      
      if (warehouseLocations.length > 0) stat.warehouses++;
      if (vehicleLocations.length > 0) stat.vehicles++;
    });

    return Array.from(stats.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5);
  }, [allProducts]);

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
    <div className="w-full flex-1 flex flex-col p-6 gap-8 min-h-screen">
      {/* Header */}
      <PageHeader
        title="Distribuzione Globale Inventario"
        description="Panoramica completa della distribuzione di tutti i prodotti in magazzini e veicoli"
        icon="solar:widget-2-bold"
        size="lg"
        indicators={[
          {
            label: searchQuery ? "Prodotti trovati" : "Prodotti totali",
            value: `${stats.totalProducts}`,
            icon: "solar:box-bold",
            color: "primary",
          },
          {
            label: "Locazioni attive",
            value: `${stats.uniqueLocations}`,
            icon: "solar:map-point-bold",
            color: "secondary",
          },
          ...(criticalProducts.length > 0 ? [{
            label: "Prodotti critici",
            value: `${criticalProducts.length}`,
            icon: "solar:danger-bold",
            color: "warning" as const,
          }] : []),
        ]}
      />

      {/* Search Section */}
      <Card className="border-0 bg-content1/50 backdrop-blur-md">
        <CardBody className="p-6">
          <div className="flex flex-col gap-6">
            {/* Main Search Bar */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              <div className="flex-1 max-w-2xl">
                <Input
                  placeholder="Cerca prodotti per nome, SKU, categoria o descrizione..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="lg"
                  startContent={
                    <Icon icon="solar:magnifer-linear" className="text-default-400" width={20} />
                  }
                  endContent={
                    searchQuery && (
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => setSearchQuery("")}
                      >
                        <Icon icon="solar:close-circle-linear" width={16} />
                      </Button>
                    )
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

              {/* Quick Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="flat"
                  size="lg"
                  onPress={() => setSearchQuery("cavo")}
                  startContent={<Icon icon="solar:flashlight-bold" width={16} />}
                >
                  Cavi
                </Button>
                <Button
                  variant="flat"
                  size="lg"
                  onPress={() => setSearchQuery("rame")}
                  startContent={<Icon icon="solar:atom-bold" width={16} />}
                >
                  Rame
                </Button>
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

              <div className="flex gap-2 bg-default-100 p-1 rounded-lg">
                <Button
                  size="sm"
                  variant={selectedView === "grid" ? "solid" : "light"}
                  color={selectedView === "grid" ? "primary" : "default"}
                  onPress={() => setSelectedView("grid")}
                  isIconOnly
                >
                  <Icon icon="solar:widget-4-bold" width={16} />
                </Button>
                <Button
                  size="sm"
                  variant={selectedView === "table" ? "solid" : "light"}
                  color={selectedView === "table" ? "primary" : "default"}
                  onPress={() => setSelectedView("table")}
                  isIconOnly
                >
                  <Icon icon="solar:list-bold" width={16} />
                </Button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Critical Products Alert */}
      {criticalProducts.length > 0 && (
        <Card className="border-l-4 border-l-warning bg-warning-50 dark:bg-warning-950/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <Icon icon="solar:danger-bold" className="text-warning" width={24} />
              <div>
                <h3 className="text-lg font-semibold text-warning-700 dark:text-warning-400">
                  Attenzione: Prodotti in Bassa Giacenza
                </h3>
                <p className="text-sm text-warning-600 dark:text-warning-500">
                  {criticalProducts.length} prodotti richiedono attenzione
                </p>
              </div>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {criticalProducts.map((product) => (
                <div
                  key={product.product_id}
                  className="flex items-center gap-3 p-3 bg-white dark:bg-default-950 rounded-lg border border-warning-200 dark:border-warning-800 cursor-pointer hover:bg-warning-50 dark:hover:bg-warning-950/30 transition-colors"
                  onClick={() => {
                    setSelectedProduct(product);
                    onOpen();
                  }}
                >
                  <div className="w-10 h-10 rounded-lg bg-warning-100 dark:bg-warning-950 flex items-center justify-center">
                    <Icon
                      icon={product.total_quantity === 0 ? "solar:close-circle-bold" : "solar:danger-triangle-bold"}
                      className="text-warning"
                      width={20}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground truncate">{product.name}</h4>
                    <p className="text-sm text-default-500">SKU: {product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${product.total_quantity === 0 ? 'text-danger' : 'text-warning'}`}>
                      {product.total_quantity}
                    </p>
                    <p className="text-xs text-default-500">
                      Min: {product.min_stock_threshold}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {allProducts.filter(p => p.total_quantity <= p.min_stock_threshold || p.total_quantity === 0).length > 5 && (
              <div className="mt-3 text-center">
                <Button
                  size="sm"
                  color="warning"
                  variant="flat"
                  onPress={() => {
                    setFilterBy("all");
                    setSearchQuery("");
                    setSortBy("quantity");
                  }}
                >
                  Vedi tutti i prodotti critici
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Statistics */}
      {stats.totalProducts > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950 dark:to-primary-900 border-0">
            <CardBody className="p-4 text-center">
              <Icon icon="solar:box-bold" className="text-primary mx-auto mb-2" width={24} />
              <p className="text-2xl font-bold text-primary">{stats.totalProducts}</p>
              <p className="text-sm text-primary-600">Prodotti Unici</p>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-success-50 to-success-100 dark:from-success-950 dark:to-success-900 border-0">
            <CardBody className="p-4 text-center">
              <Icon icon="solar:hashtag-bold" className="text-success mx-auto mb-2" width={24} />
              <p className="text-2xl font-bold text-success">{stats.totalQuantity}</p>
              <p className="text-sm text-success-600">Quantità Totale</p>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-warning-50 to-warning-100 dark:from-warning-950 dark:to-warning-900 border-0">
            <CardBody className="p-4 text-center">
              <Icon icon="solar:buildings-3-bold" className="text-warning mx-auto mb-2" width={24} />
              <p className="text-2xl font-bold text-warning">{stats.warehouses}</p>
              <p className="text-sm text-warning-600">Magazzini</p>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-secondary-50 to-secondary-100 dark:from-secondary-950 dark:to-secondary-900 border-0">
            <CardBody className="p-4 text-center">
              <Icon icon="solar:delivery-bold" className="text-secondary mx-auto mb-2" width={24} />
              <p className="text-2xl font-bold text-secondary">{stats.vehicles}</p>
              <p className="text-sm text-secondary-600">Veicoli</p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Insights Section */}
      {stats.totalProducts > 0 && mostDistributedProducts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Most Distributed Products */}
          <Card className="border-0">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <Icon icon="solar:chart-square-bold" className="text-secondary" width={24} />
                <div>
                  <h3 className="text-lg font-semibold">Prodotti più Distribuiti</h3>
                  <p className="text-sm text-default-500">
                    Prodotti presenti in più locazioni
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="space-y-4">
                {mostDistributedProducts.map((product, index) => (
                  <div
                    key={product.product_id}
                    className="flex items-center gap-4 p-3 bg-default-50 dark:bg-default-950 rounded-lg cursor-pointer hover:bg-default-100 dark:hover:bg-default-900 transition-colors"
                    onClick={() => {
                      setSelectedProduct(product);
                      onOpen();
                    }}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary-100 dark:bg-secondary-950 text-secondary font-bold">
                      {index + 1}
                    </div>
                    <Avatar
                      src={product.image}
                      className="w-12 h-12 rounded-lg"
                      showFallback
                      fallback={<Icon icon="solar:box-bold" className="text-default-400" width={16} />}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">{product.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Chip size="sm" color="default" variant="flat">
                          {product.category}
                        </Chip>
                        <span className="text-sm text-default-500">
                          {product.locations.length} locazioni
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-secondary">{product.total_quantity}</p>
                      <div className="flex gap-1 mt-1">
                        {product.locations.slice(0, 3).map((location, idx) => (
                          <div
                            key={idx}
                            className={`w-2 h-2 rounded-full ${
                              location.location_type === "vehicle" ? "bg-warning" : "bg-primary"
                            }`}
                            title={location.warehouse_name}
                          />
                        ))}
                        {product.locations.length > 3 && (
                          <span className="text-xs text-default-500">+{product.locations.length - 3}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Category Statistics */}
          <Card className="border-0">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <Icon icon="solar:pie-chart-bold" className="text-primary" width={24} />
                <div>
                  <h3 className="text-lg font-semibold">Distribuzione per Categoria</h3>
                  <p className="text-sm text-default-500">
                    Top categorie per quantità
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="space-y-4">
                {categoryStats.map((stat, index) => (
                  <div key={stat.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{stat.category}</span>
                        <Chip size="sm" color="default" variant="flat">
                          {stat.count} prodotti
                        </Chip>
                      </div>
                      <span className="text-lg font-bold text-primary">{stat.totalQuantity}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-default-500">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Icon icon="solar:buildings-3-bold" width={12} />
                          <span>{stat.warehouses} magazzini</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Icon icon="solar:delivery-bold" width={12} />
                          <span>{stat.vehicles} veicoli</span>
                        </div>
                      </div>
                      <span>{((stat.totalQuantity / stats.totalQuantity) * 100).toFixed(1)}%</span>
                    </div>
                    
                    <Progress
                      value={(stat.totalQuantity / stats.totalQuantity) * 100}
                      color="primary"
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

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
          ) : selectedView === "grid" ? (
            /* Grid View */
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {searchResults.map((product) => (
                <Card
                  key={product.product_id}
                  className="shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border-0"
                  isPressable
                  onPress={() => {
                    setSelectedProduct(product);
                    onOpen();
                  }}
                >
                  <CardHeader className="pb-4">
                    <div className="flex gap-4 w-full">
                      <Avatar
                        src={product.image || "https://via.placeholder.com/80"}
                        className="w-16 h-16 rounded-lg"
                        showFallback
                        fallback={<Icon icon="solar:box-bold" className="text-default-400" width={24} />}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-foreground truncate">
                          {product.name}
                        </h3>
                        <p className="text-sm text-default-500">SKU: {product.sku}</p>
                        <Chip color="default" size="sm" variant="flat" className="mt-1">
                          {product.category}
                        </Chip>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{product.total_quantity}</p>
                        <p className="text-xs text-default-500">Totale</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardBody className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Distribuzione:</span>
                        <Chip size="sm" color="secondary" variant="flat">
                          {product.locations.length} location{product.locations.length !== 1 ? 'i' : 'e'}
                        </Chip>
                      </div>
                      
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {product.locations.slice(0, 3).map((location, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-default-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Icon
                                icon={getLocationIcon(location.location_type)}
                                className="text-default-600"
                                width={16}
                              />
                              <span className="text-sm font-medium truncate max-w-32">
                                {location.warehouse_name}
                                {location.license_plate && ` (${location.license_plate})`}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold">{location.quantity}</span>
                              <Chip
                                color={getStatusColor(location.status) as any}
                                size="sm"
                                variant="dot"
                              />
                            </div>
                          </div>
                        ))}
                        {product.locations.length > 3 && (
                          <p className="text-xs text-default-500 text-center">
                            +{product.locations.length - 3} altre locazioni
                          </p>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          ) : (
            /* Table View */
            <Card className="border-0">
              <Table aria-label="Tabella ricerca globale prodotti">
                <TableHeader>
                  <TableColumn>PRODOTTO</TableColumn>
                  <TableColumn>CATEGORIA</TableColumn>
                  <TableColumn>QUANTITÀ TOTALE</TableColumn>
                  <TableColumn>LOCAZIONI</TableColumn>
                  <TableColumn>DISTRIBUZIONE</TableColumn>
                </TableHeader>
                <TableBody>
                  {searchResults.map((product) => (
                    <TableRow 
                      key={product.product_id}
                      className="cursor-pointer hover:bg-default-50"
                    >
                      <TableCell>
                        <div 
                          className="flex items-center gap-3 cursor-pointer"
                          onClick={() => {
                            setSelectedProduct(product);
                            onOpen();
                          }}
                        >
                          <Avatar
                            src={product.image}
                            className="w-12 h-12 rounded-lg"
                            showFallback
                            fallback={<Icon icon="solar:box-bold" className="text-default-400" width={16} />}
                          />
                          <div>
                            <p className="font-semibold">{product.name}</p>
                            <p className="text-sm text-default-500">SKU: {product.sku}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip size="sm" color="default" variant="flat">
                          {product.category}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <span className="text-xl font-bold text-primary">{product.total_quantity}</span>
                      </TableCell>
                      <TableCell>
                        <Chip size="sm" color="secondary" variant="flat">
                          {product.locations.length}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 max-w-48 overflow-hidden">
                          {product.locations.slice(0, 2).map((location, index) => (
                            <Chip
                              key={index}
                              startContent={
                                <Icon icon={getLocationIcon(location.location_type)} width={12} />
                              }
                              size="sm"
                              variant="flat"
                              color={location.location_type === "vehicle" ? "warning" : "default"}
                            >
                              {location.quantity}
                            </Chip>
                          ))}
                          {product.locations.length > 2 && (
                            <Chip size="sm" variant="flat" color="default">
                              +{product.locations.length - 2}
                            </Chip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
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
                // Navigate to regular product edit page
                onClose();
              }}
              startContent={<Icon icon="solar:pen-bold" width={16} />}
            >
              Modifica Prodotto
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
} 