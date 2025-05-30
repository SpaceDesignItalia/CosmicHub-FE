import {
  Autocomplete,
  AutocompleteItem,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Chip,
  DatePicker,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  Radio,
  RadioGroup,
  Select,
  SelectItem,
  Switch,
  Tab,
  Tabs,
  Textarea,
  Tooltip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { parseDate } from "@internationalized/date";
import { BrowserMultiFormatReader, Exception, Result } from "@zxing/library";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomTheme } from "../../../providers/ThemeProvider";

interface ProductFormData {
  name: string;
  sku: string;
  description: string;
  price: string;
  minStockThreshold: string;
  barcode: string;
  qrCode: string;
  supplier: string;
  category: string;
  brand: string;
  weight: string;
  dimensions: string;
  location: string;
  notes: string;
  photos: FileWithPreview[];
  documents: FileWithPreview[];
  certifications: FileWithPreview[];
  barcodeType: "manual" | "auto" | "scan";
  qrCodeType: "manual" | "auto" | "scan";
  attributes: ProductAttribute[];
  // Campi per il gestionale di magazzino
  costPrice: string;
  vatRate: string;
  reorderQuantity: string; // Quantità di riordino consigliata
  stockUnit: string; // Quantità disponibile (stock)
  warehouse: string;
  leadTime?: string;
}

interface FileWithPreview extends File {
  preview: string;
}

