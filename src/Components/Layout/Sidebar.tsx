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
import { useLocation } from "react-router-dom";

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
        key: "vehicles",
        title: "Veicoli",
        icon: "mingcute:truck-line",
        href: "/inventory/vehicles",
      },
    ],
  },
  {
    key: "customers",
    title: "Clienti",
    icon: "solar:users-group-rounded-linear",
    type: SidebarItemType.Nest,
    items: [
      {
        key: "overview",
        title: "Panoramica",
        icon: "solar:chart-linear",
        href: "/customers/overview",
      },
      {
        key: "reports",
        title: "Report",
        icon: "solar:document-linear",
        href: "/customers/reports",
      },
    ],
  },
  {
    key: "employees",
    title: "Dipendenti",
    icon: "solar:user-linear",
    href: "/employees",
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
    const [user, setUser] = useState<User | null>(null);
    const [selected, setSelected] =
      React.useState<React.Key>(defaultSelectedKey);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [isMobile, setIsMobile] = React.useState(false);
    const location = useLocation();

    // Usiamo la nuova API del tema
    const { isDark, toggleTheme } = useCustomTheme();

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

        const isSelected =
          item.type === SidebarItemType.Nest
            ? item.key === firstPathSegment
            : item.href === currentPath;

        const isNestType =
          item.items &&
          item.items?.length > 0 &&
          item?.type === SidebarItemType.Nest;

        if (isNestType) {
          // Is a nest type item , so we need to remove the href
          delete item.href;
        }

        return (
          <ListboxItem
            {...item}
            key={item.key}
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
                }
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
                    "text-default-700 group-data-[selected=true]:text-foreground-900",
                    iconClassName
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
                    trigger: cn("p-0", { "bg-default-100": isSelected }),
                    content: "py-0 pl-4",
                  }}
                  title={
                    item.icon ? (
                      <div
                        className={"flex h-11 items-center gap-2 px-2 py-1.5"}
                      >
                        <Icon
                          className={cn(
                            "text-default-700 group-data-[selected=true]:text-foreground-900",
                            iconClassName
                          )}
                          icon={item.icon}
                          width={24}
                        />
                        <span className="text-small font-medium text-default-700 group-data-[selected=true]:text-foreground-900">
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
                      classNames={{
                        list: cn("border-l border-default-200 pl-4"),
                      }}
                      items={item.items}
                      variant="flat"
                    >
                      {item.items.map(renderItem)}
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
      <div className="h-screen w-auto bg-background text-foreground">
        <div className="relative flex h-full w-full flex-1 flex-col border-r-small border-divider bg-background p-6">
          <div className="flex items-center justify-between gap-2 px-2">
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

          <Dropdown placement="bottom-start">
            <DropdownTrigger>
              <div className="flex cursor-pointer items-center gap-3 px-2 transition-opacity hover:opacity-80">
                <Avatar
                  isBordered
                  size="sm"
                  src="https://i.pravatar.cc/150?u=a04258114e29026708c"
                />
                <div className="flex flex-col">
                  <p className="text-small font-medium text-foreground">
                    {user?.name} {user?.surname}
                  </p>
                </div>
              </div>
            </DropdownTrigger>
            <DropdownMenu aria-label="User Actions">
              <DropdownItem
                key="settings"
                startContent={
                  <Icon
                    className="text-default-700"
                    icon="solar:settings-line-duotone"
                    width={20}
                  />
                }
                href="/settings"
              >
                Impostazioni
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>

          <ScrollShadow className="-mr-6 h-full max-h-full py-6 pr-6">
            <Listbox
              key={isCompact ? "compact" : "default"}
              ref={ref}
              hideSelectedIcon
              as="nav"
              className={cn("list-none", className)}
              classNames={{
                ...classNames,
                list: cn("items-center", classNames?.list),
              }}
              color="default"
              itemClasses={{
                ...itemClasses,
                base: cn(
                  "px-3 min-h-11 rounded-large h-[44px] data-[selected=true]:bg-default-100 data-[selected=true]:text-foreground-900",
                  itemClasses?.base
                ),
                title: cn(
                  "text-small font-medium text-default-700 group-data-[selected=true]:text-foreground-900",
                  itemClasses?.title
                ),
              }}
              items={items}
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
                  className={
                    isDark ? "text-default-500" : "text-default-700"
                  }
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
