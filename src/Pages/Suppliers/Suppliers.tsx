import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Tooltip,
  Pagination,
  Select,
  SelectItem,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import axios from "axios";

// Interfaccia per i fornitori
interface Supplier {
  SupplierId: number;
  SupplierUUID: string;
  SupplierName: string;
  SupplierVAT: string;
  SupplierEmail: string;
  SupplierNumber: string;
  SupplierCountry: string;
  SupplierAddress: string;
  CreatedBy: number;
  CreatedAt: string;
  UpdatedAt: string;
}

const Suppliers: React.FC = () => {
  // Stati
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [employeeCache, setEmployeeCache] = useState<Map<number, string>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toasts, setToasts] = useState<
    Array<{ id: string; message: string; type: "success" | "error" }>
  >([]);

  // Stati per i modali
  const {
    isOpen: isAddSupplierModalOpen,
    onOpen: onOpenAddSupplierModal,
    onClose: onCloseAddSupplierModal,
  } = useDisclosure();

  const {
    isOpen: isEditSupplierModalOpen,
    onOpen: onOpenEditSupplierModal,
    onClose: onCloseEditSupplierModal,
  } = useDisclosure();

  const {
    isOpen: isViewSupplierModalOpen,
    onOpen: onOpenViewSupplierModal,
    onClose: onCloseViewSupplierModal,
  } = useDisclosure();

  const {
    isOpen: isDeleteSupplierModalOpen,
    onOpen: onOpenDeleteSupplierModal,
    onClose: onCloseDeleteSupplierModal,
  } = useDisclosure();

  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
    SupplierName: "",
    SupplierEmail: "",
    SupplierNumber: "",
    SupplierAddress: "",
    SupplierVAT: "",
    SupplierCountry: "",
  });

  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [employeeName, setEmployeeName] = useState<string>("");
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(
    null
  );

  // Stati per paginazione
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Funzione per ottenere il nome dell'employee
  const getEmployeeName = useCallback(
    async (employeeId: number): Promise<string> => {
      // Se è già in cache, restituisci il nome
      if (employeeCache.has(employeeId)) {
        return employeeCache.get(employeeId)!;
      }

      try {
        // Fetch dell'employee specifico
        const response = await axios.get(`/Employee/GET/GetEmployeeById`, {
          params: { employeeId: employeeId },
        });
        const employee = response.data;
        const fullName = `${employee.name} ${employee.surname}`;

        // Aggiungi alla cache
        setEmployeeCache((prev) => new Map(prev).set(employeeId, fullName));

        return fullName;
      } catch (error) {
        console.error(
          `Errore nel caricamento dell'employee ${employeeId}:`,
          error
        );
        return `ID: ${employeeId}`;
      }
    },
    [employeeCache]
  );

  // Caricamento dati
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Carico i fornitori
        const suppliersResponse = await axios.get(
          "/Supplier/GET/GetAllSuppliers"
        );
        setSuppliers(suppliersResponse.data || []);
      } catch (error) {
        console.error("Errore durante il caricamento dei dati:", error);
        setErrorMessage(
          "Si è verificato un errore durante il caricamento dei dati"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtraggio dei fornitori in base al termine di ricerca
  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.SupplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.SupplierEmail.toLowerCase().includes(
        searchQuery.toLowerCase()
      ) ||
      supplier.SupplierVAT.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.SupplierNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Logica di paginazione
  const pages = Math.ceil(filteredSuppliers.length / rowsPerPage);

  const paginatedSuppliers = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredSuppliers.slice(start, end);
  }, [page, filteredSuppliers, rowsPerPage]);

  // Funzioni per la paginazione
  const onRowsPerPageChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setRowsPerPage(Number(e.target.value));
      setPage(1);
    },
    []
  );

  // Funzione per mostrare toast
  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      const id = Date.now().toString();
      const newToast = { id, message, type };

      setToasts((prev) => [...prev, newToast]);
      setErrorMessage(null); // Nascondi eventuali errori

      // Rimuovi il toast dopo 4 secondi
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 4000);
    },
    []
  );

  // Aggiunta di un nuovo fornitore
  const handleAddSupplier = async () => {
    try {
      await axios.post("/Supplier/POST/CreateSupplier", newSupplier);

      // Aggiorna la lista dei fornitori
      const suppliersResponse = await axios.get(
        "/Supplier/GET/GetAllSuppliers"
      );
      setSuppliers(suppliersResponse.data || []);

      // Chiudi il modale
      onCloseAddSupplierModal();

      // Resetta il form
      setNewSupplier({
        SupplierName: "",
        SupplierEmail: "",
        SupplierNumber: "",
        SupplierAddress: "",
        SupplierVAT: "",
        SupplierCountry: "",
      });

      // Mostra toast di successo
      showToast("Fornitore aggiunto con successo!");
    } catch (error) {
      console.error("Errore durante l'aggiunta del fornitore:", error);
      setErrorMessage(
        "Si è verificato un errore durante l'aggiunta del fornitore"
      );
    }
  };

  // Aggiornamento del form nuovo fornitore
  const handleNewSupplierChange = (field: string, value: string) => {
    setNewSupplier((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Apertura modal modifica fornitore
  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    onOpenEditSupplierModal();
  };

  // Aggiornamento del form modifica fornitore
  const handleEditSupplierChange = (field: string, value: string) => {
    if (editingSupplier) {
      setEditingSupplier((prev) => ({
        ...prev!,
        [field]: value,
      }));
    }
  };

  // Salvataggio modifiche fornitore
  const handleUpdateSupplier = async () => {
    if (!editingSupplier) return;

    try {
      await axios.put(
        `/Supplier/UPDATE/UpdateSupplier/${editingSupplier.SupplierId}`,
        editingSupplier
      );

      // Aggiorna la lista dei fornitori
      const suppliersResponse = await axios.get(
        "/Supplier/GET/GetAllSuppliers"
      );
      setSuppliers(suppliersResponse.data || []);

      // Chiudi il modale
      onCloseEditSupplierModal();
      setEditingSupplier(null);

      // Mostra toast di successo
      showToast("Fornitore aggiornato con successo!");
    } catch (error) {
      console.error("Errore durante l'aggiornamento del fornitore:", error);
      setErrorMessage(
        "Si è verificato un errore durante l'aggiornamento del fornitore"
      );
    }
  };

  // Apertura modal visualizzazione fornitore
  const handleViewSupplier = async (supplier: Supplier) => {
    setViewingSupplier(supplier);
    onOpenViewSupplierModal();

    // Carica il nome dell'employee
    const name = await getEmployeeName(supplier.CreatedBy);
    setEmployeeName(name);
  };

  // Apertura modal eliminazione fornitore
  const handleDeleteSupplier = (supplier: Supplier) => {
    setDeletingSupplier(supplier);
    onOpenDeleteSupplierModal();
  };

  // Conferma eliminazione fornitore
  const handleConfirmDeleteSupplier = async () => {
    if (!deletingSupplier) return;

    try {
      await axios.delete(
        `/Supplier/DELETE/DeleteSupplier/${deletingSupplier.SupplierId}`
      );

      // Aggiorna la lista dei fornitori
      const suppliersResponse = await axios.get(
        "/Supplier/GET/GetAllSuppliers"
      );
      setSuppliers(suppliersResponse.data || []);

      // Chiudi il modale
      onCloseDeleteSupplierModal();
      setDeletingSupplier(null);

      // Mostra toast di successo
      showToast("Fornitore eliminato con successo!");
    } catch (error) {
      console.error("Errore durante l'eliminazione del fornitore:", error);
      setErrorMessage(
        "Si è verificato un errore durante l'eliminazione del fornitore"
      );
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
      {/* Header con titolo */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon icon="solar:truck-bold" className="text-primary" width={28} />
          </div>
          <h1 className="text-2xl font-bold">Gestione Fornitori</h1>
        </div>
      </div>

      {/* Messaggio di errore */}
      {errorMessage && (
        <div className="mb-4 rounded-md bg-danger-100 p-4 text-danger-700 animate-fadeInDown">
          <div className="flex items-center">
            <Icon
              icon="solar:danger-triangle-bold"
              className="mr-2"
              width={20}
            />
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Controlli */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Cerca fornitori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="sm"
              startContent={
                <Icon
                  icon="solar:magnifer-linear"
                  className="text-default-400"
                />
              }
              className="w-64"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              color="primary"
              onPress={onOpenAddSupplierModal}
              startContent={<Icon icon="solar:add-circle-bold" width={20} />}
              size="sm"
            >
              Nuovo Fornitore
            </Button>
          </div>
        </div>
      </div>

      {/* Tabella fornitori */}
      <Card className="w-full shadow-sm">
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Lista Fornitori</h2>
          <p className="text-default-500 text-sm">
            {filteredSuppliers.length} fornitori
          </p>
        </CardHeader>
        <Divider />
        <CardBody>
          <Table
            aria-label="Tabella fornitori"
            bottomContent={
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
                  <span className="text-small text-default-400">
                    Righe per pagina:
                  </span>
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
            }
            bottomContentPlacement="inside"
          >
            <TableHeader>
              <TableColumn>NOME</TableColumn>
              <TableColumn>EMAIL</TableColumn>
              <TableColumn>P.IVA</TableColumn>
              <TableColumn>NUMERO</TableColumn>
              <TableColumn>PAESE</TableColumn>
              <TableColumn>INDIRIZZO</TableColumn>
              <TableColumn align="center">AZIONI</TableColumn>
            </TableHeader>
            <TableBody>
              {paginatedSuppliers.length > 0 ? (
                paginatedSuppliers.map((supplier) => (
                  <TableRow key={supplier.SupplierId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <Icon
                            icon="solar:user-outline"
                            className="text-primary"
                            width={16}
                          />
                        </div>
                        <span className="font-medium">
                          {supplier.SupplierName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{supplier.SupplierEmail}</TableCell>
                    <TableCell>{supplier.SupplierVAT || "-"}</TableCell>
                    <TableCell>{supplier.SupplierNumber || "-"}</TableCell>
                    <TableCell>{supplier.SupplierCountry || "-"}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      <Tooltip content={supplier.SupplierAddress || "-"}>
                        <span>{supplier.SupplierAddress || "-"}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Tooltip content="Visualizza dettagli">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="default"
                            onPress={() => handleViewSupplier(supplier)}
                          >
                            <Icon icon="solar:eye-outline" width={18} />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Modifica fornitore">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="primary"
                            onPress={() => handleEditSupplier(supplier)}
                          >
                            <Icon icon="solar:pen-outline" width={18} />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Elimina fornitore">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => handleDeleteSupplier(supplier)}
                          >
                            <Icon
                              icon="solar:trash-bin-minimalistic-linear"
                              width={18}
                              className="text-danger"
                            />
                          </Button>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7}>
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

      {/* Modal per l'aggiunta di un nuovo fornitore */}
      <Modal
        isOpen={isAddSupplierModalOpen}
        onClose={onCloseAddSupplierModal}
        size="xl"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Aggiungi Nuovo Fornitore
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="mb-2 text-sm font-medium">Nome Azienda:</p>
                <Input
                  value={newSupplier.SupplierName || ""}
                  onChange={(e) =>
                    handleNewSupplierChange("SupplierName", e.target.value)
                  }
                  placeholder="Nome del fornitore"
                  isRequired
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Email:</p>
                <Input
                  value={newSupplier.SupplierEmail || ""}
                  onChange={(e) =>
                    handleNewSupplierChange("SupplierEmail", e.target.value)
                  }
                  placeholder="Email del fornitore"
                  type="email"
                  isRequired
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">P.IVA:</p>
                <Input
                  value={newSupplier.SupplierVAT || ""}
                  onChange={(e) =>
                    handleNewSupplierChange("SupplierVAT", e.target.value)
                  }
                  placeholder="Partita IVA"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Numero:</p>
                <Input
                  value={newSupplier.SupplierNumber || ""}
                  onChange={(e) =>
                    handleNewSupplierChange("SupplierNumber", e.target.value)
                  }
                  placeholder="Numero fornitore"
                  maxLength={10}
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Paese:</p>
                <Input
                  value={newSupplier.SupplierCountry || ""}
                  onChange={(e) =>
                    handleNewSupplierChange("SupplierCountry", e.target.value)
                  }
                  placeholder="Paese"
                />
              </div>
              <div className="md:col-span-2">
                <p className="mb-2 text-sm font-medium">Indirizzo:</p>
                <Input
                  value={newSupplier.SupplierAddress || ""}
                  onChange={(e) =>
                    handleNewSupplierChange("SupplierAddress", e.target.value)
                  }
                  placeholder="Indirizzo completo"
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="light"
              onPress={onCloseAddSupplierModal}
            >
              Annulla
            </Button>
            <Button
              color="primary"
              onPress={handleAddSupplier}
              isDisabled={
                !newSupplier.SupplierName || !newSupplier.SupplierEmail
              }
            >
              Salva Fornitore
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal per la modifica di un fornitore */}
      <Modal
        isOpen={isEditSupplierModalOpen}
        onClose={onCloseEditSupplierModal}
        size="xl"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Modifica Fornitore
          </ModalHeader>
          <ModalBody>
            {editingSupplier && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="mb-2 text-sm font-medium">Nome Azienda:</p>
                  <Input
                    value={editingSupplier.SupplierName || ""}
                    onChange={(e) =>
                      handleEditSupplierChange("SupplierName", e.target.value)
                    }
                    placeholder="Nome del fornitore"
                    isRequired
                  />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium">Email:</p>
                  <Input
                    value={editingSupplier.SupplierEmail || ""}
                    onChange={(e) =>
                      handleEditSupplierChange("SupplierEmail", e.target.value)
                    }
                    placeholder="Email del fornitore"
                    type="email"
                    isRequired
                  />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium">P.IVA:</p>
                  <Input
                    value={editingSupplier.SupplierVAT || ""}
                    onChange={(e) =>
                      handleEditSupplierChange("SupplierVAT", e.target.value)
                    }
                    placeholder="Partita IVA"
                  />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium">Numero:</p>
                  <Input
                    value={editingSupplier.SupplierNumber || ""}
                    onChange={(e) =>
                      handleEditSupplierChange("SupplierNumber", e.target.value)
                    }
                    placeholder="Numero fornitore"
                    maxLength={10}
                  />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium">Paese:</p>
                  <Input
                    value={editingSupplier.SupplierCountry || ""}
                    onChange={(e) =>
                      handleEditSupplierChange(
                        "SupplierCountry",
                        e.target.value
                      )
                    }
                    placeholder="Paese"
                  />
                </div>
                <div className="md:col-span-2">
                  <p className="mb-2 text-sm font-medium">Indirizzo:</p>
                  <Input
                    value={editingSupplier.SupplierAddress || ""}
                    onChange={(e) =>
                      handleEditSupplierChange(
                        "SupplierAddress",
                        e.target.value
                      )
                    }
                    placeholder="Indirizzo completo"
                  />
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="light"
              onPress={onCloseEditSupplierModal}
            >
              Annulla
            </Button>
            <Button
              color="primary"
              onPress={handleUpdateSupplier}
              isDisabled={
                !editingSupplier?.SupplierName ||
                !editingSupplier?.SupplierEmail
              }
            >
              Salva Modifiche
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal per la visualizzazione di un fornitore */}
      <Modal
        isOpen={isViewSupplierModalOpen}
        onClose={onCloseViewSupplierModal}
        size="lg"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Dettagli Fornitore
          </ModalHeader>
          <ModalBody>
            {viewingSupplier && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-default-500">
                      Nome Azienda
                    </p>
                    <p className="text-lg font-semibold">
                      {viewingSupplier.SupplierName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-default-500">
                      Email
                    </p>
                    <p className="text-lg">{viewingSupplier.SupplierEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-default-500">
                      P.IVA
                    </p>
                    <p className="text-lg">
                      {viewingSupplier.SupplierVAT || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-default-500">
                      Numero
                    </p>
                    <p className="text-lg">
                      {viewingSupplier.SupplierNumber || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-default-500">
                      Paese
                    </p>
                    <p className="text-lg">
                      {viewingSupplier.SupplierCountry || "-"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-default-500">
                    Indirizzo
                  </p>
                  <p className="text-lg">
                    {viewingSupplier.SupplierAddress || "-"}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm font-medium text-default-500">
                      Creato da
                    </p>
                    <p className="text-lg">
                      {employeeName || `ID: ${viewingSupplier.CreatedBy}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-default-500">
                      Data creazione
                    </p>
                    <p className="text-lg">
                      {new Date(viewingSupplier.CreatedAt).toLocaleDateString(
                        "it-IT"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-default-500">
                      Ultimo aggiornamento
                    </p>
                    <p className="text-lg">
                      {new Date(viewingSupplier.UpdatedAt).toLocaleDateString(
                        "it-IT"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="light"
              onPress={onCloseViewSupplierModal}
            >
              Chiudi
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal per la conferma eliminazione */}
      <Modal
        isOpen={isDeleteSupplierModalOpen}
        onClose={onCloseDeleteSupplierModal}
        size="md"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Icon
                icon="solar:danger-triangle-bold"
                className="text-danger"
                width={24}
              />
              Conferma Eliminazione
            </div>
          </ModalHeader>
          <ModalBody>
            {deletingSupplier && (
              <div className="space-y-4">
                <p>
                  Sei sicuro di voler eliminare il fornitore{" "}
                  <span className="font-semibold text-danger">
                    {deletingSupplier.SupplierName}
                  </span>
                  ?
                </p>
                <p className="text-sm text-default-500">
                  Questa azione non può essere annullata.
                </p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="light"
              onPress={onCloseDeleteSupplierModal}
            >
              Annulla
            </Button>
            <Button
              color="danger"
              onPress={handleConfirmDeleteSupplier}
              startContent={
                <Icon icon="solar:trash-bin-minimalistic-linear" width={18} />
              }
            >
              Elimina
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg
              transform transition-all duration-300 ease-in-out
              animate-fadeInDown
              ${
                toast.type === "success"
                  ? "bg-success-500 text-white"
                  : "bg-danger-500 text-white"
              }
            `}
          >
            <Icon
              icon={
                toast.type === "success"
                  ? "solar:check-circle-bold"
                  : "solar:danger-triangle-bold"
              }
              width={20}
            />
            <span className="font-medium">{toast.message}</span>
            <button
              onClick={() =>
                setToasts((prev) => prev.filter((t) => t.id !== toast.id))
              }
              className="ml-2 hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <Icon icon="solar:close-circle-bold" width={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Suppliers;
