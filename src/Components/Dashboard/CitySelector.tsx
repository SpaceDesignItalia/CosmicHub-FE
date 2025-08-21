"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Card,
  CardBody,
  Spinner,
  Chip,
  Avatar,
} from "@heroui/react";
import { Icon } from "@iconify/react";

interface City {
  id: string;
  name: string;
  country: string;
  region?: string;
  lat: number;
  lon: number;
  flag?: string;
}

interface CitySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onCitySelect: (city: City) => void;
  currentCity?: string;
}

// Lista delle città italiane più popolari
const ITALIAN_CITIES: City[] = [
  { id: "roma", name: "Roma", country: "Italia", region: "Lazio", lat: 41.9028, lon: 12.4964, flag: "🇮🇹" },
  { id: "milano", name: "Milano", country: "Italia", region: "Lombardia", lat: 45.4642, lon: 9.1900, flag: "🇮🇹" },
  { id: "napoli", name: "Napoli", country: "Italia", region: "Campania", lat: 40.8518, lon: 14.2681, flag: "🇮🇹" },
  { id: "torino", name: "Torino", country: "Italia", region: "Piemonte", lat: 45.0703, lon: 7.6869, flag: "🇮🇹" },
  { id: "palermo", name: "Palermo", country: "Italia", region: "Sicilia", lat: 38.1157, lon: 13.3613, flag: "🇮🇹" },
  { id: "genova", name: "Genova", country: "Italia", region: "Liguria", lat: 44.4056, lon: 8.9463, flag: "🇮🇹" },
  { id: "bologna", name: "Bologna", country: "Italia", region: "Emilia-Romagna", lat: 44.4949, lon: 11.3426, flag: "🇮🇹" },
  { id: "firenze", name: "Firenze", country: "Italia", region: "Toscana", lat: 43.7696, lon: 11.2558, flag: "🇮🇹" },
  { id: "bari", name: "Bari", country: "Italia", region: "Puglia", lat: 41.1171, lon: 16.8719, flag: "🇮🇹" },
  { id: "catania", name: "Catania", country: "Italia", region: "Sicilia", lat: 37.5079, lon: 15.0830, flag: "🇮🇹" },
  { id: "venezia", name: "Venezia", country: "Italia", region: "Veneto", lat: 45.4408, lon: 12.3155, flag: "🇮🇹" },
  { id: "verona", name: "Verona", country: "Italia", region: "Veneto", lat: 45.4384, lon: 10.9916, flag: "🇮🇹" },
  { id: "messina", name: "Messina", country: "Italia", region: "Sicilia", lat: 38.1938, lon: 15.5540, flag: "🇮🇹" },
  { id: "padova", name: "Padova", country: "Italia", region: "Veneto", lat: 45.4064, lon: 11.8768, flag: "🇮🇹" },
  { id: "trieste", name: "Trieste", country: "Italia", region: "Friuli-Venezia Giulia", lat: 45.6495, lon: 13.7768, flag: "🇮🇹" },
  { id: "brescia", name: "Brescia", country: "Italia", region: "Lombardia", lat: 45.5416, lon: 10.2118, flag: "🇮🇹" },
  { id: "parma", name: "Parma", country: "Italia", region: "Emilia-Romagna", lat: 44.8015, lon: 10.3279, flag: "🇮🇹" },
  { id: "taranto", name: "Taranto", country: "Italia", region: "Puglia", lat: 40.4668, lon: 17.2725, flag: "🇮🇹" },
  { id: "prato", name: "Prato", country: "Italia", region: "Toscana", lat: 43.8777, lon: 11.1022, flag: "🇮🇹" },
  { id: "modena", name: "Modena", country: "Italia", region: "Emilia-Romagna", lat: 44.6471, lon: 10.9252, flag: "🇮🇹" },
  { id: "reggio-calabria", name: "Reggio Calabria", country: "Italia", region: "Calabria", lat: 38.1113, lon: 15.6619, flag: "🇮🇹" },
  { id: "reggio-emilia", name: "Reggio Emilia", country: "Italia", region: "Emilia-Romagna", lat: 44.6989, lon: 10.6346, flag: "🇮🇹" },
  { id: "perugia", name: "Perugia", country: "Italia", region: "Umbria", lat: 43.1122, lon: 12.3888, flag: "🇮🇹" },
  { id: "livorno", name: "Livorno", country: "Italia", region: "Toscana", lat: 43.5485, lon: 10.3106, flag: "🇮🇹" },
  { id: "cagliari", name: "Cagliari", country: "Italia", region: "Sardegna", lat: 39.2238, lon: 9.1217, flag: "🇮🇹" },
  { id: "foggia", name: "Foggia", country: "Italia", region: "Puglia", lat: 41.4621, lon: 15.5444, flag: "🇮🇹" },
  { id: "rimini", name: "Rimini", country: "Italia", region: "Emilia-Romagna", lat: 44.0678, lon: 12.5695, flag: "🇮🇹" },
  { id: "salerno", name: "Salerno", country: "Italia", region: "Campania", lat: 40.6824, lon: 14.7681, flag: "🇮🇹" },
  { id: "ferrara", name: "Ferrara", country: "Italia", region: "Emilia-Romagna", lat: 44.8379, lon: 11.6203, flag: "🇮🇹" },
  { id: "sassari", name: "Sassari", country: "Italia", region: "Sardegna", lat: 40.7259, lon: 8.5590, flag: "🇮🇹" },
];

