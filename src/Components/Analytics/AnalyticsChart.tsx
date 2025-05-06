"use client";

import React from "react";
import {
  Chip,
  Button,
  Card,
  cn,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Tab,
  Tabs,
  Spacer,
  Select,
  SelectItem,
} from "@heroui/react";
import {Icon} from "@iconify/react";
import {Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis} from "recharts";

type ChartData = {
  month: string;
  value: number;
};

type Chart = {
  key: string;
  title: string;
  value: number;
  suffix: string;
  type: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  chartData: ChartData[];
  icon: string;
};

const data: Chart[] = [
  {
    key: "valore-magazzino",
    title: "Valore Magazzino",
    suffix: "€",
    value: 87400,
    type: "number",
    change: "-3.2%",
    changeType: "neutral",
    icon: "solar:box-minimalistic-bold",
    chartData: [
      {month: "Gen", value: 95200},
      {month: "Feb", value: 92800},
      {month: "Mar", value: 94500},
      {month: "Apr", value: 91300},
      {month: "Mag", value: 89700},
      {month: "Giu", value: 88600},
      {month: "Lug", value: 90200},
      {month: "Ago", value: 89100},
      {month: "Set", value: 86500},
      {month: "Ott", value: 88200},
      {month: "Nov", value: 87400},
      {month: "Dic", value: 86100},
    ],
  },
  {
    key: "disponibilita-parti",
    title: "Disponibilità Ricambi",
    value: 93.5,
    suffix: "%",
    type: "percentage",
    change: "5.2%",
    changeType: "positive",
    icon: "solar:check-square-bold",
    chartData: [
      {month: "Gen", value: 86.5},
      {month: "Feb", value: 88.2},
      {month: "Mar", value: 89.4},
      {month: "Apr", value: 90.1},
      {month: "Mag", value: 90.8},
      {month: "Giu", value: 91.5},
      {month: "Lug", value: 92.1},
      {month: "Ago", value: 92.6},
      {month: "Set", value: 92.9},
      {month: "Ott", value: 93.2},
      {month: "Nov", value: 93.5},
      {month: "Dic", value: 94.0},
    ],
  }
];

const formatValue = (value: number, type: string | undefined) => {
  if (type === "number") {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + "M";
    } else if (value >= 1000) {
      return (value / 1000).toFixed(0) + "k";
    }

    return value.toLocaleString();
  }
  if (type === "percentage") return `${value}%`;

  return value;
};

const formatMonth = (month: string) => {
  const monthNumber =
    {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    }[month] ?? 0;

  return new Intl.DateTimeFormat("it-IT", {month: "long"}).format(new Date(2024, monthNumber, 1));
};

