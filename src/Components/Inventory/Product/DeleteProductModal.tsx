import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Avatar,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useProductTheme } from "./ProductThemeWrapper";

interface Product {
  product_id: string;
  id?: string; // Per retrocompatibilità
  name: string;
  image?: string;
  sku?: string;
}

interface DeleteProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}

export default function DeleteProductModal({
  product,
  isOpen,
  onClose,
  onDelete,
}: DeleteProductModalProps) {
  const { isDark } = useProductTheme();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!product) return;

    setIsDeleting(true);
    try {
      // Usa product_id se disponibile, altrimenti fallback su id
      await onDelete(product.product_id || product.id || "");
      onClose();
    } catch (error) {
      console.error("Errore durante l'eliminazione del prodotto:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      backdrop="blur"
      radius="lg"
      classNames={{
        base: isDark
          ? "bg-zinc-900 text-white border border-zinc-700"
          : "border border-zinc-200",
        header: isDark ? "border-b border-zinc-700" : "",
        body: isDark ? "text-zinc-300" : "",
        footer: isDark ? "border-t border-zinc-700" : "",
      }}
    >
      <ModalContent>
        {product && (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h3 className="text-xl font-semibold">Conferma Eliminazione</h3>
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col items-center text-center mb-4">
                <div className="p-3 bg-danger-100 rounded-full mb-4">
                  <Icon
                    icon="solar:trash-bin-trash-bold"
                    width={30}
                    className="text-danger"
                  />
                </div>
                <h4 className="text-lg font-semibold mb-2">
                  Eliminare questo prodotto?
                </h4>
                <p
                  className={`mb-4 ${
                    isDark ? "text-zinc-400" : "text-zinc-600"
                  }`}
                >
                  Stai per eliminare <strong>{product.name}</strong>. Questa
                  azione non può essere annullata.
                </p>

                <div
                  className={`p-4 rounded-lg w-full flex items-center gap-3 ${
                    isDark ? "bg-zinc-800" : "bg-zinc-100"
                  }`}
                >
                  <Avatar
                    src={product.image || "https://via.placeholder.com/40"}
                    size="md"
                    radius="lg"
                    className="flex-shrink-0"
                  />
                  <div className="text-left">
                    <p className="font-medium">{product.name}</p>
                    <p
                      className={`text-xs ${
                        isDark ? "text-zinc-400" : "text-zinc-500"
                      }`}
                    >
                      {product.sku ? `SKU: ${product.sku}` : `ID: ${product.product_id || product.id}`}
                    </p>
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="light"
                onPress={onClose}
                className={isDark ? "bg-zinc-800 text-white" : ""}
                disabled={isDeleting}
              >
                Annulla
              </Button>
              <Button
                color="danger"
                onPress={handleDelete}
                isLoading={isDeleting}
                startContent={
                  !isDeleting && <Icon icon="solar:trash-bin-trash-bold" />
                }
              >
                Elimina
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
