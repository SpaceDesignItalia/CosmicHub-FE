import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Textarea,
  Select,
  SelectItem,
  Avatar,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useProductTheme } from "./ProductThemeWrapper";
import { useNavigate, useParams } from "react-router-dom";

// Interfaccia per i dati del prodotto
interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  quantity: number;
  price: number;
  status: "Disponibile" | "Esaurito" | "Bassa giacenza";
  imageUrl: string;
  imageFile: File | null;
}

interface EditProductProps {
  categories: string[];
  onUpdateProduct: (
    id: string,
    product: Omit<Product, "id" | "imageFile">
  ) => Promise<void>;
  getProduct: (id: string) => Promise<Product>;
}

export default function EditProduct({
  categories,
  onUpdateProduct,
  getProduct,
}: EditProductProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark, getCardClasses } = useProductTheme();
  const classes = getCardClasses();

  // Stato iniziale del prodotto
  const [product, setProduct] = useState<Product | null>(null);

  // Stato per la gestione dell'anteprima dell'immagine
  const [imagePreview, setImagePreview] = useState<string>("");

  // Stato per il caricamento
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stato per gli errori di validazione
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Carica i dati del prodotto all'avvio
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const data = await getProduct(id);
        setProduct(data);
        if (data.imageUrl) {
          setImagePreview(data.imageUrl);
        }
      } catch (error) {
        console.error("Errore durante il caricamento del prodotto:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id, getProduct]);

  // Gestione del cambio valore nei campi
  const handleInputChange = (field: keyof Omit<Product, "id">, value: any) => {
    if (!product) return;

    setProduct((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [field]: value,
      };
    });

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
    if (file && product) {
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
      setProduct((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          imageFile: file,
          imageUrl: imageUrl,
        };
      });
    }
  };

  // Validazione del form
  const validateForm = (): boolean => {
    if (!product) return false;

    const newErrors: Record<string, string> = {};

    if (!product.name.trim()) {
      newErrors.name = "Il nome del prodotto è obbligatorio";
    }

    if (!product.category) {
      newErrors.category = "La categoria è obbligatoria";
    }

    if (product.quantity < 0) {
      newErrors.quantity = "La quantità deve essere maggiore o uguale a 0";
    }

    if (product.price <= 0) {
      newErrors.price = "Il prezzo deve essere maggiore di 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Invio del form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!product || !id) return;

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // In un'applicazione reale, qui gestiremmo l'upload dell'immagine
      // e otteniamo l'URL dell'immagine caricata
      const { id: _, imageFile: __, ...productToUpdate } = product;

      await onUpdateProduct(id, productToUpdate);
      navigate("/inventory/products");
    } catch (error) {
      console.error("Errore durante l'aggiornamento del prodotto:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6 text-center border rounded-lg shadow-sm">
        <Icon
          icon="solar:document-missing-broken"
          className={`w-16 h-16 mx-auto mb-4 ${
            isDark ? "text-zinc-600" : "text-zinc-400"
          }`}
        />
        <h2 className="text-xl font-semibold mb-2">Prodotto non trovato</h2>
        <p className={`mb-4 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
          Il prodotto che stai cercando non esiste o è stato rimosso.
        </p>
        <Button
          color="primary"
          startContent={<Icon icon="solar:arrow-left-linear" />}
          onClick={() => navigate("/inventory/products")}
        >
          Torna all'inventario
        </Button>
      </div>
    );
  }

  return (
    <Card className={classes.card}>
      <CardHeader className={classes.header}>
        <div className="flex justify-between items-center w-full">
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold">Modifica Prodotto</h2>
            <p
              className={`text-sm ${
                isDark ? "text-zinc-400" : "text-zinc-500"
              }`}
            >
              Modifica i dettagli del prodotto {product.name}
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
                  value={product.name}
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
                  selectedKeys={product.category ? [product.category] : []}
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
                  value={product.quantity.toString()}
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
                  value={product.price.toString()}
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
                  selectedKeys={[product.status]}
                  onChange={(e) =>
                    handleInputChange("status", e.target.value as any)
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
                  value={product.description || ""}
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
                  {imagePreview ? (
                    <div className="flex flex-col items-center">
                      <Avatar
                        src={imagePreview}
                        className="w-40 h-40 object-cover mb-3"
                        radius="lg"
                      />
                      <div className="flex gap-2">
                        <Button
                          color="danger"
                          variant="light"
                          size="sm"
                          onClick={() => {
                            setImagePreview("");
                            setProduct((prev) => {
                              if (!prev) return null;
                              return {
                                ...prev,
                                imageFile: null,
                                imageUrl: "",
                              };
                            });
                          }}
                        >
                          Rimuovi
                        </Button>
                        <Button
                          color="primary"
                          variant="flat"
                          size="sm"
                          onClick={() =>
                            document
                              .getElementById("edit-image-upload")
                              ?.click()
                          }
                        >
                          Cambia
                        </Button>
                      </div>
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
                      <Button
                        color="primary"
                        variant="flat"
                        onClick={() =>
                          document.getElementById("edit-image-upload")?.click()
                        }
                      >
                        Carica immagine
                      </Button>
                    </div>
                  )}
                  <input
                    type="file"
                    id="edit-image-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>

              <div className="mt-4">
                <div
                  className={`p-4 rounded-lg ${
                    isDark ? "bg-zinc-800" : "bg-zinc-100"
                  }`}
                >
                  <h3
                    className={`text-sm font-semibold mb-2 ${
                      isDark ? "text-zinc-300" : "text-zinc-700"
                    }`}
                  >
                    Informazioni Prodotto
                  </h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <p
                        className={`text-xs ${
                          isDark ? "text-zinc-500" : "text-zinc-600"
                        }`}
                      >
                        ID Prodotto
                      </p>
                      <p
                        className={`text-sm font-medium ${
                          isDark ? "text-zinc-300" : "text-zinc-700"
                        }`}
                      >
                        {product.id}
                      </p>
                    </div>
                    <div>
                      <p
                        className={`text-xs ${
                          isDark ? "text-zinc-500" : "text-zinc-600"
                        }`}
                      >
                        Stato Attuale
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            product.status === "Disponibile"
                              ? "bg-success"
                              : product.status === "Bassa giacenza"
                              ? "bg-warning"
                              : "bg-danger"
                          }`}
                        ></span>
                        <p
                          className={`text-sm font-medium ${
                            isDark ? "text-zinc-300" : "text-zinc-700"
                          }`}
                        >
                          {product.status}
                        </p>
                      </div>
                    </div>
                  </div>
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
              isLoading={isSubmitting}
              startContent={!isSubmitting && <Icon icon="solar:disk-bold" />}
            >
              Salva Modifiche
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
