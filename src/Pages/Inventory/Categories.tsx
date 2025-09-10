import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Spinner,
  Input,
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
  Divider,
  Progress,
  Tabs,
  Tab,
} from "@heroui/react";
import { Icon } from "@iconify/react/dist/iconify.js";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CategoryTable from "../../Components/Inventory/Category/CategoryTable";
import PageHeader from "../../Components/Layout/PageHeader";

interface Attribute {
  attribute_id: number;
  name: string;
  type: string;
}

interface CategoryAttribute {
  category_id: number;
  attribute_id: number;
  category_name: string;
  name: string;
  type: string;
}

interface GroupedCategory {
  category_id: number;
  category_name: string;
  attributes: Attribute[];
}

interface CategoryStats {
  totalCategories: number;
  totalAttributes: number;
  averageAttributesPerCategory: number;
  mostUsedAttributeType: string;
}

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

const getFieldTypeColor = (type: string) => {
  switch (type) {
    case "text":
      return "primary";
    case "number":
      return "success";
    case "boolean":
      return "warning";
    case "date":
      return "secondary";
    default:
      return "default";
  }
};

export default function Categories() {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isSuccessOpen,
    onOpen: onSuccessOpen,
    onClose: onSuccessClose,
  } = useDisclosure();

  const [groupedCategories, setGroupedCategories] = useState<GroupedCategory[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<GroupedCategory | null>(null);
  const [activeTab, setActiveTab] = useState("grid");
  const [sortBy, setSortBy] = useState<"name" | "attributes">("name");
  const [filterType, setFilterType] = useState<string>("all");

  // Stati per il modal di modifica
  const [editingCategory, setEditingCategory] =
    useState<GroupedCategory | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await axios.get("/Product/GET/GetAllCategories");
      const rawData: CategoryAttribute[] = res.data;

      const grouped = rawData.reduce((acc: GroupedCategory[], curr) => {
        const existingCategory = acc.find(
          (cat) => cat.category_id === curr.category_id
        );

        if (existingCategory) {
          existingCategory.attributes.push({
            attribute_id: curr.attribute_id,
            name: curr.name,
            type: curr.type,
          });
        } else {
          acc.push({
            category_id: curr.category_id,
            category_name: curr.category_name,
            attributes: [
              {
                attribute_id: curr.attribute_id,
                name: curr.name,
                type: curr.type,
              },
            ],
          });
        }

        return acc;
      }, []);

      setGroupedCategories(grouped);
    } catch (err) {
      setError("Errore nel caricamento delle categorie. Riprova più tardi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    try {
      await axios.delete(`/Product/DELETE/DeleteCategory/${categoryId}`);
      await fetchCategories();
    } catch (err) {
      console.error("Errore nell'eliminazione della categoria:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Calculate statistics
  const stats: CategoryStats = {
    totalCategories: groupedCategories.length,
    totalAttributes: groupedCategories.reduce(
      (sum, cat) => sum + cat.attributes.length,
      0
    ),
    averageAttributesPerCategory:
      groupedCategories.length > 0
        ? Math.round(
            (groupedCategories.reduce(
              (sum, cat) => sum + cat.attributes.length,
              0
            ) /
              groupedCategories.length) *
              10
          ) / 10
        : 0,
    mostUsedAttributeType: (() => {
      const typeCounts: Record<string, number> = {};
      groupedCategories.forEach((cat) => {
        cat.attributes.forEach((attr) => {
          typeCounts[attr.type] = (typeCounts[attr.type] || 0) + 1;
        });
      });
      return (
        Object.entries(typeCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
        "text"
      );
    })(),
  };

  // Filter and sort categories
  const filteredCategories = groupedCategories
    .filter((category) => {
      const matchesSearch = category.category_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesType =
        filterType === "all" ||
        category.attributes.some((attr) => attr.type === filterType);
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.category_name.localeCompare(b.category_name);
      } else {
        return b.attributes.length - a.attributes.length;
      }
    });

  const handleCategoryClick = (category: GroupedCategory) => {
    setSelectedCategory(category);
    onOpen();
  };

  const handleEditCategory = (category: GroupedCategory) => {
    setEditingCategory(category);
    setEditCategoryName(category.category_name);
    onEditOpen();
  };

  const handleSaveCategory = async () => {
    if (!editingCategory || !editCategoryName.trim()) return;

    setIsSaving(true);
    try {
      const updateData = {
        name: editCategoryName.trim(),
        description: "", // Per ora non gestiamo la descrizione
        // Non passiamo gli attributi per ora, solo il nome
      };

      const response = await axios.put(
        `/Product/UPDATE/UpdateCategory/${editingCategory.category_id}`,
        updateData
      );

      if (response.status === 200) {
        // Aggiorna la lista locale
        setGroupedCategories((prev) =>
          prev.map((cat) =>
            cat.category_id === editingCategory.category_id
              ? { ...cat, category_name: editCategoryName.trim() }
              : cat
          )
        );

        // Mostra messaggio di successo
        setSuccessMessage(
          `Categoria "${editCategoryName.trim()}" aggiornata con successo!`
        );

        // Chiudi il modal di modifica
        onEditClose();

        // Apri il modal di successo
        onSuccessOpen();

        // Chiudi il modal di successo dopo 2 secondi
        setTimeout(() => {
          onSuccessClose();
          setSuccessMessage(null);
        }, 2000);
      } else {
        setError("Errore durante l'aggiornamento della categoria");
      }
    } catch (error) {
      console.error("Errore nell'aggiornamento della categoria:", error);
      setError(
        "Errore durante l'aggiornamento della categoria. Riprova più tardi."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full flex-1 flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" className="text-primary" />
          <p className="text-foreground-500">Caricamento categorie...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex-1 flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Card className="max-w-md">
          <CardBody className="text-center">
            <Icon
              icon="solar:danger-triangle-bold-duotone"
              className="text-4xl text-danger mb-4"
            />
            <h3 className="text-lg font-semibold mb-2">
              Errore di Caricamento
            </h3>
            <p className="text-foreground-500 mb-4">{error}</p>
            <Button color="primary" onPress={fetchCategories}>
              Riprova
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background p-6 gap-6">
      {/* Page Header */}
      <PageHeader
        title="Gestione Categorie"
        description="Organizza e gestisci le categorie dei tuoi prodotti"
        icon="solar:folder-with-files-bold-duotone"
        size="md"
        indicators={[
          {
            label: "Categorie",
            value: `${stats.totalCategories}`,
            icon: "solar:folder-bold",
            color: "primary",
          },
          {
            label: "Attributi",
            value: `${stats.totalAttributes}`,
            icon: "solar:settings-bold",
            color: "secondary",
          },
        ]}
        actions={[
          {
            label: "Nuova Categoria",
            icon: "solar:add-circle-bold-duotone",
            color: "primary",
            variant: "solid",
            onClick: () => navigate("/inventory/categories/add"),
          },
        ]}
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="shadow-sm border border-divider bg-content1/80">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon
                icon="solar:folder-bold-duotone"
                className="text-primary text-xl"
              />
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Totale Categorie
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {stats.totalCategories}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="shadow-sm border border-divider bg-content1/80">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <Icon
                icon="solar:settings-bold-duotone"
                className="text-success text-xl"
              />
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Totale Attributi
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {stats.totalAttributes}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="shadow-sm border border-divider bg-content1/80">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <Icon
                icon="solar:chart-bold-duotone"
                className="text-warning text-xl"
              />
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Media Attributi
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {stats.averageAttributesPerCategory}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="shadow-sm border border-divider bg-content1/80">
          <CardBody className="flex flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
              <Icon
                icon={getFieldTypeIcon(stats.mostUsedAttributeType)}
                className="text-secondary text-xl"
              />
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Tipo Più Usato
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 capitalize">
                {stats.mostUsedAttributeType}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="shadow-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 mb-6">
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Cerca categorie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startContent={
                  <Icon
                    icon="solar:magnifer-bold-duotone"
                    className="text-foreground-400"
                  />
                }
                isClearable
                onClear={() => setSearchQuery("")}
              />
            </div>

            <div className="flex gap-2">
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    variant="flat"
                    startContent={<Icon icon="solar:filter-bold-duotone" />}
                  >
                    Tipo: {filterType === "all" ? "Tutti" : filterType}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  selectedKeys={[filterType]}
                  onAction={(key) => setFilterType(key as string)}
                >
                  <DropdownItem key="all">Tutti i tipi</DropdownItem>
                  <DropdownItem key="text">Testo</DropdownItem>
                  <DropdownItem key="number">Numero</DropdownItem>
                  <DropdownItem key="boolean">Booleano</DropdownItem>
                  <DropdownItem key="date">Data</DropdownItem>
                </DropdownMenu>
              </Dropdown>

              <Dropdown>
                <DropdownTrigger>
                  <Button
                    variant="flat"
                    startContent={<Icon icon="solar:sort-bold-duotone" />}
                  >
                    Ordina: {sortBy === "name" ? "Nome" : "Attributi"}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  selectedKeys={[sortBy]}
                  onAction={(key) => setSortBy(key as "name" | "attributes")}
                >
                  <DropdownItem key="name">Per Nome</DropdownItem>
                  <DropdownItem key="attributes">
                    Per Numero Attributi
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* View Toggle */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {filteredCategories.length} di {groupedCategories.length} categorie
          </span>
          {searchQuery && (
            <Chip size="sm" variant="flat" color="primary">
              Filtrate per: "{searchQuery}"
            </Chip>
          )}
        </div>

        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as string)}
          color="primary"
          variant="bordered"
          size="sm"
        >
          <Tab
            key="grid"
            title={
              <div className="flex items-center gap-2">
                <Icon icon="solar:widget-2-linear" />
                <span className="hidden sm:inline">Griglia</span>
              </div>
            }
          />
          <Tab
            key="table"
            title={
              <div className="flex items-center gap-2">
                <Icon icon="solar:list-linear" />
                <span className="hidden sm:inline">Tabella</span>
              </div>
            }
          />
        </Tabs>
      </div>

      {/* Content */}
      {activeTab === "grid" ? (
        // Grid View
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => (
              <Card
                key={category.category_id}
                className="shadow-md hover:shadow-lg border border-zinc-200 dark:border-zinc-800 transition-all duration-200 cursor-pointer bg-white dark:bg-zinc-900"
                isPressable
                onPress={() => handleCategoryClick(category)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon
                          icon="solar:folder-bold-duotone"
                          className="text-primary text-lg"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {category.category_name}
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          ID: {category.category_id}
                        </p>
                      </div>
                    </div>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly size="sm" variant="light">
                          <Icon icon="solar:menu-dots-bold" />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu>
                        <DropdownItem
                          key="edit"
                          startContent={<Icon icon="solar:pen-bold-duotone" />}
                          onPress={() => handleEditCategory(category)}
                        >
                          Modifica
                        </DropdownItem>
                        <DropdownItem
                          key="delete"
                          className="text-danger"
                          color="danger"
                          startContent={
                            <Icon icon="solar:trash-bin-trash-bold-duotone" />
                          }
                          onPress={() =>
                            handleDeleteCategory(category.category_id)
                          }
                        >
                          Elimina
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </CardHeader>
                <CardBody className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        Attributi
                      </span>
                      <Chip size="sm" color="primary" variant="flat">
                        {category.attributes.length}
                      </Chip>
                    </div>

                    {category.attributes.length > 0 && (
                      <div className="space-y-2">
                        <Progress
                          value={
                            (category.attributes.length /
                              Math.max(
                                ...groupedCategories.map(
                                  (c) => c.attributes.length
                                )
                              )) *
                            100
                          }
                          color="primary"
                          size="sm"
                          aria-label="Completezza categoria"
                        />
                        <div className="flex flex-wrap gap-1">
                          {category.attributes.slice(0, 3).map((attr) => (
                            <Chip
                              key={attr.attribute_id}
                              size="sm"
                              color={getFieldTypeColor(attr.type) as any}
                              variant="flat"
                              startContent={
                                <Icon
                                  icon={getFieldTypeIcon(attr.type)}
                                  width={12}
                                />
                              }
                            >
                              {attr.name}
                            </Chip>
                          ))}
                          {category.attributes.length > 3 && (
                            <Chip size="sm" variant="flat">
                              +{category.attributes.length - 3}
                            </Chip>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                <Icon
                  icon="solar:folder-with-files-bold-duotone"
                  className="text-zinc-500 dark:text-zinc-400 text-2xl"
                />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-zinc-900 dark:text-zinc-100">
                Nessuna categoria trovata
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4 text-center">
                {searchQuery
                  ? "Nessuna categoria corrisponde ai criteri di ricerca"
                  : "Non ci sono ancora categorie"}
              </p>
              <Button
                color="primary"
                startContent={<Icon icon="solar:add-circle-bold-duotone" />}
                onPress={() => navigate("/inventory/categories/add")}
              >
                Crea Prima Categoria
              </Button>
            </div>
          )}
        </div>
      ) : (
        // Table View
        <CategoryTable
          categories={filteredCategories}
          onDeleteCategory={handleDeleteCategory}
        />
      )}

      {/* Category Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          {selectedCategory && (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <Icon
                    icon="solar:folder-with-files-bold-duotone"
                    className="text-primary text-2xl"
                  />
                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedCategory.category_name}
                    </h3>
                    <p className="text-sm text-foreground-500">
                      Dettagli categoria
                    </p>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-foreground-500 mb-1">
                        ID Categoria
                      </p>
                      <p className="font-medium">
                        {selectedCategory.category_id}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-foreground-500 mb-1">
                        Numero Attributi
                      </p>
                      <p className="font-medium">
                        {selectedCategory.attributes.length}
                      </p>
                    </div>
                  </div>

                  <Divider />

                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Icon
                        icon="solar:settings-bold-duotone"
                        className="text-primary"
                      />
                      Attributi della Categoria
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedCategory.attributes.map((attr) => (
                        <Card
                          key={attr.attribute_id}
                          className="shadow-sm border border-divider"
                        >
                          <CardBody className="p-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${getFieldTypeColor(
                                  attr.type
                                )}/10`}
                              >
                                <Icon
                                  icon={getFieldTypeIcon(attr.type)}
                                  className={`text-${getFieldTypeColor(
                                    attr.type
                                  )} text-sm`}
                                />
                              </div>
                              <div>
                                <p className="font-medium text-sm">
                                  {attr.name}
                                </p>
                                <p className="text-xs text-foreground-500 capitalize">
                                  {attr.type}
                                </p>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Chiudi
                </Button>
                <Button
                  color="primary"
                  startContent={<Icon icon="solar:pen-bold-duotone" />}
                  onPress={() => {
                    onClose();
                    handleEditCategory(selectedCategory);
                  }}
                >
                  Modifica Categoria
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Edit Category Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="md">
        <ModalContent>
          {editingCategory && (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <Icon
                    icon="solar:pen-bold-duotone"
                    className="text-primary text-2xl"
                  />
                  <div>
                    <h3 className="text-xl font-semibold">
                      Modifica Categoria
                    </h3>
                    <p className="text-sm text-foreground-500">
                      Modifica il nome della categoria
                    </p>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label="Nome Categoria"
                    placeholder="es. Elettronica, Abbigliamento, Casa..."
                    value={editCategoryName}
                    onChange={(e) => setEditCategoryName(e.target.value)}
                    startContent={
                      <Icon
                        icon="solar:folder-bold-duotone"
                        className="text-foreground-400"
                      />
                    }
                    isRequired
                  />
                  <div className="text-sm text-foreground-500">
                    <p className="font-medium mb-1">Informazioni:</p>
                    <p>• ID: {editingCategory.category_id}</p>
                    <p>• Attributi: {editingCategory.attributes.length}</p>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onEditClose}>
                  Annulla
                </Button>
                <Button
                  color="primary"
                  startContent={<Icon icon="solar:check-circle-bold-duotone" />}
                  onPress={handleSaveCategory}
                  isLoading={isSaving}
                  isDisabled={!editCategoryName.trim()}
                >
                  Salva Modifiche
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={isSuccessOpen}
        onClose={onSuccessClose}
        size="sm"
        isDismissable={false}
        hideCloseButton
      >
        <ModalContent>
          <ModalBody className="py-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                <Icon
                  icon="solar:check-circle-bold-duotone"
                  className="text-success text-3xl"
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-success mb-2">
                  Aggiornato con Successo!
                </h3>
                <p className="text-sm text-foreground-500">{successMessage}</p>
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
