"use client";

import React from "react";
import { Card, Spacer, Tabs, Tab, Button } from "@heroui/react";
import AnalyticsChart from "@/Components/Analytics/AnalyticsChart";
import CircleCharts from "@/Components/Analytics/CircleCharts";
import { Icon } from "@iconify/react";

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = React.useState("panoramica");
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-4 p-3 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Dashboard Aziendale</h1>
          <p className="text-sm text-default-500">Monitora le performance dell'azienda</p>
        </div>
        
        <Button 
          isIconOnly 
          variant="flat"
          className="md:hidden"
          onPress={() => setSidebarOpen(!sidebarOpen)}
        >
          <Icon icon="solar:hamburger-menu-linear" width={24} />
        </Button>
      </div>
        
      <Spacer y={2} />
        
      <Tabs 
        selectedKey={activeTab} 
        onSelectionChange={(key) => setActiveTab(key as string)}
        className="w-full hidden md:flex"
        variant="underlined"
      >
        <Tab key="panoramica" title="Panoramica" />
        <Tab key="interventi" title="Interventi" />
        <Tab key="magazzino" title="Magazzino" />
        <Tab key="clienti" title="Clienti" />
        <Tab key="tecnici" title="Tecnici" />
      </Tabs>
      
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-background bg-opacity-90 z-50 flex items-center justify-center">
          <div className="w-full max-w-[300px] rounded-lg bg-content1 p-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Menu</h3>
              <Button 
                isIconOnly 
                variant="light" 
                size="sm"
                onPress={() => setSidebarOpen(false)}
              >
                <Icon icon="solar:close-circle-bold" width={20} />
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              {["Panoramica", "Interventi", "Magazzino", "Clienti", "Tecnici"].map((item) => (
                <Button 
                  key={item.toLowerCase()}
                  className="justify-start" 
                  variant={activeTab === item.toLowerCase() ? "flat" : "light"}
                  color={activeTab === item.toLowerCase() ? "primary" : "default"}
                  onPress={() => {
                    setActiveTab(item.toLowerCase());
                    setSidebarOpen(false);
                  }}
                >
                  {item}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <Card className="border border-transparent dark:border-default-100 overflow-hidden">
        <AnalyticsChart />
      </Card>

      <Spacer y={2} />

      <CircleCharts />
    </div>
  );
} 