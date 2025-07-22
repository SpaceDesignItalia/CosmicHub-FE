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
  Divider,
  CheckboxGroup,
  Checkbox,
  Autocomplete,
  AutocompleteItem,
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
  referred_by: "",
  preferred_contact_method: "phone",
  communication_preferences: {
    receive_reminders: true,
    receive_promotions: false,
    receive_maintenance_alerts: true,
  },
};

// Mock data per i clienti esistenti (per il sistema referenze)
const existingCustomers = [
  { id: "1", name: "Mario Rossi", phone: "+39 333 1234567" },
  { id: "2", name: "Laura Bianchi", phone: "+39 335 7654321" },
  { id: "3", name: "Giuseppe Neri", phone: "+39 339 9876543" },
  { id: "4", name: "Tech Solutions S.r.l.", phone: "+39 02 87654321" },
  { id: "5", name: "Hotel Luxury S.p.A.", phone: "+39 06 98765432" },
];

const contactMethods = [
  { key: "phone", label: "Telefono", icon: "solar:phone-bold" },
  { key: "email", label: "Email", icon: "solar:letter-bold" },
  { key: "whatsapp", label: "WhatsApp", icon: "solar:chat-round-bold" },
  { key: "sms", label: "SMS", icon: "solar:chat-square-bold" },
];

const countries = [
  "Italia", "Francia", "Germania", "Spagna", "Svizzera", "Austria", "Regno Unito"
];

