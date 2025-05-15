import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardBody,
  Input,
  Textarea,
  Button,
  Switch,
  Select,
  SelectItem,
  Divider,
  NumberInput,
  Tabs,
  Tab,
  Autocomplete,
  AutocompleteItem,
  Progress,
  Chip,
  Tooltip,
  Badge,
  Image,
  Popover,
  PopoverTrigger,
  PopoverContent,
  RadioGroup,
  Radio,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { BrowserMultiFormatReader, Result, Exception } from "@zxing/library";

interface ProductFormData {
  name: string;
  sku: string;
  description: string;
  price: number;
  minStockThreshold: string;
  hasVariants: boolean;
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
  barcodeType: "manual" | "auto" | "scan";
  qrCodeType: "manual" | "auto" | "scan";
  [key: string]:
    | string
    | number
    | boolean
    | FileWithPreview[]
    | "manual"
    | "auto"
    | "scan";
}

interface FileWithPreview extends File {
  preview: string;
}

interface Brand {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
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
}

function ScannerOverlay({
  type,
  onClose,
  error,
  hasAttemptedScan,
  videoRef,
}: ScannerOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <div className="absolute top-4 right-4 z-50">
        <Button
          isIconOnly
          color="default"
          variant="flat"
          onClick={onClose}
          className="bg-white/10 hover:bg-white/20"
        >
          <Icon icon="solar:close-circle-bold" className="text-white" />
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto px-4">
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            autoPlay
          />

          {/* Area di scansione */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={`relative ${
                type === "barcode" ? "w-96 h-48" : "w-72 h-72"
              }`}
            >
              {/* Mascheratura esterna */}
              <div className="absolute -inset-[1000px] bg-black/70">
                <div
                  className={`absolute left-[1000px] top-[1000px] ${
                    type === "barcode" ? "w-96 h-48" : "w-72 h-72"
                  } bg-transparent`}
                />
              </div>

              {/* Bordo area di scansione */}
              <div className="absolute inset-0 border border-white/20" />

              {/* Guide specifiche per tipo */}
              {type === "barcode" ? (
                <>
                  {/* Guide per codice a barre */}
                  <div className="absolute inset-0">
                    {/* Linee verticali guida */}
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-primary/30" />
                    <div className="absolute right-0 top-0 bottom-0 w-px bg-primary/30" />

                    {/* Area centrale evidenziata */}
                    <div className="absolute inset-y-0 left-1/4 right-1/4 border-l border-r border-primary/30" />

                    {/* Linea di scansione verticale */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-primary/50 animate-scan-vertical left-1/2 -translate-x-1/2" />
                  </div>

                  {/* Angoli per barcode */}
                  <div className="absolute inset-0">
                    <div className="absolute left-0 top-0 w-8 h-full border-l-2 border-primary" />
                    <div className="absolute right-0 top-0 w-8 h-full border-r-2 border-primary" />
                  </div>
                </>
              ) : (
                <>
                  {/* Guide per QR code */}
                  <div className="absolute inset-0">
                    {/* Griglia guida */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="border-primary/20 border-r last:border-r-0"
                        />
                      ))}
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="border-primary/20 border-b last:border-b-0"
                        />
                      ))}
                    </div>

                    {/* Angoli QR */}
                    {[
                      "top-0 left-0",
                      "top-0 right-0",
                      "bottom-0 left-0",
                      "bottom-0 right-0",
                    ].map((position) => (
                      <div key={position} className={`absolute ${position}`}>
                        <div className="relative w-12 h-12">
                          <div className="absolute inset-0 border-2 border-primary rounded-lg" />
                          <div className="absolute inset-2 border border-primary/50 rounded-md" />
                          <div className="absolute inset-4 bg-primary/30 rounded" />
                        </div>
                      </div>
                    ))}

                    {/* Linea di scansione diagonale per QR */}
                    <div
                      className="absolute top-0 left-0 w-[141%] h-0.5 bg-primary/50 animate-scan-diagonal origin-top-left"
                      style={{ transform: "rotate(45deg)" }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Testo guida e stato */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Icon
              icon={
                type === "barcode"
                  ? "solar:barcode-2-bold"
                  : "solar:qr-code-bold"
              }
              className="text-2xl text-primary"
            />
            <h3 className="text-white text-lg font-medium">
              Scansiona {type === "barcode" ? "Codice a Barre" : "QR Code"}
            </h3>
          </div>
          <p className="text-white/70 text-sm">
            {type === "barcode"
              ? "Posiziona il codice a barre orizzontalmente nell'area evidenziata"
              : "Centra il QR code all'interno del riquadro"}
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Icon icon="solar:lightbulb-bold" className="text-yellow-500" />
            <p className="text-yellow-200/70 text-xs">
              {type === "barcode"
                ? "Suggerimento: Mantieni il codice parallelo alle linee verticali"
                : "Suggerimento: Assicurati che tutti e 4 gli angoli siano visibili"}
            </p>
          </div>
        </div>

        {/* Errore (mostrato solo dopo un tentativo fallito) */}
        {error && hasAttemptedScan && (
          <div className="mt-4 w-full max-w-md">
            <div className="bg-danger/10 border border-danger/20 rounded-lg p-4">
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
                    <p className="text-danger/80 text-sm mt-1">
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

// Aggiungi le nuove animazioni agli stili
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
};

export default function AddProduct() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brandQuery, setBrandQuery] = useState("");
  const [categoryQuery, setCategoryQuery] = useState("");
  const [formProgress, setFormProgress] = useState(0);
  const [tabErrors, setTabErrors] = useState<TabError[]>([]);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    sku: "",
    description: "",
    price: 0,
    minStockThreshold: "",
    hasVariants: false,
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
    barcodeType: "manual",
    qrCodeType: "manual",
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

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    // Calculate form completion progress
    const requiredFields = [
      "name",
      "sku",
      "category",
      "price",
      "minStockThreshold",
      "supplier",
    ];
    const completedFields = requiredFields.filter(
      (field) => formData[field] && formData[field].toString().trim() !== ""
    );
    setFormProgress((completedFields.length / requiredFields.length) * 100);

    // Calculate errors per tab
    const errors: TabError[] = [];
    if (!formData.name || !formData.sku || !formData.category) {
      errors.push({
        tab: "basic",
        count: ["name", "sku", "category"].filter((f) => !formData[f]).length,
      });
    }
    if (!formData.price || !formData.supplier) {
      errors.push({
        tab: "commercial",
        count: ["price", "supplier"].filter((f) => !formData[f]).length,
      });
    }
    if (!formData.minStockThreshold) {
      errors.push({ tab: "warehouse", count: 1 });
    }
    setTabErrors(errors);
  }, [formData]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API calls
      await Promise.all([
        new Promise((resolve) => setTimeout(resolve, 1000)), // Simulate API delay
      ]);
      setBrands([
        { id: "1", name: "Apple" },
        { id: "2", name: "Samsung" },
        { id: "3", name: "Sony" },
      ]);
      setCategories([
        { id: "1", name: "Elettronica" },
        { id: "2", name: "Abbigliamento" },
        { id: "3", name: "Alimentari" },
        { id: "4", name: "Casa e Giardino" },
        { id: "5", name: "Sport" },
      ]);
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(brandQuery.toLowerCase())
  );

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(categoryQuery.toLowerCase())
  );

  const handleBrandSelection = (brandName: string) => {
    handleChange("brand", brandName);
  };

  const handleCategorySelection = (categoryName: string) => {
    handleChange("category", categoryName);
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // TODO: Implement API call to save product
      await new Promise((resolve) => setTimeout(resolve, 1000));
      navigate("/inventory/products");
    } catch (error) {
      console.error("Error saving product:", error);
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
      case "variants":
        return "solar:layers-bold";
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
      case "variants":
        return "Varianti e Descrizioni";
      default:
        return "";
    }
  };

  const handleFileSelect = (
    files: FileList | null,
    type: "photos" | "documents"
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

  const handleDragOver = (e: React.DragEvent, type: "photos" | "documents") => {
    e.preventDefault();
    e.stopPropagation();
    if (type === "photos") {
      setIsDraggingPhotos(true);
    } else {
      setIsDraggingDocs(true);
    }
  };

  const handleDragLeave = (
    e: React.DragEvent,
    type: "photos" | "documents"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === "photos") {
      setIsDraggingPhotos(false);
    } else {
      setIsDraggingDocs(false);
    }
  };

  const handleDrop = (e: React.DragEvent, type: "photos" | "documents") => {
    e.preventDefault();
    e.stopPropagation();
    if (type === "photos") {
      setIsDraggingPhotos(false);
    } else {
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
    };
  }, [formData.photos, formData.documents]);

  const removeFile = (type: "photos" | "documents", index: number) => {
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
        codeReader.current = new BrowserMultiFormatReader();
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

    const initializeScanner = async () => {
      if (isScannerOpen && scannerType && isActive) {
        try {
          await startScanner(scannerType);
        } catch (error) {
          console.error("Error in scanner initialization:", error);
        }
      }
    };

    initializeScanner();

    return () => {
      isActive = false;
      if (codeReader.current) {
        console.log("Stopping video stream...");
        codeReader.current.reset();
      }
    };
  }, [isScannerOpen, scannerType]);

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

    try {
      console.log("Checking camera prerequisites...");
      if (!codeReader.current) {
        // Reinitialize if needed
        codeReader.current = new BrowserMultiFormatReader();
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
          await navigator.mediaDevices.getUserMedia({ video: true });
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

      const selectedDeviceId = videoInputDevices[0].deviceId;
      console.log("Selected device ID:", selectedDeviceId);

      console.log("Starting video stream...");
      await codeReader.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result: Result | null, err: Exception | undefined) => {
          if (result) {
            console.log("Code detected:", result.getText());
            const scannedCode = result.getText();
            handleChange(
              type === "barcode" ? "barcode" : "qrCode",
              scannedCode
            );
            setIsScannerOpen(false);
          }
          // Imposta il flag solo se c'è un errore reale (non NotFoundException)
          if (err && err?.message !== "NotFoundException") {
            setHasAttemptedScan(true);
            console.error("Scanning error:", err);
            setScannerError(
              "Errore durante la scansione. Assicurati che il codice sia ben visibile e riprova."
            );
          }
        }
      );
      console.log("Video stream started successfully");
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
          errorMessage = "Nessuna fotocamera trovata";
          helpMessage =
            "Verifica che il tuo dispositivo abbia una fotocamera funzionante e che non sia in uso da altre applicazioni.";
          break;
        case "Il tuo browser non supporta l'accesso alla fotocamera":
          errorMessage = "Browser non supportato";
          helpMessage =
            "Prova a utilizzare un browser più recente come Chrome, Firefox o Safari.";
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

  const checkCameraPermissions = async () => {
    try {
      // Check if permissions API is supported
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({
          name: "camera" as PermissionName,
        });
        setCameraPermissionState(result.state);

        // Listen for permission changes
        result.addEventListener("change", () => {
          setCameraPermissionState(result.state);
        });
      } else {
        // Fallback for browsers that don't support permissions API
        try {
          await navigator.mediaDevices.getUserMedia({ video: true });
          setCameraPermissionState("granted");
        } catch (error: any) {
          if (error.name === "NotAllowedError") {
            setCameraPermissionState("denied");
          }
        }
      }
    } catch (error) {
      console.error("Error checking camera permissions:", error);
    }
  };

  useEffect(() => {
    checkCameraPermissions();
  }, []);

  const requestCameraPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraPermissionState("granted");
      // Restart scanner after getting permission
      startScanner(scannerType);
    } catch (error) {
      console.error("Error requesting camera permission:", error);
      setCameraPermissionState("denied");
    }
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
    <Card>
      <CardHeader className="border-b border-default-200">
        <div className="flex flex-col gap-4 w-full">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Informazioni Prodotto</h2>
            <Chip
              color={formProgress === 100 ? "success" : "primary"}
              variant="flat"
            >
              Completato: {formProgress.toFixed(0)}%
            </Chip>
          </div>
          <Progress
            value={formProgress}
            color={formProgress === 100 ? "success" : "primary"}
            size="sm"
            className="max-w-full"
          />
        </div>
      </CardHeader>
      <CardBody className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            color="primary"
            variant="underlined"
            classNames={{
              tabList: "gap-6",
              cursor: "w-full",
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
                  </label>
                  <Input
                    placeholder="Stock Keeping Unit"
                    variant="bordered"
                    color={formData.sku ? "success" : "primary"}
                    value={formData.sku}
                    onChange={(e) => handleChange("sku", e.target.value)}
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
                        <AutocompleteItem textValue={category.name}>
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
              </div>
            </Tab>

            <Tab key="commercial" title={getTabIcon("commercial")}>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Prezzo */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Prezzo <span className="text-danger">*</span>
                  </label>
                  <NumberInput
                    variant="bordered"
                    color={formData.price ? "success" : "primary"}
                    placeholder="0.00"
                    startContent={<span className="text-default-400">€</span>}
                    value={formData.price}
                    onChange={(e) => handleChange("price", e)}
                    isRequired
                  />
                </div>

                {/* Fornitore */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Fornitore <span className="text-danger">*</span>
                  </label>
                  <Input
                    variant="bordered"
                    color={formData.supplier ? "success" : "primary"}
                    placeholder="Nome fornitore"
                    value={formData.supplier}
                    onChange={(e) => handleChange("supplier", e.target.value)}
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
                  />
                </div>
              </div>
            </Tab>

            <Tab key="warehouse" title={getTabIcon("warehouse")}>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    onChange={(e) =>
                      handleChange("minStockThreshold", e.target.value)
                    }
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
                        isDisabled={formData.barcodeType === "auto"}
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
                        <Popover placement="top">
                          <PopoverTrigger>
                            <Button color="primary" variant="flat" isIconOnly>
                              <Icon icon="solar:eye-bold" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent>
                            <div className="p-4">
                              <div className="bg-white p-4 rounded-lg">
                                {/* TODO: Implementare visualizzazione barcode */}
                                <p className="text-center font-mono">
                                  {formData.barcode}
                                </p>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                    {formData.barcodeType === "auto" && (
                      <p className="text-xs text-default-400">
                        Verrà generato un codice EAN-13 univoco
                      </p>
                    )}
                    {formData.barcodeType === "scan" && (
                      <p className="text-xs text-default-400">
                        Usa la fotocamera per scansionare un codice a barre
                        esistente
                      </p>
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
                        <Popover placement="top">
                          <PopoverTrigger>
                            <Button color="primary" variant="flat" isIconOnly>
                              <Icon icon="solar:eye-bold" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent>
                            <div className="p-4">
                              <div className="bg-white p-4 rounded-lg">
                                {/* TODO: Implementare visualizzazione QR code */}
                                <p className="text-center font-mono">
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
                    onChange={(e) => handleChange("weight", e.target.value)}
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

            <Tab key="variants" title={getTabIcon("variants")}>
              <div className="mt-4 space-y-6">
                {/* Varianti */}
                <div className="flex items-center gap-2">
                  <Switch
                    color={formData.hasVariants ? "success" : "primary"}
                    checked={formData.hasVariants}
                    onChange={(e) =>
                      handleChange("hasVariants", e.target.checked)
                    }
                  />
                  <label className="text-sm font-medium">
                    Il prodotto ha varianti
                  </label>
                </div>

                {/* Descrizione */}
                <div>
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

                {/* Note */}
                <div>
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

            <Tab
              key="photos"
              title={
                <div className="flex items-center gap-2">
                  <Icon icon="solar:gallery-bold" />
                  <span>Foto</span>
                  {formData.photos.length > 0 && (
                    <Chip
                      size="sm"
                      variant="flat"
                      color="primary"
                      className="gap-1"
                      startContent={
                        <Icon
                          icon="solar:gallery-add-bold"
                          className="text-xs"
                        />
                      }
                    >
                      {formData.photos.length}
                    </Chip>
                  )}
                </div>
              }
            >
              <div className="mt-4 space-y-6">
                <div
                  className={`relative border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer
                    ${
                      isDraggingPhotos
                        ? "border-primary bg-primary/10 scale-102"
                        : "border-default-300 hover:border-primary hover:bg-default-100"
                    }
                  `}
                  onDragOver={(e) => handleDragOver(e, "photos")}
                  onDragLeave={(e) => handleDragLeave(e, "photos")}
                  onDrop={(e) => handleDrop(e, "photos")}
                  onClick={() => photoInputRef.current?.click()}
                >
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files, "photos")}
                  />
                  <div className="flex flex-col items-center justify-center p-8">
                    <div
                      className={`p-4 rounded-full bg-primary/10 mb-4 transition-transform duration-200 ${
                        isDraggingPhotos ? "scale-110" : ""
                      }`}
                    >
                      <Icon
                        icon={
                          isDraggingPhotos
                            ? "solar:gallery-add-bold"
                            : "solar:upload-bold"
                        }
                        className={`text-4xl ${
                          isDraggingPhotos ? "text-primary" : "text-default-400"
                        }`}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-default-600 font-medium">
                        {isDraggingPhotos
                          ? "Rilascia qui le foto"
                          : "Trascina qui le foto o clicca per selezionarle"}
                      </p>
                      <p className="text-sm text-default-400 mt-2">
                        Formati supportati: JPG, PNG, GIF (max 5MB)
                      </p>
                    </div>
                  </div>
                </div>

                {formData.photos.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Foto caricate</h3>
                      <Button
                        color="danger"
                        variant="light"
                        startContent={
                          <Icon icon="solar:trash-bin-trash-bold" />
                        }
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, photos: [] }))
                        }
                      >
                        Rimuovi tutte
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {formData.photos.map((file, index) => (
                        <div key={index} className="group relative">
                          <div className="aspect-square rounded-xl overflow-hidden border-2 border-default-200 bg-default-100">
                            <Image
                              src={file.preview}
                              alt={file.name}
                              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-xl">
                            <div className="flex gap-2">
                              <Tooltip content="Visualizza foto">
                                <Button
                                  isIconOnly
                                  color="default"
                                  variant="flat"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // TODO: Implement photo preview modal
                                  }}
                                >
                                  <Icon icon="solar:eye-bold" />
                                </Button>
                              </Tooltip>
                              <Tooltip content="Rimuovi foto">
                                <Button
                                  isIconOnly
                                  color="danger"
                                  variant="flat"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeFile("photos", index);
                                  }}
                                >
                                  <Icon icon="solar:trash-bin-trash-bold" />
                                </Button>
                              </Tooltip>
                            </div>
                          </div>
                          <div className="absolute bottom-2 left-2 right-2">
                            <Tooltip content={file.name}>
                              <p className="text-xs truncate bg-white/80 text-default-700 rounded-lg px-2 py-1">
                                {file.name}
                              </p>
                            </Tooltip>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Tab>

            <Tab
              key="documents"
              title={
                <div className="flex items-center gap-2">
                  <Icon icon="solar:document-bold" />
                  <span>Documenti</span>
                  {formData.documents.length > 0 && (
                    <Chip
                      size="sm"
                      variant="flat"
                      color="primary"
                      className="gap-1"
                      startContent={
                        <Icon
                          icon="solar:document-add-bold"
                          className="text-xs"
                        />
                      }
                    >
                      {formData.documents.length}
                    </Chip>
                  )}
                </div>
              }
            >
              <div className="mt-4 space-y-6">
                <div
                  className={`relative border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer
                    ${
                      isDraggingDocs
                        ? "border-primary bg-primary/10 scale-102"
                        : "border-default-300 hover:border-primary hover:bg-default-100"
                    }
                  `}
                  onDragOver={(e) => handleDragOver(e, "documents")}
                  onDragLeave={(e) => handleDragLeave(e, "documents")}
                  onDrop={(e) => handleDrop(e, "documents")}
                  onClick={() => docInputRef.current?.click()}
                >
                  <input
                    ref={docInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    multiple
                    className="hidden"
                    onChange={(e) =>
                      handleFileSelect(e.target.files, "documents")
                    }
                  />
                  <div className="flex flex-col items-center justify-center p-8">
                    <div
                      className={`p-4 rounded-full bg-primary/10 mb-4 transition-transform duration-200 ${
                        isDraggingDocs ? "scale-110" : ""
                      }`}
                    >
                      <Icon
                        icon={
                          isDraggingDocs
                            ? "solar:document-add-bold"
                            : "solar:upload-bold"
                        }
                        className={`text-4xl ${
                          isDraggingDocs ? "text-primary" : "text-default-400"
                        }`}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-default-600 font-medium">
                        {isDraggingDocs
                          ? "Rilascia qui i documenti"
                          : "Trascina qui i documenti o clicca per selezionarli"}
                      </p>
                      <p className="text-sm text-default-400 mt-2">
                        Formati supportati: PDF, DOC, DOCX, XLS, XLSX (max 10MB)
                      </p>
                    </div>
                  </div>
                </div>

                {formData.documents.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">
                        Documenti caricati
                      </h3>
                      <Button
                        color="danger"
                        variant="light"
                        startContent={
                          <Icon icon="solar:trash-bin-trash-bold" />
                        }
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, documents: [] }))
                        }
                      >
                        Rimuovi tutti
                      </Button>
                    </div>
                    <div className="grid gap-3">
                      {formData.documents.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 border-2 border-default-200 rounded-xl bg-default-50 group hover:bg-default-100 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-default-100 group-hover:bg-default-200 transition-colors">
                              <Icon
                                icon={getFileIcon(file.name)}
                                className="text-2xl text-default-600"
                              />
                            </div>
                            <div>
                              <Tooltip content={file.name}>
                                <p className="font-medium truncate max-w-[200px]">
                                  {file.name}
                                </p>
                              </Tooltip>
                              <p className="text-sm text-default-400">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Tooltip content="Visualizza documento">
                              <Button
                                isIconOnly
                                color="default"
                                variant="flat"
                                size="sm"
                                onClick={() => {
                                  // TODO: Implement document preview/download
                                }}
                              >
                                <Icon icon="solar:eye-bold" />
                              </Button>
                            </Tooltip>
                            <Tooltip content="Rimuovi documento">
                              <Button
                                isIconOnly
                                color="danger"
                                variant="flat"
                                size="sm"
                                onClick={() => removeFile("documents", index)}
                              >
                                <Icon icon="solar:trash-bin-trash-bold" />
                              </Button>
                            </Tooltip>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Tab>
          </Tabs>

          <Divider className="my-6" />

          {/* Pulsanti */}
          <div className="flex justify-between items-center">
            <Button
              variant="flat"
              color="default"
              onClick={() => navigate("/inventory/products")}
              startContent={<Icon icon="solar:arrow-left-bold" />}
            >
              Annulla
            </Button>
            <div className="flex gap-3">
              <Tooltip
                content={
                  formProgress < 100
                    ? "Completa tutti i campi obbligatori"
                    : "Salva prodotto"
                }
              >
                <Button
                  color="primary"
                  type="submit"
                  isLoading={isSaving}
                  isDisabled={formProgress < 100}
                  startContent={!isSaving && <Icon icon="solar:disk-bold" />}
                >
                  {isSaving ? "Salvataggio..." : "Salva Prodotto"}
                </Button>
              </Tooltip>
            </div>
          </div>
        </form>
      </CardBody>
      {isScannerOpen && (
        <ScannerOverlay
          type={scannerType}
          onClose={stopScanner}
          error={scannerError || cameraError}
          hasAttemptedScan={hasAttemptedScan}
          videoRef={videoRef}
        />
      )}
    </Card>
  );
}
