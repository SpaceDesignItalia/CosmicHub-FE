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
  CardFooter,
  DatePicker,
  Checkbox,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { BrowserMultiFormatReader, Result, Exception } from "@zxing/library";
import axios from "axios";
import { parseDate } from "@internationalized/date";
import QRCode from "react-qr-code";
import Barcode from "react-barcode";

interface ProductFormData {
  name: string;
  sku: string;
  description: string;
  price: string;
  costPrice: string;
  retailPrice: string;
  wholesalePrice: string;
  minWholesaleQty: string;
  taxRate: string;
  currency: string;
  minStockThreshold: string;
  maxStockThreshold: string;
  reorderPoint: string;
  reorderQuantity: string;
  currentStock: string;
  stockUnit: string;
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
  attributes: ProductAttribute[];
  variants: ProductVariant[];
  packagingType: string;
  packagingWeight: string;
  packagingVolume: string;
  shippingNotes: string;
  [key: string]:
    | string
    | boolean
    | FileWithPreview[]
    | "manual"
    | "auto"
    | "scan"
    | ProductAttribute[]
    | ProductVariant[];
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
  scanSuccess: boolean;
  lastScannedCode: string | null;
  onCameraSelect: (deviceId: string) => void;
  availableCameras: MediaDeviceInfo[];
  selectedCamera: string;
}

interface ProductAttribute {
  id: string;
  name: string;
  type: string;
  value: string;
  isRequired: boolean;
}

interface ProductVariant {
  id: string;
  name: string;
  attributes: ProductAttribute[];
}

