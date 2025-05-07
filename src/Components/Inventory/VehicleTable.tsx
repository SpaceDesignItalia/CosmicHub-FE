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
interface Veicolo {
  id: string;
  targa: string;
  modello: string;
  tipo: string;
  capacita: number;
  stato: "Disponibile" | "In uso" | "In manutenzione";
  ultimaRevisione: string;
}

interface VehicleTableProps {
  veicoli: Veicolo[];
  tipiVeicolo: string[];
}

export default function VehicleTable({
  veicoli,
  tipiVeicolo,
}: VehicleTableProps) {
  const [ricercaVeicolo, setRicercaVeicolo] = useState("");
  const [tipoVeicoloSelezionato, setTipoVeicoloSelezionato] = useState("Tutti");
  const [paginaCorrenteVeicoli, setPaginaCorrenteVeicoli] = useState(1);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [veicoloSelezionato, setVeicoloSelezionato] = useState<Veicolo | null>(
    null
  );

  const perPagina = 5;

  // Filtro veicoli
  const veicoliFiltrati = veicoli.filter((veicolo) => {
    const matchRicerca =
      veicolo.modello.toLowerCase().includes(ricercaVeicolo.toLowerCase()) ||
      veicolo.targa.toLowerCase().includes(ricercaVeicolo.toLowerCase());
    const matchTipo =
      tipoVeicoloSelezionato === "Tutti" ||
      veicolo.tipo === tipoVeicoloSelezionato;
    return matchRicerca && matchTipo;
  });

  // Paginazione veicoli
  const inizioIndiceVeicoli = (paginaCorrenteVeicoli - 1) * perPagina;
  const veicoliPaginati = veicoliFiltrati.slice(
    inizioIndiceVeicoli,
    inizioIndiceVeicoli + perPagina
  );

  // Apri modale con dettagli veicolo
  const apriFinestraVeicolo = (veicolo: Veicolo) => {
    setVeicoloSelezionato(veicolo);
    onOpen();
  };

  // Colore chip in base allo stato veicolo
  const statoVeicoloColorMap = {
    Disponibile: "success",
    "In uso": "primary",
    "In manutenzione": "warning",
  };

  // Definizione delle colonne
  const columns = [
    { key: "targa", label: "TARGA", align: "start" },
    { key: "modello", label: "MODELLO", align: "start" },
    { key: "tipo", label: "TIPO", align: "start" },
    { key: "capacita", label: "CAPACITÀ (KG)", align: "end" },
    { key: "ultimaRevisione", label: "ULTIMA REVISIONE", align: "center" },
    { key: "stato", label: "STATO", align: "center" },
    { key: "azioni", label: "AZIONI", align: "end" },
  ];

  // Renderizza celle personalizzate
  const renderCell = (veicolo: Veicolo, columnKey: string) => {
    switch (columnKey) {
      case "targa":
        return <div className="font-medium text-left">{veicolo.targa}</div>;
      case "modello":
        return <div className="text-left">{veicolo.modello}</div>;
      case "tipo":
        return <div className="text-left">{veicolo.tipo}</div>;
      case "capacita":
        return (
          <div className="text-right">
            {veicolo.capacita.toLocaleString("it-IT")}
          </div>
        );
      case "ultimaRevisione":
        return (
          <div className="text-center">
            {new Date(veicolo.ultimaRevisione).toLocaleDateString("it-IT")}
          </div>
        );
      case "stato":
        return (
          <div className="flex justify-center">
            <Chip
              color={statoVeicoloColorMap[veicolo.stato] as any}
              variant="flat"
            >
              {veicolo.stato}
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
                onPress={() => apriFinestraVeicolo(veicolo)}
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
          <div className="text-left">{getKeyValue(veicolo, columnKey)}</div>
        );
    }
  };

  return (
    <>
      <Card className="w-full mt-6 shadow-sm rounded-xl overflow-hidden border-2 border-default-200">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold">Flotta Veicoli</h2>
              <Input
                placeholder="Cerca per targa o modello..."
                startContent={<Icon icon="solar:magnifer-line-duotone" />}
                value={ricercaVeicolo}
                onChange={(e) => setRicercaVeicolo(e.target.value)}
                className="w-60"
              />
              <Dropdown>
                <DropdownTrigger>
                  <Button variant="light">
                    {tipoVeicoloSelezionato}
                    <Icon icon="solar:arrow-down-linear" className="ml-2" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Tipi veicolo"
                  onAction={(key) =>
                    setTipoVeicoloSelezionato(tipiVeicolo[Number(key)])
                  }
                >
                  {tipiVeicolo.map((tipo, index) => (
                    <DropdownItem key={index.toString()}>{tipo}</DropdownItem>
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
              Nuovo Veicolo
            </Button>
          </div>
        </CardHeader>
        <CardBody className="p-0 ">
          <Table
            aria-label="Tabella veicoli"
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
            <TableBody emptyContent="Nessun veicolo trovato">
              {veicoliPaginati.map((veicolo) => (
                <TableRow key={veicolo.id}>
                  {(columnKey) => (
                    <TableCell>
                      {renderCell(veicolo, columnKey.toString())}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex w-full justify-center py-4 bg-default-100">
            <Pagination
              total={Math.ceil(veicoliFiltrati.length / perPagina)}
              initialPage={1}
              page={paginaCorrenteVeicoli}
              onChange={setPaginaCorrenteVeicoli}
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

      {/* Modale dettaglio veicolo */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          {veicoloSelezionato && (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Dettaglio Veicolo
              </ModalHeader>
              <ModalBody>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-small text-default-500">ID Veicolo</p>
                    <p>{veicoloSelezionato.id}</p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">Targa</p>
                    <p>{veicoloSelezionato.targa}</p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">Modello</p>
                    <p>{veicoloSelezionato.modello}</p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">Tipo</p>
                    <p>{veicoloSelezionato.tipo}</p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">Capacità</p>
                    <p>
                      {veicoloSelezionato.capacita.toLocaleString("it-IT")} kg
                    </p>
                  </div>
                  <div>
                    <p className="text-small text-default-500">
                      Ultima Revisione
                    </p>
                    <p>
                      {new Date(
                        veicoloSelezionato.ultimaRevisione
                      ).toLocaleDateString("it-IT")}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-small text-default-500">Stato</p>
                    <Chip
                      color={
                        statoVeicoloColorMap[veicoloSelezionato.stato] as any
                      }
                      variant="flat"
                    >
                      {veicoloSelezionato.stato}
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
