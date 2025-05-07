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
        inputWrapper: "dark:bg-neutral-800 border-zinc-300 dark:border-neutral-700 focus-within:border-primary dark:focus-within:border-primary",
        input: "dark:text-neutral-200",
        label: "dark:text-neutral-400",
      }}
      endContent={
        <button type="button" onClick={toggleVisibility} className="focus:outline-none text-neutral-500 dark:text-neutral-400 hover:text-primary dark:hover:text-primary transition-colors">
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

export default function Authentication() {
  const [isLogin, setIsLogin] = useState(true);
  const [isPasswordInvalid, setIsPasswordInvalid] = useState(false);

  const toggleView = () => {
    setIsLogin(!isLogin);
    setIsPasswordInvalid(false);
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
      });
  };

  const commonInputClassNames = {
    inputWrapper: "dark:bg-neutral-800 border-zinc-300 dark:border-neutral-700 focus-within:border-primary dark:focus-within:border-primary",
    input: "dark:text-neutral-200",
    label: "dark:text-neutral-400",
  };

  const LoginForm = () => (
    <Form
      className="flex flex-col gap-5" // Aumentato gap
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
        classNames={commonInputClassNames}
      />
      <PasswordField
        name="password"
        label="Password"
        placeholder="********"
        isRequired
      />
      <div className="flex w-full items-center justify-between px-1">
        <Checkbox 
          name="remember" 
          size="sm" 
          classNames={{ 
            label: "text-sm text-zinc-700 dark:text-neutral-300",
            wrapper: "border-zinc-400 dark:border-neutral-500"
          }}
        >
          Ricordami
        </Checkbox>
        <Link className="text-sm text-primary hover:text-primary dark:text-primary dark:hover:text-primary font-medium" href="#">
          Password dimenticata?
        </Link>
      </div>
      <Button 
        className="w-full mt-3 bg-primary hover:bg-primary text-white font-semibold tracking-wide shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-0.5"
        type="submit" 
        size="lg"
      >
        Accedi
      </Button>
    </Form>
  );

  const RegisterForm = () => (
    <Form
      className="flex flex-col gap-5" // Aumentato gap
      validationBehavior="native"
      onSubmit={handleSubmit}
    >
      <div className="grid grid-cols-2 gap-4">
        <Input
          name="name"
          isRequired
          label="Nome"
          placeholder="Mario"
          type="text"
          variant="bordered"
          classNames={commonInputClassNames}
        />
        <Input
          name="surname"
          isRequired
          label="Cognome"
          placeholder="Rossi"
          type="text"
          variant="bordered"
          classNames={commonInputClassNames}
        />
      </div>
      <Input
        name="email"
        isRequired
        label="Email"
        placeholder="email@esempio.com"
        type="email"
        variant="bordered"
        classNames={commonInputClassNames}
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
      />
      <Button 
        className="w-full mt-3 bg-primary hover:bg-primary text-white font-semibold tracking-wide shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-0.5"
        type="submit" 
        size="lg"
      >
        Registrati
      </Button>
    </Form>
  );

  return (
    //<GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <div className="flex h-screen min-h-[700px] w-full items-center justify-center p-4 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-neutral-900 dark:to-black selection:bg-primary selection:text-white">
      <motion.div 
        className="relative flex w-full max-w-md flex-col gap-6 rounded-xl bg-white dark:bg-neutral-900 px-8 py-10 shadow-2xl border border-zinc-200 dark:border-neutral-800/70 overflow-hidden"
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1]}} // Cubic bezier for smooth pop
      >
        {/* Elemento decorativo ispirato al design */}
        <div className="absolute -top-1/4 -left-1/4 w-72 h-72 bg-primary/10 dark:bg-primary/5 rounded-full filter blur-3xl opacity-70 dark:opacity-50 animate-pulse-slow"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-60 h-60 bg-sky-500/10 dark:bg-sky-500/5 rounded-full filter blur-3xl opacity-60 dark:opacity-40 animate-pulse-slower animation-delay-2000"></div>

        <div className="text-center z-10">
          <div className="mb-6 inline-flex items-center justify-center p-3 bg-primary/10 dark:bg-primary-900/30 rounded-full">
            <Icon icon="mdi:rocket-launch-outline" className="text-5xl text-primary dark:text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-neutral-100">
            {isLogin ? "Bentornato su CosmicHub" : "Crea il tuo Account"}
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-neutral-400">
            {isLogin ? "Accedi per esplorare nuove frontiere." : "Registrati e inizia il tuo viaggio interstellare."}
          </p>
        </div>
        
        <div className="z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? "login" : "register"}
              initial={{ opacity: 0, x: isLogin ? -30 : 30, scale: 0.98 }}
              animate={{
                opacity: 1,
                x: 0,
                scale: 1,
                transition: {
                  type: "spring",
                  stiffness: 220,
                  damping: 22,
                },
              }}
              exit={{
                opacity: 0,
                x: isLogin ? 30 : -30,
                scale: 0.98,
                transition: {
                  duration: 0.25,
                  ease: "circIn"
                },
              }}
            >
              {isLogin ? <LoginForm /> : <RegisterForm />}
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="text-center text-sm text-zinc-700 dark:text-neutral-300 z-10">
          {isLogin ? "Non hai un account?" : "Hai già un account?"}&nbsp;
          <Link className="font-semibold text-primary hover:text-primary dark:text-primary dark:hover:text-primary transition-colors" href="#" onClick={toggleView}>
            {isLogin ? "Registrati ora" : "Accedi ora"}
          </Link>
        </p>
      </motion.div>
    </div>
    //</GoogleOAuthProvider>
  );
}
