import { Button, Checkbox, Divider, Form, Input, Link } from "@heroui/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
// import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";

// const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// const GoogleLoginButton = () => { ... };

interface PasswordFieldProps {
  name: string;
  label: string;
  placeholder: string;
  isInvalid?: boolean;
  errorMessage?: string;
  isRequired?: boolean;
}

const PasswordField: React.FC<PasswordFieldProps> = ({
  name,
  label,
  placeholder,
  isInvalid,
  errorMessage,
  isRequired,
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
      classNames={{
        inputWrapper: "dark:bg-zinc-800", // Sfondo leggermente più scuro per input in dark mode
      }}
      endContent={
        <button type="button" onClick={toggleVisibility} className="focus:outline-none">
          {isVisible ? (
            <Icon
              className="pointer-events-none text-2xl text-default-400"
              icon="solar:eye-closed-linear"
            />
          ) : (
            <Icon
              className="pointer-events-none text-2xl text-default-400"
              icon="solar:eye-bold"
            />
          )}
        </button>
      }
    />
  );
};

export default function Authentication() {
  const [isLogin, setIsLogin] = useState(true);
  const [isPasswordInvalid, setIsPasswordInvalid] = useState(false);

  const toggleView = () => {
    setIsLogin(!isLogin);
    setIsPasswordInvalid(false); // Resetta l'errore della password quando si cambia vista
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

    if (!isLogin && data.password !== data.confirmPassword) {
      setIsPasswordInvalid(true);
      return;
    }

    setIsPasswordInvalid(false);

    const endpoint = isLogin
      ? "/Authentication/POST/Login"
      : "/Authentication/POST/Register";
    const payload = isLogin ? { LoginData: data } : { RegisterData: data };

    axios
      .post(endpoint, payload)
      .then((res) => {
        if (res.status === 200) {
          window.location.href = "/";
        }
      })
      .catch((error) => {
        console.error("Authentication failed:", error);
        // Qui potresti voler mostrare un messaggio di errore all'utente
      });
  };

  const LoginForm = () => (
    <Form
      className="flex flex-col gap-4" // Aumentato leggermente il gap
      validationBehavior="native"
      onSubmit={handleSubmit}
    >
      <Input
        name="email"
        isRequired
        label="Email"
        placeholder="email@esempio.com" // Italianizzato
        type="email"
        variant="bordered"
        classNames={{
          inputWrapper: "dark:bg-zinc-800",
        }}
      />
      <PasswordField
        name="password"
        label="Password"
        placeholder="********"
        isRequired
      />
      <div className="flex w-full items-center justify-between px-1">
        <Checkbox name="remember" size="sm" classNames={{ label: "text-zinc-700 dark:text-zinc-300"}}>
          Ricordami
        </Checkbox>
        <Link className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" href="#">
          Password dimenticata?
        </Link>
      </div>
      <Button className="w-full mt-2" color="primary" type="submit" size="lg">
        Accedi
      </Button>
    </Form>
  );

  const RegisterForm = () => (
    <Form
      className="flex flex-col gap-4" // Aumentato leggermente il gap
      validationBehavior="native"
      onSubmit={handleSubmit}
    >
      <div className="grid grid-cols-2 gap-3">
        <Input
          name="name"
          isRequired
          label="Nome"
          placeholder="Mario"
          type="text"
          variant="bordered"
          classNames={{
            inputWrapper: "dark:bg-zinc-800",
          }}
        />
        <Input
          name="surname"
          isRequired
          label="Cognome"
          placeholder="Rossi"
          type="text"
          variant="bordered"
          classNames={{
            inputWrapper: "dark:bg-zinc-800",
          }}
        />
      </div>
      <Input
        name="email"
        isRequired
        label="Email"
        placeholder="email@esempio.com" // Italianizzato
        type="email"
        variant="bordered"
        classNames={{
          inputWrapper: "dark:bg-zinc-800",
        }}
      />
      <PasswordField
        name="password"
        label="Password"
        placeholder="********"
        isRequired
        isInvalid={isPasswordInvalid}
        errorMessage="Le password non coincidono"
      />
      <PasswordField
        name="confirmPassword"
        label="Conferma Password"
        placeholder="********"
        isRequired
        isInvalid={isPasswordInvalid}
        // Non mostrare il messaggio di errore qui, già presente sopra
      />
      <Button className="w-full mt-2" color="primary" type="submit" size="lg">
        Registrati
      </Button>
    </Form>
  );

  return (
    //<GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <div className="flex h-screen min-h-[700px] w-full items-center justify-center p-4 bg-slate-100 dark:bg-zinc-900 selection:bg-primary-500 selection:text-white">
      <motion.div 
        className="flex w-full max-w-md flex-col gap-6 rounded-xl bg-white dark:bg-zinc-800/50 backdrop-blur-lg px-8 py-10 shadow-2xl border border-slate-200 dark:border-zinc-700/50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "circOut" }}
      >
        <div className="text-center">
          {/* Potresti inserire un logo qui sopra, se disponibile */}
          {/* Esempio: <img src="/logo.svg" alt="CosmicHub Logo" className="w-16 h-16 mx-auto mb-4" /> */}
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {isLogin ? "Bentornato!" : "Crea un Account"}
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {isLogin ? "Accedi per continuare su CosmicHub." : "Unisciti a noi per iniziare la tua avventura cosmica."}
          </p>
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={isLogin ? "login" : "register"}
            initial={{ opacity: 0, x: isLogin ? -20 : 20, scale: 0.98 }}
            animate={{
              opacity: 1,
              x: 0,
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 260,
                damping: 20,
              },
            }}
            exit={{
              opacity: 0,
              x: isLogin ? 20 : -20,
              scale: 0.98,
              transition: {
                duration: 0.2,
                ease: "circIn"
              },
            }}
          >
            {isLogin ? <LoginForm /> : <RegisterForm />}
          </motion.div>
        </AnimatePresence>

        

        <p className="text-center text-sm text-zinc-700 dark:text-zinc-300">
          {isLogin ? "Non hai un account?" : "Hai già un account?"}&nbsp;
          <Link className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" href="#" onClick={toggleView}>
            {isLogin ? "Registrati ora" : "Accedi ora"}
          </Link>
        </p>
      </motion.div>
    </div>
    //</GoogleOAuthProvider>
  );
}
