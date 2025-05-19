import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Chip,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  useDisclosure,
  Tooltip,
  Badge,
  Tabs,
  Tab,
  Select,
  SelectItem,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import axios from "axios";

// Interfaccia per i fornitori
interface Supplier {
  supplier_id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  contact_person: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

// Interfaccia per i prodotti
interface Product {
  product_id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  stock_quantity: number;
  minimum_stock: number;
  supplier_id: string;
  supplier_name?: string;
  category_id: string;
  category_name?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

// Interfaccia per l'email
interface EmailTemplate {
  subject: string;
  body: string;
  recipient: string;
  cc?: string;
  products?: Product[];
}

// Interfaccia per il modello di email salvato
interface SavedEmailTemplate {
  template_id: string;
  name: string;
  subject: string;
  body: string;
  created_at: string;
  updated_at: string;
  is_default: boolean;
}

// Interfaccia per gli ordini
interface Order {
  order_id: string;
  supplier_id: string;
  supplier_name?: string;
  order_number: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  order_date: string;
  expected_delivery_date: string | null;
  delivery_date: string | null;
  total_amount: number;
  items: OrderItem[];
  notes: string;
  tracking_number?: string;
  tracking_url?: string;
  created_at: string;
  updated_at: string;
}

// Interfaccia per gli elementi dell'ordine
interface OrderItem {
  item_id: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

// Stato dell'ordine
type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

const Suppliers: React.FC = () => {
  // Stati
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("suppliers");
  const [orderTab, setOrderTab] = useState("incoming");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [emailTemplate, setEmailTemplate] = useState<EmailTemplate>({
    subject: "Richiesta rifornimento prodotti",
    body: "",
    recipient: "",
  });
  
  // Stato per i modelli di email salvati
  const [savedTemplates, setSavedTemplates] = useState<SavedEmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<SavedEmailTemplate | null>(null);
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");

  // Stati per i modali
  const {
    isOpen: isEmailModalOpen,
    onOpen: onOpenEmailModal,
    onClose: onCloseEmailModal,
  } = useDisclosure();
  const {
    isOpen: isAddSupplierModalOpen,
    onOpen: onOpenAddSupplierModal,
    onClose: onCloseAddSupplierModal,
  } = useDisclosure();
  const {
    isOpen: isTemplateModalOpen,
    onOpen: onOpenTemplateModal,
    onClose: onCloseTemplateModal,
  } = useDisclosure();
  
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
    name: "",
    email: "",
    phone: "",
    address: "",
    contact_person: "",
    notes: "",
  });
  
  const [newTemplate, setNewTemplate] = useState<Partial<SavedEmailTemplate>>({
    name: "",
    subject: "",
    body: "",
    is_default: false,
  });
  
  const [editingTemplate, setEditingTemplate] = useState<SavedEmailTemplate | null>(null);

  // Stato per il messaggio di successo
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Caricamento dati
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Carico i fornitori
        const suppliersResponse = await axios.get("/Supplier/GET/GetAllSuppliers");
        setSuppliers(suppliersResponse.data || []);

        // Carico i prodotti con scorte basse
        const productsResponse = await axios.get("/Product/GET/GetLowStockProducts");
        
        // Aggiungo il nome del fornitore ai prodotti
        const productsWithSuppliers = await Promise.all(
          (productsResponse.data || []).map(async (product: Product) => {
            if (product.supplier_id) {
              const supplierData = suppliersResponse.data.find(
                (s: Supplier) => s.supplier_id === product.supplier_id
              );
              return {
                ...product,
                supplier_name: supplierData ? supplierData.name : "Fornitore sconosciuto",
              };
            }
            return product;
          })
        );
        
        setLowStockProducts(productsWithSuppliers);
        
        // Carico i modelli di email
        try {
          const templatesResponse = await axios.get("/Supplier/GET/GetEmailTemplates");
          setSavedTemplates(templatesResponse.data || []);
          
          // Imposta il modello predefinito, se esiste
          const defaultTemplate = templatesResponse.data.find((t: SavedEmailTemplate) => t.is_default);
          if (defaultTemplate) {
            setSelectedTemplate(defaultTemplate);
          }
        } catch (error) {
          console.error("Errore durante il caricamento dei modelli di email:", error);
          // Se l'API non esiste ancora, usiamo dati di esempio
          const mockTemplates: SavedEmailTemplate[] = [
            {
              template_id: "1",
              name: "Richiesta standard",
              subject: "Richiesta rifornimento prodotti",
              body: `Gentile {fornitore},

In seguito al controllo dell'inventario, vi comunichiamo che i seguenti prodotti richiedono un rifornimento:

{lista_prodotti}

Vi preghiamo di inviarci un preventivo per questi articoli con i relativi tempi di consegna.

Cordiali saluti,
{nome_azienda}
{contatti}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              is_default: true
            },
            {
              template_id: "2",
              name: "Richiesta urgente",
              subject: "URGENTE: Richiesta immediata di rifornimento",
              body: `Gentile {fornitore},

Vi contattiamo per una RICHIESTA URGENTE di rifornimento dei seguenti prodotti, le cui scorte sono terminate o criticamente basse:

{lista_prodotti}

Data l'urgenza della situazione, vi chiediamo cortesemente di confermare la disponibilità e i tempi di consegna nel più breve tempo possibile.

Restiamo in attesa di un vostro riscontro.

Cordiali saluti,
{nome_azienda}
{contatti}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              is_default: false
            }
          ];
          setSavedTemplates(mockTemplates);
          setSelectedTemplate(mockTemplates[0]);
        }

