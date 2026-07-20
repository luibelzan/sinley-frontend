import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getWalletBalance, rechargeWallet } from "../api/authApi";
import { ApiError } from "../api/client";

export function DashboardPage({ onPlay }: { onPlay: () => void }) {
  const { user, accessToken, logout } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [rechargeAmount, setRechargeAmount] = useState("10.00");
  const [rechargeError, setRechargeError] = useState<string | null>(null);
  const [rechargeSuccess, setRechargeSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function loadBalance() {
    if (!accessToken) return;
    getWalletBalance(accessToken)
      .then((wallet) => setBalance(wallet.balance))
      .catch(() => setError("No se pudo cargar el saldo"));
  }

  useEffect(loadBalance, [accessToken]);

  async function handleRecharge(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setRechargeError(null);
    setRechargeSuccess(null);

    const amount = Number(rechargeAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setRechargeError("Introduce una cantidad válida mayor que 0");
      return;
    }

    setSubmitting(true);
    try {
      const wallet = await rechargeWallet(accessToken, amount);
      setBalance(wallet.balance);
      setRechargeSuccess(`Recarga de ${amount.toFixed(2)} € realizada`);
    } catch (err) {
      setRechargeError(err instanceof ApiError ? err.message : "No se pudo completar la recarga");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="dashboard-card">
        <div className="balance-label">Sesión iniciada como</div>
        <h2 className="dashboard-username">{user?.username}</h2>

        <div className="balance-label">Saldo</div>
        {error ? (
          <p className="form-error">{error}</p>
        ) : (
          <p className="balance-figure">{balance === null ? "…" : `${balance.toFixed(2)} €`}</p>
        )}

        <form onSubmit={handleRecharge} style={{ marginTop: "1.5rem", textAlign: "left" }}>
          {rechargeError && <div className="form-error">{rechargeError}</div>}
          {rechargeSuccess && <div className="form-success">{rechargeSuccess}</div>}

          <div className="field">
            <label htmlFor="rechargeAmount">Añadir saldo (€)</label>
            <input
              id="rechargeAmount"
              inputMode="decimal"
              value={rechargeAmount}
              onChange={(e) => setRechargeAmount(e.target.value)}
              placeholder="10.00"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Añadiendo…" : "Añadir saldo"}
          </button>
        </form>

        <button className="btn-primary" style={{ marginTop: "1rem" }} onClick={onPlay}>
          Jugar
        </button>
        <button className="btn-logout" onClick={() => logout()}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
