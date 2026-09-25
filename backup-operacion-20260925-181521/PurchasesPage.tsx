import { RefreshCcw } from "lucide-react";
import { useCallback } from "react";

import { EmptyState } from "../components/feedback/EmptyState";
import { PageLoader } from "../components/feedback/PageLoader";
import { PageHeader } from "../components/ui/PageHeader";
import { ResponsiveTable } from "../components/ui/ResponsiveTable";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useResource } from "../hooks/useResource";

type PurchaseRow = {
  id: string;
  code: string;
  orderDate: string;
  totalAmount: string | number;
  status: string;
  supplier: { businessName: string };
};

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export const PurchasesPage = () => {
  const selector = useCallback((payload: any) => payload.items as PurchaseRow[], []);
  const { data, loading, error, reload } = useResource<PurchaseRow[]>(
    "/purchases?limit=50",
    selector,
  );

  return (
    <>
      <PageHeader
        eyebrow="Abastecimiento"
        title="Compras"
        description="Órdenes, proveedores y recepciones de mercadería."
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
              { key: "code", header: "Orden", render: (row) => row.code },
              {
                key: "supplier",
                header: "Proveedor",
                render: (row) => row.supplier.businessName,
              },
              {
                key: "date",
                header: "Fecha",
                render: (row) =>
                  new Date(row.orderDate).toLocaleDateString("es-CL"),
              },
              {
                key: "amount",
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
        <EmptyState
          title="Sin órdenes"
          description="Todavía no se han generado órdenes de compra."
        />
      ) : null}
    </>
  );
};
