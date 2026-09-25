import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  FlaskConical,
  LockKeyhole,
  UserRound,
} from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../lib/api";

export const LoginPage = () => {
  const { authenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("Admin12345!");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (authenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      await login(username, password);

      const from =
        (location.state as { from?: { pathname?: string } } | null)?.from
          ?.pathname || "/";

      navigate(from, { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-clean">
      <section className="login-clean__brand-side" aria-label="FarmaGestión">
        <div className="login-clean__shape login-clean__shape--one" />
        <div className="login-clean__shape login-clean__shape--two" />
        <div className="login-clean__leaf login-clean__leaf--one" />
        <div className="login-clean__leaf login-clean__leaf--two" />

        <div className="login-clean__brand-center">
          <img
            className="login-clean__logo"
            src="/logo-farma.png"
            alt="FarmaGestión - Farmacia privada comercial"
          />
        </div>

        <span className="login-clean__brand-caption">
          Gestión farmacéutica simple, segura y centralizada
        </span>
      </section>

      <section className="login-clean__form-side">
        <div className="login-clean__form-wrap">
          <header className="login-clean__form-header">
            <span className="login-clean__form-kicker">Bienvenido</span>
            <h1>Iniciar sesión</h1>
            <p>Ingresa tus credenciales para acceder al sistema.</p>
          </header>

          <form onSubmit={handleSubmit} className="login-clean__form">
            <label className="login-clean__field">
              <span>Usuario</span>

              <div className="login-clean__input">
                <UserRound size={19} aria-hidden="true" />

                <input
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Ingresa tu usuario"
                  required
                  disabled={submitting}
                />
              </div>
            </label>

            <label className="login-clean__field">
              <span>Contraseña</span>

              <div className="login-clean__input">
                <LockKeyhole size={19} aria-hidden="true" />

                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Ingresa tu contraseña"
                  required
                  disabled={submitting}
                />

                <button
                  type="button"
                  className="login-clean__password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  disabled={submitting}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </label>

            {error ? (
              <div className="login-clean__error" role="alert">
                {error}
              </div>
            ) : null}

            <button
              className="login-clean__submit"
              disabled={submitting}
              type="submit"
            >
              <span>{submitting ? "Ingresando..." : "Ingresar"}</span>
              {!submitting ? <ArrowRight size={18} /> : null}
            </button>
          </form>

          <div className="login-clean__divider">
            <span>Acceso de desarrollo</span>
          </div>

          <div className="login-clean__demo">
            <FlaskConical size={20} aria-hidden="true" />

            <div>
              <span>Usuario: <strong>admin</strong></span>
              <i aria-hidden="true">•</i>
              <span>Clave: <strong>Admin12345!</strong></span>
            </div>
          </div>

          <p className="login-clean__security">
            Acceso protegido mediante autenticación y permisos por rol.
          </p>
        </div>
      </section>
    </main>
  );
};
