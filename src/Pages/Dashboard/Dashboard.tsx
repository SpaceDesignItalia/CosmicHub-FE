import { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
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
  Chip,
  Pagination,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Tabs,
  Tab,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import ProductTable from "../../Components/Inventario/ProductTable";
import VehicleTable from "../../Components/Inventario/VehicleTable";

// Tipi di dati
interface Prodotto {
  id: string;
  nome: string;
  categoria: string;
  quantita: number;
  prezzo: number;
  stato: "Disponibile" | "Esaurito" | "Bassa giacenza";
}

interface Veicolo {
  id: string;
  targa: string;
  modello: string;
  tipo: string;
  capacita: number;
  stato: "Disponibile" | "In uso" | "In manutenzione";
  ultimaRevisione: string;
}

// Dati di esempio
const prodotti: Prodotto[] = [
  {
    id: "1",
    nome: "Prodotto A",
    categoria: "Elettronica",
    quantita: 150,
    prezzo: 99.99,
    stato: "Disponibile",
  },
  {
    id: "2",
    nome: "Prodotto B",
    categoria: "Abbigliamento",
    quantita: 50,
    prezzo: 29.99,
    stato: "Disponibile",
  },
  {
    id: "3",
    nome: "Prodotto C",
    categoria: "Casa",
    quantita: 5,
    prezzo: 199.5,
    stato: "Bassa giacenza",
  },
  {
    id: "4",
    nome: "Prodotto D",
    categoria: "Elettronica",
    quantita: 0,
    prezzo: 499.99,
    stato: "Esaurito",
  },
  {
    id: "5",
    nome: "Prodotto E",
    categoria: "Alimentari",
    quantita: 200,
    prezzo: 5.99,
    stato: "Disponibile",
  },
  {
    id: "6",
    nome: "Prodotto F",
    categoria: "Casa",
    quantita: 75,
    prezzo: 59.99,
    stato: "Disponibile",
  },
  {
    id: "7",
    nome: "Prodotto G",
    categoria: "Elettronica",
    quantita: 8,
    prezzo: 899.99,
    stato: "Bassa giacenza",
  },
  {
    id: "8",
    nome: "Prodotto H",
    categoria: "Abbigliamento",
    quantita: 120,
    prezzo: 19.99,
    stato: "Disponibile",
  },
];

const veicoli: Veicolo[] = [
  {
    id: "1",
    targa: "AB123CD",
    modello: "Iveco Daily",
    tipo: "Furgone",
    capacita: 3500,
    stato: "Disponibile",
    ultimaRevisione: "2023-09-15",
  },
  {
    id: "2",
    targa: "EF456GH",
    modello: "Fiat Ducato",
    tipo: "Furgone",
    capacita: 2800,
    stato: "In uso",
    ultimaRevisione: "2023-08-22",
  },
  {
    id: "3",
    targa: "IL789MN",
    modello: "Mercedes Sprinter",
    tipo: "Furgone",
    capacita: 3000,
    stato: "In manutenzione",
    ultimaRevisione: "2023-07-10",
  },
  {
    id: "4",
    targa: "OP012QR",
    modello: "Renault Master",
    tipo: "Furgone",
    capacita: 2500,
    stato: "Disponibile",
    ultimaRevisione: "2023-10-05",
  },
  {
    id: "5",
    targa: "ST345UV",
    modello: "Iveco Eurocargo",
    tipo: "Camion",
    capacita: 7500,
    stato: "Disponibile",
    ultimaRevisione: "2023-11-12",
  },
];

const categorie = [
  "Tutte",
  "Elettronica",
  "Abbigliamento",
  "Casa",
  "Alimentari",
];

const tipiVeicolo = ["Tutti", "Furgone", "Camion"];

// Interfaccia per gli elementi del dropdown
interface CategoriaItem {
  key: string;
  label: string;
}

// Preparando gli item del menu come oggetti
const categorieItems: CategoriaItem[] = categorie.map((cat, index) => ({
  key: index.toString(),
  label: cat,
}));

export default function Dashboard() {
  const [ricerca, setRicerca] = useState("");
  const [ricercaVeicolo, setRicercaVeicolo] = useState("");
  const [categoriaSelezionata, setCategoriaSelezionata] = useState("Tutte");
  const [tipoVeicoloSelezionato, setTipoVeicoloSelezionato] = useState("Tutti");
  const [paginaCorrente, setPaginaCorrente] = useState(1);
  const [paginaCorrenteVeicoli, setPaginaCorrenteVeicoli] = useState(1);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isOpenVeicolo,
    onOpen: onOpenVeicolo,
    onClose: onCloseVeicolo,
  } = useDisclosure();
  const [prodottoSelezionato, setProdottoSelezionato] =
    useState<Prodotto | null>(null);
  const [veicoloSelezionato, setVeicoloSelezionato] = useState<Veicolo | null>(
    null
  );

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

  // Paginazione prodotti
  const inizioIndice = (paginaCorrente - 1) * perPagina;
  const prodottiPaginati = prodottiFiltrati.slice(
    inizioIndice,
    inizioIndice + perPagina
  );

  // Paginazione veicoli
  const inizioIndiceVeicoli = (paginaCorrenteVeicoli - 1) * perPagina;
  const veicoliPaginati = veicoliFiltrati.slice(
    inizioIndiceVeicoli,
    inizioIndiceVeicoli + perPagina
  );

  // Statistiche prodotti
  const totProdotti = prodotti.length;
  const prodottiDisponibili = prodotti.filter(
    (p) => p.stato === "Disponibile"
  ).length;
  const prodottiEsauriti = prodotti.filter(
    (p) => p.stato === "Esaurito"
  ).length;
  const prodottiBassaGiacenza = prodotti.filter(
    (p) => p.stato === "Bassa giacenza"
  ).length;

  // Statistiche veicoli
  const totVeicoli = veicoli.length;
  const veicoliDisponibili = veicoli.filter(
    (v) => v.stato === "Disponibile"
  ).length;
  const veicoliInUso = veicoli.filter((v) => v.stato === "In uso").length;
  const veicoliInManutenzione = veicoli.filter(
    (v) => v.stato === "In manutenzione"
  ).length;

  // Apri modale con dettagli prodotto
  const apriFinestraProdotto = (prodotto: Prodotto) => {
    setProdottoSelezionato(prodotto);
    onOpen();
  };

  // Apri modale con dettagli veicolo
  const apriFinestraVeicolo = (veicolo: Veicolo) => {
    setVeicoloSelezionato(veicolo);
    onOpenVeicolo();
  };

  // Colore chip in base allo stato prodotto
  const statoColorMap = {
    Disponibile: "success",
    "Bassa giacenza": "warning",
    Esaurito: "danger",
  };

  // Colore chip in base allo stato veicolo
  const statoVeicoloColorMap = {
    Disponibile: "success",
    "In uso": "primary",
    "In manutenzione": "warning",
  };

  return (
    <div className="w-full flex-1 flex flex-col p-4 gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestione Magazzino</h1>
      </div>

      <Tabs aria-label="Opzioni" color="primary" variant="underlined" size="lg">
        <Tab key="prodotti" title="Prodotti">
          <ProductTable prodotti={prodotti} categorie={categorie} />
        </Tab>

        <Tab key="veicoli" title="Veicoli">
          <VehicleTable veicoli={veicoli} tipiVeicolo={tipiVeicolo} />
        </Tab>
      </Tabs>

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
                  <div>
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

      {/* Modale dettaglio veicolo */}
      <Modal isOpen={isOpenVeicolo} onClose={onCloseVeicolo}>
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
                    <p>{veicoloSelezionato.capacita} kg</p>
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
                <Button color="danger" variant="light" onPress={onCloseVeicolo}>
                  Chiudi
                </Button>
                <Button color="primary" onPress={onCloseVeicolo}>
                  Modifica
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
