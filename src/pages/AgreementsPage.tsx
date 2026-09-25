import { useCallback } from "react";
import { EmptyState } from "../components/feedback/EmptyState";
import { PageLoader } from "../components/feedback/PageLoader";
import { PageHeader } from "../components/ui/PageHeader";
import { ResponsiveTable } from "../components/ui/ResponsiveTable";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useResource } from "../hooks/useResource";

type AgreementRow = {
  id: string;
  code: string;
  name: string;
  type: string;
  isActive: boolean;
  plans: Array<{ id: string }>;
};

export const AgreementsPage = () => {
  const selector = useCallback(
    (payload: any) => payload.agreements as AgreementRow[],
    [],
  );
  const { data, loading, error } = useResource<AgreementRow[]>(
    "/agreements",
    selector,
  );

  return (
    <>
      <PageHeader
        eyebrow="Beneficios"
        title="Convenios y coberturas"
        description="Isapres, seguros, Cenabast y convenios institucionales."
      />

      {loading ? <PageLoader /> : null}
      {error ? <div className="alert alert--error">{error}</div> : null}

      {!loading && data?.length ? (
        <section className="panel">
          <ResponsiveTable
            rows={data}
            getKey={(row) => row.id}
            columns={[
              { key: "code", header: "Código", render: (row) => row.code },
              { key: "name", header: "Convenio", render: (row) => row.name },
              { key: "type", header: "Tipo", render: (row) => row.type },
              {
                key: "plans",
                header: "Planes",
                render: (row) => row.plans?.length ?? 0,
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
        <EmptyState title="Sin convenios" description="Aún no hay convenios configurados." />
      ) : null}
    </>
  );
};
