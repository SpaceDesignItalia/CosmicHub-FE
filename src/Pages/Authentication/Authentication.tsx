"use client";

import React from "react";
import { Button, Input, Checkbox, Link, Divider, Form } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";

export default function Authentication() {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isLogin, setIsLogin] = React.useState(true);

  const toggleVisibility = () => setIsVisible(!isVisible);
  const toggleView = () => setIsLogin(!isLogin);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("handleSubmit");
  };

  const LoginForm = () => (
    <Form
      className="flex flex-col gap-3"
      validationBehavior="native"
      onSubmit={handleSubmit}
    >
      <Input
        isRequired
        label="Email"
        name="email"
        placeholder="email@example.com"
        type="email"
        variant="bordered"
      />
      <Input
        isRequired
        endContent={
          <button type="button" onClick={toggleVisibility}>
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
        label="Password"
        name="password"
        placeholder="********"
        type={isVisible ? "text" : "password"}
        variant="bordered"
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
        isRequired
        label="Nome"
        name="name"
        placeholder="Il tuo nome"
        type="text"
        variant="bordered"
      />
      <Input
        isRequired
        label="Email"
        name="email"
        placeholder="email@example.com"
        type="email"
        variant="bordered"
      />
      <Input
        isRequired
        endContent={
          <button type="button" onClick={toggleVisibility}>
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
        label="Password"
        name="password"
        placeholder="********"
        type={isVisible ? "text" : "password"}
        variant="bordered"
      />
      <Input
        isRequired
        endContent={
          <button type="button" onClick={toggleVisibility}>
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
        label="Conferma Password"
        name="confirmPassword"
        placeholder="********"
        type={isVisible ? "text" : "password"}
        variant="bordered"
      />
      <Button className="w-full" color="primary" type="submit">
        Registrati
      </Button>
    </Form>
  );

  return (
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
        <div className="flex flex-col gap-2">
          <Button
            startContent={<Icon icon="flat-color-icons:google" width={24} />}
            variant="bordered"
          >
            Continua con Google
          </Button>
        </div>
        <p className="text-center text-small">
          {isLogin ? "Non hai un account?" : "Hai già un account?"}&nbsp;
          <Link href="#" size="sm" onClick={toggleView}>
            {isLogin ? "Registrati" : "Accedi"}
          </Link>
        </p>
      </div>
    </div>
  );
}
