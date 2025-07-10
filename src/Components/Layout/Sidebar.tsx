"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  Accordion,
  AccordionItem,
  Avatar,
  Button,
  cn,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
  Listbox,
  ListboxItem,
  ListboxSection,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ScrollShadow,
  Spacer,
  Tooltip,
  useDisclosure,
  type ListboxProps,
  type ListboxSectionProps,
  type Selection,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Sostituisco l'import della chiave del localStorage con l'import del custom hook
import { useCustomTheme } from "../../providers/ThemeProvider";

export enum SidebarItemType {
  Nest = "nest",
}

export type SidebarItem = {
  key: string;
  title: string;
  icon?: string;
  href?: string;
  type?: SidebarItemType.Nest;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  items?: SidebarItem[];
  className?: string;
};

export type SidebarProps = Omit<ListboxProps<SidebarItem>, "children"> & {
  items: SidebarItem[];
  isCompact?: boolean;
  hideEndContent?: boolean;
  iconClassName?: string;
  sectionClasses?: ListboxSectionProps["classNames"];
  classNames?: ListboxProps["classNames"];
  defaultSelectedKey: string;
  onSelect?: (key: string) => void;
};

// Memoizzo i dati degli elementi della sidebar organizzati in modo più user-friendly
export const sectionNestedItems = [
  {
    key: "dashboard",
    title: "Dashboard",
    icon: "solar:home-2-bold-duotone",
    href: "/dashboard",
  },
  {
    key: "client-management",
    title: "Gestione Clienti",
    icon: "solar:users-group-two-rounded-bold-duotone",
    type: SidebarItemType.Nest,
    items: [
      {
        key: "customers",
        title: "Clienti",
        icon: "solar:users-group-rounded-linear",
        href: "/customers",
      },
      {
        key: "calendar",
        title: "Calendario",
        icon: "solar:calendar-bold",
        href: "/calendar",
      },
    ],
  },
  {
    key: "interventions",
    title: "Interventi",
    icon: "solar:settings-bold-duotone",
    type: SidebarItemType.Nest,
    items: [
      {
        key: "interventions-list",
        title: "Lista Interventi",
        icon: "solar:clipboard-list-bold",
        href: "/interventions",
      },
      {
        key: "interventions-assign",
        title: "Assegna Intervento",
        icon: "solar:user-check-rounded-bold",
        href: "/interventions/assign",
      },
      {
        key: "interventions-map",
        title: "Mappa Interventi",
        icon: "solar:map-point-bold-duotone",
        href: "/interventions/map",
      },
    ],
  },
  {
    key: "warehouse",
    title: "Magazzino",
    icon: "solar:box-line-duotone",
    type: SidebarItemType.Nest,
    items: [
      {
        key: "products",
        title: "Prodotti",
        icon: "solar:box-minimalistic-line-duotone",
        href: "/inventory/products",
      },
      {
        key: "categories",
        title: "Categorie",
        icon: "solar:tag-linear",
        href: "/inventory/categories",
      },
      {
        key: "movements",
        title: "Movimenti",
        icon: "solar:refresh-circle-linear",
        href: "/inventory/movements",
      },
      {
        key: "suppliers",
        title: "Fornitori",
        icon: "solar:users-group-rounded-bold",
        href: "/suppliers",
      },
    ],
  },
  {
    key: "fleet-team",
    title: "Veicoli & Team",
    icon: "mingcute:truck-line",
    type: SidebarItemType.Nest,
    items: [
      {
        key: "vehicles",
        title: "Veicoli",
        icon: "mingcute:truck-line",
        href: "/inventory/vehicles",
      },
      {
        key: "team",
        title: "Team Tecnico",
        icon: "mingcute:tool-line",
        href: "/team",
      },
    ],
  },
  {
    key: "documents",
    title: "Documenti",
    icon: "solar:documents-bold-duotone",
    type: SidebarItemType.Nest,
    items: [
      {
        key: "ddt",
        title: "DDT",
        icon: "solar:document-text-bold-duotone",
        href: "/documents/ddt",
      },
      {
        key: "vehicle-docs",
        title: "Documenti Veicoli",
        icon: "mingcute:truck-line",
        href: "/documents/vehicles",
      },
      {
        key: "company-docs",
        title: "Documenti Azienda",
        icon: "solar:buildings-2-bold-duotone",
        href: "/documents/company",
      },
      {
        key: "employee-docs",
        title: "Documenti Dipendenti",
        icon: "solar:user-id-bold-duotone",
        href: "/documents/employees",
      },
      {
        key: "reminders",
        title: "Scadenze & Reminder",
        icon: "solar:bell-bing-bold-duotone",
        href: "/documents/reminders",
      },
    ],
  },
  {
    key: "analytics",
    title: "Analytics",
    icon: "solar:chart-2-bold-duotone",
    href: "/analytics",
  },
];