        // Carico gli ordini
        try {
          const ordersResponse = await axios.get("/Order/GET/GetAllOrders");
          setOrders(ordersResponse.data || []);
        } catch (error) {
          console.error("Errore durante il caricamento degli ordini:", error);
          // Se l'API non esiste ancora, creo dati di esempio
          const mockOrders: Order[] = [
            {
              order_id: "1",
              supplier_id: "1",
              supplier_name: "Elettronica SpA",
              order_number: "ORD-2023-001",
              status: "shipped",
              order_date: "2023-10-15T10:30:00.000Z",
              expected_delivery_date: "2023-10-25T00:00:00.000Z",
              delivery_date: null,
              total_amount: 2580.50,
              items: [
                {
                  item_id: "1",
                  product_id: "101",
                  product_name: "Sensore di prossimità",
                  sku: "SEN-PRX-001",
                  quantity: 10,
                  unit_price: 45.50,
                  total_price: 455.00
                },
                {
                  item_id: "2",
                  product_id: "102",
                  product_name: "Modulo GPS",
                  sku: "MOD-GPS-002",
                  quantity: 5,
                  unit_price: 85.10,
                  total_price: 425.50
                },
                {
                  item_id: "3",
                  product_id: "103",
                  product_name: "Batteria 5000mAh",
                  sku: "BAT-5000-003",
                  quantity: 20,
                  unit_price: 85.00,
                  total_price: 1700.00
                }
              ],
              notes: "Consegna presso magazzino centrale",
              tracking_number: "TRK12345678",
              tracking_url: "https://tracking.example.com/TRK12345678",
              created_at: "2023-10-15T10:30:00.000Z",
              updated_at: "2023-10-17T14:45:00.000Z"
            },
            {
              order_id: "2",
              supplier_id: "2",
              supplier_name: "Meccanica Italiana",
              order_number: "ORD-2023-002",
              status: "delivered",
              order_date: "2023-09-20T09:15:00.000Z",
              expected_delivery_date: "2023-09-30T00:00:00.000Z",
              delivery_date: "2023-09-28T11:20:00.000Z",
              total_amount: 3650.75,
              items: [
                {
                  item_id: "4",
                  product_id: "201",
                  product_name: "Cuscinetto a sfera",
                  sku: "CSF-001",
                  quantity: 50,
                  unit_price: 12.50,
                  total_price: 625.00
                },
                {
                  item_id: "5",
                  product_id: "202",
                  product_name: "Supporto metallico",
                  sku: "SUP-MET-002",
                  quantity: 15,
                  unit_price: 49.85,
                  total_price: 747.75
                },
                {
                  item_id: "6",
                  product_id: "203",
                  product_name: "Telaio in alluminio",
                  sku: "TEL-ALU-003",
                  quantity: 5,
                  unit_price: 455.60,
                  total_price: 2278.00
                }
              ],
              notes: "Ordine completato e ricevuto in magazzino",
              created_at: "2023-09-20T09:15:00.000Z",
              updated_at: "2023-09-28T11:20:00.000Z"
            },
            {
              order_id: "3",
              supplier_id: "1",
              supplier_name: "Elettronica SpA",
              order_number: "ORD-2023-003",
              status: "pending",
              order_date: "2023-10-22T14:05:00.000Z",
              expected_delivery_date: "2023-11-05T00:00:00.000Z",
              delivery_date: null,
              total_amount: 1830.00,
              items: [
                {
                  item_id: "7",
                  product_id: "104",
                  product_name: "Scheda di controllo",
                  sku: "SCH-CTR-004",
                  quantity: 3,
                  unit_price: 310.00,
                  total_price: 930.00
                },
                {
                  item_id: "8",
                  product_id: "105",
                  product_name: "Display LCD 5\"",
                  sku: "DISP-LCD-005",
                  quantity: 6,
                  unit_price: 150.00,
                  total_price: 900.00
                }
              ],
              notes: "Ordine in attesa di conferma",
              created_at: "2023-10-22T14:05:00.000Z",
              updated_at: "2023-10-22T14:05:00.000Z"
            }
          ];
          
          setOrders(mockOrders);
        }
      } catch (error) {
        console.error("Errore durante il caricamento dei dati:", error);
        setErrorMessage("Si è verificato un errore durante il caricamento dei dati");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtraggio dei fornitori in base al termine di ricerca
  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.contact_person.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtraggio dei prodotti con scorte basse in base al termine di ricerca
  const filteredLowStockProducts = lowStockProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.supplier_name &&
        product.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Raggruppa i prodotti per fornitore
  const productsBySupplier = filteredLowStockProducts.reduce(
    (acc, product) => {
      const supplierId = product.supplier_id || "unknown";
      if (!acc[supplierId]) {
        acc[supplierId] = [];
      }
      acc[supplierId].push(product);
      return acc;
    },
    {} as Record<string, Product[]>
  );

  // Gestione dell'apertura del form email con il modello selezionato
  const handleOpenEmailForm = (supplier: Supplier, products: Product[]) => {
    setSelectedSupplier(supplier);
    setSelectedProducts(products);
    
    // Prepara il corpo dell'email con la lista dei prodotti
    const productList = products
      .map(
        (p) =>
          `- ${p.name} (SKU: ${p.sku}): ${p.stock_quantity} rimasti (minimo richiesto: ${p.minimum_stock})`
      )
      .join("\n");
    
    // Usa il modello selezionato o quello predefinito
    let templateSubject = "Richiesta rifornimento prodotti";
    let templateBody = `Gentile ${supplier.name},

In seguito al controllo dell'inventario, vi comunichiamo che i seguenti prodotti richiedono un rifornimento:

${productList}

Vi preghiamo di inviarci un preventivo per questi articoli con i relativi tempi di consegna.

Cordiali saluti,
[Il tuo nome]
[Nome azienda]
[Contatti]`;

    // Se c'è un modello selezionato, usalo
    if (selectedTemplate) {
      templateSubject = selectedTemplate.subject;
      templateBody = selectedTemplate.body
        .replace("{fornitore}", supplier.name)
        .replace("{lista_prodotti}", productList)
        .replace("{nome_azienda}", "[Nome azienda]")
        .replace("{contatti}", "[Contatti]");
    }

    setEmailTemplate({
      subject: templateSubject,
      body: templateBody,
      recipient: supplier.email,
    });
    
    onOpenEmailModal();
  };

  // Invio email
  const handleSendEmail = async () => {
    try {
      // Invio dell'email
      await axios.post("/Supplier/POST/SendSupplierEmail", {
        recipient: emailTemplate.recipient,
        cc: emailTemplate.cc,
        subject: emailTemplate.subject,
        body: emailTemplate.body,
        supplier_id: selectedSupplier?.supplier_id,
        products: selectedProducts.map(p => p.product_id),
      });
      
      // Chiusura del modale e visualizzazione messaggio di successo
      onCloseEmailModal();
      setSuccessMessage("Email inviata con successo al fornitore");
      
      // Nascondi il messaggio dopo 5 secondi
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (error) {
      console.error("Errore durante l'invio dell'email:", error);
      setErrorMessage("Si è verificato un errore durante l'invio dell'email");
      
      // Nascondi il messaggio dopo 5 secondi
      setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
    }
  };

  // Aggiunta di un nuovo fornitore
  const handleAddSupplier = async () => {
    try {
      await axios.post("/Supplier/POST/AddSupplier", newSupplier);
      
      // Aggiorna la lista dei fornitori
      const suppliersResponse = await axios.get("/Supplier/GET/GetAllSuppliers");
      setSuppliers(suppliersResponse.data || []);
      
      // Chiudi il modale e mostra il messaggio di successo
      onCloseAddSupplierModal();
      setSuccessMessage("Fornitore aggiunto con successo");
      
      // Resetta il form
      setNewSupplier({
        name: "",
        email: "",
        phone: "",
        address: "",
        contact_person: "",
        notes: "",
      });
      
      // Nascondi il messaggio dopo 5 secondi
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (error) {
      console.error("Errore durante l'aggiunta del fornitore:", error);
      setErrorMessage("Si è verificato un errore durante l'aggiunta del fornitore");
      
      // Nascondi il messaggio dopo 5 secondi
      setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
    }
  };

  // Aggiornamento del form nuovo fornitore
  const handleNewSupplierChange = (field: string, value: string) => {
    setNewSupplier((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Controllo email automatica per tutti i fornitori con prodotti a bassa giacenza
  const handleSendAllEmails = async () => {
    let successCount = 0;
    let errorCount = 0;
    
    // Per ogni fornitore con prodotti a bassa giacenza
    for (const supplierId in productsBySupplier) {
      if (supplierId === "unknown") continue; // Salta i prodotti senza fornitore
      
      const supplier = suppliers.find(s => s.supplier_id === supplierId);
      if (!supplier) continue;
      
      const products = productsBySupplier[supplierId];
      
      // Prepara il corpo dell'email
      const productList = products
        .map(
          (p) =>
            `- ${p.name} (SKU: ${p.sku}): ${p.stock_quantity} rimasti (minimo richiesto: ${p.minimum_stock})`
        )
        .join("\n");
      
      const emailBody = `Gentile ${supplier.name},

In seguito al controllo dell'inventario, vi comunichiamo che i seguenti prodotti richiedono un rifornimento:

${productList}

Vi preghiamo di inviarci un preventivo per questi articoli con i relativi tempi di consegna.

Cordiali saluti,
[Il tuo nome]
[Nome azienda]
[Contatti]`;

      try {
        // Invio dell'email
        await axios.post("/Supplier/POST/SendSupplierEmail", {
          recipient: supplier.email,
          subject: `Richiesta rifornimento prodotti - ${new Date().toLocaleDateString()}`,
          body: emailBody,
          supplier_id: supplier.supplier_id,
          products: products.map(p => p.product_id),
        });
        
        successCount++;
      } catch (error) {
        console.error(`Errore durante l'invio dell'email a ${supplier.name}:`, error);
        errorCount++;
      }
    }
    
    if (successCount > 0) {
      setSuccessMessage(`Email inviate con successo a ${successCount} fornitori${errorCount > 0 ? ` (${errorCount} errori)` : ''}`);
    } else if (errorCount > 0) {
      setErrorMessage(`Si sono verificati errori durante l'invio delle email (${errorCount} errori)`);
    }
    
    // Nascondi il messaggio dopo 5 secondi
    setTimeout(() => {
      setSuccessMessage(null);
      setErrorMessage(null);
    }, 5000);
  };

  // Filtro per i modelli di email
  const filteredTemplates = savedTemplates.filter(
    (template) =>
      template.name.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
      template.subject.toLowerCase().includes(templateSearchQuery.toLowerCase())
  );

  // Gestione del nuovo modello di email
  const handleAddTemplate = async () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.body) {
      setErrorMessage("Tutti i campi sono obbligatori");
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    try {
      // Chiamata API per salvare il nuovo modello
      const response = await axios.post("/Supplier/POST/AddEmailTemplate", newTemplate);
      
      // Se il backend non è pronto, simula una risposta
      const newTemplateWithId: SavedEmailTemplate = {
        ...newTemplate as SavedEmailTemplate,
        template_id: response?.data?.template_id || Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_default: newTemplate.is_default || false,
      };
      
      // Aggiorna i modelli salvati
      setSavedTemplates((prev) => [...prev, newTemplateWithId]);
      
      // Se il nuovo modello è impostato come predefinito, aggiorna gli altri
      if (newTemplate.is_default) {
        setSavedTemplates((prev) =>
          prev.map((t) => ({
            ...t,
            is_default: t.template_id === newTemplateWithId.template_id,
          }))
        );
        setSelectedTemplate(newTemplateWithId);
      }
      
      // Resetta il form e chiudi il modale
      setNewTemplate({
        name: "",
        subject: "",
        body: "",
        is_default: false,
      });
      
      onCloseTemplateModal();
      setSuccessMessage("Modello di email creato con successo");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Errore durante il salvataggio del modello di email:", error);
      setErrorMessage("Si è verificato un errore durante il salvataggio del modello");
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Gestione dell'aggiornamento modello
  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !editingTemplate.name || !editingTemplate.subject || !editingTemplate.body) {
      setErrorMessage("Tutti i campi sono obbligatori");
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    try {
      // Chiamata API per aggiornare il modello
      await axios.put(`/Supplier/PUT/UpdateEmailTemplate/${editingTemplate.template_id}`, editingTemplate);
      
      // Aggiorna i modelli salvati
      setSavedTemplates((prev) =>
        prev.map((t) =>
          t.template_id === editingTemplate.template_id
            ? { ...editingTemplate, updated_at: new Date().toISOString() }
            : editingTemplate.is_default
            ? { ...t, is_default: false }
            : t
        )
      );
      
      // Se il modello modificato è quello selezionato, aggiorna la selezione
      if (selectedTemplate && selectedTemplate.template_id === editingTemplate.template_id) {
        setSelectedTemplate({ ...editingTemplate, updated_at: new Date().toISOString() });
      }
      
      // Se il modello è impostato come predefinito, aggiorna gli altri
      if (editingTemplate.is_default) {
        setSelectedTemplate({ ...editingTemplate, updated_at: new Date().toISOString() });
      }
      
      // Resetta lo stato e chiudi il modale
      setEditingTemplate(null);
      onCloseTemplateModal();
      setSuccessMessage("Modello di email aggiornato con successo");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Errore durante l'aggiornamento del modello di email:", error);
      setErrorMessage("Si è verificato un errore durante l'aggiornamento del modello");
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Gestione dell'eliminazione del modello
  const handleDeleteTemplate = async (template: SavedEmailTemplate) => {
    if (template.is_default) {
      setErrorMessage("Non è possibile eliminare il modello predefinito");
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    const confirm = window.confirm(`Sei sicuro di voler eliminare il modello "${template.name}"?`);
    if (!confirm) return;

    try {
      // Chiamata API per eliminare il modello
      await axios.delete(`/Supplier/DELETE/DeleteEmailTemplate/${template.template_id}`);
      
      // Aggiorna i modelli salvati
      setSavedTemplates((prev) => prev.filter((t) => t.template_id !== template.template_id));
      
      // Se il modello eliminato è quello selezionato, resetta la selezione
      if (selectedTemplate && selectedTemplate.template_id === template.template_id) {
        const defaultTemplate = savedTemplates.find((t) => t.is_default);
        setSelectedTemplate(defaultTemplate || null);
      }
      
      setSuccessMessage("Modello di email eliminato con successo");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Errore durante l'eliminazione del modello di email:", error);
      setErrorMessage("Si è verificato un errore durante l'eliminazione del modello");
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Gestione dell'impostazione del modello predefinito
  const handleSetDefaultTemplate = async (template: SavedEmailTemplate) => {
    if (template.is_default) return;

    try {
      // Chiamata API per impostare il modello predefinito
      await axios.put(`/Supplier/PUT/SetDefaultEmailTemplate/${template.template_id}`);
      
      // Aggiorna i modelli salvati
      setSavedTemplates((prev) =>
        prev.map((t) => ({
          ...t,
          is_default: t.template_id === template.template_id,
        }))
      );
      
      // Aggiorna il modello selezionato
      setSelectedTemplate({ ...template, is_default: true });
      
      setSuccessMessage(`Modello "${template.name}" impostato come predefinito`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Errore durante l'impostazione del modello predefinito:", error);
      setErrorMessage("Si è verificato un errore durante l'impostazione del modello predefinito");
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Filtro per gli ordini
  const filteredOrders = orders.filter(order => {
    // Filtra per query di ricerca
    const matchesSearch = 
      (order.order_number.toLowerCase().includes(orderSearchQuery.toLowerCase())) ||
      (order.supplier_name && order.supplier_name.toLowerCase().includes(orderSearchQuery.toLowerCase())) ||
      (order.items.some(item => 
        item.product_name.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(orderSearchQuery.toLowerCase())
      ));
      
    // Filtra per stato
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    // Filtra per tipo di ordine (in arrivo o consegnati)
    const isIncoming = ["pending", "confirmed", "shipped"].includes(order.status);
    const matchesOrderTab = 
      (orderTab === "incoming" && isIncoming) || 
      (orderTab === "completed" && !isIncoming);
    
    return matchesSearch && matchesStatus && matchesOrderTab;
  });

  // Calcolo statistiche ordini
  const orderStats = {
    pending: orders.filter(o => o.status === "pending").length,
    confirmed: orders.filter(o => o.status === "confirmed").length,
    shipped: orders.filter(o => o.status === "shipped").length,
    delivered: orders.filter(o => o.status === "delivered").length,
    cancelled: orders.filter(o => o.status === "cancelled").length,
    total: orders.length,
    totalValue: orders.reduce((sum, order) => sum + order.total_amount, 0)
  };

  // Formatta la data
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Formatta il prezzo
  const formatPrice = (price: number) => {
    return price.toLocaleString("it-IT", {
      style: "currency",
      currency: "EUR",
    });
  };

  // Ottieni colore in base allo stato dell'ordine
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "pending": return "warning";
      case "confirmed": return "primary";
      case "shipped": return "secondary";
      case "delivered": return "success";
      case "cancelled": return "danger";
      default: return "default";
    }
  };

  // Ottieni etichetta in base allo stato dell'ordine
  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case "pending": return "In attesa";
      case "confirmed": return "Confermato";
      case "shipped": return "Spedito";
      case "delivered": return "Consegnato";
      case "cancelled": return "Annullato";
      default: return status;
    }
  };

  // Aggiorna lo stato dell'ordine
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await axios.put(`/Order/PUT/UpdateOrderStatus/${orderId}`, { status: newStatus });
      
      // Aggiorna l'ordine nella lista
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.order_id === orderId 
            ? { ...order, status: newStatus, updated_at: new Date().toISOString() } 
            : order
        )
      );
      
      setSuccessMessage(`Stato dell'ordine aggiornato a "${getStatusLabel(newStatus)}"`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Errore durante l'aggiornamento dello stato:", error);
      setErrorMessage("Si è verificato un errore durante l'aggiornamento dello stato");
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center">
          <Icon
            icon="solar:spinner-outline"
            className="animate-spin"
            width={48}
          />
          <p className="mt-4">Caricamento in corso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col w-full p-4 gap-6">
      {/* Header con titolo e miglioramenti estetici */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon
              icon="solar:truck-bold"
              className="text-primary"
              width={28}
            />
          </div>
          <h1 className="text-2xl font-bold">Gestione Fornitori</h1>
        </div>
      </div>

      {/* Messaggi di successo o errore con animazione migliorata */}
      {successMessage && (
        <div className="mb-4 rounded-md bg-success-100 p-4 text-success-700 animate-fadeInDown">
          <div className="flex items-center">
            <Icon icon="solar:check-circle-bold" className="mr-2" width={20} />
            <p>{successMessage}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 rounded-md bg-danger-100 p-4 text-danger-700 animate-fadeInDown">
          <div className="flex items-center">
            <Icon icon="solar:danger-triangle-bold" className="mr-2" width={20} />
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Tabs e controlli */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <Tabs 
            selectedKey={selectedTab} 
            onSelectionChange={setSelectedTab as any}
            color="primary"
            variant="underlined"
            size="lg"
            className="w-full md:w-auto"
          >
            <Tab 
              key="suppliers" 
              title={
                <div className="flex items-center gap-2">
                  <Icon icon="solar:users-group-rounded-bold" width={18} />
                  <span>Fornitori</span>
                </div>
              } 
            />
            <Tab 
              key="lowStock" 
              title={
                <div className="flex items-center gap-2">
                  <Icon icon="solar:box-minimalistic-bold" width={18} />
                  <span>Scorte Basse</span>
                </div>
              } 
            />
            <Tab 
              key="orders" 
              title={
                <div className="flex items-center gap-2">
                  <Icon icon="solar:document-text-bold" width={18} />
                  <span>Ordini</span>
                </div>
              } 
            />
            <Tab 
              key="templates" 
              title={
                <div className="flex items-center gap-2">
                  <Icon icon="solar:letter-bold" width={18} />
                  <span>Modelli Email</span>
                </div>
              } 
            />
          </Tabs>

          <div className="flex items-center gap-2">
            <Input
              placeholder="Cerca..."
              value={
                selectedTab === "templates" 
                  ? templateSearchQuery 
                  : selectedTab === "orders"
                  ? orderSearchQuery
                  : searchQuery
              }
              onChange={(e) => {
                if (selectedTab === "templates") {
                  setTemplateSearchQuery(e.target.value);
                } else if (selectedTab === "orders") {
                  setOrderSearchQuery(e.target.value);
                } else {
                  setSearchQuery(e.target.value);
                }
              }}
              size="sm"
              startContent={
                <Icon icon="solar:magnifer-linear" className="text-default-400" />
              }
              className="w-64"
            />
            {selectedTab === "suppliers" ? (
              <Button 
                color="primary" 
                onPress={onOpenAddSupplierModal}
                startContent={<Icon icon="solar:add-circle-bold" width={20} />}
                size="sm"
              >
                Nuovo Fornitore
              </Button>
            ) : selectedTab === "lowStock" ? (
              <Button 
                color="primary" 
                onPress={handleSendAllEmails}
                startContent={<Icon icon="solar:letter-bold" width={20} />}
                size="sm"
              >
                Contatta Tutti
              </Button>
            ) : selectedTab === "orders" ? (
              <Button 
                color="primary" 
                startContent={<Icon icon="solar:add-circle-bold" width={20} />}
                size="sm"
              >
                Nuovo Ordine
              </Button>
            ) : (
              <Button 
                color="primary" 
                onPress={() => {
                  setNewTemplate({
                    name: "",
                    subject: "",
                    body: "",
                    is_default: false,
                  });
                  setEditingTemplate(null);
                  onOpenTemplateModal();
                }}
                startContent={<Icon icon="solar:add-circle-bold" width={20} />}
                size="sm"
              >
                Nuovo Modello
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Contenuto tab fornitori */}
      {selectedTab === "suppliers" && (
        <Card className="w-full shadow-sm">
          <CardHeader className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Lista Fornitori</h2>
            <p className="text-default-500 text-sm">
              {filteredSuppliers.length} fornitori
            </p>
          </CardHeader>
          <Divider />
          <CardBody>
            <Table aria-label="Tabella fornitori">
              <TableHeader>
                <TableColumn>NOME</TableColumn>
                <TableColumn>CONTATTO</TableColumn>
                <TableColumn>EMAIL</TableColumn>
                <TableColumn>TELEFONO</TableColumn>
                <TableColumn>INDIRIZZO</TableColumn>
                <TableColumn>AZIONI</TableColumn>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.length > 0 ? (
                  filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.supplier_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <Icon
                              icon="solar:user-outline"
                              className="text-primary"
                              width={16}
                            />
                          </div>
                          <span className="font-medium">{supplier.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{supplier.contact_person || "-"}</TableCell>
                      <TableCell>{supplier.email}</TableCell>
                      <TableCell>{supplier.phone || "-"}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        <Tooltip content={supplier.address || "-"}>
                          <span>{supplier.address || "-"}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tooltip content="Visualizza prodotti">
                            <Button
                              isIconOnly
                              variant="light"
                              size="sm"
                              onPress={() => {
                                setSelectedTab("lowStock");
                                setSearchQuery(supplier.name);
                              }}
                            >
                              <Icon icon="solar:box-minimalistic-bold" width={18} />
                            </Button>
                          </Tooltip>
                          <Tooltip content="Invia email">
                            <Button
                              isIconOnly
                              variant="light"
                              size="sm"
                              onPress={() => {
                                const supplierProducts = lowStockProducts.filter(
                                  p => p.supplier_id === supplier.supplier_id
                                );
                                if (supplierProducts.length > 0) {
                                  handleOpenEmailForm(supplier, supplierProducts);
                                } else {
                                  setErrorMessage("Questo fornitore non ha prodotti con scorte basse");
                                  setTimeout(() => setErrorMessage(null), 3000);
                                }
                              }}
                            >
                              <Icon icon="solar:letter-bold" width={18} />
                            </Button>
                          </Tooltip>
                          <Tooltip content="Modifica">
                            <Button
                              isIconOnly
                              variant="light"
                              size="sm"
                            >
                              <Icon icon="solar:pen-bold" width={18} />
                            </Button>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="flex flex-col items-center justify-center py-6">
                        <Icon
                          icon="solar:user-question-outline"
                          className="text-default-400 mb-2"
                          width={36}
                        />
                        <p>Nessun fornitore trovato</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      {/* Contenuto tab scorte basse */}
      {selectedTab === "lowStock" && (
        <Card className="w-full shadow-sm">
          <CardHeader className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Prodotti con Scorte Basse</h2>
            <p className="text-default-500 text-sm">
              {filteredLowStockProducts.length} prodotti
            </p>
          </CardHeader>
          <Divider />
          <CardBody>
            <Table aria-label="Tabella prodotti con scorte basse">
              <TableHeader>
                <TableColumn>PRODOTTO</TableColumn>
                <TableColumn>FORNITORE</TableColumn>
                <TableColumn>SKU</TableColumn>
                <TableColumn>STATO</TableColumn>
                <TableColumn>DISPONIBILITÀ</TableColumn>
                <TableColumn>AZIONI</TableColumn>
              </TableHeader>
              <TableBody>
                {filteredLowStockProducts.length > 0 ? (
                  filteredLowStockProducts.map((product) => (
                    <TableRow key={product.product_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-8 w-8 rounded-lg object-cover bg-default-100"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                              <Icon
                                icon="solar:box-minimalistic-bold"
                                className="text-primary"
                                width={16}
                              />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{product.name}</p>
                            {product.category_name && (
                              <p className="text-xs text-default-500">{product.category_name}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{product.supplier_name || "Non specificato"}</TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>
                        {product.stock_quantity === 0 ? (
                          <Chip size="sm" color="danger" variant="flat">Esaurito</Chip>
                        ) : product.stock_quantity <= product.minimum_stock * 0.5 ? (
                          <Chip size="sm" color="danger" variant="flat">Critico</Chip>
                        ) : (
                          <Chip size="sm" color="warning" variant="flat">Basso</Chip>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge color={product.stock_quantity === 0 ? "danger" : "warning"}>
                            {product.stock_quantity}
                          </Badge>
                          <span className="text-sm">/ {product.minimum_stock} min</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {product.supplier_id && (
                            <Tooltip content="Richiedi rifornimento">
                              <Button
                                isIconOnly
                                variant="light"
                                size="sm"
                                onPress={() => {
                                  const supplier = suppliers.find(
                                    s => s.supplier_id === product.supplier_id
                                  );
                                  if (supplier) {
                                    handleOpenEmailForm(supplier, [product]);
                                  } else {
                                    setErrorMessage("Informazioni sul fornitore non disponibili");
                                    setTimeout(() => setErrorMessage(null), 3000);
                                  }
                                }}
                              >
                                <Icon icon="solar:letter-bold" width={18} />
                              </Button>
                            </Tooltip>
                          )}
                          <Tooltip content="Visualizza dettagli">
                            <Button
                              isIconOnly
                              variant="light"
                              size="sm"
                            >
                              <Icon icon="solar:eye-bold" width={18} />
                            </Button>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="flex flex-col items-center justify-center py-6">
                        <Icon
                          icon="solar:box-minimalistic-outline"
                          className="text-default-400 mb-2"
                          width={36}
                        />
                        <p>Nessun prodotto con scorte basse trovato</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      {/* Contenuto tab modelli email */}
      {selectedTab === "templates" && (
        <Card className="w-full shadow-sm">
          <CardHeader className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Modelli di Email</h2>
            <p className="text-default-500 text-sm">
              {filteredTemplates.length} modelli
            </p>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="mb-4">
              <p className="text-sm text-default-500 mb-2">
                I modelli di email ti permettono di creare diverse versioni di messaggi da inviare ai fornitori. Puoi personalizzarli utilizzando i seguenti segnaposto:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Chip variant="flat" color="primary" size="sm" className="justify-start">{"{fornitore}"} - Nome del fornitore</Chip>
                <Chip variant="flat" color="primary" size="sm" className="justify-start">{"{lista_prodotti}"} - Elenco dei prodotti da rifornire</Chip>
                <Chip variant="flat" color="primary" size="sm" className="justify-start">{"{nome_azienda}"} - Nome della tua azienda</Chip>
                <Chip variant="flat" color="primary" size="sm" className="justify-start">{"{contatti}"} - Informazioni di contatto</Chip>
              </div>
            </div>
            
            <Table aria-label="Tabella modelli email">
              <TableHeader>
                <TableColumn>NOME</TableColumn>
                <TableColumn>OGGETTO</TableColumn>
                <TableColumn>ANTEPRIMA</TableColumn>
                <TableColumn>STATO</TableColumn>
                <TableColumn>AZIONI</TableColumn>
              </TableHeader>
              <TableBody>
                {filteredTemplates.length > 0 ? (
                  filteredTemplates.map((template) => (
                    <TableRow key={template.template_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <Icon
                              icon="solar:letter-linear"
                              className="text-primary"
                              width={16}
                            />
                          </div>
                          <span className="font-medium">{template.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{template.subject}</TableCell>
                      <TableCell className="max-w-xs">
                        <Tooltip content={template.body}>
                          <p className="truncate">{template.body.substring(0, 50)}...</p>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        {template.is_default ? (
                          <Chip size="sm" color="success" variant="flat">Predefinito</Chip>
                        ) : (
                          <Chip 
                            size="sm" 
                            color="default" 
                            variant="flat" 
                            className="cursor-pointer hover:bg-default-200"
                            onClick={() => handleSetDefaultTemplate(template)}
                          >
                            Imposta predefinito
                          </Chip>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tooltip content="Modifica">
                            <Button
                              isIconOnly
                              variant="light"
                              size="sm"
                              onPress={() => {
                                setEditingTemplate(template);
                                setNewTemplate({});
                                onOpenTemplateModal();
                              }}
                            >
                              <Icon icon="solar:pen-bold" width={18} />
                            </Button>
                          </Tooltip>
                          {!template.is_default && (
                            <Tooltip content="Elimina">
                              <Button
                                isIconOnly
                                variant="light"
                                size="sm"
                                onPress={() => handleDeleteTemplate(template)}
                              >
                                <Icon icon="solar:trash-bin-trash-bold" width={18} />
                              </Button>
                            </Tooltip>
                          )}
                          <Tooltip content="Seleziona">
                            <Button
                              isIconOnly
                              variant="light"
                              size="sm"
                              color={selectedTemplate?.template_id === template.template_id ? "primary" : "default"}
                              onPress={() => setSelectedTemplate(template)}
                            >
                              <Icon icon="solar:check-circle-bold" width={18} />
                            </Button>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <div className="flex flex-col items-center justify-center py-6">
                        <Icon
                          icon="solar:letter-linear"
                          className="text-default-400 mb-2"
                          width={36}
                        />
                        <p>Nessun modello di email trovato</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      {/* Contenuto tab ordini */}
      {selectedTab === "orders" && (
        <div className="space-y-6">
          {/* Dashboard degli ordini */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card className="bg-gradient-to-br from-primary-50 to-background">
              <CardBody className="py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Icon
                      icon="solar:document-text-bold"
                      className="text-primary"
                      width={22}
                    />
                  </div>
                  <div>
                    <p className="text-small text-default-500">Totale Ordini</p>
                    <p className="text-xl font-bold">{orderStats.total}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-warning-50 to-background">
              <CardBody className="py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
                    <Icon
                      icon="solar:clock-circle-bold"
                      className="text-warning"
                      width={22}
                    />
                  </div>
                  <div>
                    <p className="text-small text-default-500">In Attesa</p>
                    <p className="text-xl font-bold">{orderStats.pending}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-secondary-50 to-background">
              <CardBody className="py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
                    <Icon
                      icon="solar:truck-bold"
                      className="text-secondary"
                      width={22}
                    />
                  </div>
                  <div>
                    <p className="text-small text-default-500">Spediti</p>
                    <p className="text-xl font-bold">{orderStats.shipped}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-success-50 to-background">
              <CardBody className="py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                    <Icon
                      icon="solar:check-circle-bold"
                      className="text-success"
                      width={22}
                    />
                  </div>
                  <div>
                    <p className="text-small text-default-500">Consegnati</p>
                    <p className="text-xl font-bold">{orderStats.delivered}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="bg-gradient-to-br from-default-50 to-background">
              <CardBody className="py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-default-200">
                    <Icon
                      icon="solar:wallet-money-bold"
                      className="text-default-700"
                      width={22}
                    />
                  </div>
                  <div>
                    <p className="text-small text-default-500">Valore Totale</p>
                    <p className="text-xl font-bold">{formatPrice(orderStats.totalValue)}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
          
          {/* Filtri per gli ordini */}
          <div className="flex flex-wrap gap-4 mb-2">
            <Tabs 
              selectedKey={orderTab} 
              onSelectionChange={setOrderTab as any}
              color="primary"
              radius="full"
              size="sm"
            >
              <Tab key="incoming" title="In Arrivo" />
              <Tab key="completed" title="Completati" />
            </Tabs>
            
            <div className="flex gap-2 ml-auto">
              <Select
                selectedKeys={[statusFilter]}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                size="sm"
                aria-label="Filtra per stato"
                className="w-40"
              >
                <SelectItem key="all">Tutti gli stati</SelectItem>
                <SelectItem key="pending">In attesa</SelectItem>
                <SelectItem key="confirmed">Confermati</SelectItem>
                <SelectItem key="shipped">Spediti</SelectItem>
                <SelectItem key="delivered">Consegnati</SelectItem>
                <SelectItem key="cancelled">Annullati</SelectItem>
              </Select>
            </div>
          </div>

          {/* Tabella ordini */}
          <Card className="w-full shadow-sm">
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                {orderTab === "incoming" ? "Ordini in Arrivo" : "Ordini Completati"}
              </h2>
              <p className="text-default-500 text-sm">
                {filteredOrders.length} ordini
              </p>
            </CardHeader>
            <Divider />
            <CardBody>
              <Table aria-label="Tabella ordini">
                <TableHeader>
                  <TableColumn>NUMERO ORDINE</TableColumn>
                  <TableColumn>FORNITORE</TableColumn>
                  <TableColumn>DATA</TableColumn>
                  <TableColumn>CONSEGNA PREVISTA</TableColumn>
                  <TableColumn>STATO</TableColumn>
                  <TableColumn>TOTALE</TableColumn>
                  <TableColumn>AZIONI</TableColumn>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <TableRow key={order.order_id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                              <Icon
                                icon="solar:document-text-linear"
                                className="text-primary"
                                width={16}
                              />
                            </div>
                            <span className="font-medium">{order.order_number}</span>
                          </div>
                        </TableCell>
                        <TableCell>{order.supplier_name || "-"}</TableCell>
                        <TableCell>{formatDate(order.order_date)}</TableCell>
                        <TableCell>{formatDate(order.expected_delivery_date)}</TableCell>
                        <TableCell>
                          <Chip 
                            size="sm" 
                            color={getStatusColor(order.status)} 
                            variant="flat"
                          >
                            {getStatusLabel(order.status)}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{formatPrice(order.total_amount)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Tooltip content="Visualizza dettagli">
                              <Button
                                isIconOnly
                                variant="light"
                                size="sm"
                                onPress={() => setSelectedOrder(order)}
                              >
                                <Icon icon="solar:eye-bold" width={18} />
                              </Button>
                            </Tooltip>
                            {order.status === "pending" && (
                              <Tooltip content="Conferma ordine">
                                <Button
                                  isIconOnly
                                  variant="light"
                                  size="sm"
                                  color="primary"
                                  onPress={() => handleUpdateOrderStatus(order.order_id, "confirmed")}
                                >
                                  <Icon icon="solar:check-bold" width={18} />
                                </Button>
                              </Tooltip>
                            )}
                            {order.status === "confirmed" && (
                              <Tooltip content="Segna come spedito">
                                <Button
                                  isIconOnly
                                  variant="light"
                                  size="sm"
                                  color="secondary"
                                  onPress={() => handleUpdateOrderStatus(order.order_id, "shipped")}
                                >
                                  <Icon icon="solar:truck-bold" width={18} />
                                </Button>
                              </Tooltip>
                            )}
                            {order.status === "shipped" && (
                              <Tooltip content="Segna come consegnato">
                                <Button
                                  isIconOnly
                                  variant="light"
                                  size="sm"
                                  color="success"
                                  onPress={() => handleUpdateOrderStatus(order.order_id, "delivered")}
                                >
                                  <Icon icon="solar:box-bold" width={18} />
                                </Button>
                              </Tooltip>
                            )}
                            {order.tracking_number && (
                              <Tooltip content="Traccia spedizione">
                                <Button
                                  as="a"
                                  href={order.tracking_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  isIconOnly
                                  variant="light"
                                  size="sm"
                                >
                                  <Icon icon="solar:square-top-down-linear" width={18} />
                                </Button>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <div className="flex flex-col items-center justify-center py-12">
                          <div className="rounded-full bg-default-100 p-6 mb-4">
                            <Icon
                              icon="solar:notebook-minimalistic-linear"
                              className="text-default-400"
                              width={40}
                            />
                          </div>
                          <p className="text-xl font-medium mb-2">Nessun ordine trovato</p>
                          <p className="text-default-500 text-center max-w-md">
                            {orderTab === "incoming" 
                              ? "Non ci sono ordini in arrivo che corrispondono ai criteri di ricerca." 
                              : "Non ci sono ordini completati che corrispondono ai criteri di ricerca."}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
          
          {/* Modal dettaglio ordine */}
          <Modal 
            isOpen={!!selectedOrder} 
            onClose={() => setSelectedOrder(null)}
            size="3xl"
            scrollBehavior="inside"
          >
            <ModalContent>
              {(onClose) => (
                <>
                  <ModalHeader className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <Icon icon="solar:document-text-bold" className="text-primary" width={24} />
                      <div>
                        <p className="text-small text-default-500">Ordine</p>
                        <p className="text-xl">{selectedOrder?.order_number}</p>
                      </div>
                    </div>
                  </ModalHeader>
                  <Divider />
                  <ModalBody>
                    {selectedOrder && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <p className="text-sm font-semibold text-default-500">Informazioni Ordine</p>
                            <div className="flex flex-col gap-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-default-500">Fornitore:</span>
                                <span className="text-sm font-medium">{selectedOrder.supplier_name || "-"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-default-500">Data ordine:</span>
                                <span className="text-sm font-medium">{formatDate(selectedOrder.order_date)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-default-500">Consegna prevista:</span>
                                <span className="text-sm font-medium">{formatDate(selectedOrder.expected_delivery_date)}</span>
                              </div>
                              {selectedOrder.delivery_date && (
                                <div className="flex justify-between">
                                  <span className="text-sm text-default-500">Consegnato il:</span>
                                  <span className="text-sm font-medium">{formatDate(selectedOrder.delivery_date)}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-sm text-default-500">Totale:</span>
                                <span className="text-sm font-bold">{formatPrice(selectedOrder.total_amount)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <p className="text-sm font-semibold text-default-500">Stato dell'Ordine</p>
                            <div className="bg-default-50 p-4 rounded-lg">
                              <div className="flex items-center justify-between mb-4">
                                <Chip 
                                  size="sm" 
                                  color={getStatusColor(selectedOrder.status)} 
                                  variant="flat"
                                  className="px-3 py-1"
                                >
                                  {getStatusLabel(selectedOrder.status)}
                                </Chip>
                                <span className="text-xs text-default-500">
                                  Ultimo aggiornamento: {formatDate(selectedOrder.updated_at)}
                                </span>
                              </div>
                              
                              {selectedOrder.tracking_number && (
                                <div className="mb-2">
                                  <p className="text-sm text-default-500 mb-1">Numero di tracciamento:</p>
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium">{selectedOrder.tracking_number}</p>
                                    <Button
                                      as="a"
                                      href={selectedOrder.tracking_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      size="sm"
                                      variant="flat"
                                      color="primary"
                                    >
                                      Traccia
                                    </Button>
                                  </div>
                                </div>
                              )}
                              
                              <div>
                                <p className="text-sm text-default-500 mb-1">Note:</p>
                                <p className="text-sm">{selectedOrder.notes || "Nessuna nota"}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <p className="text-sm font-semibold text-default-500">Prodotti Ordinati</p>
                          <Table aria-label="Prodotti nell'ordine" removeWrapper>
                            <TableHeader>
                              <TableColumn>PRODOTTO</TableColumn>
                              <TableColumn>SKU</TableColumn>
                              <TableColumn>QTÀ</TableColumn>
                              <TableColumn>PREZZO UNIT.</TableColumn>
                              <TableColumn>TOTALE</TableColumn>
                            </TableHeader>
                            <TableBody>
                              {selectedOrder.items.map((item) => (
                                <TableRow key={item.item_id}>
                                  <TableCell>{item.product_name}</TableCell>
                                  <TableCell>{item.sku}</TableCell>
                                  <TableCell>{item.quantity}</TableCell>
                                  <TableCell>{formatPrice(item.unit_price)}</TableCell>
                                  <TableCell>{formatPrice(item.total_price)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          
                          <div className="flex justify-end mt-2">
                            <div className="bg-default-50 p-3 rounded-lg w-48">
                              <div className="flex justify-between mb-1">
                                <span className="text-sm text-default-500">Totale:</span>
                                <span className="text-sm font-bold">{formatPrice(selectedOrder.total_amount)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </ModalBody>
                  <ModalFooter>
                    <Button color="default" variant="light" onPress={onClose}>
                      Chiudi
                    </Button>
                    {selectedOrder && selectedOrder.status === "pending" && (
                      <Button 
                        color="primary"
                        onPress={() => {
                          handleUpdateOrderStatus(selectedOrder.order_id, "confirmed");
                          onClose();
                        }}
                      >
                        Conferma Ordine
                      </Button>
                    )}
                    {selectedOrder && selectedOrder.status === "confirmed" && (
                      <Button 
                        color="secondary"
                        onPress={() => {
                          handleUpdateOrderStatus(selectedOrder.order_id, "shipped");
                          onClose();
                        }}
                      >
                        Segna come Spedito
                      </Button>
                    )}
                    {selectedOrder && selectedOrder.status === "shipped" && (
                      <Button 
                        color="success"
                        onPress={() => {
                          handleUpdateOrderStatus(selectedOrder.order_id, "delivered");
                          onClose();
                        }}
                      >
                        Segna come Consegnato
                      </Button>
                    )}
                  </ModalFooter>
                </>
              )}
            </ModalContent>
          </Modal>
        </div>
      )}

      {/* Modal per l'invio dell'email */}
      <Modal isOpen={isEmailModalOpen} onClose={onCloseEmailModal} size="xl">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Invia Richiesta Rifornimento
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 gap-4">
              {selectedTemplate && (
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm text-default-600">
                    <span className="font-medium mr-1">Modello utilizzato:</span>
                    {selectedTemplate.name}
                  </p>
                  <Button 
                    size="sm" 
                    variant="flat" 
                    color="primary"
                    onPress={() => {
                      setSelectedTab("templates");
                      onCloseEmailModal();
                    }}
                  >
                    Cambia modello
                  </Button>
                </div>
              )}
              <div>
                <p className="mb-2 text-sm font-medium">Destinatario:</p>
                <Input
                  value={emailTemplate.recipient}
                  onChange={(e) =>
                    setEmailTemplate({
                      ...emailTemplate,
                      recipient: e.target.value,
                    })
                  }
                  placeholder="Email del fornitore"
                  type="email"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">CC (opzionale):</p>
                <Input
                  value={emailTemplate.cc || ""}
                  onChange={(e) =>
                    setEmailTemplate({
                      ...emailTemplate,
                      cc: e.target.value,
                    })
                  }
                  placeholder="Email in copia"
                  type="email"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Oggetto:</p>
                <Input
                  value={emailTemplate.subject}
                  onChange={(e) =>
                    setEmailTemplate({
                      ...emailTemplate,
                      subject: e.target.value,
                    })
                  }
                  placeholder="Oggetto dell'email"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Corpo del messaggio:</p>
                <Textarea
                  value={emailTemplate.body}
                  onChange={(e) =>
                    setEmailTemplate({
                      ...emailTemplate,
                      body: e.target.value,
                    })
                  }
                  placeholder="Contenuto dell'email"
                  minRows={8}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={onCloseEmailModal}>
              Annulla
            </Button>
            <Button color="primary" onPress={handleSendEmail}>
              Invia Email
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal per l'aggiunta di un nuovo fornitore */}
      <Modal isOpen={isAddSupplierModalOpen} onClose={onCloseAddSupplierModal} size="xl">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Aggiungi Nuovo Fornitore
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="mb-2 text-sm font-medium">Nome Azienda:</p>
                <Input
                  value={newSupplier.name || ""}
                  onChange={(e) =>
                    handleNewSupplierChange("name", e.target.value)
                  }
                  placeholder="Nome del fornitore"
                  isRequired
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Email:</p>
                <Input
                  value={newSupplier.email || ""}
                  onChange={(e) =>
                    handleNewSupplierChange("email", e.target.value)
                  }
                  placeholder="Email del fornitore"
                  type="email"
                  isRequired
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Telefono:</p>
                <Input
                  value={newSupplier.phone || ""}
                  onChange={(e) =>
                    handleNewSupplierChange("phone", e.target.value)
                  }
                  placeholder="Numero di telefono"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Persona di contatto:</p>
                <Input
                  value={newSupplier.contact_person || ""}
                  onChange={(e) =>
                    handleNewSupplierChange("contact_person", e.target.value)
                  }
                  placeholder="Nome del referente"
                />
              </div>
              <div className="md:col-span-2">
                <p className="mb-2 text-sm font-medium">Indirizzo:</p>
                <Input
                  value={newSupplier.address || ""}
                  onChange={(e) =>
                    handleNewSupplierChange("address", e.target.value)
                  }
                  placeholder="Indirizzo completo"
                />
              </div>
              <div className="md:col-span-2">
                <p className="mb-2 text-sm font-medium">Note:</p>
                <Textarea
                  value={newSupplier.notes || ""}
                  onChange={(e) =>
                    handleNewSupplierChange("notes", e.target.value)
                  }
                  placeholder="Note aggiuntive"
                  minRows={3}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={onCloseAddSupplierModal}>
              Annulla
            </Button>
            <Button 
              color="primary" 
              onPress={handleAddSupplier}
              isDisabled={!newSupplier.name || !newSupplier.email}
            >
              Salva Fornitore
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal per la gestione dei modelli di email */}
      <Modal isOpen={isTemplateModalOpen} onClose={onCloseTemplateModal} size="xl">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {editingTemplate ? "Modifica Modello Email" : "Nuovo Modello Email"}
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="mb-2 text-sm font-medium">Nome modello:</p>
                <Input
                  value={(editingTemplate?.name || newTemplate.name) || ""}
                  onChange={(e) =>
                    editingTemplate
                      ? setEditingTemplate({
                          ...editingTemplate,
                          name: e.target.value,
                        })
                      : setNewTemplate({
                          ...newTemplate,
                          name: e.target.value,
                        })
                  }
                  placeholder="Es. Richiesta standard, Richiesta urgente..."
                  isRequired
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Oggetto dell'email:</p>
                <Input
                  value={(editingTemplate?.subject || newTemplate.subject) || ""}
                  onChange={(e) =>
                    editingTemplate
                      ? setEditingTemplate({
                          ...editingTemplate,
                          subject: e.target.value,
                        })
                      : setNewTemplate({
                          ...newTemplate,
                          subject: e.target.value,
                        })
                  }
                  placeholder="Oggetto dell'email"
                  isRequired
                />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <p className="text-sm font-medium">Corpo del messaggio:</p>
                  <div className="flex gap-2">
                    <Tooltip content="Inserisci nome fornitore">
                      <Button 
                        size="sm" 
                        variant="flat"
                        onPress={() => {
                          const textToInsert = "{fornitore}";
                          const textArea = editingTemplate 
                            ? editingTemplate.body + textToInsert
                            : (newTemplate.body || "") + textToInsert;
                          
                          if (editingTemplate) {
                            setEditingTemplate({
                              ...editingTemplate,
                              body: textArea,
                            });
                          } else {
                            setNewTemplate({
                              ...newTemplate,
                              body: textArea,
                            });
                          }
                        }}
                      >
                        Fornitore
                      </Button>
                    </Tooltip>
                    <Tooltip content="Inserisci lista prodotti">
                      <Button 
                        size="sm" 
                        variant="flat"
                        onPress={() => {
                          const textToInsert = "{lista_prodotti}";
                          const textArea = editingTemplate 
                            ? editingTemplate.body + textToInsert
                            : (newTemplate.body || "") + textToInsert;
                          
                          if (editingTemplate) {
                            setEditingTemplate({
                              ...editingTemplate,
                              body: textArea,
                            });
                          } else {
                            setNewTemplate({
                              ...newTemplate,
                              body: textArea,
                            });
                          }
                        }}
                      >
                        Prodotti
                      </Button>
                    </Tooltip>
                  </div>
                </div>
                <Textarea
                  value={(editingTemplate?.body || newTemplate.body) || ""}
                  onChange={(e) =>
                    editingTemplate
                      ? setEditingTemplate({
                          ...editingTemplate,
                          body: e.target.value,
                        })
                      : setNewTemplate({
                          ...newTemplate,
                          body: e.target.value,
                        })
                  }
                  placeholder="Contenuto del modello di email..."
                  minRows={10}
                  isRequired
                />
                <p className="text-xs text-default-500 mt-1">
                  Utilizza i segnaposto {"{fornitore}"}, {"{lista_prodotti}"}, {"{nome_azienda}"} e {"{contatti}"} che verranno sostituiti con i valori corretti.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={(editingTemplate?.is_default || newTemplate.is_default) || false}
                  onChange={(e) =>
                    editingTemplate
                      ? setEditingTemplate({
                          ...editingTemplate,
                          is_default: e.target.checked,
                        })
                      : setNewTemplate({
                          ...newTemplate,
                          is_default: e.target.checked,
                        })
                  }
                  className="rounded border-default-300 text-primary focus:ring-primary"
                />
                <label htmlFor="is_default" className="text-sm">
                  Imposta come modello predefinito
                </label>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={onCloseTemplateModal}>
              Annulla
            </Button>
            <Button 
              color="primary" 
              onPress={editingTemplate ? handleUpdateTemplate : handleAddTemplate}
              isDisabled={
                editingTemplate 
                  ? !editingTemplate.name || !editingTemplate.subject || !editingTemplate.body
                  : !newTemplate.name || !newTemplate.subject || !newTemplate.body
              }
            >
              {editingTemplate ? "Aggiorna" : "Salva"} Modello
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default Suppliers; 