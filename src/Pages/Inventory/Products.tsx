import { Icon } from "@iconify/react";
import { useState, useMemo, useEffect } from "react";
import ProductTable from "../../Components/Inventory/Product/ProductTable";
import { ProductThemeProvider } from "../../Components/Inventory/Product/ProductThemeWrapper";
import QuickStats from "../../Components/Inventory/Product/QuickStats";
import { Button, Card, Input, Select, SelectItem } from "@heroui/react";
import { Link } from "react-router";
import axios from "axios";
import PageHeader from "../../Components/Layout/PageHeader";

// Data types
interface Attribute {
  name: string;
  data_type: string;
  value: string;
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
  warehouse_name?: string; // Nome del magazzino per visualizzazione
  image?: string;
}

interface CategoryAttribute {
  name: string;
  type: string;
  category_name: string;
  attribute_id: string | null;
  category_id: string;
  isRequired: boolean;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesData, setCategoriesData] = useState<CategoryAttribute[]>([]);
  const [categories, setCategories] = useState<string[]>(["Tutti"]);
  const [isLoading, setIsLoading] = useState(true);

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
    id?: string | number; // Aggiungo l'ID numerico del magazzino
  } | null>(null);

  // Funzione per recuperare i dettagli del magazzino
  const fetchWarehouseDetails = async (warehouseId: string) => {
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
    }
  };

  // Effetto per caricare i dettagli del magazzino quando cambia
  useEffect(() => {
    if (selectedWarehouse) {
      fetchWarehouseDetails(selectedWarehouse);
    } else {
      setWarehouseDetails(null);
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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Ottieni le categorie prima (ne abbiamo bisogno per mappare i prodotti)
        const categoriesRes = await axios.get("/Product/GET/GetAllCategories");
        setCategoriesData(categoriesRes.data);

        // Estrai i nomi unici delle categorie
        const uniqueCategories = ["Tutti"];
        const categoryMap = new Map<string, string>();

        categoriesData.forEach((cat) => {
          if (!uniqueCategories.includes(cat.category_name)) {
            uniqueCategories.push(cat.category_name);
          }
          categoryMap.set(cat.category_id, cat.category_name);
        });

        setCategories(uniqueCategories);

        // Ora ottieni i prodotti filtrati per magazzino
        let productsRes;
        if (selectedWarehouse && warehouseDetails?.id) {
          // Se c'è un magazzino selezionato e abbiamo l'ID numerico, usa l'endpoint specifico per magazzino
          productsRes = await axios.get("/Product/GET/GetProductsByWarehouse", {
            params: {
              warehouse_id: warehouseDetails.id,
            },
          });
        } else if (selectedWarehouse) {
          // Se abbiamo solo l'UUID ma non ancora l'ID numerico, aspetta che warehouseDetails sia caricato
          return; // Esce dalla funzione, verrà richiamata quando warehouseDetails sarà disponibile
        } else {
          // Se non c'è un magazzino selezionato, carica tutti i prodotti
          productsRes = await axios.get("/Product/GET/GetAllProducts");
        }

        const rawProducts = productsRes.data;

        // Trasforma i dati dal formato db al formato UI
        const formattedProducts = rawProducts.map((product: any) => {
          // Calcola lo stato del prodotto
          // Usa stock_unit come quantità dal database
          const quantity = parseInt(product.stock_unit) || 0;
          const minStock = parseInt(product.min_stock_treshold) || 10;

          let status: "Disponibile" | "Esaurito" | "Bassa giacenza";
          if (quantity <= 0) {
            status = "Esaurito";
          } else if (quantity <= minStock) {
            status = "Bassa giacenza";
          } else {
            status = "Disponibile";
          }

          // Aggiungi la categoria in formato leggibile usando la mappa
          const categoryName =
            categoryMap.get(product.category_id) || "Non categorizzato";

          return {
            ...product,
            id: product.product_id, // Per compatibilità con componenti esistenti
            quantity: quantity, // Usa stock_unit come quantità
            status,
            category: categoryName,
            warehouse_name:
              warehouseDetails?.name ||
              selectedWarehouse ||
              "Magazzino Principale", // Aggiungi il nome del magazzino
          } as Product;
        });

        setProducts(formattedProducts);
      } catch (error) {
        console.error("Errore nel caricamento dei dati:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedWarehouse, warehouseDetails]); // Aggiungo warehouseDetails come dipendenza

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tutti");
  const [selectedStatus, setSelectedStatus] = useState("Tutti");
  const [sortBy, setSortBy] = useState<{
    field: keyof Product;
    direction: "asc" | "desc";
  }>({
    field: "name",
    direction: "asc",
  });

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesSearch = product.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const matchesCategory =
          selectedCategory === "Tutti" || selectedCategory === product.category;
        const matchesStatus =
          selectedStatus === "Tutti" || product.status === selectedStatus;
        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        const aValue = a[sortBy.field];
        const bValue = b[sortBy.field];
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortBy.direction === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        return sortBy.direction === "asc"
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      });
  }, [products, searchQuery, selectedCategory, selectedStatus, sortBy]);

  // Funzione per aggiornare la quantità di un prodotto
  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    setProducts((prevProducts) =>
      prevProducts.map((product) => {
        if ((product.product_id || product.id) === productId) {
          // Calcola il nuovo stato basato sulla nuova quantità
          const minStock = product.min_stock_treshold || 10;
          let newStatus: "Disponibile" | "Esaurito" | "Bassa giacenza";

          if (newQuantity <= 0) {
            newStatus = "Esaurito";
          } else if (newQuantity <= minStock) {
            newStatus = "Bassa giacenza";
          } else {
            newStatus = "Disponibile";
          }

          return {
            ...product,
            quantity: newQuantity,
            status: newStatus,
          };
        }
        return product;
      })
    );
  };

  // Funzione per eliminare un prodotto
  const handleDeleteProduct = async (id: string): Promise<void> => {
    try {
      await axios.delete(`/Product/DELETE/DeleteProduct/${id}`);
      setProducts((prevProducts) =>
        prevProducts.filter(
          (product) => (product.product_id || product.id) !== id
        )
      );
    } catch (error) {
      console.error("Errore nell'eliminazione del prodotto:", error);
      throw new Error("Impossibile eliminare il prodotto");
    }
  };

  return (
    <div className="w-full flex flex-col p-2 sm:p-4 gap-4 sm:gap-6 min-h-screen h-full overflow-auto">
      <PageHeader
        title="Inventario Prodotti"
        description="Gestisci i prodotti del tuo inventario"
        icon="solar:box-bold-duotone"
        size="md"
        indicators={
          selectedWarehouse && warehouseDetails
            ? [
                {
                  label: "Magazzino",
                  value: `${warehouseDetails.name}${warehouseDetails.code ? ` (${warehouseDetails.code})` : ""}`,
                  icon: "solar:warehouse-bold",
                  color: "primary",
                },
              ]
            : !selectedWarehouse
            ? [
                {
                  label: "Attenzione",
                  value: "Nessun magazzino selezionato - Mostrando tutti i prodotti",
                  icon: "solar:info-circle-bold",
                  color: "warning",
                },
              ]
            : []
        }
        actions={[
          {
            label: "Nuovo prodotto",
            icon: "proicons:box-add",
            color: "primary",
            variant: "solid",
            as: Link,
            href: "/inventory/products/add",
          },
        ]}
      />

      {/* Quick Stats Section */}
      <QuickStats products={products} />

      {/* Search and Filters */}
      <Card className="min-h-min p-4 transition-all duration-300 ease-in-out">
        <div className="flex flex-col gap-4">
          {/* Search Bar with enhanced design */}
          <div className="w-full relative group">
            <Input
              color="primary"
              type="text"
              placeholder="Cerca prodotti per nome..."
              value={searchQuery}
              startContent={
                <Icon
                  icon="line-md:search"
                  className="text-default-400 text-lg pointer-events-none flex-shrink-0 group-hover:text-primary transition-colors"
                />
              }
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="bordered"
              radius="lg"
              className="transition-all duration-200 hover:border-primary/50"
            />
          </div>

          {/* Enhanced Filters with better mobile layout */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 group">
              <Select
                variant="bordered"
                selectedKeys={[selectedCategory]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setSelectedCategory(selected || "Tutti");
                }}
                placeholder="Seleziona categoria"
                startContent={
                  <Icon
                    icon="tabler:tag"
                    className="text-gray-500 text-xl group-hover:text-primary transition-colors"
                  />
                }
                color="primary"
                defaultSelectedKeys={["Tutti"]}
              >
                {categories.map((category) => (
                  <SelectItem key={category}>{category}</SelectItem>
                ))}
              </Select>
            </div>

            <div className="relative flex-1 group">
              <Select
                variant="bordered"
                selectedKeys={[selectedStatus]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setSelectedStatus(selected);
                }}
                placeholder="Seleziona stato"
                startContent={
                  <Icon
                    icon="lucide:chart-line"
                    className="text-gray-500 text-xl group-hover:text-primary transition-colors"
                  />
                }
                color="primary"
              >
                <SelectItem key="Tutti">Tutti gli stati</SelectItem>
                <SelectItem key="Disponibile">Disponibile</SelectItem>
                <SelectItem key="Bassa giacenza">Bassa giacenza</SelectItem>
                <SelectItem key="Esaurito">Esaurito</SelectItem>
              </Select>
            </div>
          </div>

          {/* Active Filters with animations */}
          <div
            className={`grid transition-all duration-300 ease-in-out ${
              searchQuery ||
              selectedCategory !== "Tutti" ||
              selectedStatus !== "Tutti"
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <div className="flex flex-wrap gap-2 py-2">
                {searchQuery && (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium shadow-sm hover:shadow transition-all duration-200">
                    Ricerca: {searchQuery}
                    <button
                      onClick={() => setSearchQuery("")}
                      className="hover:bg-primary/20 rounded-full p-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      title="Rimuovi filtro ricerca"
                    >
                      <Icon
                        icon="solar:close-circle-bold-duotone"
                        className="text-primary text-lg"
                      />
                    </button>
                  </span>
                )}
                {selectedCategory !== "Tutti" && (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium shadow-sm hover:shadow transition-all duration-200">
                    Categoria: {selectedCategory}
                    <button
                      onClick={() => setSelectedCategory("Tutti")}
                      className="hover:bg-primary/20 rounded-full p-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      title="Rimuovi filtro categoria"
                    >
                      <Icon
                        icon="solar:close-circle-bold-duotone"
                        className="text-primary text-lg"
                      />
                    </button>
                  </span>
                )}
                {selectedStatus !== "Tutti" && (
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium shadow-sm hover:shadow transition-all duration-200">
                    Stato: {selectedStatus}
                    <button
                      onClick={() => setSelectedStatus("Tutti")}
                      className="hover:bg-primary/20 rounded-full p-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      title="Rimuovi filtro stato"
                    >
                      <Icon
                        icon="solar:close-circle-bold-duotone"
                        className="text-primary text-lg"
                      />
                    </button>
                  </span>
                )}
                {(searchQuery ||
                  selectedCategory !== "Tutti" ||
                  selectedStatus !== "Tutti") && (
                  <Button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("Tutti");
                      setSelectedStatus("Tutti");
                    }}
                    color="primary"
                    variant="light"
                  >
                    Rimuovi filtri ricerca
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <ProductThemeProvider>
        <ProductTable
          products={filteredProducts}
          categories={categories}
          onDeleteProduct={handleDeleteProduct}
          onUpdateQuantity={handleUpdateQuantity}
          sortBy={sortBy}
          onSort={setSortBy}
          isLoading={isLoading}
        />
      </ProductThemeProvider>
    </div>
  );
}
