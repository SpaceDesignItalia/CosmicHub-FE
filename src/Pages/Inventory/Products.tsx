import { Icon } from "@iconify/react";
import { useState } from "react";
import ProductTable from "../../Components/Inventory/Product/ProductTable";
import { ProductThemeProvider } from "../../Components/Inventory/Product/ProductThemeWrapper";

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
  ]);

  const categories = [
    "Tutti",
    "Elettronica",
    "Abbigliamento",
    "Casa",
    "Alimentari",
  ];

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
    <div className="w-full flex-1 flex flex-col p-4 gap-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon
              icon="solar:box-bold-duotone"
              className="text-primary text-2xl"
            />
          </div>
          <h1 className="text-2xl font-bold">Product Inventory</h1>
        </div>
      </div>
      <ProductThemeProvider>
        <ProductTable
          products={products}
          categories={categories}
          onDeleteProduct={handleDeleteProduct}
        />
      </ProductThemeProvider>
    </div>
  );
}
