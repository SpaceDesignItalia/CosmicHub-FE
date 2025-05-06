"use client";

import React from "react";
import { Card, Spacer, Tabs, Tab } from "@heroui/react";
import AnalyticsChart from "@/Components/Analytics/AnalyticsChart";
import CircleCharts from "@/Components/Analytics/CircleCharts";

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = React.useState("panoramica");

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">Dashboard Aziendale</h1>
        <p className="text-default-500">Monitora le performance e le metriche chiave dell'azienda</p>
        
        <Spacer y={2} />
        
        <Tabs 
          selectedKey={activeTab} 
          onSelectionChange={(key) => setActiveTab(key as string)}
          className="w-full"
        >
          <Tab key="panoramica" title="Panoramica" />
          <Tab key="interventi" title="Interventi" />
          <Tab key="magazzino" title="Magazzino" />
          <Tab key="clienti" title="Clienti" />
          <Tab key="tecnici" title="Tecnici" />
        </Tabs>
      </div>
      
      <Card className="border border-transparent dark:border-default-100 overflow-hidden">
        <AnalyticsChart />
      </Card>

      <Spacer y={2} />

      <CircleCharts />
    </div>
  );
} 