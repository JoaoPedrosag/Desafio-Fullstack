import {
  Box,
  Button,
  Flex,
  HStack,
  Text,
  Menu,
  Portal,
  Image,
  Icon,
  Textarea,
  Link,
  Avatar,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FiMoreVertical } from "react-icons/fi";
import { getFileIcon, getColorByFileType } from "../../utils/file-icons";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MdDownload } from "react-icons/md";
import { LinkPreview } from "./LinkPreview";
import { getFirstUrl } from "../../utils/url-detector";
import { InfinityButton } from "../ui/InfinityButton";

type MessageItemProps = {
  msg: Message;
  isMine: boolean;
  isEditing: boolean;
  editContent: string;
  onChangeEdit: (value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onConfirmEdit: (text: string) => Promise<void>;
  onDelete: () => Promise<void>;
};

export function MessageItem({
  msg,
  isMine,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onConfirmEdit,
  onDelete,
}: MessageItemProps) {
  const [editContent, setEditContent] = useState(msg.content);
  const detectedUrl = getFirstUrl(msg.content);

  useEffect(() => {
    if (isEditing) setEditContent(msg.content);
  }, [isEditing, msg.content]);

  const createdTime = new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isImage = msg.storage?.mimetype?.startsWith("image/");

  return (
    <Flex justify={isMine ? "flex-end" : "flex-start"} mb="3" w="100%">
      <HStack
        align="flex-start"
        gap={2}
        flex={1}
        justify={isMine ? "flex-end" : "flex-start"}
        maxW="full"
      >
        {!isMine && (
          <Avatar.Root
            size={{ base: "xs", md: "sm" }}
            variant="solid"
            colorPalette="gray"
          >
            <Avatar.Fallback name={msg.user.username} />
          </Avatar.Root>
        )}

        <Box
          bg={isMine ? "buttonText" : "gray.100"}
          color={isMine ? "white" : "black"}
          px={{ base: 3, md: 4 }}
          py={{ base: 1.5, md: 2 }}
          rounded="md"
          maxW={{ base: "80%", sm: "70%" }}
          position="relative"
          wordBreak="break-word"
          whiteSpace="pre-wrap"
          _dark={{
            bg: isMine ? "brand.500" : "gray.700",
            color: "white",
          }}
        >
          <HStack justify="space-between" align="start" mb="1">
            <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="bold">
              {msg.user.username}
            </Text>

            {isMine && !isEditing && (
              <Menu.Root>
                <Menu.Trigger asChild>
                  <Box
                    as={FiMoreVertical}
                    aria-label="Mais ações"
                    cursor="pointer"
                    fontSize={{ base: "sm", md: "md" }}
                  />
                </Menu.Trigger>
                <Portal>
                  <Menu.Positioner>
                    <Menu.Content>
                      <Menu.Item value="edit" onClick={onStartEdit}>
                        Editar
                      </Menu.Item>
                      <Menu.Item
                        value="delete"
                        onClick={() => {
                          if (
                            confirm(
                              "Tem certeza que deseja excluir essa mensagem?"
                            )
                          ) {
                            onDelete();
                          }
                        }}
                      >
                        Deletar
                      </Menu.Item>
                    </Menu.Content>
                  </Menu.Positioner>
                </Portal>
              </Menu.Root>
            )}
          </HStack>

          {isEditing ? (
            <VStack>
              <Textarea
                border={"none"}
                outline={"none"}
                bg={{ _dark: "gray.600", _light: "gray.600" }}
                color={isMine ? "white" : "black"}
                size="sm"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey)
                    onConfirmEdit(editContent);
                  else if (e.key === "Escape") onCancelEdit();
                }}
                autoFocus
                minH="45px"
                maxH="200px"
                resize="vertical"
              />
              <Box width="100%">
                <Text
                  textAlign={"right"}
                  _hover={{
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                  fontSize={"xs"}
                  onClick={onCancelEdit}
                >
                  Cancelar
                </Text>
              </Box>
            </VStack>
          ) : (
            <>
              {msg.content && (
                <Box
                  className="markdown-body"
                  mt={0}
                  mb={1}
                  width="100%"
                  wordBreak="break-word"
                  fontSize={{ base: "sm", md: "md" }}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </Box>
              )}

              {detectedUrl && !msg.storage && (
                <Box mt={2}>
                  <LinkPreview url={detectedUrl} />
                </Box>
              )}

              {msg.storage && (
                <Box mt={2} p={{ base: 1, md: 2 }}>
                  {isImage ? (
                    <Image
                      src={msg.storage.url}
                      alt={msg.storage.filename}
                      maxH={{ base: "200px", md: "300px" }}
                      objectFit="contain"
                      borderRadius="md"
                      w="100%"
                    />
                  ) : (
                    <HStack gap={3}>
                      <Icon
                        as={getFileIcon(msg.storage.mimetype)}
                        boxSize={{ base: 5, md: 6 }}
                        color={getColorByFileType(msg.storage.mimetype)}
                      />
                      <Box flex={1}>
                        <Text fontSize={{ base: "xs", md: "sm" }} truncate>
                          {msg.storage.originalName}
                        </Text>
                      </Box>
                      <Link
                        target="_blank"
                        rel="noopener noreferrer"
                        href={msg.storage.url}
                        _hover={{ color: "blue.500", transform: "scale(1.1)" }}
                        transition="all 0.2s"
                      >
                        <Icon
                          as={MdDownload}
                          w={{ base: 4, md: 5 }}
                          h={{ base: 4, md: 5 }}
                        />
                      </Link>
                    </HStack>
                  )}
                </Box>
              )}
            </>
          )}

          <Flex justify="flex-start" mt="1">
            <Text
              fontSize={{ base: "2xs", md: "xs" }}
              color={isMine ? "whiteAlpha.700" : "gray.500"}
            >
              {createdTime}
              {msg.edited && (
                <Text as="span" fontStyle="italic" ml="2">
                  (Editado)
                </Text>
              )}
            </Text>
          </Flex>
        </Box>
      </HStack>
    </Flex>
  );
}
