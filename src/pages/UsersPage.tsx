import { RefreshCcw, UserRoundPlus } from "lucide-react";
import { useCallback } from "react";

import { EmptyState } from "../components/feedback/EmptyState";
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

export const UsersPage = () => {
  const selector = useCallback((payload: any) => payload.items as UserRow[], []);
  const { data, loading, error, reload } = useResource<UserRow[]>(
    "/users?limit=50",
    selector,
  );

  return (
    <>
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
            <button className="button button--primary">
              <UserRoundPlus size={17} />
              Nuevo usuario
            </button>
          </>
        }
      />

      {loading ? <PageLoader /> : null}
      {error ? <div className="alert alert--error">{error}</div> : null}

      {!loading && data?.length ? (
        <section className="panel">
          <ResponsiveTable
            rows={data}
            getKey={(row) => row.id}
            columns={[
              {
                key: "name",
                header: "Usuario",
                render: (row) => (
                  <div className="cell-stack">
                    <strong>
                      {row.firstName} {row.lastName}
                    </strong>
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
        </section>
      ) : null}

      {!loading && data && !data.length ? (
        <EmptyState title="Sin usuarios" description="No se encontraron usuarios." />
      ) : null}
    </>
  );
};
