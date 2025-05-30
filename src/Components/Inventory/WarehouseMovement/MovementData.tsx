import {
  Button,
  Card,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  cn,
} from "@heroui/react";
import {Area, AreaChart, ResponsiveContainer, YAxis} from "recharts";
import {Icon} from "@iconify/react";

const data = [
  {
    title: "Movimenti in Entrata",
    value: 142,
    chartData: [
      {
        month: "January",
        value: 89,
      },
      {
        month: "February",
        value: 156,
      },
      {
        month: "March",
        value: 134,
      },
      {
        month: "April",
        value: 178,
      },
      {
        month: "May",
        value: 165,
      },
      {
        month: "June",
        value: 142,
      },
      {
        month: "July",
        value: 158,
      },
      {
        month: "August",
        value: 174,
      },
      {
        month: "September",
        value: 162,
      },
      {
        month: "October",
        value: 189,
      },
      {
        month: "November",
        value: 155,
      },
      {
        month: "December",
        value: 167,
      },
    ],
    change: "12%",
    changeType: "positive",
    xaxis: "month",
  },
  {
    title: "Movimenti in Uscita",
    value: 238,
    chartData: [
      {
        month: "January",
        value: 194,
      },
      {
        month: "February",
        value: 267,
      },
      {
        month: "March",
        value: 221,
      },
      {
        month: "April",
        value: 289,
      },
      {
        month: "May",
        value: 256,
      },
      {
        month: "June",
        value: 238,
      },
      {
        month: "July",
        value: 245,
      },
      {
        month: "August",
        value: 278,
      },
      {
        month: "September",
        value: 263,
      },
      {
        month: "October",
        value: 251,
      },
      {
        month: "November",
        value: 234,
      },
      {
        month: "December",
        value: 267,
      },
    ],
    change: "5%",
    changeType: "negative",
    xaxis: "month",
  },
  {
    title: "Trasferimenti Oggi",
    value: 8,
    chartData: [
      {
        month: "Lunedì",
        value: 12,
      },
      {
        month: "Martedì",
        value: 15,
      },
      {
        month: "Mercoledì",
        value: 9,
      },
      {
        month: "Giovedì",
        value: 18,
      },
      {
        month: "Venerdì",
        value: 14,
      },
      {
        month: "Sabato",
        value: 8,
      },
    ],
    change: "7.1%",
    changeType: "negative",
    xaxis: "day",
  },
];

/**
 * 🚨 This example requires installing the `recharts` package:
 * `npm install recharts`
 * 
 * Component for displaying warehouse movement metrics and analytics
 */
export default function MovementData() {
  return (
    <dl className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
      {data.map(({title, value, change, changeType, xaxis, chartData}, index) => (
        <Card key={index} className="border border-transparent dark:border-default-100">
          <section className="flex flex-nowrap justify-between">
            <div className="flex flex-col justify-between gap-y-2 p-4">
              <div className="flex flex-col gap-y-4">
                <dt className="text-sm font-medium text-default-600">{title}</dt>
                <dd className="text-3xl font-semibold text-default-700">{value}</dd>
              </div>
              <div
                className={cn("mt-2 flex items-center gap-x-1 text-xs font-medium", {
                  "text-success-500": changeType === "positive",
                  "text-warning-500": changeType === "neutral",
                  "text-danger-500": changeType === "negative",
                })}
              >
                {changeType === "positive" ? (
                  <Icon height={16} icon={"solar:arrow-right-up-linear"} width={16} />
                ) : changeType === "neutral" ? (
                  <Icon height={16} icon={"solar:arrow-right-linear"} width={16} />
                ) : (
                  <Icon height={16} icon={"solar:arrow-right-down-linear"} width={16} />
                )}
                <span>{change}</span>
                <span className="text-default-400 dark:text-default-500">
                  {" "}
                  vs {xaxis === "day" ? "yesterday" : "last " + xaxis}
                </span>
              </div>
            </div>
            <div className="mt-10 min-h-24 w-36 min-w-[140px] shrink-0">
              <ResponsiveContainer className="[&_.recharts-surface]:outline-none" width="100%">
                <AreaChart accessibilityLayer data={chartData}>
                  <defs>
                    <linearGradient id={"colorUv" + index} x1="0" x2="0" y1="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={cn({
                          "hsl(var(--heroui-success))": changeType === "positive",
                          "hsl(var(--heroui-danger))": changeType === "negative",
                          "hsl(var(--heroui-warning))": changeType === "neutral",
                        })}
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="60%"
                        stopColor={cn({
                          "hsl(var(--heroui-success))": changeType === "positive",
                          "hsl(var(--heroui-danger))": changeType === "negative",
                          "hsl(var(--heroui-warning))": changeType === "neutral",
                        })}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <YAxis
                    domain={[Math.min(...chartData.map((d) => d.value)), "auto"]}
                    hide={true}
                  />
                  <Area
                    dataKey="value"
                    fill={`url(#colorUv${index})`}
                    stroke={cn({
                      "hsl(var(--heroui-success))": changeType === "positive",
                      "hsl(var(--heroui-danger))": changeType === "negative",
                      "hsl(var(--heroui-warning))": changeType === "neutral",
                    })}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
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
                <DropdownItem key="view-details">View Details</DropdownItem>
                <DropdownItem key="export-data">Export Data</DropdownItem>
                <DropdownItem key="set-alert">Set Alert</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </section>
        </Card>
      ))}
    </dl>
  );
}
