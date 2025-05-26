import { Icon } from "@iconify/react";
import { useState, useMemo, useEffect } from "react";
import ProductTable from "../../Components/Inventory/Product/ProductTable";
import { ProductThemeProvider } from "../../Components/Inventory/Product/ProductThemeWrapper";
import QuickStats from "../../Components/Inventory/Product/QuickStats";
import { Button, Card, Input, Select, SelectItem } from "@heroui/react";
import { Link } from "react-router";
import axios from "axios";

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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Ottieni le categorie prima (ne abbiamo bisogno per mappare i prodotti)
        const categoriesRes = await axios.get("/Product/GET/GetAllCategories");
        const categoriesData = categoriesRes.data as CategoryAttribute[];
        setCategoriesData(categoriesData);
        
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
        
        // Ora ottieni i prodotti
        const productsRes = await axios.get("/Product/GET/GetAllProducts");
        const rawProducts = productsRes.data;
        
        // Processa i prodotti con i dati ottenuti
        const processedProducts = rawProducts.map((product: any) => {
          // Calcola lo stato del prodotto
          const quantity = product.quantity || 0;
          const minStock = product.min_stock_treshold || 10;
          
          let status: "Disponibile" | "Esaurito" | "Bassa giacenza";
          if (quantity <= 0) {
            status = "Esaurito";
          } else if (quantity <= minStock) {
            status = "Bassa giacenza";
          } else {
            status = "Disponibile";
          }
          
          // Aggiungi la categoria in formato leggibile usando la mappa
          const categoryName = categoryMap.get(product.category_id) || "Non categorizzato";
          
          return {
            ...product,
            id: product.product_id, // Per compatibilità con componenti esistenti
            status,
            category: categoryName
          } as Product;
        });
        
        setProducts(processedProducts);
      } catch (error) {
        console.error("Errore nel caricamento dei dati:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

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

  // Funzione per eliminare un prodotto
  const handleDeleteProduct = async (id: string): Promise<void> => {
    try {
      await axios.delete(`/Product/DELETE/DeleteProduct/${id}`);
      setProducts(prevProducts => prevProducts.filter(product => (product.product_id || product.id) !== id));
    } catch (error) {
      console.error("Errore nell'eliminazione del prodotto:", error);
      throw new Error("Impossibile eliminare il prodotto");
    }
  };

  return (
    <div className="w-full flex flex-col p-2 sm:p-4 gap-4 sm:gap-6 min-h-screen h-full overflow-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon
              icon="solar:box-bold-duotone"
              className="text-primary text-xl sm:text-2xl"
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold">Inventario Prodotti</h1>
        </div>
        <Button
          variant="solid"
          color="primary"
          as={Link}
          to="/inventory/products/add"
        >
          <Icon icon="proicons:box-add" width={20} />
          Nuovo prodotto
        </Button>
      </div>

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
                    Rimuovi tutti i filtri
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
          sortBy={sortBy}
          onSort={setSortBy}
          isLoading={isLoading}
        />
      </ProductThemeProvider>
    </div>
  );
}
