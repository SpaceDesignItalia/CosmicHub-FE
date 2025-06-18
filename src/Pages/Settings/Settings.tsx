import {
  Button,
  Card,
  CardBody,
  CardHeader,
  RadioGroup,
  Select,
  SelectItem,
  Tab,
  Tabs,
  useRadio,
  VisuallyHidden,
  Input,
  Switch,
  cn,
  Progress,
  Divider,
  Avatar,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import React, { useState, useEffect } from "react";
import { useCustomTheme } from "../../providers/ThemeProvider";
import Bowser from "bowser";

// Interface for ThemeCustomRadio props
interface ThemeCustomRadioProps {
  value: string;
  variant: "light" | "dark";
  children: React.ReactNode;
  description?: string;
}

// Data arrays for selects
const timeZoneOptions = [
  { value: "utc+1", label: "(UTC+01:00) Roma, Parigi, Berlino" },
  { value: "utc+0", label: "(UTC+00:00) Londra, Dublino" },
  { value: "utc-5", label: "(UTC-05:00) New York" },
  { value: "utc-8", label: "(UTC-08:00) Los Angeles" },
  { value: "utc+9", label: "(UTC+09:00) Tokyo" },
];

const languageOptions = [
  { value: "it", label: "Italiano", flag: "🇮🇹" },
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "fr", label: "Français", flag: "🇫🇷" },
  { value: "de", label: "Deutsch", flag: "🇩🇪" },
  { value: "es", label: "Español", flag: "🇪🇸" },
];

const fontSizeOptions = [
  { value: "small", label: "Piccolo" },
  { value: "medium", label: "Medio" },
  { value: "large", label: "Grande" },
  { value: "extra-large", label: "Extra Grande" },
];

// Settings component props interface
interface SettingsProps {
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
  onOpenChange?: () => void;
}

