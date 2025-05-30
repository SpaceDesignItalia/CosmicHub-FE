import { Icon } from "@iconify/react";
import EditProduct from "../../Components/Inventory/Product/EditProduct";
import { ProductThemeProvider } from "../../Components/Inventory/Product/ProductThemeWrapper";

// Data types
interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  quantity: number;
  price: number;
  status: "Disponibile" | "Esaurito" | "Bassa giacenza";
  imageUrl: string;
  imageFile: null;
}

export default function ProductEdit() {
  // Categorie di esempio (in un'app reale verrebbero da un'API)
  const categories = [
    "Tutti",
    "Elettronica",
    "Abbigliamento",
    "Casa",
    "Alimentari",
  ];

  // Funzione per ottenere un prodotto (in un'app reale chiamerebbe un'API)
  const getProduct = async (id: string): Promise<Product> => {
    console.log("Caricamento prodotto con ID:", id);

    // Simulazione di una chiamata API
    return new Promise((resolve) => {
      setTimeout(() => {
        // Prodotto fittizio
        resolve({
          id,
          name: "Prodotto di esempio",
          category: "Elettronica",
          description:
            "Descrizione dettagliata del prodotto di esempio che stiamo modificando.",
          quantity: 10,
          price: 99.99,
          status: "Disponibile",
          imageUrl: "https://via.placeholder.com/200",
          imageFile: null,
        });
      }, 800);
    });
  };

  // Funzione per aggiornare un prodotto (in un'app reale chiamerebbe un'API)
  const handleUpdateProduct = async (id: string, product: any) => {
    console.log("Aggiornamento prodotto con ID:", id);
    console.log("Dati prodotto aggiornati:", product);

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
              icon="solar:pen-bold-duotone"
              className="text-primary text-2xl"
            />
          </div>
          <h1 className="text-2xl font-bold">Modifica Prodotto</h1>
        </div>
      </div>
      <ProductThemeProvider>
        <EditProduct />
      </ProductThemeProvider>
    </div>
  );
}
