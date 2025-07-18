import React, { useState, useEffect } from "react";
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
  Autocomplete,
  AutocompleteItem,
  Divider,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { CallFormData } from "../../types/Call";
import type { Customer } from "../../types/Customer";
import PageHeader from "../../Components/Layout/PageHeader";

const initialFormData: CallFormData = {
  caller_name: "",
  caller_phone: "",
  problem_description: "",
  urgency_level: "medium",
  call_source: "phone",
  notes: "",
  is_new_customer: false,
  customer_data: {
    name: "",
    surname: "",
    email: "",
    address: "",
    city: "",
    zip_code: "",
    customer_type: "private",
    company_name: "",
  },
};

export default function NewCall() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState<CallFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Mock data per i clienti - sostituire con chiamata API reale
  useEffect(() => {
    const mockCustomers: Customer[] = [
      {
        customer_id: "1",
        name: "Mario",
        surname: "Rossi",
        email: "mario.rossi@email.com",
        phone: "+39 333 1234567",
        address: "Via Roma 123",
        city: "Milano",
        zip_code: "20100",
        country: "Italia",
        status: "active",
        customer_type: "private",
        created_at: new Date(),
        updated_at: new Date(),
        created_by: "admin",
      },
      {
        customer_id: "2",
        name: "Tech Solutions",
        surname: "S.r.l.",
        email: "info@techsolutions.com",
        phone: "+39 02 87654321",
        address: "Via Garibaldi 456",
        city: "Roma",
        zip_code: "00100",
        country: "Italia",
        company_name: "Tech Solutions S.r.l.",
        status: "active",
        customer_type: "business",
        created_at: new Date(),
        updated_at: new Date(),
        created_by: "admin",
      },
    ];
    setCustomers(mockCustomers);

    // Se c'è un customer_id nei parametri URL, preseleziona il cliente
    const customerId = searchParams.get("customer_id");
    if (customerId) {
      const customer = mockCustomers.find(c => c.customer_id === customerId);
      if (customer) {
        setSelectedCustomer(customer);
        setFormData(prev => ({
          ...prev,
          caller_name: `${customer.name} ${customer.surname}`,
          caller_phone: customer.phone,
        }));
      }
    }
  }, [searchParams]);

  const handleInputChange = (field: keyof CallFormData, value: string | boolean) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const handleCustomerDataChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      customer_data: {
        ...formData.customer_data!,
        [field]: value,
      },
    });
  };

  const handleCustomerSelection = (customerId: string) => {
    const customer = customers.find(c => c.customer_id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      setFormData({
        ...formData,
        caller_name: `${customer.name} ${customer.surname}`,
        caller_phone: customer.phone,
        is_new_customer: false,
      });
    }
  };

  const handleNewCustomerToggle = (isNew: boolean) => {
    if (isNew) {
      setSelectedCustomer(null);
      setFormData({
        ...formData,
        is_new_customer: true,
        caller_name: "",
        caller_phone: "",
      });
    } else {
      setFormData({
        ...formData,
        is_new_customer: false,
        customer_data: initialFormData.customer_data,
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.caller_name.trim()) {
      newErrors.caller_name = "Il nome del chiamante è obbligatorio";
    }

    if (!formData.caller_phone.trim()) {
      newErrors.caller_phone = "Il telefono è obbligatorio";
    }

    if (!formData.problem_description.trim()) {
      newErrors.problem_description = "La descrizione del problema è obbligatoria";
    }

    // Validazioni per nuovo cliente
    if (formData.is_new_customer) {
      if (!formData.customer_data?.name?.trim()) {
        newErrors.customer_name = "Il nome è obbligatorio";
      }
      if (!formData.customer_data?.surname?.trim()) {
        newErrors.customer_surname = "Il cognome è obbligatorio";
      }
      if (!formData.customer_data?.address?.trim()) {
        newErrors.customer_address = "L'indirizzo è obbligatorio";
      }
      if (!formData.customer_data?.city?.trim()) {
        newErrors.customer_city = "La città è obbligatoria";
      }
      if (!formData.customer_data?.zip_code?.trim()) {
        newErrors.customer_zip_code = "Il CAP è obbligatorio";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Qui implementare la chiamata API per salvare la chiamata
      console.log("Saving call:", formData);
      
      // Simulazione API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect alla lista chiamate
      navigate("/calls");
    } catch (error) {
      console.error("Errore nel salvataggio della chiamata:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/calls");
  };

  return (
    <div className="flex flex-col h-screen">
      <PageHeader
        title="Nuova Chiamata"
        description="Registra una nuova chiamata e gestisci le informazioni del cliente"
        icon="solar:phone-calling-rounded-bold-duotone"
      />
      
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informazioni Chiamata */}
              <Card>
                <CardHeader className="flex gap-3">
                  <Icon icon="solar:phone-bold-duotone" width={24} />
                  <div className="flex flex-col">
                    <p className="text-md">Informazioni Chiamata</p>
                    <p className="text-small text-default-500">
                      Dati della chiamata ricevuta
                    </p>
                  </div>
                </CardHeader>
                <CardBody className="gap-4">
                  {/* Cliente esistente o nuovo */}
                  <div className="flex gap-4 items-center">
                    <label className="text-small font-medium min-w-fit">
                      Nuovo Cliente:
                    </label>
                    <Switch
                      isSelected={formData.is_new_customer}
                      onValueChange={handleNewCustomerToggle}
                    >
                      {formData.is_new_customer ? "Sì" : "No"}
                    </Switch>
                  </div>

                  {!formData.is_new_customer && (
                    <Autocomplete
                      label="Cliente Esistente"
                      placeholder="Cerca cliente..."
                      selectedKey={selectedCustomer?.customer_id}
                      onSelectionChange={(key) => handleCustomerSelection(key as string)}
                      startContent={<Icon icon="solar:user-bold" width={16} />}
                    >
                      {customers.map((customer) => (
                                                 <AutocompleteItem
                           key={customer.customer_id}
                           textValue={`${customer.name} ${customer.surname}`}
                         >
                          <div className="flex flex-col">
                            <span>{`${customer.name} ${customer.surname}`}</span>
                            <span className="text-small text-default-400">
                              {customer.phone} - {customer.city}
                            </span>
                          </div>
                        </AutocompleteItem>
                      ))}
                    </Autocomplete>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Nome Chiamante *"
                      placeholder="Nome e cognome"
                      value={formData.caller_name}
                      onValueChange={(value) => handleInputChange("caller_name", value)}
                      isInvalid={!!errors.caller_name}
                      errorMessage={errors.caller_name}
                      startContent={<Icon icon="solar:user-bold" width={16} />}
                      isDisabled={!!selectedCustomer}
                    />
                    <Input
                      label="Telefono *"
                      placeholder="+39 333 1234567"
                      value={formData.caller_phone}
                      onValueChange={(value) => handleInputChange("caller_phone", value)}
                      isInvalid={!!errors.caller_phone}
                      errorMessage={errors.caller_phone}
                      startContent={<Icon icon="solar:phone-bold" width={16} />}
                      isDisabled={!!selectedCustomer}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Livello di Urgenza"
                      placeholder="Seleziona urgenza"
                      selectedKeys={[formData.urgency_level]}
                      onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0] as string;
                        handleInputChange("urgency_level", value);
                      }}
                      startContent={<Icon icon="solar:danger-triangle-bold" width={16} />}
                    >
                                             <SelectItem key="low">Bassa</SelectItem>
                       <SelectItem key="medium">Media</SelectItem>
                       <SelectItem key="high">Alta</SelectItem>
                       <SelectItem key="emergency">Emergenza</SelectItem>
                    </Select>
                    
                    <Select
                      label="Fonte Chiamata"
                      placeholder="Come è arrivata la chiamata"
                      selectedKeys={[formData.call_source]}
                      onSelectionChange={(keys) => {
                        const value = Array.from(keys)[0] as string;
                        handleInputChange("call_source", value);
                      }}
                      startContent={<Icon icon="solar:phone-calling-bold" width={16} />}
                    >
                                             <SelectItem key="phone">Telefono</SelectItem>
                       <SelectItem key="email">Email</SelectItem>
                       <SelectItem key="whatsapp">WhatsApp</SelectItem>
                       <SelectItem key="website">Sito Web</SelectItem>
                       <SelectItem key="walk_in">Di Persona</SelectItem>
                    </Select>
                  </div>

                  <Textarea
                    label="Descrizione Problema *"
                    placeholder="Descrivi dettagliatamente il problema riportato dal cliente..."
                    value={formData.problem_description}
                    onValueChange={(value) => handleInputChange("problem_description", value)}
                    isInvalid={!!errors.problem_description}
                    errorMessage={errors.problem_description}
                    minRows={4}
                  />

                  <Textarea
                    label="Note Aggiuntive"
                    placeholder="Eventuali note aggiuntive..."
                    value={formData.notes || ""}
                    onValueChange={(value) => handleInputChange("notes", value)}
                    minRows={2}
                  />
                </CardBody>
              </Card>

              {/* Informazioni Nuovo Cliente (se applicabile) */}
              {formData.is_new_customer && (
                <Card>
                  <CardHeader className="flex gap-3">
                    <Icon icon="solar:user-plus-rounded-bold-duotone" width={24} />
                    <div className="flex flex-col">
                      <p className="text-md">Nuovo Cliente</p>
                      <p className="text-small text-default-500">
                        Dati del nuovo cliente da creare
                      </p>
                    </div>
                  </CardHeader>
                  <CardBody className="gap-4">
                    <div className="flex gap-4 items-center">
                      <label className="text-small font-medium min-w-fit">
                        Tipo Cliente:
                      </label>
                      <Switch
                        isSelected={formData.customer_data?.customer_type === "business"}
                        onValueChange={(checked) =>
                          handleCustomerDataChange("customer_type", checked ? "business" : "private")
                        }
                      >
                        {formData.customer_data?.customer_type === "business" ? "Azienda" : "Privato"}
                      </Switch>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Nome *"
                        placeholder="Nome"
                        value={formData.customer_data?.name || ""}
                        onValueChange={(value) => handleCustomerDataChange("name", value)}
                        isInvalid={!!errors.customer_name}
                        errorMessage={errors.customer_name}
                        startContent={<Icon icon="solar:user-bold" width={16} />}
                      />
                      <Input
                        label="Cognome *"
                        placeholder="Cognome"
                        value={formData.customer_data?.surname || ""}
                        onValueChange={(value) => handleCustomerDataChange("surname", value)}
                        isInvalid={!!errors.customer_surname}
                        errorMessage={errors.customer_surname}
                        startContent={<Icon icon="solar:user-bold" width={16} />}
                      />
                    </div>

                    {formData.customer_data?.customer_type === "business" && (
                      <Input
                        label="Nome Azienda"
                        placeholder="Nome dell'azienda"
                        value={formData.customer_data?.company_name || ""}
                        onValueChange={(value) => handleCustomerDataChange("company_name", value)}
                        startContent={<Icon icon="solar:buildings-2-bold" width={16} />}
                      />
                    )}

                    <Input
                      label="Email"
                      placeholder="email@esempio.com"
                      type="email"
                      value={formData.customer_data?.email || ""}
                      onValueChange={(value) => handleCustomerDataChange("email", value)}
                      startContent={<Icon icon="solar:letter-bold" width={16} />}
                    />

                    <Input
                      label="Indirizzo *"
                      placeholder="Via, Numero civico"
                      value={formData.customer_data?.address || ""}
                      onValueChange={(value) => handleCustomerDataChange("address", value)}
                      isInvalid={!!errors.customer_address}
                      errorMessage={errors.customer_address}
                      startContent={<Icon icon="solar:map-point-bold" width={16} />}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Città *"
                        placeholder="Città"
                        value={formData.customer_data?.city || ""}
                        onValueChange={(value) => handleCustomerDataChange("city", value)}
                        isInvalid={!!errors.customer_city}
                        errorMessage={errors.customer_city}
                        startContent={<Icon icon="solar:city-bold" width={16} />}
                      />
                      <Input
                        label="CAP *"
                        placeholder="00000"
                        value={formData.customer_data?.zip_code || ""}
                        onValueChange={(value) => handleCustomerDataChange("zip_code", value)}
                        isInvalid={!!errors.customer_zip_code}
                        errorMessage={errors.customer_zip_code}
                        startContent={<Icon icon="solar:mailbox-bold" width={16} />}
                      />
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>

            <Spacer y={6} />

            {/* Azioni */}
            <Card>
              <CardBody>
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
                    {loading ? "Registrazione..." : "Registra Chiamata"}
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