import { useCallback } from "react";
import { EmptyState } from "../components/feedback/EmptyState";
import { PageLoader } from "../components/feedback/PageLoader";
import { PageHeader } from "../components/ui/PageHeader";
import { ResponsiveTable } from "../components/ui/ResponsiveTable";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useResource } from "../hooks/useResource";

type ControlledRow = {
  id: string;
  recordNumber: string;
  movementType: string;
  quantity: number;
  occurredAt: string;
  status: string;
  product: { name: string; sku: string };
  batch: { batchNumber: string } | null;
  patient: { rut: string; firstName: string; lastName: string } | null;
};

export const ControlledPage = () => {
  const selector = useCallback((payload: any) => payload.items as ControlledRow[], []);
  const { data, loading, error } = useResource<ControlledRow[]>(
    "/controlled-drugs?limit=50",
    selector,
  );

  return (
    <>
      <PageHeader
        eyebrow="Trazabilidad"
        title="Medicamentos controlados"
        description="Libro de movimientos y seguimiento de productos sujetos a control."
      />

      {loading ? <PageLoader /> : null}
      {error ? <div className="alert alert--error">{error}</div> : null}

      {!loading && data?.length ? (
        <section className="panel">
          <ResponsiveTable
            rows={data}
            getKey={(row) => row.id}
            columns={[
              { key: "record", header: "Registro", render: (row) => row.recordNumber },
              {
                key: "product",
                header: "Producto",
                render: (row) => row.product.name,
              },
              {
                key: "movement",
                header: "Movimiento",
                render: (row) => row.movementType.replaceAll("_", " "),
              },
              { key: "quantity", header: "Cantidad", render: (row) => row.quantity },
              {
                key: "date",
                header: "Fecha",
                render: (row) => new Date(row.occurredAt).toLocaleString("es-CL"),
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

      {!loading && data && !data.length ? <EmptyState title="Sin registros controlados" /> : null}
    </>
  );
};
