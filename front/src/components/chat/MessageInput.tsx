import {
  Input,
  HStack,
  Box,
  IconButton,
  Textarea,
  useBreakpointValue,
  Stack,
  VStack,
} from "@chakra-ui/react";
import { useState, useCallback, useRef, useEffect } from "react";
import MDEditor from "@uiw/react-md-editor";
import { FiEye, FiEyeOff, FiPaperclip, FiSend } from "react-icons/fi";
import { getSocket } from "../../services/socket";
import { SOCKET_EVENTS } from "../../constants/socket-event";
import { api } from "../../services/api";
import { toaster } from "../ui/Toaster";
import { SelectedFilePreview } from "./SelectedFilePreview";

type MessageInputProps = {
  roomId: string;
  userId: string;
};

export const MessageInput = ({ roomId, userId }: MessageInputProps) => {
  const [content, setContent] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [textareaRows, setTextareaRows] = useState(1);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const dropRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateRowsTimeoutRef = useRef<number>(0);

  const isMobile = useBreakpointValue({ base: true, md: false });

  const canSend = useCallback(() => {
    return (
      (content.trim().length > 0 || selectedFiles.length > 0) && !isLoading
    );
  }, [content, selectedFiles.length, isLoading]);

  const sendMessage = async () => {
    if (!canSend()) return;

    if (selectedFiles.length === 0 && !content.trim()) {
      toaster.create({
        title: "Erro",
        description: "Você precisa enviar uma mensagem ou um arquivo.",
        type: "error",
      });
      return;
    }

    const trimmed = content.trim();
    const socket = getSocket();
    if (!socket) return;

    setIsLoading(true);

    let isFirst = true;
    try {
      // Enviar arquivos
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("roomId", roomId);

        try {
          const res = await api.post("/uploads", formData);
          const { imageUrl } = res.data;

          socket.emit(SOCKET_EVENTS.SEND_MESSAGE, {
            content: isFirst ? trimmed : "",
            roomId,
            storageId: imageUrl.id,
          });

          isFirst = false;
        } catch (err) {
          console.error("Erro ao enviar arquivo", err);
          toaster.create({
            title: "Erro",
            description: "Falha ao enviar arquivo",
            type: "error",
          });
        }
      }

      // Enviar apenas texto se não há arquivos
      if (selectedFiles.length === 0 && trimmed) {
        socket.emit(SOCKET_EVENTS.SEND_MESSAGE, {
          content: trimmed,
          roomId,
        });
      }

      await new Promise((res) => setTimeout(res, 150));

      // Limpar após envio
      setContent("");
      setSelectedFiles([]);
      setTextareaRows(1);
    } catch (error) {
      console.error("Erro ao enviar mensagem", error);
      toaster.create({
        title: "Erro",
        description: "Falha ao enviar mensagem",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateRows = useCallback((value: string) => {
    if (updateRowsTimeoutRef.current) {
      window.clearTimeout(updateRowsTimeoutRef.current);
    }

    updateRowsTimeoutRef.current = window.setTimeout(() => {
      const lines = value.split("\n").length;
      setTextareaRows(Math.min(Math.max(1, lines), 10));
    }, 100);
  }, []);

  useEffect(() => {
    return () => {
      if (updateRowsTimeoutRef.current) {
        window.clearTimeout(updateRowsTimeoutRef.current);
      }
    };
  }, []);

  const addFiles = (files: File[]) => {
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleTyping = useCallback(() => {
    const socket = getSocket();
    socket?.emit(SOCKET_EVENTS.USER_TYPING, { roomId, userId });
  }, [roomId, userId]);

  return (
    <Box
      position="sticky"
      bottom={0}
      left={0}
      right={0}
      px={{ base: 2, md: 0 }}
      py={2}
      borderTopWidth={{ base: "1px", md: 0 }}
    >
      <VStack gap={0} width="full">
        <SelectedFilePreview files={selectedFiles} onRemove={removeFile} />

        <Box
          position="relative"
          w="full"
          maxW="full"
          mx="auto"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Stack
            direction="column"
            w="full"
            border={dragActive ? "2px dashed" : "none"}
            borderColor="blue.500"
            borderRadius="md"
            p={dragActive ? 2 : 0}
          >
            {content && showPreview && (
              <Box
                p={3}
                borderWidth="1px"
                borderRadius="md"
                bg="bg.500"
                boxShadow="sm"
                overflowX="auto"
                data-color-mode="light"
              >
                <MDEditor.Markdown source={content} />
              </Box>
            )}

            <HStack width="full" display="flex">
              <Input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                accept="*/*"
                multiple
                display="none"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  addFiles(files);
                  e.target.value = "";
                }}
              />

              <Box position="relative" h="full" w="full">
                <Box alignSelf="center">
                  <IconButton
                    aria-label="Anexar arquivo"
                    variant="plain"
                    size={"md"}
                    onClick={() => fileInputRef.current?.click()}
                    position="absolute"
                    top="50%"
                    left="12px"
                    transform="translateY(-50%)"
                    zIndex={1}
                  >
                    <FiPaperclip />
                  </IconButton>
                </Box>

                <Box flex={1} position="relative" display="flex" ref={dropRef}>
                  <Textarea
                    w="full"
                    value={content}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setContent(newValue);
                      handleTyping();
                      updateRows(newValue);
                    }}
                    borderRadius={12}
                    border="none"
                    backgroundColor={{ _dark: "gray.700", _light: "gray.50" }}
                    placeholder="Digite sua mensagem..."
                    minH={isMobile ? "45px" : "60px"}
                    maxH={isMobile ? "120px" : "200px"}
                    height="full"
                    fontSize="1rem"
                    p={6}
                    px={16}
                    resize="none"
                    rows={textareaRows}
                    overflow="hidden"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      } else if (e.key === "Enter" && e.shiftKey) {
                        setTextareaRows((prev) => Math.min(prev + 1, 10));
                      } else if (e.key === "Backspace") {
                        const cursorPosition = e.currentTarget.selectionStart;
                        const textBeforeCursor =
                          e.currentTarget.value.substring(0, cursorPosition);
                        const lastNewLine = textBeforeCursor.lastIndexOf("\n");

                        if (lastNewLine === cursorPosition - 1) {
                          setTextareaRows((prev) => Math.max(2, prev - 1));
                        }
                      }
                    }}
                    _focus={{
                      boxShadow: "none",
                      borderColor: "brand.500",
                    }}
                  />
                </Box>

                <HStack
                  gap={1}
                  alignSelf="center"
                  position="absolute"
                  right="12px"
                  top="50%"
                  transform="translateY(-50%)"
                >
                  {!isMobile && (
                    <IconButton
                      aria-label="Alternar prévia do Markdown"
                      variant="plain"
                      size={"md"}
                      onClick={() => setShowPreview((v) => !v)}
                    >
                      {showPreview ? <FiEyeOff /> : <FiEye />}
                    </IconButton>
                  )}

                  <IconButton
                    aria-label="Enviar mensagem"
                    variant="plain"
                    colorScheme="brand"
                    size={"md"}
                    disabled={!canSend()}
                    loading={isLoading}
                    onClick={sendMessage}
                  >
                    <FiSend />
                  </IconButton>
                </HStack>
              </Box>
            </HStack>
          </Stack>
        </Box>
      </VStack>
    </Box>
  );
};