interface Brand {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface Warehouse {
  WarehouseID: string;
  WarehouseUUID: string;
  WarehouseName: string;
  WarehouseCode: string;
  WarehouseCountry: string;
  IsActive: boolean;
}

interface ApiResponse {
  attribute_id: string | null;
  category_id: string;
  category_name: string;
  name: string | null;
  type: string | null;
  isRequired: boolean;
}

interface CategoryAttribute {
  id: string;
  name: string;
  type: string;
  isRequired: boolean;
}

interface Category {
  id: string;
  name: string;
  attributes: CategoryAttribute[];
}

interface TabError {
  tab: string;
  count: number;
}

interface ScannerOverlayProps {
  type: "barcode" | "qrcode";
  onClose: () => void;
  error: string | null;
  hasAttemptedScan: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onCameraChange: (deviceId: string) => void;
  availableCameras: MediaDeviceInfo[];
  selectedCamera: string;
  onScanSuccess: (code: string) => void;
}

interface ProductAttribute {
  id: string;
  name: string;
  type: string;
  value: string;
  isRequired: boolean;
}

function ScannerOverlay({
  type,
  onClose,
  error,
  hasAttemptedScan,
  videoRef,
  onCameraChange,
  availableCameras,
  selectedCamera,
  onScanSuccess,
}: ScannerOverlayProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const successSound = useRef<HTMLAudioElement | null>(null);
  const { isDark } = useCustomTheme();

  useEffect(() => {
    // Inizializza il suono di successo
    successSound.current = new Audio("/sounds/success.mp3");
  }, []);

  const handleScanSuccess = (code: string) => {
    setShowSuccess(true);
    // Riproduci il suono di successo
    successSound.current?.play();
    setTimeout(() => {
      setShowSuccess(false);
      onScanSuccess(code);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/80 dark:bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={`relative w-full max-w-2xl mx-4 ${
          isDark ? "bg-zinc-900" : "bg-white"
        } rounded-2xl overflow-hidden shadow-xl`}
      >
        {/* Header con controlli */}
        <Card
          radius="none"
          className={`${
            isDark
              ? "bg-zinc-800 border-b border-zinc-700"
              : "bg-zinc-50 border-b border-zinc-200"
          }`}
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div
                className={`p-2 rounded-lg ${
                  isDark ? "bg-primary/20" : "bg-primary/10"
                }`}
              >
                <Icon
                  icon={
                    type === "barcode"
                      ? "solar:barcode-2-bold"
                      : "solar:qr-code-bold"
                  }
                  className={`text-xl ${
                    isDark ? "text-primary-400" : "text-primary"
                  }`}
                />
              </div>
              <div>
                <h3
                  className={`text-lg font-medium ${
                    isDark ? "text-zinc-100" : "text-zinc-800"
                  }`}
                >
                  Scansiona {type === "barcode" ? "Codice a Barre" : "QR Code"}
                </h3>
                <p
                  className={`text-sm ${
                    isDark ? "text-zinc-400" : "text-zinc-500"
                  }`}
                >
                  {type === "barcode"
                    ? "Posiziona il codice a barre nell'area di scansione"
                    : "Centra il QR code nel riquadro"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select
                selectedKeys={[selectedCamera]}
                onChange={(e) => onCameraChange(e.target.value)}
                variant="bordered"
                color="primary"
                size="sm"
                startContent={<Icon icon="solar:camera-bold" />}
                classNames={{
                  trigger: isDark
                    ? "bg-zinc-700 border-zinc-600"
                    : "bg-white border-zinc-200",
                  base: "max-w-[180px]",
                }}
              >
                {availableCameras.map((camera) => (
                  <SelectItem key={camera.deviceId} textValue={camera.label}>
                    {camera.label || `Camera ${camera.deviceId.slice(0, 4)}`}
                  </SelectItem>
                ))}
              </Select>
              <Button
                isIconOnly
                color={isDark ? "default" : "default"}
                variant="flat"
                onClick={onClose}
                className={
                  isDark
                    ? "bg-zinc-700 text-zinc-300"
                    : "bg-zinc-100 text-zinc-700"
                }
              >
                <Icon icon="solar:close-circle-bold" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Area di scansione principale */}
        <div className="relative w-full aspect-[4/3] overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            autoPlay
          />

          {/* Overlay di scansione */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={`relative ${
                type === "barcode" ? "w-96 h-48" : "w-72 h-72"
              }`}
            >
              {/* Mascheratura esterna con effetto vignette */}
              <div className="absolute -inset-[1000px] bg-gradient-to-b from-black/70 via-transparent to-black/70">
                <div
                  className={`absolute left-[1000px] top-[1000px] ${
                    type === "barcode" ? "w-96 h-48" : "w-72 h-72"
                  } bg-transparent`}
                />
              </div>

              {/* Bordo area di scansione con effetto glow */}
              <div
                className={`absolute inset-0 border-2 ${
                  showSuccess ? "border-success" : "border-primary"
                } rounded-lg shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)] transition-colors duration-300`}
              />

              {/* Guide specifiche per tipo */}
              {type === "barcode" ? (
                <>
                  {/* Guide per codice a barre */}
                  <div className="absolute inset-0">
                    {/* Linee verticali guida con effetto pulse */}
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-primary/50 animate-pulse" />
                    <div className="absolute right-0 top-0 bottom-0 w-px bg-primary/50 animate-pulse" />

                    {/* Area centrale evidenziata */}
                    <div className="absolute inset-y-0 left-1/4 right-1/4 border-l border-r border-primary/40" />

                    {/* Linea di scansione verticale con effetto glow */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-primary/70 animate-scan-vertical left-1/2 -translate-x-1/2 shadow-[0_0_10px_rgba(var(--primary-rgb),0.6)]" />
                  </div>

                  {/* Angoli per barcode con effetto glow */}
                  <div className="absolute inset-0">
                    <div className="absolute left-0 top-0 w-8 h-full border-l-2 border-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.4)]" />
                    <div className="absolute right-0 top-0 w-8 h-full border-r-2 border-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.4)]" />
                  </div>
                </>
              ) : (
                <>
                  {/* Guide per QR code */}
                  <div className="absolute inset-0">
                    {/* Griglia guida con effetto fade */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-50">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="border-primary/30 border-r last:border-r-0"
                        />
                      ))}
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="border-primary/30 border-b last:border-b-0"
                        />
                      ))}
                    </div>

                    {/* Angoli QR con effetto glow */}
                    {[
                      "top-0 left-0",
                      "top-0 right-0",
                      "bottom-0 left-0",
                      "bottom-0 right-0",
                    ].map((position) => (
                      <div key={position} className={`absolute ${position}`}>
                        <div className="relative w-12 h-12">
                          <div
                            className={`absolute inset-0 border-2 ${
                              showSuccess ? "border-success" : "border-primary"
                            } rounded-lg shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)] transition-colors duration-300`}
                          />
                          <div
                            className={`absolute inset-2 border ${
                              showSuccess
                                ? "border-success/60"
                                : "border-primary/60"
                            } rounded-md transition-colors duration-300`}
                          />
                          <div
                            className={`absolute inset-4 ${
                              showSuccess ? "bg-success/40" : "bg-primary/40"
                            } rounded animate-pulse transition-colors duration-300`}
                          />
                        </div>
                      </div>
                    ))}

                    {/* Linea di scansione diagonale per QR con effetto glow */}
                    <div
                      className={`absolute top-0 left-0 w-[141%] h-0.5 ${
                        showSuccess ? "bg-success/60" : "bg-primary/60"
                      } animate-scan-diagonal origin-top-left shadow-[0_0_10px_rgba(var(--primary-rgb),0.6)] transition-colors duration-300`}
                      style={{ transform: "rotate(45deg)" }}
                    />
                  </div>
                </>
              )}

              {/* Success indicator */}
              {showSuccess && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-success/30 flex items-center justify-center animate-success-pop animate-pulse-glow">
                    <div className="relative w-12 h-12 animate-success-scan">
                      <svg
                        className="w-full h-full"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          className="stroke-success-500 stroke-2 fill-none"
                        />
                        <path
                          d="M8 12l3 3 5-6"
                          className="stroke-success-500 stroke-2 fill-none animate-checkmark-draw"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Indicatore di stato */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
            <div
              className={`w-2 h-2 rounded-full ${
                showSuccess ? "bg-success" : "bg-primary"
              } animate-pulse`}
            />
            <span className="text-white/90 text-sm">
              {showSuccess ? "Codice rilevato!" : "In attesa di scansione..."}
            </span>
          </div>
        </div>

        {/* Suggerimenti e feedback */}
        <div
          className={`p-4 text-center ${
            isDark ? "bg-zinc-800/70" : "bg-zinc-50/90"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Icon icon="solar:lightbulb-bold" className="text-yellow-500" />
            <p
              className={`text-xs ${
                isDark ? "text-yellow-200/80" : "text-yellow-600/90"
              }`}
            >
              {type === "barcode"
                ? "Suggerimento: Mantieni il codice parallelo alle linee verticali e assicurati che sia ben illuminato"
                : "Suggerimento: Assicurati che tutti e 4 gli angoli siano visibili e che il QR code sia ben illuminato"}
            </p>
          </div>
        </div>

        {/* Errore (mostrato solo dopo un tentativo fallito) */}
        {error && hasAttemptedScan && (
          <div className="p-4">
            <div
              className={`${
                isDark
                  ? "bg-danger/20 border-danger/30"
                  : "bg-danger/10 border-danger/20"
              } border rounded-lg p-4`}
            >
              <div className="flex items-start gap-3">
                <Icon
                  icon="solar:danger-triangle-bold"
                  className="text-danger text-xl mt-0.5"
                />
                <div>
                  <p className="text-danger font-medium">
                    {error.split("\n\n")[0]}
                  </p>
                  {error.split("\n\n")[1] && (
                    <p
                      className={`${
                        isDark ? "text-danger/90" : "text-danger/80"
                      } text-sm mt-1`}
                    >
                      {error.split("\n\n")[1]}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Aggiorna le animazioni
const styles = {
  "@keyframes scan": {
    "0%": {
      top: "0%",
    },
    "50%": {
      top: "97%",
    },
    "100%": {
      top: "0%",
    },
  },
  "@keyframes scanVertical": {
    "0%": {
      left: "25%",
    },
    "50%": {
      left: "75%",
    },
    "100%": {
      left: "25%",
    },
  },
  "@keyframes scanDiagonal": {
    "0%": {
      top: "0%",
      left: "0%",
    },
    "50%": {
      top: "100%",
      left: "100%",
    },
    "100%": {
      top: "0%",
      left: "0%",
    },
  },
  "@keyframes success-pop": {
    "0%": {
      transform: "scale(0.8)",
      opacity: "0",
    },
    "50%": {
      transform: "scale(1.05)",
    },
    "100%": {
      transform: "scale(1)",
      opacity: "1",
    },
  },
  "@keyframes fade-in": {
    "0%": {
      opacity: "0",
    },
    "100%": {
      opacity: "1",
    },
  },
  "@keyframes pulse-glow": {
    "0%": {
      boxShadow: "0 0 5px rgba(var(--primary-rgb),0.5)",
    },
    "50%": {
      boxShadow: "0 0 20px rgba(var(--primary-rgb),0.8)",
    },
    "100%": {
      boxShadow: "0 0 5px rgba(var(--primary-rgb),0.5)",
    },
  },
  "@keyframes success-scan": {
    "0%": {
      opacity: "0.6",
      transform: "scale(0.95)",
    },
    "50%": {
      opacity: "1",
      transform: "scale(1.02)",
    },
    "100%": {
      opacity: "0.6",
      transform: "scale(0.95)",
    },
  },
  "@keyframes checkmark-draw": {
    "0%": {
      strokeDashoffset: "100",
    },
    "100%": {
      strokeDashoffset: "0",
    },
  },
};

const customStyles = {
  ".animate-scan": {
    animation: "scan 2s linear infinite",
  },
  ".animate-scan-vertical": {
    animation: "scanVertical 2s linear infinite",
  },
  ".animate-scan-diagonal": {
    animation: "scanDiagonal 2s linear infinite",
  },
  ".animate-success-pop": {
    animation: "success-pop 0.3s ease-out forwards",
  },
  ".animate-fade-in": {
    animation: "fade-in 0.3s ease-out forwards",
  },
  ".animate-pulse-glow": {
    animation: "pulse-glow 1.5s ease-in-out infinite",
  },
  ".animate-success-scan": {
    animation: "success-scan 1.2s ease-in-out infinite",
  },
  ".animate-checkmark-draw": {
    animation: "checkmark-draw 0.5s ease-in-out forwards",
    strokeDasharray: "100",
    strokeDashoffset: "100",
  },
};

export default function AddProduct() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [brandQuery, setBrandQuery] = useState("");
  const [categoryQuery, setCategoryQuery] = useState("");
  const [supplierQuery, setSupplierQuery] = useState("");
  const [formProgress, setFormProgress] = useState(0);
  const [tabErrors, setTabErrors] = useState<TabError[]>([]);
  const [selectedCategoryAttributes, setSelectedCategoryAttributes] = useState<
    CategoryAttribute[]
  >([]);
  const [customAttributes, setCustomAttributes] = useState<ProductAttribute[]>(
    []
  );
  const { isDark } = useCustomTheme();
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    sku: "",
    description: "",
    price: "",
    minStockThreshold: "",
    barcode: "",
    qrCode: "",
    supplier: "",
    category: "",
    brand: "",
    weight: "",
    dimensions: "",
    location: "",
    notes: "",
    photos: [],
    documents: [],
    certifications: [],
    barcodeType: "manual",
    qrCodeType: "manual",
    attributes: [],
    costPrice: "",
    vatRate: "",
    reorderQuantity: "",
    stockUnit: "",
    warehouse: "",
    leadTime: "",
  });
  const [isDraggingPhotos, setIsDraggingPhotos] = useState(false);
  const [isDraggingDocs, setIsDraggingDocs] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerType, setScannerType] = useState<"barcode" | "qrcode">(
    "barcode"
  );
  const [scannerError, setScannerError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const [cameraPermissionState, setCameraPermissionState] = useState<
    "prompt" | "granted" | "denied"
  >("prompt");
  const [isInitializingCamera, setIsInitializingCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasAttemptedScan, setHasAttemptedScan] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>(
    []
  );
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [showScanSuccess, setShowScanSuccess] = useState(false);
  const [scannedCode, setScannedCode] = useState<string>("");
  const [showBarcodePopover, setShowBarcodePopover] = useState<boolean>(false);
  const [showQRCodePopover, setShowQRCodePopover] = useState<boolean>(false);
  const [isSkuAutoGenerated, setIsSkuAutoGenerated] = useState<boolean>(false);
  const [isBarcodeSearching, setIsBarcodeSearching] = useState<boolean>(false);
  const [barcodeSearchResult, setBarcodeSearchResult] = useState<any>(null);
  const [showBarcodeInfo, setShowBarcodeInfo] = useState<boolean>(false);

  useEffect(() => {
    loadInitialData();
    loadSuppliers();
    loadWarehouses();
  }, []);

  // Effetto per recuperare il magazzino selezionato dalla sidebar
  useEffect(() => {
    const selectedWarehouseFromSidebar =
      localStorage.getItem("selectedWarehouse");
    if (
      selectedWarehouseFromSidebar &&
      !formData.warehouse &&
      warehouses.length > 0
    ) {
      // Verifica che il magazzino selezionato sia ancora disponibile nella lista
      const warehouseExists = warehouses.some(
        (warehouse) =>
          (warehouse.WarehouseUUID || warehouse.WarehouseID) ===
          selectedWarehouseFromSidebar
      );

      if (warehouseExists) {
        setFormData((prev) => ({
          ...prev,
          warehouse: selectedWarehouseFromSidebar,
        }));
      }
    }
  }, [warehouses, formData.warehouse]); // Dipende da warehouses e formData.warehouse

  // Funzione per pulire e normalizzare il testo
  const cleanText = (text: string): string => {
    return text
      .normalize("NFD") // Decompone i caratteri accentati
      .replace(/[\u0300-\u036f]/g, "") // Rimuove gli accenti
      .replace(/[^a-zA-Z0-9\s]/g, "") // Rimuove caratteri speciali
      .trim()
      .toUpperCase();
  };

  // Funzione per generare SKU automatico
  const generateSKU = (
    productName: string,
    category: string = "",
    brand: string = ""
  ) => {
    if (!productName.trim()) return "";

    const cleanName = cleanText(productName);
    if (!cleanName) return "";

    let sku = "";

    // Strategia intelligente per generare il codice base
    const words = cleanName.split(/\s+/).filter((word) => word.length > 0);

    if (words.length === 1) {
      // Una sola parola
      const word = words[0];
      if (word.length <= 3) {
        sku = word;
      } else if (word.length <= 6) {
        sku = word.substring(0, 3);
      } else {
        // Per parole lunghe, prendi consonanti principali
        const consonants = word.replace(/[AEIOU]/g, "");
        sku =
          consonants.length >= 3
            ? consonants.substring(0, 3)
            : word.substring(0, 3);
      }
    } else if (words.length === 2) {
      // Due parole: prendi le prime 3 lettere della prima e 2 della seconda
      sku = words[0].substring(0, 3) + words[1].substring(0, 2);
    } else {
      // Tre o più parole: prendi le prime lettere delle prime 3 parole
      sku = words
        .slice(0, 3)
        .map((word, index) => word.substring(0, index === 0 ? 3 : 2))
        .join("");
    }

    // Assicurati che lo SKU base sia di almeno 3 caratteri
    if (sku.length < 3) {
      sku = sku.padEnd(3, "X");
    }

    // Limita la lunghezza massima del codice base
    if (sku.length > 6) {
      sku = sku.substring(0, 6);
    }

    // Genera numero progressivo basato su timestamp più preciso
    const now = new Date();
    const timeComponent = (now.getTime() % 1000000)
      .toString()
      .slice(-3)
      .padStart(3, "0");

    // Formato finale: [CATEGORIA-]PRODOTTO-NUMERO
    let finalSku = sku + "-" + timeComponent;

    // Aggiungi prefisso categoria se disponibile
    if (category) {
      const categoryPrefix = cleanText(category).substring(0, 3);
      if (categoryPrefix) {
        finalSku = categoryPrefix + "-" + finalSku;
      }
    }

    return finalSku;
  };

  // Funzione per verificare unicità SKU (simulazione)
  const checkSkuUniqueness = async (sku: string): Promise<boolean> => {
    // TODO: Implementare chiamata API per verificare unicità
    // Per ora simuliamo con un controllo locale
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simula che alcuni SKU potrebbero già esistere
        const existingSKUs = ["BAN-123", "MEL-456", "APP-789"];
        resolve(!existingSKUs.includes(sku));
      }, 300);
    });
  };

  // Effetto per generare SKU automaticamente quando cambia il nome
  useEffect(() => {
    if (formData.name && (!formData.sku || isSkuAutoGenerated)) {
      const generatedSku = generateSKU(
        formData.name,
        formData.category,
        formData.brand
      );
      if (generatedSku) {
        setFormData((prev) => ({ ...prev, sku: generatedSku }));
        setIsSkuAutoGenerated(true);
      }
    }
  }, [formData.name, formData.category, formData.brand]);

  // Effetto per cercare automaticamente informazioni quando viene inserito un barcode
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (
        formData.barcode &&
        formData.barcode.length >= 8 &&
        !isBarcodeSearching
      ) {
        // Verifica che sia un barcode valido (solo numeri per EAN/UPC)
        const isValidBarcode = /^\d{8,14}$/.test(formData.barcode);
        if (isValidBarcode) {
          searchProductByBarcode(formData.barcode);
        }
      }
    }, 1000); // Aspetta 1 secondo dopo che l'utente smette di digitare

    return () => clearTimeout(searchTimeout);
  }, [formData.barcode, isBarcodeSearching]);

  useEffect(() => {
    // Calculate form completion progress
    const requiredFields: (keyof ProductFormData)[] = [
      "name",
      "sku",
      "category",
      "price",
      "minStockThreshold",
      "supplier",
      "warehouse",
    ];
    const completedFields = requiredFields.filter(
      (field) => formData[field] && formData[field].toString().trim() !== ""
    );
    setFormProgress((completedFields.length / requiredFields.length) * 100);

    // Calculate errors per tab
    const errors: TabError[] = [];
    if (!formData.name || !formData.sku || !formData.category) {
      const missingBasicFields = ["name", "sku", "category"].filter(
        (f) => !formData[f as keyof ProductFormData]
      );
      errors.push({
        tab: "basic",
        count: missingBasicFields.length,
      });
    }
    if (!formData.price || !formData.supplier || !formData.warehouse) {
      const missingCommercialFields = ["price", "supplier", "warehouse"].filter(
        (f) => !formData[f as keyof ProductFormData]
      );
      errors.push({
        tab: "commercial",
        count: missingCommercialFields.length,
      });
    }
    if (!formData.minStockThreshold) {
      errors.push({ tab: "warehouse", count: 1 });
    }
    setTabErrors(errors);
  }, [formData]);

  // Calcola il prezzo finale considerando IVA
  const calculateFinalPrice = () => {
    const basePrice = parseFloat(formData.price) || 0;
    const vatRate = parseFloat(formData.vatRate) || 0;
    const costPrice = parseFloat(formData.costPrice) || 0;

    // Calcola il prezzo con IVA
    const finalPrice = basePrice * (1 + vatRate / 100);

    // Calcola il margine solo se c'è un costo
    let margin = null;
    if (costPrice > 0 && basePrice > 0) {
      margin = ((basePrice - costPrice) / basePrice) * 100;
      margin = margin > 0 ? margin : 0;
    }

    return {
      basePrice,
      finalPrice: vatRate > 0 ? finalPrice : null,
      margin,
    };
  };

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/Product/GET/GetAllCategories");
      const rawData: ApiResponse[] = response.data;

      // Group by category_id and transform into desired format
      console.log("rawData", rawData);
      const groupedCategories = rawData.reduce(
        (acc: { [key: string]: Category }, curr) => {
          if (!acc[curr.category_id]) {
            // Initialize new category
            acc[curr.category_id] = {
              id: curr.category_id,
              name: curr.category_name,
              attributes: [],
            };
          }

          // Add attribute only if it exists (not null)
          if (curr.name && curr.type && curr.attribute_id) {
            acc[curr.category_id].attributes.push({
              id: curr.attribute_id,
              name: curr.name,
              type: curr.type,
              isRequired: curr.isRequired,
            });
          }

          return acc;
        },
        {}
      );

      // Convert to array and set state
      setCategories(Object.values(groupedCategories));
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      // TODO: Sostituire con la chiamata API reale
      const mockSuppliers: Supplier[] = [
        { id: "1", name: "Fornitore 1" },
        { id: "2", name: "Fornitore 2" },
        { id: "3", name: "Fornitore 3" },
      ];
      setSuppliers(mockSuppliers);
    } catch (error) {
      console.error("Error loading suppliers:", error);
    }
  };

  const loadWarehouses = async () => {
    try {
      const response = await axios.get("/Warehouse/GET/GetAllWarehouses");
      // Filtra solo i magazzini attivi
      const activeWarehouses = response.data.filter(
        (warehouse: Warehouse) => warehouse.IsActive
      );
      setWarehouses(activeWarehouses);
    } catch (error) {
      console.error("Error loading warehouses:", error);
    }
  };

  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(brandQuery.toLowerCase())
  );

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(categoryQuery.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(supplierQuery.toLowerCase())
  );

  const handleBrandSelection = (brandName: string) => {
    handleChange("brand", brandName);
  };

  const handleCategorySelection = (categoryId: string) => {
    const selectedCategory = categories.find((cat) => cat.id === categoryId);
    if (selectedCategory) {
      handleChange("category", selectedCategory.name);
      setSelectedCategoryAttributes(selectedCategory.attributes);

      // Initialize attributes with empty values
      const initialAttributes = selectedCategory.attributes.map((attr) => ({
        id: attr.id,
        name: attr.name,
        type: attr.type,
        value: "",
        isRequired: attr.isRequired,
      }));

      setFormData((prev) => ({
        ...prev,
        attributes: [...initialAttributes, ...customAttributes],
      }));
    }
  };

  const handleChange = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validazione campi obbligatori
    const requiredFields = {
      name: "Nome Prodotto",
      sku: "SKU",
      category: "Categoria",
      price: "Prezzo",
      minStockThreshold: "Soglia Minima Stock",
      supplier: "Fornitore",
    };

    const missingFields = Object.entries(requiredFields).filter(
      ([field, _]) => {
        const value = formData[field as keyof ProductFormData];
        return !value || (typeof value === "string" && value.trim() === "");
      }
    );

    if (missingFields.length > 0) {
      const missingFieldNames = missingFields
        .map(([_, label]) => label)
        .join(", ");
      alert(`I seguenti campi sono obbligatori: ${missingFieldNames}`);
      return;
    }

    setIsSaving(true);

    try {
      // Prepara i dati nel formato atteso dal backend
      const productData = {
        name: formData.name,
        sku: formData.sku,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        minStockThreshold: parseInt(formData.minStockThreshold) || 0,

        barcode: formData.barcode,
        qrCode: formData.qrCode,
        supplier: formData.supplier,
        category: formData.category, // Il backend cerca per nome categoria
        brand: formData.brand,
        weight: formData.weight,
        dimensions: formData.dimensions,
        location: formData.location,
        notes: formData.notes,
        costPrice: parseFloat(formData.costPrice) || 0,
        vatRate: parseFloat(formData.vatRate) || 0,
        reorderQuantity: parseInt(formData.reorderQuantity) || 0,
        stockUnit: parseInt(formData.stockUnit) || 0, // Quantità disponibile
        warehouse: formData.warehouse,
        attributes: formData.attributes.filter(
          (attr) => attr.name && attr.value
        ), // Solo attributi con nome e valore
      };

      console.log("Sending product data:", productData);

      const response = await axios.post(
        "/Product/POST/CreateNewProduct",
        productData
      );

      if (response.status === 200) {
        // Mostra un messaggio di successo
        alert("Prodotto creato con successo!");
        // Naviga alla pagina dei prodotti
        navigate("/inventory/products");
      } else {
        throw new Error("Risposta del server non valida");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      // Mostra un messaggio di errore all'utente
      alert("Errore durante il salvataggio del prodotto. Riprova.");
    } finally {
      setIsSaving(false);
    }
  };

  const getTabIcon = (tabKey: string) => {
    const error = tabErrors.find((e) => e.tab === tabKey);
    if (error) {
      return (
        <Badge content={error.count} color="danger" size="sm">
          <div className="flex items-center gap-2">
            <Icon icon={getIconForTab(tabKey)} />
            <span>{getTabLabel(tabKey)}</span>
          </div>
        </Badge>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <Icon icon={getIconForTab(tabKey)} />
        <span>{getTabLabel(tabKey)}</span>
      </div>
    );
  };

  const getIconForTab = (tab: string) => {
    switch (tab) {
      case "basic":
        return "solar:notebook-bold";
      case "commercial":
        return "solar:dollar-minimalistic-bold";
      case "warehouse":
        return "solar:box-bold";
      case "physical":
        return "solar:ruler-bold";
      default:
        return "";
    }
  };

  const getTabLabel = (tab: string) => {
    switch (tab) {
      case "basic":
        return "Informazioni Base";
      case "commercial":
        return "Info Commerciali";
      case "warehouse":
        return "Magazzino";
      case "physical":
        return "Specifiche Fisiche";
      default:
        return "";
    }
  };

  const handleFileSelect = (
    files: FileList | null,
    type: "photos" | "documents" | "certifications"
  ) => {
    if (!files) return;

    const acceptedFiles: File[] = [];
    const maxSize = type === "photos" ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB for photos, 10MB for docs

    Array.from(files).forEach((file) => {
      if (type === "photos") {
        if (file.type.startsWith("image/") && file.size <= maxSize) {
          acceptedFiles.push(file);
        }
      } else {
        const allowedTypes = [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ];
        if (allowedTypes.includes(file.type) && file.size <= maxSize) {
          acceptedFiles.push(file);
        }
      }
    });

    const filesWithPreview = acceptedFiles.map((file) => {
      const preview =
        type === "photos" || file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : "";
      return Object.assign(file, { preview });
    }) as FileWithPreview[];

    setFormData((prev) => ({
      ...prev,
      [type]: [...prev[type], ...filesWithPreview],
    }));
  };

  const handleDragOver = (
    e: React.DragEvent,
    type: "photos" | "documents" | "certifications"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === "photos") {
      setIsDraggingPhotos(true);
    } else if (type === "documents") {
      setIsDraggingDocs(true);
    }
  };

  const handleDragLeave = (
    e: React.DragEvent,
    type: "photos" | "documents" | "certifications"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === "photos") {
      setIsDraggingPhotos(false);
    } else if (type === "documents") {
      setIsDraggingDocs(false);
    }
  };

  const handleDrop = (
    e: React.DragEvent,
    type: "photos" | "documents" | "certifications"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === "photos") {
      setIsDraggingPhotos(false);
    } else if (type === "documents") {
      setIsDraggingDocs(false);
    }

    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles, type);
  };

  // Cleanup function for file previews
  useEffect(() => {
    return () => {
      formData.photos.forEach((file) => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
      formData.documents.forEach((file) => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
      formData.certifications.forEach((file) => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
    };
  }, [formData.photos, formData.documents, formData.certifications]);

  const removeFile = (
    type: "photos" | "documents" | "certifications",
    index: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return "solar:file-pdf-bold";
      case "doc":
      case "docx":
        return "solar:file-text-bold";
      case "xls":
      case "xlsx":
        return "solar:file-spreadsheet-bold";
      default:
        return "solar:file-bold";
    }
  };

  const generateBarcode = () => {
    // Genera un codice EAN-13 casuale
    const prefix = "200"; // Prefisso per prodotti interni
    const randomDigits = Array.from({ length: 9 }, () =>
      Math.floor(Math.random() * 10)
    ).join("");
    const code = prefix + randomDigits;
    // Calcola il check digit
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    const barcode = code + checkDigit;

    handleChange("barcode", barcode);
  };

  const generateQRCode = () => {
    // Genera un QR code basato su SKU e timestamp
    const timestamp = Date.now();
    const qrCode = `${formData.sku || "PROD"}-${timestamp}`;
    handleChange("qrCode", qrCode);
  };

  // Modify the initialization effect
  useEffect(() => {
    // Initialize ZXing reader only once when component mounts
    try {
      console.log("Initializing ZXing reader...");
      if (!codeReader.current) {
        // Crea un lettore di codici semplificato
        codeReader.current = new BrowserMultiFormatReader();
        if (codeReader.current) {
          codeReader.current.timeBetweenDecodingAttempts = 150;
        }
      } else if (codeReader.current) {
        codeReader.current.timeBetweenDecodingAttempts = 150;
      }
      console.log("ZXing reader initialized successfully");
    } catch (error) {
      console.error("Error initializing ZXing reader:", error);
      setCameraError("Errore nell'inizializzazione del lettore di codici");
    }

    // Cleanup when component unmounts
    return () => {
      console.log("Cleaning up camera resources...");
      if (codeReader.current) {
        codeReader.current.reset();
        codeReader.current = null;
      }
    };
  }, []); // Empty dependency array - only run once

  // Modify the scanner effect
  useEffect(() => {
    let isActive = true;
    let scannerTimeout: number | ReturnType<typeof setTimeout> | null = null;

    const initializeScanner = async () => {
      if (isScannerOpen && scannerType && isActive) {
        try {
          // Aggiungi un breve ritardo per assicurarsi che l'interfaccia sia pronta
          scannerTimeout = setTimeout(() => {
            startScanner(scannerType).catch((error) => {
              console.error("Error in scanner initialization:", error);
            });
          }, 100);
        } catch (error) {
          console.error("Error in scanner initialization:", error);
        }
      }
    };

    initializeScanner();

    return () => {
      isActive = false;
      if (scannerTimeout) clearTimeout(scannerTimeout);
      if (codeReader.current) {
        console.log("Stopping video stream...");
        codeReader.current.reset();
      }
    };
  }, [isScannerOpen, scannerType, selectedCamera]); // Add selectedCamera to dependencies

  const stopScanner = () => {
    if (codeReader.current) {
      console.log("Stopping scanner...");
      codeReader.current.reset();
    }
    setIsScannerOpen(false);
    setScannerError(null);
    setCameraError(null);
    setIsInitializingCamera(false);
  };

  const startScanner = async (type: "barcode" | "qrcode") => {
    console.log("Starting scanner for type:", type);
    setIsInitializingCamera(true);
    setScannerError(null);
    setCameraError(null);
    setHasAttemptedScan(false);
    setShowScanSuccess(false);

    try {
      console.log("Checking camera prerequisites...");
      if (!codeReader.current) {
        // Crea un lettore di codici semplificato
        codeReader.current = new BrowserMultiFormatReader();
        if (codeReader.current) {
          codeReader.current.timeBetweenDecodingAttempts = 150;
        }
      } else if (codeReader.current) {
        codeReader.current.timeBetweenDecodingAttempts = 150;
      }

      if (!videoRef.current) {
        throw new Error("Scanner non inizializzato correttamente");
      }

      // Check if the browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "Il tuo browser non supporta l'accesso alla fotocamera"
        );
      }

      console.log("Current camera permission state:", cameraPermissionState);

      // First try to get camera permissions if not already granted
      if (cameraPermissionState !== "granted") {
        try {
          console.log("Requesting camera access...");
          // Imposta configurazioni video ottimali per la scansione
          const constraints = {
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "environment", // Preferisci fotocamera posteriore
              frameRate: { ideal: 30 }, // Framerate ottimale
            },
          };
          await navigator.mediaDevices.getUserMedia(constraints);
          setCameraPermissionState("granted");
          console.log("Camera access granted");
        } catch (permissionError: any) {
          console.error("Camera permission error:", permissionError);
          if (permissionError.name === "NotAllowedError") {
            setCameraPermissionState("denied");
            throw new Error("Permesso fotocamera negato");
          } else if (permissionError.name === "NotFoundError") {
            throw new Error("Nessuna fotocamera trovata sul dispositivo");
          } else {
            throw new Error(
              "Errore di accesso alla fotocamera: " + permissionError.message
            );
          }
        }
      }

      // Reset any existing streams before starting new one
      if (codeReader.current) {
        codeReader.current.reset();
      }

      console.log("Listing video devices...");
      const videoInputDevices =
        await codeReader.current.listVideoInputDevices();
      console.log("Available video devices:", videoInputDevices);

      if (videoInputDevices.length === 0) {
        throw new Error("Nessuna fotocamera trovata");
      }

      // Update available cameras
      setAvailableCameras(videoInputDevices);

      // Set default camera if not already selected
      if (!selectedCamera) {
        // Prova a selezionare la fotocamera posteriore se disponibile
        const backCamera = videoInputDevices.find(
          (device) =>
            device.label.toLowerCase().includes("back") ||
            device.label.toLowerCase().includes("posteriore") ||
            device.label.toLowerCase().includes("rear")
        );

        setSelectedCamera(
          backCamera?.deviceId || videoInputDevices[0].deviceId
        );
      }

      const deviceId = selectedCamera || videoInputDevices[0].deviceId;
      console.log("Using device ID:", deviceId);

      // Verifica che la fotocamera selezionata sia ancora disponibile
      const isCameraAvailable = videoInputDevices.some(
        (device) => device.deviceId === deviceId
      );
      if (!isCameraAvailable) {
        throw new Error("La fotocamera selezionata non è più disponibile");
      }

      // Ottimizzazione video constraints per il dispositivo specifico
      const constraints = {
        video: {
          deviceId: deviceId,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
      };

      console.log("Starting video stream with optimized settings...");

      // Ottimizza la funzione di callback per prestazioni migliori
      let isProcessing = false;
      let lastCodeDetected = "";
      let codeDetectedCount = 0;

      await codeReader.current.decodeFromConstraints(
        constraints,
        videoRef.current,
        (result: Result | null, err: Exception | undefined) => {
          // Evita elaborazioni multiple dello stesso frame
          if (isProcessing) return;

          if (result) {
            isProcessing = true;
            console.log("Code detected:", result.getText());
            const code = result.getText();

            // Implementa una verifica di stabilità per evitare falsi positivi
            if (code === lastCodeDetected) {
              codeDetectedCount++;

              // Richiedi almeno 2 rilevazioni identiche per confermare il codice
              if (codeDetectedCount >= 2) {
                setScannedCode(code);
                setShowScanSuccess(true);

                // Dopo 800ms, aggiorna il form e chiudi lo scanner (ridotto da 1000ms)
                setTimeout(() => {
                  setShowScanSuccess(false);
                  handleChange(type === "barcode" ? "barcode" : "qrCode", code);
                  stopScanner();
                }, 800);
              } else {
                isProcessing = false;
              }
            } else {
              // Resetta il contatore per un nuovo codice
              lastCodeDetected = code;
              codeDetectedCount = 1;
              isProcessing = false;
            }
          } else if (err && err?.message !== "NotFoundException") {
            // Ignora errori momentanei per migliorare la fluidità
            if (
              err?.message.includes("format exception") ||
              err?.message.includes("checksum")
            ) {
              // Ignora questi errori comuni che possono verificarsi durante la scansione
              return;
            }

            setHasAttemptedScan(true);
            console.error("Scanning error:", err);
            setScannerError(
              "Errore durante la scansione. Assicurati che il codice sia ben visibile e riprova."
            );
          }
        }
      );

      console.log("Video stream started successfully");

      // Imposta l'autofocus se supportato
      if (videoRef.current && codeReader.current) {
        try {
          const tracks = (videoRef.current as any).srcObject?.getVideoTracks();
          if (tracks && tracks[0]) {
            const capabilities = tracks[0].getCapabilities();
            if (
              capabilities.focusMode &&
              capabilities.focusMode.includes("continuous")
            ) {
              await tracks[0].applyConstraints({
                advanced: [{ focusMode: "continuous" }],
              });
              console.log("Continuous autofocus enabled");
            }
          }
        } catch (focusError) {
          console.log("Could not enable autofocus:", focusError);
        }
      }
    } catch (error: any) {
      setHasAttemptedScan(true);
      console.error("Scanner error:", error);
      let errorMessage = "Impossibile accedere alla fotocamera.";
      let helpMessage = "";

      switch (error.message) {
        case "Permesso fotocamera negato":
          errorMessage = "Accesso alla fotocamera negato";
          helpMessage =
            cameraPermissionState === "denied"
              ? "Per risolvere:\n1. Apri le impostazioni del browser\n2. Cerca le impostazioni dei permessi del sito\n3. Riattiva l'accesso alla fotocamera\n\nOppure clicca il pulsante sotto per richiedere nuovamente l'accesso"
              : "Per risolvere:\n1. Controlla la barra degli indirizzi del browser\n2. Clicca sull'icona della fotocamera\n3. Seleziona 'Consenti'";
          break;
        case "Scanner non inizializzato correttamente":
          errorMessage = "Errore di inizializzazione";
          helpMessage =
            "Ricarica la pagina e riprova. Se il problema persiste, verifica che il browser sia aggiornato all'ultima versione.";
          break;
        case "Nessuna fotocamera trovata sul dispositivo":
        case "Nessuna fotocamera trovata":
          errorMessage = "Nessuna fotocamera trovata";
          helpMessage =
            "Verifica che il tuo dispositivo abbia una fotocamera funzionante e che non sia in uso da altre applicazioni.";
          break;
        case "Il tuo browser non supporta l'accesso alla fotocamera":
          errorMessage = "Browser non supportato";
          helpMessage =
            "Prova a utilizzare un browser più recente come Chrome, Firefox o Safari.";
          break;
        case "La fotocamera selezionata non è più disponibile":
          errorMessage = "Fotocamera non disponibile";
          helpMessage =
            "La fotocamera selezionata non è più disponibile. Seleziona un'altra fotocamera dall'elenco.";
          break;
        default:
          helpMessage =
            "Verifica che:\n1. La fotocamera sia collegata e funzionante\n2. Nessun'altra app stia usando la fotocamera\n3. I permessi del browser siano corretti";
      }

      setScannerError(`${errorMessage}\n\n${helpMessage}`);
    } finally {
      setIsInitializingCamera(false);
    }
  };

  const handleCameraChange = async (deviceId: string) => {
    setSelectedCamera(deviceId);
    if (isScannerOpen) {
      // Restart scanner with new camera
      await startScanner(scannerType);
    }
  };

  const checkCameraPermissions = async () => {
    try {
      // Verifica se il browser supporta l'API mediaDevices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraPermissionState("denied");
        setCameraError(
          "Il tuo browser non supporta l'accesso alla fotocamera. Prova con Chrome, Firefox o Safari."
        );
        return;
      }

      // Verifica se l'API permissions è supportata
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({
            name: "camera" as PermissionName,
          });
          setCameraPermissionState(result.state);

          // Ascolta i cambiamenti dei permessi
          result.addEventListener("change", () => {
            setCameraPermissionState(result.state);
            if (result.state === "granted" && isScannerOpen) {
              startScanner(scannerType);
            }
          });
        } catch (error) {
          console.error("Errore nel controllo dei permessi:", error);
          // Fallback al metodo getUserMedia
          await checkCameraWithGetUserMedia();
        }
      } else {
        // Fallback per browser che non supportano l'API permissions
        await checkCameraWithGetUserMedia();
      }
    } catch (error) {
      console.error(
        "Errore nel controllo dei permessi della fotocamera:",
        error
      );
      setCameraPermissionState("denied");
      setCameraError("Impossibile verificare i permessi della fotocamera");
    }
  };

  const checkCameraWithGetUserMedia = async () => {
    try {
      // Prova ad accedere alla fotocamera
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraPermissionState("granted");

      // Ferma lo stream dopo il controllo
      stream.getTracks().forEach((track) => track.stop());

      // Verifica se ci sono dispositivi video disponibili
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );

      if (videoDevices.length === 0) {
        setCameraError("Nessuna fotocamera trovata sul dispositivo");
        setCameraPermissionState("denied");
      } else {
        setAvailableCameras(videoDevices);
        if (!selectedCamera && videoDevices.length > 0) {
          setSelectedCamera(videoDevices[0].deviceId);
        }
      }
    } catch (error: any) {
      console.error("Errore nell'accesso alla fotocamera:", error);
      if (error.name === "NotAllowedError") {
        setCameraPermissionState("denied");
        setCameraError(
          "Accesso alla fotocamera negato. Per favore, consenti l'accesso alla fotocamera nelle impostazioni del browser."
        );
      } else if (error.name === "NotFoundError") {
        setCameraError("Nessuna fotocamera trovata sul dispositivo");
        setCameraPermissionState("denied");
      } else {
        setCameraError("Errore nell'accesso alla fotocamera: " + error.message);
        setCameraPermissionState("denied");
      }
    }
  };

  const requestCameraPermission = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraPermissionState("granted");

      // Ferma lo stream dopo il controllo
      stream.getTracks().forEach((track) => track.stop());

      // Aggiorna la lista delle fotocamere disponibili
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );
      setAvailableCameras(videoDevices);

      if (videoDevices.length > 0) {
        setSelectedCamera(videoDevices[0].deviceId);
        // Riavvia lo scanner se era aperto
        if (isScannerOpen) {
          await startScanner(scannerType);
        }
      }
    } catch (error: any) {
      console.error("Errore nella richiesta dei permessi:", error);
      setCameraPermissionState("denied");
      if (error.name === "NotAllowedError") {
        setCameraError(
          "Accesso alla fotocamera negato. Per favore, consenti l'accesso alla fotocamera nelle impostazioni del browser."
        );
      } else {
        setCameraError("Errore nell'accesso alla fotocamera: " + error.message);
      }
    }
  };

  const addCustomAttribute = () => {
    const newAttribute: ProductAttribute = {
      id: Date.now().toString(),
      name: "",
      type: "text",
      value: "",
      isRequired: false,
    };
    setCustomAttributes((prev) => [...prev, newAttribute]);
    setFormData((prev) => ({
      ...prev,
      attributes: [...prev.attributes, newAttribute],
    }));
  };

  const updateAttribute = (
    attributeId: string,
    field: keyof ProductAttribute,
    value: string | boolean
  ) => {
    setFormData((prev) => {
      // Aggiorna l'attributo nel prodotto principale
      const updatedAttributes = prev.attributes.map((attr) =>
        attr.id === attributeId
          ? {
              ...attr,
              [field]: field === "isRequired" ? Boolean(value) : value,
            }
          : attr
      );

      return {
        ...prev,
        attributes: updatedAttributes,
      };
    });
  };

  const removeAttribute = (attributeId: string) => {
    setFormData((prev) => ({
      ...prev,
      attributes: prev.attributes.filter((attr) => attr.id !== attributeId),
    }));
    setCustomAttributes((prev) =>
      prev.filter((attr) => attr.id !== attributeId)
    );
  };

  const handleScanSuccess = (code: string) => {
    handleChange(scannerType === "barcode" ? "barcode" : "qrCode", code);
  };

  const calculateReorderPoint = () => {
    const minStock = parseFloat(formData.minStockThreshold) || 0;
    const leadTime = parseFloat(formData.leadTime || "0") || 1; // Default a 1 giorno se non specificato

    if (minStock <= 0 || leadTime <= 0) return 0;

    // Calcolo consumo giornaliero medio e punto di riordino
    const dailyUsage = minStock / 30; // Assumiamo che la soglia minima sia per un mese
    const reorderPoint = Math.ceil(dailyUsage * leadTime);

    return reorderPoint;
  };

  const calculateProfit = () => {
    const basePrice = parseFloat(formData.price) || 0;
    const costPrice = parseFloat(formData.costPrice) || 0;
    return basePrice - costPrice;
  };

  // Funzione per cercare informazioni prodotto tramite barcode
  const searchProductByBarcode = async (barcode: string) => {
    if (!barcode || barcode.length < 8) return null;

    setIsBarcodeSearching(true);
    setBarcodeSearchResult(null);

    try {
      console.log(`Ricerca barcode: ${barcode}`);

      // Array di database da provare in ordine - OTTIMIZZATO PER TERMOIDRAULICA
      const searchMethods = [
        { name: "UPC Database", method: searchUPCDatabase },
        { name: "Barcode Lookup", method: searchBarcodeLookup },
        { name: "Product API", method: searchProductAPI },
        { name: "Open Food Facts", method: searchOpenFoodFacts }, // Ultimo per prodotti non alimentari
      ];

      let foundResult = null;
      let lastError = null;

      // Prova ogni database in sequenza
      for (const { name, method } of searchMethods) {
        try {
          console.log(`Tentativo ricerca su ${name}...`);
          const result = await method(barcode);
          if (result && !result.notFound) {
            console.log(`Prodotto trovato su ${name}:`, result);
            foundResult = result;
            break;
          }
        } catch (error) {
          console.warn(`Errore su ${name}:`, error);
          lastError = error;
          continue; // Prova il prossimo database
        }
      }

      if (foundResult) {
        setBarcodeSearchResult(foundResult);
        setShowBarcodeInfo(true);
        return foundResult;
      } else {
        // Nessun risultato trovato in nessun database
        setBarcodeSearchResult({
          notFound: true,
          barcode: barcode,
          searchedDatabases: searchMethods.map((m) => m.name),
          suggestions: generateSearchSuggestions(barcode),
        });
        setShowBarcodeInfo(true);
        return null;
      }
    } catch (error) {
      console.error("Errore generale nella ricerca barcode:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Errore di connessione";
      setBarcodeSearchResult({
        error: true,
        message: errorMessage,
        barcode: barcode,
      });
      setShowBarcodeInfo(true);
      return null;
    } finally {
      setIsBarcodeSearching(false);
    }
  };

  // Genera suggerimenti per l'utente quando il prodotto non viene trovato - SPECIFICO PER TERMOIDRAULICA
  const generateSearchSuggestions = (barcode: string): string[] => {
    const suggestions: string[] = [];

    // Analizza il tipo di barcode
    if (barcode.length === 13 && barcode.startsWith("77")) {
      suggestions.push(
        "Questo sembra essere un codice EAN-13 sudamericano (Colombia/Venezuela)"
      );
    } else if (barcode.length === 12 && barcode.startsWith("0")) {
      suggestions.push("Questo è un codice UPC nordamericano");
    } else if (barcode.length === 13 && barcode.startsWith("8")) {
      suggestions.push("Questo sembra essere un codice EAN-13 europeo");
    }

    // Suggerimenti specifici per termoidraulica
    suggestions.push("Per prodotti termoidraulici, prova a cercare su:");
    suggestions.push(
      "• Siti web dei produttori (Vaillant, Bosch, Ariston, etc.)"
    );
    suggestions.push("• Cataloghi online di distributori specializzati");
    suggestions.push("• Database di ricambi termoidraulici");
    suggestions.push(
      "Verifica che il codice sia stato scansionato correttamente"
    );
    suggestions.push(
      "Molti prodotti termoidraulici hanno codici proprietari non presenti nei database pubblici"
    );

    return suggestions;
  };

  // Ricerca su Open Food Facts (migliorata)
  const searchOpenFoodFacts = async (barcode: string) => {
    try {
      console.log(`Ricerca Open Food Facts per ${barcode}`);
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
        {
          headers: {
            "User-Agent": "CosmicHub-Inventory/1.0",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 1 && data.product) {
        const product = data.product;
        return {
          source: "Open Food Facts",
          confidence: "high",
          name:
            product.product_name ||
            product.product_name_it ||
            product.product_name_en,
          description: product.generic_name || product.ingredients_text,
          brand: product.brands?.split(",")[0]?.trim(),
          category: product.categories?.split(",")[0]?.trim(),
          weight: product.quantity,
          image: product.image_url,
          ingredients: product.ingredients_text,
          nutritionGrade: product.nutrition_grade_fr,
          allergens: product.allergens,
          labels: product.labels,
          packaging: product.packaging,
          stores: product.stores,
          countries: product.countries,
          raw: product,
        };
      }
      return { notFound: true };
    } catch (error) {
      console.error("Errore Open Food Facts:", error);
      throw error;
    }
  };

  // Ricerca su UPC Database (migliorata)
  const searchUPCDatabase = async (barcode: string) => {
    try {
      console.log(`Ricerca UPC Database per ${barcode}`);
      const response = await fetch(
        `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`,
        {
          headers: {
            "User-Agent": "CosmicHub-Inventory/1.0",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.code === "OK" && data.items && data.items.length > 0) {
        const item = data.items[0];
        return {
          source: "UPC Database",
          confidence: "medium",
          name: item.title,
          description: item.description,
          brand: item.brand,
          category: item.category,
          weight: item.size,
          image: item.images?.[0],
          raw: item,
        };
      }
      return { notFound: true };
    } catch (error) {
      console.error("Errore UPC Database:", error);
      throw error;
    }
  };

  // Nuovo: Ricerca su Barcode Lookup API
  const searchBarcodeLookup = async (barcode: string) => {
    try {
      console.log(`Ricerca Barcode Lookup per ${barcode}`);
      // Nota: Questo è un servizio di esempio, potrebbe richiedere API key
      const response = await fetch(
        `https://api.barcodelookup.com/v3/products?barcode=${barcode}&formatted=y&key=YOUR_API_KEY`,
        {
          headers: {
            "User-Agent": "CosmicHub-Inventory/1.0",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.products && data.products.length > 0) {
        const product = data.products[0];
        return {
          source: "Barcode Lookup",
          confidence: "medium",
          name: product.title || product.product_name,
          description: product.description,
          brand: product.brand,
          category: product.category,
          weight: product.size,
          image: product.images?.[0],
          raw: product,
        };
      }
      return { notFound: true };
    } catch (error) {
      console.error("Errore Barcode Lookup:", error);
      // Non lanciare errore per questo servizio se non configurato
      return { notFound: true };
    }
  };

  // Nuovo: Ricerca su Product API generico
  const searchProductAPI = async (barcode: string) => {
    try {
      console.log(`Ricerca Product API per ${barcode}`);
      // Questo potrebbe essere sostituito con un'API locale o aziendale
      const response = await fetch(
        `https://api.ean-search.org/api?token=YOUR_TOKEN&op=barcode-lookup&ean=${barcode}&format=json`,
        {
          headers: {
            "User-Agent": "CosmicHub-Inventory/1.0",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data && data.product) {
        return {
          source: "EAN Search",
          confidence: "low",
          name: data.product.name,
          description: data.product.description,
          brand: data.product.brand,
          category: data.product.category,
          image: data.product.image,
          raw: data.product,
        };
      }
      return { notFound: true };
    } catch (error) {
      console.error("Errore Product API:", error);
      return { notFound: true };
    }
  };

  const applyBarcodeData = (productData: any) => {
    if (!productData || productData.notFound || productData.error) return;

    const updates: Partial<ProductFormData> = {};

    // Applica nome se non già presente
    if (productData.name && !formData.name) {
      updates.name = productData.name;
    }

    // Applica descrizione se non già presente
    if (productData.description && !formData.description) {
      updates.description = productData.description;
    }

    // Applica brand se non già presente
    if (productData.brand && !formData.brand) {
      updates.brand = productData.brand;
    }

    // Applica categoria se non già presente e se esiste nelle nostre categorie
    if (productData.category && !formData.category) {
      // Mapping specifico per termoidraulica
      const thermoHydraulicMapping: { [key: string]: string } = {
        heating: "Riscaldamento",
        plumbing: "Idraulica",
        boiler: "Caldaie",
        radiator: "Radiatori",
        valve: "Valvole",
        pipe: "Tubazioni",
        fitting: "Raccordi",
        pump: "Pompe",
        thermostat: "Termostati",
        "heat exchanger": "Scambiatori di Calore",
        insulation: "Isolamento",
        tools: "Utensili",
        hardware: "Ferramenta",
      };

      // Cerca prima nel mapping specifico
      let mappedCategory = null;
      for (const [key, value] of Object.entries(thermoHydraulicMapping)) {
        if (productData.category.toLowerCase().includes(key)) {
          mappedCategory = value;
          break;
        }
      }

      // Se non trova nel mapping specifico, cerca nelle categorie esistenti
      if (!mappedCategory) {
        const matchingCategory = categories.find(
          (cat) =>
            cat.name
              .toLowerCase()
              .includes(productData.category.toLowerCase()) ||
            productData.category.toLowerCase().includes(cat.name.toLowerCase())
        );
        if (matchingCategory) {
          mappedCategory = matchingCategory.name;
        }
      }

      if (mappedCategory) {
        updates.category = mappedCategory;
      }
    }

    // Applica peso se non già presente
    if (productData.weight && !formData.weight) {
      // Estrai solo i numeri dal peso
      const weightMatch = productData.weight.match(/(\d+(?:\.\d+)?)/);
      if (weightMatch) {
        updates.weight = weightMatch[1];
      }
    }

    // Applica gli aggiornamenti
    if (Object.keys(updates).length > 0) {
      setFormData((prev) => ({ ...prev, ...updates }));
    }

    setShowBarcodeInfo(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardBody className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <Progress
              size="sm"
              isIndeterminate
              aria-label="Loading..."
              className="max-w-md"
            />
            <p className="text-default-500 mt-4">Caricamento dati...</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="h-[calc(100vh-2rem)] flex flex-col overflow-hidden">
      <CardHeader className="border-b border-default-200 shrink-0">
        <h2 className="text-xl font-semibold">Informazioni Prodotto</h2>
      </CardHeader>
      <CardBody className="p-6 overflow-y-auto overflow-x-hidden">
        <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-full">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            color="primary"
            variant="underlined"
            classNames={{
              cursor: "w-full",
              panel: "w-full max-w-full overflow-x-hidden",
            }}
          >
            <Tab key="basic" title={getTabIcon("basic")}>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome Prodotto */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nome Prodotto <span className="text-danger">*</span>
                  </label>
                  <Input
                    placeholder="Nome del prodotto"
                    variant="bordered"
                    color={formData.name ? "success" : "primary"}
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    isRequired
                    startContent={
                      <Icon
                        icon="solar:pen-bold"
                        className={
                          formData.name ? "text-success" : "text-default-400"
                        }
                      />
                    }
                  />
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    SKU <span className="text-danger">*</span>
                    {isSkuAutoGenerated && (
                      <Chip
                        size="sm"
                        variant="flat"
                        color="primary"
                        className="ml-2"
                        startContent={
                          <Icon icon="solar:magic-stick-3-bold" width={14} />
                        }
                      >
                        Auto-generato
                      </Chip>
                    )}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Stock Keeping Unit"
                      variant="bordered"
                      color={formData.sku ? "success" : "primary"}
                      value={formData.sku}
                      onChange={(e) => {
                        handleChange("sku", e.target.value);
                        setIsSkuAutoGenerated(false); // L'utente ha modificato manualmente
                      }}
                      isRequired
                      startContent={
                        <Icon
                          icon="solar:barcode-bold"
                          className={
                            formData.sku ? "text-success" : "text-default-400"
                          }
                        />
                      }
                    />
                    <Tooltip content="Rigenera SKU automaticamente">
                      <Button
                        color="primary"
                        variant="flat"
                        isIconOnly
                        onClick={() => {
                          const newSku = generateSKU(
                            formData.name,
                            formData.category,
                            formData.brand
                          );
                          if (newSku) {
                            handleChange("sku", newSku);
                            setIsSkuAutoGenerated(true);
                          }
                        }}
                        isDisabled={!formData.name}
                      >
                        <Icon icon="solar:refresh-bold" />
                      </Button>
                    </Tooltip>
                    <Tooltip
                      content={
                        <div className="px-1 py-2 max-w-xs">
                          <div className="text-small font-bold mb-2">
                            Come funziona la generazione SKU?
                          </div>
                          <div className="text-tiny space-y-1">
                            <p>
                              <strong>Esempi:</strong>
                            </p>
                            <p>• "Banana" → BAN-123</p>
                            <p>• "Mela Rossa" → MELRO-123</p>
                            <p>• "Smartphone Samsung Galaxy" → SMSGA-123</p>
                            <p>• Con categoria "Frutta": FRU-BAN-123</p>
                            <p className="mt-2 text-warning">
                              Il numero finale è sempre univoco
                            </p>
                          </div>
                        </div>
                      }
                      delay={0}
                      closeDelay={0}
                      placement="bottom"
                      showArrow
                    >
                      <Button
                        color="default"
                        variant="light"
                        isIconOnly
                        size="sm"
                      >
                        <Icon
                          icon="solar:info-circle-bold"
                          className="text-default-400"
                        />
                      </Button>
                    </Tooltip>
                  </div>
                  {formData.name && !formData.sku && (
                    <p className="text-xs text-default-400 mt-1">
                      Lo SKU verrà generato automaticamente quando inserisci il
                      nome del prodotto
                    </p>
                  )}
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Categoria <span className="text-danger">*</span>
                  </label>
                  <div className="flex gap-2">
                    <Autocomplete
                      variant="bordered"
                      color={formData.category ? "success" : "primary"}
                      placeholder="Cerca categoria"
                      defaultItems={categories}
                      value={formData.category}
                      onInputChange={setCategoryQuery}
                      onSelectionChange={(value) =>
                        handleCategorySelection(value as string)
                      }
                      className="flex-1"
                      isRequired
                      startContent={
                        <Icon
                          icon="solar:folder-bold"
                          className={
                            formData.category
                              ? "text-success"
                              : "text-default-400"
                          }
                        />
                      }
                    >
                      {(category: Category) => (
                        <AutocompleteItem
                          key={category.id}
                          textValue={category.name}
                        >
                          {category.name}
                        </AutocompleteItem>
                      )}
                    </Autocomplete>
                    <Tooltip content="Aggiungi nuova categoria">
                      <Button
                        color="primary"
                        variant="flat"
                        onClick={() => navigate("/inventory/categories/new")}
                        isIconOnly
                      >
                        <Icon
                          icon="solar:add-circle-bold"
                          className="text-xl"
                        />
                      </Button>
                    </Tooltip>
                  </div>
                  {categoryQuery && filteredCategories.length === 0 && (
                    <p className="text-sm text-default-400 mt-2">
                      Nessuna categoria trovata. Usa il pulsante + per
                      aggiungerne una nuova.
                    </p>
                  )}
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Brand
                  </label>
                  <div className="flex gap-2">
                    <Autocomplete
                      variant="bordered"
                      color={formData.brand ? "success" : "primary"}
                      placeholder="Cerca brand"
                      defaultItems={brands}
                      value={formData.brand}
                      onInputChange={setBrandQuery}
                      onSelectionChange={(value) =>
                        handleBrandSelection(value as string)
                      }
                      className="flex-1"
                      startContent={
                        <Icon
                          icon="solar:shop-bold"
                          className={
                            formData.brand ? "text-success" : "text-default-400"
                          }
                        />
                      }
                    >
                      {(brand: Brand) => (
                        <AutocompleteItem textValue={brand.name}>
                          {brand.name}
                        </AutocompleteItem>
                      )}
                    </Autocomplete>
                    <Tooltip content="Aggiungi nuovo brand">
                      <Button
                        color="primary"
                        variant="flat"
                        onClick={() => navigate("/inventory/brands/new")}
                        isIconOnly
                      >
                        <Icon
                          icon="solar:add-circle-bold"
                          className="text-xl"
                        />
                      </Button>
                    </Tooltip>
                  </div>
                  {brandQuery && filteredBrands.length === 0 && (
                    <p className="text-sm text-default-400 mt-2">
                      Nessun brand trovato. Usa il pulsante + per aggiungerne
                      uno nuovo.
                    </p>
                  )}
                </div>

                {/* Description - Full width */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Descrizione
                  </label>
                  <Textarea
                    variant="bordered"
                    color={formData.description ? "success" : "primary"}
                    placeholder="Descrizione dettagliata del prodotto"
                    value={formData.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    minRows={3}
                  />
                </div>

                {/* Notes - Full width */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Note Aggiuntive
                  </label>
                  <Textarea
                    variant="bordered"
                    color={formData.notes ? "success" : "primary"}
                    placeholder="Note aggiuntive sul prodotto"
                    value={formData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    minRows={2}
                  />
                </div>
              </div>
            </Tab>

            <Tab key="commercial" title={getTabIcon("commercial")}>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Prezzo */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Prezzo <span className="text-danger">*</span>
                  </label>
                  <Input
                    type="number"
                    variant="bordered"
                    color={formData.price ? "success" : "primary"}
                    placeholder="0.00"
                    startContent={<span className="text-default-400">€</span>}
                    value={formData.price}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Permetti solo numeri positivi e decimali
                      if (
                        value === "" ||
                        (parseFloat(value) >= 0 && !isNaN(parseFloat(value)))
                      ) {
                        handleChange("price", value);
                      }
                    }}
                    onKeyDown={(e) => {
                      // Impedisci l'inserimento del segno meno
                      if (e.key === "-" || e.key === "e" || e.key === "E") {
                        e.preventDefault();
                      }
                    }}
                    min="0"
                    step="0.01"
                    isRequired
                  />
                </div>

                {/* Prezzo di costo */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Prezzo di Costo
                  </label>
                  <Input
                    type="number"
                    variant="bordered"
                    color={formData.costPrice ? "success" : "primary"}
                    placeholder="0.00"
                    startContent={<span className="text-default-400">€</span>}
                    value={formData.costPrice}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (
                        value === "" ||
                        (parseFloat(value) >= 0 && !isNaN(parseFloat(value)))
                      ) {
                        handleChange("costPrice", value);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "e" || e.key === "E") {
                        e.preventDefault();
                      }
                    }}
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* IVA */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Aliquota IVA
                  </label>
                  <Select
                    variant="bordered"
                    color={formData.vatRate ? "success" : "primary"}
                    placeholder="Seleziona aliquota"
                    selectedKeys={[formData.vatRate?.toString() || ""]}
                    onChange={(e) => handleChange("vatRate", e.target.value)}
                    startContent={
                      <Icon
                        icon="solar:percentage-bold"
                        className={
                          formData.vatRate ? "text-success" : "text-default-400"
                        }
                      />
                    }
                  >
                    <SelectItem key="0" textValue="Esente">
                      Esente (0%)
                    </SelectItem>
                    <SelectItem key="4" textValue="4%">
                      4%
                    </SelectItem>
                    <SelectItem key="10" textValue="10%">
                      10%
                    </SelectItem>
                    <SelectItem key="22" textValue="22%">
                      22%
                    </SelectItem>
                  </Select>
                </div>


                {/* Tempo di approvvigionamento */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tempo di Approvvigionamento (giorni)
                  </label>
                  <Input
                    type="number"
                    variant="bordered"
                    color={formData.leadTime ? "success" : "primary"}
                    placeholder="Giorni necessari per la consegna"
                    value={formData.leadTime || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Permetti solo numeri interi positivi
                      if (
                        value === "" ||
                        (parseInt(value) >= 0 &&
                          !isNaN(parseInt(value)) &&
                          !value.includes("."))
                      ) {
                        handleChange("leadTime", value);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (
                        e.key === "-" ||
                        e.key === "." ||
                        e.key === "e" ||
                        e.key === "E"
                      ) {
                        e.preventDefault();
                      }
                    }}
                    min="0"
                    step="1"
                    startContent={
                      <Icon
                        icon="solar:clock-circle-bold"
                        className={
                          formData.leadTime
                            ? "text-success"
                            : "text-default-400"
                        }
                      />
                    }
                  />
                </div>

                {/* Quantità di riordino consigliata */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Quantità di Riordino Consigliata
                  </label>
                  <Input
                    type="number"
                    variant="bordered"
                    color={formData.reorderQuantity ? "success" : "primary"}
                    placeholder="Quantità consigliata di riordino"
                    value={formData.reorderQuantity}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Permetti solo numeri interi positivi
                      if (
                        value === "" ||
                        (parseInt(value) >= 0 &&
                          !isNaN(parseInt(value)) &&
                          !value.includes("."))
                      ) {
                        handleChange("reorderQuantity", value);
                      }
                    }}
                    onKeyDown={(e) => {
                      // Impedisci l'inserimento del segno meno, punto decimale e caratteri non numerici
                      if (
                        e.key === "-" ||
                        e.key === "." ||
                        e.key === "e" ||
                        e.key === "E"
                      ) {
                        e.preventDefault();
                      }
                    }}
                    min="0"
                    step="1"
                    startContent={
                      <Icon
                        icon="solar:sort-by-time-bold"
                        className={
                          formData.reorderQuantity
                            ? "text-success"
                            : "text-default-400"
                        }
                      />
                    }
                    description={
                      formData.reorderQuantity &&
                      formData.minStockThreshold &&
                      parseInt(formData.reorderQuantity) > 0 &&
                      parseInt(formData.minStockThreshold) > 0
                        ? `Punto di riordino: ${calculateReorderPoint()} unità`
                        : undefined
                    }
                  />
                </div>

                {/* Fornitore */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Fornitore <span className="text-danger">*</span>
                  </label>
                  <div className="flex gap-2">
                    <Autocomplete
                      variant="bordered"
                      color={formData.supplier ? "success" : "primary"}
                      placeholder="Cerca fornitore"
                      defaultItems={suppliers}
                      value={formData.supplier}
                      onInputChange={setSupplierQuery}
                      onSelectionChange={(value) =>
                        handleChange("supplier", value)
                      }
                      className="flex-1"
                      isRequired
                      startContent={
                        <Icon
                          icon="solar:shop-bold-2"
                          className={
                            formData.supplier
                              ? "text-success"
                              : "text-default-400"
                          }
                        />
                      }
                    >
                      {(supplier: Supplier) => (
                        <AutocompleteItem
                          key={supplier.id}
                          textValue={supplier.name}
                        >
                          {supplier.name}
                        </AutocompleteItem>
                      )}
                    </Autocomplete>
                    <Tooltip content="Aggiungi nuovo fornitore">
                      <Button
                        color="primary"
                        variant="flat"
                        onClick={() => navigate("/inventory/suppliers/new")}
                        isIconOnly
                      >
                        <Icon
                          icon="solar:add-circle-bold"
                          className="text-xl"
                        />
                      </Button>
                    </Tooltip>
                  </div>
                  {supplierQuery && filteredSuppliers.length === 0 && (
                    <p className="text-sm text-default-400 mt-2">
                      Nessun fornitore trovato. Usa il pulsante + per
                      aggiungerne uno nuovo.
                    </p>
                  )}
                </div>

                {/* Riepilogo economico */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Riepilogo Economico
                  </label>
                  <Card className="p-4 bg-default-50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-default-500 mb-1">
                          Prezzo Acquisto
                        </p>
                        <p className="text-lg font-semibold">
                          €{parseFloat(formData.costPrice || "0").toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-default-500 mb-1">
                          Prezzo Vendita
                        </p>
                        <p className="text-lg font-semibold">
                          €{parseFloat(formData.price || "0").toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-default-500 mb-1">Margine</p>
                        <p
                          className={`text-lg font-semibold ${
                            calculateProfit() >= 0
                              ? "text-success"
                              : "text-danger"
                          }`}
                        >
                          €{calculateProfit().toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-default-500 mb-1">
                          Margine %
                        </p>
                        <p
                          className={`text-lg font-semibold ${
                            calculateProfit() >= 0
                              ? "text-success"
                              : "text-danger"
                          }`}
                        >
                          {(
                            (calculateProfit() /
                              parseFloat(formData.price || "1")) *
                            100
                          ).toFixed(1)}
                          %
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </Tab>

            <Tab key="warehouse" title={getTabIcon("warehouse")}>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Magazzino */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Magazzino <span className="text-danger">*</span>
                    {formData.warehouse && (
                      <Chip
                        size="sm"
                        variant="flat"
                        color="success"
                        className="ml-2"
                        startContent={
                          <Icon icon="solar:check-circle-bold" width={14} />
                        }
                      >
                        Preselezionato
                      </Chip>
                    )}
                  </label>
                  <Select
                    variant="bordered"
                    color={formData.warehouse ? "success" : "primary"}
                    placeholder="Seleziona magazzino"
                    selectedKeys={
                      formData.warehouse ? [formData.warehouse] : []
                    }
                    onChange={(e) => handleChange("warehouse", e.target.value)}
                    isRequired
                    startContent={
                      <Icon
                        icon="solar:buildings-3-bold"
                        className={
                          formData.warehouse
                            ? "text-success"
                            : "text-default-400"
                        }
                      />
                    }
                  >
                    {warehouses.map((warehouse) => (
                      <SelectItem
                        key={warehouse.WarehouseUUID || warehouse.WarehouseID}
                        textValue={`${warehouse.WarehouseName} ${warehouse.WarehouseCode}`}
                      >
                        {warehouse.WarehouseName} {warehouse.WarehouseCode}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Soglia minima stock */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Soglia Minima Stock <span className="text-danger">*</span>
                  </label>
                  <Input
                    type="number"
                    variant="bordered"
                    color={formData.minStockThreshold ? "success" : "primary"}
                    placeholder="Quantità minima"
                    value={formData.minStockThreshold}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Permetti solo numeri interi positivi
                      if (
                        value === "" ||
                        (parseInt(value) >= 0 &&
                          !isNaN(parseInt(value)) &&
                          !value.includes("."))
                      ) {
                        handleChange("minStockThreshold", value);
                      }
                    }}
                    onKeyDown={(e) => {
                      // Impedisci l'inserimento del segno meno, punto decimale e caratteri non numerici
                      if (
                        e.key === "-" ||
                        e.key === "." ||
                        e.key === "e" ||
                        e.key === "E"
                      ) {
                        e.preventDefault();
                      }
                    }}
                    min="0"
                    step="1"
                    isRequired
                    startContent={
                      <Icon
                        icon="solar:chart-2-bold"
                        className={
                          formData.minStockThreshold
                            ? "text-success"
                            : "text-default-400"
                        }
                      />
                    }
                  />
                </div>

                {/* Quantità disponibile (Stock) */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Quantità Disponibile
                  </label>
                  <Input
                    type="number"
                    variant="bordered"
                    color={formData.stockUnit ? "success" : "primary"}
                    placeholder="Quantità disponibile in magazzino"
                    value={formData.stockUnit}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Permetti solo numeri interi positivi
                      if (
                        value === "" ||
                        (parseInt(value) >= 0 &&
                          !isNaN(parseInt(value)) &&
                          !value.includes("."))
                      ) {
                        handleChange("stockUnit", value);
                      }
                    }}
                    onKeyDown={(e) => {
                      // Impedisci l'inserimento del segno meno, punto decimale e caratteri non numerici
                      if (
                        e.key === "-" ||
                        e.key === "." ||
                        e.key === "e" ||
                        e.key === "E"
                      ) {
                        e.preventDefault();
                      }
                    }}
                    min="0"
                    step="1"
                    startContent={
                      <Icon
                        icon="solar:box-bold"
                        className={
                          formData.stockUnit
                            ? "text-success"
                            : "text-default-400"
                        }
                      />
                    }
                  />
                </div>

                {/* Posizione */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Posizione Magazzino
                  </label>
                  <Input
                    variant="bordered"
                    color={formData.location ? "success" : "primary"}
                    placeholder="Es: Scaffale A-12"
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    startContent={
                      <Icon
                        icon="solar:map-point-bold"
                        className={
                          formData.location
                            ? "text-success"
                            : "text-default-400"
                        }
                      />
                    }
                  />
                </div>

                {/* Barcode */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Barcode
                  </label>
                  <div className="space-y-3">
                    <RadioGroup
                      orientation="horizontal"
                      value={formData.barcodeType}
                      onValueChange={(value) =>
                        handleChange("barcodeType", value)
                      }
                    >
                      <Radio value="manual">Manuale</Radio>
                      <Radio value="auto">Genera</Radio>
                      <Radio value="scan">Scansiona</Radio>
                    </RadioGroup>

                    <div className="flex gap-2">
                      <Input
                        variant="bordered"
                        color={formData.barcode ? "success" : "primary"}
                        placeholder="Codice a barre"
                        value={formData.barcode}
                        onChange={(e) =>
                          handleChange("barcode", e.target.value)
                        }
                        startContent={
                          <Icon
                            icon="solar:barcode-2-bold"
                            className={
                              formData.barcode
                                ? "text-success"
                                : "text-default-400"
                            }
                          />
                        }
                        endContent={
                          isBarcodeSearching && (
                            <div className="flex items-center">
                              <Icon
                                icon="solar:refresh-bold"
                                className="text-primary animate-spin"
                                width={16}
                              />
                            </div>
                          )
                        }
                        isDisabled={formData.barcodeType === "auto"}
                        description={
                          isBarcodeSearching
                            ? "🔍 Ricerca in corso nei database internazionali..."
                            : formData.barcode && formData.barcode.length >= 8
                            ? "✅ Ricerca automatica completata"
                            : "💡 Inserisci un codice a barre (8-14 cifre) per cercare automaticamente le informazioni del prodotto. Ottimizzato per prodotti termoidraulici e industriali."
                        }
                      />
                      {formData.barcodeType === "auto" && (
                        <Button
                          color="primary"
                          variant="flat"
                          isIconOnly
                          onClick={generateBarcode}
                        >
                          <Icon icon="solar:refresh-bold" />
                        </Button>
                      )}
                      {formData.barcodeType === "scan" && (
                        <Button
                          color="primary"
                          variant="flat"
                          isIconOnly
                          onClick={() => {
                            setScannerType("barcode");
                            setIsScannerOpen(true);
                          }}
                        >
                          <Icon icon="solar:camera-bold" />
                        </Button>
                      )}
                      {formData.barcode && (
                        <Popover
                          placement="top"
                          isOpen={showBarcodePopover}
                          onOpenChange={(open) => setShowBarcodePopover(open)}
                        >
                          <PopoverTrigger>
                            <Button color="primary" variant="flat" isIconOnly>
                              <Icon icon="solar:eye-bold" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="p-4">
                              <div className="bg-white p-4 rounded-lg">
                                <h3 className="text-lg font-medium mb-3 text-center">
                                  Codice a Barre
                                </h3>
                                <div className="flex justify-center">
                                  <img
                                    src={`https://barcodeapi.org/api/code128/${encodeURIComponent(
                                      formData.barcode
                                    )}`}
                                    alt="Barcode"
                                    className="h-24 w-full object-contain"
                                  />
                                </div>
                                <p className="text-center text-xs text-default-500 mt-2">
                                  {formData.barcode}
                                </p>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>

                    {/* Risultati ricerca barcode */}
                    {showBarcodeInfo && barcodeSearchResult && (
                      <div className="mt-4">
                        {barcodeSearchResult.notFound ? (
                          <Card className="p-4 border border-warning/20 bg-warning/5">
                            <div className="flex items-start gap-3">
                              <Icon
                                icon="solar:magnifer-zoom-out-bold"
                                className="text-warning text-xl mt-0.5"
                              />
                              <div className="flex-1">
                                <h4 className="font-medium text-warning mb-2">
                                  Prodotto non trovato
                                </h4>
                                <p className="text-sm text-default-600 mb-3">
                                  Non sono state trovate informazioni per il
                                  codice{" "}
                                  <code className="bg-warning/10 px-1 rounded">
                                    {barcodeSearchResult.barcode}
                                  </code>{" "}
                                  nei seguenti database:
                                </p>

                                {/* Database cercati */}
                                {barcodeSearchResult.searchedDatabases && (
                                  <div className="mb-3">
                                    <p className="text-xs text-default-500 mb-1">
                                      Database consultati:
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {barcodeSearchResult.searchedDatabases.map(
                                        (db: string, index: number) => (
                                          <Chip
                                            key={index}
                                            size="sm"
                                            variant="flat"
                                            color="default"
                                          >
                                            {db}
                                          </Chip>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Suggerimenti */}
                                {barcodeSearchResult.suggestions &&
                                  barcodeSearchResult.suggestions.length >
                                    0 && (
                                    <div className="mb-3">
                                      <p className="text-xs text-default-500 mb-2">
                                        💡 Suggerimenti:
                                      </p>
                                      <ul className="text-xs text-default-600 space-y-1">
                                        {barcodeSearchResult.suggestions.map(
                                          (
                                            suggestion: string,
                                            index: number
                                          ) => (
                                            <li
                                              key={index}
                                              className="flex items-start gap-2"
                                            >
                                              <span className="text-warning">
                                                •
                                              </span>
                                              <span>{suggestion}</span>
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    </div>
                                  )}

                                <p className="text-xs text-default-500">
                                  Puoi comunque inserire manualmente le
                                  informazioni del prodotto.
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="light"
                                isIconOnly
                                onClick={() => setShowBarcodeInfo(false)}
                              >
                                <Icon icon="solar:close-circle-bold" />
                              </Button>
                            </div>
                          </Card>
                        ) : barcodeSearchResult.error ? (
                          <Card className="p-4 border border-danger/20 bg-danger/5">
                            <div className="flex items-start gap-3">
                              <Icon
                                icon="solar:danger-triangle-bold"
                                className="text-danger text-xl mt-0.5"
                              />
                              <div className="flex-1">
                                <h4 className="font-medium text-danger mb-1">
                                  Errore di ricerca
                                </h4>
                                <p className="text-sm text-default-600 mb-2">
                                  {barcodeSearchResult.message ||
                                    "Si è verificato un errore durante la ricerca."}
                                </p>
                                <p className="text-xs text-default-500">
                                  Verifica la connessione internet e riprova,
                                  oppure inserisci manualmente le informazioni
                                  del prodotto.
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="light"
                                isIconOnly
                                onClick={() => setShowBarcodeInfo(false)}
                              >
                                <Icon icon="solar:close-circle-bold" />
                              </Button>
                            </div>
                          </Card>
                        ) : (
                          <Card className="p-4 border border-success/20 bg-success/5">
                            <div className="flex items-start gap-3">
                              <Icon
                                icon="solar:check-circle-bold"
                                className="text-success text-xl mt-0.5"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-medium text-success">
                                    Prodotto trovato!
                                  </h4>
                                  <div className="flex items-center gap-2">
                                    <Chip
                                      size="sm"
                                      variant="flat"
                                      color="primary"
                                      startContent={
                                        <Icon
                                          icon={
                                            barcodeSearchResult.confidence ===
                                            "high"
                                              ? "solar:shield-check-bold"
                                              : barcodeSearchResult.confidence ===
                                                "medium"
                                              ? "solar:shield-warning-bold"
                                              : "solar:shield-minimalistic-bold"
                                          }
                                          width={12}
                                        />
                                      }
                                    >
                                      {barcodeSearchResult.source}
                                    </Chip>
                                    {barcodeSearchResult.confidence && (
                                      <Chip
                                        size="sm"
                                        variant="flat"
                                        color={
                                          barcodeSearchResult.confidence ===
                                          "high"
                                            ? "success"
                                            : barcodeSearchResult.confidence ===
                                              "medium"
                                            ? "warning"
                                            : "default"
                                        }
                                      >
                                        {barcodeSearchResult.confidence ===
                                        "high"
                                          ? "Alta affidabilità"
                                          : barcodeSearchResult.confidence ===
                                            "medium"
                                          ? "Media affidabilità"
                                          : "Bassa affidabilità"}
                                      </Chip>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="light"
                                      isIconOnly
                                      onClick={() => setShowBarcodeInfo(false)}
                                    >
                                      <Icon icon="solar:close-circle-bold" />
                                    </Button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {barcodeSearchResult.image && (
                                    <div className="flex justify-center md:justify-start">
                                      <img
                                        src={barcodeSearchResult.image}
                                        alt="Prodotto"
                                        className="w-24 h-24 object-cover rounded-lg border"
                                        onError={(e) => {
                                          e.currentTarget.style.display =
                                            "none";
                                        }}
                                      />
                                    </div>
                                  )}

                                  <div className="space-y-2">
                                    {barcodeSearchResult.name && (
                                      <div>
                                        <p className="text-xs text-default-500">
                                          Nome:
                                        </p>
                                        <p className="text-sm font-medium">
                                          {barcodeSearchResult.name}
                                        </p>
                                      </div>
                                    )}

                                    {barcodeSearchResult.brand && (
                                      <div>
                                        <p className="text-xs text-default-500">
                                          Brand:
                                        </p>
                                        <p className="text-sm">
                                          {barcodeSearchResult.brand}
                                        </p>
                                      </div>
                                    )}

                                    {barcodeSearchResult.category && (
                                      <div>
                                        <p className="text-xs text-default-500">
                                          Categoria:
                                        </p>
                                        <p className="text-sm">
                                          {barcodeSearchResult.category}
                                        </p>
                                      </div>
                                    )}

                                    {barcodeSearchResult.weight && (
                                      <div>
                                        <p className="text-xs text-default-500">
                                          Peso/Dimensioni:
                                        </p>
                                        <p className="text-sm">
                                          {barcodeSearchResult.weight}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {barcodeSearchResult.description && (
                                  <div className="mt-3">
                                    <p className="text-xs text-default-500 mb-1">
                                      Descrizione:
                                    </p>
                                    <p className="text-sm text-default-600 line-clamp-3">
                                      {barcodeSearchResult.description}
                                    </p>
                                  </div>
                                )}

                                {/* Informazioni aggiuntive per Open Food Facts */}
                                {barcodeSearchResult.source ===
                                  "Open Food Facts" && (
                                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                    {barcodeSearchResult.nutritionGrade && (
                                      <div className="flex items-center gap-1">
                                        <Icon
                                          icon="solar:heart-bold"
                                          className="text-red-500"
                                        />
                                        <span>
                                          Nutri-Score:{" "}
                                          {barcodeSearchResult.nutritionGrade.toUpperCase()}
                                        </span>
                                      </div>
                                    )}
                                    {barcodeSearchResult.labels && (
                                      <div className="flex items-center gap-1">
                                        <Icon
                                          icon="solar:medal-star-bold"
                                          className="text-green-500"
                                        />
                                        <span>Certificazioni disponibili</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="flex gap-2 mt-4">
                                  <Button
                                    color="primary"
                                    variant="flat"
                                    size="sm"
                                    startContent={
                                      <Icon icon="solar:download-bold" />
                                    }
                                    onClick={() =>
                                      applyBarcodeData(barcodeSearchResult)
                                    }
                                  >
                                    Applica dati al form
                                  </Button>
                                  <Button
                                    color="default"
                                    variant="light"
                                    size="sm"
                                    startContent={
                                      <Icon icon="solar:eye-bold" />
                                    }
                                    onClick={() => {
                                      // Mostra dettagli completi in un modal o console
                                      console.log(
                                        "Dati completi prodotto:",
                                        barcodeSearchResult.raw
                                      );
                                      // Potresti aprire un modal qui per mostrare tutti i dettagli
                                    }}
                                  >
                                    Vedi dettagli completi
                                  </Button>
                                  {barcodeSearchResult.source ===
                                    "Open Food Facts" && (
                                    <Button
                                      color="default"
                                      variant="light"
                                      size="sm"
                                      startContent={
                                        <Icon icon="solar:link-bold" />
                                      }
                                      onClick={() => {
                                        window.open(
                                          `https://world.openfoodfacts.org/product/${formData.barcode}`,
                                          "_blank"
                                        );
                                      }}
                                    >
                                      Vedi su Open Food Facts
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* QR Code */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    QR Code
                  </label>
                  <div className="space-y-3">
                    <RadioGroup
                      orientation="horizontal"
                      value={formData.qrCodeType}
                      onValueChange={(value) =>
                        handleChange("qrCodeType", value)
                      }
                    >
                      <Radio value="manual">Manuale</Radio>
                      <Radio value="auto">Genera</Radio>
                      <Radio value="scan">Scansiona</Radio>
                    </RadioGroup>

                    <div className="flex gap-2">
                      <Input
                        variant="bordered"
                        color={formData.qrCode ? "success" : "primary"}
                        placeholder="QR Code"
                        value={formData.qrCode}
                        onChange={(e) => handleChange("qrCode", e.target.value)}
                        startContent={
                          <Icon
                            icon="solar:qr-code-bold"
                            className={
                              formData.qrCode
                                ? "text-success"
                                : "text-default-400"
                            }
                          />
                        }
                        isDisabled={formData.qrCodeType === "auto"}
                      />
                      {formData.qrCodeType === "auto" && (
                        <Button
                          color="primary"
                          variant="flat"
                          isIconOnly
                          onClick={generateQRCode}
                        >
                          <Icon icon="solar:refresh-bold" />
                        </Button>
                      )}
                      {formData.qrCodeType === "scan" && (
                        <Button
                          color="primary"
                          variant="flat"
                          isIconOnly
                          onClick={() => {
                            setScannerType("qrcode");
                            setIsScannerOpen(true);
                          }}
                        >
                          <Icon icon="solar:camera-bold" />
                        </Button>
                      )}
                      {formData.qrCode && (
                        <Popover
                          placement="top"
                          isOpen={showQRCodePopover}
                          onOpenChange={(open) => setShowQRCodePopover(open)}
                        >
                          <PopoverTrigger>
                            <Button color="primary" variant="flat" isIconOnly>
                              <Icon icon="solar:eye-bold" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="p-4">
                              <div className="bg-white p-4 rounded-lg">
                                <h3 className="text-lg font-medium mb-3 text-center">
                                  QR Code
                                </h3>
                                <div className="flex justify-center">
                                  <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                                      formData.qrCode
                                    )}`}
                                    alt="QR Code"
                                    className="h-48 w-48 object-contain"
                                  />
                                </div>
                                <p className="text-center text-xs text-default-500 mt-2">
                                  {formData.qrCode}
                                </p>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                    {formData.qrCodeType === "auto" && (
                      <p className="text-xs text-default-400">
                        Verrà generato un QR code basato su SKU e timestamp
                      </p>
                    )}
                    {formData.qrCodeType === "scan" && (
                      <p className="text-xs text-default-400">
                        Usa la fotocamera per scansionare un QR code esistente
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Tab>

            <Tab key="physical" title={getTabIcon("physical")}>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Peso */}
                <div>
                  <label className="block text-sm font-medium mb-2">Peso</label>
                  <Input
                    type="number"
                    variant="bordered"
                    color={formData.weight ? "success" : "primary"}
                    placeholder="Peso in kg"
                    value={formData.weight}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Permetti solo numeri positivi e decimali
                      if (
                        value === "" ||
                        (parseFloat(value) >= 0 && !isNaN(parseFloat(value)))
                      ) {
                        handleChange("weight", value);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "e" || e.key === "E") {
                        e.preventDefault();
                      }
                    }}
                    min="0"
                    step="0.01"
                    startContent={
                      <Icon
                        icon="solar:scales-bold"
                        className={
                          formData.weight ? "text-success" : "text-default-400"
                        }
                      />
                    }
                    endContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-default-400">kg</span>
                      </div>
                    }
                  />
                </div>

                {/* Dimensioni */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Dimensioni
                  </label>
                  <Input
                    variant="bordered"
                    color={formData.dimensions ? "success" : "primary"}
                    placeholder="LxWxH in cm"
                    value={formData.dimensions}
                    onChange={(e) => handleChange("dimensions", e.target.value)}
                    startContent={
                      <Icon
                        icon="solar:ruler-pen-bold"
                        className={
                          formData.dimensions
                            ? "text-success"
                            : "text-default-400"
                        }
                      />
                    }
                  />
                </div>
              </div>
            </Tab>

            <Tab
              key="attributes"
              title={
                <div className="flex items-center gap-2">
                  <Icon icon="solar:list-check-bold" />
                  <span>Attributi Prodotto</span>
                  {formData.attributes.length > 0 && (
                    <Chip
                      size="sm"
                      variant="flat"
                      color="primary"
                      className="gap-1"
                    >
                      {formData.attributes.length}
                    </Chip>
                  )}
                </div>
              }
            >
              <div className="mt-4 space-y-6">
                {/* Category Attributes */}
                {selectedCategoryAttributes.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Attributi della Categoria
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {formData.attributes
                        .filter((attr) =>
                          selectedCategoryAttributes.some(
                            (catAttr) => catAttr.id === attr.id
                          )
                        )
                        .map((attr) => (
                          <div key={attr.id} className="flex gap-4">
                            {attr.type === "boolean" ? (
                              <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">
                                  {attr.name}{" "}
                                  {attr.isRequired ? (
                                    <span className="text-danger">*</span>
                                  ) : (
                                    ""
                                  )}
                                </label>
                                <Switch
                                  checked={attr.value === "true"}
                                  onChange={(e) =>
                                    updateAttribute(
                                      attr.id,
                                      "value",
                                      e.target.checked.toString()
                                    )
                                  }
                                  color="primary"
                                />
                              </div>
                            ) : attr.type === "date" ? (
                              <div className="flex-1">
                                <label className="block text-sm font-medium mb-2">
                                  {attr.name}{" "}
                                  {attr.isRequired ? (
                                    <span className="text-danger">*</span>
                                  ) : (
                                    ""
                                  )}
                                </label>
                                <DatePicker
                                  id={`date-${attr.id}`}
                                  value={
                                    attr.value ? parseDate(attr.value) : null
                                  }
                                  onChange={(newDate) =>
                                    updateAttribute(
                                      attr.id,
                                      "value",
                                      newDate ? newDate.toString() : ""
                                    )
                                  }
                                  variant="bordered"
                                  color="primary"
                                />
                              </div>
                            ) : (
                              <div className="flex-1">
                                <label className="block text-sm font-medium mb-2">
                                  {attr.name}{" "}
                                  {attr.isRequired ? (
                                    <span className="text-danger">*</span>
                                  ) : (
                                    ""
                                  )}
                                </label>
                                <Input
                                  type={
                                    attr.type === "number" ? "number" : "text"
                                  }
                                  value={attr.value}
                                  onChange={(e) =>
                                    updateAttribute(
                                      attr.id,
                                      "value",
                                      e.target.value
                                    )
                                  }
                                  variant="bordered"
                                  color="primary"
                                  className="flex-1"
                                  isRequired={attr.isRequired}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Custom Attributes */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium">
                        Attributi Personalizzati
                      </h3>
                      <Tooltip
                        content={
                          <div className="px-1 py-2 max-w-xs">
                            <div className="text-small font-bold mb-2">
                              Cosa sono gli attributi personalizzati?
                            </div>
                            <div className="text-tiny">
                              <p className="mb-2">
                                Gli attributi personalizzati ti permettono di
                                aggiungere informazioni specifiche al prodotto
                                oltre a quelle standard.
                              </p>
                              <p className="font-bold mb-1">Puoi usarli per:</p>
                              <ul className="list-disc list-inside space-y-1">
                                <li>Specificare materiali e dimensioni</li>
                                <li>Aggiungere certificazioni</li>
                                <li>Indicare caratteristiche tecniche</li>
                                <li>Definire proprietà uniche</li>
                              </ul>
                            </div>
                          </div>
                        }
                        delay={0}
                        closeDelay={0}
                        placement="bottom"
                        showArrow
                      >
                        <Icon
                          icon="solar:info-circle-bold"
                          className="text-xl text-default-400 cursor-help"
                        />
                      </Tooltip>
                    </div>
                    {formData.attributes.filter(
                      (attr) =>
                        !selectedCategoryAttributes.some(
                          (catAttr) => catAttr.id === attr.id
                        )
                    ).length > 0 && (
                      <Button
                        color="primary"
                        variant="flat"
                        startContent={<Icon icon="solar:add-circle-bold" />}
                        onClick={addCustomAttribute}
                      >
                        Aggiungi Attributo
                      </Button>
                    )}
                  </div>

                  {formData.attributes.filter(
                    (attr) =>
                      !selectedCategoryAttributes.some(
                        (catAttr) => catAttr.id === attr.id
                      )
                  ).length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl border-default-200">
                      <div className="p-3 rounded-full bg-primary/10 mb-4">
                        <Icon
                          icon="solar:list-check-bold"
                          className="text-3xl text-primary"
                        />
                      </div>
                      <h4 className="text-lg font-medium text-default-600 mb-2">
                        Nessun attributo personalizzato
                      </h4>
                      <p className="text-sm text-default-500 text-center max-w-md mb-4">
                        Aggiungi attributi personalizzati per specificare
                        caratteristiche uniche del prodotto come materiali,
                        dimensioni specifiche, certificazioni o altre proprietà
                        rilevanti.
                      </p>
                      <Button
                        color="primary"
                        variant="flat"
                        startContent={<Icon icon="solar:add-circle-bold" />}
                        onClick={addCustomAttribute}
                      >
                        Aggiungi il primo attributo
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {formData.attributes
                        .filter(
                          (attr) =>
                            !selectedCategoryAttributes.some(
                              (catAttr) => catAttr.id === attr.id
                            )
                        )
                        .map((attr) => (
                          <div
                            key={attr.id}
                            className="grid grid-cols-[1fr,auto,1fr,auto,auto] items-center gap-4"
                          >
                            <Input
                              placeholder="Nome attributo"
                              value={attr.name}
                              onChange={(e) =>
                                updateAttribute(attr.id, "name", e.target.value)
                              }
                              variant="bordered"
                            />
                            <Select
                              selectedKeys={[attr.type]}
                              onSelectionChange={(keys) => {
                                const selectedKey = Array.from(
                                  keys
                                )[0] as string;
                                updateAttribute(attr.id, "type", selectedKey);
                              }}
                              variant="bordered"
                              className="w-40"
                            >
                              <SelectItem key="text" textValue="Testo">
                                Testo
                              </SelectItem>
                              <SelectItem key="number" textValue="Numero">
                                Numero
                              </SelectItem>
                              <SelectItem key="date" textValue="Data">
                                Data
                              </SelectItem>
                              <SelectItem key="boolean" textValue="Si/No">
                                Si/No
                              </SelectItem>
                            </Select>
                            {attr.type === "boolean" ? (
                              <div className="flex items-center">
                                <Switch
                                  checked={attr.value === "true"}
                                  onChange={(e) =>
                                    updateAttribute(
                                      attr.id,
                                      "value",
                                      e.target.checked.toString()
                                    )
                                  }
                                  color="primary"
                                />
                              </div>
                            ) : attr.type === "date" ? (
                              <DatePicker
                                id={`date-${attr.id}`}
                                value={
                                  attr.value ? parseDate(attr.value) : null
                                }
                                onChange={(newDate) =>
                                  updateAttribute(
                                    attr.id,
                                    "value",
                                    newDate ? newDate.toString() : ""
                                  )
                                }
                                variant="bordered"
                                color="primary"
                              />
                            ) : (
                              <Input
                                type={
                                  attr.type === "number" ? "number" : "text"
                                }
                                value={attr.value}
                                onChange={(e) =>
                                  updateAttribute(
                                    attr.id,
                                    "value",
                                    e.target.value
                                  )
                                }
                                variant="bordered"
                                color="primary"
                                placeholder="Valore"
                              />
                            )}
                            <div className="flex items-center">
                              <Checkbox
                                isSelected={Boolean(attr.isRequired)}
                                onValueChange={(checked) =>
                                  updateAttribute(
                                    attr.id,
                                    "isRequired",
                                    checked
                                  )
                                }
                                size="sm"
                                color="primary"
                              >
                                Obbligatorio
                              </Checkbox>
                            </div>
                            <Button
                              isIconOnly
                              color="danger"
                              variant="light"
                              onClick={() => removeAttribute(attr.id)}
                            >
                              <Icon
                                icon="solar:trash-bin-trash-bold"
                                className="text-lg"
                              />
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </Tab>

            <Tab
              key="certifications"
              title={
                <div className="flex items-center gap-2">
                  <Icon icon="solar:diploma-verified-bold" />
                  <span>Certificazioni e Documenti</span>
                </div>
              }
            >
              <div className="mt-4 space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Certificazioni e Documenti
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
                      isDraggingDocs
                        ? "border-primary bg-primary/10"
                        : "border-default-200"
                    }`}
                    onDragOver={(e) => handleDragOver(e, "certifications")}
                    onDragLeave={(e) => handleDragLeave(e, "certifications")}
                    onDrop={(e) => handleDrop(e, "certifications")}
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="p-3 rounded-full bg-primary/10">
                        <Icon
                          icon="solar:upload-bold"
                          className="text-2xl text-primary"
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-default-600">
                          Trascina qui i file o{" "}
                          <button
                            type="button"
                            className="text-primary hover:underline"
                            onClick={() => {
                              const input = document.createElement("input");
                              input.type = "file";
                              input.accept = ".pdf,.doc,.docx,.xls,.xlsx";
                              input.multiple = true;
                              input.onchange = (e) => {
                                const files = (e.target as HTMLInputElement)
                                  .files;
                                handleFileSelect(files, "certifications");
                              };
                              input.click();
                            }}
                          >
                            sfoglia
                          </button>
                        </p>
                        <p className="text-xs text-default-400 mt-1">
                          PDF, DOC, DOCX, XLS, XLSX (max. 10MB)
                        </p>
                      </div>
                    </div>

                    {/* Preview dei file */}
                    {formData.certifications.length > 0 && (
                      <div className="mt-4 grid grid-cols-1 gap-2">
                        {formData.certifications.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 border rounded-lg bg-default-50"
                          >
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-lg bg-default-100">
                                <Icon
                                  icon={getFileIcon(file.name)}
                                  className="text-xl text-default-600"
                                />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-default-700">
                                  {file.name}
                                </p>
                                <p className="text-xs text-default-400">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              isIconOnly
                              color="danger"
                              variant="light"
                              onClick={() =>
                                removeFile("certifications", index)
                              }
                            >
                              <Icon
                                icon="solar:trash-bin-trash-bold"
                                className="text-lg"
                              />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Tab>
          </Tabs>
          <Button
            type="submit"
            color="primary"
            variant="solid"
            isLoading={isSaving}
            disabled={isSaving}
            startContent={!isSaving && <Icon icon="solar:diskette-bold" />}
            className="min-w-32"
          >
            {isSaving ? "Salvataggio..." : "Salva Prodotto"}
          </Button>
        </form>
      </CardBody>
      {isScannerOpen && (
        <>
          <ScannerOverlay
            type={scannerType}
            onClose={stopScanner}
            error={scannerError}
            hasAttemptedScan={hasAttemptedScan}
            videoRef={videoRef}
            onCameraChange={handleCameraChange}
            availableCameras={availableCameras}
            selectedCamera={selectedCamera}
            onScanSuccess={handleScanSuccess}
          />
          {/* Success Overlay */}
          {showScanSuccess && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center">
              <div
                className={`absolute inset-0 ${
                  isDark ? "bg-success/90" : "bg-success/95"
                } backdrop-blur-md animate-fade-in`}
              />
              <div className="relative flex flex-col items-center text-center animate-success-pop">
                {/* Icona di successo con animazione */}
                <div className="relative mb-8">
                  <div
                    className={`w-32 h-32 rounded-full ${
                      isDark ? "bg-success/30" : "bg-success/20"
                    } flex items-center justify-center`}
                  >
                    <svg
                      className="w-20 h-20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        className={`${
                          isDark ? "stroke-success-400" : "stroke-success-500"
                        } stroke-2 fill-none`}
                      />
                      <path
                        d="M8 12l3 3 5-6"
                        className={`${
                          isDark ? "stroke-success-400" : "stroke-success-500"
                        } stroke-2 fill-none animate-checkmark-draw`}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  {/* Cerchi animati */}
                  <div
                    className={`absolute inset-0 rounded-full border-4 ${
                      isDark ? "border-success/20" : "border-success/10"
                    } animate-ping`}
                  />
                  <div
                    className={`absolute inset-0 rounded-full border-4 ${
                      isDark ? "border-success/20" : "border-success/10"
                    } animate-ping`}
                    style={{ animationDelay: "0.5s" }}
                  />
                </div>

                {/* Messaggio di successo */}
                <div className="space-y-4">
                  <h3
                    className={`text-3xl font-bold ${
                      isDark ? "text-white" : "text-zinc-800"
                    }`}
                  >
                    Scansione Completata!
                  </h3>
                  <p
                    className={`text-xl ${
                      isDark ? "text-white/80" : "text-zinc-600"
                    }`}
                  >
                    {scannerType === "barcode" ? "Codice a barre" : "QR code"}{" "}
                    rilevato con successo
                  </p>
                </div>

                {/* Codice scansionato */}
                <div
                  className={`mt-8 ${
                    isDark ? "bg-zinc-800/80" : "bg-zinc-100/90"
                  } rounded-xl p-6 w-full max-w-md mx-4 backdrop-blur-sm border ${
                    isDark ? "border-zinc-700/50" : "border-zinc-200"
                  }`}
                >
                  <p
                    className={`${
                      isDark ? "text-zinc-300" : "text-zinc-600"
                    } mb-3 text-lg`}
                  >
                    Codice rilevato:
                  </p>
                  <div
                    className={`${
                      isDark ? "bg-zinc-900/50" : "bg-white/80"
                    } rounded-lg p-4 border ${
                      isDark ? "border-zinc-700" : "border-zinc-200"
                    }`}
                  >
                    <p
                      className={`font-mono text-xl ${
                        isDark ? "text-success-400" : "text-success-600"
                      } break-all`}
                    >
                      {scannedCode}
                    </p>
                  </div>
                </div>

                {/* Indicatore di chiusura */}
                <div
                  className={`mt-8 flex items-center gap-2 ${
                    isDark ? "text-zinc-400" : "text-zinc-500"
                  }`}
                >
                  <Icon icon="solar:clock-circle-bold" className="text-xl" />
                  <p className="text-sm">
                    La schermata si chiuderà automaticamente...
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
