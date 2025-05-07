import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, CardFooter, Chip, Button, Progress, Tabs, Tab } from "@heroui/react";
import { Icon } from "@iconify/react";

interface Veicolo {
  id: string;
  targa: string;
  modello: string;
  tipo: "Furgone grande" | "Furgone piccolo";
  capacita: number;
  stato: "Disponibile" | "In uso" | "In manutenzione";
  ultimaRevisione: string;
  capacitàUtilizzata?: number;
  posizione?: string;
  tempoDiViaggio?: string;
  oraStimaArrivo?: string;
  coordinate?: { lat: number; lng: number };
  puntiConsegna?: { indirizzo: string; ora: string }[];
}

interface VehicleMapProps {
  veicolo: Veicolo;
}

const VehicleMap: React.FC<VehicleMapProps> = ({ veicolo }) => {
  const [activeTab, setActiveTab] = useState("mappa");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [animationProgress, setAnimationProgress] = useState(50);
  
  // Aggiorna il tempo corrente ogni secondo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      
      // Aggiorna la posizione del veicolo sulla mappa per un effetto di movimento
      if (isOnRoute) {
        setAnimationProgress(prev => {
          // Simula movimento tra 20% e 80% del percorso
          if (prev >= 80) return 20;
          return prev + 1;
        });
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const isOnRoute = veicolo.stato === "In uso";
  const isWaiting = veicolo.stato === "In manutenzione";
  const isAvailable = veicolo.stato === "Disponibile";
  const capacityUsed = veicolo.capacitàUtilizzata || 0;
  
  // Genera percorso fittizio per demo
  const getRandomPath = () => {
    const paths = [
      "M50,150 Q100,50 150,150 T250,150 T350,150 T450,150",
      "M50,150 C150,50 250,250 450,150",
      "M50,150 Q120,20 250,150 Q380,280 450,150"
    ];
    return paths[veicolo.id.charCodeAt(0) % paths.length];
  };
  
  // Calcola la posizione corrente sul percorso (per animazione)
  const getCurrentPosition = () => {
    // Questo è un calcolo semplificato per dimostrare il concetto
    // In un'implementazione reale, si calcolerebbero le coordinate basate sul percorso SVG
    return {
      x: 50 + (400 * animationProgress / 100),
      y: 150 + Math.sin(animationProgress / 10) * 30
    };
  };
  
  // Calcola il tempo rimanente stimato
  const getRemainingTime = () => {
    if (!veicolo.tempoDiViaggio) return "N/D";
    
    // Esempio di calcolo rimanente in un formato mm:ss
    const [hours, minutes, seconds] = veicolo.tempoDiViaggio.split(":").map(Number);
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    const remainingSeconds = totalSeconds * (1 - animationProgress / 100);
    
    const rHours = Math.floor(remainingSeconds / 3600);
    const rMinutes = Math.floor((remainingSeconds % 3600) / 60);
    const rSeconds = Math.floor(remainingSeconds % 60);
    
    return `${rHours.toString().padStart(2, '0')}:${rMinutes.toString().padStart(2, '0')}:${rSeconds.toString().padStart(2, '0')}`;
  };
  
  // Formato del tempo corrente
  const formattedTime = currentTime.toLocaleTimeString('it-IT', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit' 
  });

  const position = getCurrentPosition();
  
  return (
    <Card className="h-full border-none bg-transparent">
      <CardHeader className="flex justify-between items-center px-5 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-50">{veicolo.targa} - {veicolo.modello}</h3>
            {isOnRoute && (
              <Chip
                size="sm"
                color="primary"
                variant="dot"
                classNames={{
                  base: "animate-pulse bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300"
                }}
              >
                In tempo reale
              </Chip>
            )}
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-300 flex items-center gap-1 mt-1">
            <Icon icon="mdi:map-marker" className="text-blue-600 dark:text-blue-300" />
            {veicolo.posizione || "Posizione non disponibile"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm bg-zinc-100 dark:bg-zinc-800 py-1 px-3 rounded-full text-zinc-600 dark:text-zinc-200">
            {formattedTime}
          </div>
          {isOnRoute && (
            <div className="flex flex-col items-end">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded-full">
                {capacityUsed}%
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardBody className="p-0">
        <Tabs 
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as string)}
          color="primary"
          variant="light"
          classNames={{
            base: "bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800",
            tabList: "px-5",
            tab: "py-3 text-zinc-600 dark:text-zinc-400 data-[selected=true]:text-blue-600 dark:data-[selected=true]:text-blue-300"
          }}
        >
          <Tab key="mappa" title={(
            <div className="flex items-center gap-2">
              <Icon icon="mdi:map" />
              <span>Mappa</span>
            </div>
          )}>
            <div className="p-5 bg-white dark:bg-zinc-900">
              {/* Mappa e percorso */}
              <div className="w-full bg-zinc-50 dark:bg-zinc-950 rounded-xl overflow-hidden relative mb-5 border border-zinc-200 dark:border-zinc-800">
                <div className="h-[350px] relative">
                  {/* Mappa simulata */}
                  <div className="absolute inset-0 bg-zinc-50 dark:bg-zinc-950">
                    {/* Percorsi e marker */}
                    {isOnRoute && (
                      <svg width="100%" height="100%" viewBox="0 0 500 300" className="w-full h-full">
                        {/* Sfondo mappa stilizzato */}
                        <rect x="0" y="0" width="500" height="300" fill="#fafafa" className="dark:fill-[#09090b]" />
                        
                        {/* Blocchi di edifici di sfondo */}
                        <rect x="70" y="30" width="80" height="50" fill="#f4f4f5" className="dark:fill-[#18181b]" rx="2" />
                        <rect x="170" y="40" width="60" height="30" fill="#f4f4f5" className="dark:fill-[#18181b]" rx="2" />
                        <rect x="350" y="70" width="90" height="40" fill="#f4f4f5" className="dark:fill-[#18181b]" rx="2" />
                        <rect x="100" y="200" width="70" height="60" fill="#f4f4f5" className="dark:fill-[#18181b]" rx="2" />
                        <rect x="250" y="220" width="120" height="40" fill="#f4f4f5" className="dark:fill-[#18181b]" rx="2" />
                        
                        {/* Strade di background */}
                        <path 
                          d="M20,50 H480 M20,150 H480 M20,250 H480 M100,20 V280 M250,20 V280 M350,20 V280" 
                          stroke="#e4e4e7" 
                          strokeWidth="12"
                          className="dark:stroke-[#3f3f46]"
                        />
                        <path 
                          d="M20,50 H480 M20,150 H480 M20,250 H480 M100,20 V280 M250,20 V280 M350,20 V280" 
                          stroke="#d4d4d8" 
                          strokeWidth="1"
                          strokeDasharray="6,3"
                          className="dark:stroke-[#52525b]"
                        />
                        
                        {/* Percorso del veicolo completato (statico) */}
                        <path 
                          d={getRandomPath()} 
                          fill="none" 
                          stroke="#d4d4d8" 
                          strokeWidth="5"
                          className="dark:stroke-[#52525b]"
                        />
                        
                        {/* Percorso del veicolo attivo (animato) */}
                        <path 
                          d={getRandomPath()} 
                          fill="none" 
                          stroke="#2563eb" 
                          strokeWidth="5" 
                          strokeDasharray="800"
                          strokeDashoffset={800 - (800 * animationProgress / 100)}
                          className="transition-all duration-1000 ease-linear"
                        />
                        
                        {/* Punto di partenza */}
                        <circle cx="50" cy="150" r="10" fill="#22c55e" />
                        <circle cx="50" cy="150" r="6" fill="#fff" />
                        <circle cx="50" cy="150" r="3" fill="#22c55e" />
                        
                        {/* Punti di consegna intermedi */}
                        {veicolo.puntiConsegna?.map((_, idx) => {
                          const x = 50 + (400 / (veicolo.puntiConsegna!.length + 1)) * (idx + 1);
                          return (
                            <g key={idx}>
                              <circle cx={x} cy="150" r="8" fill="#0ea5e9" />
                              <circle cx={x} cy="150" r="4" fill="#fff" />
                              <circle cx={x} cy="150" r="2" fill="#0ea5e9" />
                            </g>
                          );
                        })}
                        
                        {/* Punto di arrivo */}
                        <circle cx="450" cy="150" r="10" fill="#ef4444" />
                        <circle cx="450" cy="150" r="6" fill="#fff" />
                        <circle cx="450" cy="150" r="3" fill="#ef4444" />
                        
                        {/* Posizione attuale del veicolo */}
                        <circle cx={position.x} cy={position.y} r="15" fill="#2563eb" className="animate-ping" opacity="0.3" />
                        <circle cx={position.x} cy={position.y} r="12" fill="#2563eb" opacity="0.5" />
                        <circle cx={position.x} cy={position.y} r="8" fill="#fff" />
                        <circle cx={position.x} cy={position.y} r="4" fill="#2563eb" />
                        
                        {/* Etichetta tempo rimanente */}
                        <rect x={position.x - 30} y={position.y - 35} width="60" height="22" rx="4" fill="#2563eb" />
                        <text x={position.x} y={position.y - 20} fill="#fff" textAnchor="middle" fontSize="12">{getRemainingTime()}</text>
                      </svg>
                    )}
                    
                    {!isOnRoute && (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center bg-white/90 dark:bg-zinc-900/90 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                          {isAvailable ? (
                            <>
                              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-full inline-block mb-3">
                                <Icon icon="mdi:truck-check" className="text-5xl text-green-600 dark:text-green-300" />
                              </div>
                              <p className="text-zinc-700 dark:text-zinc-200 font-medium text-lg">
                                Veicolo disponibile nel deposito
                              </p>
                              <p className="text-sm text-zinc-500 dark:text-zinc-300 mt-1">
                                Pronto per la prossima missione
                              </p>
                            </>
                          ) : (
                            <>
                              <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-full inline-block mb-3">
                                <Icon icon="mdi:truck-wrench" className="text-5xl text-amber-600 dark:text-amber-300" />
                              </div>
                              <p className="text-zinc-700 dark:text-zinc-200 font-medium text-lg">
                                Veicolo in manutenzione
                              </p>
                              <p className="text-sm text-zinc-500 dark:text-zinc-300 mt-1">
                                Ritorno in servizio previsto a breve
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Dettagli percorso (solo se il veicolo è in viaggio) */}
              {isOnRoute && (
                <div className="mt-4 bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-md font-semibold text-zinc-800 dark:text-zinc-50 flex items-center gap-2">
                      <Icon icon="mdi:road-variant" className="text-blue-600 dark:text-blue-300" />
                      <span>Percorso Attivo</span>
                    </h4>
                    <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 py-1 px-3 rounded-full text-zinc-600 dark:text-zinc-200">
                      <Icon icon="mdi:clock-outline" className="text-zinc-500 dark:text-zinc-300" />
                      <span className="text-sm font-medium">ETA: {veicolo.oraStimaArrivo}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-0 ml-4">
                    {/* Punto di partenza */}
                    <div className="relative pl-8 pb-6">
                      <div className="absolute left-0 top-1 h-full w-0.5 bg-green-500/30"></div>
                      <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-green-50 dark:bg-green-950 flex items-center justify-center border border-green-200 dark:border-green-900">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Deposito Centrale</span>
                        <p className="text-xs text-zinc-500 dark:text-zinc-300">Partenza</p>
                      </div>
                    </div>
                    
                    {/* Punti di consegna */}
                    {veicolo.puntiConsegna?.map((punto, index) => (
                      <div key={index} className="relative pl-8 pb-6">
                        <div className="absolute left-0 top-1 h-full w-0.5 bg-blue-500/30"></div>
                        <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center border border-blue-200 dark:border-blue-900">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{punto.indirizzo}</span>
                          <p className="text-xs text-zinc-500 dark:text-zinc-300">Previsto: {punto.ora}</p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Punto di arrivo */}
                    <div className="relative pl-8">
                      <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center border border-red-200 dark:border-red-900">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{veicolo.posizione}</span>
                        <p className="text-xs text-zinc-500 dark:text-zinc-300">Destinazione finale</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Tab>
          
          <Tab key="info" title={(
            <div className="flex items-center gap-2">
              <Icon icon="mdi:information" />
              <span>Dettagli</span>
            </div>
          )}>
            <div className="p-5 bg-white dark:bg-zinc-900">
              {/* Info veicolo */}
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="col-span-2 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <p className="text-xs text-zinc-500 dark:text-zinc-300 mb-1">Tipo veicolo</p>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
                      <Icon 
                        icon={veicolo.tipo === "Furgone grande" ? "mdi:truck" : "mdi:car-estate"} 
                        className="text-blue-600 dark:text-blue-300 text-2xl"
                      />
                    </div>
                    <p className="font-medium text-lg text-zinc-800 dark:text-zinc-50">{veicolo.tipo}</p>
                  </div>
                </div>
                
                <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <p className="text-xs text-zinc-500 dark:text-zinc-300 mb-1">Targa</p>
                  <p className="font-medium text-lg text-zinc-800 dark:text-zinc-50">{veicolo.targa}</p>
                </div>
                
                <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <p className="text-xs text-zinc-500 dark:text-zinc-300 mb-1">Modello</p>
                  <p className="font-medium text-lg text-zinc-800 dark:text-zinc-50">{veicolo.modello}</p>
                </div>
                
                <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <p className="text-xs text-zinc-500 dark:text-zinc-300 mb-1">Capacità</p>
                  <p className="font-medium text-lg text-zinc-800 dark:text-zinc-50">{veicolo.capacita.toLocaleString("it-IT")} kg</p>
                </div>
                
                <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <p className="text-xs text-zinc-500 dark:text-zinc-300 mb-1">Ultima revisione</p>
                  <p className="font-medium text-zinc-800 dark:text-zinc-50">{new Date(veicolo.ultimaRevisione).toLocaleDateString("it-IT")}</p>
                </div>
                
                <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <p className="text-xs text-zinc-500 dark:text-zinc-300 mb-1">Stato</p>
                  <Chip
                    size="md"
                    classNames={{
                      base: isOnRoute 
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300" 
                        : isAvailable 
                          ? "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-300" 
                          : "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300"
                    }}
                  >
                    {isOnRoute ? "In viaggio" : veicolo.stato}
                  </Chip>
                </div>
              </div>
              
              {/* Statistiche del veicolo */}
              <div className="mb-5">
                <h4 className="text-md font-semibold mb-3 text-zinc-800 dark:text-zinc-50 flex items-center gap-2">
                  <Icon icon="mdi:chart-box" className="text-blue-600 dark:text-blue-300" />
                  <span>Statistiche</span>
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl flex flex-col items-center border border-zinc-200 dark:border-zinc-800">
                    <Icon icon="mdi:calendar-check" className="text-green-600 dark:text-green-300 text-2xl mb-1" />
                    <p className="text-xs text-zinc-500 dark:text-zinc-300">Consegne</p>
                    <p className="font-bold text-lg text-zinc-800 dark:text-zinc-50">127</p>
                  </div>
                  
                  <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl flex flex-col items-center border border-zinc-200 dark:border-zinc-800">
                    <Icon icon="mdi:map-marker-distance" className="text-blue-600 dark:text-blue-300 text-2xl mb-1" />
                    <p className="text-xs text-zinc-500 dark:text-zinc-300">Km totali</p>
                    <p className="font-bold text-lg text-zinc-800 dark:text-zinc-50">12.586</p>
                  </div>
                  
                  <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl flex flex-col items-center border border-zinc-200 dark:border-zinc-800">
                    <Icon icon="mdi:fuel" className="text-amber-600 dark:text-amber-300 text-2xl mb-1" />
                    <p className="text-xs text-zinc-500 dark:text-zinc-300">Consumo</p>
                    <p className="font-bold text-lg text-zinc-800 dark:text-zinc-50">8.2 l/100km</p>
                  </div>
                  
                  <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl flex flex-col items-center border border-zinc-200 dark:border-zinc-800">
                    <Icon icon="mdi:wrench" className="text-red-600 dark:text-red-300 text-2xl mb-1" />
                    <p className="text-xs text-zinc-500 dark:text-zinc-300">Manutenzioni</p>
                    <p className="font-bold text-lg text-zinc-800 dark:text-zinc-50">3</p>
                  </div>
                </div>
              </div>
              
              {isOnRoute && (
                <div className="mb-4">
                  <h4 className="text-md font-semibold mb-3 text-zinc-800 dark:text-zinc-50 flex items-center gap-2">
                    <Icon icon="mdi:package-variant" className="text-blue-600 dark:text-blue-300" />
                    <span>Carico corrente</span>
                  </h4>
                  
                  <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <div className="flex justify-between mb-2">
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Capacità utilizzata</p>
                      <p className="text-sm font-bold text-blue-600 dark:text-blue-300">{capacityUsed}%</p>
                    </div>
                    <Progress 
                      value={capacityUsed} 
                      color="primary" 
                      size="md" 
                      showValueLabel={false}
                      classNames={{
                        base: "bg-zinc-200 dark:bg-zinc-800",
                        indicator: "bg-blue-600 dark:bg-blue-400"
                      }}
                    />
                    <div className="flex justify-between mt-3 text-xs text-zinc-500 dark:text-zinc-300">
                      <span>0 kg</span>
                      <span>{veicolo.capacita.toLocaleString("it-IT")} kg</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Tab>
        </Tabs>
      </CardBody>
      
      <CardFooter className="flex justify-between items-center border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-3 px-5">
        <div className="flex items-center gap-2">
          <Icon icon="mdi:clock-time-four" className="text-zinc-500 dark:text-zinc-300" />
          <span className="text-sm text-zinc-500 dark:text-zinc-300">
            Ultima attività: {new Date().toLocaleDateString("it-IT")} {formattedTime}
          </span>
        </div>
        <div>
          <Button 
            size="sm"
            className="bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
          >
            Storico
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default VehicleMap; 