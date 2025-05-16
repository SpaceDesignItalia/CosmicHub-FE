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
  Avatar,
  Select,
  SelectItem,
} from "@heroui/react";
import type { Selection, ChipProps } from "@heroui/react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react/dist/iconify.js";

const getFieldTypeIcon = (type: string) => {
  switch (type) {
    case "text":
      return "solar:document-text-bold-duotone";
    case "number":
      return "solar:calculator-bold-duotone";
    case "boolean":
      return "solar:check-square-bold-duotone";
    case "date":
      return "solar:calendar-bold-duotone";
    default:
      return "solar:document-bold-duotone";
  }
};

// Data types
interface Category {
  category_id: number;
  category_name: string;
  attributes: {
    attribute_id: number;
    name: string;
    type: string;
  }[];
}

interface CategoryTableProps {
  categories: Category[];
  onDeleteCategory?: (id: number) => Promise<void>;
  sortBy?: {
    field: keyof Category;
    direction: "asc" | "desc";
  };
  onSort?: (sort: { field: keyof Category; direction: "asc" | "desc" }) => void;
}

const statusColorMap: Record<string, ChipProps["color"]> = {
  Disponibile: "success",
  "Bassa giacenza": "warning",
  Esaurito: "danger",
};

const columns = [
  { name: "NOME CATEGORIA", uid: "category_name", sortable: true },
  { name: "NUMERO ATTRIBUTI", uid: "attributes_count", sortable: true },
  { name: "AZIONI", uid: "actions" },
];

// Empty State Component
const EmptyState = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="p-4 rounded-full mb-4 bg-zinc-100">
        <Icon
          icon="solar:folder-with-files-bold-duotone"
          className="w-12 h-12 text-zinc-500"
        />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-zinc-800">
        Nessuna categoria trovata
      </h3>
      <p className="text-sm mb-6 text-center text-zinc-500">
        Non ci sono categorie che corrispondono ai criteri di ricerca.
        <br />
        Prova a modificare i filtri o aggiungi nuove categorie.
      </p>
      <Button
        color="primary"
        variant="shadow"
        startContent={<Icon icon="solar:add-circle-bold" className="text-xl" />}
        onPress={() => navigate("/inventory/categories/add")}
      >
        Aggiungi Categoria
      </Button>
    </div>
  );
};

