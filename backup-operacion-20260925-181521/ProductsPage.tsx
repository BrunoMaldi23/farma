import { Plus, RefreshCcw } from "lucide-react";
import { useCallback } from "react";

import { EmptyState } from "../components/feedback/EmptyState";
import { PageLoader } from "../components/feedback/PageLoader";
import { PageHeader } from "../components/ui/PageHeader";
import { ResponsiveTable } from "../components/ui/ResponsiveTable";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useResource } from "../hooks/useResource";

type ProductRow = {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  salePrice: string | number;
  productType: string;
  requiresPrescription: boolean;
  isControlled: boolean;
  isActive: boolean;
  category: { name: string };
  laboratory: { name: string } | null;
};

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export const ProductsPage = () => {
  const selector = useCallback((payload: any) => payload.items as ProductRow[], []);
  const { data, loading, error, reload } = useResource<ProductRow[]>(
    "/products?limit=50",
    selector,
  );

  return (
    <>
      <PageHeader
        eyebrow="Catálogo"
        title="Productos"
        description="Medicamentos, dispositivos y productos comercializados."
        actions={
          <>
            <button className="button button--secondary" onClick={() => void reload()}>
              <RefreshCcw size={17} />
              Actualizar
            </button>
            <button className="button button--primary">
              <Plus size={17} />
              Nuevo producto
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
                key: "product",
                header: "Producto",
                render: (row) => (
                  <div className="cell-stack">
                    <strong>{row.name}</strong>
                    <span>{row.sku}</span>
                  </div>
                ),
              },
              {
                key: "category",
                header: "Categoría",
                render: (row) => row.category?.name ?? "—",
              },
              {
                key: "lab",
                header: "Laboratorio",
                render: (row) => row.laboratory?.name ?? "—",
              },
              {
                key: "price",
                header: "Precio",
                render: (row) => clp.format(Number(row.salePrice)),
              },
              {
                key: "rx",
                header: "Condición",
                render: (row) =>
                  row.isControlled
                    ? "Controlado"
                    : row.requiresPrescription
                      ? "Con receta"
                      : "Venta directa",
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
          title="Sin productos"
          description="El catálogo todavía no contiene productos."
        />
      ) : null}
    </>
  );
};
