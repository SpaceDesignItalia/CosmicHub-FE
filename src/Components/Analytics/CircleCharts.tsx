"use client";

import type {ButtonProps, CardProps} from "@heroui/react";

import React from "react";
import {ResponsiveContainer, PieChart, Pie, Tooltip, Cell, Label} from "recharts";
import {
  Card,
  Button,
  Select,
  SelectItem,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  cn,
} from "@heroui/react";
import {Icon} from "@iconify/react";

type ChartData = {
  name: string;
  [key: string]: string | number;
};

type CircleChartProps = {
  title: string;
  value: string;
  changeType?: "positive" | "neutral" | "negative";
  changePercentage?: number;
  unit?: string;
  color: ButtonProps["color"];
  categories: string[];
  chartData: ChartData[];
};

const data: CircleChartProps[] = [
  {
    title: "Tipologie Interventi",
    value: "€5.420",
    unit: "media",
    changePercentage: 24.8,
    changeType: "positive",
    categories: ["Manutenzione", "Riparazione", "Installazione", "Controllo"],
    color: "default",
    chartData: [
      {name: "Manutenzione", value: 400},
      {name: "Riparazione", value: 300},
      {name: "Installazione", value: 300},
      {name: "Controllo", value: 200},
    ],
  },
  {
    title: "Stato Interventi",
    value: "€12.345",
    unit: "totale",
    changePercentage: 15.2,
    changeType: "positive",
    categories: ["Completati", "In Corso", "Programmati", "Urgenti"],
    color: "primary",
    chartData: [
      {name: "Completati", value: 450},
      {name: "In Corso", value: 300},
      {name: "Programmati", value: 250},
      {name: "Urgenti", value: 200},
    ],
  },
  {
    title: "Tipologie Impianti",
    value: "€8.790",
    unit: "valore",
    changePercentage: -5.4,
    changeType: "negative",
    categories: ["Caldaie", "Climatizzatori", "Pompe di Calore", "Altri"],
    color: "secondary",
    chartData: [
      {name: "Caldaie", value: 350},
      {name: "Climatizzatori", value: 280},
      {name: "Pompe di Calore", value: 220},
      {name: "Altri", value: 150},
    ],
  },
  {
    title: "Categorie Ricambi",
    value: "€43.750",
    unit: "valore",
    changePercentage: 8.7,
    changeType: "positive",
    categories: ["Componenti Elettrici", "Componenti Idraulici", "Ventilatori", "Altri"],
    color: "warning",
    chartData: [
      {name: "Componenti Elettrici", value: 15800},
      {name: "Componenti Idraulici", value: 12400},
      {name: "Ventilatori", value: 8700},
      {name: "Altri", value: 6850},
    ],
  },
  {
    title: "Fornitori Principali",
    value: "€67.320",
    unit: "acquisti",
    changePercentage: 12.3,
    changeType: "positive",
    categories: ["Riello", "Vaillant", "Daikin", "Altri"],
    color: "success",
    chartData: [
      {name: "Riello", value: 25800},
      {name: "Vaillant", value: 18400},
      {name: "Daikin", value: 14200},
      {name: "Altri", value: 8920},
    ],
  },
  {
    title: "Produttività Tecnici",
    value: "€16.450",
    unit: "media",
    changePercentage: 9.8,
    changeType: "positive",
    categories: ["Alto", "Medio-Alto", "Medio", "Basso"],
    color: "danger",
    chartData: [
      {name: "Alto", value: 6500},
      {name: "Medio-Alto", value: 4800},
      {name: "Medio", value: 3200},
      {name: "Basso", value: 1950},
    ],
  },
];

export default function CircleCharts() {
  return (
    <div className="flex flex-col gap-5 w-full">
      <h2 className="text-xl font-semibold text-foreground">Metriche di Magazzino e Operatività</h2>
      <dl className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((item, index) => (
          <CircleChartCard key={index} {...item} />
        ))}
      </dl>
    </div>
  );
}

const formatValue = (value: number | undefined) => {
  if (!value) return "";

  return value.toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
  });
};

const CircleChartCard = React.forwardRef<
  HTMLDivElement,
  Omit<CardProps, "children"> & CircleChartProps
