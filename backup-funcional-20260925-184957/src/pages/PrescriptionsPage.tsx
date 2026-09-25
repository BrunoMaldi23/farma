import {
  CalendarClock,
  FileCheck2,
  FileText,
  Search,
  Stethoscope,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { PageLoader } from "../components/feedback/PageLoader";
import { PageHeader } from "../components/ui/PageHeader";
import { ResponsiveTable } from "../components/ui/ResponsiveTable";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useResource } from "../hooks/useResource";

type PrescriptionRow = {
  id: string;
  folio: string;
  prescriptionType: string;
  issueDate: string;
  expirationDate: string | null;
  status: string;
  patient: { firstName: string; lastName: string; rut: string };
  doctor: { firstName: string; lastName: string };
  items: unknown[];
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const isExpired = (value: string | null) => {
  if (!value) return false;
  return new Date(value).getTime() < Date.now();
};

export const PrescriptionsPage = () => {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");

  const selector = useCallback(
    (payload: any) => payload.items as PrescriptionRow[],
    [],
  );

  const { data, loading, error } = useResource<PrescriptionRow[]>(
    "/prescriptions?limit=50",
    selector,
  );

  const prescriptions = data ?? [];

  const statuses = useMemo(
    () =>
      Array.from(new Set(prescriptions.map((item) => item.status))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [prescriptions],
  );

  const filtered = useMemo(() => {
    const q = normalize(query.trim());

    return prescriptions.filter((item) => {
      if (status !== "ALL" && item.status !== status) return false;
      if (!q) return true;

      return normalize(
        [
          item.folio,
          item.patient?.firstName ?? "",
          item.patient?.lastName ?? "",
          item.patient?.rut ?? "",
          item.doctor?.firstName ?? "",
          item.doctor?.lastName ?? "",
          item.prescriptionType,
        ].join(" "),
      ).includes(q);
    });
  }, [prescriptions, query, status]);

  const summary = useMemo(
    () => ({
      total: prescriptions.length,
      active: prescriptions.filter((item) =>
        ["ACTIVE", "ACTIVA", "VALID", "VIGENTE"].includes(item.status.toUpperCase()),
      ).length,
      expired: prescriptions.filter((item) => isExpired(item.expirationDate)).length,
      items: prescriptions.reduce((sum, item) => sum + item.items.length, 0),
    }),
    [prescriptions],
  );

  return (
    <div className="module-v2">
      <PageHeader
        eyebrow="DispensaciÃ³n"
        title="Recetas"
        description="Seguimiento de vigencia, saldo y dispensaciÃ³n de recetas."
      />

      {loading ? <PageLoader /> : null}
      {error ? <div className="alert alert--error">{error}</div> : null}

      {!loading ? (
        <>
          <section className="module-v2__kpis">
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--green">
                <FileText size={19} />
              </span>
              <div>
                <span>Recetas</span>
                <strong>{summary.total}</strong>
                <small>Registros cargados</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--blue">
                <FileCheck2 size={19} />
              </span>
              <div>
                <span>Vigentes</span>
                <strong>{summary.active}</strong>
                <small>SegÃºn estado</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--amber">
                <CalendarClock size={19} />
              </span>
              <div>
                <span>Vencidas</span>
                <strong>{summary.expired}</strong>
                <small>Por fecha de expiraciÃ³n</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--violet">
                <Stethoscope size={19} />
              </span>
              <div>
                <span>Ãtems prescritos</span>
                <strong>{summary.items}</strong>
                <small>Medicamentos asociados</small>
              </div>
            </article>
          </section>

          <section className="module-panel">
            <div className="module-panel__header module-panel__header--filters">
              <div>
                <span className="module-panel__eyebrow">Seguimiento</span>
                <h2>Recetas registradas</h2>
              </div>

              <div className="module-filters">
                <label className="module-search">
                  <Search size={16} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Folio, paciente o mÃ©dico..."
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
                  { key: "folio", header: "Folio", render: (row) => row.folio },
                  {
                    key: "patient",
                    header: "Paciente",
                    render: (row) => (
                      <div className="cell-stack">
                        <strong>{row.patient.firstName} {row.patient.lastName}</strong>
                        <span>{row.patient.rut}</span>
                      </div>
                    ),
                  },
                  {
                    key: "doctor",
                    header: "MÃ©dico",
                    render: (row) => `${row.doctor.firstName} ${row.doctor.lastName}`,
                  },
                  {
                    key: "type",
                    header: "Tipo",
                    render: (row) => row.prescriptionType.replaceAll("_", " "),
                  },
                  {
                    key: "date",
                    header: "EmisiÃ³n",
                    render: (row) => new Date(row.issueDate).toLocaleDateString("es-CL"),
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
                <span className="module-empty__icon"><FileText size={27} /></span>
                <strong>{prescriptions.length ? "Sin resultados" : "Sin recetas"}</strong>
                <p>
                  {prescriptions.length
                    ? "Prueba otra bÃºsqueda o cambia el filtro de estado."
                    : "Las recetas registradas aparecerÃ¡n aquÃ­ con paciente, mÃ©dico y vigencia."}
                </p>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
};