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

interface ProductFormData {
  name: string;
  sku: string;
  description: string;
  price: string;
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
  attributes: ProductAttribute[];
  variants: ProductVariant[];
  [key: string]:
    | string
    | number
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
  onCameraChange,
  availableCameras,
  selectedCamera,
  onScanSuccess,
}: ScannerOverlayProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const successSound = useRef<HTMLAudioElement | null>(null);

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
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl mx-4 bg-black rounded-2xl overflow-hidden">
        {/* Header con controlli */}
        <Card radius="none" className="bg-black">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon
                  icon={
                    type === "barcode"
                      ? "solar:barcode-2-bold"
                      : "solar:qr-code-bold"
                  }
                />
              </div>
              <div>
                <h3 className="text-lg font-medium">
                  Scansiona {type === "barcode" ? "Codice a Barre" : "QR Code"}
                </h3>
                <p className="text-sm">
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
              >
                {availableCameras.map((camera) => (
                  <SelectItem key={camera.deviceId} textValue={camera.label}>
                    {camera.label || `Camera ${camera.deviceId.slice(0, 4)}`}
                  </SelectItem>
                ))}
              </Select>
              <Button
                isIconOnly
                color="default"
                variant="flat"
                onClick={onClose}
              >
                <Icon icon="solar:close-circle-bold" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Area di scansione principale */}
        <div className="relative w-full aspect-[4/3] rounded-b-2xl overflow-hidden">
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
                  showSuccess ? "border-success" : "border-primary/50"
                } rounded-lg shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] transition-colors duration-300`}
              />

              {/* Guide specifiche per tipo */}
              {type === "barcode" ? (
                <>
                  {/* Guide per codice a barre */}
                  <div className="absolute inset-0">
                    {/* Linee verticali guida con effetto pulse */}
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-primary/30 animate-pulse" />
                    <div className="absolute right-0 top-0 bottom-0 w-px bg-primary/30 animate-pulse" />

                    {/* Area centrale evidenziata */}
                    <div className="absolute inset-y-0 left-1/4 right-1/4 border-l border-r border-primary/30" />

                    {/* Linea di scansione verticale con effetto glow */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-primary/50 animate-scan-vertical left-1/2 -translate-x-1/2 shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
                  </div>

                  {/* Angoli per barcode con effetto glow */}
                  <div className="absolute inset-0">
                    <div className="absolute left-0 top-0 w-8 h-full border-l-2 border-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]" />
                    <div className="absolute right-0 top-0 w-8 h-full border-r-2 border-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]" />
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
                            } rounded-lg shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)] transition-colors duration-300`}
                          />
                          <div
                            className={`absolute inset-2 border ${
                              showSuccess
                                ? "border-success/50"
                                : "border-primary/50"
                            } rounded-md transition-colors duration-300`}
                          />
                          <div
                            className={`absolute inset-4 ${
                              showSuccess ? "bg-success/30" : "bg-primary/30"
                            } rounded animate-pulse transition-colors duration-300`}
                          />
                        </div>
                      </div>
                    ))}

                    {/* Linea di scansione diagonale per QR con effetto glow */}
                    <div
                      className={`absolute top-0 left-0 w-[141%] h-0.5 ${
                        showSuccess ? "bg-success/50" : "bg-primary/50"
                      } animate-scan-diagonal origin-top-left shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)] transition-colors duration-300`}
                      style={{ transform: "rotate(45deg)" }}
                    />
                  </div>
                </>
              )}

              {/* Success indicator */}
              {showSuccess && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center animate-success-pop">
                    <Icon
                      icon="solar:check-circle-bold"
                      className="text-3xl text-success"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Indicatore di stato */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/10">
            <div
              className={`w-2 h-2 rounded-full ${
                showSuccess ? "bg-success" : "bg-primary"
              } animate-pulse`}
            />
            <span className="text-white/80 text-sm">
              {showSuccess ? "Codice rilevato!" : "In attesa di scansione..."}
            </span>
          </div>
        </div>

        {/* Suggerimenti e feedback */}
        <div className="p-4 text-center bg-black/50">
          <div className="flex items-center justify-center gap-2">
            <Icon icon="solar:lightbulb-bold" className="text-yellow-500" />
            <p className="text-yellow-200/70 text-xs">
              {type === "barcode"
                ? "Suggerimento: Mantieni il codice parallelo alle linee verticali e assicurati che sia ben illuminato"
                : "Suggerimento: Assicurati che tutti e 4 gli angoli siano visibili e che il QR code sia ben illuminato"}
            </p>
          </div>
        </div>

        {/* Errore (mostrato solo dopo un tentativo fallito) */}
        {error && hasAttemptedScan && (
          <div className="p-4">
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
};

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
    attributes: [],
    variants: [],
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

      // Update available cameras
      setAvailableCameras(videoInputDevices);

      // Set default camera if not already selected
      if (!selectedCamera) {
        setSelectedCamera(videoInputDevices[0].deviceId);
      }

      const deviceId = selectedCamera || videoInputDevices[0].deviceId;
      console.log("Using device ID:", deviceId);

      console.log("Starting video stream...");
      await codeReader.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result: Result | null, err: Exception | undefined) => {
          if (result) {
            console.log("Code detected:", result.getText());
            const code = result.getText();
            setScannedCode(code);
            setShowScanSuccess(true);

            // Dopo 1 secondo, aggiorna il form e chiudi lo scanner
            setTimeout(() => {
              setShowScanSuccess(false);
              handleChange(type === "barcode" ? "barcode" : "qrCode", code);
              stopScanner();
            }, 1000);
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

  const handleCameraChange = async (deviceId: string) => {
    setSelectedCamera(deviceId);
    if (isScannerOpen) {
      // Restart scanner with new camera
      await startScanner(scannerType);
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

  const handleScanSuccess = (code: string) => {
    handleChange(scannerType === "barcode" ? "barcode" : "qrCode", code);
    setIsScannerOpen(false);
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

                {formData.hasVariants && (
                  <div className="mt-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Varianti Prodotto</h3>
                      <Button
                        color="primary"
                        variant="flat"
                        startContent={<Icon icon="solar:add-circle-bold" />}
                        onClick={addVariant}
                      >
                        Aggiungi Variante
                      </Button>
                    </div>

                    {formData.variants.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl border-default-200">
                        <div className="p-3 rounded-full bg-primary/10 mb-4">
                          <Icon
                            icon="solar:layers-bold"
                            className="text-3xl text-primary"
                          />
                        </div>
                        <h4 className="text-lg font-medium text-default-600 mb-2">
                          Nessuna variante
                        </h4>
                        <p className="text-sm text-default-500 text-center max-w-md mb-4">
                          Aggiungi varianti per gestire diverse versioni dello
                          stesso prodotto, come taglie, colori o altre
                          caratteristiche specifiche.
                        </p>
                        <Button
                          color="primary"
                          variant="flat"
                          startContent={<Icon icon="solar:add-circle-bold" />}
                          onClick={addVariant}
                        >
                          Aggiungi la prima variante
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {formData.variants.map((variant) => (
                          <div
                            key={variant.id}
                            className="p-6 border rounded-xl border-default-200 space-y-6"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <Input
                                  label="Nome Variante"
                                  placeholder="Es: Taglia L, Colore Rosso"
                                  value={variant.name}
                                  onChange={(e) =>
                                    updateVariant(
                                      variant.id,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  variant="bordered"
                                  color="primary"
                                  className="max-w-md"
                                />
                              </div>
                              <Button
                                isIconOnly
                                color="danger"
                                variant="light"
                                onClick={() => removeVariant(variant.id)}
                              >
                                <Icon
                                  icon="solar:trash-bin-trash-bold"
                                  className="text-lg"
                                />
                              </Button>
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium">
                                  Attributi della Variante
                                </h4>
                                <Button
                                  size="sm"
                                  color="primary"
                                  variant="flat"
                                  startContent={
                                    <Icon icon="solar:add-circle-bold" />
                                  }
                                  onClick={() =>
                                    addVariantAttribute(variant.id)
                                  }
                                >
                                  Aggiungi Attributo
                                </Button>
                              </div>

                              {variant.attributes.length === 0 ? (
                                <div className="text-center p-4 border border-dashed rounded-lg border-default-200">
                                  <p className="text-sm text-default-500">
                                    Nessun attributo. Aggiungi attributi per
                                    specificare le caratteristiche di questa
                                    variante.
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {variant.attributes.map((attr) => (
                                    <div
                                      key={attr.id}
                                      className="grid grid-cols-[1fr,auto,1fr,auto,auto] items-center gap-4"
                                    >
                                      <Input
                                        placeholder="Nome attributo"
                                        value={attr.name}
                                        onChange={(e) =>
                                          updateVariantAttribute(
                                            variant.id,
                                            attr.id,
                                            "name",
                                            e.target.value
                                          )
                                        }
                                        variant="bordered"
                                      />
                                      <Select
                                        selectedKeys={[attr.type]}
                                        onSelectionChange={(keys) => {
                                          const selectedKey = Array.from(
                                            keys
                                          )[0] as string;
                                          updateVariantAttribute(
                                            variant.id,
                                            attr.id,
                                            "type",
                                            selectedKey
                                          );
                                        }}
                                        variant="bordered"
                                        className="w-40"
                                      >
                                        <SelectItem
                                          key="text"
                                          textValue="Testo"
                                        >
                                          Testo
                                        </SelectItem>
                                        <SelectItem
                                          key="number"
                                          textValue="Numero"
                                        >
                                          Numero
                                        </SelectItem>
                                        <SelectItem key="date" textValue="Data">
                                          Data
                                        </SelectItem>
                                        <SelectItem
                                          key="boolean"
                                          textValue="Si/No"
                                        >
                                          Si/No
                                        </SelectItem>
                                      </Select>
                                      {attr.type === "boolean" ? (
                                        <div className="flex items-center">
                                          <Switch
                                            checked={attr.value === "true"}
                                            onChange={(e) =>
                                              updateVariantAttribute(
                                                variant.id,
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
                                            attr.value
                                              ? parseDate(attr.value)
                                              : null
                                          }
                                          onChange={(newDate) =>
                                            updateVariantAttribute(
                                              variant.id,
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
                                            attr.type === "number"
                                              ? "number"
                                              : "text"
                                          }
                                          value={attr.value}
                                          onChange={(e) =>
                                            updateVariantAttribute(
                                              variant.id,
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
                                            updateVariantAttribute(
                                              variant.id,
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
                                        onClick={() =>
                                          removeVariantAttribute(
                                            variant.id,
                                            attr.id
                                          )
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
                        ))}
                      </div>
                    )}
                  </div>
                )}

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
          </Tabs>
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
              <div className="absolute inset-0 bg-success/95 backdrop-blur-md animate-fade-in" />
              <div className="relative flex flex-col items-center text-center animate-success-pop">
                {/* Icona di successo con animazione */}
                <div className="relative mb-8">
                  <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center">
                    <Icon
                      icon="solar:check-circle-bold"
                      className="text-6xl text-white"
                    />
                  </div>
                  {/* Cerchi animati */}
                  <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping" />
                  <div
                    className="absolute inset-0 rounded-full border-4 border-white/20 animate-ping"
                    style={{ animationDelay: "0.5s" }}
                  />
                </div>

                {/* Messaggio di successo */}
                <div className="space-y-4">
                  <h3 className="text-3xl font-bold text-white">
                    Scansione Completata!
                  </h3>
                  <p className="text-xl text-white/80">
                    {scannerType === "barcode" ? "Codice a barre" : "QR code"}{" "}
                    rilevato con successo
                  </p>
                </div>

                {/* Codice scansionato */}
                <div className="mt-8 bg-white/10 rounded-xl p-6 w-full max-w-md mx-4 backdrop-blur-sm">
                  <p className="text-white/80 mb-3 text-lg">Codice rilevato:</p>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="font-mono text-xl text-white break-all">
                      {scannedCode}
                    </p>
                  </div>
                </div>

                {/* Indicatore di chiusura */}
                <div className="mt-8 flex items-center gap-2 text-white/60">
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
