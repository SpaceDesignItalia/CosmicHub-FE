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
    key: "inventory",
    title: "Inventory",
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
        key: "warehouses",
        title: "Magazzini",
        icon: "mdi:warehouse",
        type: SidebarItemType.Nest,
        items: [], // Questo array sarà popolato dinamicamente con i magazzini dal backend
      },
    ],
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
    // Stato per i magazzini
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    // Stato per gli elementi della sidebar con magazzini
    const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>(items);
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

    // Funzione per creare l'array di elementi sidebar con i magazzini integrati
    const getSidebarItemsWithWarehouses = (
      warehouseList: Warehouse[]
    ): SidebarItem[] => {
      // Elemento per mostrare "Nessun Magazzino disponibile"
      const noWarehouseElement: SidebarItem = {
        key: "no-warehouse",
        title: "Nessun magazzino",
        icon: "solar:warehouse-linear",
        className:
          "text-default-500 py-1 whitespace-nowrap overflow-hidden text-ellipsis",
      };

      // Creo un elemento per aggiungere un nuovo magazzino
      const addWarehouseElement: SidebarItem = {
        key: "add-warehouse",
        title: "Aggiungi magazzino",
        icon: "solar:add-circle-bold",
        href: "/inventory/warehouses/add",
        className: "text-warning font-medium",
      };

      // Creiamo elementi per ciascun magazzino se esistono
      const warehouseElements = warehouseList.map((warehouse) => ({
        key: `warehouse-${
          warehouse.warehouse_id || warehouse.WarehouseID || ""
        }`,
        title: `${
          warehouse.name || warehouse.WarehouseName || "Magazzino senza nome"
        } ${warehouse.WarehouseCode ? `(${warehouse.WarehouseCode})` : ""}`,
        icon:
          warehouse.IsActive === false
            ? "solar:warehouse-minimalistic-broken"
            : "solar:warehouse-bold",
        href: `/warehouses/${
          warehouse.WarehouseUUID || warehouse.warehouse_id || ""
        }`,
        className:
          warehouse.IsActive !== false
            ? "transition-all duration-150 hover:bg-default-200 hover:scale-[1.02]"
            : "text-default-400 opacity-80 transition-all duration-150 hover:bg-default-200 hover:opacity-100",
        startContent:
          warehouse.IsActive === false ? (
            <div className="flex items-center">
              <div className="mr-2 h-2 w-2 rounded-full bg-danger"></div>
              <Tooltip content="Magazzino inattivo" placement="right">
                <Icon
                  icon="solar:danger-triangle-bold"
                  className="text-danger mr-1"
                  width={16}
                />
              </Tooltip>
            </div>
          ) : null,
      }));

      // Aggiungiamo l'elemento per l'aggiunta magazzino alla fine dell'array
      const allWarehouseItems =
        warehouseList.length > 0
          ? [...warehouseElements, addWarehouseElement]
          : [noWarehouseElement, addWarehouseElement];

      // Creiamo una nuova struttura degli elementi sidebar
      return sectionNestedItems.map((item) => {
        // Se l'elemento è "inventory", aggiorniamo i suoi sottoelementi
        if (item.key === "inventory" && item.items) {
          // Creiamo una copia degli items di inventory
          const updatedInventoryItems = item.items.map((subItem) => {
            // Se il sottoelemento è "warehouses", controlliamo se ci sono magazzini
            if (subItem.key === "warehouses") {
              return {
                ...subItem,
                items: allWarehouseItems,
                type: SidebarItemType.Nest, // Assicuriamoci che sia di tipo Nest
              };
            }
            return subItem;
          });

          // Restituiamo l'elemento inventory aggiornato
          return {
            ...item,
            items: updatedInventoryItems,
          };
        }
        return item;
      });
    };

    // Nuovo effetto per caricare i magazzini
    React.useEffect(() => {
      const fetchWarehouses = async () => {
        try {
          const response = await axios.get("/Warehouse/GET/GetAllWarehouses");
          // Rimuovo il filtro sul tipo di magazzino per mostrare tutti i magazzini
          const warehouseItems = response.data;

          setWarehouses(warehouseItems);

          // Aggiorniamo sempre la sidebar con il pulsante "Aggiungi magazzino"
          const updatedItems = getSidebarItemsWithWarehouses(warehouseItems);
          setSidebarItems(updatedItems);
        } catch (error) {
          console.error("Errore nel caricamento dei magazzini:", error);
        }
      };

      fetchWarehouses();
    }, [refreshWarehouses]); // Aggiungiamo refreshWarehouses come dipendenza per forzare il refresh

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

    async function handleLogout() {
      try {
        const response = await axios.post("/Authentication/POST/Logout");
        if (response.status === 200) {
          window.location.href = "/login";
        }
      } catch (error) {
        console.error(error);
      }
    }

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
            : item.href === currentPath ||
              (currentPath.startsWith("/warehouses/") &&
                item.href?.startsWith("/warehouses/") &&
                // Confrontiamo solo il percorso base per i magazzini, dato che potrebbe essere WarehouseUUID o warehouse_id
                currentPath.split("/")[2] === item.href?.split("/")[2]);

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
                  "h-auto p-0": !isCompact && isNestType,
                },
                {
                  "inline-block w-11": isCompact && isNestType,
                },
                {
                  "bg-default-100": isSelected,
                },
                "transition-colors",
                isDisabled ? "" : "data-[hover=true]:bg-default-100"
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
              <Accordion className={"p-0"}>
                <AccordionItem
                  key={item.key}
                  aria-label={item.title}
                  classNames={{
                    heading: "pr-3",
                    trigger: cn("p-0 data-[hover=true]:bg-default-100", {
                      "bg-default-100": isSelected,
                    }),
                    content: "py-0 pl-3",
                  }}
                  title={
                    item.icon ? (
                      <div
                        className={
                          "flex h-11 items-center gap-2 px-2 py-1.5 overflow-hidden data-[hover=true]:text-foreground-900 transition-colors"
                        }
                      >
                        <Icon
                          className={cn(
                            "text-default-700 group-data-[selected=true]:text-foreground-900 flex-shrink-0",
                            iconClassName
                          )}
                          icon={item.icon}
                          width={24}
                        />
                        <span className="text-small font-medium text-default-700 group-data-[selected=true]:text-foreground-900 whitespace-nowrap overflow-hidden text-ellipsis">
                          {item.title}
                        </span>
                      </div>
                    ) : (
                      item.startContent ?? null
                    )
                  }
                >
                  {item.items && item.items?.length > 0 ? (
                    <Listbox
                      className={"mt-0.5"}
                      aria-label={`Sottomenu ${item.title}`}
                      classNames={{
                        list: cn("border-l border-default-200 pl-3"),
                      }}
                      itemClasses={{
                        base: "pr-1 data-[hover=true]:bg-default-100 data-[hover=true]:text-foreground-900 transition-colors",
                        title:
                          "whitespace-nowrap overflow-hidden text-ellipsis",
                      }}
                      items={item.items}
                      variant="flat"
                    >
                      {item.items.map((subItem, index) =>
                        React.cloneElement(renderItem(subItem), {
                          key: `${subItem.key}-${index}`,
                        })
                      )}
                    </Listbox>
                  ) : (
                    renderItem(item)
                  )}
                </AccordionItem>
              </Accordion>
            ) : null}
          </ListboxItem>
        );
      },
      [isCompact, hideEndContent, iconClassName, location.pathname]
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
                  "px-3 min-h-11 rounded-large h-[44px] data-[selected=true]:bg-default-100 data-[selected=true]:text-foreground-900 data-[hover=true]:bg-default-100 transition-colors",
                  itemClasses?.base
                ),
                title: cn(
                  "text-small font-medium text-default-700 group-data-[selected=true]:text-foreground-900 data-[hover=true]:text-foreground-900 transition-colors whitespace-nowrap overflow-hidden text-ellipsis",
                  itemClasses?.title
                ),
              }}
              items={sidebarItems}
              selectedKeys={[selected] as unknown as Selection}
              selectionMode="single"
              variant="flat"
              onSelectionChange={(keys) => {
                const key = Array.from(keys)[0];
                setSelected(key as React.Key);
                onSelect?.(key as string);
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
            <Button
              onPress={handleLogout}
              className={cn(
                "justify-start",
                isDark
                  ? "text-default-500 data-[hover=true]:text-foreground"
                  : "text-default-700 data-[hover=true]:text-foreground-900"
              )}
              startContent={
                <Icon
                  className={cn(
                    "rotate-180",
                    isDark ? "text-default-500" : "text-default-700"
                  )}
                  icon="solar:minus-circle-linear"
                  width={24}
                />
              }
              variant="light"
            >
              Log Out
            </Button>
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
