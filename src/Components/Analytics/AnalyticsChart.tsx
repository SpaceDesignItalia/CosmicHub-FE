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
};

const data: Chart[] = [
  {
    key: "interventi-mensili",
    title: "Interventi Mensili",
    suffix: "interventi",
    value: 147,
    type: "number",
    change: "12.8%",
    changeType: "positive",
    chartData: [
      {month: "Gen", value: 98},
      {month: "Feb", value: 125},
      {month: "Mar", value: 89},
      {month: "Apr", value: 156},
      {month: "Mag", value: 112},
      {month: "Giu", value: 167},
      {month: "Lug", value: 138},
      {month: "Ago", value: 178},
      {month: "Set", value: 129},
      {month: "Ott", value: 159},
      {month: "Nov", value: 147},
      {month: "Dic", value: 127},
    ],
  },
  {
    key: "ricavi-mensili",
    title: "Ricavi Mensili",
    suffix: "€",
    value: 62300,
    type: "number",
    change: "15.2%",
    changeType: "positive",
    chartData: [
      {month: "Gen", value: 58700},
      {month: "Feb", value: 69800},
      {month: "Mar", value: 54200},
      {month: "Apr", value: 72800},
      {month: "Mag", value: 61500},
      {month: "Giu", value: 68900},
      {month: "Lug", value: 57300},
      {month: "Ago", value: 69500},
      {month: "Set", value: 58900},
      {month: "Ott", value: 65200},
      {month: "Nov", value: 62300},
      {month: "Dic", value: 52300},
    ],
  },
  {
    key: "clienti-attivi",
    title: "Clienti Attivi",
    suffix: "clienti",
    value: 2312,
    type: "number",
    change: "7.3%",
    changeType: "positive",
    chartData: [
      {month: "Gen", value: 2150},
      {month: "Feb", value: 2180},
      {month: "Mar", value: 2210},
      {month: "Apr", value: 2245},
      {month: "Mag", value: 2260},
      {month: "Giu", value: 2280},
      {month: "Lug", value: 2295},
      {month: "Ago", value: 2305},
      {month: "Set", value: 2270},
      {month: "Ott", value: 2290},
      {month: "Nov", value: 2312},
      {month: "Dic", value: 2330},
    ],
  },
  {
    key: "soddisfazione-clienti",
    title: "Soddisfazione Clienti",
    value: 92.5,
    suffix: "%",
    type: "percentage",
    change: "2.4%",
    changeType: "positive",
    chartData: [
      {month: "Gen", value: 88.2},
      {month: "Feb", value: 89.5},
      {month: "Mar", value: 91.2},
      {month: "Apr", value: 90.8},
      {month: "Mag", value: 91.5},
      {month: "Giu", value: 92.1},
      {month: "Lug", value: 91.8},
      {month: "Ago", value: 93.2},
      {month: "Set", value: 92.8},
      {month: "Ott", value: 93.5},
      {month: "Nov", value: 92.5},
      {month: "Dic", value: 94.2},
    ],
  },
  {
    key: "valore-magazzino",
    title: "Valore Magazzino",
    suffix: "€",
    value: 87400,
    type: "number",
    change: "-3.2%",
    changeType: "neutral",
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
    key: "rotazione-scorte",
    title: "Indice Rotazione Scorte",
    suffix: "",
    value: 4.2,
    type: "number",
    change: "8.5%",
    changeType: "positive",
    chartData: [
      {month: "Gen", value: 3.5},
      {month: "Feb", value: 3.7},
      {month: "Mar", value: 3.8},
      {month: "Apr", value: 3.9},
      {month: "Mag", value: 4.0},
      {month: "Giu", value: 4.1},
      {month: "Lug", value: 3.9},
      {month: "Ago", value: 3.8},
      {month: "Set", value: 4.0},
      {month: "Ott", value: 4.1},
      {month: "Nov", value: 4.2},
      {month: "Dic", value: 4.3},
    ],
  },
  {
    key: "tempo-risoluzione",
    title: "Tempo Medio Risoluzione",
    suffix: "ore",
    value: 3.8,
    type: "number",
    change: "-12.4%",
    changeType: "positive",
    chartData: [
      {month: "Gen", value: 4.8},
      {month: "Feb", value: 4.6},
      {month: "Mar", value: 4.5},
      {month: "Apr", value: 4.3},
      {month: "Mag", value: 4.2},
      {month: "Giu", value: 4.0},
      {month: "Lug", value: 4.1},
      {month: "Ago", value: 4.0},
      {month: "Set", value: 3.9},
      {month: "Ott", value: 3.8},
      {month: "Nov", value: 3.8},
      {month: "Dic", value: 3.7},
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
  },
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

  return (
    <section className="flex flex-col flex-nowrap">
      <div className="flex flex-col justify-between gap-y-2 p-6">
        <div className="flex flex-col gap-y-2">
          <div className="flex flex-col gap-y-0">
            <dt className="text-medium font-medium text-foreground">Analitiche</dt>
          </div>
          <Spacer y={2} />
          <Tabs size="sm" selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
            <Tab key="6-months" title="6 Mesi" />
            <Tab key="3-months" title="3 Mesi" />
            <Tab key="30-days" title="30 Giorni" />
            <Tab key="7-days" title="7 Giorni" />
            <Tab key="24-hours" title="24 Ore" />
          </Tabs>
          <div className="mt-2 flex w-full items-center">
            <div className="-my-3 flex w-full flex-wrap max-w-full items-center gap-x-3 gap-y-3 overflow-x-auto py-3">
              {data.map(({key, change, changeType, type, value, title}) => (
                <button
                  key={key}
                  className={cn(
                    "flex min-w-[180px] flex-col gap-2 rounded-medium p-3 transition-colors",
                    {
                      "bg-default-100": activeChart === key,
                    },
                  )}
                  onClick={() => setActiveChart(key)}
                >
                  <span
                    className={cn("text-small font-medium text-default-500 transition-colors", {
                      "text-primary": activeChart === key,
                    })}
                  >
                    {title}
                  </span>
                  <div className="flex items-center gap-x-3">
                    <span className="text-3xl font-bold text-foreground">
                      {formatValue(value, type)}
                    </span>
                    <Chip
                      classNames={{
                        content: "font-medium",
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
                          <Icon height={16} icon={"solar:arrow-right-up-linear"} width={16} />
                        ) : changeType === "negative" ? (
                          <Icon height={16} icon={"solar:arrow-right-down-linear"} width={16} />
                        ) : (
                          <Icon height={16} icon={"solar:arrow-right-linear"} width={16} />
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
        </div>
      </div>
      <ResponsiveContainer
        className="min-h-[300px] [&_.recharts-surface]:outline-none"
        height="100%"
        width="100%"
      >
        <AreaChart
          accessibilityLayer
          data={chartData}
          height={300}
          margin={{
            left: 0,
            right: 0,
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
            style={{fontSize: "var(--heroui-font-size-tiny)", transform: "translateX(-40px)"}}
            tickLine={false}
          />
          <Tooltip
            content={({label, payload}) => (
              <div className="flex h-auto min-w-[120px] items-center gap-x-2 rounded-medium bg-foreground p-2 text-tiny shadow-small">
                <div className="flex w-full flex-col gap-y-0">
                  {payload?.map((p, index) => {
                    const name = p.name;
                    const value = p.value;

                    return (
                      <div key={`${index}-${name}`} className="flex w-full items-center gap-x-2">
                        <div className="flex w-full items-center gap-x-1 text-small text-background">
                          <span>{formatValue(value as number, type)}</span>
                          <span>{suffix}</span>
                        </div>
                      </div>
                    );
                  })}
                  <span className="text-small font-medium text-foreground-400">
                    {formatMonth(label)} 25, 2024
                  </span>
                </div>
              </div>
            )}
            cursor={{
              strokeWidth: 0,
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