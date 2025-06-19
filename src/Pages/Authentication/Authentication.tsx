import { Button, Checkbox, Form, Input, Link, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import React, { useState, useEffect } from "react";

interface PasswordFieldProps {
  name: string;
  label: string;
  placeholder: string;
  isInvalid?: boolean;
  errorMessage?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
}

const PasswordField: React.FC<PasswordFieldProps> = ({
  name,
  label,
  placeholder,
  isInvalid,
  errorMessage,
  isRequired,
  isDisabled,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);

  return (
    <Input
      name={name}
      label={label}
      placeholder={placeholder}
      type={isVisible ? "text" : "password"}
      variant="bordered"
      isInvalid={isInvalid}
      errorMessage={errorMessage}
      isRequired={isRequired}
      isDisabled={isDisabled}
      classNames={{
        inputWrapper:
          "dark:bg-neutral-800 border-zinc-300 dark:border-neutral-700 focus-within:border-primary dark:focus-within:border-primary data-[hover=true]:border-primary/60 dark:data-[hover=true]:border-primary/60 transition-colors",
        input: "dark:text-neutral-200",
        label: "dark:text-neutral-400",
      }}
      endContent={
        <button
          type="button"
          onClick={toggleVisibility}
          disabled={isDisabled}
          className="focus:outline-none text-neutral-500 dark:text-neutral-400 hover:text-primary dark:hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isVisible ? (
            <Icon
              className="pointer-events-none text-2xl"
              icon="solar:eye-closed-linear"
            />
          ) : (
            <Icon
              className="pointer-events-none text-2xl"
              icon="solar:eye-bold"
            />
          )}
        </button>
      }
    />
  );
};

// Componente per il messaggio di successo migliorato
const SuccessMessage: React.FC<{
  countdown: number;
}> = ({ countdown }) => (
  <motion.div
    initial={{ opacity: 0, y: -20, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -20, scale: 0.9 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    className="relative p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl overflow-hidden"
  >
    {/* Animazione di background - senza loop */}
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-400/10"
      initial={{ x: "-100%" }}
      animate={{ x: "100%" }}
      transition={{
        duration: 1.5,
        ease: "easeOut",
      }}
    />

    <div className="relative flex items-start gap-3">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: "backOut" }}
        className="flex-shrink-0 p-1"
      >
        <Icon icon="mdi:check-circle" className="text-green-500 text-2xl" />
      </motion.div>

      <div className="flex-1 min-w-0">
        <motion.h4
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="font-semibold text-green-800 dark:text-green-400 text-sm mb-1"
        >
          Accesso effettuato con successo!
        </motion.h4>

        <motion.p
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="text-sm text-green-700 dark:text-green-300 mb-2"
        >
          Benvenuto! Stai per essere reindirizzato alla dashboard.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400"
        >
          <Icon icon="mdi:timer-outline" className="text-sm" />
          <span>Reindirizzamento in {countdown} secondi...</span>
        </motion.div>
      </div>
    </div>
  </motion.div>
);

