import React, { useState } from "react";
import { Button, Input, Tooltip } from "@heroui/react";
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
}

export default function InlineQuantityEditor({
  product,
  onUpdate,
}: InlineQuantityEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(
    (product.quantity || 0).toString()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue((product.quantity || 0).toString());
    setErrorMessage(null); // Reset errore quando si inizia una nuova modifica
  };

  const handleSave = async () => {
    const newQuantity = parseInt(editValue) || 0;
    if (newQuantity < 0) return; // Non permettere valori negativi

    setIsLoading(true);
    setErrorMessage(null); // Reset errore
    try {
      // Chiamata API per aggiornare la quantità
      // Usiamo un endpoint PUT per aggiornare il prodotto con solo la quantità
      const updateData = {
        stock_unit: newQuantity.toString(), // Il backend usa stock_unit come campo quantità
      };

      console.log(
        "Aggiornamento quantità per prodotto:",
        product.product_id,
        "Nuova quantità:",
        newQuantity
      );

      try {
        // Proviamo prima con un endpoint specifico per l'aggiornamento quantità
        await axios
          .put(`/Product/UPDATE/UpdateProductQuantity/`, {
            product_id: product.product_id,
            stock_unit: newQuantity.toString(),
          })
          .then((res) => {
            if (res.status === 200) {
              onUpdate(product.product_id, newQuantity);
              setIsEditing(false);
              setShowSuccess(true);
              setTimeout(() => setShowSuccess(false), 2000);
            }
          });
      } catch (apiError: any) {
        // Se l'endpoint specifico non esiste, proviamo con un endpoint generico di aggiornamento prodotto
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
      setIsEditing(false);

      // Mostra feedback di successo
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error: any) {
      console.error("Errore nell'aggiornamento della quantità:", error);

      // Messaggio di errore più specifico
      let errorMessage = "Errore nell'aggiornamento della quantità";
      if (error.response?.status === 404) {
        errorMessage = "Prodotto non trovato";
      } else if (error.response?.status === 400) {
        errorMessage = "Dati non validi";
      } else if (error.code === "ERR_NETWORK") {
        errorMessage = "Errore di connessione al server";
      }

      setErrorMessage(errorMessage);
      // Auto-hide errore dopo 5 secondi
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue((product.quantity || 0).toString());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    } else if (
      e.key === "-" ||
      e.key === "." ||
      e.key === "e" ||
      e.key === "E"
    ) {
      e.preventDefault(); // Impedisci caratteri non validi
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 min-w-[120px]">
        <Input
          type="number"
          value={editValue}
          onChange={(e) => {
            const value = e.target.value;
            if (
              value === "" ||
              (parseInt(value) >= 0 && !isNaN(parseInt(value)))
            ) {
              setEditValue(value);
            }
          }}
          onKeyDown={handleKeyDown}
          onBlur={handleCancel}
          autoFocus
          size="sm"
          min="0"
          step="1"
          className="w-20"
          isDisabled={isLoading}
        />
      </div>
    );
  }

  const quantity = product.quantity || 0;
  const minStock = product.min_stock_treshold || 10;

  return (
    <div className="relative">
      <Tooltip
        content={
          <div className="px-1 py-2">
            <div className="text-small font-bold">Modifica Veloce</div>
            <div className="text-tiny">
              Doppio click per modificare la quantità
            </div>
          </div>
        }
        delay={1000}
        closeDelay={0}
      >
        <div
          className={`font-medium cursor-pointer hover:bg-default-100 rounded px-2 py-1 transition-all duration-300 ${
            showSuccess
              ? "bg-success/20 border border-success/40 scale-105"
              : ""
          } ${
            quantity > 0
              ? quantity <= minStock
                ? "text-warning"
                : "text-success"
              : "text-danger"
          }`}
          onDoubleClick={handleDoubleClick}
        >
          <div className="flex items-center gap-1">
            {quantity}
            {showSuccess && (
              <Icon
                icon="solar:check-circle-bold"
                className="text-success text-sm animate-bounce"
              />
            )}
            {quantity === 0 && !showSuccess && (
              <span className="text-xs ml-1 text-danger">(Non in stock)</span>
            )}
          </div>
        </div>
      </Tooltip>

      {/* Messaggio di errore */}
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
