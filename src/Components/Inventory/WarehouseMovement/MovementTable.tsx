import React, { useCallback, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Chip,
  User,
  Pagination,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  Spinner,
} from "@heroui/react";
import type { Selection, ChipProps } from "@heroui/react";
import { Icon } from "@iconify/react/dist/iconify.js";

// Types
interface Movement {
  id: string;
  date: string;
  type: "IN" | "OUT" | "TRANSFER";
  product: string;
  sku: string;
  quantity: number;
  source: string;
  destination: string;
  status: "PENDING" | "COMPLETED";
  product_id: string;
  from_warehouse_id?: string;
  from_warehouse_name?: string;
  from_vehicle_id?: string;
  from_vehicle_name?: string;
  from_vehicle_license_plate?: string;
  to_warehouse_id?: string;
  to_warehouse_name?: string;
  to_vehicle_id?: string;
  to_vehicle_name?: string;
  to_vehicle_license_plate?: string;
  from_supplier?: string;
  supplier_name?: string;
  created_by?: string;
  movement_name?: string;
  user_name?: string;
}

interface MovementTableProps {
  movements: Movement[];
  onDeleteMovement?: (id: string) => Promise<void>;
  onUpdateStatus?: (
    movementId: string,
    newStatus: "PENDING" | "COMPLETED"
  ) => void;
  sortBy?: {
    field: keyof Movement;
    direction: "asc" | "desc";
  };
  onSort?: (sort: { field: keyof Movement; direction: "asc" | "desc" }) => void;
  isLoading?: boolean;
}

interface DropdownItem {
  key: string;
  label: string;
  icon: string;
  className: string;
  onClick: () => void;
}

const statusColorMap: Record<string, ChipProps["color"]> = {
  PENDING: "warning",
  COMPLETED: "success",
};

const typeColorMap: Record<string, ChipProps["color"]> = {
  IN: "success",
  OUT: "danger",
  TRANSFER: "primary",
};

const columns = [
  { name: "DATA", uid: "date", sortable: true },
  { name: "TIPO", uid: "type", sortable: true },
  { name: "PRODOTTO", uid: "product", sortable: true },
  { name: "QUANTITÀ", uid: "quantity", sortable: true },
  { name: "ORIGINE", uid: "source", sortable: true },
  { name: "DESTINAZIONE", uid: "destination", sortable: true },
  { name: "REGISTRATO DA", uid: "user_name", sortable: true },
  { name: "STATO", uid: "status", sortable: true },
  { name: "AZIONI", uid: "actions" },
];

// Empty State Component
const EmptyState = ({ isLoading }: { isLoading?: boolean }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <Spinner size="lg" color="primary" />
        <p className="mt-4 text-default-500">Caricamento movimenti...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="p-4 rounded-full mb-4 bg-zinc-100">
        <Icon
          icon="solar:box-minimalistic-linear"
          className="w-12 h-12 text-zinc-500"
        />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-zinc-800">
        Nessun movimento trovato
      </h3>
      <p className="text-sm mb-6 text-center text-zinc-500">
        Non ci sono movimenti che corrispondono ai criteri di ricerca.
        <br />
        Prova a modificare i filtri o aggiungi nuovi movimenti.
      </p>
    </div>
  );
};

