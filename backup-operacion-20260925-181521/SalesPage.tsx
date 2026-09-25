import { RefreshCcw } from "lucide-react";
import { useCallback } from "react";

import { EmptyState } from "../components/feedback/EmptyState";
import { PageLoader } from "../components/feedback/PageLoader";
import { PageHeader } from "../components/ui/PageHeader";
import { ResponsiveTable } from "../components/ui/ResponsiveTable";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useResource } from "../hooks/useResource";

type SaleRow = {
  id: string;
  code: string;
  saleDate: string;
  totalAmount: string | number;
  status: string;
  seller: { username: string };
  patient: { rut: string; firstName: string; lastName: string } | null;
};

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export const SalesPage = () => {
  const selector = useCallback((payload: any) => payload.items as SaleRow[], []);
  const { data, loading, error, reload } = useResource<SaleRow[]>(
    "/sales?limit=50",
    selector,
  );

  return (
    <>
      <PageHeader
        eyebrow="Operación"
        title="Ventas"
        description="Historial de transacciones realizadas en el POS."
        actions={
          <button className="button button--secondary" onClick={() => void reload()}>
            <RefreshCcw size={17} />
            Actualizar
          </button>
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
              { key: "code", header: "Venta", render: (row) => row.code },
              {
                key: "date",
                header: "Fecha",
                render: (row) => new Date(row.saleDate).toLocaleString("es-CL"),
              },
              {
                key: "patient",
                header: "Paciente",
                render: (row) =>
                  row.patient
                    ? `${row.patient.firstName} ${row.patient.lastName}`
                    : "Venta directa",
              },
              {
                key: "seller",
                header: "Vendedor",
                render: (row) => row.seller.username,
              },
              {
                key: "total",
                header: "Total",
                render: (row) => clp.format(Number(row.totalAmount)),
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
        <EmptyState title="Sin ventas" description="Aún no existen ventas registradas." />
      ) : null}
    </>
  );
};
