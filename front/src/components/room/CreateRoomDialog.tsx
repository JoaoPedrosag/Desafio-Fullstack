import {
  Dialog,
  Portal,
  DialogBackdrop,
  DialogPositioner,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogActionTrigger,
  DialogCloseTrigger,
  Field,
  Input,
  Button,
  CloseButton,
} from "@chakra-ui/react";
import { useState } from "react";
import { api } from "../../services/api";
import { toaster } from "../ui/Toaster";
import { InfinityButton } from "../ui/InfinityButton";

interface CreateRoomDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateRoomDialog({ isOpen, onClose }: CreateRoomDialogProps) {
  const [roomName, setRoomName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!roomName.trim()) {
      toaster.create({
        title: "Nome da sala é obrigatório",
        type: "warning",
      });
      return;
    }

    setLoading(true);
    try {
      await api.post("/rooms", { name: roomName.trim() });

      toaster.create({
        title: "Sala criada com sucesso!",
        type: "success",
      });

      setRoomName("");
      onClose();
    } catch (err: any) {
      toaster.create({
        title: "Erro ao criar sala",
        description: err?.response?.data?.message || "Erro inesperado.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root
      lazyMount
      open={isOpen}
      onOpenChange={(e) => !e.open && onClose()}
    >
      <Portal>
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastre uma nova sala</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Field.Root>
                <Field.Label>Nome da sala</Field.Label>
                <Input
                  placeholder="Ex: Sala de Reunião"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  autoFocus
                />
              </Field.Root>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogActionTrigger>
              <InfinityButton
                width="200px"
                size="sm"
                colorScheme="brand"
                onClick={handleCreate}
                isLoading={loading}
              >
                Criar
              </InfinityButton>
            </DialogFooter>
            <DialogCloseTrigger asChild>
              <CloseButton size="sm" />
            </DialogCloseTrigger>
          </DialogContent>
        </DialogPositioner>
      </Portal>
    </Dialog.Root>
  );
}