export default function AnalyticsChart() {
  const [activeChart, setActiveChart] = React.useState<(typeof data)[number]["key"]>(data[0].key);
  const [activeTab, setActiveTab] = React.useState("6-months");
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const activeChartData = React.useMemo(() => {
    const chart = data.find((d) => d.key === activeChart);

    return {
      chartData: chart?.chartData ?? [],
      color:
        chart?.changeType === "positive"
          ? "success"
          : chart?.changeType === "negative"
            ? "danger"
            : "default",
      suffix: chart?.suffix,
      type: chart?.type,
    };
  }, [activeChart]);

  const {chartData, color, suffix, type} = activeChartData;
  const activeChartInfo = data.find((d) => d.key === activeChart);

  return (
    <section className="flex flex-col flex-nowrap">
      <div className="flex flex-col justify-between gap-y-2 p-4 md:p-6">
        <div className="flex flex-col gap-y-2">
      
          <Tabs 
            size="sm" 
            selectedKey={activeTab} 
            onSelectionChange={(key) => setActiveTab(key as string)}
            className="overflow-x-auto"
          >
            <Tab key="6-months" title="6 Mesi" />
            <Tab key="3-months" title="3 Mesi" />
            <Tab key="30-days" title="30 Giorni" />
            <Tab key="7-days" title="7 Giorni" />
            <Tab key="24-hours" title="24 Ore" />
          </Tabs>
          
          {isMobile ? (
            <div className="mt-4 flex w-full overflow-x-auto pb-2 hide-scrollbar">
              <div className="flex gap-2">
                {data.map(({key, value, title, suffix, type, icon, changeType, change}) => (
                  <button
                    key={key}
                    className={cn(
                      "flex flex-col items-center p-3 rounded-xl min-w-[100px] border transition-all",
                      activeChart === key
                        ? "border-primary bg-primary-50 shadow-sm"
                        : "border-default-200"
                    )}
                    onClick={() => setActiveChart(key)}
                  >
                    <Icon 
                      icon={icon} 
                      width={24} 
                      className={activeChart === key ? "text-primary" : "text-default-700"} 
                    />
                    <div className="mt-2 text-center">
                      <p className={`text-xs ${activeChart === key ? "text-primary font-medium" : "text-default-700"}`}>
                        {title}
                      </p>
                      <p className="text-base font-semibold mt-1 text-foreground-900">
                        {formatValue(value, type)}
                        <span className="text-xs font-normal ml-1 text-default-700">{suffix}</span>
                      </p>
                    </div>
                    <div className="mt-1">
                      <Chip
                        classNames={{
                          content: "font-medium text-tiny",
                          base: "h-5 min-h-5 py-0",
                        }}
                        color={
                          changeType === "positive"
                            ? "success"
                            : changeType === "negative"
                              ? "danger"
                              : "default"
                        }
                        radius="sm"
                        size="sm"
                        startContent={
                          changeType === "positive" ? (
                            <Icon height={10} icon={"solar:arrow-right-up-linear"} width={10} />
                          ) : changeType === "negative" ? (
                            <Icon height={10} icon={"solar:arrow-right-down-linear"} width={10} />
                          ) : (
                            <Icon height={10} icon={"solar:arrow-right-linear"} width={10} />
                          )
                        }
                        variant="flat"
                      >
                        {change}
                      </Chip>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-2 flex w-full items-center">
              <div className="-my-3 flex w-full flex-wrap items-center gap-3 overflow-x-auto py-3">
                {data.map(({key, change, changeType, type, value, title, suffix}) => (
                  <button
                    key={key}
                    className={cn(
                      "flex min-w-[180px] max-w-[240px] flex-col gap-2 rounded-medium p-3 transition-colors",
                      {
                        "bg-default-100": activeChart === key,
                      },
                    )}
                    onClick={() => setActiveChart(key)}
                  >
                    <span
                      className={cn("text-small font-medium text-foreground-900 transition-colors", {
                        "text-primary": activeChart === key,
                      })}
                    >
                      {title}
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-xl md:text-2xl font-bold text-foreground-900">
                        {formatValue(value, type)}
                        <span className="text-xs font-normal ml-1 text-default-700">{suffix}</span>
                      </span>
                      <Chip
                        classNames={{
                          content: "font-medium",
                          base: "h-6",
                        }}
                        color={
                          changeType === "positive"
                            ? "success"
                            : changeType === "negative"
                              ? "danger"
                              : "default"
                        }
                        radius="sm"
                        size="sm"
                        startContent={
                          changeType === "positive" ? (
                            <Icon height={12} icon={"solar:arrow-right-up-linear"} width={12} />
                          ) : changeType === "negative" ? (
                            <Icon height={12} icon={"solar:arrow-right-down-linear"} width={12} />
                          ) : (
                            <Icon height={12} icon={"solar:arrow-right-linear"} width={12} />
                          )
                        }
                        variant="flat"
                      >
                        <span>{change}</span>
                      </Chip>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Aggiungiamo CSS personalizzato per nascondere la scrollbar ma mantenere la funzionalità di scroll */}
      <style jsx global>{`
        .hide-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;  /* Chrome, Safari, Opera */
        }
      `}</style>
      
      <ResponsiveContainer
        className="min-h-[260px] md:min-h-[300px] [&_.recharts-surface]:outline-none"
        height="100%"
        width="100%"
      >
        <AreaChart
          accessibilityLayer
          data={chartData}
          height={300}
          margin={{
            left: 10,
            right: 10,
            top: 10,
            bottom: 5,
          }}
          width={500}
        >
          <defs>
            <linearGradient id="colorGradient" x1="0" x2="0" y1="0" y2="1">
              <stop
                offset="10%"
                stopColor={`hsl(var(--heroui-${color}-500))`}
                stopOpacity={0.3}
              />
              <stop
                offset="100%"
                stopColor={`hsl(var(--heroui-${color}-100))`}
                stopOpacity={0.1}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            horizontalCoordinatesGenerator={() => [200, 150, 100, 50]}
            stroke="hsl(var(--heroui-default-200))"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            axisLine={false}
            dataKey="month"
            style={{fontSize: "var(--heroui-font-size-tiny)"}}
            tickLine={false}
            tick={{ fontSize: 10, fill: 'hsl(var(--heroui-default-500))' }}
            interval={isMobile ? 1 : "preserveEnd"}
          />
          <Tooltip
            content={({label, payload}) => (
              <div className="flex h-auto min-w-[100px] max-w-[180px] items-center gap-x-2 rounded-medium bg-foreground p-3 text-tiny shadow-small">
                <div className="flex w-full flex-col gap-y-1">
                  <span className="text-small font-semibold text-background">
                    {formatMonth(label)}
                  </span>
                  {payload?.map((p, index) => {
                    const name = p.name;
                    const value = p.value;

                    return (
                      <div key={`${index}-${name}`} className="flex w-full items-center justify-between gap-x-2">
                        <div className="flex w-full items-center gap-x-1 text-small text-background">
                          <span className="font-medium">{formatValue(value as number, type)}</span>
                          <span className="opacity-70">{suffix}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            cursor={{
              strokeWidth: 1,
              stroke: "hsl(var(--heroui-default-300))",
              strokeDasharray: "4 4",
            }}
          />
          <Area
            activeDot={{
              stroke: `hsl(var(--heroui-${color}))`,
              strokeWidth: 2,
              fill: "hsl(var(--heroui-background))",
              r: 5,
            }}
            animationDuration={1000}
            animationEasing="ease"
            dataKey="value"
            fill="url(#colorGradient)"
            stroke={`hsl(var(--heroui-${color}))`}
            strokeWidth={2}
            type="monotone"
          />
        </AreaChart>
      </ResponsiveContainer>
      <Dropdown
        classNames={{
          content: "min-w-[120px]",
        }}
        placement="bottom-end"
      >
        <DropdownTrigger>
          <Button
            isIconOnly
            className="absolute right-2 top-2 w-auto rounded-full"
            size="sm"
            variant="light"
          >
            <Icon height={16} icon="solar:menu-dots-bold" width={16} />
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          itemClasses={{
            title: "text-tiny",
          }}
          variant="flat"
        >
          <DropdownItem key="view-details">Visualizza Dettagli</DropdownItem>
          <DropdownItem key="export-data">Esporta Dati</DropdownItem>
          <DropdownItem key="set-alert">Imposta Alert</DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </section>
  );
} 