// Città internazionali popolari
const INTERNATIONAL_CITIES: City[] = [
  { id: "london", name: "Londra", country: "Regno Unito", lat: 51.5074, lon: -0.1278, flag: "🇬🇧" },
  { id: "paris", name: "Parigi", country: "Francia", lat: 48.8566, lon: 2.3522, flag: "🇫🇷" },
  { id: "berlin", name: "Berlino", country: "Germania", lat: 52.5200, lon: 13.4050, flag: "🇩🇪" },
  { id: "madrid", name: "Madrid", country: "Spagna", lat: 40.4168, lon: -3.7038, flag: "🇪🇸" },
  { id: "barcelona", name: "Barcellona", country: "Spagna", lat: 41.3851, lon: 2.1734, flag: "🇪🇸" },
  { id: "amsterdam", name: "Amsterdam", country: "Paesi Bassi", lat: 52.3676, lon: 4.9041, flag: "🇳🇱" },
  { id: "vienna", name: "Vienna", country: "Austria", lat: 48.2082, lon: 16.3738, flag: "🇦🇹" },
  { id: "zurich", name: "Zurigo", country: "Svizzera", lat: 47.3769, lon: 8.5417, flag: "🇨🇭" },
  { id: "newyork", name: "New York", country: "Stati Uniti", lat: 40.7128, lon: -74.0060, flag: "🇺🇸" },
  { id: "tokyo", name: "Tokyo", country: "Giappone", lat: 35.6762, lon: 139.6503, flag: "🇯🇵" },
];

