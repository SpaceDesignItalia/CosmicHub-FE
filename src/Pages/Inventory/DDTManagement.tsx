import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  DatePicker,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Textarea,
  Tooltip,
  useDisclosure,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { getLocalTimeZone, parseDate, today } from "@internationalized/date";
import axios from "axios";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { useEffect, useState } from "react";
import ProductSelectionModal from "../../Components/Inventory/DDT/ProductSelectionModal";
import PageHeader from "../../Components/Layout/PageHeader";

// Inizializza i font per pdfmake
if (typeof window !== "undefined") {
  (pdfMake as any).vfs = (pdfFonts as any).pdfMake
    ? (pdfFonts as any).pdfMake.vfs
    : {};
}

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
  product_id: number;
  name: string;
  sku: string;
  weight: number;
  dimensions: string;
  category: string;
  price: number;
  stock_unit: number;
}

interface Category {
  category_id: string;
  category_name: string;
}

interface DDTItem {
  product_id: number;
  name: string;
  sku: string;
  quantity: number;
  weight: number;
  unit_price: number;
  total_price: number;
  serial_numbers?: string[];
  notes?: string;
}

interface DDT {
  DDT_id: string;
  document_id: string;
  date: string;
  vehicle_id: string;
  name: string;
  license_plate: string;
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal states
  const {
    isOpen: isCreateModalOpen,
    onOpen: onCreateModalOpen,
    onClose: onCreateModalClose,
  } = useDisclosure();
  const {
    isOpen: isViewModalOpen,
    onOpen: onViewModalOpen,
    onClose: onViewModalClose,
  } = useDisclosure();
  const {
    isOpen: isProductModalOpen,
    onOpen: onProductModalOpen,
    onClose: onProductModalClose,
  } = useDisclosure();
  const [selectedDDT, setSelectedDDT] = useState<DDT | null>(null);

