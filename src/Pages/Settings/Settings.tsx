import React, { useState, useEffect } from "react";
import {
  Tabs,
  Tab,
  Card,
  CardBody,
  Input,
  Button,
  Switch,
  Divider,
  Spinner,
  Tooltip,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
  Autocomplete,
  AutocompleteItem,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { cn } from "@heroui/react";
import { useCustomTheme } from "../../providers/ThemeProvider";
import axios from "axios";

// Interfaccia per i dati dell'utente
interface UserProfile {
  id?: number;
  name: string;
  surname: string;
  email: string;
  role: string;
  photo?: string;
}

// Interfaccia per i dati della password
interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface Role {
  role_id: number;
  name: string;
}

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const { theme, setTheme } = useCustomTheme();
  const isDark = theme === "dark";

  // Stati per i dati dell'utente
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "",
    surname: "",
    email: "",
    role: "",
    photo: "",
  });

  // Stati per la gestione delle password
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Stati per mostrare/nascondere le password
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Stati per feedback all'utente
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Funzione per gestire il cambio di tab
  const handleTabChange = (key: React.Key) => {
    setActiveTab(key.toString());
  };

  // Gestisce il cambio del tema
  const handleThemeChange = () => {
    const newTheme = isDark ? "light" : "dark";
    setTheme(newTheme);
  };

  // Recupera i dati dell'utente
  useEffect(() => {
    const fetchUserData = () => {
      setIsLoading(true);
      axios
        .get("/Authentication/GET/GetSessionData", { withCredentials: true })
        .then((response) => {
          if (response.data) {
            setUserProfile({
              id: response.data.id,
              name: response.data.name || "",
              surname: response.data.surname || "",
              email: response.data.email || "",
              role: response.data.role || "",
              photo:
                response.data.photo ||
                "https://i.pravatar.cc/150?u=a04258114e29026708c",
            });
          }
        })
        .catch((error) => {
          console.error("Errore nel recupero dei dati utente:", error);
          setErrorMessage("Impossibile caricare i dati dell'utente");
          onOpen();
        })
        .finally(() => {
          setIsLoading(false);
        });
    };

    fetchUserData();
  }, []);

  // Gestisce l'aggiornamento dei campi del profilo
  const handleProfileChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: string } }
  ) => {
    const { name, value } = e.target;
    setUserProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Gestisce l'aggiornamento dei campi della password
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Salva le modifiche al profilo
  const handleSaveProfile = () => {
    setIsSaving(true);
    setSaveSuccess(false);

    axios
      .put(
        "/Employee/UPDATE/UpdateEmployeeData",
        { userData: userProfile },
        { withCredentials: true }
      )
      .then((response) => {
        if (response.status === 200) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        }
      })
      .catch((error) => {
        console.error("Errore nell'aggiornamento del profilo:", error);
        setErrorMessage("Impossibile aggiornare i dati del profilo");
        onOpen();
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  // Salva le nuove password
  const handleSavePassword = () => {
    // Valida che le password corrispondano
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage("Le password non corrispondono");
      onOpen();
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    axios
      .put(
        "/Employee/UPDATE/UpdateUserPassword",
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        { withCredentials: true }
      )
      .then((response) => {
        if (response.status === 200) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
          // Reset password fields
          setPasswordData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
        }
      })
      .catch((error) => {
        console.error("Errore nell'aggiornamento della password:", error);
        setErrorMessage(
          error.response?.data || "Impossibile aggiornare la password"
        );
        onOpen();
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const [roles, setRoles] = useState<Role[]>([]);

  console.log(userProfile);

  useEffect(() => {
    axios
      .get("/Role/GET/GetAllRoles", { withCredentials: true })
      .then((response) => {
        setRoles(response.data);
      })
      .catch((error) => {
        console.error("Errore nel recupero dei ruoli:", error);
      });
  }, []);

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
                      src={
                        userProfile.photo ||
                        "https://i.pravatar.cc/150?u=a04258114e29026708c"
                      }
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
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner color="primary" size="lg" />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input
                    name="name"
                    label="Nome"
                    placeholder="Nome"
                    value={userProfile.name}
                    onChange={handleProfileChange}
                  />
                  <Input
                    name="surname"
                    label="Cognome"
                    placeholder="Cognome"
                    value={userProfile.surname}
                    onChange={handleProfileChange}
                  />
                  <Input
                    name="email"
                    label="Email"
                    placeholder="email@esempio.com"
                    value={userProfile.email}
                    type="email"
                    onChange={handleProfileChange}
                  />
                  <Autocomplete
                    key={"role"}
                    name="role"
                    label="Ruolo"
                    defaultItems={roles}
                    defaultSelectedKey={userProfile.role}
                    placeholder="Ruolo aziendale"
                    value={userProfile.role}
                    onSelectionChange={(key) => {
                      handleProfileChange({
                        target: {
                          name: "role",
                          value: key?.toString() || "",
                        },
                      });
                    }}
                  >
                    {roles.map((role) => (
                      <AutocompleteItem key={role.role_id}>
                        {role.name}
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>
                </div>
              )}
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
                  name="currentPassword"
                  label="Password Attuale"
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  endContent={renderEyeIcon(showCurrentPassword, () =>
                    setShowCurrentPassword(!showCurrentPassword)
                  )}
                />
                <Input
                  name="newPassword"
                  label="Nuova Password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  endContent={renderEyeIcon(showNewPassword, () =>
                    setShowNewPassword(!showNewPassword)
                  )}
                />
                <Input
                  name="confirmPassword"
                  label="Conferma Nuova Password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
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

  // Renderizza il pulsante salva con feedback
  const renderSaveButton = () => {
    return (
      <div className="relative">
        <Button
          color="primary"
          isLoading={isSaving}
          onClick={
            activeTab === "profile"
              ? handleSaveProfile
              : activeTab === "account"
              ? handleSavePassword
              : undefined
          }
          className="min-w-[140px]"
        >
          {isSaving ? "Salvataggio..." : "Salva Modifiche"}
        </Button>
        {saveSuccess && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-success-100 text-success-700 px-3 py-1 rounded-md text-sm flex items-center gap-1 whitespace-nowrap">
            <Icon icon="solar:check-circle-bold" className="text-success-600" />
            Salvato con successo
          </div>
        )}
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
            {renderSaveButton()}
          </div>
        </div>
      </div>

      {/* Modal di errore */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 text-danger">
            Errore
          </ModalHeader>
          <ModalBody>
            <p>{errorMessage}</p>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              Chiudi
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default Settings;
