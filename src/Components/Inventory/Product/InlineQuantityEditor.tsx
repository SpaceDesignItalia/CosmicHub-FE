import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Input,
  Tooltip,
  Badge,
  Progress,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import axios from "axios";

interface Product {
  product_id: string;
  quantity: number;
  min_stock_treshold: number;
}

interface InlineQuantityEditorProps {
  product: Product;
  onUpdate: (productId: string, newQuantity: number) => void;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

// Variabile globale per tracciare quale editor è attualmente aperto
let activeEditorId: string | null = null;

export default function InlineQuantityEditor({
  product,
  onUpdate,
  isOpen: externalIsOpen,
  onOpenChange: externalOnOpenChange,
}: InlineQuantityEditorProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewQuantity, setPreviewQuantity] = useState<number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentQuantity = product.quantity || 0;
  const productId = product.product_id;

  const commonAdjustments = [1, 5, 10, 25, 50, 100];

  // Sincronizza lo stato interno del popover con i controlli esterni (se forniti)
  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setIsPopoverOpen(externalIsOpen);
    }
  }, [externalIsOpen]);

  // Gestisce l'apertura/chiusura del popover
  const handleOpenChange = (open: boolean) => {
    // Se stiamo aprendo questo popover
    if (open) {
      // Verifica se c'è già un altro editor aperto
      if (activeEditorId && activeEditorId !== productId) {
        // Non permettere l'apertura di questo popover
        return;
      }
      // Imposta questo editor come attivo
      activeEditorId = productId;

      // Reset dell'input e imposta l'anteprima
      setEditValue("");
      setPreviewQuantity(currentQuantity);
      setErrorMessage(null);

      // Focus sull'input dopo che il popover è aperto
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      // Se stiamo chiudendo, libera l'id attivo
      if (activeEditorId === productId) {
        activeEditorId = null;
      }
    }

    // Aggiorna lo stato interno
    setIsPopoverOpen(open);

    // Notifica il componente padre se necessario
    if (externalOnOpenChange) {
      externalOnOpenChange(open);
    }
  };

  // Calcola l'anteprima della quantità quando l'input cambia
  useEffect(() => {
    const currentQuantity = product.quantity || 0;

    // Se il campo è vuoto, mostra la quantità attuale
    if (editValue === "") {
      setPreviewQuantity(currentQuantity);
      return;
    }

    // Verifica se il valore inizia con + o -
    const isExplicitAddition = editValue.startsWith("+");
    const isSubtraction = editValue.startsWith("-");

    if (isExplicitAddition || isSubtraction) {
      // Prendi il valore numerico (senza il segno)
      const valueWithoutSign = editValue.substring(1);
      if (valueWithoutSign === "") {
        setPreviewQuantity(currentQuantity);
        return;
      }

      const numericValue = parseInt(valueWithoutSign);
      if (!isNaN(numericValue)) {
        // Calcola la nuova quantità
        let newQuantity = isExplicitAddition
          ? currentQuantity + numericValue
          : currentQuantity - numericValue;

        // Impedisci valori negativi
        if (newQuantity < 0) newQuantity = 0;

        setPreviewQuantity(newQuantity);
      }
    } else {
      // Se non inizia con segno, trattalo come operazione di addizione (come se avesse +)
      const numericValue = parseInt(editValue);
      if (!isNaN(numericValue)) {
        // Aggiunge il valore alla quantità corrente (equivalente a un + implicito)
        let newQuantity = currentQuantity + numericValue;
        setPreviewQuantity(newQuantity);
      }
    }
  }, [editValue, product.quantity]);

  const handleQuickAdjustment = (value: number, isAddition: boolean) => {
    const adjustment = isAddition ? `+${value}` : `-${value}`;
    setEditValue(adjustment);
    // Nascondi i suggerimenti dopo la selezione
    setShowSuggestions(false);
  };

  const handleSave = async () => {
    if (editValue === "") {
      handleOpenChange(false);
      return;
    }

    // Usa la quantità calcolata nell'anteprima
    if (previewQuantity === null) return;

    const newQuantity = previewQuantity;

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const updateData = {
        stock_unit: newQuantity.toString(),
      };

      console.log(
        `Aggiornamento stock da ${product.quantity} a ${newQuantity} per prodotto:`,
        product.product_id
      );

      try {
        await axios
          .put(`/Product/UPDATE/UpdateProductQuantity/`, {
            product_id: product.product_id,
            stock_unit: newQuantity.toString(),
          })
          .then((res) => {
            if (res.status === 200) {
              onUpdate(product.product_id, newQuantity);
              handleOpenChange(false);
              setShowSuccess(true);
              setTimeout(() => setShowSuccess(false), 2000);
            }
          });
      } catch (apiError: any) {
        if (
          apiError.response?.status === 404 ||
          apiError.code === "ERR_NETWORK"
        ) {
          console.log(
            "Endpoint specifico non trovato, provo con aggiornamento generico..."
          );
          await axios.put(
            `/Product/PUT/UpdateProduct/${product.product_id}`,
            updateData
          );
        } else {
          throw apiError;
        }
      }

      console.log("Quantità aggiornata con successo nel database");
      onUpdate(product.product_id, newQuantity);
      handleOpenChange(false);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error: any) {
      console.error("Errore nell'aggiornamento della quantità:", error);

      let errorMessage = "Errore nell'aggiornamento della quantità";
      if (error.response?.status === 404) {
        errorMessage = "Prodotto non trovato";
      } else if (error.response?.status === 400) {
        errorMessage = "Dati non validi";
      } else if (error.code === "ERR_NETWORK") {
        errorMessage = "Errore di connessione al server";
      }

      setErrorMessage(errorMessage);
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    handleOpenChange(false);
    setEditValue("");
    setPreviewQuantity(null);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    } else if (e.key === "ArrowUp" && !showSuggestions) {
      e.preventDefault();
      handleQuickAdjustment(1, true);
    } else if (e.key === "ArrowDown" && !showSuggestions) {
      e.preventDefault();
      handleQuickAdjustment(1, false);
    }
  };

  const renderEditor = () => {
    const minStock = product.min_stock_treshold || 10;

    // Determina il colore dell'anteprima in base alla quantità
    let previewColor = "text-success";
    let previewBg = "bg-success/10";
    let previewBorder = "border-success/20";

    if (previewQuantity !== null) {
      if (previewQuantity === 0) {
        previewColor = "text-danger";
        previewBg = "bg-danger/10";
        previewBorder = "border-danger/20";
      } else if (previewQuantity <= minStock) {
        previewColor = "text-warning";
        previewBg = "bg-warning/10";
        previewBorder = "border-warning/20";
      }
    }

    // Calcola la differenza rispetto al valore originale
    const difference =
      previewQuantity !== null ? previewQuantity - currentQuantity : 0;
    const diffText =
      difference > 0 ? `+${difference}` : difference < 0 ? `${difference}` : "";

    return (
      <div className="flex flex-col gap-3 relative w-[250px] py-5">
        <div className="text-center mb-1">
          <p className="text-sm font-medium text-default-600">
            Modifica quantità
          </p>
          <p className="text-xs text-default-400">
            Usa numeri senza segno per aggiungere o -N per sottrarre
          </p>
        </div>

        {/* Visualizzazione attuale e nuova quantità */}
        <div className="flex items-center justify-center gap-3 mb-1">
          <div className="text-center">
            <p className="text-xs text-default-500 mb-1">Attuale</p>
            <div className="text-xl font-semibold">{currentQuantity}</div>
          </div>

          {previewQuantity !== currentQuantity && (
            <>
              <div className="flex items-center">
                <Icon
                  icon="solar:arrow-right-bold"
                  className="text-default-400 text-xl"
                />
              </div>

              <div className="text-center">
                <p className="text-xs text-default-500 mb-1">Nuovo</p>
                <div
                  className={`text-xl font-semibold ${previewColor} flex items-center gap-1`}
                >
                  {previewQuantity}
                  {diffText && (
                    <span className="text-sm font-normal ml-1">
                      ({diffText})
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Input di modifica */}
        <div className="relative">
          <Input
            ref={inputRef}
            placeholder="Inserisci quantità (es. 10 o -5)"
            value={editValue}
            onChange={(e) => {
              const value = e.target.value;
              const regex = /^[+-]?\d*$/;
              if (value === "" || regex.test(value)) {
                setEditValue(value);
                if (value === "+" || value === "-") {
                  setShowSuggestions(true);
                }
              }
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (editValue === "+" || editValue === "-") {
                setShowSuggestions(true);
              }
            }}
            onBlur={() => {
              // Nascondi i suggerimenti quando l'input perde il focus
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            size="lg"
            className="w-full"
            isDisabled={isLoading}
            variant="bordered"
            startContent={
              <div className="text-default-400">
                <Icon
                  icon={
                    editValue.startsWith("-")
                      ? "solar:minus-circle-bold"
                      : "solar:add-circle-bold"
                  }
                />
              </div>
            }
            endContent={
              isLoading ? (
                <div className="pointer-events-none">
                  <Icon
                    icon="solar:refresh-bold"
                    className="animate-spin text-default-400"
                  />
                </div>
              ) : null
            }
          />

          {/* Suggerimenti rapidi - mostrati solo quando l'input ha il focus */}
          {showSuggestions && (
            <div className="absolute z-10 top-full left-0 right-0 mt-1 p-1 border rounded-lg bg-content1 shadow-lg">
              <div className="grid grid-cols-3 gap-1">
                {commonAdjustments.map((value) => (
                  <Button
                    key={value}
                    size="sm"
                    color={editValue.startsWith("-") ? "primary" : "success"}
                    variant="flat"
                    className="min-w-0 px-2"
                    onClick={() =>
                      handleQuickAdjustment(value, !editValue.startsWith("-"))
                    }
                    onMouseDown={(e) => {
                      // Previene il blur dell'input quando si clicca un pulsante
                      e.preventDefault();
                    }}
                  >
                    {editValue.startsWith("-") ? "-" : "+"}
                    {value}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Badge di stato se necessario */}
        {previewQuantity !== null && (
          <div className="flex justify-center">
            {previewQuantity === 0 ? (
              <Badge color="danger" variant="flat" size="sm">
                Non disponibile
              </Badge>
            ) : previewQuantity <= minStock ? (
              <Badge color="warning" variant="flat" size="sm">
                Sotto soglia minima ({minStock})
              </Badge>
            ) : null}
          </div>
        )}

        {/* Pulsanti azione */}
        <div className="flex justify-between gap-2 mt-1">
          <Button
            size="md"
            color="danger"
            variant="light"
            onClick={handleCancel}
            className="flex-1"
          >
            Annulla
          </Button>
          <Button
            size="md"
            color="primary"
            variant="solid"
            onClick={handleSave}
            isLoading={isLoading}
            className="flex-1"
          >
            Salva
          </Button>
        </div>
      </div>
    );
  };

  const quantity = product.quantity || 0;
  const minStock = product.min_stock_treshold || 10;

  return (
    <div className="relative">
      <Popover
        isOpen={isPopoverOpen}
        onOpenChange={handleOpenChange}
        placement="top"
        showArrow
      >
        <PopoverTrigger>
          <div
            className={`flex items-center gap-1.5 font-medium cursor-pointer rounded-lg px-2.5 py-1.5 border transition-all duration-300
              ${
                showSuccess
                  ? "bg-success/10 border-success/40 scale-105 shadow-sm"
                  : quantity > 0
                  ? quantity <= minStock
                    ? "hover:bg-warning/10 border-warning/10 hover:border-warning/20"
                    : "hover:bg-success/10 border-success/10 hover:border-success/20"
                  : "hover:bg-danger/10 border-danger/10 hover:border-danger/20"
              } ${
              quantity > 0
                ? quantity <= minStock
                  ? "text-warning"
                  : "text-success"
                : "text-danger"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-default-500 text-xs">QTY:</span>
              <span className="text-base tabular-nums">{quantity}</span>

              {quantity > 0 && quantity <= minStock && (
                <Icon
                  icon="solar:danger-triangle-bold"
                  className="text-warning text-sm"
                />
              )}
              {quantity === 0 && (
                <Icon
                  icon="solar:close-circle-bold"
                  className="text-danger text-sm"
                />
              )}

              {showSuccess && (
                <div className="flex items-center gap-1 text-success animate-pulse">
                  <Icon
                    icon="solar:check-circle-bold"
                    className="text-success text-sm"
                  />
                  <span className="text-xs">Aggiornato</span>
                </div>
              )}
            </div>

            {!showSuccess && (
              <div className="ml-auto">
                <Icon
                  icon="solar:pen-bold"
                  className="text-default-400 text-sm opacity-50 group-hover:opacity-100"
                />
              </div>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent>{renderEditor()}</PopoverContent>
      </Popover>

      {errorMessage && (
        <div className="absolute top-full left-0 mt-1 z-10 min-w-max">
          <div className="flex items-center gap-2 px-3 py-2 bg-danger/10 border border-danger/20 rounded-lg text-danger text-xs">
            <Icon icon="solar:danger-triangle-bold" className="text-sm" />
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="hover:bg-danger/20 rounded-full p-0.5 transition-colors"
            >
              <Icon icon="solar:close-bold" className="text-xs" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
