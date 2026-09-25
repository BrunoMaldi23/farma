import {
  Building2,
  CalendarDays,
  CircleDollarSign,
  PackageCheck,
  RefreshCcw,
  Search,
  ShoppingBag,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

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

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const PurchasesPage = () => {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");

  const selector = useCallback(
    (payload: any) => payload.items as PurchaseRow[],
    [],
  );

  const { data, loading, error, reload } = useResource<PurchaseRow[]>(
    "/purchases?limit=50",
    selector,
  );

  const purchases = data ?? [];

  const statuses = useMemo(
    () =>
      Array.from(new Set(purchases.map((purchase) => purchase.status))).sort(
        (a, b) => a.localeCompare(b),
      ),
    [purchases],
  );

  const filtered = useMemo(() => {
    const q = normalize(query.trim());

    return purchases.filter((purchase) => {
      if (status !== "ALL" && purchase.status !== status) return false;
      if (!q) return true;

      return normalize(
        [purchase.code, purchase.supplier?.businessName ?? ""].join(" "),
      ).includes(q);
    });
  }, [purchases, query, status]);

  const summary = useMemo(() => {
    const total = purchases.reduce(
      (sum, purchase) => sum + Number(purchase.totalAmount ?? 0),
      0,
    );
    const suppliers = new Set(
      purchases.map((purchase) => purchase.supplier?.businessName).filter(Boolean),
    ).size;
    const pending = purchases.filter((purchase) =>
      ["PENDING", "PENDIENTE", "OPEN", "ABIERTA"].includes(
        purchase.status.toUpperCase(),
      ),
    ).length;

    return {
      orders: purchases.length,
      pending,
      suppliers,
      total,
    };
  }, [purchases]);

  return (
    <div className="module-v2">
      <PageHeader
        eyebrow="Abastecimiento"
        title="Compras"
        description="Órdenes de compra, proveedores y recepción de mercadería."
        actions={
          <button
            className="button button--secondary"
            onClick={() => void reload()}
          >
            <RefreshCcw size={17} />
            Actualizar
          </button>
        }
      />

      {loading ? <PageLoader /> : null}
      {error ? <div className="alert alert--error">{error}</div> : null}

      {!loading ? (
        <>
          <section className="module-v2__kpis">
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--green">
                <ShoppingBag size={19} />
              </span>
              <div>
                <span>Órdenes cargadas</span>
                <strong>{summary.orders}</strong>
                <small>Historial disponible</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--amber">
                <PackageCheck size={19} />
              </span>
              <div>
                <span>Pendientes</span>
                <strong>{summary.pending}</strong>
                <small>Órdenes abiertas</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--blue">
                <Building2 size={19} />
              </span>
              <div>
                <span>Proveedores</span>
                <strong>{summary.suppliers}</strong>
                <small>En registros cargados</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--violet">
                <CircleDollarSign size={19} />
              </span>
              <div>
                <span>Total comprado</span>
                <strong>{clp.format(summary.total)}</strong>
                <small>Según historial cargado</small>
              </div>
            </article>
          </section>

          <section className="module-panel">
            <div className="module-panel__header module-panel__header--filters">
              <div>
                <span className="module-panel__eyebrow">Órdenes</span>
                <h2>Gestión de compras</h2>
              </div>

              <div className="module-filters">
                <label className="module-search">
                  <Search size={16} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Orden o proveedor..."
                  />
                </label>

                <select
                  className="module-select"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option value="ALL">Todos los estados</option>
                  {statuses.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filtered.length ? (
              <ResponsiveTable
                rows={filtered}
                getKey={(row) => row.id}
                columns={[
                  {
                    key: "code",
                    header: "Orden",
                    render: (row) => (
                      <div className="cell-stack">
                        <strong>{row.code}</strong>
                        <span className="module-inline">
                          <CalendarDays size={12} />
                          {new Date(row.orderDate).toLocaleDateString("es-CL")}
                        </span>
                      </div>
                    ),
                  },
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
            ) : (
              <div className="module-empty">
                <span className="module-empty__icon">
                  <ShoppingBag size={27} />
                </span>
                <strong>
                  {purchases.length ? "Sin resultados" : "Sin órdenes de compra"}
                </strong>
                <p>
                  {purchases.length
                    ? "Cambia los filtros para encontrar otras órdenes."
                    : "Las órdenes generadas y recepcionadas aparecerán en este espacio."}
                </p>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
};