export default function MovementTable({
  movements = [],
  onDeleteMovement,
  onUpdateStatus,
  sortBy = { field: "date", direction: "desc" },
  onSort,
  isLoading = false,
}: MovementTableProps) {
  const [selectedKeys, setSelectedKeys] = React.useState<Selection>(
    new Set([])
  );
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const [page, setPage] = React.useState(1);

  // Modals
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedMovement, setSelectedMovement] =
    React.useState<Movement | null>(null);
  const {
    isOpen: isDeleteModalOpen,
    onOpen: openDeleteModal,
    onClose: closeDeleteModal,
  } = useDisclosure();
  const [movementToDelete, setMovementToDelete] =
    React.useState<Movement | null>(null);

  const filteredItems = useMemo(() => {
    if (!Array.isArray(movements)) {
      return [];
    }
    return [...movements];
  }, [movements]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a: Movement, b: Movement) => {
      const field = sortBy?.field || "date";
      const direction = sortBy?.direction === "asc" ? 1 : -1;

      let first = a[field];
      let second = b[field];

      // Special handling for date sorting
      if (field === "date") {
        // Convert dates to comparable format
        const firstDate = new Date(first as string).getTime();
        const secondDate = new Date(second as string).getTime();

        // Handle invalid dates
        if (isNaN(firstDate) && isNaN(secondDate)) return 0;
        if (isNaN(firstDate)) return 1;
        if (isNaN(secondDate)) return -1;

        return direction * (firstDate - secondDate);
      }

      // Handle string sorting
      if (typeof first === "string" && typeof second === "string") {
        return direction * first.localeCompare(second);
      }

      // Handle number sorting
      return direction * ((first as number) - (second as number));
    });
  }, [filteredItems, sortBy]);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return sortedItems.slice(start, end);
  }, [page, sortedItems, rowsPerPage]);

  const confirmDeleteMovement = (movement: Movement) => {
    setMovementToDelete(movement);
    openDeleteModal();
  };

  const handleDeleteMovement = async (id: string) => {
    if (onDeleteMovement) {
      await onDeleteMovement(id);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "IN":
        return (
          <Icon
            icon="solar:arrow-down-bold"
            className="text-success"
            width={20}
          />
        );
      case "OUT":
        return (
          <Icon icon="solar:arrow-up-bold" className="text-danger" width={20} />
        );
      case "TRANSFER":
        return (
          <Icon
            icon="solar:arrow-right-bold"
            className="text-primary"
            width={20}
          />
        );
      default:
        return null;
    }
  };

  const renderCell = useCallback(
    (movement: Movement, columnKey: React.Key) => {
      switch (columnKey) {
        case "date":
          return movement.date;
        case "type":
          return (
            <div className="flex items-center gap-2">
              {getTypeIcon(movement.type)}
              <Chip
                className="capitalize"
                color={typeColorMap[movement.type]}
                size="sm"
                variant="flat"
              >
                {movement.type}
              </Chip>
            </div>
          );
        case "product":
          return (
            <div className="flex flex-col">
              <span className="font-medium">{movement.product}</span>
              <span className="text-xs text-default-500">{movement.sku}</span>
            </div>
          );
        case "quantity":
          return (
            <div
              className={`font-medium ${
                movement.quantity < 0 ? "text-danger" : "text-success"
              }`}
            >
              {movement.quantity > 0 ? "+" : ""}
              {movement.quantity}
            </div>
          );
        case "source":
          return (
            <div className="flex flex-col">
              <span className="font-medium">
                {movement.source}
                {movement.from_vehicle_license_plate
                  ? ` (${movement.from_vehicle_license_plate})`
                  : ""}
              </span>
            </div>
          );
        case "destination":
          return (
            <div className="flex flex-col">
              <span className="font-medium">
                {movement.destination}
                {movement.to_vehicle_license_plate
                  ? ` (${movement.to_vehicle_license_plate})`
                  : ""}
              </span>
            </div>
          );
        case "user_name":
          return (
            <div className="flex items-center gap-2">
              <User
                name={movement.user_name || "N/A"}
                avatarProps={{
                  size: "sm",
                  showFallback: true,
                  name: movement.user_name || "N/A",
                }}
              />
            </div>
          );
        case "status":
          return (
            <Chip
              className="capitalize"
              color={statusColorMap[movement.status]}
              size="sm"
              variant="flat"
            >
              {movement.status}
            </Chip>
          );
        case "actions":
          const dropdownItems: DropdownItem[] = [
            {
              key: "view",
              label: "Visualizza",
              icon: "solar:eye-bold",
              className:
                "text-default-700 data-[hover=true]:text-default-900 data-[hover=true]:bg-default-100",
              onClick: () => {
                setSelectedMovement(movement);
                onOpen();
              },
            },
          ];

          if (movement.status === "PENDING") {
            dropdownItems.push({
              key: "complete",
              label: "Completa",
              icon: "solar:check-circle-bold",
              className:
                "text-success-600 data-[hover=true]:text-success-700 data-[hover=true]:bg-success-50",
              onClick: () => {
                if (onUpdateStatus) {
                  onUpdateStatus(movement.id, "COMPLETED");
                }
              },
            });
          }

          dropdownItems.push({
            key: "delete",
            label: "Elimina",
            icon: "solar:trash-bin-minimalistic-linear",
            className:
              "text-danger-600 data-[hover=true]:text-danger-700 data-[hover=true]:bg-danger-50",
            onClick: () => confirmDeleteMovement(movement),
          });

          return (
            <div className="flex justify-start items-center gap-2">
              <Dropdown showArrow placement="bottom-end">
                <DropdownTrigger>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    className="hover:bg-default-100"
                  >
                    <Icon icon="nimbus:ellipsis" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  variant="bordered"
                  aria-label="Azioni movimento"
                  className="min-w-[180px]"
                >
                  {dropdownItems.map((item) => (
                    <DropdownItem
                      key={item.key}
                      onClick={item.onClick}
                      className={item.className}
                      startContent={
                        <Icon icon={item.icon} className="text-lg" />
                      }
                    >
                      {item.label}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            </div>
          );
        default:
          return null;
      }
    },
    [onUpdateStatus, onOpen]
  );

  const onRowsPerPageChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setRowsPerPage(Number(e.target.value));
      setPage(1);
    },
    []
  );

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          <div className="flex gap-3">
            {((typeof selectedKeys !== "string" && selectedKeys.size > 0) ||
              selectedKeys === "all") && (
              <div className="flex gap-2">
                <Button
                  color="danger"
                  onPress={() => {
                    if (onDeleteMovement) {
                      if (selectedKeys === "all") {
                        movements.forEach((movement) => {
                          onDeleteMovement(movement.id);
                        });
                      } else if (typeof selectedKeys !== "string") {
                        Array.from(selectedKeys).forEach((id) => {
                          onDeleteMovement(id.toString());
                        });
                      }
                      setSelectedKeys(new Set([]));
                    }
                  }}
                >
                  Elimina Selezionati{" "}
                  {typeof selectedKeys !== "string"
                    ? selectedKeys.size
                    : movements.length}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }, [selectedKeys, movements.length, onDeleteMovement]);

  const bottomContent = useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <div className="flex gap-2"></div>
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={page}
          total={pages}
          onChange={setPage}
        />
        <div className="flex items-center gap-2">
          <span className="text-small text-default-400">Righe per pagina:</span>
          <Select
            size="sm"
            selectedKeys={[rowsPerPage.toString()]}
            className="w-20"
            onChange={onRowsPerPageChange}
          >
            <SelectItem key="10">10</SelectItem>
            <SelectItem key="20">20</SelectItem>
            <SelectItem key="50">50</SelectItem>
          </Select>
        </div>
      </div>
    );
  }, [page, pages, rowsPerPage, onRowsPerPageChange]);

  return (
    <>
      <Table
        aria-label="Tabella movimenti"
        bottomContent={bottomContent}
        bottomContentPlacement="inside"
        selectedKeys={selectedKeys}
        sortDescriptor={{
          column: sortBy?.field || "date",
          direction:
            (sortBy?.direction || "desc") === "asc"
              ? "ascending"
              : "descending",
        }}
        topContent={topContent}
        topContentPlacement="inside"
        onSelectionChange={setSelectedKeys}
        onSortChange={(descriptor) => {
          if (onSort) {
            onSort({
              field: descriptor.column as keyof Movement,
              direction: descriptor.direction === "ascending" ? "asc" : "desc",
            });
          }
        }}
        isStriped
        selectionBehavior="toggle"
        classNames={{
          th: [
            "bg-default-100",
            "text-default-800",
            "border-b border-divider",
            "py-3 px-4",
          ],
          td: ["py-3 px-4", "border-b border-divider"],
          wrapper: "border border-divider rounded-lg",
          tr: "cursor-pointer hover:bg-default-50",
        }}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn
              key={column.uid}
              align="start"
              allowsSorting={column.sortable}
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody
          emptyContent={<EmptyState isLoading={isLoading} />}
          items={items}
        >
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => (
                <TableCell>
                  <div
                    className={
                      columnKey === "actions" ? "flex justify-start" : ""
                    }
                  >
                    {renderCell(item, columnKey)}
                  </div>
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Movement details modal */}
      <Modal isOpen={isOpen} onClose={onClose} backdrop="blur" radius="lg">
        <ModalContent>
          {selectedMovement && (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-xl font-semibold">Dettagli Movimento</h3>
                <p className="text-sm text-default-500">
                  Informazioni sul movimento del {selectedMovement.date}
                </p>
              </ModalHeader>
              <ModalBody>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <p className="text-small text-zinc-500">ID Movimento</p>
                    <p className="font-medium">{selectedMovement.id}</p>
                  </div>
                  <div>
                    <p className="text-small text-zinc-500">ID Prodotto</p>
                    <p className="font-medium">{selectedMovement.product_id}</p>
                  </div>
                  <div>
                    <p className="text-small text-zinc-500">Tipo</p>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(selectedMovement.type)}
                      <Chip
                        className="capitalize"
                        color={typeColorMap[selectedMovement.type]}
                        variant="flat"
                        size="sm"
                      >
                        {selectedMovement.type}
                      </Chip>
                    </div>
                  </div>
                  <div>
                    <p className="text-small text-zinc-500">Prodotto</p>
                    <p className="font-medium">{selectedMovement.product}</p>
                    <p className="text-xs text-default-500">
                      SKU: {selectedMovement.sku}
                    </p>
                  </div>
                  <div>
                    <p className="text-small text-zinc-500">Quantità</p>
                    <p
                      className={`font-medium ${
                        selectedMovement.quantity < 0
                          ? "text-danger"
                          : "text-success"
                      }`}
                    >
                      {selectedMovement.quantity > 0 ? "+" : ""}
                      {selectedMovement.quantity}
                    </p>
                  </div>
                  <div>
                    <p className="text-small text-zinc-500">Origine</p>
                    <p className="font-medium">
                      {selectedMovement.source}
                      {selectedMovement.from_vehicle_license_plate
                        ? ` (${selectedMovement.from_vehicle_license_plate})`
                        : ""}
                    </p>
                    {selectedMovement.from_warehouse_id && (
                      <p className="text-xs text-default-500">
                        ID Magazzino: {selectedMovement.from_warehouse_id}
                      </p>
                    )}
                    {selectedMovement.from_vehicle_id && (
                      <p className="text-xs text-default-500">
                        ID Veicolo: {selectedMovement.from_vehicle_id}
                      </p>
                    )}
                    {selectedMovement.from_supplier && (
                      <p className="text-xs text-default-500">
                        ID Fornitore: {selectedMovement.from_supplier}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-small text-zinc-500">Destinazione</p>
                    <p className="font-medium">
                      {selectedMovement.destination}
                      {selectedMovement.to_vehicle_license_plate
                        ? ` (${selectedMovement.to_vehicle_license_plate})`
                        : ""}
                    </p>
                    {selectedMovement.to_warehouse_id && (
                      <p className="text-xs text-default-500">
                        ID Magazzino: {selectedMovement.to_warehouse_id}
                      </p>
                    )}
                    {selectedMovement.to_vehicle_id && (
                      <p className="text-xs text-default-500">
                        ID Veicolo: {selectedMovement.to_vehicle_id}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-small text-zinc-500">Stato</p>
                    <Chip
                      color={statusColorMap[selectedMovement.status]}
                      variant="flat"
                      size="sm"
                    >
                      {selectedMovement.status}
                    </Chip>
                  </div>
                  <div>
                    <p className="text-small text-zinc-500">Creato da</p>
                    <p className="font-medium">
                      {selectedMovement.user_name ||
                        selectedMovement.created_by ||
                        "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-small text-zinc-500">Nome Movimento</p>
                    <p className="font-medium">
                      {selectedMovement.movement_name || "N/A"}
                    </p>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Chiudi
                </Button>
                {selectedMovement.status === "PENDING" && (
                  <Button
                    color="success"
                    onPress={() => {
                      if (onUpdateStatus) {
                        onUpdateStatus(selectedMovement.id, "COMPLETED");
                      }
                      onClose();
                    }}
                  >
                    Completa Movimento
                  </Button>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        backdrop="blur"
        radius="lg"
      >
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-semibold">Conferma Eliminazione</h3>
          </ModalHeader>
          <ModalBody>
            <p>
              Sei sicuro di voler eliminare questo movimento? Questa azione non
              può essere annullata.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={closeDeleteModal}>
              Annulla
            </Button>
            <Button
              color="danger"
              onPress={() => {
                if (movementToDelete) {
                  handleDeleteMovement(movementToDelete.id);
                }
                closeDeleteModal();
              }}
            >
              Elimina
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
