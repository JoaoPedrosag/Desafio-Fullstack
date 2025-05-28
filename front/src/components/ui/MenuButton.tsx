import { IconButton, IconButtonProps } from "@chakra-ui/react";
import { LuMenu } from "react-icons/lu";

export function MenuButton({ variant = "ghost", ...props }: IconButtonProps) {
  return (
    <IconButton variant={variant} aria-label="toggle menu" {...props}>
      <LuMenu />
    </IconButton>
  );
}
