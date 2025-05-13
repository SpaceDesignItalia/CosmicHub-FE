import { Icon } from "@iconify/react";
import AddProduct from "../../Components/Inventory/Product/AddProduct";
import { ProductThemeProvider } from "../../Components/Inventory/Product/ProductThemeWrapper";

export default function ProductAdd() {
  // Categorie di esempio (in un'app reale verrebbero da un'API)
  const categories = [
    "Tutti",
    "Elettronica",
    "Abbigliamento",
    "Casa",
    "Alimentari",
  ];

  // Funzione per aggiungere un prodotto (in un'app reale chiamerebbe un'API)
  const handleAddProduct = async (product: any) => {
    console.log("Prodotto da aggiungere:", product);
    // Simulazione di una chiamata API
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  };

  return (
    <div className="w-full flex-1 flex flex-col p-4 gap-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon
              icon="solar:add-square-bold-duotone"
              className="text-primary text-2xl"
            />
          </div>
          <h1 className="text-2xl font-bold">Aggiungi Prodotto</h1>
        </div>
      </div>
      <ProductThemeProvider>
        <AddProduct
          categories={categories.filter((cat) => cat !== "Tutti")}
          onAddProduct={handleAddProduct}
        />
      </ProductThemeProvider>
    </div>
  );
}
