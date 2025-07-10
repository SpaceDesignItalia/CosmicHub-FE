import React, { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Select,
  SelectItem,
  Textarea,
  Spacer,
  Switch,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { CustomerFormData } from "../../types/Customer";
import PageHeader from "../../Components/Layout/PageHeader";

const initialFormData: CustomerFormData = {
  name: "",
  surname: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  zip_code: "",
  country: "Italia",
  company_name: "",
  vat_number: "",
  tax_code: "",
  notes: "",
  customer_type: "private",
};

export default function AddCustomer() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Rimuovi l'errore quando l'utente inizia a digitare
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Il nome è obbligatorio";
    }

    if (!formData.surname.trim()) {
      newErrors.surname = "Il cognome è obbligatorio";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Il telefono è obbligatorio";
    }

    if (!formData.address.trim()) {
      newErrors.address = "L'indirizzo è obbligatorio";
    }

    if (!formData.city.trim()) {
      newErrors.city = "La città è obbligatoria";
    }

    if (!formData.zip_code.trim()) {
      newErrors.zip_code = "Il CAP è obbligatorio";
    }

    // Validazioni per aziende
    if (formData.customer_type === "business") {
      if (!formData.company_name?.trim()) {
        newErrors.company_name = "Il nome dell'azienda è obbligatorio";
      }
      if (!formData.vat_number?.trim()) {
        newErrors.vat_number = "La Partita IVA è obbligatoria";
      }
    }

    // Validazione email se presente
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email non valida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Qui implementare la chiamata API per salvare il cliente
      console.log("Saving customer:", formData);
      
      // Simulazione API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect alla lista clienti
      navigate("/customers");
    } catch (error) {
      console.error("Errore nel salvataggio del cliente:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/customers");
  };

  return (
    <div className="flex flex-col h-screen">
      <PageHeader
        title="Nuovo Cliente"
        description="Aggiungi un nuovo cliente al sistema"
        icon="solar:user-plus-rounded-bold-duotone"
      />
      
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader className="flex gap-3">
                <Icon icon="solar:user-plus-rounded-bold" width={24} />
                <div className="flex flex-col">
                  <p className="text-md">Informazioni Cliente</p>
                  <p className="text-small text-default-500">
                    Inserisci i dati del nuovo cliente
                  </p>
                </div>
              </CardHeader>
              <CardBody className="gap-4">
                {/* Tipo Cliente */}
                <div className="flex gap-4 items-center">
                  <label className="text-small font-medium min-w-fit">
                    Tipo Cliente:
                  </label>
                  <Switch
                    isSelected={formData.customer_type === "business"}
                    onValueChange={(checked) =>
                      handleInputChange("customer_type", checked ? "business" : "private")
                    }
                  >
                    {formData.customer_type === "business" ? "Azienda" : "Privato"}
                  </Switch>
                </div>

                <Spacer y={2} />

                {/* Informazioni di base */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nome *"
                    placeholder="Inserisci il nome"
                    value={formData.name}
                    onValueChange={(value) => handleInputChange("name", value)}
                    isInvalid={!!errors.name}
                    errorMessage={errors.name}
                    startContent={<Icon icon="solar:user-bold" width={16} />}
                  />
                  <Input
                    label="Cognome *"
                    placeholder="Inserisci il cognome"
                    value={formData.surname}
                    onValueChange={(value) => handleInputChange("surname", value)}
                    isInvalid={!!errors.surname}
                    errorMessage={errors.surname}
                    startContent={<Icon icon="solar:user-bold" width={16} />}
                  />
                </div>

                {/* Informazioni azienda (se tipo business) */}
                {formData.customer_type === "business" && (
                  <>
                    <Spacer y={2} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Nome Azienda *"
                        placeholder="Inserisci il nome dell'azienda"
                        value={formData.company_name || ""}
                        onValueChange={(value) => handleInputChange("company_name", value)}
                        isInvalid={!!errors.company_name}
                        errorMessage={errors.company_name}
                        startContent={<Icon icon="solar:buildings-2-bold" width={16} />}
                      />
                      <Input
                        label="Partita IVA *"
                        placeholder="IT00000000000"
                        value={formData.vat_number || ""}
                        onValueChange={(value) => handleInputChange("vat_number", value)}
                        isInvalid={!!errors.vat_number}
                        errorMessage={errors.vat_number}
                        startContent={<Icon icon="solar:document-text-bold" width={16} />}
                      />
                    </div>
                    <Input
                      label="Codice Fiscale"
                      placeholder="Inserisci il codice fiscale"
                      value={formData.tax_code || ""}
                      onValueChange={(value) => handleInputChange("tax_code", value)}
                      startContent={<Icon icon="solar:document-text-bold" width={16} />}
                    />
                  </>
                )}

                <Spacer y={2} />

                {/* Contatti */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Telefono *"
                    placeholder="+39 333 1234567"
                    value={formData.phone}
                    onValueChange={(value) => handleInputChange("phone", value)}
                    isInvalid={!!errors.phone}
                    errorMessage={errors.phone}
                    startContent={<Icon icon="solar:phone-bold" width={16} />}
                  />
                  <Input
                    label="Email"
                    placeholder="email@esempio.com"
                    type="email"
                    value={formData.email}
                    onValueChange={(value) => handleInputChange("email", value)}
                    isInvalid={!!errors.email}
                    errorMessage={errors.email}
                    startContent={<Icon icon="solar:letter-bold" width={16} />}
                  />
                </div>

                <Spacer y={2} />

                {/* Indirizzo */}
                <Input
                  label="Indirizzo *"
                  placeholder="Via, Numero civico"
                  value={formData.address}
                  onValueChange={(value) => handleInputChange("address", value)}
                  isInvalid={!!errors.address}
                  errorMessage={errors.address}
                  startContent={<Icon icon="solar:map-point-bold" width={16} />}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Città *"
                    placeholder="Inserisci la città"
                    value={formData.city}
                    onValueChange={(value) => handleInputChange("city", value)}
                    isInvalid={!!errors.city}
                    errorMessage={errors.city}
                    startContent={<Icon icon="solar:city-bold" width={16} />}
                  />
                  <Input
                    label="CAP *"
                    placeholder="00000"
                    value={formData.zip_code}
                    onValueChange={(value) => handleInputChange("zip_code", value)}
                    isInvalid={!!errors.zip_code}
                    errorMessage={errors.zip_code}
                    startContent={<Icon icon="solar:mailbox-bold" width={16} />}
                  />
                  <Select
                    label="Paese"
                    placeholder="Seleziona il paese"
                    selectedKeys={[formData.country]}
                    onSelectionChange={(keys) => {
                      const value = Array.from(keys)[0] as string;
                      handleInputChange("country", value);
                    }}
                    startContent={<Icon icon="solar:global-bold" width={16} />}
                  >
                    <SelectItem key="Italia" value="Italia">
                      Italia
                    </SelectItem>
                    <SelectItem key="Francia" value="Francia">
                      Francia
                    </SelectItem>
                    <SelectItem key="Germania" value="Germania">
                      Germania
                    </SelectItem>
                    <SelectItem key="Spagna" value="Spagna">
                      Spagna
                    </SelectItem>
                  </Select>
                </div>

                <Spacer y={2} />

                {/* Note */}
                <Textarea
                  label="Note"
                  placeholder="Inserisci eventuali note aggiuntive..."
                  value={formData.notes || ""}
                  onValueChange={(value) => handleInputChange("notes", value)}
                  minRows={3}
                />

                <Spacer y={4} />

                {/* Azioni */}
                <div className="flex gap-3 justify-end">
                  <Button
                    color="default"
                    variant="light"
                    onPress={handleCancel}
                    startContent={<Icon icon="solar:close-circle-bold" width={16} />}
                  >
                    Annulla
                  </Button>
                  <Button
                    color="primary"
                    type="submit"
                    isLoading={loading}
                    startContent={
                      !loading && <Icon icon="solar:check-circle-bold" width={16} />
                    }
                  >
                    {loading ? "Salvataggio..." : "Salva Cliente"}
                  </Button>
                </div>
              </CardBody>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
} 