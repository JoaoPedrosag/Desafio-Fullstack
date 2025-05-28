import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import { Toaster } from "./components/ui/Toaster";
import Register from "./pages/Register";
import RoomsPage from "./pages/Room";
import Profile from "./pages/Profile";
import { useEffect } from "react";
import { useAuthStore } from "./store/auth-store";
import { PrivateRoute } from "./components/routes/PrivateRoute";
import { PublicOnlyRoute } from "./components/routes/PublicOnlyRoute";
import { AppHeader } from "./components/ui/AppHeader";
import "./styles/markdown.css";

function App() {
  const getMe = useAuthStore((s) => s.getMe);

  useEffect(() => {
    getMe();
  }, []);

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/rooms"
          element={
            <PrivateRoute>
              <>
                <AppHeader />
                <RoomsPage />
              </>
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <>
                <AppHeader />
                <Profile />
              </>
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
