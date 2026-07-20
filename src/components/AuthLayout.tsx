import { ReactNode } from "react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <div className="auth-card">
        <div className="brand">
          <img src="/images/icon.png" alt="Sin Ley" className="brand-logo" />
          <p className="brand-tagline">Juego de cartas por apuestas</p>
        </div>
        {children}
      </div>
      <p className="page-credits">
        Cartas basadas en la obra de Basquetteur (Wikimedia Commons), CC BY-SA 3.0
      </p>
    </div>
  );
}
