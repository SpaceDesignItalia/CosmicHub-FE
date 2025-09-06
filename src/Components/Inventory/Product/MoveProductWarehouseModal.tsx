import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Tooltip,
  Chip,
  Divider,
  Card,
  CardBody,
  Slider,
  useDisclosure,
} from "@heroui/react";
import { Icon } from "@iconify/react/dist/iconify.js";
import axios from "axios";

interface Warehouse {
  WarehouseID: number;
  WarehouseUUID: string;
  WarehouseName: string;
  WarehouseCode: string;
  WarehouseCountry: string;
  IsActive: boolean;
}

interface Product {
  product_id: string;
  id?: string;
  name: string;
  quantity: number;
  warehouse_id: string;
  warehouse_name?: string;
}

interface MoveProductWarehouseModalProps {
  selectedProduct: Product | null;
  onUpdateQuantity?: (productId: string, newQuantity: number) => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export default function MoveProductWarehouseModal({
  selectedProduct,
  onUpdateQuantity,
  onSuccess,
  onError,
}: MoveProductWarehouseModalProps) {
  // Modal states
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [quantity, setQuantity] = useState(1);
  const [inputValue, setInputValue] = useState("1");
  const [targetWarehouse, setTargetWarehouse] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [warehouseSearchQuery, setWarehouseSearchQuery] = useState("");

  // Data states
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);

