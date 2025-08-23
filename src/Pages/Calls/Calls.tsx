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
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import type { Call } from "../../types/Call";
import PageHeader from "../../Components/Layout/PageHeader";

const urgencyColorMap = {
  low: "success",
  medium: "warning",
  high: "danger",
  emergency: "danger",
} as const;

const statusColorMap = {
  pending: "default",
  appointment_scheduled: "primary",
  intervention_assigned: "warning",
  completed: "success",
  cancelled: "danger",
} as const;

const sourceColorMap = {
  phone: "primary",
  email: "secondary",
  whatsapp: "success",
  website: "warning",
  walk_in: "default",
} as const;

const columns = [
  { name: "CHIAMANTE", uid: "caller_name", sortable: true },
  { name: "TELEFONO", uid: "caller_phone" },
  { name: "DATA/ORA", uid: "call_date", sortable: true },
  { name: "URGENZA", uid: "urgency_level", sortable: true },
  { name: "FONTE", uid: "call_source", sortable: true },
  { name: "STATO", uid: "status", sortable: true },
  { name: "PROBLEMA", uid: "problem_description" },
  { name: "AZIONI", uid: "actions" },
];

export default function Calls() {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterValue, setFilterValue] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [statusFilter, setStatusFilter] = useState<Selection>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<Selection>("all");
  const [sourceFilter, setSourceFilter] = useState<Selection>("all");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "call_date",
    direction: "descending",
  });
  const [page, setPage] = useState(1);
  const [callToDelete, setCallToDelete] = useState<Call | null>(null);

  // Mock data - sostituire con chiamata API reale
  useEffect(() => {
    const mockCalls: Call[] = [
      {
        call_id: "1",
        customer_id: "1",
        caller_name: "Mario Rossi",
        caller_phone: "+39 333 1234567",
        call_date: new Date("2024-12-10T09:30:00"),
        call_time: "09:30",
        problem_description: "Perdita d'acqua dal rubinetto della cucina",
        urgency_level: "medium",
        call_source: "phone",
        status: "appointment_scheduled",
        created_by: "operator1",
        is_new_customer: false,
      },
      {
        call_id: "2",
        caller_name: "Laura Bianchi",
        caller_phone: "+39 347 9876543",
        call_date: new Date("2024-12-10T14:15:00"),
        call_time: "14:15",
        problem_description: "Guasto elettrico - saltata corrente",
        urgency_level: "high",
        call_source: "whatsapp",
        status: "pending",
        created_by: "operator2",
        is_new_customer: true,
        customer_data: {
          name: "Laura",
          surname: "Bianchi",
          email: "laura.bianchi@email.com",
          address: "Via Verdi 789",
          city: "Torino",
          zip_code: "10100",
          customer_type: "private",
        },
      },
      {
        call_id: "3",
        customer_id: "2",
        caller_name: "Tech Solutions S.r.l.",
        caller_phone: "+39 02 87654321",
        call_date: new Date("2024-12-09T16:45:00"),
        call_time: "16:45",
        problem_description:
          "Manutenzione programmata impianto climatizzazione",
        urgency_level: "low",
        call_source: "email",
        status: "intervention_assigned",
        notes: "Cliente preferisce orario mattutino",
        created_by: "operator1",
        is_new_customer: false,
      },
    ];

    setTimeout(() => {
      setCalls(mockCalls);
      setLoading(false);
    }, 1000);
  }, []);

  const hasSearchFilter = Boolean(filterValue);

  const filteredItems = useMemo(() => {
    let filteredCalls = [...calls];

    if (hasSearchFilter) {
      filteredCalls = filteredCalls.filter(
        (call) =>
          call.caller_name.toLowerCase().includes(filterValue.toLowerCase()) ||
          call.caller_phone.includes(filterValue) ||
          call.problem_description
            .toLowerCase()
            .includes(filterValue.toLowerCase())
      );
    }

    if (statusFilter !== "all" && Array.from(statusFilter).length !== 5) {
      filteredCalls = filteredCalls.filter((call) =>
        Array.from(statusFilter).includes(call.status)
      );
    }

    if (urgencyFilter !== "all" && Array.from(urgencyFilter).length !== 4) {
      filteredCalls = filteredCalls.filter((call) =>
        Array.from(urgencyFilter).includes(call.urgency_level)
      );
    }

    if (sourceFilter !== "all" && Array.from(sourceFilter).length !== 5) {
      filteredCalls = filteredCalls.filter((call) =>
        Array.from(sourceFilter).includes(call.call_source)
      );
    }

    return filteredCalls;
  }, [
    calls,
    filterValue,
    statusFilter,
    urgencyFilter,
    sourceFilter,
    hasSearchFilter,
  ]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a: Call, b: Call) => {
      let first = a[sortDescriptor.column as keyof Call] as any;
      let second = b[sortDescriptor.column as keyof Call] as any;

      if (sortDescriptor.column === "call_date") {
        first = new Date(first).getTime();
        second = new Date(second).getTime();
      }

      const cmp = first < second ? -1 : first > second ? 1 : 0;
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const formatDateTime = (date: Date, time: string) => {
    const formattedDate = new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
    return `${formattedDate} - ${time}`;
  };

  const getUrgencyLabel = (urgency: string) => {
    const labels = {
      low: "Bassa",
      medium: "Media",
      high: "Alta",
      emergency: "Emergenza",
    };
    return labels[urgency as keyof typeof labels] || urgency;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: "In Attesa",
      appointment_scheduled: "Appuntamento Fissato",
      intervention_assigned: "Intervento Assegnato",
      completed: "Completata",
      cancelled: "Annullata",
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getSourceLabel = (source: string) => {
    const labels = {
      phone: "Telefono",
      email: "Email",
      whatsapp: "WhatsApp",
      website: "Sito Web",
      walk_in: "Di Persona",
    };
    return labels[source as keyof typeof labels] || source;
  };

  const renderCell = React.useCallback(
    (call: Call, columnKey: React.Key) => {
      const cellValue = call[columnKey as keyof Call];

      switch (columnKey) {
        case "caller_name":
          return (
            <div className="flex flex-col">
              <p className="text-bold text-small">{call.caller_name}</p>
              {call.is_new_customer && (
                <Chip size="sm" color="warning" variant="flat">
                  Nuovo Cliente
                </Chip>
              )}
            </div>
          );
        case "caller_phone":
          return (
            <p className="text-small">
              <a
                href={`tel:${call.caller_phone}`}
                className="text-primary hover:underline"
              >
                {call.caller_phone}
              </a>
            </p>
          );
        case "call_date":
          return (
            <p className="text-small">
              {formatDateTime(call.call_date, call.call_time)}
            </p>
          );
        case "urgency_level":
          return (
            <Chip
              className="capitalize"
              color={urgencyColorMap[call.urgency_level]}
              size="sm"
              variant="flat"
            >
              {getUrgencyLabel(call.urgency_level)}
            </Chip>
          );
        case "call_source":
          return (
            <Chip
              className="capitalize"
              color={sourceColorMap[call.call_source]}
              size="sm"
              variant="flat"
            >
              {getSourceLabel(call.call_source)}
            </Chip>
          );
        case "status":
          return (
            <Chip
              className="capitalize"
              color={statusColorMap[call.status]}
              size="sm"
              variant="flat"
            >
              {getStatusLabel(call.status)}
            </Chip>
          );
        case "problem_description":
          return (
            <p
              className="text-small max-w-xs truncate"
              title={call.problem_description}
            >
              {call.problem_description}
            </p>
          );
        case "actions":
          return (
            <div className="relative flex justify-end items-center gap-2">
              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly size="sm" variant="light">
                    <Icon icon="solar:menu-dots-vertical-bold" width={16} />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu>
                  <DropdownItem
                    key="view"
                    startContent={<Icon icon="solar:eye-bold" width={16} />}
                    onPress={() => navigate(`/calls/${call.call_id}`)}
                  >
                    Visualizza
                  </DropdownItem>
                  {call.is_new_customer ? (
                    <DropdownItem
                      key="create_customer"
                      startContent={
                        <Icon icon="solar:user-plus-rounded-bold" width={16} />
                      }
                      onPress={() =>
                        navigate(`/customers/add?from_call=${call.call_id}`)
                      }
                    >
                      Crea Cliente
                    </DropdownItem>
                  ) : null}
                  <DropdownItem
                    key="schedule"
                    startContent={
                      <Icon icon="solar:calendar-add-bold" width={16} />
                    }
                    onPress={() =>
                      navigate(
                        `/calendar?call_id=${call.call_id}&creating_event=true`
                      )
                    }
                  >
                    Fissa Appuntamento
                  </DropdownItem>
                  <DropdownItem
                    key="assign"
                    startContent={
                      <Icon icon="solar:user-check-rounded-bold" width={16} />
                    }
                    onPress={() =>
                      navigate(`/interventions/assign?call_id=${call.call_id}`)
                    }
                  >
                    Assegna Intervento
                  </DropdownItem>
                  <DropdownItem
                    key="edit"
                    startContent={<Icon icon="solar:pen-bold" width={16} />}
                    onPress={() => navigate(`/calls/edit/${call.call_id}`)}
                  >
                    Modifica
                  </DropdownItem>
                  <DropdownItem
                    key="delete"
                    className="text-danger"
                    color="danger"
                    startContent={
                      <Icon icon="solar:trash-bin-trash-bold" width={16} />
                    }
                    onPress={() => {
                      setCallToDelete(call);
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
    },
    [navigate, onOpen]
  );

  const onSearchChange = React.useCallback((value?: string) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue("");
    }
  }, []);

  const onClear = React.useCallback(() => {
    setFilterValue("");
    setPage(1);
  }, []);

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="Cerca per nome, telefono, problema..."
            startContent={<Icon icon="solar:magnifer-linear" width={16} />}
            value={filterValue}
            onClear={() => onClear()}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={
                    <Icon icon="solar:alt-arrow-down-linear" width={16} />
                  }
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
                <DropdownItem key="pending">In Attesa</DropdownItem>
                <DropdownItem key="appointment_scheduled">
                  Appuntamento Fissato
                </DropdownItem>
                <DropdownItem key="intervention_assigned">
                  Intervento Assegnato
                </DropdownItem>
                <DropdownItem key="completed">Completata</DropdownItem>
                <DropdownItem key="cancelled">Annullata</DropdownItem>
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={
                    <Icon icon="solar:alt-arrow-down-linear" width={16} />
                  }
                  variant="flat"
                >
                  Urgenza
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Urgency Filter"
                closeOnSelect={false}
                selectedKeys={urgencyFilter}
                selectionMode="multiple"
                onSelectionChange={setUrgencyFilter}
              >
                <DropdownItem key="low">Bassa</DropdownItem>
                <DropdownItem key="medium">Media</DropdownItem>
                <DropdownItem key="high">Alta</DropdownItem>
                <DropdownItem key="emergency">Emergenza</DropdownItem>
              </DropdownMenu>
            </Dropdown>
            <Button
              color="primary"
              endContent={
                <Icon icon="solar:phone-calling-rounded-bold" width={16} />
              }
              onPress={() => navigate("/calls/new")}
            >
              Nuova Chiamata
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            Totale {calls.length} chiamate
          </span>
          <label className="flex items-center text-default-400 text-small">
            Righe per pagina:
            <select
              className="bg-transparent outline-none text-default-400 text-small ml-2"
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </label>
        </div>
      </div>
    );
  }, [
    filterValue,
    statusFilter,
    urgencyFilter,
    calls.length,
    onSearchChange,
    onClear,
    navigate,
  ]);

  const bottomContent = useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
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
          <Button
            isDisabled={pages === 1}
            size="sm"
            variant="flat"
            onPress={() => setPage(1)}
          >
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

  const handleDeleteCall = async () => {
    if (!callToDelete) return;

    try {
      // Qui implementare la chiamata API per eliminare la chiamata
      console.log("Eliminating call:", callToDelete.call_id);

      // Aggiorna la lista locale
      setCalls(calls.filter((c) => c.call_id !== callToDelete.call_id));

      onClose();
      setCallToDelete(null);
    } catch (error) {
      console.error("Errore nell'eliminazione della chiamata:", error);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <PageHeader
        title="Gestione Chiamate"
        description="Gestisci tutte le chiamate ricevute e organizza gli interventi"
        icon="solar:phone-calling-rounded-bold-duotone"
      />

      <div className="flex-1 p-6 overflow-auto">
        <Card>
          <CardBody className="px-0">
            <Table
              aria-label="Tabella chiamate"
              isHeaderSticky
              bottomContent={bottomContent}
              bottomContentPlacement="outside"
              classNames={{
                wrapper: "max-h-[382px]",
              }}
              selectedKeys={selectedKeys}
              selectionMode="multiple"
              sortDescriptor={sortDescriptor}
              topContent={topContent}
              topContentPlacement="outside"
              onSelectionChange={setSelectedKeys}
              onSortChange={setSortDescriptor}
            >
              <TableHeader columns={columns}>
                {(column) => (
                  <TableColumn
                    key={column.uid}
                    align={column.uid === "actions" ? "center" : "start"}
                    allowsSorting={column.sortable}
                  >
                    {column.name}
                  </TableColumn>
                )}
              </TableHeader>
              <TableBody
                emptyContent={"Nessuna chiamata trovata"}
                items={sortedItems}
                isLoading={loading}
              >
                {(item) => (
                  <TableRow key={item.call_id}>
                    {(columnKey) => (
                      <TableCell>{renderCell(item, columnKey)}</TableCell>
                    )}
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
                  Sei sicuro di voler eliminare la chiamata di{" "}
                  <strong>{callToDelete?.caller_name}</strong>?
                </p>
                <p className="text-danger text-small">
                  Questa azione non può essere annullata.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  Annulla
                </Button>
                <Button color="danger" onPress={handleDeleteCall}>
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
