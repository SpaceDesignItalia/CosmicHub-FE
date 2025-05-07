import { useState } from "react";
import ProductTable from "../../Components/Inventory/ProductTable";
import { Icon } from "@iconify/react";

// Tipi di dati
interface Prodotto {
  id: string;
  nome: string;
  categoria: string;
  quantita: number;
  prezzo: number;
  stato: "Disponibile" | "Esaurito" | "Bassa giacenza";
}

export default function Products() {
  // Dati di esempio
  const prodotti: Prodotto[] = [
    {
      id: "1",
      nome: "Prodotto A",
      categoria: "Elettronica",
      quantita: 150,
      prezzo: 99.99,
      stato: "Disponibile",
    },
    {
      id: "2",
      nome: "Prodotto B",
      categoria: "Abbigliamento",
      quantita: 50,
      prezzo: 29.99,
      stato: "Disponibile",
    },
    {
      id: "3",
      nome: "Prodotto C",
      categoria: "Casa",
      quantita: 5,
      prezzo: 199.5,
      stato: "Bassa giacenza",
    },
    {
      id: "4",
      nome: "Prodotto D",
      categoria: "Elettronica",
      quantita: 0,
      prezzo: 499.99,
      stato: "Esaurito",
    },
    {
      id: "5",
      nome: "Prodotto E",
      categoria: "Alimentari",
      quantita: 200,
      prezzo: 5.99,
      stato: "Disponibile",
    },
    {
      id: "6",
      nome: "Prodotto F",
      categoria: "Casa",
      quantita: 75,
      prezzo: 59.99,
      stato: "Disponibile",
    },
    {
      id: "7",
      nome: "Prodotto G",
      categoria: "Elettronica",
      quantita: 8,
      prezzo: 899.99,
      stato: "Bassa giacenza",
    },
    {
      id: "8",
      nome: "Prodotto H",
      categoria: "Abbigliamento",
      quantita: 120,
      prezzo: 19.99,
      stato: "Disponibile",
    },
  ];

  const categorie = [
    "Tutte",
    "Elettronica",
    "Abbigliamento",
    "Casa",
    "Alimentari",
  ];

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
          <h1 className="text-2xl font-bold">Inventario Prodotti</h1>
        </div>
      </div>
      <ProductTable prodotti={prodotti} categorie={categorie} />
    </div>
  );
}