// Memoizzo la funzione di logout
const handleLogout = async () => {
  try {
    const res = await axios.post("/Authentication/POST/Logout");
    console.log(res);

    if (res.status == 200) {
      window.location.href = "/login";
    }
  } catch (error) {
    console.log(error);
  }
};

interface User {
  name: string;
  surname: string;
  email: string;
  company?: string;
}

// Interfaccia per il tipo di magazzino
interface Warehouse {
  warehouse_id: string;
  WarehouseID?: string;
  WarehouseUUID?: string;
  WarehouseName?: string;
  name: string;
  location: string;
  WarehouseCode?: string;
  WarehouseCountry?: string;
  WarehouseAdress?: string;
  company_id: string;
  created_at: Date;
  created_by: string;
  CreatedAt?: Date;
  CreatedBy?: string;
  UpdatedAt?: Date;
  capacity: string;
  type: string;
  license_plate: string | null;
  last_inspection: string | null;
  type_name: string;
  IsActive?: boolean; // Stato di attività del magazzino conforme al modello
}

const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
  (
    {
      items = sectionNestedItems,
      isCompact,
      defaultSelectedKey,
      onSelect,
      hideEndContent,
      sectionClasses: sectionClassesProp = {},
      itemClasses: itemClassesProp = {},
      iconClassName,
      classNames,
      className,
      ...props
    },
    ref
  ) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState<User | null>(null);
    const [selected, setSelected] =
      React.useState<React.Key>(defaultSelectedKey);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const {
      isOpen: isDeleteModalOpen,
      onOpen: onDeleteModalOpen,
      onClose: onDeleteModalClose,
    } = useDisclosure();
    const [isMobile, setIsMobile] = React.useState(false);
    const [warehouseToDelete, setWarehouseToDelete] =
      useState<Warehouse | null>(null);

    // Stato per controllare gli accordion aperti
    const [expandedKeys, setExpandedKeys] = React.useState<Set<string>>(
      new Set()
    );

   

    // Stato per i magazzini
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

    // Flag per forzare il refresh dei magazzini - memoizzato
    const [refreshWarehouses, setRefreshWarehouses] = useState(false);

    // Usiamo la nuova API del tema
    const { isDark, toggleTheme } = useCustomTheme();

    // Memoizzo la selezione corrente per evitare ricalcoli non necessari
    const currentSelection = useMemo(() => {
      const currentPath = location.pathname;
      const firstPathSegment = currentPath.split("/")[1];

      if (!firstPathSegment) return "dashboard";

      // Prima cerco negli elementi di primo livello
      const topLevelItem = sectionNestedItems.find(
        (item) => item.key === firstPathSegment
      );

      if (topLevelItem) {
        return firstPathSegment;
      } else {
        // Poi cerco negli elementi nidificati
        for (const section of sectionNestedItems) {
          if (section.items) {
            const nestedItem = section.items.find(
              (item) => item.href === currentPath
            );
            if (nestedItem) {
              return nestedItem.key;
            }
          }
        }
      }

      return "dashboard";
    }, [location.pathname]);

    // Ottimizzazione: aggiorno lo stato solo quando necessario
    React.useEffect(() => {
      if (selected !== currentSelection) {
        setSelected(currentSelection);
      }
    }, [currentSelection, selected]);

    // Ottimizzazione: gestisco gli accordion aperti in modo più efficiente
    React.useEffect(() => {
      const currentPath = location.pathname;
      const firstPathSegment = currentPath.split("/")[1];

      // Se siamo in una sezione nidificata, apri l'accordion del parent
      for (const section of sectionNestedItems) {
        if (section.items && section.type === SidebarItemType.Nest) {
          const hasActiveChild = section.items.some(
            (item) => item.href === currentPath
          );

          if (hasActiveChild || section.key === firstPathSegment) {
            setExpandedKeys((prev) => {
              if (!prev.has(section.key)) {
                return new Set([...prev, section.key]);
              }
              return prev;
            });
          }
        }
      }
    }, [location.pathname]);

    // Ottimizzazione: riduco le dipendenze dell'effect per il caricamento dati
    React.useEffect(() => {
      let isMounted = true;

      const fetchData = async () => {
        try {
          // Fetch utente solo se non è già caricato
          if (!user) {
            const userResponse = await axios.get(
              "/Authentication/GET/GetSessionData"
            );
            const companyResponse = await axios.get(
              "/Company/GET/GetCompanyByCompanyId",
              {
                params: {
                  company_id: userResponse.data.company_id,
                },
              }
            );

            if (isMounted) {
              setUser({
                name: userResponse.data.name,
                surname: userResponse.data.surname,
                email: userResponse.data.email,
                company: companyResponse.data.name,
              });
            }
          }

          // Fetch magazzini
          const response = await axios.get("/Warehouse/GET/GetAllWarehouses");
          const warehouseItems = response.data;

          if (isMounted) {
            setWarehouses(warehouseItems);
          }
        } catch (error) {
          console.error("Errore nel caricamento dei dati:", error);
        }
      };

      fetchData();

      return () => {
        isMounted = false;
      };
    }, [refreshWarehouses]); // Rimosso user dalle dipendenze

    // Stato per il magazzino selezionato - memoizzato
    const [selectedWarehouse, setSelectedWarehouse] = React.useState<
      string | null
    >(() => {
      return localStorage.getItem("selectedWarehouse");
    });

    // Ottimizzazione: split dell'useEffect per il magazzino selezionato
    React.useEffect(() => {
      if (selectedWarehouse) {
        localStorage.setItem("selectedWarehouse", selectedWarehouse);
      }
    }, [selectedWarehouse]);

    // Ottimizzazione: effect separato per la gestione della navigazione
    React.useEffect(() => {
      // Gestisce il refresh dei magazzini quando si torna dalla pagina di creazione
      if (
        location.pathname === "/dashboard" &&
        location.state?.warehouseCreated
      ) {
        setRefreshWarehouses((prev) => !prev);
      }

      // Aggiorna il magazzino selezionato basandosi sul percorso corrente
      if (location.pathname.startsWith("/warehouses/")) {
        const warehouseId = location.pathname.split("/")[2];
        if (warehouseId && warehouseId !== selectedWarehouse) {
          setSelectedWarehouse(warehouseId);
        }
      }
    }, [location.pathname, location.state, selectedWarehouse]);

    // Ottimizzazione: gestione mobile e overflow del body - ridotte dipendenze
    React.useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };

      checkMobile();
      window.addEventListener("resize", checkMobile);

      return () => window.removeEventListener("resize", checkMobile);
    }, []);

    React.useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "unset";
      }
      return () => {
        document.body.style.overflow = "unset";
      };
    }, [isOpen]);

    // Memoizzo le classi per evitare ricreazione ad ogni render
    const sectionClasses = useMemo(
      () => ({
        ...sectionClassesProp,
        base: cn(sectionClassesProp?.base, "w-full", {
          "p-0 max-w-[44px]": isCompact,
        }),
        group: cn(sectionClassesProp?.group, {
          "flex flex-col gap-1": isCompact,
        }),
        heading: cn(sectionClassesProp?.heading, {
          hidden: isCompact,
        }),
      }),
      [sectionClassesProp, isCompact]
    );

    const itemClasses = useMemo(
      () => ({
        ...itemClassesProp,
        base: cn(itemClassesProp?.base, {
          "w-11 h-11 gap-0 p-0": isCompact,
        }),
      }),
      [itemClassesProp, isCompact]
    );

    // Memoizzo le azioni di selezione per evitare ricreazioni
    const handleSelectionChange = useCallback(
      (keys: Selection) => {
        const key = Array.from(keys)[0] as string;
        setSelected(key as React.Key);
        onSelect?.(key);

        // Cerco prima negli elementi di primo livello
        let selectedItem: SidebarItem | undefined = sectionNestedItems.find(
          (item: SidebarItem) => item.key === key
        );

        // Se non lo trovo, cerco negli elementi nidificati
        if (!selectedItem) {
          selectedItem = sectionNestedItems
            .flatMap((section: SidebarItem) => section.items || [])
            .find((item: SidebarItem) => item.key === key);

          // Se ho trovato un elemento nidificato, apri il suo parent
          if (selectedItem) {
            const parentSection = sectionNestedItems.find(
              (section: SidebarItem) =>
                section.items?.some((item: SidebarItem) => item.key === key)
            );
            if (parentSection) {
              setExpandedKeys((prev) => new Set([...prev, parentSection.key]));
            }
          }
        }

        // Navigo solo se l'elemento ha un href e non siamo già sulla pagina
        if (selectedItem?.href && location.pathname !== selectedItem.href) {
          navigate(selectedItem.href);
        }

        if (isMobile) {
          onClose();
        }
      },
      [onSelect, location.pathname, navigate, isMobile, onClose]
    );

    // Funzione per eliminare il magazzino
    const handleDeleteWarehouse = async () => {
      if (!warehouseToDelete) return;

      try {
        await axios.delete(
          `/Warehouse/DELETE/DeleteWarehouse/${
            warehouseToDelete.WarehouseID || warehouseToDelete.warehouse_id
          }`
        );

        // Se il magazzino eliminato era quello selezionato, deselezionalo
        if (
          selectedWarehouse ===
          (warehouseToDelete.WarehouseUUID || warehouseToDelete.warehouse_id)
        ) {
          setSelectedWarehouse(null);
          localStorage.removeItem("selectedWarehouse");
        }

        // Refresh dei magazzini
        setRefreshWarehouses((prev) => !prev);

        // Chiudi il modal
        onDeleteModalClose();
        setWarehouseToDelete(null);
      } catch (error) {
        console.error("Errore nell'eliminazione del magazzino:", error);
        // Qui potresti aggiungere una notifica di errore
      }
    };

    // Memoizzo il contenuto della sidebar per evitare re-render
    const SidebarContent = useMemo(
      () => (
        <div className="fixed left-0 top-0 z-40 h-screen w-64 max-w-64 bg-background text-foreground border-r border-divider">
          <div className="relative flex h-full w-full flex-1 flex-col bg-background p-4 overflow-hidden">
            <div
              className="flex items-center justify-between gap-2 px-2 cursor-pointer hover:opacity-80"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (location.pathname !== "/dashboard") {
                  navigate("/dashboard");
                }
              }}
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground">
                  <Icon
                    className="text-background"
                    icon="solar:rocket-2-linear"
                    width={24}
                  />
                </div>
                <span className="text-small font-bold uppercase text-foreground">
                  CosmicHub
                </span>
              </div>
              {isMobile && (
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  onPress={onClose}
                  className="md:hidden"
                >
                  <Icon icon="solar:close-circle-line-linear" width={24} />
                </Button>
              )}
            </div>

            <Spacer y={8} />

            <div
              className="flex cursor-pointer items-center gap-3 px-2 transition-opacity hover:opacity-80"
              onClick={() => {
                navigate("/settings");
              }}
            >
              <Dropdown showArrow>
                <DropdownTrigger>
                  <Button
                    fullWidth
                    className="h-[60px] justify-start gap-3 rounded-[14px] border-1 border-default-300 bg-transparent px-3 py-[10px]"
                  >
                    <div className="flex w-full items-center gap-3">
                      <Avatar
                        size="sm"
                        src="https://nextuipro.nyc3.cdn.digitaloceanspaces.com/components-images/avatars/3a906b3de8eaa53e14582edf5c918b5d.jpg"
                      />
                      <div className="flex flex-col text-left">
                        <p className="text-small font-semibold leading-5 text-foreground">
                          {user?.name} {user?.surname}
                        </p>
                        <p className="text-tiny">{user?.email}</p>
                      </div>
                    </div>
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Profile Actions"
                  className="w-[210px] bg-content1 px-[8px] py-[8px]"
                  variant="flat"
                >
                  <DropdownSection showDivider aria-label="profile-section-1">
                    <DropdownItem key="settings" href="/settings">
                      <div className="flex flex-row gap-2 items-center">
                        <Icon icon="solar:settings-bold" />
                        Impostazioni
                      </div>
                    </DropdownItem>
                    <DropdownItem
                      key="theme-toggle"
                      startContent={
                        <Icon
                          icon={
                            isDark ? "solar:moon-linear" : "solar:sun-2-linear"
                          }
                          width={18}
                          className=""
                        />
                      }
                      onPress={toggleTheme}
                    >
                      {isDark ? "Tema Scuro" : "Tema Chiaro"}
                    </DropdownItem>
                  </DropdownSection>

                  <DropdownSection
                    aria-label="profile-section-3"
                    className="mb-0"
                  >
                    <DropdownItem
                      key="logout"
                      onPress={handleLogout}
                      color="danger"
                    >
                      <div className="py-[4px] flex flex-row gap-2 items-center">
                        <Icon icon="solar:logout-2-outline" />
                        Esci
                      </div>
                    </DropdownItem>
                  </DropdownSection>
                </DropdownMenu>
              </Dropdown>
            </div>

          

            <ScrollShadow className="-mr-6 h-full max-h-full py-6 pr-6">
              <div className="flex flex-col -space-y-1">
                {sectionNestedItems.map((item) => {
                  // Se è un accordion (tipo Nest), renderizzalo direttamente
                  if (
                    !isCompact &&
                    item.type === SidebarItemType.Nest &&
                    item.items?.length
                  ) {
                    return (
                      <div key={item.key} className="w-full">
                        <Accordion
                          selectedKeys={expandedKeys}
                          onSelectionChange={(keys) => {
                            setExpandedKeys(
                              new Set(Array.from(keys).map(String))
                            );
                          }}
                          selectionMode="multiple"
                          variant="light"
                        >
                          <AccordionItem
                            key={item.key}
                            aria-label={item.title}
                            classNames={{
                              base: "px-0 my-0",
                              trigger:
                                "px-0 min-h-11 h-[44px] data-[hover=true]:bg-default-100 hover:bg-default-100 transition-colors rounded-large",
                              content: "px-0 pb-0",
                            }}
                            title={
                              <div className="flex items-center gap-5 pl-1 pr-3">
                                {item.icon && (
                                  <Icon
                                    className={cn(
                                      "text-default-700 group-data-[selected=true]:text-foreground-900 flex-shrink-0",
                                      iconClassName
                                    )}
                                    icon={item.icon ?? ""}
                                    width={24}
                                  />
                                )}
                                <span className="text-small font-medium text-default-700 group-data-[selected=true]:text-foreground-900 data-[hover=true]:text-foreground-900 transition-colors whitespace-nowrap overflow-hidden text-ellipsis">
                                  {item.title}
                                </span>
                              </div>
                            }
                          >
                            <AnimatePresence initial={false}>
                              {expandedKeys.has(item.key) && (
                                <motion.div
                                  key="accordion-content"
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{
                                    duration: 0.25,
                                    ease: "easeInOut",
                                  }}
                                  style={{ overflow: "hidden" }}
                                >
                                  {item.items && item.items?.length > 0 ? (
                                    <div
                                      className={`flex flex-col -space-y-1 mt-1 pl-3 border-l-1 ml-3 ${
                                        isDark
                                          ? "border-default-400"
                                          : "border-default-500"
                                      }`}
                                    >
                                      {item.items.map((subItem) => (
                                        <div
                                          key={`${item.key}-${subItem.key}`}
                                          className={cn(
                                            "flex items-center px-3 min-h-11 h-[44px] transition-colors cursor-pointer rounded-large",
                                            "hover:bg-default-100",
                                            subItem.href === location.pathname
                                              ? "bg-default-100 text-foreground-900"
                                              : "text-default-700 hover:text-foreground-900"
                                          )}
                                          onClick={() => {
                                            if (
                                              subItem.href &&
                                              location.pathname !== subItem.href
                                            ) {
                                              navigate(subItem.href);
                                            }
                                            if (isMobile) {
                                              onClose();
                                            }
                                          }}
                                        >
                                          {subItem.icon && (
                                            <Icon
                                              className={cn(
                                                "mr-3 flex-shrink-0",
                                                subItem.href ===
                                                  location.pathname
                                                  ? "text-foreground-900"
                                                  : "text-default-700"
                                              )}
                                              icon={subItem.icon}
                                              width={24}
                                            />
                                          )}
                                          <span className="text-small font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                                            {subItem.title}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : null}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    );
                  }

                  // Per gli elementi normali, usa un singolo ListboxItem
                  return (
                    <div key={`listbox-${item.key}`} className="w-full">
                      <Listbox
                        hideSelectedIcon
                        aria-label={`Elemento ${item.title}`}
                        className="list-none"
                        classNames={{
                          list: "items-center gap-0",
                        }}
                        color="default"
                        selectedKeys={
                          item.href === location.pathname ? [item.key] : []
                        }
                        selectionMode="single"
                        variant="flat"
                        onSelectionChange={(keys) => {
                          const key = Array.from(keys)[0] as string;
                          if (key === item.key) {
                            setSelected(key as React.Key);
                            onSelect?.(key);
                            if (item.href && location.pathname !== item.href) {
                              navigate(item.href);
                            }
                            if (isMobile) {
                              onClose();
                            }
                          }
                        }}
                      >
                        <ListboxItem
                          key={item.key}
                          textValue={item.title}
                          aria-label={item.title}
                          classNames={{
                            base: cn(
                              "flex items-center pl-2 pr-3 min-h-11 rounded-large h-[44px] data-[selected=true]:bg-default-100 data-[selected=true]:text-foreground-900 data-[hover=true]:bg-default-100 transition-colors"
                            ),
                            title: cn(
                              "text-small font-medium text-default-700 group-data-[selected=true]:text-foreground-900 data-[hover=true]:text-foreground-900 transition-colors whitespace-nowrap overflow-hidden text-ellipsis"
                            ),
                          }}
                          startContent={
                            isCompact ? null : item.icon ? (
                              <Icon
                                className={cn(
                                  "text-default-700 group-data-[selected=true]:text-foreground-900 flex-shrink-0 mr-3",
                                  iconClassName
                                )}
                                icon={item.icon}
                                width={24}
                              />
                            ) : (
                              (item as SidebarItem).startContent ?? null
                            )
                          }
                          title={isCompact ? null : item.title}
                        >
                          {isCompact ? (
                            <Tooltip content={item.title} placement="right">
                              <div className="flex w-full items-center justify-center">
                                {item.icon ? (
                                  <Icon
                                    className={cn(
                                      "text-default-700 group-data-[selected=true]:text-foreground-900",
                                      iconClassName
                                    )}
                                    icon={item.icon}
                                    width={24}
                                  />
                                ) : (
                                  (item as SidebarItem).startContent ?? null
                                )}
                              </div>
                            </Tooltip>
                          ) : null}
                        </ListboxItem>
                      </Listbox>
                    </div>
                  );
                })}
              </div>
            </ScrollShadow>

            <Spacer y={8} />

            <div className="mt-auto flex flex-col gap-4">
              <Dropdown placement="top-start">
                <DropdownTrigger>
                  <Button
                    fullWidth
                    variant={selectedWarehouse ? "solid" : "bordered"}
                    color={selectedWarehouse ? "primary" : "default"}
                    className={cn(
                      "justify-between transition-all duration-200",
                      selectedWarehouse
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : isDark
                        ? " data-[hover=true]:text-foreground"
                        : "text-default-700 data-[hover=true]:text-foreground-900"
                    )}
                    endContent={
                      <Icon
                        className={
                          selectedWarehouse
                            ? "text-primary-foreground"
                            : isDark
                            ? ""
                            : "text-default-700"
                        }
                        icon="solar:alt-arrow-down-linear"
                        width={16}
                      />
                    }
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        className={
                          selectedWarehouse
                            ? "text-primary-foreground"
                            : isDark
                            ? ""
                            : "text-default-700"
                        }
                        icon="mdi:warehouse"
                        width={24}
                      />
                      <span className="truncate">
                        {selectedWarehouse
                          ? (() => {
                              const warehouse = warehouses.find(
                                (w) =>
                                  (w.WarehouseUUID || w.warehouse_id) ===
                                  selectedWarehouse
                              );
                              return warehouse
                                ? `${
                                    warehouse.name ||
                                    warehouse.WarehouseName ||
                                    "Magazzino"
                                  }${
                                    warehouse.WarehouseCode
                                      ? ` (${warehouse.WarehouseCode})`
                                      : ""
                                  }`
                                : "Magazzino Selezionato";
                            })()
                          : "Magazzini"}
                      </span>
                    </div>
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Lista Magazzini"
                  className="py-2 min-w-[280px]"
                  variant="flat"
                  selectedKeys={selectedWarehouse ? [selectedWarehouse] : []}
                  selectionMode="single"
                  items={[
                    ...warehouses.map((warehouse) => ({
                      key: String(
                        warehouse.WarehouseUUID ||
                          warehouse.warehouse_id ||
                          warehouse.WarehouseID ||
                          warehouse.name ||
                          Math.random()
                      ),
                      warehouse,
                      type: "warehouse",
                    })),
                    ...(warehouses.length === 0
                      ? [{ key: "no-warehouses", type: "empty" }]
                      : []),
                    { key: "add-warehouse", type: "add" },
                  ]}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    if (
                      selectedKey &&
                      selectedKey !== "no-warehouses" &&
                      selectedKey !== "add-warehouse"
                    ) {
                      setSelectedWarehouse(selectedKey);
                    }
                  }}
                >
                  {(dropdownItem: any) => (
                    <DropdownItem
                      key={dropdownItem.key}
                      className={cn(
                        "transition-all duration-200 relative group",
                        dropdownItem.type === "add"
                          ? "text-warning font-medium data-[hover=true]:bg-warning/10"
                          : dropdownItem.type === "empty"
                          ? ""
                          : selectedWarehouse === dropdownItem.key
                          ? "bg-primary/10 text-primary font-medium"
                          : "data-[hover=true]:bg-default-100"
                      )}
                      isDisabled={dropdownItem.type === "empty"}
                      startContent={
                        dropdownItem.type === "add" ? (
                          <Icon
                            icon="solar:add-circle-bold"
                            width={20}
                            className="text-warning"
                          />
                        ) : dropdownItem.type === "empty" ? null : (
                          <Icon
                            icon="solar:warehouse-bold"
                            width={20}
                            className={cn(
                              selectedWarehouse === dropdownItem.key
                                ? "text-primary"
                                : "text-default-700"
                            )}
                          />
                        )
                      }
                      endContent={
                        dropdownItem.warehouse?.IsActive === false ? (
                          <Icon
                            icon="solar:close-circle-bold"
                            width={16}
                            className="text-danger"
                          />
                        ) : null
                      }
                      onPress={() => {
                        if (dropdownItem.type === "add") {
                          navigate("/inventory/warehouses/add");
                        } else if (dropdownItem.warehouse) {
                          const warehouseId =
                            dropdownItem.warehouse.WarehouseUUID ||
                            dropdownItem.warehouse.warehouse_id ||
                            "";
                          setSelectedWarehouse(warehouseId);
                        }
                        if (isMobile) onClose();
                      }}
                    >
                      {dropdownItem.type === "add"
                        ? "Aggiungi magazzino"
                        : dropdownItem.type === "empty"
                        ? "Nessun magazzino disponibile"
                        : `${
                            dropdownItem.warehouse?.name ||
                            dropdownItem.warehouse?.WarehouseName ||
                            "Magazzino senza nome"
                          }${
                            dropdownItem.warehouse?.WarehouseCode
                              ? ` (${dropdownItem.warehouse.WarehouseCode})`
                              : ""
                          }`}
                    </DropdownItem>
                  )}
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
        </div>
      ),
      [
        isMobile,
        onClose,
        location.pathname,
        navigate,
        user,
        isDark,
        toggleTheme,
        ref,
        className,
        classNames,
        itemClasses,
        sectionClasses,
        selected,
        handleSelectionChange,
        selectedWarehouse,
        warehouses,
        setSelectedWarehouse,
        isDeleteModalOpen,
        onDeleteModalOpen,
        onDeleteModalClose,
      ]
    );

    if (isMobile) {
      return (
        <>
          <Button
            isIconOnly
            variant="light"
            className="fixed left-4 top-4 z-50 md:hidden"
            onPress={onOpen}
          >
            <Icon icon="solar:hamburger-menu-line-linear" width={24} />
          </Button>
          <Modal
            isOpen={isOpen}
            onClose={onClose}
            placement="top"
            classNames={{
              base: "m-0 h-full max-w-[288px]",
              wrapper: "items-start justify-start",
              body: "p-0",
              backdrop: "bg-black/50 backdrop-blur-sm",
            }}
            motionProps={{
              variants: {
                enter: {
                  x: 0,
                  opacity: 1,
                  transition: {
                    duration: 0.3,
                    ease: "easeOut",
                  },
                },
                exit: {
                  x: -20,
                  opacity: 0,
                  transition: {
                    duration: 0.2,
                    ease: "easeIn",
                  },
                },
              },
            }}
          >
            <ModalContent className=" bg-background text-foreground">
              {SidebarContent}
            </ModalContent>
          </Modal>
        </>
      );
    }

    return (
      <>
        {SidebarContent}
        {/* Modal per conferma eliminazione magazzino */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={onDeleteModalClose}
          placement="center"
          backdrop="blur"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Icon
                      icon="solar:danger-triangle-bold"
                      width={24}
                      className="text-danger"
                    />
                    <span>Conferma eliminazione</span>
                  </div>
                </ModalHeader>
                <ModalBody>
                  <p>
                    Sei sicuro di voler eliminare il magazzino{" "}
                    <span className="font-semibold text-danger">
                      {warehouseToDelete?.name ||
                        warehouseToDelete?.WarehouseName}
                      {warehouseToDelete?.WarehouseCode &&
                        ` (${warehouseToDelete.WarehouseCode})`}
                    </span>
                    ?
                  </p>
                  <p className="text-small text-default-500">
                    Questa azione non può essere annullata e tutti i dati
                    associati al magazzino verranno eliminati definitivamente.
                  </p>
                </ModalBody>
                <ModalFooter>
                  <Button color="default" variant="light" onPress={onClose}>
                    Annulla
                  </Button>
                  <Button
                    color="danger"
                    onPress={handleDeleteWarehouse}
                    startContent={
                      <Icon icon="solar:trash-bin-2-bold" width={16} />
                    }
                  >
                    Elimina magazzino
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </>
    );
  }
);

Sidebar.displayName = "Sidebar";

export default Sidebar;
