import { Navigate } from "react-router-dom";
import { Spinner, Flex } from "@chakra-ui/react";
import { useAuthStore } from "../../store/auth-store";
import { JSX } from "react";

type Props = {
  children: JSX.Element;
};

export function PublicOnlyRoute({ children }: Props) {
  const { isAuthenticated, loading } = useAuthStore();

  if (loading) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        <Spinner />
      </Flex>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/rooms" replace />;
  }

  return children;
}
