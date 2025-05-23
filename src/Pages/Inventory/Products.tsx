import { Icon } from "@iconify/react";
import { useState, useMemo, useEffect } from "react";
import ProductTable from "../../Components/Inventory/Product/ProductTable";
import { ProductThemeProvider } from "../../Components/Inventory/Product/ProductThemeWrapper";
import QuickStats from "../../Components/Inventory/Product/QuickStats";
import { Button, Card, Input, Select, SelectItem } from "@heroui/react";
import { Link } from "react-router";
import axios from "axios";

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

export default function Products() {
  // Example data
  const [products, setProducts] = useState<Product[]>([
    {
      id: "1",
      name: "Product A",
      category: "Elettronica",
      quantity: 150,
      price: 99.99,
      status: "Disponibile",
    },
    {
      id: "2",
      name: "Product B",
      category: "Abbigliamento",
      quantity: 50,
      price: 29.99,
      status: "Disponibile",
    },
    {
      id: "3",
      name: "Product C",
      category: "Casa",
      quantity: 5,
      price: 199.5,
      status: "Bassa giacenza",
    },
    {
      id: "4",
      name: "Product D",
      category: "Elettronica",
      quantity: 0,
      price: 499.99,
      status: "Esaurito",
    },
    {
      id: "5",
      name: "Product E",
      category: "Alimentari",
      quantity: 200,
      price: 5.99,
      status: "Disponibile",
    },
    {
      id: "6",
      name: "Product F",
      category: "Casa",
      quantity: 75,
      price: 59.99,
      status: "Disponibile",
    },
    {
      id: "7",
      name: "Product G",
      category: "Elettronica",
      quantity: 8,
      price: 899.99,
      status: "Bassa giacenza",
    },
    {
      id: "8",
      name: "Product H",
      category: "Abbigliamento",
      quantity: 120,
      price: 19.99,
      status: "Disponibile",
    },
    {
      id: "9",
      name: "Product I",
      category: "Elettronica",
      quantity: 100,
      price: 149.99,
      status: "Disponibile",
    },
    {
      id: "10",
      name: "Product J",
      category: "Alimentari",
      quantity: 200,
      price: 5.99,
      status: "Disponibile",
    },
    {
      id: "11",
      name: "Product K",
      category: "Elettronica",
      quantity: 100,
      price: 149.99,
      status: "Disponibile",
    },
    {
      id: "12",
      name: "Product L",
      category: "Alimentari",
      quantity: 200,
      price: 5.99,
      status: "Disponibile",
    },
  ]);

  const [categories, setCategories] = useState<string[]>([
    "Tutti",
    "Elettronica",
    "Abbigliamento",
    "Casa",
    "Alimentari",
  ]);

  useEffect(() => {
    const fetchProducts = async () => {
      const res = await axios.get("/Product/GET/GetAllProducts");
      setProducts(res.data);
    };

    const fetchCategories = async () => {
      const res = await axios.get("/Product/GET/GetAllCategories");
      setCategories(res.data);
    };

    fetchProducts();
    fetchCategories();
  }, []);

  console.log("products", products);
  console.log("categories", categories);

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
    // In un'applicazione reale, qui ci sarebbe una chiamata API
    console.log("Eliminazione prodotto con ID:", id);

    // Simuliamo una chiamata API con un ritardo
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // Aggiorniamo lo stato locale rimuovendo il prodotto
        setProducts((prevProducts) =>
          prevProducts.filter((product) => product.id !== id)
        );
        resolve();
      }, 800);
    });
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
          <h1 className="text-xl sm:text-2xl font-bold">Product Inventory</h1>
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
      <QuickStats />

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
                    Search: {searchQuery}
                    <button
                      onClick={() => setSearchQuery("")}
                      className="hover:bg-primary/20 rounded-full p-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      title="Remove search filter"
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
                      title="Remove category filter"
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
                    Status: {selectedStatus}
                    <button
                      onClick={() => setSelectedStatus("Tutti")}
                      className="hover:bg-primary/20 rounded-full p-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      title="Remove status filter"
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
        />
      </ProductThemeProvider>
    </div>
  );
}
