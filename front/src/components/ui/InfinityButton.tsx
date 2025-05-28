import { Button, ButtonProps, Spinner } from "@chakra-ui/react";
import { ReactNode } from "react";

type Props = {
  isLoading?: boolean;
  children: ReactNode;
} & ButtonProps;

export function InfinityButton({ isLoading, children, width, ...rest }: Props) {
  return (
    <Button
      bg="primary"
      color="white"
      _hover={{ bg: "brand.600" }}
      _dark={{
        bg: "brand.500",
        color: "white",
        _hover: { bg: "brand.400" },
      }}
      _disabled={{ opacity: 0.6, cursor: "not-allowed" }}
      width={width}
      disabled={isLoading}
      {...rest}
    >
      {isLoading ? <Spinner size="sm" /> : children}
    </Button>
  );
}
