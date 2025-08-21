import { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  SelectItem,
  Chip,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Progress,
  Tooltip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

interface Attribute {
  id: string;
  name: string;
  type: string;
  isRequired: boolean;
  description: string;
}

interface ValidationErrors {
  categoryName: string;
  attributes: Record<string, string>;
}

const attributeTypes = [
  { 
    value: "text", 
    label: "Testo", 
    icon: "solar:document-text-bold-duotone",
    description: "Campo di testo libero",
    color: "primary"
  },
  { 
    value: "number", 
    label: "Numero", 
    icon: "solar:calculator-bold-duotone",
    description: "Valore numerico",
    color: "success"
  },
  { 
    value: "boolean", 
    label: "Booleano", 
    icon: "solar:check-square-bold-duotone",
    description: "Vero o falso",
    color: "warning"
  },
  { 
    value: "date", 
    label: "Data", 
    icon: "solar:calendar-bold-duotone",
    description: "Data e ora",
    color: "secondary"
  },
];

export default function CategoryAdd() {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({
    categoryName: "",
    attributes: {}
  });

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {
      categoryName: "",
      attributes: {}
    };

    // Validate category name
    if (!categoryName.trim()) {
      newErrors.categoryName = "Il nome della categoria è obbligatorio";
    } else if (categoryName.length < 3) {
      newErrors.categoryName = "Il nome deve essere di almeno 3 caratteri";
    }

    // Validate attributes
    attributes.forEach((attr) => {
      if (!attr.name.trim()) {
        newErrors.attributes[attr.id] = "Il nome dell'attributo è obbligatorio";
      } else if (attr.name.length < 2) {
        newErrors.attributes[attr.id] = "Il nome deve essere di almeno 2 caratteri";
      }
    });

    setErrors(newErrors);
    return !newErrors.categoryName && Object.keys(newErrors.attributes).length === 0;
  };

  const addAttribute = () => {
    const newAttribute: Attribute = {
      id: Date.now().toString(),
      name: "",
      type: "text",
      isRequired: false,
      description: "",
    };
    setAttributes([...attributes, newAttribute]);
  };

  const removeAttribute = (id: string) => {
    setAttributes(attributes.filter((attr) => attr.id !== id));
    // Remove any validation errors for this attribute
    const newErrors = { ...errors };
    delete newErrors.attributes[id];
    setErrors(newErrors);
  };

  const updateAttribute = (
    id: string,
    field: keyof Attribute,
    value: string | boolean
  ) => {
    setAttributes(
      attributes.map((attr) =>
        attr.id === id ? { ...attr, [field]: value } : attr
      )
    );

    // Clear validation error when user starts typing
    if (field === "name" && value) {
      const newErrors = { ...errors };
      delete newErrors.attributes[id];
      setErrors(newErrors);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const categoryData = {
        name: categoryName.trim(),
        description: categoryDescription.trim(),
        attributes: attributes.map(({ name, type, isRequired, description }) => ({ 
          name: name.trim(), 
          type,
          isRequired,
          description: description.trim()
        })),
      };

      const response = await axios.post("/Product/POST/CreateNewCategory", categoryData);
      
      if (response.status === 200) {
        navigate("/inventory/categories");
      }
    } catch (error) {
      console.error("Errore nella creazione della categoria:", error);
      // TODO: Show error toast
    } finally {
      setIsLoading(false);
    }
  };

  const getAttributeTypeInfo = (type: string) => {
    return attributeTypes.find(t => t.value === type) || attributeTypes[0];
  };

  const handlePreview = () => {
    if (validateForm()) {
      onOpen();
    }
  };

  return (
    <div className="w-full flex-1 p-4 sm:p-6 lg:p-8 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button
            isIconOnly
            variant="flat"
            onPress={() => navigate("/inventory/categories")}
          >
            <Icon icon="solar:arrow-left-linear" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon icon="solar:add-circle-bold-duotone" className="text-primary text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Nuova Categoria
              </h1>
              <p className="text-sm text-foreground-500 mt-1">
                Crea una nuova categoria per organizzare i tuoi prodotti
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="flat"
            startContent={<Icon icon="solar:eye-bold-duotone" />}
            onPress={handlePreview}
            isDisabled={!categoryName.trim()}
          >
            Anteprima
          </Button>
          <Button
            color="primary"
            startContent={<Icon icon="solar:check-circle-bold-duotone" />}
            onPress={handleSave}
            isLoading={isLoading}
            isDisabled={!categoryName.trim()}
          >
            Salva Categoria
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Icon icon="solar:info-circle-bold-duotone" className="text-primary text-xl" />
                <div>
                  <h3 className="text-lg font-semibold">Informazioni Base</h3>
                  <p className="text-sm text-foreground-500">Dettagli principali della categoria</p>
                </div>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <Input
                  label="Nome Categoria"
                  placeholder="es. Elettronica, Abbigliamento, Casa..."
                  value={categoryName}
                  onChange={(e) => {
                    setCategoryName(e.target.value);
                    if (e.target.value.trim()) {
                      setErrors(prev => ({ ...prev, categoryName: "" }));
                    }
                  }}
                  isInvalid={!!errors.categoryName}
                  errorMessage={errors.categoryName}
                  startContent={<Icon icon="solar:folder-bold-duotone" className="text-foreground-400" />}
                  isRequired
                />
              </div>
              
              <div>
                <Input
                  label="Descrizione (Opzionale)"
                  placeholder="Breve descrizione della categoria..."
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  startContent={<Icon icon="solar:document-text-bold-duotone" className="text-foreground-400" />}
                />
              </div>
            </CardBody>
          </Card>

          {/* Attributes Section */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <Icon icon="solar:settings-bold-duotone" className="text-primary text-xl" />
                  <div>
                    <h3 className="text-lg font-semibold">Attributi Categoria</h3>
                    <p className="text-sm text-foreground-500">Definisci i campi personalizzati per questa categoria</p>
                  </div>
                </div>
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<Icon icon="solar:add-circle-bold-duotone" />}
                  onPress={addAttribute}
                >
                  Aggiungi Attributo
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {attributes.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-default-100 flex items-center justify-center mx-auto mb-4">
                    <Icon icon="solar:settings-bold-duotone" className="text-default-400 text-2xl" />
                  </div>
                  <h4 className="font-semibold mb-2">Nessun attributo definito</h4>
                  <p className="text-foreground-500 mb-4">
                    Aggiungi attributi personalizzati per rendere più specifica questa categoria
                  </p>
                  <Button
                    color="primary"
                    startContent={<Icon icon="solar:add-circle-bold-duotone" />}
                    onPress={addAttribute}
                  >
                    Aggiungi Primo Attributo
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {attributes.map((attr, index) => (
                    <Card key={attr.id} className="border border-default-200">
                      <CardBody className="p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${getAttributeTypeInfo(attr.type).color}/10`}>
                              <Icon 
                                icon={getAttributeTypeInfo(attr.type).icon} 
                                className={`text-${getAttributeTypeInfo(attr.type).color} text-sm`}
                              />
                            </div>
                            <div>
                              <p className="font-medium">Attributo {index + 1}</p>
                              <p className="text-xs text-foreground-500">
                                {getAttributeTypeInfo(attr.type).description}
                              </p>
                            </div>
                          </div>
                          <Button
                            isIconOnly
                            size="sm"
                            color="danger"
                            variant="flat"
                            onPress={() => removeAttribute(attr.id)}
                          >
                            <Icon icon="solar:trash-bin-trash-bold-duotone" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Input
                              label="Nome Attributo"
                              placeholder="es. Colore, Dimensione, Marca..."
                              value={attr.name}
                              onChange={(e) => updateAttribute(attr.id, "name", e.target.value)}
                              isInvalid={!!errors.attributes[attr.id]}
                              errorMessage={errors.attributes[attr.id]}
                              isRequired
                            />
                          </div>
                          
                          <div>
                            <Select
                              label="Tipo Dato"
                              selectedKeys={[attr.type]}
                              onSelectionChange={(keys) => {
                                const selectedType = Array.from(keys)[0] as string;
                                updateAttribute(attr.id, "type", selectedType);
                              }}
                            >
                              {attributeTypes.map((type) => (
                                <SelectItem 
                                  key={type.value}
                                  startContent={
                                    <Icon icon={type.icon} className={`text-${type.color}`} />
                                  }
                                >
                                  {type.label}
                                </SelectItem>
                              ))}
                            </Select>
                          </div>
                        </div>

                        <div className="mt-4">
                          <Input
                            label="Descrizione (Opzionale)"
                            placeholder="Descrizione dell'attributo..."
                            value={attr.description}
                            onChange={(e) => updateAttribute(attr.id, "description", e.target.value)}
                            size="sm"
                          />
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`required-${attr.id}`}
                              checked={attr.isRequired}
                              onChange={(e) => updateAttribute(attr.id, "isRequired", e.target.checked)}
                              className="rounded"
                            />
                            <label htmlFor={`required-${attr.id}`} className="text-sm">
                              Campo obbligatorio
                            </label>
                          </div>
                          <Chip
                            size="sm"
                            color={getAttributeTypeInfo(attr.type).color as any}
                            variant="flat"
                          >
                            {getAttributeTypeInfo(attr.type).label}
                          </Chip>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Icon icon="solar:chart-bold-duotone" className="text-primary text-xl" />
                <h3 className="text-lg font-semibold">Progresso</h3>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-foreground-500">Completamento</span>
                  <span className="text-sm font-medium">
                    {categoryName.trim() ? (attributes.length > 0 ? "100%" : "50%") : "0%"}
                  </span>
                </div>
                <Progress
                  value={categoryName.trim() ? (attributes.length > 0 ? 100 : 50) : 0}
                  color="primary"
                  size="sm"
                  aria-label="Progresso creazione categoria"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon 
                    icon={categoryName.trim() ? "solar:check-circle-bold" : "solar:clock-circle-bold"} 
                    className={categoryName.trim() ? "text-success" : "text-warning"} 
                  />
                  <span className="text-sm">Nome categoria</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon 
                    icon={attributes.length > 0 ? "solar:check-circle-bold" : "solar:clock-circle-bold"} 
                    className={attributes.length > 0 ? "text-success" : "text-default-400"} 
                  />
                  <span className="text-sm">Attributi ({attributes.length})</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Tips Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Icon icon="solar:lightbulb-bold-duotone" className="text-warning text-xl" />
                <h3 className="text-lg font-semibold">Suggerimenti</h3>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="flex gap-3">
                <Icon icon="solar:info-circle-bold" className="text-primary text-lg mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Nomi descrittivi</p>
                  <p className="text-xs text-foreground-500">Usa nomi chiari e specifici per gli attributi</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Icon icon="solar:settings-bold" className="text-success text-lg mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Tipi appropriati</p>
                  <p className="text-xs text-foreground-500">Scegli il tipo di dato più adatto per ogni attributo</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Icon icon="solar:star-bold" className="text-warning text-lg mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Campi obbligatori</p>
                  <p className="text-xs text-foreground-500">Marca come obbligatori solo i campi essenziali</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Attribute Types Reference */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Icon icon="solar:book-bold-duotone" className="text-secondary text-xl" />
                <h3 className="text-lg font-semibold">Tipi Attributo</h3>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              {attributeTypes.map((type) => (
                <div key={type.value} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${type.color}/10`}>
                    <Icon icon={type.icon} className={`text-${type.color} text-sm`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{type.label}</p>
                    <p className="text-xs text-foreground-500">{type.description}</p>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <Icon icon="solar:eye-bold-duotone" className="text-primary text-2xl" />
                <div>
                  <h3 className="text-xl font-semibold">Anteprima Categoria</h3>
                  <p className="text-sm text-foreground-500">Come apparirà la tua categoria</p>
                </div>
              </div>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-6">
                <Card className="border border-primary/20">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon icon="solar:folder-bold-duotone" className="text-primary text-lg" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{categoryName || "Nome Categoria"}</h4>
                        {categoryDescription && (
                          <p className="text-sm text-foreground-500">{categoryDescription}</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {attributes.length > 0 && (
                    <CardBody className="pt-0">
                      <Divider className="mb-4" />
                      <div>
                        <p className="text-sm font-medium mb-3">Attributi ({attributes.length})</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {attributes.map((attr) => (
                            <div key={attr.id} className="flex items-center gap-3 p-2 bg-default-50 rounded-lg">
                              <Icon 
                                icon={getAttributeTypeInfo(attr.type).icon} 
                                className={`text-${getAttributeTypeInfo(attr.type).color}`}
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{attr.name || "Nome attributo"}</p>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-foreground-500 capitalize">{attr.type}</p>
                                  {attr.isRequired && (
                                    <Chip size="sm" color="danger" variant="flat">Obbligatorio</Chip>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardBody>
                  )}
                </Card>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                Chiudi Anteprima
              </Button>
              <Button
                color="primary"
                startContent={<Icon icon="solar:check-circle-bold-duotone" />}
                onPress={() => {
                  onClose();
                  handleSave();
                }}
                isLoading={isLoading}
              >
                Salva Categoria
              </Button>
            </ModalFooter>
          </>
        </ModalContent>
      </Modal>
    </div>
  );
}
