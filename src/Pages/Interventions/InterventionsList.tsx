import { useState, useEffect, useMemo } from "react";
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


export default function InterventionsList() {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterValue, setFilterValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<Selection>("all");
  const [priorityFilter, setPriorityFilter] = useState<Selection>("all");
  const [typeFilter] = useState<Selection>("all");
  const [customerFilter] = useState<string>("all");
  const [technicianFilter] = useState<string>("all");
  const [dateFrom] = useState<string>("");
  const [dateTo] = useState<string>("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortDescriptor] = useState<SortDescriptor>({
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

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = interventions.length;
    const assigned = interventions.filter(i => i.status === "assigned").length;
    const inProgress = interventions.filter(i => i.status === "in_progress").length;
    const completed = interventions.filter(i => i.status === "completed").length;
    const highPriority = interventions.filter(i => i.priority === "high" || i.priority === "emergency").length;

    return {
      total,
      assigned,
      inProgress,
      completed,
      highPriority,
    };
  }, [interventions]);

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
    <div className="h-screen flex flex-col bg-background p-6 gap-4 overflow-hidden">
      <PageHeader
        title="Lista Interventi"
        description="Gestisci tutti gli interventi programmati e in corso"
        icon="solar:clipboard-list-bold-duotone"
        size="md"
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border border-divider bg-content1/80">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon
                icon="solar:clipboard-list-bold-duotone"
                className="text-primary text-xl"
              />
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Totale Interventi
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {statistics.total}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="shadow-sm border border-divider bg-content1/80">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Icon
                icon="solar:calendar-mark-bold-duotone"
                className="text-blue-600 dark:text-blue-400 text-xl"
              />
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Assegnati
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {statistics.assigned}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="shadow-sm border border-divider bg-content1/80">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Icon
                icon="solar:settings-bold-duotone"
                className="text-amber-600 dark:text-amber-400 text-xl"
              />
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                In Corso
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {statistics.inProgress}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="shadow-sm border border-divider bg-content1/80">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Icon
                icon="solar:check-circle-bold-duotone"
                className="text-green-600 dark:text-green-400 text-xl"
              />
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Completati
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {statistics.completed}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
      
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0">
                <Input
                  aria-label="Cerca interventi per codice, titolo o descrizione"
                  placeholder="Cerca per codice, titolo, descrizione..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="lg"
                  startContent={
                    <Icon
                      icon="solar:magnifer-linear"
                      className="text-default-400"
                      width={20}
                    />
                  }
                  isClearable
                  onClear={() => setSearchTerm("")}
                  className="flex-1"
                />

                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      variant="flat"
                      size="lg"
                      startContent={
                        <Icon icon="solar:filter-bold" width={18} />
                      }
                      endContent={
                        <Icon icon="solar:arrow-down-linear" width={16} />
                      }
                      className="bg-default-100"
                    >
                      Stato: {Array.from(statusFilter).length === 6 || statusFilter === "all" ? "Tutti" : Array.from(statusFilter).join(", ")}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Filtro stati"
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
                  <DropdownTrigger>
                    <Button
                      variant="flat"
                      size="lg"
                      startContent={
                        <Icon icon="solar:sort-by-time-bold" width={18} />
                      }
                      endContent={
                        <Icon icon="solar:arrow-down-linear" width={16} />
                      }
                      className="bg-default-100"
                    >
                      Priorità: {Array.from(priorityFilter).length === 4 || priorityFilter === "all" ? "Tutte" : Array.from(priorityFilter).join(", ")}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Filtro priorità"
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
        </div>

        {/* Results counter */}
        <div className="flex justify-between items-center flex-shrink-0">
          <p className="text-sm text-default-500">
            Mostrando{" "}
            <span className="font-semibold text-foreground">
              {filteredItems.length}
            </span>{" "}
            di{" "}
            <span className="font-semibold text-foreground">
              {interventions.length}
            </span>{" "}
            interventi
          </p>
        </div>

        {/* Interventions Table */}
        <Card className="border-0 bg-content1/50 backdrop-blur-md flex-1 flex flex-col">
          <CardBody className="p-0 flex-1 flex flex-col">
            <Table
              aria-label="Tabella interventi"
              classNames={{
                wrapper: "flex-1 min-h-0",
                th: "bg-transparent border-b border-divider",
                td: "border-b border-divider",
              }}
            >
              <TableHeader>
                <TableColumn className="w-[12%] font-semibold">
                  CODICE
                </TableColumn>
                <TableColumn className="w-[18%] font-semibold">
                  TITOLO
                </TableColumn>
                <TableColumn className="w-[15%] font-semibold">
                  CLIENTE
                </TableColumn>
                <TableColumn className="w-[15%] font-semibold">
                  TECNICO
                </TableColumn>
                <TableColumn className="w-[12%] font-semibold">
                  DATA
                </TableColumn>
                <TableColumn className="w-[10%] font-semibold">
                  ORARIO
                </TableColumn>
                <TableColumn className="w-[8%] font-semibold">
                  STATO
                </TableColumn>
                <TableColumn className="w-[6%] font-semibold">
                  PRIORITÀ
                </TableColumn>
                <TableColumn className="w-[4%] font-semibold text-center">
                  AZIONI
                </TableColumn>
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
                {sortedItems.map((intervention) => (
                    <TableRow
                      key={intervention.intervention_id}
                      className="hover:bg-default-50 dark:hover:bg-default-950"
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <p className="text-bold text-small">{intervention.intervention_code}</p>
                          <p className="text-tiny text-default-400">{intervention.intervention_type}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <p className="text-bold text-small">{intervention.title}</p>
                          <p className="text-tiny text-default-400 truncate max-w-xs">
                            {intervention.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-small">
                          {getCustomerName(intervention.customer_id)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <p className="text-small">{getTechnicianName(intervention.assigned_technician_id)}</p>
                          {intervention.assigned_van_id && (
                            <Badge size="sm" color="secondary" variant="flat">
                              Furgone {intervention.assigned_van_id}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-small">
                          {formatDate(intervention.scheduled_date)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-small">
                          {intervention.scheduled_start_time} - {intervention.scheduled_end_time}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Chip
                          className="capitalize"
                          color={statusColorMap[intervention.status]}
                          size="sm"
                          variant="flat"
                        >
                          {getStatusLabel(intervention.status)}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          className="capitalize"
                          color={priorityColorMap[intervention.priority]}
                          size="sm"
                          variant="flat"
                        >
                          {getPriorityLabel(intervention.priority)}
                        </Chip>
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-divider bg-content1/30 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm text-default-500">
                  Righe per pagina:
                </span>
                <Select
                  size="sm"
                  selectedKeys={[rowsPerPage.toString()]}
                  onSelectionChange={(keys) => {
                    const newRowsPerPage = Number(Array.from(keys)[0]);
                    setRowsPerPage(newRowsPerPage);
                    setPage(1);
                  }}
                  className="w-20"
                >
                  <SelectItem key="5">5</SelectItem>
                  <SelectItem key="10">10</SelectItem>
                  <SelectItem key="20">20</SelectItem>
                  <SelectItem key="50">50</SelectItem>
                </Select>
              </div>

              <Pagination
                total={Math.ceil(
                  filteredItems.length / rowsPerPage
                )}
                page={page}
                onChange={setPage}
                showControls
                size="sm"
                color="primary"
                variant="bordered"
                aria-label="Paginazione interventi"
                classNames={{
                  item: "rounded-full",
                  cursor: "rounded-full",
                  prev: "rounded-full",
                  next: "rounded-full",
                }}
              />

              <div className="text-sm text-default-500">
                {(page - 1) * rowsPerPage + 1} -{" "}
                {Math.min(
                  page * rowsPerPage,
                  filteredItems.length
                )}{" "}
                di {filteredItems.length}
              </div>
            </div>
          </CardBody>
        </Card>

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
