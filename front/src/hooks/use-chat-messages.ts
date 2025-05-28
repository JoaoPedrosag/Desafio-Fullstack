import { useState, useRef, useEffect } from "react";
import { api } from "../services/api";

interface UseChatMessagesProps {
  roomId: string;
  userId: string;
}

export function useChatMessages({ roomId, userId }: UseChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const previousScrollHeightRef = useRef<number>(0);

  const loadMessages = async (cursor?: string | null) => {
    if (!roomId || loadingMore) return;

    try {
      setLoadingMore(true);

      if (cursor && messagesContainerRef.current) {
        previousScrollHeightRef.current =
          messagesContainerRef.current.scrollHeight;
      }

      const messagesRes = await api.get(`/messages/room/${roomId}`, {
        params: {
          cursor,
          limit: 10,
        },
      });

      const newMessages = messagesRes.data.messages;
      setHasMore(messagesRes.data.hasMore);

      if (cursor) {
        setMessages((prev) => [...newMessages, ...prev]);
        setTimeout(() => {
          if (messagesContainerRef.current) {
            const newScrollHeight = messagesContainerRef.current.scrollHeight;
            const scrollDiff =
              newScrollHeight - previousScrollHeightRef.current;
            messagesContainerRef.current.scrollTop = scrollDiff;
          }
        }, 100);
      } else {
        setMessages(newMessages);
      }

      if (newMessages.length > 0) {
        setLastMessageId(newMessages[0].id);
      }
    } catch (err) {
      console.error("Erro ao carregar mensagens", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container || !hasMore || loadingMore) return;

    const { scrollTop } = container;
    if (scrollTop === 0) {
      loadMessages(lastMessageId);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
    scrollToBottom();
  };

  const updateMessage = (updatedMessage: Message) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
    );
  };

  const deleteMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  const editMessage = async (messageId: string, newContent: string) => {
    await api.patch(`/messages/${messageId}`, { content: newContent });
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, content: newContent } : m))
    );
    setEditingMessageId(null);
  };

  const deleteMessageApi = async (messageId: string) => {
    await api.delete(`/messages/${messageId}`);
    deleteMessage(messageId);
  };

  const startEditing = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditContent(content);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  useEffect(() => {
    if (initialLoad && messages.length > 0) {
      setTimeout(() => {
        if (messagesContainerRef.current) {
          const newScrollHeight = messagesContainerRef.current.scrollHeight;
          messagesContainerRef.current.scrollTop = newScrollHeight;
        }
        setInitialLoad(false);
      }, 100);
    }
  }, [messages, initialLoad]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [hasMore, loadingMore, lastMessageId]);

  useEffect(() => {
    if (!roomId) return;
    setMessages([]);
    setInitialLoad(true);
    loadMessages();
  }, [roomId]);

  return {
    messages,
    loadingMore,
    messageEndRef,
    messagesContainerRef,
    editingMessageId,
    editContent,
    setEditContent,
    addMessage,
    updateMessage,
    deleteMessage,
    editMessage,
    deleteMessageApi,
    startEditing,
    cancelEditing,
    loadMessages,
  };
}
