import {
  CalendarDays,
  CircleDollarSign,
  ReceiptText,
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

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const isToday = (value: string) => {
  const date = new Date(value);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

export const SalesPage = () => {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");

  const selector = useCallback(
    (payload: any) => payload.items as SaleRow[],
    [],
  );

  const { data, loading, error, reload } = useResource<SaleRow[]>(
    "/sales?limit=50",
    selector,
  );

  const sales = data ?? [];

  const statuses = useMemo(
    () =>
      Array.from(new Set(sales.map((sale) => sale.status))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [sales],
  );

  const filtered = useMemo(() => {
    const q = normalize(query.trim());

    return sales.filter((sale) => {
      if (status !== "ALL" && sale.status !== status) return false;
      if (!q) return true;

      return normalize(
        [
          sale.code,
          sale.seller?.username ?? "",
          sale.patient?.rut ?? "",
          sale.patient?.firstName ?? "",
          sale.patient?.lastName ?? "",
        ].join(" "),
      ).includes(q);
    });
  }, [sales, query, status]);

  const summary = useMemo(() => {
    const today = sales.filter((sale) => isToday(sale.saleDate));
    const todayTotal = today.reduce(
      (sum, sale) => sum + Number(sale.totalAmount ?? 0),
      0,
    );

    return {
      todayCount: today.length,
      todayTotal,
      average: today.length ? todayTotal / today.length : 0,
      totalCount: sales.length,
    };
  }, [sales]);

  return (
    <div className="module-v2">
      <PageHeader
        eyebrow="Operación"
        title="Ventas"
        description="Historial de transacciones realizadas en el punto de venta."
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
                <ReceiptText size={19} />
              </span>
              <div>
                <span>Ventas de hoy</span>
                <strong>{summary.todayCount}</strong>
                <small>Transacciones</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--blue">
                <CircleDollarSign size={19} />
              </span>
              <div>
                <span>Total vendido hoy</span>
                <strong>{clp.format(summary.todayTotal)}</strong>
                <small>Venta bruta registrada</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--amber">
                <ShoppingBag size={19} />
              </span>
              <div>
                <span>Ticket promedio</span>
                <strong>{clp.format(summary.average)}</strong>
                <small>Promedio de hoy</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--violet">
                <CalendarDays size={19} />
              </span>
              <div>
                <span>Historial cargado</span>
                <strong>{summary.totalCount}</strong>
                <small>Últimos registros</small>
              </div>
            </article>
          </section>

          <section className="module-panel">
            <div className="module-panel__header module-panel__header--filters">
              <div>
                <span className="module-panel__eyebrow">Historial</span>
                <h2>Transacciones</h2>
              </div>

              <div className="module-filters">
                <label className="module-search">
                  <Search size={16} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar venta, paciente o vendedor..."
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
                    header: "Venta",
                    render: (row) => (
                      <div className="cell-stack">
                        <strong>{row.code}</strong>
                        <span>
                          {new Date(row.saleDate).toLocaleDateString("es-CL")}
                        </span>
                      </div>
                    ),
                  },
                  {
                    key: "date",
                    header: "Hora",
                    render: (row) =>
                      new Date(row.saleDate).toLocaleTimeString("es-CL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
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
            ) : (
              <div className="module-empty">
                <span className="module-empty__icon">
                  <ReceiptText size={27} />
                </span>
                <strong>
                  {sales.length ? "Sin resultados" : "Aún no existen ventas"}
                </strong>
                <p>
                  {sales.length
                    ? "Prueba otra búsqueda o cambia el filtro de estado."
                    : "Las transacciones realizadas en el POS aparecerán aquí."}
                </p>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
};