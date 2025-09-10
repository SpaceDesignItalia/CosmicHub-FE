import React, { useState, useEffect, useMemo } from "react";
import {
  Button,
  Card,
  CardBody,
  Input,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Select,
  SelectItem,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Pagination,
  type Selection,
  type SortDescriptor,
  Badge,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import type { Intervention } from "../../types/Intervention";
import type { Customer } from "../../types/Customer";
import type { Technician } from "../../types/Technician";
import PageHeader from "../../Components/Layout/PageHeader";
import axios from "axios";

const statusColorMap = {
  assigned: "default",
  accepted: "primary",
  in_progress: "warning",
  paused: "secondary",
  completed: "success",
  cancelled: "danger",
} as const;

const priorityColorMap = {
  low: "success",
  medium: "warning",
  high: "danger",
  emergency: "danger",
} as const;

// NOTE: typeColorMap rimosso perché non utilizzato

const columns = [
  { name: "CODICE", uid: "intervention_code", sortable: true },
  { name: "TITOLO", uid: "title", sortable: true },
  { name: "CLIENTE", uid: "customer_name", sortable: true },
  { name: "TECNICO", uid: "technician_name", sortable: true },
  { name: "DATA", uid: "scheduled_date", sortable: true },
  { name: "ORARIO", uid: "scheduled_time" },
  { name: "STATO", uid: "status", sortable: true },
  { name: "PRIORITÀ", uid: "priority", sortable: true },
  { name: "AZIONI", uid: "actions" },
];

export default function InterventionsList() {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterValue, setFilterValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [statusFilter, setStatusFilter] = useState<Selection>("all");
  const [priorityFilter, setPriorityFilter] = useState<Selection>("all");
  const [typeFilter] = useState<Selection>("all");
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [technicianFilter, setTechnicianFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "scheduled_date",
    direction: "ascending",
  });
  const [page, setPage] = useState(1);
  const [interventionToDelete, setInterventionToDelete] = useState<Intervention | null>(null);

  // Caricamento da API reali
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [customersRes, techniciansRes, interventionsRes] = await Promise.all([
          axios.get("Customer/GET/GetAllCustomers"),
          axios.get("Employee/GET/GetAllEmployees"),
          axios.get("Customer/GET/GetAllEvents"),
        ]);

        // Clienti
        const customersData: Customer[] = Array.isArray(customersRes.data)
          ? customersRes.data
          : customersRes.data?.customers || customersRes.data?.data || [];

        // Tecnici (mappo Employee → Technician minimale)
        const techniciansData: Technician[] = (Array.isArray(techniciansRes.data)
          ? techniciansRes.data
          : techniciansRes.data?.employees || techniciansRes.data?.data || []
        ).map((emp: any) => ({
          technician_id: emp.user_id,
          user_id: emp.user_id,
          name: emp.name,
          phone: emp.phone || "",
          email: emp.email || "",
          profile_image: emp.profile_image || "",
          created_at: new Date(emp.created_at || Date.now()),
          updated_at: new Date(emp.updated_at || Date.now()),
          specializations: emp.specializations || [],
          skill_level: emp.skill_level || "junior",
          availability_status: emp.availability_status || "available",
          working_hours: emp.working_hours || {
            monday: { is_working_day: true, start_time: "09:00", end_time: "18:00" },
            tuesday: { is_working_day: true, start_time: "09:00", end_time: "18:00" },
            wednesday: { is_working_day: true, start_time: "09:00", end_time: "18:00" },
            thursday: { is_working_day: true, start_time: "09:00", end_time: "18:00" },
            friday: { is_working_day: true, start_time: "09:00", end_time: "18:00" },
            saturday: { is_working_day: false },
            sunday: { is_working_day: false },
          },
        }));

        // Interventi: ricopia la logica del Calendario usando GetAllEvents
        const rawEvents: any[] = Array.isArray(interventionsRes.data)
          ? interventionsRes.data
          : interventionsRes.data?.events || interventionsRes.data?.data || [];

        const mappedInterventions: Intervention[] = rawEvents.map((ev: any) => ({
          intervention_id: String(ev.EventId || ev.id || Date.now()),
          appointment_id: String(ev.AppointmentId || ev.EventId || ev.id || ""),
          customer_id: String(ev.CustomerInfo?.customer_id || ev.customer_id || ""),
          assigned_technician_id: String(ev.TechnicianAssignment?.technician_id || ev.technician_id || ""),
          assigned_van_id: ev.assigned_van_id || ev.VanId,
          intervention_code: ev.EventTagName || ev.EventCode || `EV-${ev.EventId || ""}`,
          title: ev.EventTitle || "Intervento",
          description: ev.EventDescription || "",
          intervention_type: (ev.EventType || "inspection").toLowerCase(),
          status: (ev.EventStatus || "assigned").toLowerCase(),
          priority: (() => {
            const p = ev.EventPriority || "Normale";
            if (p === "Emergenza") return "emergency";
            if (p === "Urgente") return "high";
            if (p === "Alta") return "medium";
            return "low";
          })(),
          scheduled_date: new Date(ev.EventStartDate || Date.now()),
          scheduled_start_time: ev.EventStartTime || "09:00",
          scheduled_end_time: ev.EventEndTime || "10:00",
          actual_start_time: undefined,
          actual_end_time: undefined,
          intervention_address: ev.EventLocation || "",
          intervention_city: customersData.find(c => c.customer_id === (ev.CustomerInfo?.customer_id || ""))?.city || "",
          estimated_cost: undefined,
          actual_cost: undefined,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: "system",
        }));

        setCustomers(customersData);
        setTechnicians(techniciansData);
        setInterventions(mappedInterventions);
      } catch (error) {
        console.error("Errore caricamento interventi:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const hasSearchFilter = Boolean(filterValue);

  // Debounce per la ricerca
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilterValue(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const filteredItems = useMemo(() => {
    let filteredInterventions = [...interventions];

    if (hasSearchFilter) {
      filteredInterventions = filteredInterventions.filter(
        (intervention) =>
          intervention.intervention_code.toLowerCase().includes(filterValue.toLowerCase()) ||
          intervention.title.toLowerCase().includes(filterValue.toLowerCase()) ||
          intervention.description.toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    if (statusFilter !== "all" && Array.from(statusFilter).length !== 6) {
      filteredInterventions = filteredInterventions.filter((intervention) =>
        Array.from(statusFilter).includes(intervention.status)
      );
    }

    if (priorityFilter !== "all" && Array.from(priorityFilter).length !== 4) {
      filteredInterventions = filteredInterventions.filter((intervention) =>
        Array.from(priorityFilter).includes(intervention.priority)
      );
    }

    if (typeFilter !== "all" && Array.from(typeFilter).length !== 5) {
      filteredInterventions = filteredInterventions.filter((intervention) =>
        Array.from(typeFilter).includes(intervention.intervention_type)
      );
    }

    if (customerFilter !== "all") {
      filteredInterventions = filteredInterventions.filter(
        (intervention) => intervention.customer_id === customerFilter
      );
    }

    if (technicianFilter !== "all") {
      filteredInterventions = filteredInterventions.filter(
        (intervention) => intervention.assigned_technician_id === technicianFilter
      );
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      filteredInterventions = filteredInterventions.filter(
        (intervention) => new Date(intervention.scheduled_date).getTime() >= from.getTime()
      );
    }

    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      filteredInterventions = filteredInterventions.filter(
        (intervention) => new Date(intervention.scheduled_date).getTime() <= to.getTime()
      );
    }

    return filteredInterventions;
  }, [
    interventions,
    filterValue,
    statusFilter,
    priorityFilter,
    typeFilter,
    hasSearchFilter,
    customerFilter,
    technicianFilter,
    dateFrom,
    dateTo,
  ]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a: Intervention, b: Intervention) => {
      let first = a[sortDescriptor.column as keyof Intervention] as any;
      let second = b[sortDescriptor.column as keyof Intervention] as any;

      if (sortDescriptor.column === "scheduled_date") {
        first = new Date(first).getTime();
        second = new Date(second).getTime();
      }

      const cmp = first < second ? -1 : first > second ? 1 : 0;
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.customer_id === customerId);
    return customer ? `${customer.name} ${customer.surname}` : "N/A";
  };

  const getTechnicianName = (technicianId: string) => {
    const technician = technicians.find((t) => t.technician_id === technicianId);
    return technician ? technician.name : "N/A";
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      assigned: "Assegnato",
      accepted: "Accettato",
      in_progress: "In Corso",
      paused: "In Pausa",
      completed: "Completato",
      cancelled: "Annullato"
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      low: "Bassa",
      medium: "Media",
      high: "Alta",
      emergency: "Emergenza"
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  // const getTypeLabel = (type: string) => {
  //   const labels = {
  //     inspection: "Ispezione",
  //     repair: "Riparazione",
  //     maintenance: "Manutenzione",
  //     installation: "Installazione",
  //     emergency: "Emergenza"
  //   };
  //   return labels[type as keyof typeof labels] || type;
  // };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const renderCell = React.useCallback((intervention: Intervention, columnKey: React.Key) => {
    const cellValue = intervention[columnKey as keyof Intervention];

    switch (columnKey) {
      case "intervention_code":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">{intervention.intervention_code}</p>
            <p className="text-tiny text-default-400">{intervention.intervention_type}</p>
          </div>
        );
      case "title":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">{intervention.title}</p>
            <p className="text-tiny text-default-400 truncate max-w-xs">
              {intervention.description}
            </p>
          </div>
        );
      case "customer_name":
        return (
          <p className="text-small">
            {getCustomerName(intervention.customer_id)}
          </p>
        );
      case "technician_name":
        return (
          <div className="flex flex-col">
            <p className="text-small">{getTechnicianName(intervention.assigned_technician_id)}</p>
            {intervention.assigned_van_id && (
              <Badge size="sm" color="secondary" variant="flat">
                Furgone {intervention.assigned_van_id}
              </Badge>
            )}
          </div>
        );
      case "scheduled_date":
        return (
          <p className="text-small">
            {formatDate(intervention.scheduled_date)}
          </p>
        );
      case "scheduled_time":
        return (
          <p className="text-small">
            {intervention.scheduled_start_time} - {intervention.scheduled_end_time}
          </p>
        );
      case "status":
        return (
          <Chip
            className="capitalize"
            color={statusColorMap[intervention.status]}
            size="sm"
            variant="flat"
          >
            {getStatusLabel(intervention.status)}
          </Chip>
        );
      case "priority":
        return (
          <Chip
            className="capitalize"
            color={priorityColorMap[intervention.priority]}
            size="sm"
            variant="flat"
          >
            {getPriorityLabel(intervention.priority)}
          </Chip>
        );
      case "actions":
        return (
          <div className="relative flex justify-end items-center gap-2">
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly size="sm" variant="light" className="hover:bg-default-100">
                  <Icon icon="nimbus:ellipsis" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Azioni intervento">
                <DropdownItem
                  key="view"
                  startContent={<Icon icon="solar:eye-bold" width={16} />}
                  onPress={() => navigate(`/interventions/${intervention.intervention_id}`)}
                >
                  Visualizza
                </DropdownItem>
                <DropdownItem
                  key="edit"
                  startContent={<Icon icon="solar:pen-bold" width={16} />}
                  onPress={() => navigate(`/interventions/edit/${intervention.intervention_id}`)}
                >
                  Modifica
                </DropdownItem>
                <DropdownItem
                  key="start"
                  startContent={<Icon icon="solar:play-circle-bold" width={16} />}
                  onPress={() => navigate(`/interventions/start/${intervention.intervention_id}`)}
                >
                  Avvia Intervento
                </DropdownItem>
                <DropdownItem
                  key="complete"
                  startContent={<Icon icon="solar:check-circle-bold" width={16} />}
                  onPress={() => navigate(`/interventions/complete/${intervention.intervention_id}`)}
                >
                  Completa
                </DropdownItem>
                <DropdownItem
                  key="reassign"
                  startContent={<Icon icon="solar:user-check-rounded-bold" width={16} />}
                  onPress={() => navigate(`/interventions/reassign/${intervention.intervention_id}`)}
                >
                  Ri-assegna
                </DropdownItem>
                <DropdownItem
                  key="delete"
                  className="text-danger"
                  color="danger"
                  startContent={<Icon icon="solar:trash-bin-trash-bold" width={16} />}
                  onPress={() => {
                    setInterventionToDelete(intervention);
                    onOpen();
                  }}
                >
                  Elimina
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return cellValue?.toString();
    }
  }, [navigate, onOpen, customers, technicians]);

  const onSearchChange = React.useCallback((value?: string) => {
    if (value) {
      setSearchTerm(value);
      setPage(1);
    } else {
      setSearchTerm("");
    }
  }, []);

  const onClear = React.useCallback(() => {
    setSearchTerm("");
    setPage(1);
  }, []);

  const handleResetFilters = React.useCallback(() => {
    setCustomerFilter("all");
    setTechnicianFilter("all");
    setDateFrom("");
    setDateTo("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setSearchTerm("");
    setFilterValue("");
    setPage(1);
  }, []);

  const handleExportCSV = React.useCallback(() => {
    const headers = [
      "Codice",
      "Titolo",
      "Cliente",
      "Tecnico",
      "Data",
      "Orario",
      "Stato",
      "Priorità",
    ];

    const rows = filteredItems.map((i) => [
      i.intervention_code,
      i.title,
      getCustomerName(i.customer_id),
      getTechnicianName(i.assigned_technician_id),
      formatDate(i.scheduled_date),
      `${i.scheduled_start_time} - ${i.scheduled_end_time}`,
      getStatusLabel(i.status),
      getPriorityLabel(i.priority),
    ]);

    const escapeCSV = (val: string) => '"' + String(val).replace(/"/g, '""') + '"';
    const csv = [headers, ...rows]
      .map((r) => r.map(escapeCSV).join(";"))
      .join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `interventi_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredItems, customers, technicians]);

  const customerItems = useMemo(
    () => [
      { key: "all", label: "Tutti i clienti" },
      ...customers.map((c) => ({
        key: c.customer_id,
        label: `${c.name} ${c.surname}`,
      })),
    ],
    [customers]
  );

  const technicianItems = useMemo(
    () => [
      { key: "all", label: "Tutti i tecnici" },
      ...technicians.map((t) => ({ key: t.technician_id, label: t.name })),
    ],
    [technicians]
  );

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4 bg-content2 rounded-medium p-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="Cerca per codice, titolo, descrizione..."
            startContent={<Icon icon="solar:magnifer-linear" width={16} />}
            value={searchTerm}
            onClear={() => onClear()}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={<Icon icon="solar:alt-arrow-down-linear" width={16} />}
                  variant="flat"
                >
                  Stato
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Status Filter"
                closeOnSelect={false}
                selectedKeys={statusFilter}
                selectionMode="multiple"
                onSelectionChange={setStatusFilter}
              >
                <DropdownItem key="assigned">Assegnato</DropdownItem>
                <DropdownItem key="accepted">Accettato</DropdownItem>
                <DropdownItem key="in_progress">In Corso</DropdownItem>
                <DropdownItem key="paused">In Pausa</DropdownItem>
                <DropdownItem key="completed">Completato</DropdownItem>
                <DropdownItem key="cancelled">Annullato</DropdownItem>
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={<Icon icon="solar:alt-arrow-down-linear" width={16} />}
                  variant="flat"
                >
                  Priorità
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Priority Filter"
                closeOnSelect={false}
                selectedKeys={priorityFilter}
                selectionMode="multiple"
                onSelectionChange={setPriorityFilter}
              >
                <DropdownItem key="low">Bassa</DropdownItem>
                <DropdownItem key="medium">Media</DropdownItem>
                <DropdownItem key="high">Alta</DropdownItem>
                <DropdownItem key="emergency">Emergenza</DropdownItem>
              </DropdownMenu>
            </Dropdown>
            <Button
              variant="flat"
              startContent={<Icon icon="solar:refresh-linear" width={16} />}
              onPress={handleResetFilters}
            >
              Reset
            </Button>
            <Button
              variant="flat"
              startContent={<Icon icon="solar:download-minimalistic-bold" width={16} />}
              onPress={handleExportCSV}
            >
              Export CSV
            </Button>
            <Button
              color="primary"
              endContent={<Icon icon="solar:calendar-add-bold" width={16} />}
              onPress={() => navigate("/calendar")}
            >
              Nuovo Intervento
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="flex items-center text-small text-default-500 gap-2">
            Cliente:
            <Select
              aria-label="Cliente"
              size="sm"
              variant="bordered"
              selectedKeys={new Set([customerFilter])}
              onSelectionChange={(keys) => {
                const key = Array.from(keys as Selection)[0] as string;
                setCustomerFilter(key || "all");
                setPage(1);
              }}
              className="w-full"
              items={customerItems}
            >
              {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
            </Select>
          </label>
          <label className="flex items-center text-small text-default-500 gap-2">
            Tecnico:
            <Select
              aria-label="Tecnico"
              size="sm"
              variant="bordered"
              selectedKeys={new Set([technicianFilter])}
              onSelectionChange={(keys) => {
                const key = Array.from(keys as Selection)[0] as string;
                setTechnicianFilter(key || "all");
                setPage(1);
              }}
              className="w-full"
              items={technicianItems}
            >
              {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
            </Select>
          </label>
          <label className="flex items-center text-small text-default-500 gap-2">
            Dal:
            <input
              type="date"
              className="bg-transparent outline-none text-default-700 text-small w-full border border-divider rounded-medium px-2 py-1"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className="flex items-center text-small text-default-500 gap-2">
            Al:
            <input
              type="date"
              className="bg-transparent outline-none text-default-700 text-small w-full border border-divider rounded-medium px-2 py-1"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
            />
          </label>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            Mostrati {filteredItems.length} di {interventions.length} interventi
          </span>
          <div className="flex items-center text-default-400 text-small gap-2">
            <span>Righe per pagina:</span>
            <Select
              aria-label="Righe per pagina"
              size="sm"
              variant="bordered"
              selectedKeys={new Set([String(rowsPerPage)])}
              onSelectionChange={(keys) => {
                const key = Array.from(keys as Selection)[0] as string;
                const value = parseInt(key, 10);
                if (!Number.isNaN(value)) {
                  setRowsPerPage(value);
                  setPage(1);
                }
              }}
              className="w-24"
            >
              <SelectItem key="5">5</SelectItem>
              <SelectItem key="10">10</SelectItem>
              <SelectItem key="15">15</SelectItem>
            </Select>
          </div>
        </div>
      </div>
    );
  }, [
    searchTerm,
    statusFilter,
    priorityFilter,
    interventions.length,
    onSearchChange,
    onClear,
    navigate,
    customers,
    technicians,
    customerFilter,
    technicianFilter,
    dateFrom,
    dateTo,
    filteredItems.length,
    handleResetFilters,
    handleExportCSV,
  ]);

  const bottomContent = useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center bg-content2 rounded-medium">
        <span className="w-[30%] text-small text-default-400">
          {selectedKeys === "all"
            ? "Tutti gli elementi selezionati"
            : `${selectedKeys.size} di ${filteredItems.length} selezionati`}
        </span>
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={page}
          total={pages}
          onChange={setPage}
        />
        <div className="hidden sm:flex w-[30%] justify-end gap-2">
          <Button isDisabled={pages === 1} size="sm" variant="flat" onPress={() => setPage(1)}>
            Prima
          </Button>
          <Button
            isDisabled={pages === 1}
            size="sm"
            variant="flat"
            onPress={() => setPage(pages)}
          >
            Ultima
          </Button>
        </div>
      </div>
    );
  }, [selectedKeys, filteredItems.length, page, pages]);

  const handleDeleteIntervention = async () => {
    if (!interventionToDelete) return;

    try {
      // Qui implementare la chiamata API per eliminare l'intervento
      console.log("Eliminating intervention:", interventionToDelete.intervention_id);
      
      // Aggiorna la lista locale
      setInterventions(interventions.filter(i => i.intervention_id !== interventionToDelete.intervention_id));
      
      onClose();
      setInterventionToDelete(null);
    } catch (error) {
      console.error("Errore nell'eliminazione dell'intervento:", error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background p-6 gap-6">
      <PageHeader
        title="Lista Interventi"
        description="Gestisci tutti gli interventi programmati e in corso"
        icon="solar:clipboard-list-bold-duotone"
        size="md"
      />
      
      <div className="flex-1 overflow-hidden">
        <Card className="h-full flex-1 flex flex-col">
          <CardBody className="px-0 flex-1 flex flex-col">
            <Table
              aria-label="Tabella interventi"
              isHeaderSticky
              bottomContent={bottomContent}
              bottomContentPlacement="inside"
              classNames={{
                th: [
                  "bg-default-100",
                  "text-default-800",
                  "border-b border-divider",
                  "py-3 px-4",
                ],
                td: ["py-3 px-4", "border-b border-divider"],
                wrapper: "border border-divider rounded-lg flex-1 overflow-auto bg-content1 shadow-sm",
                tr: "cursor-pointer hover:bg-default-50",
              }}
              selectedKeys={selectedKeys}
              selectionMode="multiple"
              selectionBehavior="toggle"
              sortDescriptor={sortDescriptor}
              topContent={topContent}
              topContentPlacement="inside"
              onSelectionChange={setSelectedKeys}
              onSortChange={setSortDescriptor}
              isStriped
            >
              <TableHeader columns={columns}>
                {(column) => (
                  <TableColumn
                    key={column.uid}
                    align={column.uid === "actions" ? "center" : "start"}
                    allowsSorting={column.sortable}
                    className={column.uid === "actions" ? "text-center" : undefined}
                  >
                    {column.name}
                  </TableColumn>
                )}
              </TableHeader>
              <TableBody
                emptyContent={
                  <div className="flex flex-col items-center justify-center py-10 text-center text-default-500">
                    <Icon icon="solar:calendar-bold-duotone" width={48} />
                    <p className="mt-2">Nessun intervento trovato</p>
                    <Button className="mt-4" color="primary" onPress={() => navigate('/calendar')}>
                      Vai al Calendario
                    </Button>
                  </div>
                }
                items={sortedItems}
                isLoading={loading}
              >
                {(item) => (
                  <TableRow key={item.intervention_id}>
                    {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>

      {/* Modal conferma eliminazione */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Conferma Eliminazione
              </ModalHeader>
              <ModalBody>
                <p>
                  Sei sicuro di voler eliminare l'intervento{" "}
                  <strong>{interventionToDelete?.intervention_code}</strong>?
                </p>
                <p className="text-danger text-small">
                  Questa azione non può essere annullata.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  Annulla
                </Button>
                <Button color="danger" onPress={handleDeleteIntervention}>
                  Elimina
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
} 