export default function AddCustomer() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);

  const handleInputChange = (field: keyof CustomerFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
    // Rimuovi l'errore quando l'utente inizia a digitare
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const handleCommunicationPreferenceChange = (field: "receive_reminders" | "receive_promotions" | "receive_maintenance_alerts", value: boolean) => {
    if (formData.communication_preferences) {
      setFormData({
        ...formData,
        communication_preferences: {
          ...formData.communication_preferences,
          [field]: value,
        },
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      // Validazioni step 1 - Informazioni di base
      if (!formData.name.trim()) {
        newErrors.name = "Il nome è obbligatorio";
      }

      if (!formData.surname.trim()) {
        newErrors.surname = "Il cognome è obbligatorio";
      }

      if (!formData.phone.trim()) {
        newErrors.phone = "Il telefono è obbligatorio";
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
    }

    if (step === 2) {
      // Validazioni step 2 - Indirizzo
      if (!formData.address.trim()) {
        newErrors.address = "L'indirizzo è obbligatorio";
      }

      if (!formData.city.trim()) {
        newErrors.city = "La città è obbligatoria";
      }

      if (!formData.zip_code.trim()) {
        newErrors.zip_code = "Il CAP è obbligatorio";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    // Permetti il submit solo se siamo nello step 3
    if (currentStep !== 3) {
      console.log("Submit blocked - not on final step");
      return;
    }
    
    if (!validateStep(1) || !validateStep(2)) return;

    setLoading(true);
    try {
      // Qui implementare la chiamata API per salvare il cliente
      console.log("Saving customer:", formData);
      
      // Simulazione API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mostra notifica di successo
      // TODO: Implementare toast notification
      
      // Redirect alla lista clienti
      navigate("/customers");
    } catch (error) {
      console.error("Errore nel salvataggio del cliente:", error);
      // TODO: Mostrare errore all'utente
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/customers");
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Tipo Cliente */}
      <Card>
        <CardBody className="p-4">
          <div className="flex gap-4 items-center">
            <label className="text-small font-medium min-w-fit">
              Tipo Cliente:
            </label>
            <Switch
              isSelected={formData.customer_type === "business"}
              onValueChange={(checked) =>
                handleInputChange("customer_type", checked ? "business" : "private")
              }
              startContent={
                <Icon icon="solar:user-bold" width={16} />
              }
              endContent={
                <Icon icon="solar:buildings-2-bold" width={16} />
              }
            >
              {formData.customer_type === "business" ? "Azienda" : "Privato"}
            </Switch>
          </div>
        </CardBody>
      </Card>

      {/* Informazioni di base */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Icon 
              icon={formData.customer_type === "business" ? "solar:buildings-2-bold" : "solar:user-bold"} 
              width={24} 
              className="text-primary" 
            />
            <div>
              <h4 className="text-lg font-semibold">
                {formData.customer_type === "business" ? "Informazioni Azienda" : "Informazioni Personali"}
              </h4>
              <p className="text-small text-default-500">
                Inserisci i dati principali del cliente
              </p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="gap-4">
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
              <Divider className="my-2" />
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

          <Divider className="my-2" />

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
        </CardBody>
      </Card>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Indirizzo */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Icon icon="solar:map-point-bold" width={24} className="text-primary" />
            <div>
              <h4 className="text-lg font-semibold">Indirizzo</h4>
              <p className="text-small text-default-500">
                Inserisci l'indirizzo del cliente
              </p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="gap-4">
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
              {countries.map((country) => (
                <SelectItem key={country}>
                  {country}
                </SelectItem>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      {/* Sistema Referenze */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Icon icon="solar:users-group-rounded-bold" width={24} className="text-primary" />
            <div>
              <h4 className="text-lg font-semibold">Sistema Referenze</h4>
              <p className="text-small text-default-500">
                Chi ha consigliato questo cliente? (Opzionale)
              </p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <Autocomplete
            label="Cliente che ha fatto la referenza"
            placeholder="Cerca un cliente esistente..."
            selectedKey={formData.referred_by}
            onSelectionChange={(key) => handleInputChange("referred_by", key)}
            startContent={<Icon icon="solar:user-check-bold" width={16} />}
          >
            {existingCustomers.map((customer) => (
              <AutocompleteItem
                key={customer.id}
                textValue={customer.name}
              >
                <div className="flex flex-col">
                  <span className="text-small">{customer.name}</span>
                  <span className="text-tiny text-default-400">{customer.phone}</span>
                </div>
              </AutocompleteItem>
            ))}
          </Autocomplete>
        </CardBody>
      </Card>

      {/* Preferenze di Comunicazione */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Icon icon="solar:chat-round-bold" width={24} className="text-primary" />
            <div>
              <h4 className="text-lg font-semibold">Preferenze di Comunicazione</h4>
              <p className="text-small text-default-500">
                Come preferisce essere contattato?
              </p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="gap-4">
          <Select
            label="Metodo di contatto preferito"
            selectedKeys={[formData.preferred_contact_method || "phone"]}
            onSelectionChange={(keys) => {
              const method = Array.from(keys)[0] as "phone" | "email" | "whatsapp" | "sms";
              handleInputChange("preferred_contact_method", method);
            }}
          >
            {contactMethods.map((method) => (
              <SelectItem 
                key={method.key} 
                startContent={<Icon icon={method.icon} width={16} />}
              >
                {method.label}
              </SelectItem>
            ))}
          </Select>

          <Divider className="my-2" />

          <div className="space-y-3">
            <p className="text-sm font-medium">Consensi comunicazione:</p>
            
            <div className="space-y-2">
              <Switch
                isSelected={formData.communication_preferences?.receive_reminders || false}
                onValueChange={(checked) => 
                  handleCommunicationPreferenceChange("receive_reminders", checked)
                }
                startContent={<Icon icon="solar:bell-bold" width={16} />}
              >
                <div className="flex flex-col">
                  <span className="text-sm">Promemoria appuntamenti</span>
                  <span className="text-xs text-default-500">
                    Ricevi notifiche per appuntamenti in programma
                  </span>
                </div>
              </Switch>

              <Switch
                isSelected={formData.communication_preferences?.receive_promotions || false}
                onValueChange={(checked) => 
                  handleCommunicationPreferenceChange("receive_promotions", checked)
                }
                startContent={<Icon icon="solar:gift-bold" width={16} />}
              >
                <div className="flex flex-col">
                  <span className="text-sm">Offerte e promozioni</span>
                  <span className="text-xs text-default-500">
                    Ricevi comunicazioni su sconti e offerte speciali
                  </span>
                </div>
              </Switch>

              <Switch
                isSelected={formData.communication_preferences?.receive_maintenance_alerts || false}
                onValueChange={(checked) => 
                  handleCommunicationPreferenceChange("receive_maintenance_alerts", checked)
                }
                startContent={<Icon icon="solar:settings-bold" width={16} />}
              >
                <div className="flex flex-col">
                  <span className="text-sm">Avvisi manutenzione</span>
                  <span className="text-xs text-default-500">
                    Ricevi promemoria per manutenzioni programmate
                  </span>
                </div>
              </Switch>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Note */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Icon icon="solar:notes-bold" width={24} className="text-primary" />
            <div>
              <h4 className="text-lg font-semibold">Note Aggiuntive</h4>
              <p className="text-small text-default-500">
                Aggiungi informazioni utili sul cliente
              </p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <Textarea
            placeholder="Inserisci eventuali note aggiuntive..."
            value={formData.notes || ""}
            onValueChange={(value) => handleInputChange("notes", value)}
            minRows={4}
          />
        </CardBody>
      </Card>
    </div>
  );

  const renderStepIndicator = () => (
    <Card className="mb-6">
      <CardBody className="p-4">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === currentStep
                      ? "bg-primary text-white"
                      : step < currentStep
                      ? "bg-success text-white"
                      : "bg-default-200 text-default-500"
                  }`}
                >
                  {step < currentStep ? (
                    <Icon icon="solar:check-bold" width={16} />
                  ) : (
                    step
                  )}
                </div>
                <div className="ml-2 text-sm">
                  <div className={`font-medium ${step === currentStep ? "text-primary" : step < currentStep ? "text-success" : "text-default-500"}`}>
                    {step === 1 && "Informazioni"}
                    {step === 2 && "Indirizzo"}
                    {step === 3 && "Preferenze"}
                  </div>
                </div>
              </div>
              {step < 3 && (
                <div className={`flex-1 h-px mx-4 ${step < currentStep ? "bg-success" : "bg-default-200"}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </CardBody>
    </Card>
  );

  return (
    <div className="flex flex-col h-screen">
      <PageHeader
        title="Nuovo Cliente"
        description="Aggiungi un nuovo cliente al sistema"
        icon="solar:user-plus-rounded-bold-duotone"
      />
      
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div>
            {renderStepIndicator()}
            
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}

            <Spacer y={6} />

            {/* Azioni */}
            <Card>
              <CardBody className="p-4">
                <div className="flex gap-3 justify-between">
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      color="default"
                      variant="light"
                      onPress={handleCancel}
                      startContent={<Icon icon="solar:close-circle-bold" width={16} />}
                    >
                      Annulla
                    </Button>
                    {currentStep > 1 && (
                      <Button
                        type="button"
                        color="default"
                        variant="flat"
                        onPress={handlePrevStep}
                        startContent={<Icon icon="solar:arrow-left-bold" width={16} />}
                      >
                        Indietro
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    {currentStep < 3 ? (
                      <Button
                        type="button"
                        color="primary"
                        onPress={handleNextStep}
                        endContent={<Icon icon="solar:arrow-right-bold" width={16} />}
                      >
                        Avanti
                      </Button>
                    ) : (
                      <Button
                        color="primary"
                        type="button"
                        onPress={handleSubmit}
                        isLoading={loading}
                        startContent={
                          !loading && <Icon icon="solar:check-circle-bold" width={16} />
                        }
                      >
                        {loading ? "Salvataggio..." : "Salva Cliente"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 