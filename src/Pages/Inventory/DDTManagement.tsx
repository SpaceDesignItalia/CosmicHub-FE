import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Input,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Textarea,
  DatePicker,
  Autocomplete,
  AutocompleteItem,
  Divider,
  Tooltip,
  Spinner,
  Badge,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { parseDate } from "@internationalized/date";
import type { DateValue } from "@internationalized/date";
import axios from "axios";
import PageHeader from "../../Components/Layout/PageHeader";
import ProductSelectionModal from "../../Components/Inventory/DDT/ProductSelectionModal";

// Interfaces
interface Vehicle {
  vehicle_id: string;
  name: string;
  license_plate: string;
  type: string;
  capacity: number;
  assigned_user?: string;
}

interface Product {
  product_id: string;
  name: string;
  sku: string;
  weight: number;
  dimensions: string;
  category: string;
  price: number;
  quantity: number;
}

interface DDTItem {
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  weight: number;
  unit_price: number;
  total_price: number;
  serial_numbers?: string[];
  notes?: string;
}

interface DDT {
  ddt_id: string;
  ddt_number: string;
  date: string;
  vehicle_id: string;
  vehicle_name: string;
  vehicle_plate: string;
  driver_name: string;
  driver_phone?: string;
  departure_address: string;
  destination_address: string;
  customer_name: string;
  customer_vat?: string;
  customer_phone?: string;
  items: DDTItem[];
  total_weight: number;
  total_value: number;
  status: "draft" | "confirmed" | "in_transit" | "delivered" | "cancelled";
  departure_time?: string;
  arrival_time?: string;
  delivery_notes?: string;
  signature_path?: string;
  created_at: string;
  updated_at: string;
}

interface Customer {
  customer_id: string;
  name: string;
  address: string;
  vat_number?: string;
  phone?: string;
  email?: string;
}

const statusColors = {
  draft: "default",
  confirmed: "primary",
  in_transit: "warning",
  delivered: "success",
  cancelled: "danger",
} as const;

const statusLabels = {
  draft: "Bozza",
  confirmed: "Confermato",
  in_transit: "In Transito",
  delivered: "Consegnato",
  cancelled: "Annullato",
};