export default function CitySelector({ isOpen, onClose, onCitySelect, currentCity }: CitySelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<City[]>([]);
  const [selectedTab, setSelectedTab] = useState<"popular" | "international" | "search">("popular");

  // Simula la ricerca di città (in un'app reale useremmo un'API come OpenWeatherMap Geocoding)
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      // Simula risultati di ricerca combinando città italiane e internazionali
      const allCities = [...ITALIAN_CITIES, ...INTERNATIONAL_CITIES];
      const results = allCities.filter(city =>
        city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        city.country.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results.slice(0, 8)); // Limita a 8 risultati
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCitySelect = (city: City) => {
    onCitySelect(city);
    onClose();
  };

  const getCityWeatherIcon = (cityName: string) => {
    // Associa icone diverse per città diverse (simulato)
    const icons = [
      "solar:sun-2-bold-duotone",
      "solar:cloud-sun-bold-duotone",
      "solar:cloudy-bold-duotone",
      "solar:cloud-rain-bold-duotone"
    ];
    return icons[cityName.length % icons.length];
  };

  const renderCityCard = (city: City, showWeather = false) => (
    <Card
      key={city.id}
      isPressable
      onPress={() => handleCitySelect(city)}
      className={`transition-all hover:shadow-lg ${
        currentCity === city.name ? 'ring-2 ring-primary bg-primary-50 dark:bg-primary-900/20' : ''
      }`}
    >
      <CardBody className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{city.flag}</span>
            {showWeather && (
              <div className="p-1 bg-warning-100 dark:bg-warning-900/30 rounded-lg">
                <Icon icon={getCityWeatherIcon(city.name)} className="text-warning text-lg" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm">{city.name}</h4>
              {currentCity === city.name && (
                <Chip size="sm" color="primary" variant="flat">
                  Attuale
                </Chip>
              )}
            </div>
            <p className="text-xs text-default-600">
              {city.region ? `${city.region}, ` : ''}{city.country}
            </p>
            {showWeather && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-default-500">
                  {Math.floor(Math.random() * 15 + 10)}°C
                </span>
                <span className="text-xs text-default-400">•</span>
                <span className="text-xs text-default-500">
                  {['Soleggiato', 'Nuvoloso', 'Pioggia leggera'][Math.floor(Math.random() * 3)]}
                </span>
              </div>
            )}
          </div>

          <Icon icon="solar:arrow-right-bold" className="text-default-400" width={16} />
        </div>
      </CardBody>
    </Card>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
              <Icon icon="solar:map-point-bold-duotone" className="text-primary text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Seleziona Città</h3>
              <p className="text-sm text-default-600">Scegli la città per le previsioni meteo</p>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="space-y-4">
          {/* Barra di ricerca */}
          <div className="relative">
            <Input
              placeholder="Cerca una città..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<Icon icon="solar:magnifer-bold-duotone" className="text-default-400" width={20} />}
              endContent={
                isSearching && (
                  <Spinner size="sm" />
                )
              }
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={selectedTab === "popular" ? "solid" : "light"}
              color="primary"
              onPress={() => setSelectedTab("popular")}
            >
              <Icon icon="solar:star-bold-duotone" width={16} />
              Popolari
            </Button>
            <Button
              size="sm"
              variant={selectedTab === "international" ? "solid" : "light"}
              color="secondary"
              onPress={() => setSelectedTab("international")}
            >
              <Icon icon="solar:global-bold-duotone" width={16} />
              Internazionali
            </Button>
            {searchQuery.length >= 2 && (
              <Button
                size="sm"
                variant={selectedTab === "search" ? "solid" : "light"}
                color="success"
                onPress={() => setSelectedTab("search")}
              >
                <Icon icon="solar:magnifer-bold-duotone" width={16} />
                Risultati ({searchResults.length})
              </Button>
            )}
          </div>

          {/* Contenuto */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {selectedTab === "popular" && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-default-700 flex items-center gap-2">
                  <Icon icon="solar:flag-bold-duotone" width={16} />
                  Città Italiane
                </h4>
                {ITALIAN_CITIES.map(city => renderCityCard(city, true))}
              </div>
            )}

            {selectedTab === "international" && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-default-700 flex items-center gap-2">
                  <Icon icon="solar:global-bold-duotone" width={16} />
                  Città Internazionali
                </h4>
                {INTERNATIONAL_CITIES.map(city => renderCityCard(city, true))}
              </div>
            )}

            {selectedTab === "search" && (
              <div className="space-y-2">
                {isSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Spinner size="lg" />
                      <p className="text-sm text-default-600 mt-2">Ricerca in corso...</p>
                    </div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    <h4 className="text-sm font-medium text-default-700 flex items-center gap-2">
                      <Icon icon="solar:magnifer-bold-duotone" width={16} />
                      Risultati per "{searchQuery}"
                    </h4>
                    {searchResults.map(city => renderCityCard(city))}
                  </>
                ) : searchQuery.length >= 2 ? (
                  <div className="text-center py-8">
                    <Icon icon="solar:map-point-bold-duotone" className="text-default-400 text-4xl mb-2" />
                    <p className="text-sm text-default-600">Nessuna città trovata per "{searchQuery}"</p>
                    <p className="text-xs text-default-500 mt-1">Prova con un nome diverso</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Info attuale */}
          {currentCity && (
            <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
              <div className="flex items-center gap-2">
                <Icon icon="solar:info-circle-bold-duotone" className="text-primary" width={16} />
                <span className="text-sm text-primary-700 dark:text-primary-300">
                  Città attuale: <strong>{currentCity}</strong>
                </span>
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Annulla
          </Button>
          <Button
            color="primary"
            onPress={() => {
              // Usa posizione GPS attuale
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const gpsCity: City = {
                      id: "gps",
                      name: "Posizione GPS",
                      country: "Rilevata automaticamente",
                      lat: position.coords.latitude,
                      lon: position.coords.longitude,
                      flag: "📍"
                    };
                    handleCitySelect(gpsCity);
                  },
                  (error) => {
                    console.error("Errore GPS:", error);
                  }
                );
              }
            }}
            startContent={<Icon icon="solar:gps-bold-duotone" width={16} />}
          >
            Usa GPS
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
