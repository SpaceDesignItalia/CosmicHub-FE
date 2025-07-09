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
  Selection,
  SortDescriptor,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { Customer } from "../../types/Customer";
import PageHeader from "../../Components/Layout/PageHeader";

const statusColorMap = {
  active: "success",
  inactive: "danger",
} as const;

const customerTypeColorMap = {
  private: "primary",
  business: "warning",
} as const;

const columns = [
  { name: "CLIENTE", uid: "name", sortable: true },
  { name: "TIPO", uid: "customer_type", sortable: true },
  { name: "TELEFONO", uid: "phone" },
  { name: "EMAIL", uid: "email" },
  { name: "CITTÀ", uid: "city", sortable: true },
  { name: "INTERVENTI", uid: "total_interventions", sortable: true },
  { name: "STATO", uid: "status", sortable: true },
  { name: "AZIONI", uid: "actions" },
];

export default function Customers() {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterValue, setFilterValue] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState<Selection>(
    new Set(columns.map((col) => col.uid))
  );
  const [statusFilter, setStatusFilter] = useState<Selection>("all");
  const [customerTypeFilter, setCustomerTypeFilter] = useState<Selection>("all");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "name",
    direction: "ascending",
  });
  const [page, setPage] = useState(1);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Mock data - sostituire con chiamata API reale
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
        created_at: new Date("2024-01-15"),
        updated_at: new Date("2024-01-15"),
        created_by: "admin",
        total_interventions: 5,
        last_intervention_date: new Date("2024-11-20"),
        customer_value: 2500,
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
        vat_number: "IT12345678901",
        tax_code: "12345678901",
        status: "active",
        customer_type: "business",
        created_at: new Date("2024-02-10"),
        updated_at: new Date("2024-02-10"),
        created_by: "admin",
        total_interventions: 12,
        last_intervention_date: new Date("2024-12-01"),
        customer_value: 8500,
      },
    ];

    setTimeout(() => {
      setCustomers(mockCustomers);
      setLoading(false);
    }, 1000);
  }, []);

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = useMemo(() => {
    if (visibleColumns === "all") return columns;
    return columns.filter((column) => Array.from(visibleColumns).includes(column.uid));
  }, [visibleColumns]);

  const filteredItems = useMemo(() => {
    let filteredCustomers = [...customers];

    if (hasSearchFilter) {
      filteredCustomers = filteredCustomers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(filterValue.toLowerCase()) ||
          customer.surname.toLowerCase().includes(filterValue.toLowerCase()) ||
          customer.email?.toLowerCase().includes(filterValue.toLowerCase()) ||
          customer.phone.includes(filterValue) ||
          customer.city.toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    if (statusFilter !== "all" && Array.from(statusFilter).length !== 2) {
      filteredCustomers = filteredCustomers.filter((customer) =>
        Array.from(statusFilter).includes(customer.status)
      );
    }

    if (customerTypeFilter !== "all" && Array.from(customerTypeFilter).length !== 2) {
      filteredCustomers = filteredCustomers.filter((customer) =>
        Array.from(customerTypeFilter).includes(customer.customer_type)
      );
    }

    return filteredCustomers;
  }, [customers, filterValue, statusFilter, customerTypeFilter, hasSearchFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a: Customer, b: Customer) => {
      const first = a[sortDescriptor.column as keyof Customer] as number | string;
      const second = b[sortDescriptor.column as keyof Customer] as number | string;
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const renderCell = React.useCallback((customer: Customer, columnKey: React.Key) => {
    const cellValue = customer[columnKey as keyof Customer];

    switch (columnKey) {
      case "name":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">
              {`${customer.name} ${customer.surname}`}
            </p>
            {customer.company_name && (
              <p className="text-bold text-tiny capitalize text-default-400">
                {customer.company_name}
              </p>
            )}
          </div>
        );
      case "customer_type":
        return (
          <Chip
            className="capitalize"
            color={customerTypeColorMap[customer.customer_type]}
            size="sm"
            variant="flat"
          >
            {customer.customer_type === "private" ? "Privato" : "Azienda"}
          </Chip>
        );
      case "phone":
        return <p className="text-small">{customer.phone}</p>;
      case "email":
        return <p className="text-small">{customer.email || "N/A"}</p>;
      case "city":
        return <p className="text-small">{customer.city}</p>;
      case "total_interventions":
        return <p className="text-small">{customer.total_interventions || 0}</p>;
      case "status":
        return (
          <Chip
            className="capitalize"
            color={statusColorMap[customer.status]}
            size="sm"
            variant="flat"
          >
            {customer.status === "active" ? "Attivo" : "Inattivo"}
          </Chip>
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
                  onPress={() => navigate(`/customers/${customer.customer_id}`)}
                >
                  Visualizza
                </DropdownItem>
                <DropdownItem
                  key="edit"
                  startContent={<Icon icon="solar:pen-bold" width={16} />}
                  onPress={() => navigate(`/customers/edit/${customer.customer_id}`)}
                >
                  Modifica
                </DropdownItem>
                <DropdownItem
                  key="call"
                  startContent={<Icon icon="solar:phone-bold" width={16} />}
                  onPress={() => navigate(`/calls/new?customer_id=${customer.customer_id}`)}
                >
                  Nuova Chiamata
                </DropdownItem>
                <DropdownItem
                  key="appointment"
                  startContent={<Icon icon="solar:calendar-add-bold" width={16} />}
                  onPress={() => navigate(`/calendar/new?customer_id=${customer.customer_id}`)}
                >
                  Nuovo Appuntamento
                </DropdownItem>
                <DropdownItem
                  key="delete"
                  className="text-danger"
                  color="danger"
                  startContent={<Icon icon="solar:trash-bin-trash-bold" width={16} />}
                  onPress={() => {
                    setCustomerToDelete(customer);
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
  }, [navigate, onOpen]);

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
            placeholder="Cerca per nome, email, telefono..."
            startContent={<Icon icon="solar:magnifer-linear" width={16} />}
            value={filterValue}
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
                <DropdownItem key="active">Attivo</DropdownItem>
                <DropdownItem key="inactive">Inattivo</DropdownItem>
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={<Icon icon="solar:alt-arrow-down-linear" width={16} />}
                  variant="flat"
                >
                  Tipo
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Customer Type Filter"
                closeOnSelect={false}
                selectedKeys={customerTypeFilter}
                selectionMode="multiple"
                onSelectionChange={setCustomerTypeFilter}
              >
                <DropdownItem key="private">Privato</DropdownItem>
                <DropdownItem key="business">Azienda</DropdownItem>
              </DropdownMenu>
            </Dropdown>
            <Button
              color="primary"
              endContent={<Icon icon="solar:add-circle-bold" width={16} />}
              onPress={() => navigate("/customers/add")}
            >
              Nuovo Cliente
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            Totale {customers.length} clienti
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
  }, [filterValue, statusFilter, customerTypeFilter, customers.length, onSearchChange, onClear, navigate]);

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
          <Button isDisabled={pages === 1} size="sm" variant="flat" onPress={() => setPage(1)}>
            Primo
          </Button>
          <Button
            isDisabled={pages === 1}
            size="sm"
            variant="flat"
            onPress={() => setPage(pages)}
          >
            Ultimo
          </Button>
        </div>
      </div>
    );
  }, [selectedKeys, filteredItems.length, page, pages]);

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      // Qui implementare la chiamata API per eliminare il cliente
      console.log("Eliminating customer:", customerToDelete.customer_id);
      
      // Aggiorna la lista locale
      setCustomers(customers.filter(c => c.customer_id !== customerToDelete.customer_id));
      
      onClose();
      setCustomerToDelete(null);
    } catch (error) {
      console.error("Errore nell'eliminazione del cliente:", error);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <PageHeader
        title="Gestione Clienti"
        description="Gestisci tutti i tuoi clienti e visualizza le informazioni dettagliate"
        icon="solar:users-group-two-rounded-bold-duotone"
      />
      
      <div className="flex-1 p-6 overflow-auto">
        <Card>
          <CardBody className="px-0">
            <Table
              aria-label="Tabella clienti"
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
              <TableHeader columns={headerColumns}>
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
              <TableBody emptyContent={"Nessun cliente trovato"} items={sortedItems} isLoading={loading}>
                {(item) => (
                  <TableRow key={item.customer_id}>
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
                  Sei sicuro di voler eliminare il cliente{" "}
                  <strong>
                    {customerToDelete?.name} {customerToDelete?.surname}
                  </strong>?
                </p>
                <p className="text-danger text-small">
                  Questa azione non può essere annullata.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  Annulla
                </Button>
                <Button color="danger" onPress={handleDeleteCustomer}>
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