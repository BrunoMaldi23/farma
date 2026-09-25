import {
  AlertTriangle,
  Boxes,
  CalendarClock,
  MapPin,
  PackageCheck,
  RefreshCcw,
  Search,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

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

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const daysUntil = (value: string) => {
  const now = new Date();
  const date = new Date(value);
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / 86400000);
};

export const InventoryPage = () => {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("ALL");

  const selector = useCallback(
    (payload: any) => payload.items as StockRow[],
    [],
  );

  const { data, loading, error, reload } = useResource<StockRow[]>(
    "/inventory/stock?limit=100",
    selector,
  );

  const rows = data ?? [];

  const locations = useMemo(
    () =>
      Array.from(new Set(rows.map((row) => row.location.name))).sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = normalize(query.trim());

    return rows.filter((row) => {
      if (location !== "ALL" && row.location.name !== location) return false;
      if (!q) return true;

      return normalize(
        [
          row.batch.product.name,
          row.batch.product.sku,
          row.batch.batchNumber,
          row.location.name,
        ].join(" "),
      ).includes(q);
    });
  }, [rows, query, location]);

  const summary = useMemo(() => {
    const available = rows.reduce(
      (sum, row) => sum + Math.max(0, row.quantity - row.reservedQuantity),
      0,
    );
    const reserved = rows.reduce(
      (sum, row) => sum + Number(row.reservedQuantity ?? 0),
      0,
    );
    const expiring = rows.filter((row) => {
      const days = daysUntil(row.batch.expirationDate);
      return days >= 0 && days <= 90;
    }).length;
    const expired = rows.filter(
      (row) => daysUntil(row.batch.expirationDate) < 0,
    ).length;

    return { available, reserved, expiring, expired };
  }, [rows]);

  return (
    <div className="module-v2">
      <PageHeader
        eyebrow="Inventario"
        title="Stock por lote"
        description="Existencias por ubicación, lote y vencimiento con enfoque FEFO."
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
                <PackageCheck size={19} />
              </span>
              <div>
                <span>Stock disponible</span>
                <strong>{summary.available}</strong>
                <small>Unidades utilizables</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--blue">
                <Boxes size={19} />
              </span>
              <div>
                <span>Stock reservado</span>
                <strong>{summary.reserved}</strong>
                <small>Unidades comprometidas</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--amber">
                <CalendarClock size={19} />
              </span>
              <div>
                <span>Por vencer</span>
                <strong>{summary.expiring}</strong>
                <small>Dentro de 90 días</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--danger">
                <AlertTriangle size={19} />
              </span>
              <div>
                <span>Vencidos</span>
                <strong>{summary.expired}</strong>
                <small>Lotes no utilizables</small>
              </div>
            </article>
          </section>

          <section className="module-panel">
            <div className="module-panel__header module-panel__header--filters">
              <div>
                <span className="module-panel__eyebrow">Existencias</span>
                <h2>Inventario disponible</h2>
              </div>

              <div className="module-filters">
                <label className="module-search">
                  <Search size={16} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Producto, SKU, lote..."
                  />
                </label>

                <select
                  className="module-select"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                >
                  <option value="ALL">Todas las ubicaciones</option>
                  {locations.map((value) => (
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
                    render: (row) => {
                      const days = daysUntil(row.batch.expirationDate);
                      return (
                        <div className="cell-stack">
                          <strong>
                            {new Date(
                              row.batch.expirationDate,
                            ).toLocaleDateString("es-CL")}
                          </strong>
                          <span>
                            {days < 0
                              ? "Vencido"
                              : days <= 90
                                ? `${days} días`
                                : "Vigente"}
                          </span>
                        </div>
                      );
                    },
                  },
                  {
                    key: "location",
                    header: "Ubicación",
                    render: (row) => (
                      <span className="module-inline">
                        <MapPin size={13} />
                        {row.location.name}
                      </span>
                    ),
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
            ) : (
              <div className="module-empty">
                <span className="module-empty__icon">
                  <Boxes size={27} />
                </span>
                <strong>{rows.length ? "Sin resultados" : "Sin stock"}</strong>
                <p>
                  {rows.length
                    ? "Prueba otros filtros para encontrar existencias."
                    : "Los lotes recepcionados aparecerán aquí con su ubicación y vencimiento."}
                </p>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
};