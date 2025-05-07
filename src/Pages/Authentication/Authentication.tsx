import { Button, Checkbox, Divider, Form, Input, Link } from "@heroui/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
// import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";

// const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// Separate component for Google login button
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

  const toggleView = () => setIsLogin(!isLogin);

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

  const LoginForm = () => (
    <Form
      className="flex flex-col gap-3"
      validationBehavior="native"
      onSubmit={handleSubmit}
    >
      <Input
        name="email"
        isRequired
        label="Email"
        placeholder="email@example.com"
        type="email"
        variant="bordered"
      />
      <PasswordField
        name="password"
        label="Password"
        placeholder="********"
        isRequired
      />
      <div className="flex w-full items-center justify-between px-1 py-2">
        <Checkbox name="remember" size="sm">
          Ricordami
        </Checkbox>
        <Link className="text-default-500" href="#" size="sm">
          Password dimenticata?
        </Link>
      </div>
      <Button className="w-full" color="primary" type="submit">
        Accedi
      </Button>
    </Form>
  );

  const RegisterForm = () => (
    <Form
      className="flex flex-col gap-3"
      validationBehavior="native"
      onSubmit={handleSubmit}
    >
      <Input
        name="name"
        isRequired
        label="Nome"
        placeholder="Mario"
        type="text"
        variant="bordered"
      />
      <Input
        name="surname"
        isRequired
        label="Cognome"
        placeholder="Rossi"
        type="text"
        variant="bordered"
      />
      <Input
        name="email"
        isRequired
        label="Email"
        placeholder="email@example.com"
        type="email"
        variant="bordered"
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
        errorMessage="Le password non coincidono"
      />
      <Button className="w-full" color="primary" type="submit">
        Registrati
      </Button>
    </Form>
  );

  return (
    //<GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <div className="flex h-screen w-full items-center justify-center p-2 sm:p-4 lg:p-8">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-large">
        <p className="pb-2 text-xl font-medium">
          {isLogin ? "Accedi" : "Registrati"}
        </p>
        <AnimatePresence mode="wait">
          <motion.div
            key={isLogin ? "login" : "register"}
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{
              opacity: 1,
              x: 0,
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 25,
              },
            }}
            exit={{
              opacity: 0,
              x: -20,
              scale: 0.95,
              transition: {
                duration: 0.2,
              },
            }}
          >
            {isLogin ? <LoginForm /> : <RegisterForm />}
          </motion.div>
        </AnimatePresence>
        <div className="flex items-center gap-4 py-2">
          <Divider className="flex-1" />
          <p className="shrink-0 text-tiny text-default-500">OPPURE</p>
          <Divider className="flex-1" />
        </div>
        <div className="flex flex-col gap-2">{/* <GoogleLoginButton /> */}</div>
        <p className="text-center text-small">
          {isLogin ? "Non hai un account?" : "Hai già un account?"}&nbsp;
          <Link href="#" size="sm" onClick={toggleView}>
            {isLogin ? "Registrati" : "Accedi"}
          </Link>
        </p>
      </div>
    </div>
    //</GoogleOAuthProvider>
  );
}
