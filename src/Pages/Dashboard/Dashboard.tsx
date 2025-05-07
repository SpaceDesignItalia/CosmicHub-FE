"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardBody, Button, Avatar, Tabs, Tab, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/react";
import { Icon } from "@iconify/react";

// Interfaccia per il tipo Furgone
interface Furgone {
  id: string;
  targa: string;
  modello: string;
}

// Interfaccia per il tipo Dipendente
interface Dipendente {
  id: number;
  nome: string;
  username: string;
  ruolo: string;
  foto: string;
  stato: "Attivo" | "In intervento" | "Disponibile" | "Ferie" | "In formazione";
  interventiMese: number;
  ultimoIntervento: string;
  valutazione: number;
  specializzazioni: string[];
  furgoneAssegnato?: Furgone;
  bio: string;
  interventiCompletati: number;
  interventiInCorso: number;
}

// Dati di esempio per i dipendenti
const dipendenti: Dipendente[] = [
  {
    id: 1,
    nome: "Marco Rossi",
    username: "@marco.rossi",
    ruolo: "Tecnico Senior",
    foto: "https://i.pravatar.cc/150?img=1",
    stato: "Attivo",
    interventiMese: 28,
    ultimoIntervento: "2023-11-15",
    valutazione: 4.8,
    specializzazioni: ["Caldaie", "Climatizzatori"],
    furgoneAssegnato: {
      id: "V1",
      targa: "AB123CD",
      modello: "Iveco Daily"
    },
    bio: "Specialista in impianti di riscaldamento e climatizzazione con oltre 10 anni di esperienza nel settore.",
    interventiCompletati: 342,
    interventiInCorso: 3
  },
  {
    id: 2,
    nome: "Laura Bianchi",
    username: "@laura.bianchi",
    ruolo: "Tecnico Specializzato",
    foto: "https://i.pravatar.cc/150?img=5",
    stato: "In intervento",
    interventiMese: 22,
    ultimoIntervento: "2023-11-14",
    valutazione: 4.7,
    specializzazioni: ["Pompe di Calore", "Fotovoltaico"],
    furgoneAssegnato: {
      id: "V2",
      targa: "EF456GH",
      modello: "Fiat Ducato"
    },
    bio: "Esperta in energie rinnovabili e sistemi di riscaldamento a basso consumo energetico.",
    interventiCompletati: 215,
    interventiInCorso: 2
  },
  {
    id: 3,
    nome: "Giuseppe Verdi",
    username: "@giuseppe.verdi",
    ruolo: "Tecnico Junior",
    foto: "https://i.pravatar.cc/150?img=3",
    stato: "Disponibile",
    interventiMese: 15,
    ultimoIntervento: "2023-11-13",
    valutazione: 4.5,
    specializzazioni: ["Climatizzatori"],
    bio: "Nuovo membro del team con specializzazione in impianti di climatizzazione residenziali.",
    interventiCompletati: 87,
    interventiInCorso: 0
  },
  {
    id: 4,
    nome: "Francesca Romano",
    username: "@francesca.romano",
    ruolo: "Tecnico Senior",
    foto: "https://i.pravatar.cc/150?img=6",
    stato: "Ferie",
    interventiMese: 18,
    ultimoIntervento: "2023-11-05",
    valutazione: 4.9,
    specializzazioni: ["Caldaie", "Termostati Smart"],
    furgoneAssegnato: {
      id: "V3",
      targa: "IL789MN",
      modello: "Mercedes Sprinter"
    },
    bio: "Specialista in termostati smart e sistemi di controllo remoto per impianti di riscaldamento.",
    interventiCompletati: 298,
    interventiInCorso: 0
  },
  {
    id: 5,
    nome: "Antonio Esposito",
    username: "@antonio.esposito",
    ruolo: "Tecnico Specializzato",
    foto: "https://i.pravatar.cc/150?img=8",
    stato: "Attivo",
    interventiMese: 25,
    ultimoIntervento: "2023-11-14",
    valutazione: 4.6,
    specializzazioni: ["Caldaie", "Impianti Industriali"],
    furgoneAssegnato: {
      id: "V4",
      targa: "OP012QR",
      modello: "Renault Master"
    },
    bio: "Specializzato in impianti industriali e sistemi di riscaldamento per grandi superfici.",
    interventiCompletati: 267,
    interventiInCorso: 1
  },
  {
    id: 6,
    nome: "Martina Ricci",
    username: "@martina.ricci",
    ruolo: "Tecnico Junior",
    foto: "https://i.pravatar.cc/150?img=9",
    stato: "In formazione",
    interventiMese: 10,
    ultimoIntervento: "2023-11-12",
    valutazione: 4.2,
    specializzazioni: ["Assistente Tecnico"],
    bio: "In formazione per diventare tecnico specializzato in manutenzione caldaie.",
    interventiCompletati: 42,
    interventiInCorso: 1
  }
];