>(
  (
    {
      className,
      title,
      value,
      unit,
      categories,
      changePercentage,
      color,
      chartData,
      changeType,
      ...props
    },
    ref,
  ) => {
    return (
      <Card
        ref={ref}
        className={cn("min-h-[340px] border border-transparent dark:border-default-100", className)}
        {...props}
      >
        <div className="flex flex-col gap-y-2 p-4 pb-0">
          <div className="flex items-center justify-between gap-x-2">
            <dt>
              <h3 className="text-small font-medium text-default-500">{title}</h3>
            </dt>
            <div className="flex items-center justify-end gap-x-2">
              <Select
                aria-label="Intervallo di Tempo"
                classNames={{
                  trigger: "min-w-[100px] min-h-7 h-7",
                  value: "text-tiny !text-default-500",
                  selectorIcon: "text-default-500",
                  popoverContent: "min-w-[120px]",
                }}
                defaultSelectedKeys={["per-day"]}
                listboxProps={{
                  itemClasses: {
                    title: "text-tiny",
                  },
                }}
                placeholder="Per Giorno"
                size="sm"
              >
                <SelectItem key="per-day">Per Giorno</SelectItem>
                <SelectItem key="per-week">Per Settimana</SelectItem>
                <SelectItem key="per-month">Per Mese</SelectItem>
              </Select>
              <Dropdown
                classNames={{
                  content: "min-w-[120px]",
                }}
                placement="bottom-end"
              >
                <DropdownTrigger>
                  <Button isIconOnly radius="full" size="sm" variant="light">
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
            </div>
          </div>
          <dd className="flex items-baseline gap-x-1">
            <span className="text-3xl font-semibold text-default-900">{value}</span>
            <span className="text-medium font-medium text-default-500">{unit}</span>
          </dd>
        </div>
        <ResponsiveContainer
          className="[&_.recharts-surface]:outline-none"
          height={200}
          width="100%"
        >
          <PieChart accessibilityLayer margin={{top: 0, right: 0, left: 0, bottom: 0}}>
            <Tooltip
              content={({label, payload}) => (
                <div className="flex h-auto min-w-[120px] max-w-[240px] flex-col items-start gap-y-2 rounded-medium bg-background p-2 text-tiny shadow-small">
                  <span className="font-medium text-foreground">{label}</span>
                  {payload?.map((p, index) => {
                    const name = p.name;
                    const value = p.value;
                    const category = categories.find((c) => c.toLowerCase() === name.toLowerCase()) ?? name;

                    return (
                      <div key={`${index}-${name}`} className="flex w-full items-center gap-x-2">
                        <div
                          className="h-2 w-2 flex-none rounded-full"
                          style={{
                            backgroundColor: `hsl(var(--heroui-${color}-${(index + 1) * 200}))`,
                          }}
                        />
                        <div className="flex w-full items-center justify-between gap-x-2 pr-1 text-xs text-default-700">
                          <span className="text-default-500">{category}</span>
                          <span className="font-mono font-medium text-default-700">
                            {formatValue(value as number)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              cursor={false}
            />
            <Pie
              animationDuration={1000}
              animationEasing="ease"
              cornerRadius={12}
              data={chartData}
              dataKey="value"
              innerRadius="68%"
              nameKey="name"
              paddingAngle={-20}
              strokeWidth={0}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`hsl(var(--heroui-${color}-${(index + 1) * 200}))`}
                />
              ))}
              <Label
                content={({viewBox}) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <>
                        <Icon
                          className="text-default-400 [&>path]:stroke-2"
                          height={16}
                          icon={
                            changeType === "positive"
                              ? "solar:arrow-right-up-linear"
                              : changeType === "neutral"
                                ? "solar:arrow-right-linear"
                                : "solar:arrow-right-down-linear"
                          }
                          width={16}
                          x={viewBox.cx! - 40}
                          y={
                            viewBox.cy! -
                            (changeType === "positive" ? 8 : changeType === "negative" ? 6 : 0)
                          }
                        />
                        <text
                          dominantBaseline="central"
                          textAnchor="middle"
                          x={viewBox.cx! + 10}
                          y={viewBox.cy!}
                        >
                          <tspan
                            dy={
                              changeType === "positive" ? -1.5 : changeType === "negative" ? 1.5 : 0
                            }
                            fill="hsl(var(--heroui-default-700))"
                            fontSize={20}
                            fontWeight={600}
                          >
                            {changePercentage}%
                          </tspan>
                        </text>
                      </>
                    );
                  }

                  return null;
                }}
                position="center"
              />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="flex w-full flex-wrap justify-center gap-4 px-4 pb-4 text-tiny text-default-500">
          {categories.map((category, index) => (
            <div key={index} className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: `hsl(var(--heroui-${color}-${(index + 1) * 200}))`,
                }}
              />
              <span className="capitalize">{category}</span>
            </div>
          ))}
        </div>
      </Card>
    );
  },
);

CircleChartCard.displayName = "CircleChartCard"; 