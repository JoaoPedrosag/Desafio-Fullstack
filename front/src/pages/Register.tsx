import { VStack, Heading, Text, Flex } from "@chakra-ui/react";
import { useState, useMemo } from "react";

import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { InfinityButton } from "../components/ui/InfinityButton";
import { ValidatedInput } from "../components/ui/ValidatedInput";
import { toaster } from "../components/ui/Toaster";
import {
  registerSchema,
  usernameSchema,
  emailSchema,
  passwordSchema,
} from "../lib/validations";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = useMemo(() => {
    const result = registerSchema.safeParse(form);
    return result.success;
  }, [form]);

  const handleSubmit = async () => {
    const validationResult = registerSchema.safeParse(form);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toaster.create({
        title: "Dados inválidos",
        description: firstError.message,
        type: "error",
      });
      return;
    }

    try {
      setLoading(true);
      await api.post("/auth/register", form);

      toaster.create({
        title: "Conta criada com sucesso!",
        description: "Você será redirecionado para o login.",
        type: "success",
      });

      navigate("/login");
    } catch (err: unknown) {
      const error = err as any;

      const msg =
        error?.response?.data?.message || "Erro inesperado ao fazer login";

      toaster.create({
        title: "Erro ao registrar",
        description: Array.isArray(msg) ? msg.join(", ") : msg,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex
      minH="100vh"
      alignItems="center"
      justifyContent="center"
      bg="background"
      color="text"
      px="4"
      py="8"
    >
      <VStack gap="6" maxW="md" w="full">
        <Heading size="lg">Criar conta</Heading>

        <ValidatedInput
          label="Usuário"
          placeholder="username"
          value={form.username}
          schema={usernameSchema}
          onChange={(val) => handleChange("username", val)}
        />

        <ValidatedInput
          label="Email"
          placeholder="seu@email.com"
          type="email"
          value={form.email}
          schema={emailSchema}
          onChange={(val) => handleChange("email", val)}
        />

        <ValidatedInput
          label="Senha"
          placeholder="Insira sua senha"
          type="password"
          value={form.password}
          schema={passwordSchema}
          onChange={(val) => handleChange("password", val)}
        />

        <InfinityButton
          width="full"
          isLoading={loading}
          onClick={handleSubmit}
          disabled={!isFormValid}
        >
          Registrar
        </InfinityButton>

        <Text fontSize="sm" color="muted">
          Já tem conta?{" "}
          <Link to="/login" color="primary">
            Entre
          </Link>
        </Text>
      </VStack>
    </Flex>
  );
}
