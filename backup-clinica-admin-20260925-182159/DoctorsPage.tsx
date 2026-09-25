import { useCallback } from "react";
import { EmptyState } from "../components/feedback/EmptyState";
import { PageLoader } from "../components/feedback/PageLoader";
import { PageHeader } from "../components/ui/PageHeader";
import { ResponsiveTable } from "../components/ui/ResponsiveTable";
import { useResource } from "../hooks/useResource";

type DoctorRow = {
  id: string;
  rut: string;
  firstName: string;
  lastName: string;
  specialty: string | null;
  registration: string | null;
  _count: { prescriptions: number };
};

export const DoctorsPage = () => {
  const selector = useCallback((payload: any) => payload.items as DoctorRow[], []);
  const { data, loading, error } = useResource<DoctorRow[]>(
    "/doctors?limit=50",
    selector,
  );

  return (
    <>
      <PageHeader
        eyebrow="Atención clínica"
        title="Médicos"
        description="Profesionales asociados a las recetas registradas."
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
                header: "Profesional",
                render: (row) => `${row.firstName} ${row.lastName}`,
              },
              { key: "rut", header: "RUT", render: (row) => row.rut },
              {
                key: "specialty",
                header: "Especialidad",
                render: (row) => row.specialty ?? "—",
              },
              {
                key: "registration",
                header: "Registro",
                render: (row) => row.registration ?? "—",
              },
              {
                key: "rx",
                header: "Recetas",
                render: (row) => row._count?.prescriptions ?? 0,
              },
            ]}
          />
        </section>
      ) : null}

      {!loading && data && !data.length ? <EmptyState title="Sin médicos" /> : null}
    </>
  );
};