export default function CategoryTable({
  categories,
  onDeleteCategory,
  sortBy,
  onSort,
}: CategoryTableProps) {
  const navigate = useNavigate();
  const [selectedKeys, setSelectedKeys] = React.useState<Selection>(
    new Set([])
  );
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const [page, setPage] = React.useState(1);

  // Modals
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedCategory, setSelectedCategory] =
    React.useState<Category | null>(null);
  const {
    isOpen: isDeleteModalOpen,
    onOpen: openDeleteModal,
    onClose: closeDeleteModal,
  } = useDisclosure();
  const [categoryToDelete, setCategoryToDelete] =
    React.useState<Category | null>(null);

  const filteredItems = useMemo(() => {
    return [...categories];
  }, [categories]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a: Category, b: Category) => {
      const first = a[sortBy?.field || "category_name"];
      const second = b[sortBy?.field || "category_name"];
      const direction = sortBy?.direction === "asc" ? 1 : -1;

      if (typeof first === "string" && typeof second === "string") {
        return direction * first.localeCompare(second);
      }
      return direction * ((first as number) - (second as number));
    });
  }, [items, sortBy]);

  const goToEditCategory = (categoryId: number) =>
    navigate(`/inventory/categories/edit/${categoryId}`);

  // Delete functions
  const confirmDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    openDeleteModal();
  };

  const handleDeleteCategory = async (id: number) => {
    if (onDeleteCategory) {
      await onDeleteCategory(id);
    }
  };

  const renderCell = useCallback((category: Category, columnKey: React.Key) => {
    switch (columnKey) {
      case "category_name":
        return (
          <div className="flex items-center gap-2">
            <Icon
              icon="solar:folder-with-files-bold-duotone"
              className="text-xl text-primary"
            />
            <span>{category.category_name}</span>
          </div>
        );
      case "attributes_count":
        return (
          <div className="flex justify-start w-full">
            <div className="font-medium">{category.attributes.length}</div>
          </div>
        );
      case "actions":
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
                aria-label="Azioni categoria"
                className="min-w-[180px]"
              >
                <DropdownItem
                  key="view"
                  onClick={() => {
                    setSelectedCategory(category);
                    onOpen();
                  }}
                  className="text-default-700 data-[hover=true]:text-default-900 data-[hover=true]:bg-default-100"
                  startContent={
                    <Icon
                      icon="solar:eye-bold"
                      className="text-lg text-default-600"
                    />
                  }
                >
                  Visualizza
                </DropdownItem>
                <DropdownItem
                  key="edit"
                  onClick={() => goToEditCategory(category.category_id)}
                  className="text-primary-600 data-[hover=true]:text-primary-700 data-[hover=true]:bg-primary-50"
                  startContent={
                    <Icon
                      icon="solar:pen-line-duotone"
                      className="text-lg text-primary-500"
                    />
                  }
                >
                  Modifica
                </DropdownItem>
                <DropdownItem
                  key="delete"
                  onClick={() => confirmDeleteCategory(category)}
                  className="text-danger-600 data-[hover=true]:text-danger-700 data-[hover=true]:bg-danger-50"
                  startContent={
                    <Icon
                      icon="solar:trash-bin-minimalistic-linear"
                      className="text-lg text-danger-500"
                    />
                  }
                >
                  Elimina
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return category[columnKey as keyof Category];
    }
  }, []);

  const onNextPage = useCallback(() => {
    if (page < pages) {
      setPage(page + 1);
    }
  }, [page, pages]);

  const onPreviousPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

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
                    if (onDeleteCategory) {
                      if (selectedKeys === "all") {
                        // Delete all categories
                        categories.forEach((category) => {
                          onDeleteCategory(category.category_id);
                        });
                      } else if (typeof selectedKeys !== "string") {
                        // Delete selected categories
                        Array.from(selectedKeys).forEach((id) => {
                          onDeleteCategory(Number(id));
                        });
                      }
                      setSelectedKeys(new Set([]));
                    }
                  }}
                >
                  Elimina Selezionati{" "}
                  {typeof selectedKeys !== "string"
                    ? selectedKeys.size
                    : categories.length}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }, [selectedKeys, categories.length, onDeleteCategory]);

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
  }, [page, pages, onPreviousPage, onNextPage, rowsPerPage]);

  return (
    <>
      <Table
        aria-label="Tabella categorie"
        bottomContent={bottomContent}
        bottomContentPlacement="inside"
        selectedKeys={selectedKeys}
        selectionMode="multiple"
        sortDescriptor={{
          column: sortBy?.field || "category_name",
          direction: sortBy?.direction === "asc" ? "ascending" : "descending",
        }}
        topContent={topContent}
        topContentPlacement="inside"
        onSelectionChange={setSelectedKeys}
        onSortChange={(descriptor) => {
          if (onSort) {
            onSort({
              field: descriptor.column as keyof Category,
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
        <TableBody emptyContent={<EmptyState />} items={sortedItems}>
          {(item) => (
            <TableRow key={item.category_id}>
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

      {/* Category details modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        backdrop="blur"
        radius="lg"
        classNames={{
          base: "border border-zinc-200",
          header: "",
          body: "",
          footer: "",
        }}
      >
        <ModalContent>
          {selectedCategory && (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-xl font-semibold">Dettagli Categoria</h3>
                <p className="text-sm text-default-500">
                  Informazioni su {selectedCategory.category_name}
                </p>
              </ModalHeader>
              <ModalBody>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <p className="text-small text-zinc-500">ID Categoria</p>
                    <p className="font-medium">
                      {selectedCategory.category_id}
                    </p>
                  </div>
                  <div>
                    <p className="text-small text-zinc-500">Nome</p>
                    <p className="font-medium">
                      {selectedCategory.category_name}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-small text-zinc-500 mb-2">Attributi</p>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedCategory.attributes.map(
                        (attr): JSX.Element => (
                          <div
                            key={attr.attribute_id}
                            className="p-3 bg-default-50 rounded-lg"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Icon
                                icon={getFieldTypeIcon(attr.type)}
                                className="text-lg text-primary"
                              />
                              <span className="font-medium">{attr.name}</span>
                            </div>
                            <span className="text-sm text-default-500">
                              {attr.type}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Chiudi
                </Button>
                <Button
                  color="primary"
                  onPress={() => {
                    onClose();
                    goToEditCategory(selectedCategory.category_id);
                  }}
                >
                  Modifica
                </Button>
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
          <ModalHeader>Conferma Eliminazione</ModalHeader>
          <ModalBody>
            <p>
              Sei sicuro di voler eliminare la categoria{" "}
              <span className="font-semibold">
                {categoryToDelete?.category_name}
              </span>
              ?
            </p>
            <p className="text-sm text-danger mt-2">
              Questa azione non può essere annullata.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={closeDeleteModal}>
              Annulla
            </Button>
            <Button
              color="danger"
              onPress={() => {
                if (categoryToDelete) {
                  handleDeleteCategory(categoryToDelete.category_id);
                  closeDeleteModal();
                }
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