  // Load warehouses
  const loadWarehouses = useCallback(async () => {
    setIsLoadingWarehouses(true);
    try {
      const response = await axios.get("/Warehouse/GET/GetAllWarehouses");
      // Load ALL warehouses first (not just active ones) for source warehouse lookup
      const allWarehouses = response.data;
      setWarehouses(allWarehouses);

      console.log(
        "All warehouses loaded:",
        allWarehouses.map((w: Warehouse) => ({
          id: w.WarehouseID,
          uuid: w.WarehouseUUID,
          name: w.WarehouseName,
          code: w.WarehouseCode,
          isActive: w.IsActive,
        }))
      );
    } catch (error) {
      console.error("Error loading warehouses:", error);
    } finally {
      setIsLoadingWarehouses(false);
    }
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      loadWarehouses();
      setCurrentStep(1);
      setQuantity(1);
      setInputValue("1");
      setTargetWarehouse("");
      setWarehouseSearchQuery("");
    }
  }, [isOpen, loadWarehouses]);

  // Sync inputValue with quantity when changed via slider or buttons
  useEffect(() => {
    setInputValue(quantity.toString());
  }, [quantity]);

  // Helper function to find warehouse by ID (more flexible)
  const findWarehouseById = (warehouseId: string | number) => {
    const idStr = warehouseId.toString();
    const idNum = parseInt(idStr);

    return warehouses.find((w: Warehouse) => {
      // Try exact matches first
      if (w.WarehouseUUID === idStr) return true;
      if (w.WarehouseID === idNum) return true;
      if (w.WarehouseID.toString() === idStr) return true;
      if (w.WarehouseCode === idStr) return true;
      if (w.WarehouseName === idStr) return true;

      // Try case-insensitive matches
      if (w.WarehouseCode.toLowerCase() === idStr.toLowerCase()) return true;
      if (w.WarehouseName.toLowerCase() === idStr.toLowerCase()) return true;

      return false;
    });
  };

  // Handle move operation
  const handleMoveOperation = async () => {
    if (!selectedProduct || !quantity || !targetWarehouse) {
      console.log("Missing required data:", {
        selectedProduct,
        quantity,
        targetWarehouse,
      });
      onError?.("Dati mancanti per il trasferimento");
      return;
    }

    console.log("Starting move operation with:", {
      product: selectedProduct,
      quantity,
      targetWarehouse,
      warehouses: warehouses.length,
    });

    setIsProcessing(true);
    try {
      const amount = quantity;

      // Find target warehouse data
      const targetWarehouseData = findWarehouseById(targetWarehouse);

      // Find source warehouse data using improved logic
      const sourceWarehouseData = findWarehouseById(
        selectedProduct.warehouse_id
      );

      console.log("Warehouse lookup results:", {
        selectedProductWarehouseId: selectedProduct.warehouse_id,
        selectedProductWarehouseName: selectedProduct.warehouse_name,
        targetWarehouseId: targetWarehouse,
        targetWarehouseData,
        sourceWarehouseData,
        allWarehouses: warehouses.map((w: Warehouse) => ({
          id: w.WarehouseID,
          uuid: w.WarehouseUUID,
          name: w.WarehouseName,
          code: w.WarehouseCode,
          isActive: w.IsActive,
        })),
      });

      if (!targetWarehouseData) {
        const errorMsg = `Magazzino di destinazione non trovato. ID cercato: ${targetWarehouse}`;
        console.error(errorMsg);
        onError?.(errorMsg);
        return;
      }

      if (!sourceWarehouseData) {
        const errorMsg = `Magazzino di origine non trovato. ID cercato: ${
          selectedProduct.warehouse_id
        }. Magazzini disponibili: ${warehouses
          .map(
            (w: Warehouse) =>
              `${w.WarehouseName}(ID:${w.WarehouseID}, UUID:${w.WarehouseUUID}, Code:${w.WarehouseCode})`
          )
          .join(", ")}`;
        console.error(errorMsg);
        onError?.(errorMsg);
        return;
      }

      // API call for transfer using numeric IDs
      const transferData = {
        product_id: selectedProduct.product_id || selectedProduct.id,
        amount: amount,
        from_warehouse_id: sourceWarehouseData.WarehouseID,
        to_warehouse_id: targetWarehouseData.WarehouseID,
        movement_date: new Date().toISOString(),
        notes: `Trasferimento di ${amount} unità di ${selectedProduct.name}`,
        reason: "Trasferimento tra magazzini",
      };

      console.log("Transfer data to be sent:", transferData);

      const response = await axios.post(
        "/Movement/POST/CreateTransferMovement",
        transferData
      );

      console.log("API Response:", response);

      if (response.status === 201 || response.status === 200) {
        // Update product quantity in source warehouse
        const newQuantity = selectedProduct.quantity - amount;
        if (onUpdateQuantity) {
          onUpdateQuantity(
            selectedProduct.product_id || selectedProduct.id,
            newQuantity
          );
        }

        // Show success message
        onSuccess?.(
          `${amount} unità di "${selectedProduct.name}" spostate con successo da ${sourceWarehouseData.WarehouseName} a ${targetWarehouseData.WarehouseName}!`
        );

        // Close modal and reset fields
        handleClose();
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error: any) {
      console.error("Error in move operation:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });

      let errorMessage = "Errore nello spostamento. Riprova.";

      if (error.response?.status === 400) {
        errorMessage =
          error.response.data?.error ||
          error.response.data?.message ||
          "Dati non validi per il trasferimento";
      } else if (error.response?.status === 404) {
        errorMessage = "Endpoint di trasferimento non trovato";
      } else if (error.response?.status === 500) {
        errorMessage = "Errore interno del server";
      } else if (error.code === "ERR_NETWORK") {
        errorMessage = "Errore di connessione al server";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setQuantity(1);
    setTargetWarehouse("");
    setCurrentStep(1);
    setInputValue("1");
    setWarehouseSearchQuery("");
    onOpenChange();
  };

  const handleNext = () => {
    if (
      currentStep === 1 &&
      quantity > 0 &&
      quantity <= (selectedProduct?.quantity || 0)
    ) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  // Available warehouses for destination
  const availableWarehouses = warehouses.filter((warehouse: Warehouse) => {
    if (!selectedProduct) return true;

    // Only show active warehouses for destination selection
    if (!warehouse.IsActive) return false;

    const warehouseUUID = warehouse.WarehouseUUID;
    const warehouseID = warehouse.WarehouseID.toString();
    const warehouseCode = warehouse.WarehouseCode;
    const sourceWarehouseId = selectedProduct.warehouse_id;

    const isNotSameWarehouse =
      warehouseUUID !== sourceWarehouseId &&
      warehouseID !== sourceWarehouseId &&
      warehouseCode !== sourceWarehouseId &&
      warehouse.WarehouseName !== sourceWarehouseId;

    console.log(`Warehouse ${warehouse.WarehouseName} filter check:`, {
      warehouseUUID,
      warehouseID,
      warehouseCode,
      warehouseName: warehouse.WarehouseName,
      sourceWarehouseId,
      isActive: warehouse.IsActive,
      isNotSameWarehouse,
    });

    return isNotSameWarehouse;
  });

  // Debug available warehouses
  useEffect(() => {
    console.log("Available warehouses for selection:", {
      totalWarehouses: warehouses.length,
      availableWarehouses: availableWarehouses.length,
      selectedProductWarehouseId: selectedProduct?.warehouse_id,
      availableWarehousesList: availableWarehouses.map((w: Warehouse) => ({
        id: w.WarehouseID,
        uuid: w.WarehouseUUID,
        name: w.WarehouseName,
        code: w.WarehouseCode,
      })),
    });
  }, [warehouses, availableWarehouses, selectedProduct]);

  // Filter warehouses based on search
  const filterWarehouses = (warehouseList: Warehouse[]) => {
    if (!warehouseSearchQuery.trim()) return warehouseList;

    const searchLower = warehouseSearchQuery.toLowerCase().trim();
    return warehouseList.filter((warehouse) => {
      const name = warehouse.WarehouseName.toLowerCase();
      const code = warehouse.WarehouseCode.toLowerCase();
      const country = (warehouse.WarehouseCountry || "").toLowerCase();
      return (
        name.includes(searchLower) ||
        code.includes(searchLower) ||
        country.includes(searchLower)
      );
    });
  };

  const filteredWarehouses = filterWarehouses(availableWarehouses);

  // Get warehouse name by id
  const getWarehouseName = (warehouseId: string) => {
    return (
      warehouses.find(
        (w) => (w.WarehouseUUID || w.WarehouseID.toString()) === warehouseId
      )?.WarehouseName || warehouseId
    );
  };

  const isFormValid =
    quantity > 0 &&
    quantity <= (selectedProduct?.quantity || 0) &&
    targetWarehouse;
  const selectedWarehouseInfo = warehouses.find(
    (w) => (w.WarehouseUUID || w.WarehouseID.toString()) === targetWarehouse
  );

  // Debug logging for form validation
  useEffect(() => {
    console.log("Form validation state:", {
      quantity,
      selectedProductQuantity: selectedProduct?.quantity,
      targetWarehouse,
      isFormValid,
      quantityValid:
        quantity > 0 && quantity <= (selectedProduct?.quantity || 0),
      targetWarehouseValid: !!targetWarehouse,
    });
  }, [quantity, targetWarehouse, selectedProduct, isFormValid]);

  // Trigger button component
  const TriggerButton = () => (
    <Tooltip content="Sposta tra magazzini">
      <Button
        isIconOnly
        size="sm"
        color="primary"
        variant="flat"
        onPress={onOpen}
        className="min-w-8 h-8 hover:scale-105 transition-transform"
        isDisabled={!selectedProduct || selectedProduct.quantity <= 0}
      >
        <Icon icon="solar:transfer-horizontal-bold" width={16} />
      </Button>
    </Tooltip>
  );

  if (!selectedProduct) {
    return <TriggerButton />;
  }

  return (
    <>
      <TriggerButton />

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="2xl"
        isDismissable={!isProcessing}
        hideCloseButton={isProcessing}
      >
        <ModalContent className="p-5">
          <ModalHeader className="flex flex-col gap-2 pb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <Icon
                  icon="solar:transfer-horizontal-bold"
                  className="text-primary"
                  width={24}
                />
              </div>
              <div>
                <h3 className="text-xl font-bold">Sposta tra Magazzini</h3>
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
                  Magazzino
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
                      Da:{" "}
                      {selectedProduct.warehouse_name ||
                        selectedProduct.warehouse_id}
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
                    Quante unità vuoi spostare?
                  </h4>
                  <p className="text-sm text-default-600">
                    Usa lo slider o inserisci il numero direttamente
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Quantity Display */}
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {quantity}
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
                    value={quantity}
                    onChange={(value) => {
                      const newValue = Array.isArray(value) ? value[0] : value;
                      setQuantity(newValue);
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
                            quantity === quickValue ? "solid" : "bordered"
                          }
                          color={
                            quantity === quickValue ? "primary" : "default"
                          }
                          size="sm"
                          onPress={() => setQuantity(quickValue)}
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

                      if (inputVal === "" || inputVal === "0") {
                        return;
                      }

                      const numericValue = parseInt(inputVal);
                      if (!isNaN(numericValue)) {
                        const clampedValue = Math.min(
                          Math.max(numericValue, 1),
                          selectedProduct.quantity
                        );
                        setQuantity(clampedValue);
                      }
                    }}
                    onBlur={() => {
                      if (
                        inputValue === "" ||
                        inputValue === "0" ||
                        parseInt(inputValue) < 1
                      ) {
                        setInputValue("1");
                        setQuantity(1);
                      } else {
                        const numericValue = parseInt(inputValue);
                        if (!isNaN(numericValue)) {
                          const clampedValue = Math.min(
                            Math.max(numericValue, 1),
                            selectedProduct.quantity
                          );
                          setQuantity(clampedValue);
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

            {/* Step 2: Warehouse Selection */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h4 className="text-lg font-semibold mb-2">
                    Verso quale magazzino?
                  </h4>
                  <p className="text-sm text-default-600">
                    Seleziona il magazzino di destinazione per il trasferimento
                  </p>
                </div>

                {isLoadingWarehouses ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin">
                        <Icon icon="solar:refresh-bold" width={24} />
                      </div>
                      <span className="text-default-500">
                        Caricamento magazzini...
                      </span>
                    </div>
                  </div>
                ) : availableWarehouses.length === 0 ? (
                  <div className="text-center py-12">
                    <Icon
                      icon="solar:buildings-bold"
                      className="text-default-300 mx-auto mb-4"
                      width={48}
                    />
                    <h4 className="font-semibold text-default-600 mb-2">
                      Nessun magazzino disponibile
                    </h4>
                    <p className="text-sm text-default-500">
                      Non ci sono altri magazzini disponibili per il
                      trasferimento
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Search field for warehouses */}
                    {availableWarehouses.length > 3 && (
                      <div className="mb-4">
                        <Input
                          color="primary"
                          placeholder="Cerca magazzino per nome, codice o paese..."
                          value={warehouseSearchQuery}
                          onChange={(e) =>
                            setWarehouseSearchQuery(e.target.value)
                          }
                          startContent={
                            <Icon
                              icon="line-md:search"
                              className="text-default-400"
                              width={20}
                            />
                          }
                          endContent={
                            warehouseSearchQuery && (
                              <Button
                                isIconOnly
                                variant="light"
                                size="sm"
                                onPress={() => setWarehouseSearchQuery("")}
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
                        />

                        {/* Search results indicator */}
                        {warehouseSearchQuery && (
                          <div className="flex justify-between items-center mt-2 px-1">
                            <p className="text-xs text-default-500">
                              {filteredWarehouses.length} di{" "}
                              {availableWarehouses.length} magazzini
                            </p>
                            {filteredWarehouses.length === 0 && (
                              <p className="text-xs text-warning">
                                Nessun risultato trovato
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Filtered warehouse list */}
                    {filteredWarehouses.length === 0 && warehouseSearchQuery ? (
                      <div className="text-center py-8">
                        <Icon
                          icon="solar:magnifer-bold"
                          className="text-default-300 mx-auto mb-3"
                          width={32}
                        />
                        <h4 className="font-medium text-default-600 mb-2">
                          Nessun magazzino trovato
                        </h4>
                        <p className="text-sm text-default-500 mb-4">
                          Prova a modificare i termini di ricerca
                        </p>
                        <Button
                          color="primary"
                          variant="flat"
                          size="sm"
                          onPress={() => setWarehouseSearchQuery("")}
                          startContent={
                            <Icon icon="solar:refresh-bold" width={16} />
                          }
                        >
                          Mostra tutti
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 w-full">
                        {filteredWarehouses.map((warehouse) => (
                          <Card
                            key={
                              warehouse.WarehouseUUID ||
                              warehouse.WarehouseID.toString()
                            }
                            isPressable
                            isHoverable
                            className={`cursor-pointer transition-all w-full ${
                              targetWarehouse ===
                              (warehouse.WarehouseUUID ||
                                warehouse.WarehouseID.toString())
                                ? "bg-primary/10 border-primary border-2"
                                : "hover:bg-default-50"
                            }`}
                            onPress={() =>
                              setTargetWarehouse(
                                warehouse.WarehouseUUID ||
                                  warehouse.WarehouseID.toString()
                              )
                            }
                          >
                            <CardBody className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`p-2 rounded-lg ${
                                      targetWarehouse ===
                                      (warehouse.WarehouseUUID ||
                                        warehouse.WarehouseID.toString())
                                        ? "bg-primary/20"
                                        : "bg-success/10"
                                    }`}
                                  >
                                    <Icon
                                      icon="solar:buildings-bold"
                                      className={
                                        targetWarehouse ===
                                        (warehouse.WarehouseUUID ||
                                          warehouse.WarehouseID.toString())
                                          ? "text-primary"
                                          : "text-success"
                                      }
                                      width={20}
                                    />
                                  </div>
                                  <div>
                                    <p className="font-semibold">
                                      {warehouse.WarehouseName}
                                    </p>
                                    <p className="text-sm text-default-600 flex items-center gap-1">
                                      <Icon icon="solar:code-bold" width={12} />
                                      {warehouse.WarehouseCode}
                                      {warehouse.WarehouseCountry && (
                                        <>
                                          <Icon
                                            icon="solar:global-bold"
                                            width={12}
                                          />
                                          {warehouse.WarehouseCountry}
                                        </>
                                      )}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Chip color="success" size="sm" variant="dot">
                                    Attivo
                                  </Chip>
                                  {targetWarehouse ===
                                    (warehouse.WarehouseUUID ||
                                      warehouse.WarehouseID.toString()) && (
                                    <Icon
                                      icon="solar:check-circle-bold"
                                      className="text-primary"
                                      width={20}
                                    />
                                  )}
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Summary */}
            {currentStep === 2 && targetWarehouse && selectedWarehouseInfo && (
              <>
                <Divider />
                <Card className="bg-primary/5 border border-primary/20">
                  <CardBody className="p-4">
                    <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                      <Icon icon="solar:check-circle-bold" width={20} />
                      Pronto per il trasferimento
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-default-600">Quantità:</span>
                        <p className="font-bold text-lg">{quantity} unità</p>
                      </div>
                      <div>
                        <span className="text-default-600">
                          Verso magazzino:
                        </span>
                        <p className="font-medium">
                          {selectedWarehouseInfo.WarehouseName} (
                          {selectedWarehouseInfo.WarehouseCode})
                        </p>
                      </div>
                    </div>
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
                  onPress={handleClose}
                  isDisabled={isProcessing}
                >
                  Annulla
                </Button>
                <Button
                  color="primary"
                  onPress={handleNext}
                  isDisabled={
                    quantity <= 0 || quantity > selectedProduct.quantity
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
                  isDisabled={isProcessing}
                  startContent={<Icon icon="solar:arrow-left-bold" />}
                >
                  Indietro
                </Button>
                <Button
                  color="primary"
                  isDisabled={!isFormValid}
                  isLoading={isProcessing}
                  onPress={handleMoveOperation}
                  startContent={
                    isProcessing ? null : (
                      <Icon icon="solar:transfer-horizontal-bold" />
                    )
                  }
                  className="font-medium min-w-[140px]"
                >
                  {isProcessing ? "Trasferimento..." : "Sposta Prodotto"}
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
