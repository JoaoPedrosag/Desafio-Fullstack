import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Avatar,
  Card,
  Button,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth-store";
import { LuArrowLeft, LuMail, LuUser } from "react-icons/lu";

export default function Profile() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <Box minH="calc(100vh - 80px)" bg="background" p={{ base: 4, md: 8 }}>
      <VStack gap={6} maxW="md" mx="auto">
        <HStack w="full" justify="space-between" align="center">
          <Button variant="ghost" size="sm" onClick={() => navigate("/rooms")}>
            <HStack gap={2}>
              <LuArrowLeft />
              <Text>Voltar</Text>
            </HStack>
          </Button>
          <Heading size="lg">Perfil</Heading>
          <Box w="20" />
        </HStack>

        <Card.Root w="full" p={6}>
          <Card.Body>
            <VStack gap={6} align="center">
              <Avatar.Root size="2xl" variant="solid" colorPalette="brand">
                <Avatar.Fallback
                  name={user.username}
                  fontSize="2xl"
                  fontWeight="bold"
                />
              </Avatar.Root>

              <VStack gap={4} w="full">
                <Box w="full">
                  <HStack gap={3} align="center" mb={2}>
                    <LuUser />
                    <Text fontSize="sm" fontWeight="medium" color="muted">
                      Nome de usuário
                    </Text>
                  </HStack>
                  <Text fontSize="lg" fontWeight="semibold">
                    {user.username}
                  </Text>
                </Box>

                <Box w="full">
                  <HStack gap={3} align="center" mb={2}>
                    <LuMail />
                    <Text fontSize="sm" fontWeight="medium" color="muted">
                      Email
                    </Text>
                  </HStack>
                  <Text fontSize="lg" color="text">
                    {user.email}
                  </Text>
                </Box>
              </VStack>

              <Box
                w="full"
                p={4}
                bg="gray.50"
                _dark={{ bg: "gray.700" }}
                borderRadius="md"
              >
                <Text fontSize="sm" color="muted" textAlign="center">
                  💬 Bem-vindo ao ChatApp!
                  <br />
                  Conecte-se com outros usuários e compartilhe ideias.
                </Text>
              </Box>
            </VStack>
          </Card.Body>
        </Card.Root>
      </VStack>
    </Box>
  );
}
