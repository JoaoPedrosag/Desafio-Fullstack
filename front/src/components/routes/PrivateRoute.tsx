import { Navigate } from "react-router-dom";
import { Spinner, Flex } from "@chakra-ui/react";
import { JSX } from "react";
import { useAuthStore } from "../../store/auth-store";

type Props = {
  children: JSX.Element;
};

export function PrivateRoute({ children }: Props) {
  const { isAuthenticated, loading } = useAuthStore();

  if (loading) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        <Spinner />
      </Flex>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
