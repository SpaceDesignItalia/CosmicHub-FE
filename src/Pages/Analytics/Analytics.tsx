import React from "react";
import AnalyticsChart from "../../Components/Analytics/AnalyticsChart";
import CircleCharts from "../../Components/Analytics/CircleCharts";

export default function Analytics() {
  return (
    <div className="w-full flex-1 flex flex-col p-3 md:p-6 gap-6">
      {/* Sezione introduttiva */}
      <div className="hidden md:block">
        <h1 className="text-2xl font-bold mb-1">Analytics</h1>
        <p className="text-default-500 text-sm">Monitora le performance dell'azienda</p>
      </div>
      
      {/* Layout a cards per dati principali */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
        <div className="bg-content2 rounded-lg p-3 shadow-sm">
          <div className="text-xs text-default-500 mb-1">Interventi Mensili</div>
          <div className="text-xl font-bold">147</div>
          <div className="text-xs text-success mt-1">+12.8%</div>
        </div>
        <div className="bg-content2 rounded-lg p-3 shadow-sm">
          <div className="text-xs text-default-500 mb-1">Ricavi</div>
          <div className="text-xl font-bold">€62.3K</div>
          <div className="text-xs text-success mt-1">+15.2%</div>
        </div>
        <div className="bg-content2 rounded-lg p-3 shadow-sm">
          <div className="text-xs text-default-500 mb-1">Clienti Attivi</div>
          <div className="text-xl font-bold">2,312</div>
          <div className="text-xs text-success mt-1">+7.3%</div>
        </div>
        <div className="bg-content2 rounded-lg p-3 shadow-sm">
          <div className="text-xs text-default-500 mb-1">Tempo Risoluzione</div>
          <div className="text-xl font-bold">3.8h</div>
          <div className="text-xs text-success mt-1">-12.4%</div>
        </div>
      </div>
      
      {/* Grafici principali */}
      <div className="bg-content1 rounded-lg shadow-sm overflow-hidden">
        <AnalyticsChart />
      </div>
      
      <div className="bg-content1 rounded-lg p-3 md:p-4">
        <h2 className="text-lg font-semibold mb-4">Metriche Dettagliate</h2>
        <CircleCharts />
      </div>
    </div>
  );
}
  