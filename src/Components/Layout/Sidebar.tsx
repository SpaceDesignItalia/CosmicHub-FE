"use client";

import React, { useEffect, useState } from "react";
import {
  Accordion,
  AccordionItem,
  Avatar,
  Button,
  cn,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Listbox,
  ListboxItem,
  ListboxSection,
  Modal,
  ModalContent,
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

export const sectionNestedItems = [
  {
    key: "home",
    title: "Home",
    icon: "solar:home-2-linear",
    href: "/dashboard",
  },
  {
    key: "analytics",
    title: "Analitica",
    icon: "solar:chart-2-linear",
    href: "/analytics",
  },
  {
    key: "suppliers",
    title: "Fornitori",
    icon: "solar:users-group-rounded-bold",
    href: "/suppliers",
  },
  {
    key: "vehicles",
    title: "Veicoli",
    icon: "mingcute:truck-line",
    href: "/inventory/vehicles",
  },
  {
    key: "inventory",
    title: "Inventario",
    icon: "solar:box-line-duotone",
    type: SidebarItemType.Nest,
    items: [
      {
        key: "products",
        title: "Products",
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
    ],
  },
  {
    key: "automations",
    title: "Automazioni",
    icon: "majesticons:puzzle-line",
    href: "/automations",
  },
];

interface ThemeSwitchProps {
  onToggle: () => void;
  isDark: boolean;
}

const ThemeSwitch = ({ onToggle, isDark }: ThemeSwitchProps) => {
  return (
    <Button
      fullWidth
      className={cn(
        "justify-start",
        isDark
          ? "text-default-500 data-[hover=true]:text-foreground"
          : "text-default-700 data-[hover=true]:text-foreground-900"
      )}
      startContent={
        <Icon
          className={isDark ? "text-default-500" : "text-default-700"}
          icon={isDark ? "solar:moon-linear" : "solar:sun-2-linear"}
          width={24}
        />
      }
      variant="light"
      onPress={onToggle}
    >
      {isDark ? "Dark Theme" : "Light Theme"}
    </Button>
  );
};

interface User {
  name: string;
  surname: string;
  company: string;
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
    const [user, setUser] = useState<User | null>(null);
    const [selected, setSelected] =
      React.useState<React.Key>(defaultSelectedKey);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [isMobile, setIsMobile] = React.useState(false);
    const location = useLocation();

    // Aggiorno la selezione basata sul percorso corrente
    React.useEffect(() => {
      const currentPath = location.pathname;
      const firstPathSegment = currentPath.split("/")[1];
      
      if (firstPathSegment) {
        setSelected(firstPathSegment);
      }
    }, [location.pathname]);
    // Stato per i magazzini
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

    // Flag per forzare il refresh dei magazzini
    const [refreshWarehouses, setRefreshWarehouses] = useState(false);

    // Usiamo la nuova API del tema
    const { isDark, toggleTheme } = useCustomTheme();

    // Effetto per caricare i dati utente
    React.useEffect(() => {
      const fetchUser = async () => {
        try {
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

          setUser({
            name: userResponse.data.name,
            surname: userResponse.data.surname,
            company: companyResponse.data.name,
          });
        } catch (error) {
          console.error(error);
        }
      };

      fetchUser();
    }, []);

    // Effetto per intercettare i cambiamenti di percorso e forzare l'aggiornamento dei magazzini
    React.useEffect(() => {
      // Se siamo appena tornati da una pagina di creazione magazzino, forziamo l'aggiornamento
      if (
        location.pathname === "/dashboard" &&
        location.state?.warehouseCreated
      ) {
        setRefreshWarehouses((prev) => !prev);
      }
    }, [location]);

    // Nuovo effetto per caricare i magazzini
    React.useEffect(() => {
      const fetchWarehouses = async () => {
        try {
          const response = await axios.get("/Warehouse/GET/GetAllWarehouses");
          // Rimuovo il filtro sul tipo di magazzino per mostrare tutti i magazzini
          const warehouseItems = response.data;

          setWarehouses(warehouseItems);
        } catch (error) {
          console.error("Errore nel caricamento dei magazzini:", error);
        }
      };

      fetchWarehouses();
    }, [refreshWarehouses]); // Aggiungiamo refreshWarehouses come dipendenza per forzare il refresh

    // Stato per il magazzino selezionato
    const [selectedWarehouse, setSelectedWarehouse] = React.useState<string | null>(() => {
      // Recupero il magazzino selezionato dal localStorage
      return localStorage.getItem('selectedWarehouse');
    });

    // Salvo il magazzino selezionato nel localStorage
    React.useEffect(() => {
      if (selectedWarehouse) {
        localStorage.setItem('selectedWarehouse', selectedWarehouse);
      }
    }, [selectedWarehouse]);

    // Aggiorno il magazzino selezionato basandoci sul percorso corrente
    React.useEffect(() => {
      const currentPath = location.pathname;
      if (currentPath.startsWith("/warehouses/")) {
        const warehouseId = currentPath.split("/")[2];
        if (warehouseId) {
          setSelectedWarehouse(warehouseId);
        }
      }
    }, [location.pathname]);

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

    const sectionClasses = {
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
    };

    const itemClasses = {
      ...itemClassesProp,
      base: cn(itemClassesProp?.base, {
        "w-11 h-11 gap-0 p-0": isCompact,
      }),
    };

    const renderItem = React.useCallback(
      (item: SidebarItem) => {
        const currentPath = location.pathname;
        // Prendi il primo segmento del path (es: da "/inventory/categories" prende "inventory")
        const firstPathSegment = currentPath.split("/")[1];

        // Gestisce anche i percorsi dei magazzini
        const isSelected =
          item.type === SidebarItemType.Nest
            ? item.key === firstPathSegment
            : item.href === currentPath;

        const isNestType =
          item.items &&
          item.items?.length > 0 &&
          item?.type === SidebarItemType.Nest;

        // Verifica se l'elemento è disabilitato (magazzino inattivo)
        const isDisabled = item.className?.includes("pointer-events-none");

        if (isNestType) {
          // Is a nest type item , so we need to remove the href
          delete item.href;
        }

        return (
          <ListboxItem
            {...item}
            key={item.key}
            textValue={item.title}
            aria-label={item.title}
            classNames={{
              base: cn(
                {
                  "h-auto": !isCompact && isNestType,
                },
                {
                  "inline-block w-11": isCompact && isNestType,
                },
                "transition-colors",
                isDisabled ? "" : "data-[hover=true]:bg-default-100",
                isNestType
                  ? "px-0 rounded-large data-[hover=true]:bg-transparent"
                  : ""
              ),
              title: cn(
                "whitespace-nowrap overflow-hidden text-ellipsis max-w-full transition-colors",
                isDisabled ? "" : "data-[hover=true]:text-foreground-900"
              ),
            }}
            endContent={
              isCompact || isNestType || hideEndContent
                ? null
                : item.endContent ?? null
            }
            startContent={
              isCompact || isNestType ? null : item.icon ? (
                <Icon
                  className={cn(
                    "text-default-700 group-data-[selected=true]:text-foreground-900 flex-shrink-0",
                    iconClassName,
                    isDisabled && "opacity-60"
                  )}
                  icon={item.icon}
                  width={24}
                />
              ) : (
                item.startContent ?? null
              )
            }
            title={isCompact || isNestType ? null : item.title}
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
                    item.startContent ?? null
                  )}
                </div>
              </Tooltip>
            ) : null}
            {!isCompact && isNestType ? (
              <Accordion>
                <AccordionItem
                  key={item.key}
                  aria-label={item.title}
                  classNames={{
                    base: "px-0",
                    trigger:
                      "px-0 min-h-11 h-[44px] data-[hover=true]:bg-transparent transition-colors",
                    content: "px-0 pb-0",
                  }}
                  title={
                    <div className="flex items-center gap-2">
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
                  {/* Per tutti gli accordion normali */}
                  {item.items && item.items?.length > 0 ? (
                    <Listbox
                      aria-label={`Sottomenu ${item.title}`}
                      items={item.items}
                      variant="flat"
                      classNames={{
                        list: "gap-1 pl-6 pt-1",
                      }}
                    >
                      {item.items.map(renderItem)}
                    </Listbox>
                  ) : null}
                </AccordionItem>
              </Accordion>
            ) : null}
          </ListboxItem>
        );
      },
      [
        isCompact,
        hideEndContent,
        iconClassName,
        location.pathname,
        warehouses,
        navigate,
        isMobile,
        onClose,
      ]
    );

    const SidebarContent = () => (
      <div className="h-screen w-64 max-w-64 bg-background text-foreground">
        <div className="relative flex h-full w-full flex-1 flex-col border-r-small border-divider bg-background p-4 overflow-hidden">
          <div
            className="flex items-center justify-between gap-2 px-2 cursor-pointer hover:opacity-80"
            onClick={() => {
              navigate("/dashboard");
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
            <Avatar
              isBordered
              size="sm"
              src="https://i.pravatar.cc/150?u=a04258114e29026708c"
            />
            <div className="flex flex-col">
              <p className="text-small font-medium text-foreground">
                {user?.name} {user?.surname}
              </p>
              <p className="text-tiny text-default-500">{user?.company}</p>
            </div>
          </div>

          <ScrollShadow className="-mr-6 h-full max-h-full py-6 pr-6">
            <Listbox
              key={isCompact ? "compact" : "default"}
              ref={ref}
              hideSelectedIcon
              as="nav"
              aria-label="Menu principale di navigazione"
              className={cn("list-none", className)}
              classNames={{
                ...classNames,
                list: cn("items-center", classNames?.list),
              }}
              color="default"
              itemClasses={{
                ...itemClasses,
                base: cn(
                  "flex items-center px-3 min-h-11 rounded-large h-[44px] data-[selected=true]:bg-default-100 data-[selected=true]:text-foreground-900 data-[hover=true]:bg-default-100 transition-colors",
                  itemClasses?.base
                ),
                title: cn(
                  "text-small font-medium text-default-700 group-data-[selected=true]:text-foreground-900 data-[hover=true]:text-foreground-900 transition-colors whitespace-nowrap overflow-hidden text-ellipsis",
                  itemClasses?.title
                ),
              }}
              items={sectionNestedItems}
              selectedKeys={[selected] as unknown as Selection}
              selectionMode="single"
              variant="flat"
              onSelectionChange={(keys) => {
                const key = Array.from(keys)[0] as string;
                setSelected(key as React.Key);
                onSelect?.(key);
                
                // Gestisco la navigazione per gli elementi del menu
                const selectedItem = sectionNestedItems
                  .flatMap((section: SidebarItem) => section.items || [])
                  .find((item: SidebarItem) => item.key === key);
                
                if (selectedItem?.href) {
                  navigate(selectedItem.href);
                }
                
                if (isMobile) {
                  onClose();
                }
              }}
              {...props}
            >
              {(item) => {
                return item.items &&
                  item.items?.length > 0 &&
                  item?.type === SidebarItemType.Nest ? (
                  renderItem(item)
                ) : item.items && item.items?.length > 0 ? (
                  <ListboxSection
                    key={item.key}
                    classNames={sectionClasses}
                    showDivider={isCompact}
                    title={item.title}
                    aria-label={`Sezione ${item.title}`}
                  >
                    {item.items.map(renderItem)}
                  </ListboxSection>
                ) : (
                  renderItem(item)
                );
              }}
            </Listbox>
          </ScrollShadow>

          <Spacer y={8} />

          <div className="mt-auto flex flex-col gap-4">
            <ThemeSwitch isDark={isDark} onToggle={toggleTheme} />

            <Button
              fullWidth
              className={cn(
                "justify-start",
                isDark
                  ? "text-default-500 data-[hover=true]:text-foreground"
                  : "text-default-700 data-[hover=true]:text-foreground-900"
              )}
              startContent={
                <Icon
                  className={isDark ? "text-default-500" : "text-default-700"}
                  icon="solar:info-circle-linear"
                  width={24}
                />
              }
              variant="light"
            >
              Aiuto & Informazioni
            </Button>

            {/* Dropdown Magazzini Migliorato */}
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
                      ? "text-default-500 data-[hover=true]:text-foreground"
                      : "text-default-700 data-[hover=true]:text-foreground-900"
                  )}
                  endContent={
                    <Icon
                      className={selectedWarehouse ? "text-primary-foreground" : isDark ? "text-default-500" : "text-default-700"}
                      icon="solar:alt-arrow-down-linear"
                      width={16}
                    />
                  }
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      className={selectedWarehouse ? "text-primary-foreground" : isDark ? "text-default-500" : "text-default-700"}
                      icon="mdi:warehouse"
                      width={24}
                    />
                    <span className="truncate">
                      {selectedWarehouse 
                        ? (() => {
                            const warehouse = warehouses.find(w => 
                              (w.WarehouseUUID || w.warehouse_id) === selectedWarehouse
                            );
                            return warehouse 
                              ? `${warehouse.name || warehouse.WarehouseName || "Magazzino"}${
                                  warehouse.WarehouseCode ? ` (${warehouse.WarehouseCode})` : ""
                                }`
                              : "Magazzino Selezionato";
                          })()
                        : "Magazzini"
                      }
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
                  if (selectedKey && selectedKey !== "no-warehouses" && selectedKey !== "add-warehouse") {
                    setSelectedWarehouse(selectedKey);
                  }
                }}
              >
                {(dropdownItem: any) => (
                  <DropdownItem
                    key={dropdownItem.key}
                    className={cn(
                      "transition-all duration-200",
                      dropdownItem.type === "add"
                        ? "text-warning font-medium data-[hover=true]:bg-warning/10"
                        : dropdownItem.type === "empty"
                        ? "text-default-500"
                        : dropdownItem.warehouse?.IsActive === false
                        ? "text-default-400 opacity-60"
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
                          icon={
                            dropdownItem.warehouse?.IsActive === false
                              ? "solar:warehouse-minimalistic-broken"
                              : "solar:warehouse-bold"
                          }
                          width={20}
                          className={cn(
                            selectedWarehouse === dropdownItem.key
                              ? "text-primary"
                              : dropdownItem.warehouse?.IsActive === false
                              ? "text-default-400"
                              : "text-default-700"
                          )}
                        />
                      )
                    }
                    endContent={
                      selectedWarehouse === dropdownItem.key && dropdownItem.type === "warehouse" ? (
                        <Icon
                          icon="solar:check-circle-bold"
                          width={16}
                          className="text-primary"
                        />
                      ) : dropdownItem.warehouse?.IsActive === false ? (
                        <Icon
                          icon="solar:eye-closed-linear"
                          width={16}
                          className="text-default-400"
                        />
                      ) : null
                    }
                    onPress={() => {
                      if (dropdownItem.type === "add") {
                        navigate("/inventory/warehouses/add");
                      } else if (dropdownItem.warehouse) {
                        const warehouseId = dropdownItem.warehouse.WarehouseUUID || dropdownItem.warehouse.warehouse_id || "";
                        setSelectedWarehouse(warehouseId);
                        navigate(`/warehouses/${warehouseId}`);
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
              <SidebarContent />
            </ModalContent>
          </Modal>
        </>
      );
    }

    return <SidebarContent />;
  }
);

Sidebar.displayName = "Sidebar";

export default Sidebar;
