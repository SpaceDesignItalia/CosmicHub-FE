import React, { useState, useEffect, useMemo } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
  Avatar,
  Badge,
  Tooltip,
  Tabs,
  Tab,
  Divider,
  Progress,
  Autocomplete,
  AutocompleteItem,
  Select,
  SelectItem,
  DatePicker,
  TimeInput,
  Textarea,
  Switch,
  ScrollShadow,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import type { Customer, CustomerSearchResult, QuickBookingData, InterventionSummary, PaymentSummary } from "../../types/Customer";
import type { Technician } from "../../types/Technician";
import PageHeader from "../../Components/Layout/PageHeader";
import { parseDate, Time } from "@internationalized/date";

const statusColorMap = {
  active: "success",
  inactive: "danger",
} as const;

const customerTypeColorMap = {
  private: "primary",
  business: "warning",
} as const;

const urgencyColorMap = {
  low: "default",
  medium: "warning", 
  high: "danger",
  emergency: "danger",
} as const;

export default function Customers() {
  const navigate = useNavigate();
  
  // Modals
  const { isOpen: isBookingModalOpen, onOpen: onBookingModalOpen, onClose: onBookingModalClose } = useDisclosure();
  const { isOpen: isNewCustomerModalOpen, onOpen: onNewCustomerModalOpen, onClose: onNewCustomerModalClose } = useDisclosure();
  
  // State principale
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CustomerSearchResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedTab, setSelectedTab] = useState("overview");
  
  // Quick booking state
  const [quickBookingData, setQuickBookingData] = useState<QuickBookingData>({
    customer_id: "",
    problem_description: "",
    urgency_level: "medium",
    intervention_type: "inspection",
    estimated_duration: 60,
  });
  

  
  // New customer form
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: "",
    surname: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    zip_code: "",
    country: "Italia",
    customer_type: "private" as "private" | "business",
    referred_by: "",
    company_name: "",
    vat_number: "",
    preferred_contact_method: "phone" as "phone" | "email" | "whatsapp" | "sms",
    communication_preferences: {
      receive_reminders: true,
      receive_promotions: false,
      receive_maintenance_alerts: true,
    },
  });

  // Load data
  useEffect(() => {
    loadMockData();
  }, []);

  // Intelligent search function
  const performSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const results: CustomerSearchResult[] = [];
    const searchTerm = query.toLowerCase();

    customers.forEach(customer => {
      const matchReasons: string[] = [];
      let matchScore = 0;

      // Name match
      const fullName = `${customer.name} ${customer.surname}`.toLowerCase();
      if (fullName.includes(searchTerm)) {
        matchReasons.push("Nome");
        matchScore += 10;
      }

      // Phone match
      if (customer.phone.includes(searchTerm)) {
        matchReasons.push("Telefono");
        matchScore += 15;
      }

      // Email match
      if (customer.email?.toLowerCase().includes(searchTerm)) {
        matchReasons.push("Email");
        matchScore += 8;
      }

      // Address match
      if (customer.address.toLowerCase().includes(searchTerm) || 
          customer.city.toLowerCase().includes(searchTerm)) {
        matchReasons.push("Indirizzo");
        matchScore += 12;
      }

      // Company name match
      if (customer.company_name?.toLowerCase().includes(searchTerm)) {
        matchReasons.push("Azienda");
        matchScore += 10;
      }

      // VAT number match
      if (customer.vat_number?.includes(searchTerm)) {
        matchReasons.push("Partita IVA");
        matchScore += 20;
      }

      if (matchScore > 0) {
        results.push({
          customer,
          match_score: matchScore,
          match_reasons: matchReasons,
        });
      }
    });

    // Sort by match score
    results.sort((a, b) => b.match_score - a.match_score);
    setSearchResults(results);
  };

  // Handle search input
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    performSearch(value);
  };

  // Select customer
  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setQuickBookingData(prev => ({ ...prev, customer_id: customer.customer_id }));
    setSearchQuery("");
    setSearchResults([]);
  };

  const loadMockData = () => {
    // Mock data completo per il Customer Control Center
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
        created_at: new Date("2024-01-15"),
        updated_at: new Date("2024-01-15"),
        created_by: "admin",
        total_interventions: 8,
        last_intervention_date: new Date("2024-11-20"),
        customer_value: 3500,
        referred_by: "2",
        referred_by_name: "Laura Bianchi",
        customer_rating: 5,
        preferred_contact_method: "phone",
        communication_preferences: {
          receive_reminders: true,
          receive_promotions: true,
          receive_maintenance_alerts: true,
        },
        coordinates: { lat: 45.4642, lng: 9.1900 },
        stats: {
          total_spent: 3500,
          average_intervention_cost: 437.50,
          punctuality_score: 9,
          payment_reliability: 10,
          last_contact_date: new Date("2024-11-20"),
        },
        recurring_problems: ["Perdite idrauliche", "Problemi elettrici"],
        preferred_technician_id: "1",
        preferred_technician_name: "Marco Verdi",
        referrals: [
          {
            referral_id: "1",
            referred_customer_id: "3",
            referred_customer_name: "Giuseppe Neri",
            referral_date: new Date("2024-03-10"),
            status: "completed",
            discount_applied: 50,
            commission_earned: 25,
          }
        ],
        intervention_history: [
          {
            intervention_id: "1",
            date: new Date("2024-11-20"),
            type: "Riparazione",
            technician_name: "Marco Verdi",
            cost: 250,
            problem_description: "Perdita rubinetto cucina",
            solution_description: "Sostituzione guarnizioni",
            customer_satisfaction: 5,
            status: "completed",
          },
          {
            intervention_id: "2",
            date: new Date("2024-10-15"),
            type: "Manutenzione",
            technician_name: "Marco Verdi",
            cost: 180,
            problem_description: "Controllo impianto elettrico",
            solution_description: "Verifica e pulizia quadro elettrico",
            customer_satisfaction: 4,
            status: "completed",
          }
        ],
        payment_history: [
          {
            payment_id: "1",
            intervention_id: "1",
            date: new Date("2024-11-20"),
            amount: 250,
            method: "card",
            status: "paid",
            invoice_number: "INV-2024-001",
          },
          {
            payment_id: "2",
            intervention_id: "2",
            date: new Date("2024-10-15"),
            amount: 180,
            method: "cash",
            status: "paid",
            invoice_number: "INV-2024-002",
          }
        ],
      },
      {
        customer_id: "2",
        name: "Laura",
        surname: "Bianchi",
        email: "laura.bianchi@email.com",
        phone: "+39 335 7654321",
        address: "Via Garibaldi 456",
        city: "Roma",
        zip_code: "00100",
        country: "Italia",
        status: "active",
        customer_type: "private",
        created_at: new Date("2024-02-10"),
        updated_at: new Date("2024-02-10"),
        created_by: "admin",
        total_interventions: 3,
        last_intervention_date: new Date("2024-09-15"),
        customer_value: 850,
        customer_rating: 4,
        preferred_contact_method: "whatsapp",
        communication_preferences: {
          receive_reminders: true,
          receive_promotions: false,
          receive_maintenance_alerts: true,
        },
        coordinates: { lat: 41.9028, lng: 12.4964 },
        stats: {
          total_spent: 850,
          average_intervention_cost: 283.33,
          punctuality_score: 8,
          payment_reliability: 9,
          last_contact_date: new Date("2024-09-15"),
        },
        recurring_problems: ["Problemi climatizzazione"],
        preferred_technician_id: "2",
        preferred_technician_name: "Anna Rossi",
        referrals: [
          {
            referral_id: "2",
            referred_customer_id: "1",
            referred_customer_name: "Mario Rossi",
            referral_date: new Date("2024-01-15"),
            status: "completed",
            discount_applied: 30,
            commission_earned: 15,
          }
        ],
        intervention_history: [
          {
            intervention_id: "3",
            date: new Date("2024-09-15"),
            type: "Riparazione",
            technician_name: "Anna Rossi",
            cost: 320,
            problem_description: "Climatizzatore non raffredda",
            solution_description: "Ricarica gas refrigerante",
            customer_satisfaction: 4,
            status: "completed",
          }
        ],
        payment_history: [
          {
            payment_id: "3",
            intervention_id: "3",
            date: new Date("2024-09-15"),
            amount: 320,
            method: "bank_transfer",
            status: "paid",
            invoice_number: "INV-2024-003",
          }
        ],
      },
      {
        customer_id: "3",
        name: "Giuseppe",
        surname: "Neri",
        email: "giuseppe.neri@gmail.com",
        phone: "+39 339 9876543",
        address: "Corso Venezia 88",
        city: "Milano",
        zip_code: "20121",
        country: "Italia",
        status: "active",
        customer_type: "private",
        created_at: new Date("2024-03-10"),
        updated_at: new Date("2024-03-10"),
        created_by: "admin",
        total_interventions: 2,
        last_intervention_date: new Date("2024-08-22"),
        customer_value: 450,
        referred_by: "1",
        referred_by_name: "Mario Rossi",
        customer_rating: 4,
        preferred_contact_method: "email",
        communication_preferences: {
          receive_reminders: true,
          receive_promotions: true,
          receive_maintenance_alerts: false,
        },
        coordinates: { lat: 45.4708, lng: 9.1958 },
        stats: {
          total_spent: 450,
          average_intervention_cost: 225,
          punctuality_score: 7,
          payment_reliability: 8,
          last_contact_date: new Date("2024-08-22"),
        },
        recurring_problems: ["Problemi riscaldamento"],
        preferred_technician_id: "1",
        preferred_technician_name: "Marco Verdi",
        intervention_history: [
          {
            intervention_id: "4",
            date: new Date("2024-08-22"),
            type: "Riparazione",
            technician_name: "Marco Verdi",
            cost: 280,
            problem_description: "Caldaia non si accende",
            solution_description: "Sostituzione scheda elettronica",
            customer_satisfaction: 4,
            status: "completed",
          },
          {
            intervention_id: "5",
            date: new Date("2024-05-10"),
            type: "Manutenzione",
            technician_name: "Marco Verdi",
            cost: 170,
            problem_description: "Controllo annuale caldaia",
            solution_description: "Pulizia e verifica generale",
            customer_satisfaction: 4,
            status: "completed",
          }
        ],
        payment_history: [
          {
            payment_id: "4",
            intervention_id: "4",
            date: new Date("2024-08-22"),
            amount: 280,
            method: "card",
            status: "paid",
            invoice_number: "INV-2024-004",
          },
          {
            payment_id: "5",
            intervention_id: "5",
            date: new Date("2024-05-10"),
            amount: 170,
            method: "cash",
            status: "paid",
            invoice_number: "INV-2024-005",
          }
        ],
      },
      {
        customer_id: "4",
        name: "Tech Solutions",
        surname: "S.r.l.",
        email: "info@techsolutions.it",
        phone: "+39 02 87654321",
        address: "Via Montenapoleone 12",
        city: "Milano",
        zip_code: "20121",
        country: "Italia",
        company_name: "Tech Solutions S.r.l.",
        vat_number: "IT12345678901",
        tax_code: "12345678901",
        status: "active",
        customer_type: "business",
        created_at: new Date("2024-01-05"),
        updated_at: new Date("2024-01-05"),
        created_by: "admin",
        total_interventions: 15,
        last_intervention_date: new Date("2024-12-01"),
        customer_value: 8500,
        customer_rating: 5,
        preferred_contact_method: "email",
        communication_preferences: {
          receive_reminders: true,
          receive_promotions: true,
          receive_maintenance_alerts: true,
        },
        coordinates: { lat: 45.4685, lng: 9.1980 },
        stats: {
          total_spent: 8500,
          average_intervention_cost: 566.67,
          punctuality_score: 10,
          payment_reliability: 10,
          last_contact_date: new Date("2024-12-01"),
        },
        recurring_problems: ["Sistemi di sicurezza", "Climatizzazione uffici"],
        preferred_technician_id: "3",
        preferred_technician_name: "Luca Bianchi",
        referrals: [
          {
            referral_id: "3",
            referred_customer_id: "5",
            referred_customer_name: "StartUp Innovativa S.r.l.",
            referral_date: new Date("2024-06-15"),
            status: "completed",
            discount_applied: 100,
            commission_earned: 50,
          }
        ],
        intervention_history: [
          {
            intervention_id: "6",
            date: new Date("2024-12-01"),
            type: "Installazione",
            technician_name: "Luca Bianchi",
            cost: 1200,
            problem_description: "Installazione sistema allarme nuovo ufficio",
            solution_description: "Sistema completo con sensori e telecamere",
            customer_satisfaction: 5,
            status: "completed",
          },
          {
            intervention_id: "7",
            date: new Date("2024-10-20"),
            type: "Manutenzione",
            technician_name: "Anna Rossi",
            cost: 450,
            problem_description: "Manutenzione climatizzatori uffici",
            solution_description: "Pulizia filtri e controllo gas",
            customer_satisfaction: 5,
            status: "completed",
          }
        ],
        payment_history: [
          {
            payment_id: "6",
            intervention_id: "6",
            date: new Date("2024-12-01"),
            amount: 1200,
            method: "bank_transfer",
            status: "paid",
            invoice_number: "INV-2024-006",
          },
          {
            payment_id: "7",
            intervention_id: "7",
            date: new Date("2024-10-20"),
            amount: 450,
            method: "bank_transfer",
            status: "paid",
            invoice_number: "INV-2024-007",
          }
        ],
      },
      {
        customer_id: "5",
        name: "StartUp Innovativa",
        surname: "S.r.l.",
        email: "contatti@startup-innovativa.it",
        phone: "+39 02 12345678",
        address: "Via Brera 25",
        city: "Milano",
        zip_code: "20121",
        country: "Italia",
        company_name: "StartUp Innovativa S.r.l.",
        vat_number: "IT98765432109",
        tax_code: "98765432109",
        status: "active",
        customer_type: "business",
        created_at: new Date("2024-06-15"),
        updated_at: new Date("2024-06-15"),
        created_by: "admin",
        total_interventions: 4,
        last_intervention_date: new Date("2024-11-10"),
        customer_value: 1850,
        referred_by: "4",
        referred_by_name: "Tech Solutions S.r.l.",
        customer_rating: 4,
        preferred_contact_method: "whatsapp",
        communication_preferences: {
          receive_reminders: true,
          receive_promotions: false,
          receive_maintenance_alerts: true,
        },
        coordinates: { lat: 45.4719, lng: 9.1881 },
        stats: {
          total_spent: 1850,
          average_intervention_cost: 462.50,
          punctuality_score: 9,
          payment_reliability: 9,
          last_contact_date: new Date("2024-11-10"),
        },
        recurring_problems: ["Problemi elettrici"],
        preferred_technician_id: "3",
        preferred_technician_name: "Luca Bianchi",
        intervention_history: [
          {
            intervention_id: "8",
            date: new Date("2024-11-10"),
            type: "Riparazione",
            technician_name: "Luca Bianchi",
            cost: 380,
            problem_description: "Cortocircuito nell'ufficio principale",
            solution_description: "Sostituzione cablaggio danneggiato",
            customer_satisfaction: 4,
            status: "completed",
          }
        ],
        payment_history: [
          {
            payment_id: "8",
            intervention_id: "8",
            date: new Date("2024-11-10"),
            amount: 380,
            method: "bank_transfer",
            status: "paid",
            invoice_number: "INV-2024-008",
          }
        ],
      },
      {
        customer_id: "6",
        name: "Anna",
        surname: "Verdi",
        email: "anna.verdi@hotmail.com",
        phone: "+39 348 5555555",
        address: "Via Torino 67",
        city: "Torino",
        zip_code: "10123",
        country: "Italia",
        status: "active",
        customer_type: "private",
        created_at: new Date("2024-07-20"),
        updated_at: new Date("2024-07-20"),
        created_by: "admin",
        total_interventions: 1,
        last_intervention_date: new Date("2024-07-25"),
        customer_value: 150,
        customer_rating: 3,
        preferred_contact_method: "phone",
        communication_preferences: {
          receive_reminders: false,
          receive_promotions: false,
          receive_maintenance_alerts: false,
        },
        coordinates: { lat: 45.0703, lng: 7.6869 },
        stats: {
          total_spent: 150,
          average_intervention_cost: 150,
          punctuality_score: 6,
          payment_reliability: 7,
          last_contact_date: new Date("2024-07-25"),
        },
        intervention_history: [
          {
            intervention_id: "9",
            date: new Date("2024-07-25"),
            type: "Sopralluogo",
            technician_name: "Marco Verdi",
            cost: 150,
            problem_description: "Valutazione per installazione climatizzatore",
            solution_description: "Sopralluogo completato, preventivo inviato",
            customer_satisfaction: 3,
            status: "completed",
          }
        ],
        payment_history: [
          {
            payment_id: "9",
            intervention_id: "9",
            date: new Date("2024-07-25"),
            amount: 150,
            method: "cash",
            status: "paid",
            invoice_number: "INV-2024-009",
          }
        ],
      },
      {
        customer_id: "7",
        name: "Francesca",
        surname: "Romano",
        phone: "+39 320 7777777",
        address: "Via Nazionale 89",
        city: "Roma",
        zip_code: "00184",
        country: "Italia",
        status: "active",
        customer_type: "private",
        created_at: new Date("2024-11-15"),
        updated_at: new Date("2024-11-15"),
        created_by: "admin",
        total_interventions: 0,
        customer_value: 0,
        customer_rating: 0,
        preferred_contact_method: "phone",
        communication_preferences: {
          receive_reminders: true,
          receive_promotions: true,
          receive_maintenance_alerts: true,
        },
        coordinates: { lat: 41.8955, lng: 12.4823 },
        stats: {
          total_spent: 0,
          average_intervention_cost: 0,
          punctuality_score: 0,
          payment_reliability: 0,
          last_contact_date: new Date("2024-11-15"),
        },
        intervention_history: [],
        payment_history: [],
      },
      {
        customer_id: "8",
        name: "Hotel Luxury",
        surname: "S.p.A.",
        email: "manutenzione@hotelluxury.it",
        phone: "+39 06 98765432",
        address: "Via Veneto 150",
        city: "Roma",
        zip_code: "00187",
        country: "Italia",
        company_name: "Hotel Luxury S.p.A.",
        vat_number: "IT11223344556",
        tax_code: "11223344556",
        status: "active",
        customer_type: "business",
        created_at: new Date("2024-03-01"),
        updated_at: new Date("2024-03-01"),
        created_by: "admin",
        total_interventions: 12,
        last_intervention_date: new Date("2024-11-25"),
        customer_value: 6200,
        customer_rating: 5,
        preferred_contact_method: "email",
        communication_preferences: {
          receive_reminders: true,
          receive_promotions: false,
          receive_maintenance_alerts: true,
        },
        coordinates: { lat: 41.9073, lng: 12.4906 },
        stats: {
          total_spent: 6200,
          average_intervention_cost: 516.67,
          punctuality_score: 10,
          payment_reliability: 10,
          last_contact_date: new Date("2024-11-25"),
        },
        recurring_problems: ["Climatizzazione camere", "Impianti idraulici"],
        preferred_technician_id: "2",
        preferred_technician_name: "Anna Rossi",
        intervention_history: [
          {
            intervention_id: "10",
            date: new Date("2024-11-25"),
            type: "Manutenzione",
            technician_name: "Anna Rossi",
            cost: 800,
            problem_description: "Manutenzione climatizzatori suite presidenziali",
            solution_description: "Pulizia completa e sostituzione filtri",
            customer_satisfaction: 5,
            status: "completed",
          }
        ],
        payment_history: [
          {
            payment_id: "10",
            intervention_id: "10",
            date: new Date("2024-11-25"),
            amount: 800,
            method: "bank_transfer",
            status: "paid",
            invoice_number: "INV-2024-010",
          }
        ],
      },
      {
        customer_id: "9",
        name: "Marco",
        surname: "Ferrari",
        email: "marco.ferrari@yahoo.it",
        phone: "+39 347 9999999",
        address: "Corso Buenos Aires 200",
        city: "Milano",
        zip_code: "20124",
        country: "Italia",
        status: "inactive",
        customer_type: "private",
        created_at: new Date("2023-12-10"),
        updated_at: new Date("2024-06-15"),
        created_by: "admin",
        total_interventions: 5,
        last_intervention_date: new Date("2024-06-15"),
        customer_value: 1200,
        customer_rating: 2,
        preferred_contact_method: "email",
        communication_preferences: {
          receive_reminders: false,
          receive_promotions: false,
          receive_maintenance_alerts: false,
        },
        coordinates: { lat: 45.4781, lng: 9.2072 },
        stats: {
          total_spent: 1200,
          average_intervention_cost: 240,
          punctuality_score: 4,
          payment_reliability: 5,
          last_contact_date: new Date("2024-06-15"),
        },
        recurring_problems: ["Problemi elettrici", "Lamentele continue"],
        intervention_history: [
          {
            intervention_id: "11",
            date: new Date("2024-06-15"),
            type: "Riparazione",
            technician_name: "Luca Bianchi",
            cost: 200,
            problem_description: "Interruttore che salta continuamente",
            solution_description: "Controllo impianto, nessun problema rilevato",
            customer_satisfaction: 2,
            status: "completed",
          }
        ],
        payment_history: [
          {
            payment_id: "11",
            intervention_id: "11",
            date: new Date("2024-07-20"),
            amount: 200,
            method: "cash",
            status: "overdue",
            invoice_number: "INV-2024-011",
          }
        ],
      },
      {
        customer_id: "10",
        name: "Condominio Sole",
        surname: "",
        email: "amministratore@condominiosole.it",
        phone: "+39 02 55555555",
        address: "Via Padova 123",
        city: "Milano",
        zip_code: "20127",
        country: "Italia",
        company_name: "Condominio Sole",
        vat_number: "IT55667788990",
        status: "active",
        customer_type: "business",
        created_at: new Date("2024-02-01"),
        updated_at: new Date("2024-02-01"),
        created_by: "admin",
        total_interventions: 20,
        last_intervention_date: new Date("2024-12-05"),
        customer_value: 12500,
        customer_rating: 4,
        preferred_contact_method: "phone",
        communication_preferences: {
          receive_reminders: true,
          receive_promotions: false,
          receive_maintenance_alerts: true,
        },
        coordinates: { lat: 45.5311, lng: 9.2107 },
        stats: {
          total_spent: 12500,
          average_intervention_cost: 625,
          punctuality_score: 8,
          payment_reliability: 9,
          last_contact_date: new Date("2024-12-05"),
        },
        recurring_problems: ["Caldaia condominiale", "Ascensori", "Impianto elettrico comune"],
        preferred_technician_id: "1",
        preferred_technician_name: "Marco Verdi",
        intervention_history: [
          {
            intervention_id: "12",
            date: new Date("2024-12-05"),
            type: "Manutenzione",
            technician_name: "Marco Verdi",
            cost: 950,
            problem_description: "Controllo annuale caldaia condominiale",
            solution_description: "Manutenzione completa e certificazione",
            customer_satisfaction: 4,
            status: "completed",
          }
        ],
        payment_history: [
          {
            payment_id: "12",
            intervention_id: "12",
            date: new Date("2024-12-05"),
            amount: 950,
            method: "bank_transfer",
            status: "paid",
            invoice_number: "INV-2024-012",
          }
        ],
      }
    ];

    const mockTechnicians: Technician[] = [
      {
        technician_id: "1",
        user_id: "1",
        name: "Marco Verdi",
        role: "Tecnico Idraulico",
        status: "active",
        specializations: [
          { specialization_id: "1", name: "Idraulica", category: "plumbing", skill_level: "expert" },
          { specialization_id: "2", name: "Riscaldamento", category: "hvac", skill_level: "advanced" }
        ],
        skill_level: "senior",
        hourly_rate: 45,
        availability_status: "available",
        total_interventions_completed: 150,
        average_completion_time: 90,
        customer_rating_average: 4.8,
        working_hours: {
          monday: { is_working_day: true, start_time: "08:00", end_time: "17:00", break_start: "12:00", break_end: "13:00" },
          tuesday: { is_working_day: true, start_time: "08:00", end_time: "17:00", break_start: "12:00", break_end: "13:00" },
          wednesday: { is_working_day: true, start_time: "08:00", end_time: "17:00", break_start: "12:00", break_end: "13:00" },
          thursday: { is_working_day: true, start_time: "08:00", end_time: "17:00", break_start: "12:00", break_end: "13:00" },
          friday: { is_working_day: true, start_time: "08:00", end_time: "17:00", break_start: "12:00", break_end: "13:00" },
          saturday: { is_working_day: false },
          sunday: { is_working_day: false }
        }
      },
      {
        technician_id: "2",
        user_id: "2",
        name: "Anna Rossi",
        role: "Tecnico Climatizzazione",
        status: "active",
        specializations: [
          { specialization_id: "3", name: "Climatizzazione", category: "hvac", skill_level: "expert" },
          { specialization_id: "4", name: "Elettrici", category: "electrical", skill_level: "intermediate" }
        ],
        skill_level: "senior",
        hourly_rate: 42,
        availability_status: "available",
        total_interventions_completed: 120,
        average_completion_time: 85,
        customer_rating_average: 4.6,
        working_hours: {
          monday: { is_working_day: true, start_time: "08:00", end_time: "17:00", break_start: "12:00", break_end: "13:00" },
          tuesday: { is_working_day: true, start_time: "08:00", end_time: "17:00", break_start: "12:00", break_end: "13:00" },
          wednesday: { is_working_day: true, start_time: "08:00", end_time: "17:00", break_start: "12:00", break_end: "13:00" },
          thursday: { is_working_day: true, start_time: "08:00", end_time: "17:00", break_start: "12:00", break_end: "13:00" },
          friday: { is_working_day: true, start_time: "08:00", end_time: "17:00", break_start: "12:00", break_end: "13:00" },
          saturday: { is_working_day: false },
          sunday: { is_working_day: false }
        }
      },
      {
        technician_id: "3",
        user_id: "3",
        name: "Luca Bianchi",
        role: "Tecnico Elettronico",
        status: "active",
        specializations: [
          { specialization_id: "5", name: "Elettrici", category: "electrical", skill_level: "expert" },
          { specialization_id: "6", name: "Domotica", category: "electronics", skill_level: "advanced" }
        ],
        skill_level: "expert",
        hourly_rate: 50,
        availability_status: "busy",
        total_interventions_completed: 200,
        average_completion_time: 75,
        customer_rating_average: 4.9,
        working_hours: {
          monday: { is_working_day: true, start_time: "08:00", end_time: "17:00", break_start: "12:00", break_end: "13:00" },
          tuesday: { is_working_day: true, start_time: "08:00", end_time: "17:00", break_start: "12:00", break_end: "13:00" },
          wednesday: { is_working_day: true, start_time: "08:00", end_time: "17:00", break_start: "12:00", break_end: "13:00" },
          thursday: { is_working_day: true, start_time: "08:00", end_time: "17:00", break_start: "12:00", break_end: "13:00" },
          friday: { is_working_day: true, start_time: "08:00", end_time: "17:00", break_start: "12:00", break_end: "13:00" },
          saturday: { is_working_day: false },
          sunday: { is_working_day: false }
        }
      }
    ];

    setCustomers(mockCustomers);
    setTechnicians(mockTechnicians);
    setLoading(false);
  };

  return (
    <div className="w-full flex flex-col p-4 gap-6 min-h-screen">
      <PageHeader
        title="Customer Control Center"
        description="Centro di controllo completo per la gestione clienti e prenotazioni"
        icon="solar:users-group-two-rounded-bold-duotone"
        size="md"
        actions={[
          {
            label: "Nuovo Cliente",
            icon: "solar:user-plus-bold",
            color: "primary",
            variant: "solid",
            onClick: onNewCustomerModalOpen,
          },
        ]}
      />
      
      {/* Ricerca e Tabella Clienti - Nascosta quando un cliente è selezionato */}
      {!selectedCustomer && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon icon="solar:users-group-two-rounded-bold-duotone" width={24} className="text-primary" />
                <h3 className="text-lg font-semibold">Tutti i Clienti</h3>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  placeholder="Cerca clienti..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  startContent={<Icon icon="solar:magnifer-bold" width={20} />}
                  className="w-80"
                />
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(searchQuery ? searchResults.map(r => r.customer) : customers).map((customer) => (
                <Card 
                  key={customer.customer_id} 
                  isPressable 
                  onPress={() => selectCustomer(customer)}
                  className="hover:bg-primary-50 cursor-pointer transition-colors"
                >
                  <CardBody className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar
                        name={`${customer.name} ${customer.surname}`}
                        size="md"
                        className="bg-primary-100 text-primary flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm truncate">
                            {customer.name} {customer.surname}
                          </h4>
                          <Chip
                            color={statusColorMap[customer.status]}
                            variant="flat"
                            size="sm"
                          >
                            {customer.status === "active" ? "Attivo" : "Inattivo"}
                          </Chip>
                        </div>
                        
                        {customer.company_name && (
                          <p className="text-xs text-default-400 mb-1 truncate">
                            {customer.company_name}
                          </p>
                        )}
                        
                        <div className="space-y-1">
                          <p className="text-xs text-default-600 flex items-center gap-1">
                            <Icon icon="solar:phone-bold" width={12} />
                            {customer.phone}
                          </p>
                          <p className="text-xs text-default-600 flex items-center gap-1">
                            <Icon icon="solar:map-point-bold" width={12} />
                            {customer.city}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs">
                            <span className="font-medium text-primary">
                              {customer.total_interventions || 0}
                            </span>
                            <span className="text-default-500"> interventi</span>
                          </div>
                          <div className="text-xs">
                            <span className="font-medium text-success">
                              €{customer.customer_value?.toFixed(0) || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
            
            {searchQuery && searchResults.length === 0 && (
              <div className="text-center py-8">
                <Icon icon="solar:user-plus-bold-duotone" width={48} className="text-default-300 mx-auto mb-4" />
                <p className="text-default-500 mb-4">Nessun cliente trovato</p>
                <Button 
                  color="primary" 
                  startContent={<Icon icon="solar:user-plus-bold" width={16} />}
                  onPress={() => {
                    console.log("Nuovo cliente button clicked");
                    onNewCustomerModalOpen();
                  }}
                >
                  Crea Nuovo Cliente
                </Button>
              </div>
            )}
            
            {!searchQuery && customers.length === 0 && (
              <div className="text-center py-8">
                <Icon icon="solar:users-group-two-rounded-bold-duotone" width={48} className="text-default-300 mx-auto mb-4" />
                <p className="text-default-500">Nessun cliente registrato</p>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Customer Dashboard */}
      {selectedCustomer && (
        <div className="space-y-6">
          {/* Pulsante Torna alla Lista */}
          <div className="flex items-center gap-3">
            <Button
              variant="light"
              startContent={<Icon icon="solar:arrow-left-bold" width={16} />}
              onPress={() => {
                setSelectedCustomer(null);
                setSearchQuery("");
                setSearchResults([]);
              }}
            >
              Torna alla Lista Clienti
            </Button>
            <div className="h-6 w-px bg-default-200" />
            <div className="flex items-center gap-2">
              <Avatar
                name={`${selectedCustomer.name} ${selectedCustomer.surname}`}
                size="sm"
                className="bg-primary-100 text-primary"
              />
              <span className="font-medium text-default-700">
                {selectedCustomer.name} {selectedCustomer.surname}
              </span>
              {selectedCustomer.company_name && (
                <span className="text-sm text-default-500">
                  • {selectedCustomer.company_name}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Customer Info & Stats */}
            <div className="lg:col-span-3 space-y-6">
              {/* Customer Header */}
              <Card>
              <CardBody className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar
                      name={`${selectedCustomer.name} ${selectedCustomer.surname}`}
                      size="lg"
                      className="bg-primary-100 text-primary"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold">
                          {selectedCustomer.name} {selectedCustomer.surname}
                        </h2>
                        <Chip
                          color={statusColorMap[selectedCustomer.status]}
                          variant="flat"
                          size="sm"
                        >
                          {selectedCustomer.status === "active" ? "Attivo" : "Inattivo"}
                        </Chip>
                        <Chip
                          color={customerTypeColorMap[selectedCustomer.customer_type]}
                          variant="flat"
                          size="sm"
                        >
                          {selectedCustomer.customer_type === "private" ? "Privato" : "Azienda"}
                        </Chip>
                      </div>
                      
                      {selectedCustomer.company_name && (
                        <p className="text-lg text-default-600 mt-1">
                          {selectedCustomer.company_name}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-2 text-sm text-default-500">
                        <span className="flex items-center gap-1">
                          <Icon icon="solar:phone-bold" width={16} />
                          {selectedCustomer.phone}
                        </span>
                        {selectedCustomer.email && (
                          <span className="flex items-center gap-1">
                            <Icon icon="solar:letter-bold" width={16} />
                            {selectedCustomer.email}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 mt-1 text-sm text-default-500">
                        <Icon icon="solar:map-point-bold" width={16} />
                        <span>{selectedCustomer.address}, {selectedCustomer.city}</span>
                      </div>
                    </div>
                  </div>
                  
             
                </div>
              </CardBody>
            </Card>

            {/* Customer Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardBody className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">
                    {selectedCustomer.total_interventions || 0}
                  </div>
                  <p className="text-sm text-default-500">Interventi</p>
                </CardBody>
              </Card>
              
              <Card>
                <CardBody className="p-4 text-center">
                  <div className="text-2xl font-bold text-success">
                    €{selectedCustomer.customer_value?.toFixed(0) || 0}
                  </div>
                  <p className="text-sm text-default-500">Valore Cliente</p>
                </CardBody>
              </Card>
              
              <Card>
                <CardBody className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <div className="text-2xl font-bold text-warning">
                      {selectedCustomer.customer_rating || 0}
                    </div>
                    <Icon icon="solar:star-bold" width={20} className="text-warning" />
                  </div>
                  <p className="text-sm text-default-500">Rating</p>
                </CardBody>
              </Card>
              
              <Card>
                <CardBody className="p-4 text-center">
                  <div className="text-2xl font-bold text-secondary">
                    {selectedCustomer.stats?.payment_reliability || 0}/10
                  </div>
                  <p className="text-sm text-default-500">Affidabilità</p>
                </CardBody>
              </Card>
            </div>

            {/* Customer Details Tabs */}
            <Card>
              <CardBody className="p-0">
                <Tabs 
                  selectedKey={selectedTab} 
                  onSelectionChange={(key) => setSelectedTab(key as string)}
                  className="p-4"
                >
                  <Tab key="overview" title="Panoramica">
                    <div className="space-y-4 mt-4">
                      {/* Referral System */}
                      {(selectedCustomer.referred_by || selectedCustomer.referrals) && (
                        <Card>
                          <CardHeader>
                            <h4 className="font-semibold flex items-center gap-2">
                              <Icon icon="solar:users-group-rounded-bold" width={20} />
                              Sistema Referenze
                            </h4>
                          </CardHeader>
                          <CardBody>
                            <div className="space-y-3">
                              {selectedCustomer.referred_by && (
                                <div className="flex items-center gap-2 p-3 bg-success-50 rounded-lg">
                                  <Icon icon="solar:user-check-bold" width={20} className="text-success" />
                                  <span className="text-sm">
                                    Portato da: <strong>{selectedCustomer.referred_by_name}</strong>
                                  </span>
                                </div>
                              )}
                              
                              {selectedCustomer.referrals && selectedCustomer.referrals.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium mb-2">Ha portato:</p>
                                  <div className="space-y-2">
                                    {selectedCustomer.referrals.map((referral) => (
                                      <div key={referral.referral_id} className="flex items-center justify-between p-2 bg-primary-50 rounded">
                                        <span className="text-sm">{referral.referred_customer_name}</span>
                                        <Chip size="sm" color="primary" variant="flat">
                                          €{referral.commission_earned || 0}
                                        </Chip>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardBody>
                        </Card>
                      )}

                      {/* Recurring Problems */}
                      {selectedCustomer.recurring_problems && selectedCustomer.recurring_problems.length > 0 && (
                        <Card>
                          <CardHeader>
                            <h4 className="font-semibold flex items-center gap-2">
                              <Icon icon="solar:danger-triangle-bold" width={20} />
                              Problemi Ricorrenti
                            </h4>
                          </CardHeader>
                          <CardBody>
                            <div className="flex flex-wrap gap-2">
                              {selectedCustomer.recurring_problems.map((problem, index) => (
                                <Chip key={index} color="warning" variant="flat" size="sm">
                                  {problem}
                                </Chip>
                              ))}
                            </div>
                          </CardBody>
                        </Card>
                      )}

                      {/* Preferred Technician */}
                      {selectedCustomer.preferred_technician_name && (
                        <Card>
                          <CardHeader>
                            <h4 className="font-semibold flex items-center gap-2">
                              <Icon icon="solar:user-heart-bold" width={20} />
                              Tecnico Preferito
                            </h4>
                          </CardHeader>
                          <CardBody>
                            <div className="flex items-center gap-3">
                              <Avatar
                                name={selectedCustomer.preferred_technician_name}
                                size="sm"
                                className="bg-secondary-100 text-secondary"
                              />
                              <span className="font-medium">{selectedCustomer.preferred_technician_name}</span>
                            </div>
                          </CardBody>
                        </Card>
                      )}
                    </div>
                  </Tab>
                  
                  <Tab key="history" title="Storico Interventi">
                    <div className="space-y-4 mt-4">
                      {selectedCustomer.intervention_history && selectedCustomer.intervention_history.length > 0 ? (
                        selectedCustomer.intervention_history.map((intervention) => (
                          <Card key={intervention.intervention_id}>
                            <CardBody className="p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h5 className="font-semibold">{intervention.type}</h5>
                                    <Chip 
                                      color={intervention.status === "completed" ? "success" : "warning"}
                                      variant="flat"
                                      size="sm"
                                    >
                                      {intervention.status === "completed" ? "Completato" : "In Corso"}
                                    </Chip>
                                  </div>
                                  <p className="text-sm text-default-600 mb-2">
                                    {intervention.problem_description}
                                  </p>
                                  {intervention.solution_description && (
                                    <p className="text-sm text-success-600 mb-2">
                                      Soluzione: {intervention.solution_description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-4 text-xs text-default-500">
                                    <span>{intervention.date.toLocaleDateString("it-IT")}</span>
                                    <span>{intervention.technician_name}</span>
                                    {intervention.customer_satisfaction && (
                                      <span className="flex items-center gap-1">
                                        <Icon icon="solar:star-bold" width={12} className="text-warning" />
                                        {intervention.customer_satisfaction}/5
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-lg">€{intervention.cost}</p>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Icon icon="solar:file-text-bold-duotone" width={48} className="text-default-300 mx-auto mb-4" />
                          <p className="text-default-500">Nessun intervento registrato</p>
                        </div>
                      )}
                    </div>
                  </Tab>
                  
                  <Tab key="payments" title="Pagamenti">
                    <div className="space-y-4 mt-4">
                      {selectedCustomer.payment_history && selectedCustomer.payment_history.length > 0 ? (
                        selectedCustomer.payment_history.map((payment) => (
                          <Card key={payment.payment_id}>
                            <CardBody className="p-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-semibold">€{payment.amount}</p>
                                  <p className="text-sm text-default-500">
                                    {payment.date.toLocaleDateString("it-IT")} • {payment.method}
                                  </p>
                                  {payment.invoice_number && (
                                    <p className="text-xs text-default-400">
                                      Fattura: {payment.invoice_number}
                                    </p>
                                  )}
                                </div>
                                <Chip
                                  color={payment.status === "paid" ? "success" : payment.status === "pending" ? "warning" : "danger"}
                                  variant="flat"
                                  size="sm"
                                >
                                  {payment.status === "paid" ? "Pagato" : payment.status === "pending" ? "In Attesa" : "Scaduto"}
                                </Chip>
                              </div>
                            </CardBody>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Icon icon="solar:card-bold-duotone" width={48} className="text-default-300 mx-auto mb-4" />
                          <p className="text-default-500">Nessun pagamento registrato</p>
                        </div>
                      )}
                    </div>
                  </Tab>
                </Tabs>
              </CardBody>
            </Card>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-6">
            {/* Quick Booking */}
            <Card>
              <CardHeader>
                <h4 className="font-semibold flex items-center gap-2">
                  <Icon icon="solar:calendar-add-bold" width={20} />
                  Prenotazione Rapida
                </h4>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <Textarea
                    label="Descrizione Problema"
                    placeholder="Descrivi il problema del cliente..."
                    value={quickBookingData.problem_description}
                    onChange={(e) => setQuickBookingData(prev => ({ ...prev, problem_description: e.target.value }))}
                    rows={3}
                  />
                  
                  <Select
                    label="Urgenza"
                    selectedKeys={[quickBookingData.urgency_level]}
                    onSelectionChange={(keys) => {
                      const level = Array.from(keys)[0] as "low" | "medium" | "high" | "emergency";
                      setQuickBookingData(prev => ({ ...prev, urgency_level: level }));
                    }}
                  >
                    <SelectItem key="low">Bassa</SelectItem>
                    <SelectItem key="medium">Media</SelectItem>
                    <SelectItem key="high">Alta</SelectItem>
                    <SelectItem key="emergency">Emergenza</SelectItem>
                  </Select>
                  
                  <Select
                    label="Tipo Intervento"
                    selectedKeys={[quickBookingData.intervention_type]}
                    onSelectionChange={(keys) => {
                      const type = Array.from(keys)[0] as "inspection" | "repair" | "maintenance" | "installation" | "consultation";
                      setQuickBookingData(prev => ({ ...prev, intervention_type: type }));
                    }}
                  >
                    <SelectItem key="inspection">Sopralluogo</SelectItem>
                    <SelectItem key="repair">Riparazione</SelectItem>
                    <SelectItem key="maintenance">Manutenzione</SelectItem>
                    <SelectItem key="installation">Installazione</SelectItem>
                    <SelectItem key="consultation">Consulenza</SelectItem>
                  </Select>
                  
                  <Button
                    color="primary"
                    className="w-full"
                    onPress={() => {
                      console.log("Quick booking button clicked", quickBookingData);
                      onBookingModalOpen();
                    }}
                    startContent={<Icon icon="solar:calendar-add-bold" width={16} />}
                  >
                    Prenota Intervento
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Contatti Rapidi */}
            <Card>
              <CardHeader>
                <h4 className="font-semibold flex items-center gap-2">
                  <Icon icon="solar:phone-bold" width={20} />
                  Contatti
                </h4>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2 bg-default-50 rounded">
                    <Icon icon="solar:phone-bold" width={16} className="text-primary" />
                    <a 
                      href={`tel:${selectedCustomer.phone}`}
                      className="text-sm font-medium text-primary hover:text-primary-600"
                    >
                      {selectedCustomer.phone}
                    </a>
                  </div>
                  
                  {selectedCustomer.email && (
                    <div className="flex items-center gap-2 p-2 bg-default-50 rounded">
                      <Icon icon="solar:letter-bold" width={16} className="text-primary" />
                      <a 
                        href={`mailto:${selectedCustomer.email}`}
                        className="text-sm font-medium text-primary hover:text-primary-600 truncate"
                      >
                        {selectedCustomer.email}
                      </a>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Customer Info */}
            <Card>
              <CardHeader>
                <h4 className="font-semibold flex items-center gap-2">
                  <Icon icon="solar:info-circle-bold" width={20} />
                  Informazioni
                </h4>
              </CardHeader>
              <CardBody>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-default-500">Cliente dal:</p>
                    <p className="font-medium">{selectedCustomer.created_at.toLocaleDateString("it-IT")}</p>
                  </div>
                  
                  {selectedCustomer.last_intervention_date && (
                    <div>
                      <p className="text-default-500">Ultimo intervento:</p>
                      <p className="font-medium">{selectedCustomer.last_intervention_date.toLocaleDateString("it-IT")}</p>
                    </div>
                  )}
                  
                  {selectedCustomer.vat_number && (
                    <div>
                      <p className="text-default-500">Partita IVA:</p>
                      <p className="font-medium">{selectedCustomer.vat_number}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-default-500">Metodo contatto preferito:</p>
                    <p className="font-medium capitalize">{selectedCustomer.preferred_contact_method}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
                      </div>
          </div>
        </div>
      )}

      {/* Modal Nuovo Cliente */}
      <Modal isOpen={isNewCustomerModalOpen} onClose={onNewCustomerModalClose} size="2xl">
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-semibold">Nuovo Cliente</h3>
          </ModalHeader>
          <ModalBody>
            <div className="text-center py-8">
              <Icon icon="solar:settings-bold-duotone" width={48} className="text-default-300 mx-auto mb-4" />
              <p className="text-default-500">Funzionalità in sviluppo</p>
              <p className="text-sm text-default-400 mt-2">
                Il form per aggiungere nuovi clienti sarà disponibile presto
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onNewCustomerModalClose}>
              Chiudi
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Prenotazione */}
      <Modal isOpen={isBookingModalOpen} onClose={onBookingModalClose} size="3xl">
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-semibold">Prenota Intervento</h3>
            {selectedCustomer && (
              <p className="text-sm text-default-500">
                Cliente: {selectedCustomer.name} {selectedCustomer.surname}
              </p>
            )}
          </ModalHeader>
          <ModalBody>
            <div className="text-center py-8">
              <Icon icon="solar:calendar-add-bold-duotone" width={48} className="text-default-300 mx-auto mb-4" />
              <p className="text-default-500">Funzionalità in sviluppo</p>
              <p className="text-sm text-default-400 mt-2">
                Il sistema di prenotazione completo sarà disponibile presto
              </p>
              {quickBookingData.problem_description && (
                <div className="mt-4 p-3 bg-default-50 rounded-lg text-left">
                  <p className="text-sm font-medium">Problema descritto:</p>
                  <p className="text-sm text-default-600">{quickBookingData.problem_description}</p>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onBookingModalClose}>
              Chiudi
            </Button>
            <Button color="primary" onPress={onBookingModalClose}>
              Conferma (Demo)
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      </div>
    );
  } 