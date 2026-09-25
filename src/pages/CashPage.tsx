import { useCallback } from "react";
import { EmptyState } from "../components/feedback/EmptyState";
import { PageLoader } from "../components/feedback/PageLoader";
import { PageHeader } from "../components/ui/PageHeader";
import { ResponsiveTable } from "../components/ui/ResponsiveTable";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useResource } from "../hooks/useResource";

type CashSession = {
  id: string;
  openedAt: string;
  status: string;
  openingAmount: string | number;
  expectedAmount: string | number | null;
  countedAmount: string | number | null;
  cashRegister: { name: string };
  openedBy: { username: string };
  _count: { sales: number; movements: number };
};

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export const CashPage = () => {
  const selector = useCallback(
    (payload: any) => payload.sessions as CashSession[],
    [],
  );
  const { data, loading, error } = useResource<CashSession[]>(
    "/cash/sessions?limit=50",
    selector,
  );

  return (
    <>
      <PageHeader
        eyebrow="Tesorería"
        title="Caja"
        description="Sesiones de caja, aperturas, cierres y movimientos."
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
                key: "register",
                header: "Caja",
                render: (row) => row.cashRegister.name,
              },
              {
                key: "opened",
                header: "Apertura",
                render: (row) => new Date(row.openedAt).toLocaleString("es-CL"),
              },
              {
                key: "user",
                header: "Usuario",
                render: (row) => row.openedBy.username,
              },
              {
                key: "amount",
                header: "Monto inicial",
                render: (row) => clp.format(Number(row.openingAmount)),
              },
              {
                key: "sales",
                header: "Ventas",
                render: (row) => row._count?.sales ?? 0,
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

      {!loading && data && !data.length ? <EmptyState title="Sin sesiones de caja" /> : null}
    </>
  );
};
