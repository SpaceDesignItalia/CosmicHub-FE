import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  useDisclosure,
  Tooltip,
  Chip,
  Divider,
  Card,
  CardBody,
  Slider,
} from "@heroui/react";
import { Icon } from "@iconify/react/dist/iconify.js";
import axios from "axios";

interface Vehicle {
  vehicle_id: string;
  name: string;
  license_plate: string;
  capacity?: number; // Capacità massima del veicolo in kg
  IsAvailable: boolean;
  VehicleID?: string;
  VehicleName?: string;
  VehiclePlate?: string;
  is_available?: boolean;
  available?: boolean;
  status?:
    | "Available"
    | "In use"
    | "Maintenance"
    | "Disponibile"
    | "In uso"
    | "In manutenzione";
  stato?:
    | "Available"
    | "In use"
    | "Maintenance"
    | "Disponibile"
    | "In uso"
    | "In manutenzione";
}

interface Product {
  product_id: string;
  id?: string;
  name: string;
  quantity: number;
  warehouse_id: string;
  weight?: string | number; // Peso unitario del prodotto in grammi
  [key: string]: any; // Permette proprietà aggiuntive
}

interface LoadProductModalProps {
  selectedProduct: Product | null;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  onRefreshData?: () => void;
}

export default function LoadProductModal({
  selectedProduct,
  onSuccess,
  onError,
  onRefreshData,
}: LoadProductModalProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [loadQuantity, setLoadQuantity] = useState(1);
  const [inputValue, setInputValue] = useState("1");
  const [targetVehicle, setTargetVehicle] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState("");
  const [isProcessingLoad, setIsProcessingLoad] = useState(false);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [vehicleInventory, setVehicleInventory] = useState<any[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);

  // Carica i veicoli all'avvio del componente
  useEffect(() => {
    if (isOpen) {
      fetchAllVehicles();
      setCurrentStep(1);
      setLoadQuantity(1);
      setInputValue("1");
      setTargetVehicle("");
      setVehicleSearchQuery("");
    }
  }, [isOpen]);

  // Sincronizza inputValue con loadQuantity quando cambia tramite slider o bottoni
  useEffect(() => {
    setInputValue(loadQuantity.toString());
  }, [loadQuantity]);

  // Carica l'inventario del veicolo quando viene selezionato
  useEffect(() => {
    if (targetVehicle) {
      fetchVehicleInventory(targetVehicle);
    }
  }, [targetVehicle]);

  async function fetchAllVehicles() {
    setIsLoadingVehicles(true);
    try {
      const response = await axios.get("/Vehicle/GET/GetAllVehicles");
      const vehiclesData = response.data || [];

      // Debug: Log per verificare la struttura dei dati
      console.log("Raw vehicles data:", vehiclesData);
      console.log("First vehicle structure:", vehiclesData[0]);

      // Controlla i possibili nomi delle proprietà
      if (vehiclesData.length > 0) {
        const firstVehicle = vehiclesData[0];
        console.log(
          "Available properties in first vehicle:",
          Object.keys(firstVehicle)
        );

        // Controlla diverse possibili proprietà per lo stato
        console.log("IsAvailable:", firstVehicle.IsAvailable);
        console.log("is_available:", firstVehicle.is_available);
        console.log("available:", firstVehicle.available);
        console.log("status:", firstVehicle.status);
        console.log("stato:", firstVehicle.stato);
      }

      setVehicles(vehiclesData);
    } catch (error) {
      console.error("Errore nel caricamento dei veicoli:", error);
    } finally {
      setIsLoadingVehicles(false);
    }
  }

  // Funzione per caricare l'inventario di un veicolo specifico
  const fetchVehicleInventory = async (vehicleId: string) => {
    setIsLoadingInventory(true);
    try {
      const response = await axios.get("/Vehicle/GET/GetVehicleInventory", {
        params: {
          vehicle_id: vehicleId,
        },
      });
      setVehicleInventory(response.data || []);
    } catch (error) {
      console.error(
        "Errore nel caricamento dell'inventario del veicolo:",
        error
      );
      setVehicleInventory([]);
    } finally {
      setIsLoadingInventory(false);
    }
  };

  // Funzione per calcolare il peso totale dell'inventario di un veicolo
  const calculateVehicleCurrentWeight = (vehicleId: string) => {
    return vehicleInventory
      .filter((item) => item.vehicle_id === vehicleId)
      .reduce((total, item) => {
        const itemWeight = (item.weight / 1000) * item.amount; // Converti da grammi a kg
        return total + itemWeight;
      }, 0);
  };

  // Funzione per calcolare il peso del prodotto da caricare
  const calculateProductWeight = () => {
    if (!selectedProduct?.weight) return 0;
    const productWeightKg = selectedProduct.weight / 1000; // Converti da grammi a kg
    return productWeightKg * loadQuantity;
  };

  // Funzione per validare se il caricamento supera la capacità
  const validateVehicleCapacity = (vehicleId: string) => {
    const selectedVehicle = vehicles.find((v) => v.vehicle_id === vehicleId);
    if (!selectedVehicle?.capacity) return { isValid: true, message: "" };

    const currentWeight = calculateVehicleCurrentWeight(vehicleId);
    const productWeight = calculateProductWeight();
    const totalWeight = currentWeight + productWeight;
    const capacity = selectedVehicle.capacity;

    if (totalWeight > capacity) {
      return {
        isValid: false,
        message: `Il caricamento supererebbe la capacità massima del veicolo (${capacity} kg). Peso attuale: ${currentWeight.toFixed(
          2
        )} kg + Peso da caricare: ${productWeight.toFixed(
          2
        )} kg = ${totalWeight.toFixed(2)} kg`,
      };
    }

    return { isValid: true, message: "" };
  };

  const handleLoadOperation = async () => {
    if (!selectedProduct || !loadQuantity || !targetVehicle) return;

    // Validazione della capacità del veicolo
    const capacityValidation = validateVehicleCapacity(targetVehicle);
    if (!capacityValidation.isValid) {
      if (onError) {
        onError(capacityValidation.message);
      }
      return;
    }

    setIsProcessingLoad(true);
    try {
      console.log(selectedProduct);
      // Chiamata API per caricare su furgone
      await axios.post("/Movement/POST/CreateLoadToVehicleMovement", {
        product_id: selectedProduct.product_id || selectedProduct.id,
        from_warehouse_id: selectedProduct.warehouse_id,
        to_vehicle_id: parseInt(targetVehicle),
        amount: loadQuantity,
      });

      // Reset form e chiudi modal
      setLoadQuantity(1);
      setTargetVehicle("");
      setCurrentStep(1);
      setInputValue("1");
      onOpenChange();

      // Comunica successo al parent
      if (onSuccess) {
        onSuccess(
          `${loadQuantity} unità di "${selectedProduct.name}" sono state caricate con successo sul furgone.`
        );
      }

      // Refresh dei dati
      if (onRefreshData) {
        onRefreshData();
      }
    } catch (error: any) {
      console.error("Errore nel caricamento:", error);
      let errorMessage = "Errore nel caricamento. Riprova.";
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      // Comunica errore al parent
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsProcessingLoad(false);
    }
  };

  // Funzione helper per determinare se un veicolo è disponibile
  const isVehicleAvailable = (vehicle: Vehicle) => {
    // Controlla diverse possibili proprietà e formati
    if (typeof vehicle.IsAvailable === "boolean") {
      return vehicle.IsAvailable;
    }
    if (typeof vehicle.is_available === "boolean") {
      return vehicle.is_available;
    }
    if (typeof vehicle.available === "boolean") {
      return vehicle.available;
    }
    if (vehicle.status) {
      return vehicle.status === "Available" || vehicle.status === "Disponibile";
    }
    if (vehicle.stato) {
      return vehicle.stato === "Available" || vehicle.stato === "Disponibile";
    }

    // Default: considera disponibile se non specificato diversamente
    return true;
  };

  const availableVehicles = vehicles.filter(isVehicleAvailable);
  const unavailableVehicles = vehicles.filter((v) => !isVehicleAvailable(v));

  // Funzione per filtrare i veicoli in base alla ricerca
  const filterVehicles = (vehicleList: Vehicle[]) => {
    if (!vehicleSearchQuery.trim()) return vehicleList;

    const searchLower = vehicleSearchQuery.toLowerCase().trim();
    return vehicleList.filter((vehicle) => {
      const name = (vehicle.name || vehicle.VehicleName || "").toLowerCase();
      const plate = (
        vehicle.license_plate ||
        vehicle.VehiclePlate ||
        ""
      ).toLowerCase();
      return name.includes(searchLower) || plate.includes(searchLower);
    });
  };

  const filteredAvailableVehicles = filterVehicles(availableVehicles);
  const filteredUnavailableVehicles = filterVehicles(unavailableVehicles);

  const isFormValid =
    loadQuantity > 0 &&
    loadQuantity <= (selectedProduct?.quantity || 0) &&
    targetVehicle &&
    validateVehicleCapacity(targetVehicle).isValid;
  const selectedVehicleInfo = vehicles.find(
    (v) => v.vehicle_id === targetVehicle
  );

  const handleNext = () => {
    if (
      currentStep === 1 &&
      loadQuantity > 0 &&
      loadQuantity <= (selectedProduct?.quantity || 0)
    ) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  if (!selectedProduct) {
    return null;
  }

  return (
    <>
      <Tooltip content="Carica il prodotto su un furgone" placement="top">
        <Button
          color="secondary"
          onPress={onOpen}
          isIconOnly
          size="sm"
          variant="flat"
          className="min-w-8 h-8 hover:scale-105 transition-transform"
          isDisabled={!selectedProduct || selectedProduct.quantity <= 0}
        >
          <Icon icon="solar:delivery-bold" width={16} />
        </Button>
      </Tooltip>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="2xl"
        isDismissable={!isProcessingLoad}
        hideCloseButton={isProcessingLoad}
      >
        <ModalContent className="p-5">
          <ModalHeader className="flex flex-col gap-2 pb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <Icon
                  icon="solar:delivery-bold"
                  className="text-primary"
                  width={24}
                />
              </div>
              <div>
                <h3 className="text-xl font-bold">Carica su Furgone</h3>
                <p className="text-sm text-default-500 font-normal">
                  {selectedProduct.name}
                </p>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    currentStep >= 1
                      ? "bg-primary text-white"
                      : "bg-default-200 text-default-500"
                  }`}
                >
                  1
                </div>
                <span
                  className={`text-sm ${
                    currentStep >= 1
                      ? "text-primary font-medium"
                      : "text-default-500"
                  }`}
                >
                  Quantità
                </span>
              </div>

              <div
                className={`flex-1 h-1 rounded-full ${
                  currentStep >= 2 ? "bg-primary" : "bg-default-200"
                }`}
              />

              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    currentStep >= 2
                      ? "bg-primary text-white"
                      : "bg-default-200 text-default-500"
                  }`}
                >
                  2
                </div>
                <span
                  className={`text-sm ${
                    currentStep >= 2
                      ? "text-primary font-medium"
                      : "text-default-500"
                  }`}
                >
                  Furgone
                </span>
              </div>
            </div>
          </ModalHeader>

          <ModalBody className="gap-6">
            {/* Product Info Card */}
            <Card className="bg-gradient-to-r from-primary/5 to-primary/5 border border-primary/20">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-default-600">
                      Magazzino {selectedProduct.warehouse_id}
                    </p>
                    <p className="font-semibold text-lg">
                      {selectedProduct.name}
                    </p>
                  </div>
                  <Chip
                    color="success"
                    variant="flat"
                    size="lg"
                    startContent={<Icon icon="solar:box-bold" width={16} />}
                  >
                    {selectedProduct.quantity} disponibili
                  </Chip>
                </div>
              </CardBody>
            </Card>

            {/* Step 1: Quantity Selection */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h4 className="text-lg font-semibold mb-2">
                    Quante unità vuoi caricare?
                  </h4>
                  <p className="text-sm text-default-600">
                    Usa lo slider o inserisci il numero direttamente
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Quantity Display */}
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {loadQuantity}
                    </div>
                    <p className="text-sm text-default-600">
                      su {selectedProduct.quantity} disponibili
                    </p>
                  </div>

                  {/* Slider */}
                  <Slider
                    size="sm"
                    step={1}
                    minValue={1}
                    maxValue={selectedProduct.quantity}
                    value={loadQuantity}
                    onChange={(value) => {
                      const newValue = Array.isArray(value) ? value[0] : value;
                      setLoadQuantity(newValue);
                    }}
                    className="max-w-md mx-auto"
                    color="primary"
                    showTooltip={true}
                    formatOptions={{ style: "decimal" }}
                  />

                  {/* Quick Selection Buttons */}
                  <div className="flex gap-2 justify-center flex-wrap">
                    {[
                      1,
                      5,
                      10,
                      Math.floor(selectedProduct.quantity / 2),
                      selectedProduct.quantity,
                    ]
                      .filter(
                        (val, index, arr) =>
                          val <= selectedProduct.quantity &&
                          arr.indexOf(val) === index
                      )
                      .map((quickValue) => (
                        <Button
                          key={quickValue}
                          variant={
                            loadQuantity === quickValue ? "solid" : "bordered"
                          }
                          color={
                            loadQuantity === quickValue ? "primary" : "default"
                          }
                          size="sm"
                          onPress={() => {
                            setLoadQuantity(quickValue);
                          }}
                          className="min-w-12"
                        >
                          {quickValue === selectedProduct.quantity
                            ? "Tutto"
                            : quickValue}
                        </Button>
                      ))}
                  </div>

                  {/* Manual Input */}
                  <Input
                    color="primary"
                    type="number"
                    value={inputValue}
                    onChange={(e) => {
                      const inputVal = e.target.value;
                      setInputValue(inputVal);

                      // Se l'input è vuoto, non aggiornare loadQuantity ancora
                      if (inputVal === "" || inputVal === "0") {
                        return;
                      }

                      const numericValue = parseInt(inputVal);
                      if (!isNaN(numericValue)) {
                        const clampedValue = Math.min(
                          Math.max(numericValue, 1),
                          selectedProduct.quantity
                        );
                        setLoadQuantity(clampedValue);
                      }
                    }}
                    onBlur={() => {
                      // Quando l'utente esce dall'input, assicurati che ci sia un valore valido
                      if (
                        inputValue === "" ||
                        inputValue === "0" ||
                        parseInt(inputValue) < 1
                      ) {
                        setInputValue("1");
                        setLoadQuantity(1);
                      } else {
                        const numericValue = parseInt(inputValue);
                        if (!isNaN(numericValue)) {
                          const clampedValue = Math.min(
                            Math.max(numericValue, 1),
                            selectedProduct.quantity
                          );
                          setLoadQuantity(clampedValue);
                          setInputValue(clampedValue.toString());
                        }
                      }
                    }}
                    min={1}
                    max={selectedProduct.quantity}
                    className="max-w-xs mx-auto"
                    variant="bordered"
                    placeholder="Inserisci quantità"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Vehicle Selection */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h4 className="text-lg font-semibold mb-2">
                    Su quale furgone?
                  </h4>
                  <p className="text-sm text-default-600">
                    Seleziona un furgone disponibile per il caricamento
                  </p>
                </div>

                {isLoadingVehicles ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin">
                        <Icon icon="solar:refresh-bold" width={24} />
                      </div>
                      <span className="text-default-500">
                        Caricamento furgoni...
                      </span>
                    </div>
                  </div>
                ) : availableVehicles.length === 0 ? (
                  <div className="text-center py-12">
                    <Icon
                      icon="solar:delivery-bold"
                      className="text-default-300 mx-auto mb-4"
                      width={48}
                    />
                    <h4 className="font-semibold text-default-600 mb-2">
                      Nessun furgone disponibile
                    </h4>
                    <p className="text-sm text-default-500">
                      Al momento non ci sono furgoni disponibili per il
                      caricamento
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Campo di ricerca furgoni */}
                    {availableVehicles.length > 3 && (
                      <div className="mb-4">
                        <Input
                          color="primary"
                          placeholder="Cerca furgone per nome o targa..."
                          value={vehicleSearchQuery}
                          onChange={(e) =>
                            setVehicleSearchQuery(e.target.value)
                          }
                          startContent={
                            <Icon
                              icon="line-md:search"
                              className="text-default-400"
                              width={20}
                            />
                          }
                          endContent={
                            vehicleSearchQuery && (
                              <Button
                                isIconOnly
                                variant="light"
                                size="sm"
                                onPress={() => setVehicleSearchQuery("")}
                                className="min-w-6 h-6"
                              >
                                <Icon
                                  icon="solar:close-circle-bold"
                                  className="text-default-400"
                                  width={16}
                                />
                              </Button>
                            )
                          }
                          variant="bordered"
                          className="w-full"
                          classNames={{
                            input: "text-sm",
                            inputWrapper: "border-default-200",
                          }}
                        />

                        {/* Indicatore risultati ricerca */}
                        {vehicleSearchQuery && (
                          <div className="flex justify-between items-center mt-2 px-1">
                            <p className="text-xs text-default-500">
                              {filteredAvailableVehicles.length} di{" "}
                              {availableVehicles.length} furgoni
                            </p>
                            {filteredAvailableVehicles.length === 0 && (
                              <p className="text-xs text-warning">
                                Nessun risultato trovato
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Lista furgoni filtrati */}
                    {filteredAvailableVehicles.length === 0 &&
                    vehicleSearchQuery ? (
                      <div className="text-center py-8">
                        <Icon
                          icon="solar:magnifer-bold"
                          className="text-default-300 mx-auto mb-3"
                          width={32}
                        />
                        <h4 className="font-medium text-default-600 mb-2">
                          Nessun furgone trovato
                        </h4>
                        <p className="text-sm text-default-500 mb-4">
                          Prova a modificare i termini di ricerca
                        </p>
                        <Button
                          color="primary"
                          variant="flat"
                          size="sm"
                          onPress={() => setVehicleSearchQuery("")}
                          startContent={
                            <Icon icon="solar:refresh-bold" width={16} />
                          }
                        >
                          Mostra tutti
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 w-full">
                        {filteredAvailableVehicles.map((vehicle) => (
                          <Card
                            key={vehicle.vehicle_id}
                            isPressable
                            isHoverable
                            className={`cursor-pointer transition-all w-full ${
                              targetVehicle === vehicle.vehicle_id
                                ? "bg-primary/10 border-primary border-2"
                                : "hover:bg-default-50"
                            }`}
                            onPress={() => setTargetVehicle(vehicle.vehicle_id)}
                          >
                            <CardBody className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`p-2 rounded-lg ${
                                      targetVehicle === vehicle.vehicle_id
                                        ? "bg-primary/20"
                                        : "bg-success/10"
                                    }`}
                                  >
                                    <Icon
                                      icon="solar:delivery-bold"
                                      className={
                                        targetVehicle === vehicle.vehicle_id
                                          ? "text-primary"
                                          : "text-success"
                                      }
                                      width={20}
                                    />
                                  </div>
                                  <div>
                                    <p className="font-semibold">
                                      {vehicle.name}
                                    </p>
                                    <p className="text-sm text-default-600">
                                      {vehicle.license_plate}
                                    </p>
                                    {vehicle.capacity && (
                                      <p className="text-xs text-default-500">
                                        Capacità: {vehicle.capacity} kg
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Chip color="success" size="sm" variant="dot">
                                    Disponibile
                                  </Chip>
                                  {targetVehicle === vehicle.vehicle_id && (
                                    <Icon
                                      icon="solar:check-circle-bold"
                                      className="text-primary"
                                      width={20}
                                    />
                                  )}
                                </div>
                              </div>

                              {/* Informazioni di peso quando il veicolo è selezionato */}
                              {targetVehicle === vehicle.vehicle_id &&
                                vehicle.capacity && (
                                  <div className="mt-3 pt-3 border-t border-default-200">
                                    <div className="space-y-2">
                                      <div className="flex justify-between text-xs">
                                        <span className="text-default-600">
                                          Peso attuale:
                                        </span>
                                        <span className="font-medium">
                                          {calculateVehicleCurrentWeight(
                                            vehicle.vehicle_id
                                          ).toFixed(2)}{" "}
                                          kg
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span className="text-default-600">
                                          Peso da caricare:
                                        </span>
                                        <span className="font-medium">
                                          {calculateProductWeight().toFixed(2)}{" "}
                                          kg
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span className="text-default-600">
                                          Peso totale:
                                        </span>
                                        <span
                                          className={`font-medium ${
                                            calculateVehicleCurrentWeight(
                                              vehicle.vehicle_id
                                            ) +
                                              calculateProductWeight() >
                                            vehicle.capacity
                                              ? "text-danger"
                                              : "text-success"
                                          }`}
                                        >
                                          {(
                                            calculateVehicleCurrentWeight(
                                              vehicle.vehicle_id
                                            ) + calculateProductWeight()
                                          ).toFixed(2)}{" "}
                                          kg
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span className="text-default-600">
                                          Capacità:
                                        </span>
                                        <span className="font-medium">
                                          {vehicle.capacity} kg
                                        </span>
                                      </div>

                                      {/* Avviso se supera la capacità */}
                                      {calculateVehicleCurrentWeight(
                                        vehicle.vehicle_id
                                      ) +
                                        calculateProductWeight() >
                                        vehicle.capacity && (
                                        <div className="mt-2 p-2 bg-danger-50 border border-danger-200 rounded-lg">
                                          <p className="text-xs text-danger-700 font-medium">
                                            ⚠️ Il caricamento supererebbe la
                                            capacità massima del veicolo
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                            </CardBody>
                          </Card>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {unavailableVehicles.length > 0 && (
                  <details className="cursor-pointer">
                    <summary className="text-sm text-default-600 hover:text-default-800">
                      {unavailableVehicles.length} furgoni non disponibili
                      {vehicleSearchQuery &&
                        filteredUnavailableVehicles.length !==
                          unavailableVehicles.length && (
                          <span className="ml-1">
                            ({filteredUnavailableVehicles.length}{" "}
                            corrispondenti)
                          </span>
                        )}
                    </summary>
                    <div className="mt-2 space-y-2">
                      {(vehicleSearchQuery
                        ? filteredUnavailableVehicles
                        : unavailableVehicles
                      ).map((vehicle, idx) => (
                        <div
                          key={vehicle.vehicle_id || vehicle.VehicleID || idx}
                          className="flex items-center gap-2 text-xs text-default-500 p-2 bg-default-50 rounded-lg"
                        >
                          <Icon icon="solar:close-circle-bold" width={14} />
                          <span>
                            {vehicle.name || vehicle.VehicleName} (
                            {vehicle.license_plate || vehicle.VehiclePlate})
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}

            {/* Summary */}
            {currentStep === 2 && targetVehicle && selectedVehicleInfo && (
              <>
                <Divider />
                <Card className="bg-primary/5 border border-primary/20">
                  <CardBody className="p-4">
                    <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                      <Icon icon="solar:check-circle-bold" width={20} />
                      Pronto per il caricamento
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-default-600">Quantità:</span>
                        <p className="font-bold text-lg">
                          {loadQuantity} unità
                        </p>
                      </div>
                      <div>
                        <span className="text-default-600">Su furgone:</span>
                        <p className="font-medium">
                          {selectedVehicleInfo.name} (
                          {selectedVehicleInfo.license_plate})
                        </p>
                      </div>
                    </div>

                    {/* Informazioni di peso nel riepilogo */}
                    {selectedVehicleInfo?.capacity && (
                      <div className="mt-4 pt-4 border-t border-primary/20">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-default-600">
                              Peso da caricare:
                            </span>
                            <span className="font-medium">
                              {calculateProductWeight().toFixed(2)} kg
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-default-600">
                              Peso attuale furgone:
                            </span>
                            <span className="font-medium">
                              {calculateVehicleCurrentWeight(
                                targetVehicle
                              ).toFixed(2)}{" "}
                              kg
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-default-600">
                              Peso totale:
                            </span>
                            <span
                              className={`font-medium ${
                                calculateVehicleCurrentWeight(targetVehicle) +
                                  calculateProductWeight() >
                                selectedVehicleInfo.capacity
                                  ? "text-danger"
                                  : "text-success"
                              }`}
                            >
                              {(
                                calculateVehicleCurrentWeight(targetVehicle) +
                                calculateProductWeight()
                              ).toFixed(2)}{" "}
                              kg
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-default-600">
                              Capacità furgone:
                            </span>
                            <span className="font-medium">
                              {selectedVehicleInfo.capacity} kg
                            </span>
                          </div>

                          {/* Avviso finale se supera la capacità */}
                          {calculateVehicleCurrentWeight(targetVehicle) +
                            calculateProductWeight() >
                            selectedVehicleInfo.capacity && (
                            <div className="mt-3 p-3 bg-danger-50 border border-danger-200 rounded-lg">
                              <p className="text-sm text-danger-700 font-medium text-center">
                                ⚠️ ATTENZIONE: Il caricamento supererebbe la
                                capacità massima del veicolo!
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </>
            )}
          </ModalBody>

          <ModalFooter className="gap-3 pt-4">
            {currentStep === 1 ? (
              <>
                <Button
                  variant="light"
                  onPress={() => {
                    setLoadQuantity(1);
                    setTargetVehicle("");
                    setCurrentStep(1);
                    setInputValue("1");
                    onOpenChange();
                  }}
                  isDisabled={isProcessingLoad}
                >
                  Annulla
                </Button>
                <Button
                  color="primary"
                  onPress={handleNext}
                  isDisabled={
                    loadQuantity <= 0 || loadQuantity > selectedProduct.quantity
                  }
                  endContent={<Icon icon="solar:arrow-right-bold" />}
                  className="font-medium"
                >
                  Continua
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="light"
                  onPress={handleBack}
                  isDisabled={isProcessingLoad}
                  startContent={<Icon icon="solar:arrow-left-bold" />}
                >
                  Indietro
                </Button>
                <Button
                  color="primary"
                  isDisabled={!isFormValid}
                  isLoading={isProcessingLoad}
                  onPress={handleLoadOperation}
                  startContent={
                    isProcessingLoad ? null : (
                      <Icon icon="solar:delivery-bold" />
                    )
                  }
                  className="font-medium min-w-[140px]"
                >
                  {isProcessingLoad ? "Caricamento..." : "Carica Prodotto"}
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
