import {
  Barcode,
  Boxes,
  FlaskConical,
  LockKeyhole,
  Pill,
  Plus,
  RefreshCcw,
  Search,
  Stethoscope,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

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

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const ProductsPage = () => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [state, setState] = useState("ALL");

  const selector = useCallback(
    (payload: any) => payload.items as ProductRow[],
    [],
  );

  const { data, loading, error, reload } = useResource<ProductRow[]>(
    "/products?limit=50",
    selector,
  );

  const products = data ?? [];

  const categories = useMemo(
    () =>
      Array.from(
        new Set(products.map((product) => product.category?.name).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b, "es")),
    [products],
  );

  const filtered = useMemo(() => {
    const q = normalize(query.trim());

    return products.filter((product) => {
      if (category !== "ALL" && product.category?.name !== category) return false;
      if (state === "ACTIVE" && !product.isActive) return false;
      if (state === "INACTIVE" && product.isActive) return false;
      if (!q) return true;

      return normalize(
        [
          product.name,
          product.sku,
          product.barcode ?? "",
          product.category?.name ?? "",
          product.laboratory?.name ?? "",
        ].join(" "),
      ).includes(q);
    });
  }, [products, query, category, state]);

  const summary = useMemo(
    () => ({
      active: products.filter((product) => product.isActive).length,
      prescription: products.filter((product) => product.requiresPrescription)
        .length,
      controlled: products.filter((product) => product.isControlled).length,
      categories: new Set(
        products.map((product) => product.category?.name).filter(Boolean),
      ).size,
    }),
    [products],
  );

  return (
    <div className="module-v2">
      <PageHeader
        eyebrow="Catálogo"
        title="Productos"
        description="Medicamentos, dispositivos e insumos comercializados."
        actions={
          <>
            <button
              className="button button--secondary"
              onClick={() => void reload()}
            >
              <RefreshCcw size={17} />
              Actualizar
            </button>

            <button
              className="button button--primary"
              type="button"
              title="El formulario de alta se conectará en el siguiente paso."
            >
              <Plus size={17} />
              Nuevo producto
            </button>
          </>
        }
      />

      {loading ? <PageLoader /> : null}
      {error ? <div className="alert alert--error">{error}</div> : null}

      {!loading ? (
        <>
          <section className="module-v2__kpis">
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--green">
                <Pill size={19} />
              </span>
              <div>
                <span>Productos activos</span>
                <strong>{summary.active}</strong>
                <small>Disponibles en catálogo</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--blue">
                <Boxes size={19} />
              </span>
              <div>
                <span>Categorías</span>
                <strong>{summary.categories}</strong>
                <small>Clasificaciones activas</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--amber">
                <Stethoscope size={19} />
              </span>
              <div>
                <span>Con receta</span>
                <strong>{summary.prescription}</strong>
                <small>Requieren prescripción</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--danger">
                <LockKeyhole size={19} />
              </span>
              <div>
                <span>Controlados</span>
                <strong>{summary.controlled}</strong>
                <small>Regulación especial</small>
              </div>
            </article>
          </section>

          <section className="module-panel">
            <div className="module-panel__header module-panel__header--filters">
              <div>
                <span className="module-panel__eyebrow">Catálogo</span>
                <h2>Productos registrados</h2>
              </div>

              <div className="module-filters module-filters--wide">
                <label className="module-search">
                  <Search size={16} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Nombre, SKU o código de barras..."
                  />
                  <Barcode size={16} />
                </label>

                <select
                  className="module-select"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option value="ALL">Todas las categorías</option>
                  {categories.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>

                <select
                  className="module-select"
                  value={state}
                  onChange={(event) => setState(event.target.value)}
                >
                  <option value="ALL">Todos</option>
                  <option value="ACTIVE">Activos</option>
                  <option value="INACTIVE">Inactivos</option>
                </select>
              </div>
            </div>

            {filtered.length ? (
              <ResponsiveTable
                rows={filtered}
                getKey={(row) => row.id}
                columns={[
                  {
                    key: "product",
                    header: "Producto",
                    render: (row) => (
                      <div className="cell-stack">
                        <strong>{row.name}</strong>
                        <span className="module-inline">
                          <Barcode size={12} />
                          {row.sku}
                        </span>
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
                    render: (row) => (
                      <span className="module-inline">
                        <FlaskConical size={13} />
                        {row.laboratory?.name ?? "—"}
                      </span>
                    ),
                  },
                  {
                    key: "price",
                    header: "Precio",
                    render: (row) => clp.format(Number(row.salePrice)),
                  },
                  {
                    key: "rx",
                    header: "Condición",
                    render: (row) => (
                      <span
                        className={`module-condition ${
                          row.isControlled
                            ? "module-condition--danger"
                            : row.requiresPrescription
                              ? "module-condition--blue"
                              : "module-condition--green"
                        }`}
                      >
                        {row.isControlled
                          ? "Controlado"
                          : row.requiresPrescription
                            ? "Con receta"
                            : "Venta directa"}
                      </span>
                    ),
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
            ) : (
              <div className="module-empty">
                <span className="module-empty__icon">
                  <Pill size={27} />
                </span>
                <strong>
                  {products.length ? "Sin resultados" : "Catálogo vacío"}
                </strong>
                <p>
                  {products.length
                    ? "Prueba otro término o modifica los filtros."
                    : "Agrega productos para comenzar a operar inventario, compras y POS."}
                </p>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
};