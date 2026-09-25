import { RefreshCcw, UserPlus } from "lucide-react";
import { useCallback } from "react";

import { EmptyState } from "../components/feedback/EmptyState";
import { PageLoader } from "../components/feedback/PageLoader";
import { PageHeader } from "../components/ui/PageHeader";
import { ResponsiveTable } from "../components/ui/ResponsiveTable";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useResource } from "../hooks/useResource";

type PatientRow = {
  id: string;
  rut: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  _count: { prescriptions: number; sales: number };
};

export const PatientsPage = () => {
  const selector = useCallback((payload: any) => payload.items as PatientRow[], []);
  const { data, loading, error, reload } = useResource<PatientRow[]>(
    "/patients?limit=50",
    selector,
  );

  return (
    <>
      <PageHeader
        eyebrow="Atención clínica"
        title="Pacientes"
        description="Ficha de pacientes, recetas, ventas y coberturas."
        actions={
          <>
            <button className="button button--secondary" onClick={() => void reload()}>
              <RefreshCcw size={17} />
              Actualizar
            </button>
            <button className="button button--primary">
              <UserPlus size={17} />
              Nuevo paciente
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
                key: "patient",
                header: "Paciente",
                render: (row) => (
                  <div className="cell-stack">
                    <strong>
                      {row.firstName} {row.lastName}
                    </strong>
                    <span>{row.rut}</span>
                  </div>
                ),
              },
              { key: "phone", header: "Teléfono", render: (row) => row.phone ?? "—" },
              { key: "email", header: "Correo", render: (row) => row.email ?? "—" },
              {
                key: "prescriptions",
                header: "Recetas",
                render: (row) => row._count?.prescriptions ?? 0,
              },
              {
                key: "sales",
                header: "Ventas",
                render: (row) => row._count?.sales ?? 0,
              },
              {
                key: "status",
                header: "Estado",
                render: (row) => (
                  <StatusBadge value={row.isActive ? "ACTIVE" : "INACTIVE"} />
                ),
              },
            ]}
          />
        </section>
      ) : null}

      {!loading && data && !data.length ? (
        <EmptyState
          title="Sin pacientes"
          description="Todavía no existen pacientes registrados."
        />
      ) : null}
    </>
  );
};
