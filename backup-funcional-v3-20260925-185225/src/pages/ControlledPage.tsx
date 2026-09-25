import {
  Activity,
  AlertTriangle,
  Boxes,
  LockKeyhole,
  Search,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

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

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const ControlledPage = () => {
  const [query, setQuery] = useState("");
  const [movement, setMovement] = useState("ALL");

  const selector = useCallback((payload: any) => payload.items as ControlledRow[], []);
  const { data, loading, error } = useResource<ControlledRow[]>(
    "/controlled-drugs?limit=50",
    selector,
  );

  const records = data ?? [];

  const movements = useMemo(
    () =>
      Array.from(new Set(records.map((record) => record.movementType))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [records],
  );

  const filtered = useMemo(() => {
    const q = normalize(query.trim());

    return records.filter((record) => {
      if (movement !== "ALL" && record.movementType !== movement) return false;
      if (!q) return true;

      return normalize(
        [
          record.recordNumber,
          record.product?.name ?? "",
          record.product?.sku ?? "",
          record.batch?.batchNumber ?? "",
          record.patient?.rut ?? "",
          record.patient?.firstName ?? "",
          record.patient?.lastName ?? "",
        ].join(" "),
      ).includes(q);
    });
  }, [records, query, movement]);

  const summary = useMemo(
    () => ({
      records: records.length,
      quantity: records.reduce((sum, record) => sum + Number(record.quantity ?? 0), 0),
      products: new Set(records.map((record) => record.product?.sku).filter(Boolean)).size,
      patients: new Set(records.map((record) => record.patient?.rut).filter(Boolean)).size,
    }),
    [records],
  );

  return (
    <div className="module-v2">
      <PageHeader
        eyebrow="Trazabilidad"
        title="Medicamentos controlados"
        description="Libro de movimientos y seguimiento de productos sujetos a control."
      />

      {loading ? <PageLoader /> : null}
      {error ? <div className="alert alert--error">{error}</div> : null}

      {!loading ? (
        <>
          <section className="module-v2__kpis">
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--danger">
                <LockKeyhole size={19} />
              </span>
              <div>
                <span>Registros</span>
                <strong>{summary.records}</strong>
                <small>Movimientos trazados</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--amber">
                <Activity size={19} />
              </span>
              <div>
                <span>Unidades movidas</span>
                <strong>{summary.quantity}</strong>
                <small>Total registrado</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--blue">
                <Boxes size={19} />
              </span>
              <div>
                <span>Productos</span>
                <strong>{summary.products}</strong>
                <small>SKU controlados</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--violet">
                <AlertTriangle size={19} />
              </span>
              <div>
                <span>Pacientes</span>
                <strong>{summary.patients}</strong>
                <small>Con registros asociados</small>
              </div>
            </article>
          </section>

          <section className="module-panel">
            <div className="module-panel__header module-panel__header--filters">
              <div>
                <span className="module-panel__eyebrow">Libro de control</span>
                <h2>Movimientos registrados</h2>
              </div>

              <div className="module-filters">
                <label className="module-search">
                  <Search size={16} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Registro, producto, lote o paciente..."
                  />
                </label>

                <select
                  className="module-select"
                  value={movement}
                  onChange={(event) => setMovement(event.target.value)}
                >
                  <option value="ALL">Todos los movimientos</option>
                  {movements.map((value) => (
                    <option key={value} value={value}>
                      {value.replaceAll("_", " ")}
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
                  { key: "record", header: "Registro", render: (row) => row.recordNumber },
                  {
                    key: "product",
                    header: "Producto",
                    render: (row) => (
                      <div className="cell-stack">
                        <strong>{row.product.name}</strong>
                        <span>{row.product.sku}</span>
                      </div>
                    ),
                  },
                  {
                    key: "movement",
                    header: "Movimiento",
                    render: (row) => row.movementType.replaceAll("_", " "),
                  },
                  {
                    key: "batch",
                    header: "Lote",
                    render: (row) => row.batch?.batchNumber ?? "—",
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
            ) : (
              <div className="module-empty">
                <span className="module-empty__icon"><LockKeyhole size={27} /></span>
                <strong>{records.length ? "Sin resultados" : "Sin registros controlados"}</strong>
                <p>
                  {records.length
                    ? "Prueba otra búsqueda o cambia el tipo de movimiento."
                    : "Los movimientos de medicamentos sujetos a control aparecerán aquí."}
                </p>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
};