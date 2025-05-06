import React from "react";
import AnalyticsChart from "../../Components/Analytics/AnalyticsChart";
import CircleCharts from "../../Components/Analytics/CircleCharts";

export default function Analytics() {
  return (
    <div className="h-full overflow-y-auto w-full flex-1 flex flex-col p-3 md:p-6 gap-6">
      {/* Sezione introduttiva */}
      <div className="hidden md:block">
        <h1 className="text-2xl font-bold mb-1">Analitiche di Magazzino</h1>
        <p className="text-default-900 text-sm">Monitora le performance del magazzino</p>
      </div>
      
      {/* Layout a cards per dati principali */}
      <div className="grid grid-cols-2 gap-3 mb-2">
        <div className="bg-content2 rounded-lg p-3 shadow-sm">
          <div className="text-xs text-default-900 mb-1">Valore Magazzino</div>
          <div className="text-xl font-bold">€87.4K</div>
          <div className="text-xs text-default-900 mt-1">-3.2%</div>
        </div>
        <div className="bg-content2 rounded-lg p-3 shadow-sm">
          <div className="text-xs text-default-900 mb-1">Disponibilità Ricambi</div>
          <div className="text-xl font-bold">93.5%</div>
          <div className="text-xs text-success mt-1">+5.2%</div>
        </div>
      </div>
      
      {/* Grafici principali */}
      <div className="bg-content1 rounded-lg shadow-sm p-4 h-[500px]">
        <AnalyticsChart />
      </div>
      
      <div className="bg-content1 rounded-lg p-3 md:p-4">
        <CircleCharts />
      </div>
    </div>
  );
}
  