// Componente per la card del dipendente
function DipendenteCard({ dipendente }: { dipendente: Dipendente }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activeTab, setActiveTab] = useState("info");

  // Colore di sfondo in base al ruolo
  const getBgGradient = (ruolo: string) => {
    switch (ruolo) {
      case "Tecnico Senior": return "bg-gradient-to-br from-primary-300 via-primary-400 to-primary-500";
      case "Tecnico Specializzato": return "bg-gradient-to-br from-secondary-300 via-secondary-400 to-secondary-500";
      case "Tecnico Junior": return "bg-gradient-to-br from-warning-300 via-warning-400 to-warning-500";
      default: return "bg-gradient-to-br from-default-300 via-default-400 to-default-500";
    }
  };

  // Colore in base allo stato
  const getStatoColor = (stato: string): "success" | "primary" | "secondary" | "warning" | "default" | "danger" => {
    switch (stato) {
      case "Attivo": return "success";
      case "In intervento": return "primary";
      case "Disponibile": return "secondary";
      case "Ferie": return "warning";
      case "In formazione": return "warning";
      default: return "default";
    }
  };

  return (
    <>
      <Card className="w-full shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className={`relative flex h-[100px] flex-col justify-end overflow-visible ${getBgGradient(dipendente.ruolo)}`}>
          <Avatar
            src={dipendente.foto}
            showFallback
            name={dipendente.nome.split(' ').map((n: string) => n[0]).join('')}
            className="h-20 w-20 translate-y-12 border-3 border-white"
          />
          <Button
            className="absolute right-3 top-3 bg-white/90 text-primary-600 dark:bg-white/30 dark:text-white"
            radius="full"
            size="sm"
            variant="light"
            onPress={onOpen}
          >
            Dettagli
          </Button>
          {dipendente.furgoneAssegnato && (
            <div className="absolute left-3 top-3 bg-white/90 dark:bg-black/70 rounded-lg p-1.5 flex items-center gap-1.5 shadow-sm border border-primary/10">
              <Icon icon="solar:truck-bold" className="text-primary-600 dark:text-primary" />
              <span className="text-xs font-medium text-primary-600 dark:text-white">{dipendente.furgoneAssegnato.targa}</span>
            </div>
          )}
        </CardHeader>
        <CardBody>
          <div className="pb-2 pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-large font-medium">{dipendente.nome}</p>
                <p className="text-small text-default-700">{dipendente.username}</p>
              </div>
              <Chip size="sm" color={getStatoColor(dipendente.stato)} variant="flat">{dipendente.stato}</Chip>
            </div>
            <div className="flex gap-2 pb-1 pt-2 flex-wrap">
              {dipendente.specializzazioni.map((spec: string, idx: number) => (
                <Chip key={idx} variant="flat" size="sm">{spec}</Chip>
              ))}
            </div>
            {dipendente.furgoneAssegnato && (
              <div className="py-2">
                <p className="text-small text-default-900">Furgone assegnato:</p>
                <p className="text-small font-medium">
                  {dipendente.furgoneAssegnato.modello} - {dipendente.furgoneAssegnato.targa}
                </p>
              </div>
            )}
        
          </div>
        </CardBody>
      </Card>

      {/* Modal con dettagli */}
      <Modal isOpen={isOpen} onClose={onClose} size="3xl">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Dettagli Tecnico
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center">
                <Avatar
                  src={dipendente.foto}
                  showFallback
                  name={dipendente.nome.split(' ').map((n: string) => n[0]).join('')}
                  className="h-32 w-32 mb-4"
                />
                <h3 className="text-xl font-semibold">{dipendente.nome}</h3>
                <p className="text-default-500">{dipendente.username}</p>
                <p className="text-default-900 mt-1">{dipendente.ruolo}</p>
                <Chip size="md" color={getStatoColor(dipendente.stato)} variant="flat" className="mt-2">{dipendente.stato}</Chip>
              </div>
              
              <div className="flex-1">
                <Tabs 
                  selectedKey={activeTab}
                  onSelectionChange={(key) => setActiveTab(key as string)}
                  fullWidth
                >
                  <Tab key="info" title="Informazioni">
                    <div className="py-2">
                      <h4 className="text-medium font-medium mb-2">Bio</h4>
                      <p className="text-default-900">{dipendente.bio}</p>
                      
                      <h4 className="text-medium font-medium mt-4 mb-2">Specializzazioni</h4>
                      <div className="flex gap-2 flex-wrap">
                        {dipendente.specializzazioni.map((spec: string, idx: number) => (
                          <Chip key={idx} variant="flat">{spec}</Chip>
                        ))}
                      </div>
                      
                      {dipendente.furgoneAssegnato && (
                        <>
                          <h4 className="text-medium font-medium mt-4 mb-2">Furgone Assegnato</h4>
                          <Card className="bg-default-50">
                            <CardBody className="py-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-primary/10">
                                  <Icon icon="solar:truck-bold" width={24} height={24} className="text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{dipendente.furgoneAssegnato.modello}</p>
                                  <p className="text-small text-default-500">Targa: {dipendente.furgoneAssegnato.targa}</p>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        </>
                      )}
                    </div>
                  </Tab>
                  <Tab key="stats" title="Statistiche">
                    <div className="py-2">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-default-50">
                          <CardBody className="py-4 text-center">
                            <p className="text-xl font-bold">{dipendente.interventiCompletati}</p>
                            <p className="text-default-500">Interventi Completati</p>
                          </CardBody>
                        </Card>
                        <Card className="bg-default-50">
                          <CardBody className="py-4 text-center">
                            <p className="text-xl font-bold">{dipendente.interventiInCorso}</p>
                            <p className="text-default-500">Interventi in Corso</p>
                          </CardBody>
                        </Card>
                        <Card className="bg-default-50">
                          <CardBody className="py-4 text-center">
                            <p className="text-xl font-bold">{dipendente.valutazione}/5</p>
                            <p className="text-default-500">Valutazione Media</p>
                          </CardBody>
                        </Card>
                      </div>
                      
                      <h4 className="text-medium font-medium mt-4 mb-2">Attività Recenti</h4>
                      <Card className="bg-default-50">
                        <CardBody>
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="p-1 rounded-full bg-success/10">
                                  <Icon icon="solar:check-circle-bold" width={16} height={16} className="text-success" />
                                </div>
                                <span>Intervento completato</span>
                              </div>
                              <span className="text-small text-default-500">Oggi</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="p-1 rounded-full bg-primary/10">
                                  <Icon icon="solar:calendar-mark-bold" width={16} height={16} className="text-primary" />
                                </div>
                                <span>Intervento programmato</span>
                              </div>
                              <span className="text-small text-default-500">Ieri</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="p-1 rounded-full bg-warning/10">
                                  <Icon icon="solar:document-add-bold" width={16} height={16} className="text-warning" />
                                </div>
                                <span>Report inviato</span>
                              </div>
                              <span className="text-small text-default-500">3 giorni fa</span>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    </div>
                  </Tab>
                </Tabs>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Chiudi
            </Button>
            <Button color="primary" onPress={onClose}>
              OK
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default function Dashboard() {
  return (
    <div className="w-full flex-1 flex flex-col p-4 gap-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon icon="solar:users-group-rounded-bold" className="text-primary" width={28} />
          </div>
          <h1 className="text-2xl font-bold">Team Tecnico</h1>
        </div>
        <Button color="primary" startContent={<Icon icon="solar:add-circle-bold" />}>
          Nuovo Dipendente
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dipendenti.map(dipendente => (
          <DipendenteCard key={dipendente.id} dipendente={dipendente} />
        ))}
      </div>
    </div>
  );
}