// Componente per il messaggio di errore migliorato
const ErrorMessage: React.FC<{
  error: string;
  onRetry: () => void;
  onClearError: () => void;
}> = ({ error, onRetry, onClearError }) => {
  const getErrorDetails = (errorMsg: string) => {
    const errorMap: Record<string, { icon: string; suggestion: string }> = {
      "Password o email errate": {
        icon: "mdi:key-alert",
        suggestion: "Verifica che email e password siano corretti.",
      },
      "Credenziali non valide": {
        icon: "mdi:key-alert",
        suggestion: "Verifica che email e password siano corretti.",
      },
      "Dati non validi": {
        icon: "mdi:form-textbox-password",
        suggestion:
          "Controlla che tutti i campi siano compilati correttamente.",
      },
      "Errore di connessione": {
        icon: "mdi:wifi-alert",
        suggestion: "Verifica la tua connessione internet e riprova.",
      },
    };

    const matchedError = Object.keys(errorMap).find((key) =>
      errorMsg.includes(key)
    );
    return matchedError
      ? errorMap[matchedError]
      : {
          icon: "mdi:alert-circle",
          suggestion: "Si è verificato un errore imprevisto. Riprova.",
        };
  };

  const errorDetails = getErrorDetails(error);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800 rounded-xl overflow-hidden"
    >
      {/* Bordo animato per l'errore */}
      <motion.div
        className="absolute inset-0 border-2 border-red-400/30 rounded-xl"
        animate={{
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="relative flex items-start gap-3">
        <motion.div
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: "backOut" }}
          className="flex-shrink-0 p-1"
        >
          <Icon icon={errorDetails.icon} className="text-red-500 text-2xl" />
        </motion.div>

        <div className="flex-1 min-w-0">
          <motion.h4
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="font-semibold text-red-800 dark:text-red-400 text-sm mb-1"
          >
            Oops! Qualcosa è andato storto
          </motion.h4>

          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="text-sm text-red-700 dark:text-red-300 mb-2"
          >
            {error}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="text-xs text-red-600 dark:text-red-400 mb-3"
          >
            💡 {errorDetails.suggestion}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="flex items-center gap-2"
          >
            <Button
              size="sm"
              variant="light"
              onPress={onClearError}
              className="text-xs px-3 py-1 text-red-600 dark:text-red-400"
              startContent={<Icon icon="mdi:close" className="text-sm" />}
            >
              Chiudi
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default function Authentication() {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Countdown timer per il redirect
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isSuccess && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (isSuccess && countdown === 0) {
      window.location.href = "/";
    }
    return () => clearTimeout(timer);
  }, [isSuccess, countdown]);

  const handleRetry = () => {
    setAuthError("");
    setIsLoading(false);
  };

  const handleClearError = () => {
    setAuthError("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setAuthError("");
    setIsSuccess(false);

    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const endpoint = "/Authentication/POST/Login";
    const payload = { LoginData: data };

    try {
      const res = await axios.post(endpoint, payload);

      if (res.status === 200) {
        setIsLoading(false);
        setIsSuccess(true);
        setCountdown(2);
      }
    } catch (error: any) {
      console.error("Authentication failed:", error);
      console.log("Error status:", error.response?.status); // Log per debug
      console.log("Error data:", error.response?.data); // Log per debug
      setIsLoading(false);

      // Controlla il contenuto della response per messaggi specifici
      const errorMessage =
        error.response?.data?.error || error.response?.data || "";
      const isCredentialsError =
        errorMessage.includes("Credenziali non valide") ||
        errorMessage.includes("Recupero dell'account fallito") ||
        error.response?.status === 401 ||
        error.response?.status === 403;

      // Gestione errori più specifica
      if (error.code === "ECONNABORTED" || error.code === "ERR_NETWORK") {
        setAuthError(
          "Errore di connessione. Verifica la tua connessione internet e riprova."
        );
      } else if (isCredentialsError) {
        setAuthError("Password o email errate. Controlla i dati inseriti.");
      } else if (error.response?.status === 400) {
        setAuthError(
          "Dati non validi. Controlla che tutti i campi siano compilati correttamente."
        );
      } else if (error.response?.status === 422) {
        setAuthError("Formato email non valido.");
      } else if (error.response?.status >= 500) {
        setAuthError(
          "Errore del server. I nostri tecnici stanno lavorando per risolverlo."
        );
      } else {
        setAuthError(
          "Si è verificato un errore imprevisto. Riprova tra qualche istante."
        );
      }
    }
  };

  const commonInputClassNames = {
    inputWrapper:
      "dark:bg-neutral-800 border-zinc-300 dark:border-neutral-700 focus-within:border-primary dark:focus-within:border-primary data-[hover=true]:border-primary/60 dark:data-[hover=true]:border-primary/60 transition-colors",
    input: "dark:text-neutral-200",
    label: "dark:text-neutral-400",
  };

  const LoginForm = () => (
    <Form
      className="flex flex-col gap-5"
      validationBehavior="native"
      onSubmit={handleSubmit}
    >
      <Input
        name="email"
        isRequired
        label="Email"
        placeholder="email@esempio.com"
        type="email"
        variant="bordered"
        isDisabled={isLoading}
        classNames={commonInputClassNames}
      />
      <PasswordField
        name="password"
        label="Password"
        placeholder="********"
        isRequired
        isDisabled={isLoading}
      />
      <div className="flex w-full items-center justify-between px-1">
        <Checkbox
          name="remember"
          size="sm"
          isDisabled={isLoading}
          classNames={{
            label: "text-sm text-zinc-700 dark:text-neutral-300",
            wrapper: "border-zinc-400 dark:border-neutral-500",
          }}
        >
          Ricordami
        </Checkbox>
        <Link
          className="text-sm text-primary hover:text-primary dark:text-primary dark:hover:text-primary font-medium transition-colors"
          href="#"
          isDisabled={isLoading}
        >
          Password dimenticata?
        </Link>
      </div>

      <Button
        className="w-full mt-3 bg-primary hover:bg-primary text-white font-semibold tracking-wide shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 disabled:transform-none disabled:shadow-md"
        type="submit"
        size="lg"
        isLoading={isLoading}
        isDisabled={isLoading || isSuccess}
        spinner={
          <Spinner
            size="sm"
            color="white"
            classNames={{
              circle1: "border-b-white",
              circle2: "border-b-white",
            }}
          />
        }
      >
        {isLoading ? "Accesso in corso..." : isSuccess ? "Successo!" : "Accedi"}
      </Button>
    </Form>
  );

  return (
    <div className="flex h-screen min-h-[700px] w-full items-center justify-center p-4 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-neutral-900 dark:to-black selection:bg-primary selection:text-white">
      <div className="flex flex-col items-center">
        {/* Messaggi di errore fuori dalla box - solo quando non c'è successo */}
        {!isSuccess && (
          <div className="w-full max-w-md mb-4">
            <AnimatePresence>
              {authError && (
                <ErrorMessage
                  error={authError}
                  onRetry={handleRetry}
                  onClearError={handleClearError}
                />
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Mostra solo il messaggio di successo quando il login è riuscito */}
        {isSuccess ? (
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <SuccessMessage countdown={countdown} />
          </motion.div>
        ) : (
          <motion.div
            className="relative flex w-full max-w-md flex-col gap-6 rounded-xl bg-white dark:bg-neutral-900 px-8 py-10 shadow-2xl border border-zinc-200 dark:border-neutral-800/70 overflow-hidden"
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            style={{
              filter: isLoading ? "saturate(0.8)" : "saturate(1)",
              transition: "filter 0.3s ease",
            }}
          >
            {/* Elemento decorativo ispirato al design */}
            <div className="absolute -top-1/4 -left-1/4 w-72 h-72 bg-primary/10 dark:bg-primary/5 rounded-full filter blur-3xl opacity-70 dark:opacity-50 animate-pulse-slow"></div>
            <div className="absolute -bottom-1/4 -right-1/4 w-60 h-60 bg-sky-500/10 dark:bg-sky-500/5 rounded-full filter blur-3xl opacity-60 dark:opacity-40 animate-pulse-slower animation-delay-2000"></div>

            <div className="text-center z-10">
              <div className="mb-6 inline-flex items-center justify-center p-3 bg-primary/10 dark:bg-primary-900/30 rounded-full">
                <Icon
                  icon="mdi:rocket-launch-outline"
                  className="text-5xl text-primary dark:text-primary"
                />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-neutral-100">
                Bentornato su CosmicHub
              </h1>
              <p className="mt-2 text-sm text-zinc-600 dark:text-neutral-400">
                Accedi per esplorare nuove frontiere.
              </p>
            </div>

            <div className="z-10">
              <LoginForm />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
