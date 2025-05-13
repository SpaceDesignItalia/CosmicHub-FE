import { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Textarea,
  Select,
  SelectItem,
  Avatar,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useProductTheme } from "./ProductThemeWrapper";
import { useNavigate } from "react-router-dom";

// Interfaccia per i dati del nuovo prodotto
interface NewProduct {
  name: string;
  category: string;
  description: string;
  quantity: number;
  price: number;
  status: "Disponibile" | "Esaurito" | "Bassa giacenza";
  imageUrl: string;
  imageFile: File | null;
}

interface AddProductProps {
  categories: string[];
  onAddProduct: (product: Omit<NewProduct, "imageFile">) => Promise<void>;
}

export default function AddProduct({
  categories,
  onAddProduct,
}: AddProductProps) {
  const navigate = useNavigate();
  const { isDark, getCardClasses } = useProductTheme();
  const classes = getCardClasses();

  // Stato iniziale del nuovo prodotto
  const [newProduct, setNewProduct] = useState<NewProduct>({
    name: "",
    category: "",
    description: "",
    quantity: 0,
    price: 0,
    status: "Disponibile",
    imageUrl: "",
    imageFile: null,
  });

  // Stato per la gestione dell'anteprima dell'immagine
  const [imagePreviw, setImagePreview] = useState<string>("");

  // Stato per il caricamento
  const [isLoading, setIsLoading] = useState(false);

  // Stato per gli errori di validazione
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Gestione del cambio valore nei campi
  const handleInputChange = (field: keyof NewProduct, value: any) => {
    setNewProduct((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Rimuovi l'errore se il campo è stato compilato
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Gestione dell'upload dell'immagine
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
      setNewProduct((prev) => ({
        ...prev,
        imageFile: file,
        imageUrl: imageUrl,
      }));
    }
  };

  // Validazione del form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!newProduct.name.trim()) {
      newErrors.name = "Il nome del prodotto è obbligatorio";
    }

    if (!newProduct.category) {
      newErrors.category = "La categoria è obbligatoria";
    }

    if (newProduct.quantity < 0) {
      newErrors.quantity = "La quantità deve essere maggiore o uguale a 0";
    }

    if (newProduct.price <= 0) {
      newErrors.price = "Il prezzo deve essere maggiore di 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Invio del form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // In un'applicazione reale, qui gestiremmo l'upload dell'immagine
      // e otteniamo l'URL dell'immagine caricata
      const productToSave = {
        ...newProduct,
        imageUrl: newProduct.imageUrl || "https://via.placeholder.com/200",
      };

      await onAddProduct(productToSave);
      navigate("/inventory/products");
    } catch (error) {
      console.error("Errore durante il salvataggio del prodotto:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={classes.card}>
      <CardHeader className={classes.header}>
        <div className="flex justify-between items-center w-full">
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold">Aggiungi Nuovo Prodotto</h2>
            <p
              className={`text-sm ${
                isDark ? "text-zinc-400" : "text-zinc-500"
              }`}
            >
              Compila il form per aggiungere un nuovo prodotto all'inventario
            </p>
          </div>
          <Button
            variant="light"
            color="danger"
            startContent={<Icon icon="solar:arrow-left-linear" />}
            onClick={() => navigate("/inventory/products")}
          >
            Torna all'inventario
          </Button>
        </div>
      </CardHeader>
      <CardBody className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Colonna sinistra */}
            <div className="space-y-4">
              <div>
                <label
                  className={`block mb-2 text-sm font-medium ${
                    isDark ? "text-zinc-300" : "text-zinc-700"
                  }`}
                >
                  Nome Prodotto*
                </label>
                <Input
                  placeholder="Nome del prodotto"
                  value={newProduct.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  classNames={{
                    inputWrapper: classes.input,
                    input: isDark ? "text-white" : "",
                  }}
                  color={errors.name ? "danger" : "default"}
                  errorMessage={errors.name}
                  isRequired
                />
              </div>

              <div>
                <label
                  className={`block mb-2 text-sm font-medium ${
                    isDark ? "text-zinc-300" : "text-zinc-700"
                  }`}
                >
                  Categoria*
                </label>
                <Select
                  placeholder="Seleziona una categoria"
                  selectedKeys={
                    newProduct.category ? [newProduct.category] : []
                  }
                  onChange={(e) =>
                    handleInputChange("category", e.target.value)
                  }
                  classNames={{
                    trigger: classes.input,
                    value: isDark ? "text-white" : "",
                  }}
                  color={errors.category ? "danger" : "default"}
                  errorMessage={errors.category}
                  isRequired
                >
                  {categories
                    .filter((cat) => cat !== "Tutti")
                    .map((category) => (
                      <SelectItem key={category} textValue={category}>
                        {category}
                      </SelectItem>
                    ))}
                </Select>
              </div>

              <div>
                <label
                  className={`block mb-2 text-sm font-medium ${
                    isDark ? "text-zinc-300" : "text-zinc-700"
                  }`}
                >
                  Quantità*
                </label>
                <Input
                  type="number"
                  placeholder="Quantità disponibile"
                  value={newProduct.quantity.toString()}
                  onChange={(e) =>
                    handleInputChange("quantity", parseInt(e.target.value) || 0)
                  }
                  classNames={{
                    inputWrapper: classes.input,
                    input: isDark ? "text-white" : "",
                  }}
                  color={errors.quantity ? "danger" : "default"}
                  errorMessage={errors.quantity}
                  isRequired
                />
              </div>

              <div>
                <label
                  className={`block mb-2 text-sm font-medium ${
                    isDark ? "text-zinc-300" : "text-zinc-700"
                  }`}
                >
                  Prezzo (€)*
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Prezzo in Euro"
                  value={newProduct.price.toString()}
                  onChange={(e) =>
                    handleInputChange("price", parseFloat(e.target.value) || 0)
                  }
                  startContent={
                    <div className="pointer-events-none flex items-center">
                      <span
                        className={isDark ? "text-zinc-400" : "text-zinc-500"}
                      >
                        €
                      </span>
                    </div>
                  }
                  classNames={{
                    inputWrapper: classes.input,
                    input: isDark ? "text-white" : "",
                  }}
                  color={errors.price ? "danger" : "default"}
                  errorMessage={errors.price}
                  isRequired
                />
              </div>

              <div>
                <label
                  className={`block mb-2 text-sm font-medium ${
                    isDark ? "text-zinc-300" : "text-zinc-700"
                  }`}
                >
                  Stato
                </label>
                <Select
                  placeholder="Seleziona lo stato"
                  defaultSelectedKeys={["Disponibile"]}
                  onChange={(e) =>
                    handleInputChange(
                      "status",
                      e.target.value as
                        | "Disponibile"
                        | "Esaurito"
                        | "Bassa giacenza"
                    )
                  }
                  classNames={{
                    trigger: classes.input,
                    value: isDark ? "text-white" : "",
                  }}
                >
                  <SelectItem key="Disponibile">Disponibile</SelectItem>
                  <SelectItem key="Bassa giacenza">Bassa giacenza</SelectItem>
                  <SelectItem key="Esaurito">Esaurito</SelectItem>
                </Select>
              </div>
            </div>

            {/* Colonna destra */}
            <div className="space-y-4">
              <div>
                <label
                  className={`block mb-2 text-sm font-medium ${
                    isDark ? "text-zinc-300" : "text-zinc-700"
                  }`}
                >
                  Descrizione
                </label>
                <Textarea
                  placeholder="Descrizione del prodotto"
                  value={newProduct.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  classNames={{
                    inputWrapper: classes.input,
                    input: isDark ? "text-white" : "",
                  }}
                  minRows={3}
                />
              </div>

              <div>
                <label
                  className={`block mb-2 text-sm font-medium ${
                    isDark ? "text-zinc-300" : "text-zinc-700"
                  }`}
                >
                  Immagine del Prodotto
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center ${
                    isDark
                      ? "border-zinc-700 bg-zinc-800"
                      : "border-zinc-300 bg-zinc-50"
                  }`}
                >
                  {imagePreviw ? (
                    <div className="flex flex-col items-center">
                      <Avatar
                        src={imagePreviw}
                        className="w-40 h-40 object-cover mb-3"
                        radius="lg"
                      />
                      <Button
                        color="danger"
                        variant="light"
                        size="sm"
                        onClick={() => {
                          setImagePreview("");
                          setNewProduct((prev) => ({
                            ...prev,
                            imageFile: null,
                            imageUrl: "",
                          }));
                        }}
                      >
                        Rimuovi immagine
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Icon
                        icon="solar:gallery-add-linear"
                        className={`w-16 h-16 mb-2 ${
                          isDark ? "text-zinc-600" : "text-zinc-400"
                        }`}
                      />
                      <p
                        className={`mb-2 ${
                          isDark ? "text-zinc-400" : "text-zinc-600"
                        }`}
                      >
                        Clicca per caricare un'immagine
                      </p>
                      <input
                        type="file"
                        id="image-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                      <Button
                        color="primary"
                        variant="flat"
                        onClick={() =>
                          document.getElementById("image-upload")?.click()
                        }
                      >
                        Carica immagine
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <Button
              variant="light"
              onClick={() => navigate("/inventory/products")}
              className={isDark ? "bg-zinc-800 text-white" : ""}
            >
              Annulla
            </Button>
            <Button
              color="primary"
              type="submit"
              isLoading={isLoading}
              startContent={
                !isLoading && <Icon icon="solar:check-circle-bold" />
              }
            >
              Salva Prodotto
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
