import { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Chip,
  Pagination,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  getKeyValue,
} from "@heroui/react";
import { Icon } from "@iconify/react";

// Tipi di dati
interface Prodotto {
  id: string;
  nome: string;
  categoria: string;
  quantita: number;
  prezzo: number;
  stato: "Disponibile" | "Esaurito" | "Bassa giacenza";
}

interface ProductTableProps {
  prodotti: Prodotto[];
  categorie: string[];
}

export default function ProductTable({
  prodotti,
  categorie,
}: ProductTableProps) {
  const [ricerca, setRicerca] = useState("");
  const [categoriaSelezionata, setCategoriaSelezionata] = useState("Tutte");
  const [paginaCorrente, setPaginaCorrente] = useState(1);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [prodottoSelezionato, setProdottoSelezionato] =
    useState<Prodotto | null>(null);

  const perPagina = 5;

  // Filtro prodotti
  const prodottiFiltrati = prodotti.filter((prodotto) => {
    const matchRicerca = prodotto.nome
      .toLowerCase()
      .includes(ricerca.toLowerCase());
    const matchCategoria =
      categoriaSelezionata === "Tutte" ||
      prodotto.categoria === categoriaSelezionata;
    return matchRicerca && matchCategoria;
  });

  // Paginazione prodotti
  const inizioIndice = (paginaCorrente - 1) * perPagina;
  const prodottiPaginati = prodottiFiltrati.slice(
    inizioIndice,
    inizioIndice + perPagina
  );

  // Apri modale con dettagli prodotto
  const apriFinestraProdotto = (prodotto: Prodotto) => {
    setProdottoSelezionato(prodotto);
    onOpen();
  };

  // Colore chip in base allo stato prodotto
  const statoColorMap = {
    Disponibile: "success",
    "Bassa giacenza": "warning",
    Esaurito: "danger",
  };

  // Definizione delle colonne
  const columns = [
    { key: "nome", label: "NOME", align: "start" },
    { key: "categoria", label: "CATEGORIA", align: "start" },
    { key: "quantita", label: "QUANTITÀ", align: "center" },
    { key: "prezzo", label: "PREZZO", align: "end" },
    { key: "stato", label: "STATO", align: "center" },
    { key: "azioni", label: "AZIONI", align: "end" },
  ];

  // Renderizza celle personalizzate
  const renderCell = (prodotto: Prodotto, columnKey: string) => {
    switch (columnKey) {
      case "nome":
        return <div className="font-medium text-left">{prodotto.nome}</div>;
      case "categoria":
        return <div className="text-left">{prodotto.categoria}</div>;
      case "quantita":
        return <div className="text-center">{prodotto.quantita}</div>;
      case "prezzo":
        return <div className="text-right">€{prodotto.prezzo.toFixed(2)}</div>;
      case "stato":
        return (
          <div className="flex justify-center">
            <Chip color={statoColorMap[prodotto.stato] as any} variant="flat">
              {prodotto.stato}
            </Chip>
          </div>
        );
      case "azioni":
        return (
          <div className="flex justify-end gap-2">
            <Tooltip content="Visualizza dettagli">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => apriFinestraProdotto(prodotto)}
              >
                <Icon icon="solar:eye-linear" width={20} />
              </Button>
            </Tooltip>
            <Tooltip content="Modifica">
              <Button isIconOnly size="sm" variant="light">
                <Icon icon="solar:pen-linear" width={20} />
              </Button>
            </Tooltip>
            <Tooltip content="Elimina">
              <Button isIconOnly size="sm" variant="light" color="danger">
                <Icon icon="solar:trash-bin-trash-linear" width={20} />
              </Button>
            </Tooltip>
          </div>
        );
      default:
        return (
          <div className="text-left">{getKeyValue(prodotto, columnKey)}</div>
        );
    }
  };

  return (
    <>
      <Card className="w-full mt-6 shadow-sm rounded-xl overflow-hidden border-2 border-default-200">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold">Inventario Prodotti</h2>
              <Input
                placeholder="Cerca prodotto..."
                startContent={<Icon icon="solar:magnifer-line-duotone" />}
                value={ricerca}
                onChange={(e) => setRicerca(e.target.value)}
                className="w-60"
              />
              <Dropdown>
                <DropdownTrigger>
                  <Button variant="light">
                    {categoriaSelezionata}
                    <Icon icon="solar:arrow-down-linear" className="ml-2" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Categorie prodotti"
                  onAction={(key) =>
                    setCategoriaSelezionata(categorie[Number(key)])
                  }
                >
                  {categorie.map((cat, index) => (
                    <DropdownItem key={index.toString()}>{cat}</DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            </div>
            <Button color="primary">
              <Icon
                icon="material-symbols:add"
                className="mr-1"
                width={24}
                height={24}
              />
              Nuovo Prodotto
            </Button>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <Table
            aria-label="Tabella prodotti"
            hideHeader={false}
            shadow="none"
            className="rounded-md overflow-hidden"
            classNames={{
              base: "shadow-none",
              table: "min-w-full",
              thead: "border-none",
              tbody: "border-none",
              tr: "[&:not(:last-child)]:border-b [&:not(:last-child)]:border-default-100 hover:bg-default-50",
              th: "text-default-700 font-medium text-xs uppercase tracking-wider py-3 px-3 border-none",
              td: "py-3 px-3 border-none",
              tfoot: "border-none",
              wrapper: "border-none",
            }}
          >
            <TableHeader>
              {columns.map((column) => (
                <TableColumn
                  key={column.key}
                  align={column.align as any}
                  className={`${
                    column.align === "end"
                      ? "text-right"
                      : column.align === "center"
                      ? "text-center"
                      : "text-left"
                  }`}
                >
                  {column.label}
                </TableColumn>
              ))}
            </TableHeader>
            <TableBody emptyContent="Nessun prodotto trovato">
              {prodottiPaginati.map((prodotto) => (
                <TableRow key={prodotto.id}>
                  {(columnKey) => (
                    <TableCell>
                      {renderCell(prodotto, columnKey.toString())}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex w-full justify-center py-4 bg-default-100">
            <Pagination
              total={Math.ceil(prodottiFiltrati.length / perPagina)}
              initialPage={1}
              page={paginaCorrente}
              onChange={setPaginaCorrente}
              showControls
              size="lg"
              radius="lg"
              variant="bordered"
              classNames={{
                wrapper: "gap-2",
                item: "w-10 h-10 text-medium",
                cursor: "bg-primary text-white font-medium",
                prev: "bg-default-100 border border-default-300",
                next: "bg-default-100 border border-default-300",
              }}
            />
          </div>
        </CardBody>
      </Card>

      {/* Modale dettaglio prodotto */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          {prodottoSelezionato && (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Dettaglio Prodotto
              </ModalHeader>
              <ModalBody>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-small text-default-500">ID Prodotto</p>
                    <p>{prodottoSelezionato.id}</p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">Nome</p>
                    <p>{prodottoSelezionato.nome}</p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">Categoria</p>
                    <p>{prodottoSelezionato.categoria}</p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">Quantità</p>
                    <p>{prodottoSelezionato.quantita}</p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">Prezzo</p>
                    <p>€{prodottoSelezionato.prezzo.toFixed(2)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-small text-default-500">Stato</p>
                    <Chip
                      color={statoColorMap[prodottoSelezionato.stato] as any}
                      variant="flat"
                    >
                      {prodottoSelezionato.stato}
                    </Chip>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Chiudi
                </Button>
                <Button color="primary" onPress={onClose}>
                  Modifica
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
