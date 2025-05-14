import { Card } from "@heroui/react";
import { Icon } from "@iconify/react/dist/iconify.js";

export default function QuickStats() {
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

  const stats = [
    {
      title: "Total Products",
      value: 100,
      icon: "solar:box-bold-duotone",
      color: "blue",
      format: formatNumber,
    },
    {
      title: "Low Stock",
      value: 10,
      icon: "uil:chart-down",
      color: "yellow",
      format: formatNumber,
    },
    {
      title: "Out of Stock",
      value: 20,
      icon: "solar:close-circle-bold-duotone",
      color: "red",
      format: formatNumber,
    },
    {
      title: "Total Value",
      value: 400000,
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
