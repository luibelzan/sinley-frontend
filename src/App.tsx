import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { TablePage } from "./pages/TablePage";

export function App() {
  const { status } = useAuth();
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [screen, setScreen] = useState<"dashboard" | "table">("dashboard");

  if (status === "loading") {
    return <div className="loading-screen">Cargando…</div>;
  }

  if (status !== "authenticated") {
    return authView === "login" ? (
      <LoginPage onSwitchToRegister={() => setAuthView("register")} />
    ) : (
      <RegisterPage onSwitchToLogin={() => setAuthView("login")} />
    );
  }

  return screen === "dashboard" ? (
    <DashboardPage onPlay={() => setScreen("table")} />
  ) : (
    <TablePage onExit={() => setScreen("dashboard")} />
  );
}
