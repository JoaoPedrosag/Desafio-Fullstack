import { Box, Heading, Text, VStack, Flex } from "@chakra-ui/react";
import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { InfinityButton } from "../components/ui/InfinityButton";
import { useAuthStore } from "../store/auth-store";
import { ValidatedInput } from "../components/ui/ValidatedInput";
import { toaster } from "../components/ui/Toaster";
import { loginSchema, emailSchema, passwordSchema } from "../lib/validations";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { getMe } = useAuthStore();

  const navigate = useNavigate();

  const isFormValid = useMemo(() => {
    const result = loginSchema.safeParse({ email, password });
    return result.success;
  }, [email, password]);

  const handleSubmit = async () => {
    const validationResult = loginSchema.safeParse({ email, password });

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
      await api.post("/auth/login", { email, password });
      await getMe();

      toaster.create({
        title: "Login realizado",
        description: "Bem-vindo de volta!",
        type: "success",
      });

      navigate("/rooms");
    } catch (err: unknown) {
      const error = err as any;

      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Erro inesperado ao fazer login";

      toaster.create({
        title: "Erro no login",
        description: Array.isArray(msg) ? msg.join(", ") : msg,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex h="100vh" direction="row">
      <Box
        flex="1"
        bg="gray.50"
        _dark={{ bg: "gray.900" }}
        display={{ base: "none", md: "flex" }}
        alignItems="center"
        justifyContent="center"
        h="100vh"
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="8"
        >
          <Box asChild>
            <img
              src="/static/login.png"
              alt="Logo da Empresa"
              style={{
                maxWidth: "70%",
                maxHeight: "70%",
                width: "auto",
                height: "auto",
                objectFit: "contain",
              }}
            />
          </Box>
        </Box>
      </Box>

      <Flex
        flex="1"
        alignItems="center"
        justifyContent="center"
        py="8"
        px={{ base: "4", md: "12" }}
        bg="white"
        _dark={{ bg: "gray.800" }}
        h="100vh"
      >
        <VStack gap="6" maxW="md" w="full">
          <Heading size="4xl">Entrar</Heading>

          <ValidatedInput
            label="Email"
            placeholder="seu@email.com"
            type="email"
            value={email}
            schema={emailSchema}
            onChange={setEmail}
          />

          <ValidatedInput
            label="Senha"
            placeholder="Insira sua senha"
            type="password"
            value={password}
            schema={passwordSchema}
            onChange={setPassword}
          />

          <InfinityButton
            width="full"
            isLoading={loading}
            onClick={handleSubmit}
            disabled={!isFormValid}
          >
            Entrar
          </InfinityButton>

          <Text fontSize="sm" color="muted">
            Ainda não tem conta?{" "}
            <Link to="/register" color="primary">
              Registre-se
            </Link>
          </Text>
        </VStack>
      </Flex>
    </Flex>
  );
}
