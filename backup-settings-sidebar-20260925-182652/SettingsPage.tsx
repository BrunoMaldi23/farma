import { useCallback } from "react";
import { EmptyState } from "../components/feedback/EmptyState";
import { PageLoader } from "../components/feedback/PageLoader";
import { PageHeader } from "../components/ui/PageHeader";
import { ResponsiveTable } from "../components/ui/ResponsiveTable";
import { useResource } from "../hooks/useResource";

type Setting = {
  id: string;
  key: string;
  value: string;
  description: string | null;
  isPublic: boolean;
};

export const SettingsPage = () => {
  const selector = useCallback((payload: any) => payload.settings as Setting[], []);
  const { data, loading, error } = useResource<Setting[]>("/settings", selector);

  return (
    <>
      <PageHeader
        eyebrow="Sistema"
        title="Configuración"
        description="Parámetros generales de la farmacia y del sistema."
      />

      {loading ? <PageLoader /> : null}
      {error ? <div className="alert alert--error">{error}</div> : null}

      {!loading && data?.length ? (
        <section className="panel">
          <ResponsiveTable
            rows={data}
            getKey={(row) => row.id}
            columns={[
              { key: "key", header: "Clave", render: (row) => row.key },
              { key: "value", header: "Valor", render: (row) => row.value },
              {
                key: "description",
                header: "Descripción",
                render: (row) => row.description ?? "—",
              },
              {
                key: "public",
                header: "Visibilidad",
                render: (row) => (row.isPublic ? "Público" : "Interno"),
              },
            ]}
          />
        </section>
      ) : null}

      {!loading && data && !data.length ? <EmptyState title="Sin configuraciones" /> : null}
    </>
  );
};