function ScannerOverlay({
  type,
  onClose,
  error,
  hasAttemptedScan,
  videoRef,
  scanSuccess,
  lastScannedCode,
  onCameraSelect,
  availableCameras,
  selectedCamera,
}: ScannerOverlayProps) {
  const [isCameraPermissionRequested, setIsCameraPermissionRequested] =
    useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isCameraSettingsOpen, setIsCameraSettingsOpen] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col max-h-screen overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 left-0 right-0 bg-gradient-to-b from-black/80 via-black/50 to-transparent p-3 z-50">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/20 backdrop-blur-sm border border-primary/20">
              <Icon
                icon={
                  type === "barcode"
                    ? "solar:barcode-2-bold"
                    : "solar:qr-code-bold"
                }
                className="text-xl text-primary"
              />
            </div>
            <div>
              <h2 className="text-white text-base font-medium">
                {type === "barcode"
                  ? "Scansione Codice a Barre"
                  : "Scansione QR Code"}
              </h2>
              <p className="text-white/70 text-xs">
                {type === "barcode"
                  ? "Posiziona il codice a barre nell'area evidenziata"
                  : "Centra il QR code all'interno del riquadro"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              isIconOnly
              color="default"
              variant="flat"
              onClick={() => setIsCameraSettingsOpen(!isCameraSettingsOpen)}
              className="bg-white/10 hover:bg-white/20"
            >
              <Icon icon="solar:settings-bold" className="text-white" />
            </Button>
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
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Camera Settings Panel */}
        {isCameraSettingsOpen && (
          <Card className="w-full mb-4">
            <div className="p-3 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/20">
                    <Icon
                      icon="solar:camera-bold"
                      className="text-lg text-primary"
                    />
                  </div>
                  <h3 className="text-sm font-medium">
                    Impostazioni Fotocamera
                  </h3>
                </div>
                <Button
                  isIconOnly
                  size="sm"
                  color="default"
                  variant="light"
                  onClick={() => setIsCameraSettingsOpen(false)}
                >
                  <Icon icon="solar:close-circle-bold" className="text-lg" />
                </Button>
              </div>
            </div>
            <div className="p-3">
              {availableCameras.length > 0 ? (
                <Select
                  variant="bordered"
                  selectedKeys={[selectedCamera]}
                  onChange={(e) => onCameraSelect(e.target.value)}
                  size="sm"
                  startContent={
                    <Icon
                      icon="solar:video-frame-bold"
                      className="text-primary"
                    />
                  }
                  label="Fotocamera attiva"
                >
                  {availableCameras.map((camera, index) => (
                    <SelectItem
                      key={camera.deviceId}
                      textValue={camera.label || `Camera ${index + 1}`}
                    >
                      <div className="flex items-center gap-2">
                        {camera.deviceId === selectedCamera && (
                          <Badge
                            color="success"
                            variant="flat"
                            size="sm"
                            className="bg-success/20 text-success"
                          >
                            Attiva
                          </Badge>
                        )}
                        <span className="text-sm">
                          {camera.label || `Camera ${index + 1}`}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </Select>
              ) : (
                <div className="p-3 bg-warning-900/20 border border-warning-700/30 rounded-lg">
                  <div className="flex items-center gap-2 text-warning-300">
                    <Icon
                      icon="solar:danger-triangle-bold"
                      className="text-lg"
                    />
                    <p className="text-sm">
                      Nessuna fotocamera trovata sul tuo dispositivo
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Scanner View */}
        <div
          className={`relative w-full aspect-[4/3] rounded-xl overflow-hidden backdrop-blur-sm border border-white/10 ${
            scanSuccess ? "ring-4 ring-success" : ""
          }`}
        >
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            autoPlay
            muted
          />

          {/* Scanning Area */}
          {availableCameras.length > 0 && !scanSuccess && (
            <div className="absolute inset-0 flex items-center justify-center">
              {type === "barcode" ? (
                <div className="relative w-[90%] h-24 max-w-lg">
                  <div className="absolute inset-0 border-2 border-primary/50 rounded-lg">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-pulse" />
                  </div>
                </div>
              ) : (
                <div className="relative w-56 h-56">
                  <div className="absolute inset-0 border-2 border-primary/50 rounded-lg">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-pulse" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Success Overlay */}
          {scanSuccess && (
            <div className="absolute inset-0 bg-success/20 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-success/90 text-white p-4 rounded-lg shadow-lg max-w-sm w-full mx-4">
                <div className="flex items-start gap-3">
                  <div className="shrink-0">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Icon
                        icon="solar:check-circle-bold"
                        className="text-2xl"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-medium mb-1">
                      Codice Rilevato!
                    </h3>
                    <p className="text-success-100 text-xs break-all font-mono bg-white/10 p-2 rounded">
                      {lastScannedCode}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Messages */}
        <div className="text-center">
          {!scanSuccess && availableCameras.length > 0 && (
            <div className="space-y-1">
              <p className="text-white/70 text-sm">
                {type === "barcode"
                  ? "Posiziona il codice a barre orizzontalmente nell'area evidenziata"
                  : "Centra il QR code all'interno del riquadro"}
              </p>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && hasAttemptedScan && !scanSuccess && (
          <div className="w-full max-w-md">
            <div className="bg-danger-900/20 border border-danger-700/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <div className="p-1.5 rounded-lg bg-danger-500/20">
                  <Icon
                    icon="solar:danger-triangle-bold"
                    className="text-danger-300 text-lg"
                  />
                </div>
                <div>
                  <p className="text-danger-200 text-sm font-medium">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AddProduct() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    sku: "",
    description: "",
    price: "",
    costPrice: "",
    retailPrice: "",
    wholesalePrice: "",
    minWholesaleQty: "",
    taxRate: "",
    currency: "EUR",
    minStockThreshold: "",
    maxStockThreshold: "",
    reorderPoint: "",
    reorderQuantity: "",
    currentStock: "0",
    stockUnit: "PZ",
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
    attributes: [],
    variants: [],
    packagingType: "",
    packagingWeight: "",
    packagingVolume: "",
    shippingNotes: "",
  });
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
  const [scanSuccess, setScanSuccess] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>(
    []
  );
  const [selectedCamera, setSelectedCamera] = useState<string>("");

  useEffect(() => {
    loadInitialData();
    loadSuppliers();
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
      // Reset any existing reader
      if (codeReader.current) {
        codeReader.current.reset();
      }

      // Create a new reader instance
      codeReader.current = new BrowserMultiFormatReader();

      if (!videoRef.current) {
        throw new Error("Scanner non inizializzato correttamente");
      }

      // Get cameras if we don't have any yet, but preserve camera selection
      if (availableCameras.length === 0) {
        console.log("Nessuna fotocamera disponibile, recupero elenco...");
        await getAvailableCameras();
      }

      if (!selectedCamera) {
        throw new Error("Nessuna fotocamera selezionata");
      }

      console.log("Starting video stream with camera:", selectedCamera);

      // Configure video constraints
      const constraints = {
        video: {
          deviceId: { exact: selectedCamera },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      // Test camera access
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        stream.getTracks().forEach((track) => track.stop());
      } catch (error) {
        console.error("Camera test failed:", error);
        throw new Error("Impossibile accedere alla fotocamera selezionata");
      }

      // Start decoding from video device
      await codeReader.current.decodeFromVideoDevice(
        selectedCamera,
        videoRef.current,
        (result: Result | null, err: Exception | undefined) => {
          if (result) {
            console.log("Code detected:", result.getText());
            const scannedCode = result.getText();
            setLastScannedCode(scannedCode);
            setScanSuccess(true);

            // Stop the camera immediately
            if (codeReader.current) {
              console.log("Stopping camera after successful scan...");
              codeReader.current.reset();
            }

            // Update form data after a delay
            setTimeout(() => {
              handleChange(
                type === "barcode" ? "barcode" : "qrCode",
                scannedCode
              );
              setIsScannerOpen(false);
              setScanSuccess(false);
              setLastScannedCode(null);
            }, 2000);
          }
          if (err && err?.message !== "NotFoundException") {
            setHasAttemptedScan(true);
            console.error("Scanning error:", err);
            setScannerError(
              "Errore durante la scansione. Assicurati che il codice sia ben visibile e riprova."
            );
          }
        }
      );
    } catch (error: any) {
      setHasAttemptedScan(true);
      console.error("Scanner error:", error);
      let errorMessage = "Impossibile accedere alla fotocamera.";
      let helpMessage = "";

      if (
        error.name === "NotAllowedError" ||
        error.message.includes("Permission denied")
      ) {
        errorMessage = "Accesso alla fotocamera negato";
        helpMessage =
          cameraPermissionState === "denied"
            ? "Per risolvere:\n1. Apri le impostazioni del browser\n2. Cerca le impostazioni dei permessi del sito\n3. Riattiva l'accesso alla fotocamera"
            : "Per risolvere:\n1. Controlla la barra degli indirizzi del browser\n2. Clicca sull'icona della fotocamera\n3. Seleziona 'Consenti'";
      } else if (error.message.includes("Scanner non inizializzato")) {
        errorMessage = "Errore di inizializzazione";
        helpMessage =
          "Ricarica la pagina e riprova. Se il problema persiste, verifica che il browser sia aggiornato all'ultima versione.";
      } else if (error.message.includes("Nessuna fotocamera")) {
        errorMessage = "Nessuna fotocamera trovata";
        helpMessage =
          "Verifica che il tuo dispositivo abbia una fotocamera funzionante e che non sia in uso da altre applicazioni.";
      }

      setScannerError(`${errorMessage}\n\n${helpMessage}`);
    } finally {
      setIsInitializingCamera(false);
    }
  };

  // Modify getAvailableCameras to better handle camera selection
  const getAvailableCameras = async () => {
    try {
      setIsInitializingCamera(true);
      setCameraError(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "Il tuo browser non supporta l'accesso alla fotocamera"
        );
      }

      console.log("Richiedendo l'accesso alla fotocamera...");

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        stream.getTracks().forEach((track) => {
          track.stop();
          console.log("Stream di test fermato");
        });

        setCameraPermissionState("granted");
      } catch (permError: any) {
        console.error("Errore permessi fotocamera:", permError);

        if (
          permError.name === "NotAllowedError" ||
          permError.name === "PermissionDeniedError"
        ) {
          setCameraPermissionState("denied");
          throw new Error("Permesso fotocamera negato");
        }
      }

      // Se siamo ancora qui, possiamo enumerare i dispositivi
      console.log("Enumerando dispositivi...");
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );

      console.log("Fotocamere trovate:", videoDevices.length, videoDevices);

      if (videoDevices.length === 0) {
        throw new Error("Nessuna fotocamera trovata sul dispositivo");
      }

      setAvailableCameras(videoDevices);

      // Selezione della fotocamera solo se non è già stata selezionata una
      if (videoDevices.length > 0 && !selectedCamera) {
        let preferredCamera;

        // Per la scansione di codici a barre, preferiamo la fotocamera posteriore
        if (scannerType === "barcode") {
          preferredCamera = videoDevices.find(
            (device) =>
              device.label.toLowerCase().includes("back") ||
              device.label.toLowerCase().includes("rear") ||
              device.label.toLowerCase().includes("posteriore") ||
              device.label.toLowerCase().includes("retro")
          );
        }

        // Se non troviamo una fotocamera preferita o stiamo scansionando QR, usiamo la prima disponibile
        if (!preferredCamera) {
          preferredCamera = videoDevices[0];
        }

        console.log("Fotocamera selezionata automaticamente:", preferredCamera);
        setSelectedCamera(preferredCamera.deviceId);
      } else {
        console.log("Mantenuta la fotocamera selezionata:", selectedCamera);
      }

      return true;
    } catch (error: any) {
      console.error("Errore nell'ottenere le fotocamere:", error);
      let errorMessage = "Impossibile accedere alle fotocamere";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      setCameraError(errorMessage);
      setAvailableCameras([]);
      return false;
    } finally {
      setIsInitializingCamera(false);
    }
  };

  // Modify handleCameraSelect for better error handling and feedback
  const handleCameraSelect = async (deviceId: string) => {
    try {
      console.log("Switching to camera:", deviceId);
      setIsInitializingCamera(true);

      // Set the selected camera immediately
      setSelectedCamera(deviceId);

      // Stop current scanner and stream
      if (codeReader.current) {
        console.log("Stopping current scanner...");
        codeReader.current.reset();
      }

      // Stop any existing stream
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => {
          track.stop();
          console.log("Stopped track:", track.label);
        });
        videoRef.current.srcObject = null;
      }

      // Clear any existing errors
      setScannerError(null);
      setCameraError(null);

      // Create a new reader instance to ensure clean state
      codeReader.current = new BrowserMultiFormatReader();

      // Restart scanner directly without going through other checks
      if (!videoRef.current) {
        throw new Error("Scanner non inizializzato correttamente");
      }

      console.log(
        "Starting video stream with newly selected camera:",
        deviceId
      );

      // Configure video constraints
      const constraints = {
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      // Start decoding directly with the new camera
      await codeReader.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result: Result | null, err: Exception | undefined) => {
          if (result) {
            console.log("Code detected:", result.getText());
            const scannedCode = result.getText();
            setLastScannedCode(scannedCode);
            setScanSuccess(true);

            // Stop the camera immediately
            if (codeReader.current) {
              console.log("Stopping camera after successful scan...");
              codeReader.current.reset();
            }

            // Update form data after a delay
            setTimeout(() => {
              handleChange(
                scannerType === "barcode" ? "barcode" : "qrCode",
                scannedCode
              );
              setIsScannerOpen(false);
              setScanSuccess(false);
              setLastScannedCode(null);
            }, 2000);
          }
          if (err && err?.message !== "NotFoundException") {
            setHasAttemptedScan(true);
            console.error("Scanning error:", err);
            setScannerError(
              "Errore durante la scansione. Assicurati che il codice sia ben visibile e riprova."
            );
          }
        }
      );
    } catch (error) {
      console.error("Error in camera switch:", error);
      setCameraError("Errore nel cambio della fotocamera. Riprova.");
      setIsInitializingCamera(false);
    }
  };

  // Modifica la gestione dell'apertura dello scanner
  const openScanner = async (type: "barcode" | "qrcode") => {
    setScannerType(type);
    setIsScannerOpen(true);
    setScanSuccess(false);
    setLastScannedCode(null);
    setHasAttemptedScan(false);
    setCameraError(null);
    setScannerError(null);

    // Resetta il riferimento alla fotocamera
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    // Inizializza l'elenco delle fotocamere se non è già stato fatto
    if (availableCameras.length === 0) {
      console.log("Inizializzazione fotocamere...");
      const success = await getAvailableCameras();
      if (success && selectedCamera) {
        // Se abbiamo trovato delle fotocamere, avvia la scansione
        console.log("Fotocamere trovate, avvio scanner...");
        await startScanner(type);
      }
    } else if (!selectedCamera && availableCameras.length > 0) {
      // Se abbiamo fotocamere ma nessuna selezionata, seleziona la prima
      console.log(
        "Nessuna fotocamera selezionata, selezione la prima disponibile"
      );
      setSelectedCamera(availableCameras[0].deviceId);
      await startScanner(type);
    } else {
      // Se abbiamo già un elenco di fotocamere e una selezionata, avvia la scansione
      console.log("Avvio scanner con fotocamera selezionata:", selectedCamera);
      await startScanner(type);
    }
  };

  // Funzione per chiudere correttamente lo scanner
  const closeScanner = () => {
    console.log("Chiusura scanner...");

    // Fermiamo lo stream della fotocamera se attivo
    if (videoRef.current && videoRef.current.srcObject) {
      try {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => {
          track.stop();
          console.log("Stream video fermato");
        });
        videoRef.current.srcObject = null;
      } catch (e) {
        console.error("Errore nel fermare lo stream video:", e);
      }
    }

    // Reset dello scanner ZXing
    if (codeReader.current) {
      try {
        codeReader.current.reset();
        console.log("ZXing reader resettato");
      } catch (e) {
        console.error("Errore nel resettare ZXing reader:", e);
      }
    }

    // Reset degli stati
    setIsScannerOpen(false);
    setScanSuccess(false);
    setLastScannedCode(null);
    setScannerError(null);
    setIsInitializingCamera(false);
  };

  // Effetto di cleanup per gli stream video quando il componente viene smontato
  useEffect(() => {
    return () => {
      // Chiudiamo eventuali stream video attivi
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      // Reset dello scanner
      if (codeReader.current) {
        codeReader.current.reset();
      }
    };
  }, []);

  // Restore necessary attribute handling functions
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
    setFormData((prev) => ({
      ...prev,
      attributes: prev.attributes.map((attr) =>
        attr.id === attributeId
          ? {
              ...attr,
              [field]: field === "isRequired" ? Boolean(value) : value,
            }
          : attr
      ),
    }));
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

  // Restore necessary variant handling functions
  const addVariant = () => {
    const newVariant: ProductVariant = {
      id: Date.now().toString(),
      name: "",
      attributes: [],
    };
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, newVariant],
    }));
  };

  const updateVariant = (
    variantId: string,
    field: keyof ProductVariant,
    value: string | ProductAttribute[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) =>
        variant.id === variantId
          ? {
              ...variant,
              [field]: value,
            }
          : variant
      ),
    }));
  };

  const removeVariant = (variantId: string) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((variant) => variant.id !== variantId),
    }));
  };

  const addVariantAttribute = (variantId: string) => {
    const newAttribute: ProductAttribute = {
      id: Date.now().toString(),
      name: "",
      type: "text",
      value: "",
      isRequired: false,
    };
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) =>
        variant.id === variantId
          ? {
              ...variant,
              attributes: [...variant.attributes, newAttribute],
            }
          : variant
      ),
    }));
  };

  const updateVariantAttribute = (
    variantId: string,
    attributeId: string,
    field: keyof ProductAttribute,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) =>
        variant.id === variantId
          ? {
              ...variant,
              attributes: variant.attributes.map((attr) =>
                attr.id === attributeId
                  ? {
                      ...attr,
                      [field]: field === "isRequired" ? Boolean(value) : value,
                    }
                  : attr
              ),
            }
          : variant
      ),
    }));
  };

  const removeVariantAttribute = (variantId: string, attributeId: string) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) =>
        variant.id === variantId
          ? {
              ...variant,
              attributes: variant.attributes.filter(
                (attr) => attr.id !== attributeId
              ),
            }
          : variant
      ),
    }));
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
    <>
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
                    </label>
                    <Input
                      placeholder="Stock Keeping Unit"
                      variant="bordered"
                      color={formData.sku ? "success" : "primary"}
                      value={formData.sku}
                      onChange={(e) => handleChange("sku", e.target.value)}
                      isRequired
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-sm font-medium">
                        Prezzo di Vendita <span className="text-danger">*</span>
                      </label>
                      <Tooltip content="Prezzo al quale il prodotto viene venduto ai clienti">
                        <Icon
                          icon="solar:barcode-bold"
                          className={
                            formData.sku ? "text-success" : "text-default-400"
                          }
                        />
                      </Tooltip>
                    </div>
                    <Input
                      type="number"
                      variant="bordered"
                      color={formData.retailPrice ? "success" : "primary"}
                      placeholder="0.00"
                      startContent={
                        <span className="text-default-400">
                          {formData.currency}
                        </span>
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
                      onChange={(e) => handleChange("price", e.target.value)}
                      isRequired
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

                  {/* Posizione Magazzino */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-sm font-medium">
                        Posizione Magazzino
                      </label>
                      <Tooltip content="Posizione fisica del prodotto nel magazzino">
                        <Icon
                          icon="solar:info-circle-bold"
                          className="text-default-400 cursor-help"
                        />
                      </Tooltip>
                    </div>
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
                                    className="w-full"
                                    variant="bordered"
                                    color="primary"
                                    isRequired={attr.isRequired}
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
            </Tabs>
          </form>
        </CardBody>
      </Card>
      
      {isScannerOpen && (
        <ScannerOverlay
          type={scannerType}
          onClose={stopScanner}
          error={scannerError}
          hasAttemptedScan={hasAttemptedScan}
          videoRef={videoRef}
        />
      )}
    </>
  );
}
