import { Card } from "@heroui/react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useMemo } from "react";

interface Product {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
  min_stock_treshold: number;
  status: string;
}

interface QuickStatsProps {
  products: Product[];
}

export default function QuickStats({ products }: QuickStatsProps) {
  // Function to format currency numbers
  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
      notation: num >= 1000000 ? "compact" : "standard",
      maximumFractionDigits: 1,
    }).format(num);
  };

  // Function to format regular numbers
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("it-IT", {
      notation: num >= 1000000 ? "compact" : "standard",
      maximumFractionDigits: 1,
    }).format(num);
  };

  // Calcola le statistiche basate sui prodotti effettivi
  const statsData = useMemo(() => {
    // Totale prodotti
    const totalProducts = products.length;
    
    // Prodotti con bassa giacenza
    const lowStockProducts = products.filter(
      (product) => product.status === "Bassa giacenza"
    ).length;
    
    // Prodotti esauriti
    const outOfStockProducts = products.filter(
      (product) => product.status === "Esaurito"
    ).length;
    
    // Valore totale dell'inventario
    const totalValue = products.reduce((total, product) => {
      return total + (product.price || 0) * (product.quantity || 0);
    }, 0);
    
    return {
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalValue,
    };
  }, [products]);

  const stats = [
    {
      title: "Prodotti Totali",
      value: statsData.totalProducts,
      icon: "solar:box-bold-duotone",
      color: "blue",
      format: formatNumber,
    },
    {
      title: "Bassa Giacenza",
      value: statsData.lowStockProducts,
      icon: "uil:chart-down",
      color: "yellow",
      format: formatNumber,
    },
    {
      title: "Esauriti",
      value: statsData.outOfStockProducts,
      icon: "solar:close-circle-bold-duotone",
      color: "red",
      format: formatNumber,
    },
    {
      title: "Valore Totale",
      value: statsData.totalValue,
      icon: "solar:dollar-bold-duotone",
      color: "green",
      format: formatCurrency,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="transition-all duration-300">
          <div className="flex items-center gap-4 p-4">
            <div
              className={`w-12 h-12 rounded-xl bg-${stat.color}-100 flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}
            >
              <Icon
                icon={stat.icon}
                className={`text-${stat.color}-600 text-2xl`}
              />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
              <p className="text-xl font-semibold tracking-tight">
                {stat.format(stat.value)}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
