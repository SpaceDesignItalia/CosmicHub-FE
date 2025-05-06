"use client";

import React from "react";
import { Card, Spacer, Tabs, Tab } from "@heroui/react";
import AnalyticsChart from "@/Components/Analytics/AnalyticsChart";
import CircleCharts from "@/Components/Analytics/CircleCharts";
import MobileNavBar from "@/Components/Layout/MobileNavBar";

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = React.useState("panoramica");
  
  return (
    <div className="flex flex-col gap-4 p-3 pb-16 md:p-6 md:pb-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Dashboard Aziendale</h1>
          <p className="text-sm text-default-500">Monitora le performance dell'azienda</p>
        </div>
      </div>
        
      <Spacer y={2} />
        
      <Tabs 
        selectedKey={activeTab} 
        onSelectionChange={(key) => setActiveTab(key as string)}
        className="w-full"
        variant="underlined"
      >
        <Tab key="panoramica" title="Panoramica" />
        <Tab key="interventi" title="Interventi" />
        <Tab key="magazzino" title="Magazzino" />
        <Tab key="clienti" title="Clienti" />
        <Tab key="tecnici" title="Tecnici" />
      </Tabs>
      
      <Card className="border border-transparent dark:border-default-100 overflow-hidden">
        <AnalyticsChart />
      </Card>

      <Spacer y={2} />

      <CircleCharts />
      
      {/* Barra di navigazione mobile */}
      <MobileNavBar />
    </div>
  );
} 