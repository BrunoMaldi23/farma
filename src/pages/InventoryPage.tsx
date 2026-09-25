import { RefreshCcw } from "lucide-react";
import { useCallback } from "react";

import { EmptyState } from "../components/feedback/EmptyState";
import { PageLoader } from "../components/feedback/PageLoader";
import { PageHeader } from "../components/ui/PageHeader";
import { ResponsiveTable } from "../components/ui/ResponsiveTable";
import { useResource } from "../hooks/useResource";

type StockRow = {
  id: string;
  quantity: number;
  reservedQuantity: number;
  location: { name: string; code: string };
  batch: {
    batchNumber: string;
    expirationDate: string;
    product: {
      sku: string;
      name: string;
    };
  };
};

export const InventoryPage = () => {
  const selector = useCallback((payload: any) => payload.items as StockRow[], []);
  const { data, loading, error, reload } = useResource<StockRow[]>(
    "/inventory/stock?limit=100",
    selector,
  );

  return (
    <>
      <PageHeader
        eyebrow="Inventario"
        title="Stock por lote"
        description="Existencias disponibles por ubicación y vencimiento FEFO."
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
              {
                key: "product",
                header: "Producto",
                render: (row) => (
                  <div className="cell-stack">
                    <strong>{row.batch.product.name}</strong>
                    <span>{row.batch.product.sku}</span>
                  </div>
                ),
              },
              {
                key: "batch",
                header: "Lote",
                render: (row) => row.batch.batchNumber,
              },
              {
                key: "expiry",
                header: "Vencimiento",
                render: (row) =>
                  new Date(row.batch.expirationDate).toLocaleDateString("es-CL"),
              },
              {
                key: "location",
                header: "Ubicación",
                render: (row) => row.location.name,
              },
              {
                key: "available",
                header: "Disponible",
                render: (row) => row.quantity - row.reservedQuantity,
              },
              {
                key: "reserved",
                header: "Reservado",
                render: (row) => row.reservedQuantity,
              },
            ]}
          />
        </section>
      ) : null}

      {!loading && data && !data.length ? (
        <EmptyState
          title="Sin stock"
          description="Aún no existen lotes con existencias."
        />
      ) : null}
    </>
  );
};
