import { FormEvent, useState } from "react";
import { AuthLayout } from "../components/AuthLayout";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

export function RegisterPage({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!USERNAME_PATTERN.test(username)) {
      setError("El usuario debe tener 3-20 caracteres: letras, números o guión bajo");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setSubmitting(true);
    try {
      await register(username, email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la cuenta. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}

        <div className="field">
          <label htmlFor="username">Usuario</label>
          <input
            id="username"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="tu_usuario"
            autoComplete="username"
          />
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@ejemplo.com"
            autoComplete="email"
          />
        </div>

        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
          />
        </div>

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>

      <div className="form-footer">
        ¿Ya tienes cuenta?{" "}
        <button type="button" className="btn-link" onClick={onSwitchToLogin}>
          Iniciar sesión
        </button>
      </div>
    </AuthLayout>
  );
}
