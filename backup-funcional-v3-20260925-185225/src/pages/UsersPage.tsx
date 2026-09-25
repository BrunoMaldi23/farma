import {
  BadgeCheck,
  KeyRound,
  RefreshCcw,
  Search,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { PageLoader } from "../components/feedback/PageLoader";
import { PageHeader } from "../components/ui/PageHeader";
import { ResponsiveTable } from "../components/ui/ResponsiveTable";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useResource } from "../hooks/useResource";

type UserRow = {
  id: string;
  rut: string;
  firstName: string;
  lastName: string;
  email: string | null;
  username: string;
  status: string;
  role: {
    name: string;
    code: string;
  };
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const UsersPage = () => {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("ALL");

  const selector = useCallback((payload: any) => payload.items as UserRow[], []);
  const { data, loading, error, reload } = useResource<UserRow[]>(
    "/users?limit=50",
    selector,
  );

  const users = data ?? [];

  const roles = useMemo(
    () =>
      Array.from(
        new Map(
          users
            .filter((user) => user.role)
            .map((user) => [user.role.code, user.role.name]),
        ),
      ),
    [users],
  );

  const filtered = useMemo(() => {
    const q = normalize(query.trim());

    return users.filter((user) => {
      if (role !== "ALL" && user.role?.code !== role) return false;
      if (!q) return true;

      return normalize(
        [
          user.firstName,
          user.lastName,
          user.username,
          user.rut,
          user.email ?? "",
          user.role?.name ?? "",
        ].join(" "),
      ).includes(q);
    });
  }, [users, query, role]);

  const summary = useMemo(
    () => ({
      total: users.length,
      active: users.filter((user) =>
        ["ACTIVE", "ACTIVO"].includes(user.status.toUpperCase()),
      ).length,
      roles: new Set(users.map((user) => user.role?.code).filter(Boolean)).size,
      withEmail: users.filter((user) => Boolean(user.email)).length,
    }),
    [users],
  );

  return (
    <div className="module-v2">
      <PageHeader
        eyebrow="Administración"
        title="Usuarios"
        description="Gestiona cuentas, roles y accesos del sistema."
        actions={
          <>
            <button className="button button--secondary" onClick={() => void reload()}>
              <RefreshCcw size={17} />
              Actualizar
            </button>
            <button
              className="button button--primary"
              type="button"
              title="Formulario de usuario pendiente de conectar."
            >
              <UserRoundPlus size={17} />
              Nuevo usuario
            </button>
          </>
        }
      />

      {loading ? <PageLoader /> : null}
      {error ? <div className="alert alert--error">{error}</div> : null}

      {!loading ? (
        <>
          <section className="module-v2__kpis">
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--green">
                <UsersRound size={19} />
              </span>
              <div>
                <span>Usuarios</span>
                <strong>{summary.total}</strong>
                <small>Cuentas registradas</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--blue">
                <BadgeCheck size={19} />
              </span>
              <div>
                <span>Activos</span>
                <strong>{summary.active}</strong>
                <small>Cuentas habilitadas</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--amber">
                <KeyRound size={19} />
              </span>
              <div>
                <span>Roles</span>
                <strong>{summary.roles}</strong>
                <small>Perfiles asignados</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--violet">
                <UserRoundPlus size={19} />
              </span>
              <div>
                <span>Con correo</span>
                <strong>{summary.withEmail}</strong>
                <small>Contactos registrados</small>
              </div>
            </article>
          </section>

          <section className="module-panel">
            <div className="module-panel__header module-panel__header--filters">
              <div>
                <span className="module-panel__eyebrow">Accesos</span>
                <h2>Usuarios del sistema</h2>
              </div>

              <div className="module-filters">
                <label className="module-search">
                  <Search size={16} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Nombre, usuario, RUT o correo..."
                  />
                </label>

                <select
                  className="module-select"
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                >
                  <option value="ALL">Todos los roles</option>
                  {roles.map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filtered.length ? (
              <ResponsiveTable
                rows={filtered}
                getKey={(row) => row.id}
                columns={[
                  {
                    key: "name",
                    header: "Usuario",
                    render: (row) => (
                      <div className="cell-stack">
                        <strong>{row.firstName} {row.lastName}</strong>
                        <span>@{row.username}</span>
                      </div>
                    ),
                  },
                  { key: "rut", header: "RUT", render: (row) => row.rut },
                  {
                    key: "role",
                    header: "Rol",
                    render: (row) => row.role?.name ?? row.role?.code,
                  },
                  {
                    key: "email",
                    header: "Correo",
                    render: (row) => row.email ?? "—",
                  },
                  {
                    key: "status",
                    header: "Estado",
                    render: (row) => <StatusBadge value={row.status} />,
                  },
                ]}
              />
            ) : (
              <div className="module-empty">
                <span className="module-empty__icon"><UsersRound size={27} /></span>
                <strong>{users.length ? "Sin resultados" : "Sin usuarios"}</strong>
                <p>
                  {users.length
                    ? "Prueba otra búsqueda o cambia el filtro de rol."
                    : "No se encontraron usuarios registrados."}
                </p>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
};