  // Form state for new DDT
  const [newDDT, setNewDDT] = useState<Partial<DDT>>({
    date: new Date().toISOString().split("T")[0],
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
      const ddtResponse = await axios.get("/Document/GET/GetAllDDT");
      if (ddtResponse.status === 200) {
        setDDTs(ddtResponse.data || []);
      } else {
        console.error("Errore nel caricamento DDTs:", ddtResponse.statusText);
      }

      // Load vehicles
      const vehicleResponse = await axios.get("/Vehicle/GET/GetAllVehicles");
      if (vehicleResponse.status === 200) {
        setVehicles(vehicleResponse.data || []);
      } else {
        console.error(
          "Errore nel caricamento veicoli:",
          vehicleResponse.statusText
        );
      }

      // Load products
      const productResponse = await axios.get("/Product/GET/GetAllProducts");
      if (productResponse.status === 200) {
        setProducts(productResponse.data || []);
      } else {
        console.error(
          "Errore nel caricamento prodotti:",
          productResponse.statusText
        );
      }

      // Load categories
      const categoryResponse = await axios.get("/Product/GET/GetAllCategories");
      if (categoryResponse.status === 200) {
        // Estrai le coppie uniche di category_id e category_name
        const uniqueCategories = new Map();
        categoryResponse.data.forEach((item: any) => {
          if (item.category_id && item.category_name) {
            uniqueCategories.set(item.category_id, item.category_name);
          }
        });

        // Converti in array di oggetti Category
        const categoriesArray = Array.from(uniqueCategories.entries()).map(
          ([category_id, category_name]) => ({
            category_id,
            category_name,
          })
        );

        setCategories(categoriesArray);
      } else {
        console.error(
          "Errore nel caricamento categorie:",
          categoryResponse.statusText
        );
      }

      // Load customers
      /*const customerResponse = await axios.get("/Customer/GET/GetAllCustomers");
      if (customerResponse.status === 200) {
        setCustomers(customerResponse.data || []);
      } else {
        console.error(
          "Errore nel caricamento clienti:",
          customerResponse.statusText
        );
      }*/
    } catch (error) {
      console.error("Errore nel caricamento dati:", error);
      // Load mock data for development
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter DDTs
  const filteredDDTs = ddts.filter((ddt) => {
    const matchesSearch =
      ddt.document_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ddt.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ddt.license_plate.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || ddt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle DDT creation
  const handleCreateDDT = async () => {
    try {
      const ddtData = {
        ...newDDT,
        items: ddtItems,
        total_weight: ddtItems.reduce(
          (sum, item) => sum + item.weight * item.quantity,
          0
        ),
        total_value: ddtItems.reduce((sum, item) => sum + item.total_price, 0),
        document_id: `DDT/${new Date().getFullYear()}/${String(
          ddts.length + 1
        ).padStart(3, "0")}`,
      };

      await axios.post("/Document/POST/CreateDDT", ddtData).then((res) => {
        if (res.status === 200) {
          loadData();
          onCreateModalClose();
          resetForm();
        } else {
          console.error("Errore nella creazione DDT:", res.data);
        }
      });
    } catch (error) {
      console.error("Errore nella creazione DDT:", error);
    }
  };

  const resetForm = () => {
    setNewDDT({
      date: new Date().toISOString().split("T")[0],
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
      name: product.name,
      sku: product.sku,
      quantity,
      weight: product.weight || 0,
      unit_price: product.price,
      total_price: product.price * quantity,
    };

    setDDTItems((prev) => [...prev, newItem]);
  };

  // Handle multiple products selection from modal
  const handleProductsSelection = (selectedProducts: any[]) => {
    const newItems: DDTItem[] = selectedProducts.map((product) => ({
      product_id: product.product_id,
      name: product.name,
      sku: product.sku,
      quantity: product.selected_quantity,
      weight: product.weight || 0,
      unit_price: product.price,
      total_price: product.price * product.selected_quantity,
      serial_numbers: product.serial_numbers,
      notes: product.notes,
    }));

    setDDTItems((prev) => [...prev, ...newItems]);
    onProductModalClose();
  };

  const removeProductFromDDT = (index: number) => {
    setDDTItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle DDT status update
  const updateDDTStatus = async (ddtId: string, newStatus: DDT["status"]) => {
    console.log(ddtId, newStatus);
    try {
      await axios.put(`/Document/UPDATE/UpdateDDTStatus`, {
        DDT_id: ddtId,
        status: newStatus,
      });
      loadData();
    } catch (error) {
      console.error("Errore nell'aggiornamento stato DDT:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" color="primary" label="Caricamento DDT..." />
      </div>
    );
  }

  function generateDDTPdf(ddt: DDT) {
    try {
      console.log('Generazione PDF per DDT:', ddt.document_id);
      
      // Calcola i totali con controlli di sicurezza
      const imponibile = Number(ddt.total_value) || 0;
      const iva = Number(imponibile) * 0.22;
      const totale = Number(imponibile) + Number(iva);
      const peso_totale = ddt.items ? ddt.items.reduce((sum, item) => {
        const weight = Number(item.weight) || 0;
        const quantity = Number(item.quantity) || 0;
        return sum + (weight * quantity);
      }, 0) : 0;

      const docDefinition = {
        pageSize: 'A4',
        pageMargins: [40, 40, 40, 40],
        content: [
          // Titolo del documento
          {
            text: 'DOCUMENTO DI TRASPORTO',
            style: 'title',
            alignment: 'center',
            margin: [0, 0, 0, 20]
          },

          // Intestazione azienda e numero documento
          {
            columns: [
              [
                { text: "Arredufficio Srl", style: "companyName" },
                { text: "Via Crocicchio, 12 - 50018 Tavarnelle (FI)", style: "companyInfo" },
                { text: "Tel. 011-358475 - Fax 011-358479", style: "companyInfo" },
                { text: "e-mail: arredoufficio@arredufficio.it", style: "companyInfo" },
                { text: "C.F./P. Iva 01314810120", style: "companyInfo" },
              ],
              [
                { text: `DDT N° ${ddt.document_id}`, style: "documentNumber" },
                { text: `Data: ${new Date(ddt.date).toLocaleDateString("it-IT")}`, style: "documentInfo" },
                { text: `Stato: ${statusLabels[ddt.status]}`, style: "documentInfo" },
              ],
            ],
            margin: [0, 0, 0, 20]
          },

          // Informazioni veicolo e autista
          {
            columns: [
              [
                { text: "VEICOLO", style: "sectionTitle" },
                { text: `${ddt.name} - ${ddt.license_plate}`, style: "sectionContent" },
              ],
              [
                { text: "AUTISTA", style: "sectionTitle" },
                { text: ddt.driver_name || "Non specificato", style: "sectionContent" },
                ...(ddt.driver_phone ? [{ text: `Tel: ${ddt.driver_phone}`, style: "sectionContent" }] : [])
              ],
            ],
            margin: [0, 0, 0, 15]
          },

          // Mittente e destinatario
          {
            columns: [
              [
                { text: "MITTENTE", style: "sectionTitle" },
                { text: "Arredufficio Srl", style: "sectionContent" },
                { text: "Indirizzo di partenza:", style: "sectionLabel" },
                { text: ddt.departure_address || "Non specificato", style: "sectionContent" },
              ],
              [
                { text: "DESTINATARIO", style: "sectionTitle" },
                { text: ddt.customer_name || "Non specificato", style: "sectionContent" },
                ...(ddt.customer_vat ? [{ text: `P.IVA: ${ddt.customer_vat}`, style: "sectionContent" }] : []),
                ...(ddt.customer_phone ? [{ text: `Tel: ${ddt.customer_phone}`, style: "sectionContent" }] : []),
                { text: "Indirizzo di destinazione:", style: "sectionLabel" },
                { text: ddt.destination_address || "Non specificato", style: "sectionContent" },
              ],
            ],
            margin: [0, 0, 0, 20]
          },

          // Tabella prodotti
          {
            text: "ARTICOLI TRASPORTATI",
            style: "sectionTitle",
            margin: [0, 0, 0, 10]
          },
          {
            table: {
              headerRows: 1,
              widths: ['15%', '40%', '10%', '12%', '12%', '11%'],
              body: [
                [
                  { text: "Codice", style: "tableHeader" },
                  { text: "Descrizione", style: "tableHeader" },
                  { text: "Q.tà", style: "tableHeader" },
                  { text: "Peso (kg)", style: "tableHeader" },
                  { text: "Prezzo Unit.", style: "tableHeader" },
                  { text: "Importo", style: "tableHeader" },
                ],
                ...(ddt.items && ddt.items.length > 0 ? ddt.items.map((item: DDTItem) => {
                  const weight = Number(item.weight) || 0;
                  const quantity = Number(item.quantity) || 0;
                  const unitPrice = Number(item.unit_price) || 0;
                  const totalPrice = Number(item.total_price) || 0;
                  
                  return [
                    { text: item.sku || "N/A", style: "tableCell" },
                    { text: item.name || "N/A", style: "tableCell" },
                    { text: quantity.toString(), style: "tableCell" },
                    { text: (weight * quantity).toFixed(2), style: "tableCell" },
                    { text: `€${unitPrice.toFixed(2)}`, style: "tableCell" },
                    { text: `€${totalPrice.toFixed(2)}`, style: "tableCell" },
                  ];
                }) : [
                  [
                    { text: "Nessun articolo", colSpan: 6, style: "tableCell", alignment: 'center' },
                    "", "", "", "", ""
                  ]
                ])
              ],
            },
            layout: {
              hLineWidth: function() { return 0.5; },
              vLineWidth: function() { return 0.5; },
              hLineColor: function() { return '#aaa'; },
              vLineColor: function() { return '#aaa'; },
              fillColor: function(rowIndex: any) {
                return (rowIndex === 0) ? '#f0f0f0' : null;
              }
            },
            margin: [0, 0, 0, 20]
          },

          // Totali
          {
            columns: [
              { width: "*", text: "" },
              {
                width: "auto",
                table: {
                  body: [
                                      [
                    { text: "Peso Totale:", style: "totalLabel" },
                    { text: `${Number(peso_totale).toFixed(2)} kg`, style: "totalValue" }
                  ],
                  [
                    { text: "Totale Imponibile:", style: "totalLabel" },
                    { text: `€${Number(imponibile).toFixed(2)}`, style: "totalValue" }
                  ],
                  [
                    { text: "IVA (22%):", style: "totalLabel" },
                    { text: `€${Number(iva).toFixed(2)}`, style: "totalValue" }
                  ],
                  [
                    { text: "TOTALE DOCUMENTO:", style: "totalLabelBold" },
                    { text: `€${Number(totale).toFixed(2)}`, style: "totalValueBold" }
                  ],
                  ],
                },
                layout: "noBorders",
              },
            ],
            margin: [0, 0, 0, 20]
          },

          // Informazioni aggiuntive
          ...(ddt.departure_time || ddt.arrival_time ? [{
            columns: [
              ...(ddt.departure_time ? [{
                text: [
                  { text: "Ora Partenza: ", style: "infoLabel" },
                  { text: ddt.departure_time, style: "infoValue" }
                ]
              }] : []),
              ...(ddt.arrival_time ? [{
                text: [
                  { text: "Ora Arrivo: ", style: "infoLabel" },
                  { text: ddt.arrival_time, style: "infoValue" }
                ]
              }] : [])
            ],
            margin: [0, 0, 0, 10]
          }] : []),

          // Note di consegna
          ...(ddt.delivery_notes ? [{
            text: [
              { text: "Note di Consegna: ", style: "infoLabel" },
              { text: ddt.delivery_notes, style: "infoValue" }
            ],
            margin: [0, 0, 0, 20]
          }] : []),

          // Spazio per firme
          {
            columns: [
              {
                text: "Firma Autista",
                style: "signatureLabel",
                alignment: 'center'
              },
              {
                text: "Firma Destinatario",
                style: "signatureLabel",
                alignment: 'center'
              }
            ],
            margin: [0, 30, 0, 0]
          },
          {
            columns: [
              {
                canvas: [{ type: 'line', x1: 0, y1: 0, x2: 150, y2: 0, lineWidth: 1 }],
                alignment: 'center'
              },
              {
                canvas: [{ type: 'line', x1: 0, y1: 0, x2: 150, y2: 0, lineWidth: 1 }],
                alignment: 'center'
              }
            ],
            margin: [0, 5, 0, 0]
          }
        ],
        styles: {
          title: { 
            fontSize: 18, 
            bold: true, 
            color: '#2c3e50'
          },
          companyName: { 
            fontSize: 14, 
            bold: true, 
            color: '#2c3e50',
            margin: [0, 0, 0, 5]
          },
          companyInfo: { 
            fontSize: 9, 
            color: '#34495e',
            margin: [0, 0, 0, 2]
          },
          documentNumber: { 
            fontSize: 12, 
            bold: true, 
            color: '#2c3e50',
            alignment: 'right',
            margin: [0, 0, 0, 5]
          },
          documentInfo: { 
            fontSize: 9, 
            color: '#34495e',
            alignment: 'right',
            margin: [0, 0, 0, 2]
          },
          sectionTitle: { 
            fontSize: 11, 
            bold: true, 
            color: '#2c3e50',
            margin: [0, 0, 0, 5]
          },
          sectionContent: { 
            fontSize: 9, 
            color: '#34495e',
            margin: [0, 0, 0, 2]
          },
          sectionLabel: { 
            fontSize: 8, 
            color: '#7f8c8d',
            margin: [0, 5, 0, 2]
          },
          tableHeader: { 
            fontSize: 8, 
            bold: true, 
            color: '#2c3e50',
            alignment: 'center'
          },
          tableCell: { 
            fontSize: 8, 
            color: '#34495e',
            alignment: 'center'
          },
          totalLabel: { 
            fontSize: 9, 
            color: '#2c3e50'
          },
          totalValue: { 
            fontSize: 9, 
            bold: true, 
            color: '#2c3e50',
            alignment: 'right'
          },
          totalLabelBold: { 
            fontSize: 10, 
            bold: true, 
            color: '#2c3e50'
          },
          totalValueBold: { 
            fontSize: 10, 
            bold: true, 
            color: '#2c3e50',
            alignment: 'right'
          },
          infoLabel: { 
            fontSize: 9, 
            bold: true, 
            color: '#2c3e50'
          },
          infoValue: { 
            fontSize: 9, 
            color: '#34495e'
          },
          signatureLabel: { 
            fontSize: 9, 
            color: '#7f8c8d'
          }
        }
      };

      console.log('Definizione documento creata, generazione PDF...');
      
      (pdfMake as any)
        .createPdf(docDefinition)
        .download(`DDT_${ddt.document_id}_${new Date(ddt.date).toISOString().split('T')[0]}.pdf`);
        
      console.log('PDF generato con successo!');
    } catch (error) {
      console.error('Errore nella generazione del PDF:', error);
      alert('Errore nella generazione del PDF. Controlla la console per i dettagli.');
    }
  }

  console.log(filteredDDTs[0].DDT_id);

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
            onSelectionChange={(keys) =>
              setStatusFilter(Array.from(keys)[0] as string)
            }
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
                <TableRow key={ddt.DDT_id}>
                  <TableCell>
                    <div className="font-medium">{ddt.document_id}</div>
                  </TableCell>
                  <TableCell>
                    {new Date(ddt.date).toLocaleDateString("it-IT")}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{ddt.name}</div>
                      <div className="text-sm text-default-500">
                        {ddt.license_plate}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{ddt.customer_name}</div>
                      {ddt.customer_phone && (
                        <div className="text-sm text-default-500">
                          {ddt.customer_phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div
                      className="max-w-48 truncate"
                      title={ddt.destination_address}
                    >
                      {ddt.destination_address}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{ddt.total_weight} kg</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">€{ddt.total_value}</div>
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
                          <Button isIconOnly size="sm" variant="light">
                            <Icon icon="solar:menu-dots-bold" width={16} />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu>
                          <DropdownItem
                            key="pdf"
                            startContent={
                              <Icon icon="solar:file-text-bold" width={16} />
                            }
                            onPress={() => generateDDTPdf(ddt)}
                          >
                            Genera PDF
                          </DropdownItem>
                          {ddt.status === "draft" ? (
                            <DropdownItem
                              key="confirm"
                              startContent={
                                <Icon
                                  icon="solar:check-circle-bold"
                                  width={16}
                                />
                              }
                              onPress={() =>
                                updateDDTStatus(ddt.DDT_id, "confirmed")
                              }
                            >
                              Conferma
                            </DropdownItem>
                          ) : null}
                          {ddt.status === "confirmed" ? (
                            <DropdownItem
                              key="transit"
                              startContent={
                                <Icon icon="solar:delivery-bold" width={16} />
                              }
                              onPress={() =>
                                updateDDTStatus(ddt.DDT_id, "in_transit")
                              }
                            >
                              Avvia Trasporto
                            </DropdownItem>
                          ) : null}
                          {ddt.status === "in_transit" ? (
                            <DropdownItem
                              key="deliver"
                              startContent={
                                <Icon
                                  icon="solar:check-square-bold"
                                  width={16}
                                />
                              }
                              onPress={() =>
                                updateDDTStatus(ddt.DDT_id, "delivered")
                              }
                            >
                              Segna Consegnato
                            </DropdownItem>
                          ) : null}
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
            <h3 className="text-xl font-semibold">
              Nuovo Documento di Trasporto
            </h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DatePicker
                  label="Data DDT"
                  value={
                    newDDT.date
                      ? (parseDate(newDDT.date) as any)
                      : (today(getLocalTimeZone()) as any)
                  }
                  onChange={(date: any) => {
                    if (date) {
                      const dateString = `${date.year}-${String(
                        date.month
                      ).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
                      setNewDDT((prev) => ({ ...prev, date: dateString }));
                    }
                  }}
                />

                <Select
                  label="Veicolo"
                  placeholder="Seleziona veicolo"
                  selectedKeys={
                    newDDT.vehicle_id ? new Set([newDDT.vehicle_id]) : new Set()
                  }
                  renderValue={() => {
                    const selectedVehicle = vehicles.find(
                      (v) => v.vehicle_id === newDDT.vehicle_id
                    );
                    return selectedVehicle ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-small">
                            {selectedVehicle.name} -{" "}
                            {selectedVehicle.license_plate}
                          </span>
                        </div>
                      </div>
                    ) : null;
                  }}
                  onSelectionChange={(keys) => {
                    const vehicleId = Array.from(keys)[0] as string;
                    const vehicle = vehicles.find(
                      (v) => v.vehicle_id === vehicleId
                    );
                    setNewDDT((prev) => ({
                      ...prev,
                      vehicle_id: vehicleId,
                      name: vehicle?.name || "",
                      license_plate: vehicle?.license_plate || "",
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
                  onChange={(e) =>
                    setNewDDT((prev) => ({
                      ...prev,
                      driver_name: e.target.value,
                    }))
                  }
                />

                <Input
                  label="Telefono Autista"
                  value={newDDT.driver_phone || ""}
                  onChange={(e) =>
                    setNewDDT((prev) => ({
                      ...prev,
                      driver_phone: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Customer Information */}
              <Divider />
              <h4 className="text-lg font-medium">Informazioni Cliente</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nome Cliente"
                  value={newDDT.customer_name || ""}
                  onChange={(e) =>
                    setNewDDT((prev) => ({
                      ...prev,
                      customer_name: e.target.value,
                    }))
                  }
                />

                <Input
                  label="Partita IVA"
                  value={newDDT.customer_vat || ""}
                  onChange={(e) =>
                    setNewDDT((prev) => ({
                      ...prev,
                      customer_vat: e.target.value,
                    }))
                  }
                />
              </div>

              <Input
                label="Telefono Cliente"
                value={newDDT.customer_phone || ""}
                onChange={(e) =>
                  setNewDDT((prev) => ({
                    ...prev,
                    customer_phone: e.target.value,
                  }))
                }
              />

              {/* Addresses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Textarea
                  label="Indirizzo di Partenza"
                  value={newDDT.departure_address || ""}
                  onChange={(e) =>
                    setNewDDT((prev) => ({
                      ...prev,
                      departure_address: e.target.value,
                    }))
                  }
                />

                <Textarea
                  label="Indirizzo di Destinazione"
                  value={newDDT.destination_address || ""}
                  onChange={(e) =>
                    setNewDDT((prev) => ({
                      ...prev,
                      destination_address: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Products */}
              <Divider />
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-medium">Prodotti da Trasportare</h4>
                <Button
                  color="primary"
                  variant="flat"
                  startContent={
                    <Icon icon="solar:add-circle-bold" width={16} />
                  }
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
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.sku}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.weight * item.quantity} kg</TableCell>
                        <TableCell>€{item.unit_price}</TableCell>
                        <TableCell>€{item.total_price}</TableCell>
                        <TableCell>
                          <Button
                            isIconOnly
                            size="sm"
                            color="danger"
                            variant="light"
                            onPress={() => removeProductFromDDT(index)}
                          >
                            <Icon
                              icon="solar:trash-bin-minimalistic-bold"
                              width={16}
                            />
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
                      {ddtItems.reduce(
                        (sum, item) => sum + item.weight * item.quantity,
                        0
                      )}{" "}
                      kg
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valore Totale:</span>
                    <span className="font-medium">
                      €
                      {ddtItems.reduce(
                        (sum, item) => sum + item.total_price,
                        0
                      )}
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
              isDisabled={
                !newDDT.vehicle_id ||
                !newDDT.customer_name ||
                ddtItems.length === 0
              }
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
                  <h3 className="text-xl font-semibold">
                    {selectedDDT.document_id}
                  </h3>
                  <Chip color={statusColors[selectedDDT.status]} variant="flat">
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
                      <p className="font-medium">
                        {new Date(selectedDDT.date).toLocaleDateString("it-IT")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-default-500">Veicolo</p>
                      <p className="font-medium">
                        {selectedDDT.name} - {selectedDDT.license_plate}
                      </p>
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
                        <p className="text-sm text-default-500">
                          Telefono Autista
                        </p>
                        <p className="font-medium">
                          {selectedDDT.driver_phone}
                        </p>
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
                        <p className="font-medium">
                          {selectedDDT.customer_vat}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Addresses */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-default-500">Partenza</p>
                      <p className="font-medium">
                        {selectedDDT.departure_address}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-default-500">Destinazione</p>
                      <p className="font-medium">
                        {selectedDDT.destination_address}
                      </p>
                    </div>
                  </div>

                  {/* Items */}
                  {selectedDDT.items && (
                    <>
                      <Divider />
                      <h4 className="text-lg font-medium">
                        Prodotti Trasportati
                      </h4>
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
                              <TableCell>{item.name}</TableCell>
                              <TableCell>{item.sku}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>
                                {item.weight * item.quantity} kg
                              </TableCell>
                              <TableCell>€{item.total_price}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {/* Totals */}
                      <div className="bg-default-100 p-4 rounded-lg">
                        <div className="flex justify-between">
                          <span>Peso Totale:</span>
                          <span className="font-medium">
                            {selectedDDT.items.reduce(
                              (sum, item) => sum + item.weight * item.quantity,
                              0
                            )}{" "}
                            kg
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Valore Totale:</span>
                          <span className="font-medium">
                            €
                            {selectedDDT.items.reduce(
                              (sum, item) => sum + item.total_price,
                              0
                            )}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Times */}
                  {(selectedDDT.departure_time || selectedDDT.arrival_time) && (
                    <>
                      <Divider />
                      <div className="grid grid-cols-2 gap-4">
                        {selectedDDT.departure_time && (
                          <div>
                            <p className="text-sm text-default-500">
                              Ora Partenza
                            </p>
                            <p className="font-medium">
                              {selectedDDT.departure_time}
                            </p>
                          </div>
                        )}
                        {selectedDDT.arrival_time && (
                          <div>
                            <p className="text-sm text-default-500">
                              Ora Arrivo
                            </p>
                            <p className="font-medium">
                              {selectedDDT.arrival_time}
                            </p>
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
                        <p className="text-sm text-default-500">
                          Note Consegna
                        </p>
                        <p className="font-medium">
                          {selectedDDT.delivery_notes}
                        </p>
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
                  onPress={() => generateDDTPdf(selectedDDT)}
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
        categories={categories}
        onConfirm={handleProductsSelection}
        vehicleCapacity={
          newDDT.vehicle_id
            ? vehicles.find((v) => v.vehicle_id === newDDT.vehicle_id)?.capacity
            : undefined
        }
      />
    </div>
  );
}
