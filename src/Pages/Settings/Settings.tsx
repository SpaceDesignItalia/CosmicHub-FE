import React, { useState } from "react";
import {
  Tabs,
  Tab,
  Card,
  CardBody,
  Input,
  Button,
  Switch,
  Divider,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { cn } from "@heroui/react";
import { useCustomTheme } from "../../providers/ThemeProvider";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const { theme, setTheme } = useCustomTheme();
  const isDark = theme === "dark";

  // Stati per mostrare/nascondere le password
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Funzione per gestire il cambio di tab
  const handleTabChange = (key: React.Key) => {
    setActiveTab(key.toString());
  };

  // Gestisce il cambio del tema
  const handleThemeChange = () => {
    const newTheme = isDark ? "light" : "dark";
    setTheme(newTheme);
  };

  // Icona occhio per i campi password
  const renderEyeIcon = (isVisible: boolean, toggleVisibility: () => void) => (
    <button
      type="button"
      onClick={toggleVisibility}
      className="focus:outline-none p-1 rounded-full hover:bg-default-100"
    >
      <Icon
        icon={isVisible ? "solar:eye-closed-bold" : "solar:eye-bold"}
        className={cn("text-default-600", isVisible ? "text-primary" : "")}
        width={20}
      />
    </button>
  );

  // Contenuto delle diverse sezioni
  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <Card
            className={cn(
              "w-full",
              isDark && "border border-default-200 shadow-lg"
            )}
          >
            <CardBody className="gap-4">
              <h2 className="text-lg font-medium">Informazioni Profilo</h2>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-24 w-24 overflow-hidden rounded-full bg-default-100">
                    <img
                      src="https://i.pravatar.cc/150?u=a04258114e29026708c"
                      alt="Immagine profilo"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button size="sm" color="primary">
                      Cambia immagine
                    </Button>
                    <Button size="sm" variant="flat">
                      Rimuovi
                    </Button>
                  </div>
                </div>
              </div>
              <Divider />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input label="Nome" placeholder="Kate" defaultValue="Kate" />
                <Input
                  label="Cognome"
                  placeholder="Moore"
                  defaultValue="Moore"
                />
                <Input
                  label="Email"
                  placeholder="email@esempio.com"
                  defaultValue="kate.moore@cosmichub.com"
                  type="email"
                />
                <Input
                  label="Ruolo"
                  placeholder="Ruolo aziendale"
                  defaultValue="Customer Support"
                />
              </div>
            </CardBody>
          </Card>
        );
      case "account":
        return (
          <Card
            className={cn(
              "w-full",
              isDark && "border border-default-200 shadow-lg"
            )}
          >
            <CardBody className="gap-4">
              <h2 className="text-lg font-medium">Sicurezza Account</h2>
              <Divider />
              <div className="flex flex-col gap-4">
                <Input
                  label="Password Attuale"
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="••••••••"
                  endContent={renderEyeIcon(showCurrentPassword, () =>
                    setShowCurrentPassword(!showCurrentPassword)
                  )}
                />
                <Input
                  label="Nuova Password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="••••••••"
                  endContent={renderEyeIcon(showNewPassword, () =>
                    setShowNewPassword(!showNewPassword)
                  )}
                />
                <Input
                  label="Conferma Nuova Password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  endContent={renderEyeIcon(showConfirmPassword, () =>
                    setShowConfirmPassword(!showConfirmPassword)
                  )}
                />
              </div>
            </CardBody>
          </Card>
        );
      case "notifications":
        return (
          <Card
            className={cn(
              "w-full",
              isDark && "border border-default-200 shadow-lg"
            )}
          >
            <CardBody className="gap-4">
              <h2 className="text-lg font-medium">Impostazioni Notifiche</h2>
              <Divider />
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notifiche email</p>
                    <p className="text-sm text-default-500">
                      Ricevi aggiornamenti via email
                    </p>
                  </div>
                  <Switch defaultSelected />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notifiche desktop</p>
                    <p className="text-sm text-default-500">
                      Mostra notifiche sul desktop
                    </p>
                  </div>
                  <Switch defaultSelected />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      Notifiche aggiornamenti prodotti
                    </p>
                    <p className="text-sm text-default-500">
                      Ricevi notifiche quando vengono aggiunti nuovi prodotti
                    </p>
                  </div>
                  <Switch defaultSelected />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notifiche di sistema</p>
                    <p className="text-sm text-default-500">
                      Ricevi notifiche importanti sul sistema
                    </p>
                  </div>
                  <Switch defaultSelected />
                </div>
              </div>
            </CardBody>
          </Card>
        );
      case "appearance":
        return (
          <Card
            className={cn(
              "w-full",
              isDark && "border border-default-200 shadow-lg"
            )}
          >
            <CardBody className="gap-4">
              <h2 className="text-lg font-medium">
                Preferenze di Visualizzazione
              </h2>
              <Divider />
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Tema scuro</p>
                    <p className="text-sm text-default-500">
                      Attiva/disattiva il tema scuro
                    </p>
                  </div>
                  <Switch
                    isSelected={isDark}
                    onValueChange={handleThemeChange}
                    color="primary"
                    startContent={
                      <Icon
                        icon="solar:sun-bold"
                        className="text-amber-500"
                        width={18}
                      />
                    }
                    endContent={
                      <Icon
                        icon="solar:moon-bold"
                        className="text-blue-500"
                        width={18}
                      />
                    }
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        );
      default:
        return null;
    }
  };

  // Funzione per creare una tab con stile migliorato
  const renderTabTitle = (key: string, icon: string, label: string) => {
    const isActive = activeTab === key;
    return (
      <div className="flex items-center gap-3">
        <Icon
          icon={`solar:${icon}-bold-duotone`}
          width={22}
          className={isActive ? "text-warning font-bold" : "text-foreground"}
        />
        <span
          className={
            isActive
              ? "text-warning font-medium"
              : "text-foreground font-medium"
          }
        >
          {label}
        </span>
      </div>
    );
  };

  // Tab personalizzata con la righina gialla
  const renderCustomTab = (key: string, icon: string, label: string) => {
    const isActive = activeTab === key;

    return (
      <div
        className={cn(
          "relative flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-3 transition-all duration-200 ease-in-out",
          {
            "bg-default-100": isActive,
            "hover:bg-default-100": !isActive,
          }
        )}
        onClick={() => setActiveTab(key)}
      >
        <div
          className={cn(
            "absolute left-0 top-0 h-full w-1 bg-yellow-400 transition-all duration-300 ease-in-out rounded-l-md",
            isActive ? "opacity-100" : "opacity-0"
          )}
        />
        <Icon
          icon={`solar:${icon}-bold-duotone`}
          width={22}
          className={cn(
            "transition-all duration-200",
            isActive ? "text-yellow-500 font-bold" : "text-foreground"
          )}
        />
        <span
          className={cn(
            "transition-all duration-200",
            isActive
              ? "text-yellow-500 font-medium"
              : "text-foreground font-medium"
          )}
        >
          {label}
        </span>
      </div>
    );
  };

  return (
    <div className="flex w-full flex-col gap-4 p-6">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold">Impostazioni</h1>
        <p className="text-default-500">
          Gestisci il tuo account e le preferenze
        </p>
      </div>

      <div className="flex w-full flex-col gap-6 md:flex-row">
        <Card
          className={cn(
            "flex h-fit w-full overflow-visible bg-background p-2 shadow-md md:max-w-[280px]",
            isDark && "border border-default-200"
          )}
        >
          <div className="flex w-full flex-col gap-1">
            {renderCustomTab("profile", "user-circle", "Profilo")}
            {renderCustomTab("account", "lock-keyhole", "Account")}
            {renderCustomTab("notifications", "bell", "Notifiche")}
            {renderCustomTab("appearance", "palette", "Aspetto")}
          </div>
        </Card>

        <div className="flex w-full flex-col gap-6">
          <div className="transition-opacity duration-200 ease-in-out">
            {renderTabContent()}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="flat">Annulla</Button>
            <Button color="primary">Salva Modifiche</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