export default function Settings({
  className,
  ref,
  isCollapsed,
  setIsCollapsed,
  onOpenChange,
  ...props
}: SettingsProps) {
  // Get theme from provider
  const { theme, setTheme } = useCustomTheme();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Form states
  const [firstName, setFirstName] = useState("Marco");
  const [lastName, setLastName] = useState("Macherelli");
  const [email, setEmail] = useState("marco@cosmichub.it");
  const [phone, setPhone] = useState("+39 123 456 7890");
  const [role, setRole] = useState("Amministratore");
  const [timezone, setTimezone] = useState("utc+1");
  const [language, setLanguage] = useState("it");
  const [fontSize, setFontSize] = useState("medium");
  
  // Password states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  
  // Security states
  const [loginAlerts, setLoginAlerts] = useState(true);
  
  const [validationErrors, setValidationErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Info sessione attuale
  const [deviceInfo, setDeviceInfo] = React.useState({
    os: "",
    browser: "",
    city: "",
    country: "",
    time: "",
    approx: false,
  });

  React.useEffect(() => {
    // Browser e OS
    const browser = Bowser.getParser(window.navigator.userAgent);
    const os = browser.getOSName();
    const browserName = browser.getBrowserName();

    // Orario di accesso
    const now = new Date();
    const time = now.toLocaleString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const updateDeviceInfo = (
      city: string,
      country: string,
      approx = false
    ) =>
      setDeviceInfo({
        os,
        browser: browserName,
        city,
        country,
        time,
        approx,
      } as any);

    const fallbackIp = () => {
      fetch("https://ipapi.co/json/")
        .then((res) => res.json())
        .then((data) => {
          updateDeviceInfo(data.city || "-", data.country_name || "-", true);
        })
        .catch(() => {
          updateDeviceInfo("-", "-", true);
        });
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          )
            .then((res) => res.json())
            .then((data) => {
              const address = data.address || {};
              const city =
                address.city ||
                address.town ||
                address.village ||
                address.county ||
                "-";
              const country = address.country || "-";
              updateDeviceInfo(city, country, false);
            })
            .catch(() => fallbackIp());
        },
        () => fallbackIp(),
        { timeout: 5000 }
      );
    } else {
      fallbackIp();
    }
  }, []);

  // Aggiorna la lingua HTML quando cambia la lingua selezionata
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  const validatePassword = (password: string) => {
    const errors = [];
    if (password.length < 8) errors.push("Almeno 8 caratteri");
    if (!/[A-Z]/.test(password)) errors.push("Una lettera maiuscola");
    if (!/[a-z]/.test(password)) errors.push("Una lettera minuscola");
    if (!/[0-9]/.test(password)) errors.push("Un numero");
    if (!/[^A-Za-z0-9]/.test(password)) errors.push("Un carattere speciale");
    return errors;
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 20;
    if (/[^A-Za-z0-9]/.test(password)) strength += 20;
    return strength;
  };

  const getStrengthColor = (strength: number) => {
    if (strength <= 20) return "danger";
    if (strength <= 40) return "warning";
    if (strength <= 60) return "primary";
    if (strength <= 80) return "success";
    return "success";
  };

  const getStrengthText = (strength: number) => {
    if (strength <= 20) return "Molto Debole";
    if (strength <= 40) return "Debole";
    if (strength <= 60) return "Media";
    if (strength <= 80) return "Buona";
    return "Molto Forte";
  };

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPassword(value);
    setPasswordStrength(calculatePasswordStrength(value));

    const errors = validatePassword(value);
    setValidationErrors((prev) => ({
      ...prev,
      newPassword: errors.length > 0 ? errors.join(", ") : "",
    }));

    if (confirmPassword) {
      setValidationErrors((prev) => ({
        ...prev,
        confirmPassword:
          value !== confirmPassword ? "Le password non coincidono" : "",
      }));
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setValidationErrors((prev) => ({
      ...prev,
      confirmPassword:
        value !== newPassword ? "Le password non coincidono" : "",
    }));
  };

  const ThemeCustomRadio = (props: ThemeCustomRadioProps) => {
    const { variant, description } = props;
    const {
      Component,
      children,
      getBaseProps,
      getWrapperProps,
      getInputProps,
      getLabelProps,
      getLabelWrapperProps,
      getControlProps,
    } = useRadio(props);
    const wrapperProps = getWrapperProps();

    return (
      <Component
        {...getBaseProps()}
        className={cn(
          "group inline-flex flex-row-reverse justify-between overflow-visible hover:bg-content2",
          "max-w-[280px] cursor-pointer gap-4 rounded-xl border-2 border-default-200 p-4 shadow-sm",
          "relative h-[120px] flex-1 overflow-hidden transition-all",
          "hover:border-primary-300 hover:shadow-md",
          "group-data-[selected=true]:border-primary group-data-[selected=true]:bg-primary-50 dark:group-data-[selected=true]:bg-primary-950"
        )}
      >
        <VisuallyHidden>
          <input {...getInputProps()} />
        </VisuallyHidden>
        <span
          {...getWrapperProps()}
          className={cn(
            wrapperProps["className"],
            "border-2 border-default-300",
            "group-data-[selected=true]:border-primary group-data-[selected=true]:bg-primary"
          )}
        >
          <span
            {...getControlProps()}
            className={cn(
              "z-10 h-2 w-2 origin-center scale-0 rounded-full bg-primary-foreground opacity-0 transition-transform-opacity group-data-[selected=true]:scale-100 group-data-[selected=true]:opacity-100"
            )}
          />
        </span>
        <div {...getLabelWrapperProps()} className="flex-1">
          {children && <span {...getLabelProps()} className="font-semibold text-foreground">{children}</span>}
          {description && (
            <span className="text-xs text-foreground-500 mt-1 block">
              {description}
            </span>
          )}
        </div>
        
        {/* Theme preview */}
        <div className="absolute bottom-3 left-4 right-4">
          <div className={cn(
            "h-8 rounded-md border",
            variant === "dark" ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-200"
          )}>
            <div className="flex items-center h-full px-2 gap-1">
              <div className={cn(
                "w-2 h-2 rounded-full",
                variant === "dark" ? "bg-zinc-600" : "bg-zinc-300"
              )} />
              <div className={cn(
                "w-8 h-1 rounded",
                variant === "dark" ? "bg-zinc-700" : "bg-zinc-200"
              )} />
              <div className={cn(
                "w-6 h-1 rounded",
                variant === "dark" ? "bg-zinc-600" : "bg-zinc-300"
              )} />
            </div>
          </div>
        </div>
      </Component>
    );
  };

  return (
    <div className="w-full flex-1 p-4 sm:p-6 lg:p-8 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button
            isIconOnly
            className="sm:hidden"
            size="sm"
            variant="flat"
            onPress={() => {
              setIsCollapsed?.(false);
              onOpenChange?.();
            }}
          >
            <Icon
              className="text-default-500"
              icon="solar:sidebar-minimalistic-linear"
              width={20}
            />
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon icon="solar:settings-bold-duotone" className="text-primary text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Impostazioni
              </h1>
              <p className="text-sm text-foreground-500 mt-1">
                Gestisci il tuo account e le preferenze dell'applicazione
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Chip
            startContent={<Icon icon="solar:check-circle-bold" width={16} />}
            color="success"
            variant="flat"
            size="sm"
          >
            Account Verificato
          </Chip>
          <Button
            color="primary"
            variant="flat"
            size="sm"
            startContent={<Icon icon="solar:export-linear" width={16} />}
          >
            Esporta Dati
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs 
        color="primary" 
        variant="underlined"
        classNames={{
          tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
          cursor: "w-full bg-primary",
          tab: "max-w-fit px-0 h-12",
          tabContent: "group-data-[selected=true]:text-primary"
        }}
      >
        {/* Account Tab */}
        <Tab 
          key="account" 
          title={
            <div className="flex items-center gap-2">
              <Icon icon="solar:user-bold-duotone" width={20} />
              <span>Account</span>
            </div>
          }
        >
          <div className="mt-8 space-y-6">
            {/* Profile Section */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Icon icon="solar:user-circle-bold-duotone" className="text-primary text-xl" />
                  <div>
                    <h3 className="text-lg font-semibold">Informazioni Profilo</h3>
                    <p className="text-sm text-foreground-500">Aggiorna le tue informazioni personali</p>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar
                    src="https://i.pravatar.cc/150?u=marco"
                    className="w-20 h-20"
                    isBordered
                    color="primary"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{firstName} {lastName}</h4>
                    <p className="text-foreground-500">{email}</p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="flat" color="primary">
                        Cambia Avatar
                      </Button>
                      <Button size="sm" variant="flat" color="danger">
                        Rimuovi
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Divider />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-foreground-700 mb-2 block">Nome</label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Inserisci il tuo nome"
                      startContent={<Icon icon="solar:user-linear" className="text-foreground-400" width={18} />}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground-700 mb-2 block">Cognome</label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Inserisci il tuo cognome"
                      startContent={<Icon icon="solar:user-linear" className="text-foreground-400" width={18} />}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground-700 mb-2 block">Email</label>
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Inserisci la tua email"
                      type="email"
                      startContent={<Icon icon="solar:letter-linear" className="text-foreground-400" width={18} />}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground-700 mb-2 block">Telefono</label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Inserisci il tuo telefono"
                      startContent={<Icon icon="solar:phone-linear" className="text-foreground-400" width={18} />}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    color="primary"
                    startContent={<Icon icon="solar:check-circle-linear" width={18} />}
                  >
                    Salva Modifiche
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Password Section */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Icon icon="solar:lock-password-bold-duotone" className="text-primary text-xl" />
                  <div>
                    <h3 className="text-lg font-semibold">Sicurezza Password</h3>
                    <p className="text-sm text-foreground-500">Mantieni sicuro il tuo account</p>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground-700 mb-2 block">Password Attuale</label>
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Inserisci la password attuale"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    startContent={<Icon icon="solar:lock-linear" className="text-foreground-400" width={18} />}
                    endContent={
                      <button
                        className="focus:outline-none"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        <Icon
                          icon={showCurrentPassword ? "solar:eye-closed-linear" : "solar:eye-linear"}
                          className="text-foreground-400 hover:text-foreground-600"
                          width={18}
                        />
                      </button>
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground-700 mb-2 block">Nuova Password</label>
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Inserisci la nuova password"
                      value={newPassword}
                      onChange={handleNewPasswordChange}
                      startContent={<Icon icon="solar:lock-linear" className="text-foreground-400" width={18} />}
                      endContent={
                        <button
                          className="focus:outline-none"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          <Icon
                            icon={showNewPassword ? "solar:eye-closed-linear" : "solar:eye-linear"}
                            className="text-foreground-400 hover:text-foreground-600"
                            width={18}
                          />
                        </button>
                      }
                    />
                    {newPassword && (
                      <div className="mt-2">
                        <Progress
                          value={passwordStrength}
                          color={getStrengthColor(passwordStrength)}
                          size="sm"
                          className="h-1"
                        />
                        <p className="mt-1 text-xs text-foreground-500">
                          Forza: <span className={cn("font-medium", {
                            "text-danger": passwordStrength <= 40,
                            "text-warning": passwordStrength > 40 && passwordStrength <= 60,
                            "text-success": passwordStrength > 60,
                          })}>
                            {getStrengthText(passwordStrength)}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground-700 mb-2 block">Conferma Password</label>
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Conferma la nuova password"
                      value={confirmPassword}
                      onChange={handleConfirmPasswordChange}
                      startContent={<Icon icon="solar:lock-linear" className="text-foreground-400" width={18} />}
                      endContent={
                        <button
                          className="focus:outline-none"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          <Icon
                            icon={showConfirmPassword ? "solar:eye-closed-linear" : "solar:eye-linear"}
                            className="text-foreground-400 hover:text-foreground-600"
                            width={18}
                          />
                        </button>
                      }
                    />
                  </div>
                </div>

                {(validationErrors.newPassword || validationErrors.confirmPassword) && (
                  <div className="bg-danger-50 border border-danger-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Icon icon="solar:danger-triangle-bold" className="text-danger text-lg mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-danger">Errori di validazione:</p>
                        {validationErrors.newPassword && (
                          <p className="text-xs text-danger mt-1">• {validationErrors.newPassword}</p>
                        )}
                        {validationErrors.confirmPassword && (
                          <p className="text-xs text-danger mt-1">• {validationErrors.confirmPassword}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    color="primary"
                    startContent={<Icon icon="solar:shield-check-linear" width={18} />}
                    isDisabled={
                      !currentPassword ||
                      !newPassword ||
                      !confirmPassword ||
                      Object.values(validationErrors).some(error => error !== "")
                    }
                  >
                    Aggiorna Password
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

        {/* Appearance Tab */}
        <Tab 
          key="appearance" 
          title={
            <div className="flex items-center gap-2">
              <Icon icon="solar:palette-bold-duotone" width={20} />
              <span>Aspetto</span>
            </div>
          }
        >
          <div className="mt-8 space-y-6">
            {/* Theme Section */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Icon icon="solar:moon-bold-duotone" className="text-primary text-xl" />
                  <div>
                    <h3 className="text-lg font-semibold">Tema Interfaccia</h3>
                    <p className="text-sm text-foreground-500">Scegli come vuoi visualizzare l'applicazione</p>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <RadioGroup
                  value={theme}
                  onValueChange={(value) => setTheme(value as "light" | "dark")}
                  orientation="horizontal"
                  className="gap-4"
                >
                  <ThemeCustomRadio 
                    value="light" 
                    variant="light"
                    description="Perfetto per ambienti luminosi"
                  >
                    Tema Chiaro
                  </ThemeCustomRadio>
                  <ThemeCustomRadio 
                    value="dark" 
                    variant="dark"
                    description="Riduce l'affaticamento degli occhi"
                  >
                    Tema Scuro
                  </ThemeCustomRadio>
                </RadioGroup>
              </CardBody>
            </Card>

            {/* Display Settings */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Icon icon="solar:monitor-bold-duotone" className="text-primary text-xl" />
                  <div>
                    <h3 className="text-lg font-semibold">Impostazioni Display</h3>
                    <p className="text-sm text-foreground-500">Personalizza la visualizzazione dei contenuti</p>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-foreground-700 mb-2 block">Dimensione Font</label>
                    <Select
                      selectedKeys={[fontSize]}
                      onSelectionChange={(keys) => setFontSize(Array.from(keys)[0] as string)}
                      startContent={<Icon icon="solar:text-bold-duotone" className="text-foreground-400" width={18} />}
                    >
                      {fontSizeOptions.map((option) => (
                        <SelectItem key={option.value}>{option.label}</SelectItem>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground-700 mb-2 block">Lingua</label>
                    <Select
                      selectedKeys={[language]}
                      onSelectionChange={(keys) => setLanguage(Array.from(keys)[0] as string)}
                      startContent={<Icon icon="solar:global-bold-duotone" className="text-foreground-400" width={18} />}
                    >
                      {languageOptions.map((option) => (
                        <SelectItem key={option.value} startContent={<span>{option.flag}</span>}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

        {/* Security Tab */}
        <Tab 
          key="security" 
          title={
            <div className="flex items-center gap-2">
              <Icon icon="solar:shield-bold-duotone" width={20} />
              <span>Sicurezza</span>
            </div>
          }
        >
          <div className="mt-8 space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Icon icon="solar:shield-check-bold-duotone" className="text-primary text-xl" />
                  <div>
                    <h3 className="text-lg font-semibold">Sicurezza Account</h3>
                    <p className="text-sm text-foreground-500">Proteggi il tuo account con funzionalità avanzate</p>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-content2 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon icon="solar:login-bold-duotone" className="text-primary text-xl" />
                      <div>
                        <p className="font-medium">Avvisi di Accesso</p>
                        <p className="text-sm text-foreground-500">Notifiche per nuovi accessi</p>
                      </div>
                    </div>
                    <Switch
                      isSelected={loginAlerts}
                      onValueChange={setLoginAlerts}
                      color="primary"
                    />
                  </div>
                </div>

                <Divider />

                <div className="space-y-4">
                  <h4 className="font-semibold">Sessioni Attive</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-default-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Icon icon="solar:monitor-bold-duotone" className="text-success text-xl" />
                        <div>
                          <p className="font-medium">{deviceInfo.os} - {deviceInfo.browser}</p>
                          <p className="text-sm text-foreground-500">
                            {deviceInfo.city && deviceInfo.country && deviceInfo.city !== "-"
                              ? `${deviceInfo.city}, ${deviceInfo.country}`
                              : "Localizzazione non disponibile"}
                            {deviceInfo.approx && " (approssimativa)"} • {deviceInfo.time}
                          </p>
                        </div>
                      </div>
                      <Chip color="success" size="sm" variant="flat">Attuale</Chip>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>
      </Tabs>

      {/* Delete Account Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalContent>
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Icon icon="solar:danger-triangle-bold" className="text-danger text-xl" />
                <span>Elimina Account</span>
              </div>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <p className="text-foreground-600">
                  Sei sicuro di voler eliminare definitivamente il tuo account? Questa azione:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-foreground-500">
                  <li>Rimuoverà tutti i tuoi dati personali</li>
                  <li>Cancellerà la cronologia delle attività</li>
                  <li>Revocherà l'accesso a tutti i servizi</li>
                  <li>Non può essere annullata</li>
                </ul>
                <div className="bg-danger-50 border border-danger-200 rounded-lg p-3">
                  <p className="text-sm text-danger font-medium">
                    Questa azione è irreversibile. Tutti i dati verranno persi definitivamente.
                  </p>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                Annulla
              </Button>
              <Button color="danger" onPress={onClose}>
                Elimina Account
              </Button>
            </ModalFooter>
          </>
        </ModalContent>
      </Modal>
    </div>
  );
}