export default function DDTManagement() {
  // State management
  const [ddts, setDDTs] = useState<DDT[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal states
  const { isOpen: isCreateModalOpen, onOpen: onCreateModalOpen, onClose: onCreateModalClose } = useDisclosure();
  const { isOpen: isViewModalOpen, onOpen: onViewModalOpen, onClose: onViewModalClose } = useDisclosure();
  const { isOpen: isProductModalOpen, onOpen: onProductModalOpen, onClose: onProductModalClose } = useDisclosure();
  const [selectedDDT, setSelectedDDT] = useState<DDT | null>(null);

  // Form state for new DDT
  const [newDDT, setNewDDT] = useState<Partial<DDT>>({
    date: new Date().toISOString().split('T')[0],
    departure_address: "",
    destination_address: "",
    customer_name: "",
    items: [],
    status: "draft",
  });

  const [ddtItems, setDDTItems] = useState<DDTItem[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load DDTs
      const ddtResponse = await axios.get("/DDT/GET/GetAllDDTs");
      setDDTs(ddtResponse.data || []);

      // Load vehicles
      const vehicleResponse = await axios.get("/Vehicle/GET/GetAllVehicles");
      setVehicles(vehicleResponse.data || []);

      // Load products
      const productResponse = await axios.get("/Product/GET/GetAllProducts");
      setProducts(productResponse.data || []);

      // Load customers
      const customerResponse = await axios.get("/Customer/GET/GetAllCustomers");
      setCustomers(customerResponse.data || []);

    } catch (error) {
      console.error("Errore nel caricamento dati:", error);
      // Load mock data for development
      loadMockData();
    } finally {
      setIsLoading(false);
    }
  };

  const loadMockData = () => {
    const mockDDTs: DDT[] = [
      {
        ddt_id: "1",
        ddt_number: "DDT/2024/001",
        date: "2024-01-15",
        vehicle_id: "1",
        vehicle_name: "Furgone Caldaie",
        vehicle_plate: "AB123CD",
        driver_name: "Mario Rossi",
        driver_phone: "+39 333 1234567",
        departure_address: "Via Roma 123, Milano",
        destination_address: "Via Verdi 456, Bergamo",
        customer_name: "Caldaie Service SRL",
        customer_vat: "IT12345678901",
        customer_phone: "+39 035 123456",
        items: [
          {
            product_id: "1",
            product_name: "Caldaia Condensazione Vaillant 24kW",
            sku: "VAI-24-COND",
            quantity: 2,
            weight: 80,
            unit_price: 1200,
            total_price: 2400,
            serial_numbers: ["VAI001", "VAI002"],
          }
        ],
        total_weight: 160,
        total_value: 2400,
        status: "in_transit",
        departure_time: "08:30",
        created_at: "2024-01-15T08:00:00Z",
        updated_at: "2024-01-15T08:30:00Z",
      },
      {
        ddt_id: "2",
        ddt_number: "DDT/2024/002",
        date: "2024-01-16",
        vehicle_id: "2",
        vehicle_name: "Furgone Ricambi",
        vehicle_plate: "EF456GH",
        driver_name: "Luigi Bianchi",
        departure_address: "Via Roma 123, Milano",
        destination_address: "Via Manzoni 789, Como",
        customer_name: "Termo Impianti Como",
        items: [
          {
            product_id: "2",
            product_name: "Pompa Circolazione Grundfos",
            sku: "GRU-CIRC-25",
            quantity: 5,
            weight: 15,
            unit_price: 180,
            total_price: 900,
          }
        ],
        total_weight: 75,
        total_value: 900,
        status: "confirmed",
        created_at: "2024-01-16T09:00:00Z",
        updated_at: "2024-01-16T09:15:00Z",
      }
    ];

    setDDTs(mockDDTs);
  };

  // Filter DDTs
  const filteredDDTs = ddts.filter(ddt => {
    const matchesSearch = ddt.ddt_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ddt.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ddt.vehicle_plate.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || ddt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle DDT creation
  const handleCreateDDT = async () => {
    try {
      const ddtData = {
        ...newDDT,
        items: ddtItems,
        total_weight: ddtItems.reduce((sum, item) => sum + (item.weight * item.quantity), 0),
        total_value: ddtItems.reduce((sum, item) => sum + item.total_price, 0),
        ddt_number: `DDT/${new Date().getFullYear()}/${String(ddts.length + 1).padStart(3, '0')}`,
      };

      await axios.post("/DDT/POST/CreateDDT", ddtData);
      loadData();
      onCreateModalClose();
      resetForm();
    } catch (error) {
      console.error("Errore nella creazione DDT:", error);
    }
  };

  const resetForm = () => {
    setNewDDT({
      date: new Date().toISOString().split('T')[0],
      departure_address: "",
      destination_address: "",
      customer_name: "",
      items: [],
      status: "draft",
    });
    setDDTItems([]);
  };

  // Handle product addition to DDT
  const addProductToDDT = (product: Product, quantity: number) => {
    const newItem: DDTItem = {
      product_id: product.product_id,
      product_name: product.name,
      sku: product.sku,
      quantity,
      weight: product.weight || 0,
      unit_price: product.price,
      total_price: product.price * quantity,
    };

    setDDTItems(prev => [...prev, newItem]);
  };

  // Handle multiple products selection from modal
  const handleProductsSelection = (selectedProducts: any[]) => {
    const newItems: DDTItem[] = selectedProducts.map(product => ({
      product_id: product.product_id,
      product_name: product.name,
      sku: product.sku,
      quantity: product.selected_quantity,
      weight: product.weight || 0,
      unit_price: product.price,
      total_price: product.price * product.selected_quantity,
      serial_numbers: product.serial_numbers,
      notes: product.notes,
    }));

    setDDTItems(prev => [...prev, ...newItems]);
    onProductModalClose();
  };

  const removeProductFromDDT = (index: number) => {
    setDDTItems(prev => prev.filter((_, i) => i !== index));
  };

  // Handle DDT status update
  const updateDDTStatus = async (ddtId: string, newStatus: DDT['status']) => {
    try {
      await axios.put(`/DDT/PUT/UpdateDDTStatus/${ddtId}`, { status: newStatus });
      loadData();
    } catch (error) {
      console.error("Errore nell'aggiornamento stato DDT:", error);
    }
  };

  // Generate PDF
  const generatePDF = async (ddt: DDT) => {
    try {
      const response = await axios.get(`/DDT/GET/GeneratePDF/${ddt.ddt_id}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${ddt.ddt_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Errore nella generazione PDF:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" color="primary" label="Caricamento DDT..." />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col p-4 gap-6 min-h-screen">
      <PageHeader
        title="Gestione DDT"
        description="Documenti di Trasporto per furgoni e caldaie"
        icon="solar:document-text-bold-duotone"
        size="md"
        actions={[
          {
            label: "Nuovo DDT",
            icon: "solar:add-circle-bold",
            color: "primary",
            variant: "solid",
            onClick: onCreateModalOpen,
          },
        ]}
      />

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Cerca per numero DDT, cliente o targa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startContent={<Icon icon="solar:magnifer-bold" width={20} />}
            className="flex-1"
          />
          <Select
            placeholder="Filtra per stato"
            selectedKeys={statusFilter ? [statusFilter] : []}
            onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string)}
            className="w-48"
          >
            <SelectItem key="all">Tutti gli stati</SelectItem>
            <SelectItem key="draft">Bozza</SelectItem>
            <SelectItem key="confirmed">Confermato</SelectItem>
            <SelectItem key="in_transit">In Transito</SelectItem>
            <SelectItem key="delivered">Consegnato</SelectItem>
            <SelectItem key="cancelled">Annullato</SelectItem>
          </Select>
        </div>
      </Card>

      {/* DDT Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Documenti di Trasporto</h3>
          <Badge color="primary" variant="flat">
            {filteredDDTs.length} DDT
          </Badge>
        </CardHeader>
        <CardBody>
          <Table aria-label="Tabella DDT">
            <TableHeader>
              <TableColumn>NUMERO DDT</TableColumn>
              <TableColumn>DATA</TableColumn>
              <TableColumn>VEICOLO</TableColumn>
              <TableColumn>CLIENTE</TableColumn>
              <TableColumn>DESTINAZIONE</TableColumn>
              <TableColumn>PESO TOTALE</TableColumn>
              <TableColumn>VALORE</TableColumn>
              <TableColumn>STATO</TableColumn>
              <TableColumn>AZIONI</TableColumn>
            </TableHeader>
            <TableBody>
              {filteredDDTs.map((ddt) => (
                <TableRow key={ddt.ddt_id}>
                  <TableCell>
                    <div className="font-medium">{ddt.ddt_number}</div>
                  </TableCell>
                  <TableCell>
                    {new Date(ddt.date).toLocaleDateString('it-IT')}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{ddt.vehicle_name}</div>
                      <div className="text-sm text-default-500">{ddt.vehicle_plate}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{ddt.customer_name}</div>
                      {ddt.customer_phone && (
                        <div className="text-sm text-default-500">{ddt.customer_phone}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-48 truncate" title={ddt.destination_address}>
                      {ddt.destination_address}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{ddt.total_weight} kg</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">€{ddt.total_value.toFixed(2)}</div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={statusColors[ddt.status]}
                      size="sm"
                      variant="flat"
                    >
                      {statusLabels[ddt.status]}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Tooltip content="Visualizza">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => {
                            setSelectedDDT(ddt);
                            onViewModalOpen();
                          }}
                        >
                          <Icon icon="solar:eye-bold" width={16} />
                        </Button>
                      </Tooltip>
                      
                      <Dropdown>
                        <DropdownTrigger>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                          >
                            <Icon icon="solar:menu-dots-bold" width={16} />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu>
                          <DropdownItem
                            key="pdf"
                            startContent={<Icon icon="solar:file-text-bold" width={16} />}
                            onPress={() => generatePDF(ddt)}
                          >
                            Genera PDF
                          </DropdownItem>
                          {ddt.status === "draft" && (
                            <DropdownItem
                              key="confirm"
                              startContent={<Icon icon="solar:check-circle-bold" width={16} />}
                              onPress={() => updateDDTStatus(ddt.ddt_id, "confirmed")}
                            >
                              Conferma
                            </DropdownItem>
                          )}
                          {ddt.status === "confirmed" && (
                            <DropdownItem
                              key="transit"
                              startContent={<Icon icon="solar:delivery-bold" width={16} />}
                              onPress={() => updateDDTStatus(ddt.ddt_id, "in_transit")}
                            >
                              Avvia Trasporto
                            </DropdownItem>
                          )}
                          {ddt.status === "in_transit" && (
                            <DropdownItem
                              key="deliver"
                              startContent={<Icon icon="solar:check-square-bold" width={16} />}
                              onPress={() => updateDDTStatus(ddt.ddt_id, "delivered")}
                            >
                              Segna Consegnato
                            </DropdownItem>
                          )}
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Create DDT Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={onCreateModalClose}
        size="5xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-semibold">Nuovo Documento di Trasporto</h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DatePicker
                  label="Data DDT"
                  value={newDDT.date ? parseDate(newDDT.date) : null}
                  onChange={(date) => {
                    if (date) {
                      const dateString = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
                      setNewDDT(prev => ({ ...prev, date: dateString }));
                    }
                  }}
                />
                
                <Select
                  label="Veicolo"
                  placeholder="Seleziona veicolo"
                  selectedKeys={newDDT.vehicle_id ? [newDDT.vehicle_id] : []}
                  onSelectionChange={(keys) => {
                    const vehicleId = Array.from(keys)[0] as string;
                    const vehicle = vehicles.find(v => v.vehicle_id === vehicleId);
                    setNewDDT(prev => ({
                      ...prev,
                      vehicle_id: vehicleId,
                      vehicle_name: vehicle?.name || "",
                      vehicle_plate: vehicle?.license_plate || "",
                      driver_name: vehicle?.assigned_user || "",
                    }));
                  }}
                >
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.vehicle_id}>
                      {vehicle.name} - {vehicle.license_plate}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nome Autista"
                  value={newDDT.driver_name || ""}
                  onChange={(e) => setNewDDT(prev => ({ ...prev, driver_name: e.target.value }))}
                />
                
                <Input
                  label="Telefono Autista"
                  value={newDDT.driver_phone || ""}
                  onChange={(e) => setNewDDT(prev => ({ ...prev, driver_phone: e.target.value }))}
                />
              </div>

              {/* Customer Information */}
              <Divider />
              <h4 className="text-lg font-medium">Informazioni Cliente</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nome Cliente"
                  value={newDDT.customer_name || ""}
                  onChange={(e) => setNewDDT(prev => ({ ...prev, customer_name: e.target.value }))}
                />
                
                <Input
                  label="Partita IVA"
                  value={newDDT.customer_vat || ""}
                  onChange={(e) => setNewDDT(prev => ({ ...prev, customer_vat: e.target.value }))}
                />
              </div>

              <Input
                label="Telefono Cliente"
                value={newDDT.customer_phone || ""}
                onChange={(e) => setNewDDT(prev => ({ ...prev, customer_phone: e.target.value }))}
              />

              {/* Addresses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Textarea
                  label="Indirizzo di Partenza"
                  value={newDDT.departure_address || ""}
                  onChange={(e) => setNewDDT(prev => ({ ...prev, departure_address: e.target.value }))}
                />
                
                <Textarea
                  label="Indirizzo di Destinazione"
                  value={newDDT.destination_address || ""}
                  onChange={(e) => setNewDDT(prev => ({ ...prev, destination_address: e.target.value }))}
                />
              </div>

              {/* Products */}
              <Divider />
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-medium">Prodotti da Trasportare</h4>
                                  <Button
                    color="primary"
                    variant="flat"
                    startContent={<Icon icon="solar:add-circle-bold" width={16} />}
                    onPress={onProductModalOpen}
                  >
                    Aggiungi Prodotto
                  </Button>
              </div>

              {ddtItems.length > 0 && (
                <Table aria-label="Prodotti DDT">
                  <TableHeader>
                    <TableColumn>PRODOTTO</TableColumn>
                    <TableColumn>SKU</TableColumn>
                    <TableColumn>QUANTITÀ</TableColumn>
                    <TableColumn>PESO</TableColumn>
                    <TableColumn>PREZZO UNIT.</TableColumn>
                    <TableColumn>TOTALE</TableColumn>
                    <TableColumn>AZIONI</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {ddtItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell>{item.sku}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.weight * item.quantity} kg</TableCell>
                        <TableCell>€{item.unit_price.toFixed(2)}</TableCell>
                        <TableCell>€{item.total_price.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            isIconOnly
                            size="sm"
                            color="danger"
                            variant="light"
                            onPress={() => removeProductFromDDT(index)}
                          >
                            <Icon icon="solar:trash-bin-minimalistic-bold" width={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {ddtItems.length > 0 && (
                <div className="bg-default-100 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span>Peso Totale:</span>
                    <span className="font-medium">
                      {ddtItems.reduce((sum, item) => sum + (item.weight * item.quantity), 0)} kg
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valore Totale:</span>
                    <span className="font-medium">
                      €{ddtItems.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onCreateModalClose}>
              Annulla
            </Button>
            <Button
              color="primary"
              onPress={handleCreateDDT}
              isDisabled={!newDDT.vehicle_id || !newDDT.customer_name || ddtItems.length === 0}
            >
              Crea DDT
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* View DDT Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={onViewModalClose}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {selectedDDT && (
            <>
              <ModalHeader>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold">{selectedDDT.ddt_number}</h3>
                  <Chip
                    color={statusColors[selectedDDT.status]}
                    variant="flat"
                  >
                    {statusLabels[selectedDDT.status]}
                  </Chip>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-6">
                  {/* DDT Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-default-500">Data</p>
                      <p className="font-medium">{new Date(selectedDDT.date).toLocaleDateString('it-IT')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-default-500">Veicolo</p>
                      <p className="font-medium">{selectedDDT.vehicle_name} - {selectedDDT.vehicle_plate}</p>
                    </div>
                  </div>

                  {/* Driver Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-default-500">Autista</p>
                      <p className="font-medium">{selectedDDT.driver_name}</p>
                    </div>
                    {selectedDDT.driver_phone && (
                      <div>
                        <p className="text-sm text-default-500">Telefono Autista</p>
                        <p className="font-medium">{selectedDDT.driver_phone}</p>
                      </div>
                    )}
                  </div>

                  {/* Customer Info */}
                  <Divider />
                  <h4 className="text-lg font-medium">Cliente</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-default-500">Nome</p>
                      <p className="font-medium">{selectedDDT.customer_name}</p>
                    </div>
                    {selectedDDT.customer_vat && (
                      <div>
                        <p className="text-sm text-default-500">Partita IVA</p>
                        <p className="font-medium">{selectedDDT.customer_vat}</p>
                      </div>
                    )}
                  </div>

                  {/* Addresses */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-default-500">Partenza</p>
                      <p className="font-medium">{selectedDDT.departure_address}</p>
                    </div>
                    <div>
                      <p className="text-sm text-default-500">Destinazione</p>
                      <p className="font-medium">{selectedDDT.destination_address}</p>
                    </div>
                  </div>

                  {/* Items */}
                  <Divider />
                  <h4 className="text-lg font-medium">Prodotti Trasportati</h4>
                  <Table aria-label="Prodotti DDT">
                    <TableHeader>
                      <TableColumn>PRODOTTO</TableColumn>
                      <TableColumn>SKU</TableColumn>
                      <TableColumn>QUANTITÀ</TableColumn>
                      <TableColumn>PESO</TableColumn>
                      <TableColumn>VALORE</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {selectedDDT.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell>{item.sku}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.weight * item.quantity} kg</TableCell>
                          <TableCell>€{item.total_price.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Totals */}
                  <div className="bg-default-100 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <span>Peso Totale:</span>
                      <span className="font-medium">{selectedDDT.total_weight} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Valore Totale:</span>
                      <span className="font-medium">€{selectedDDT.total_value.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Times */}
                  {(selectedDDT.departure_time || selectedDDT.arrival_time) && (
                    <>
                      <Divider />
                      <div className="grid grid-cols-2 gap-4">
                        {selectedDDT.departure_time && (
                          <div>
                            <p className="text-sm text-default-500">Ora Partenza</p>
                            <p className="font-medium">{selectedDDT.departure_time}</p>
                          </div>
                        )}
                        {selectedDDT.arrival_time && (
                          <div>
                            <p className="text-sm text-default-500">Ora Arrivo</p>
                            <p className="font-medium">{selectedDDT.arrival_time}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Delivery Notes */}
                  {selectedDDT.delivery_notes && (
                    <>
                      <Divider />
                      <div>
                        <p className="text-sm text-default-500">Note Consegna</p>
                        <p className="font-medium">{selectedDDT.delivery_notes}</p>
                      </div>
                    </>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onViewModalClose}>
                  Chiudi
                </Button>
                <Button
                  color="primary"
                  startContent={<Icon icon="solar:file-text-bold" width={16} />}
                  onPress={() => generatePDF(selectedDDT)}
                >
                  Genera PDF
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Product Selection Modal */}
      <ProductSelectionModal
        isOpen={isProductModalOpen}
        onClose={onProductModalClose}
        products={products}
        onConfirm={handleProductsSelection}
        vehicleCapacity={newDDT.vehicle_id ? vehicles.find(v => v.vehicle_id === newDDT.vehicle_id)?.capacity : undefined}
      />
    </div>
  );
}