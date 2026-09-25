import {
  FileText,
  RefreshCcw,
  Search,
  ShoppingBag,
  UserCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { PageLoader } from "../components/feedback/PageLoader";
import { PageHeader } from "../components/ui/PageHeader";
import { ResponsiveTable } from "../components/ui/ResponsiveTable";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useResource } from "../hooks/useResource";

type PatientRow = {
  id: string;
  rut: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  _count: { prescriptions: number; sales: number };
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const PatientsPage = () => {
  const [query, setQuery] = useState("");
  const [state, setState] = useState("ALL");

  const selector = useCallback((payload: any) => payload.items as PatientRow[], []);
  const { data, loading, error, reload } = useResource<PatientRow[]>(
    "/patients?limit=50",
    selector,
  );

  const patients = data ?? [];

  const filtered = useMemo(() => {
    const q = normalize(query.trim());

    return patients.filter((patient) => {
      if (state === "ACTIVE" && !patient.isActive) return false;
      if (state === "INACTIVE" && patient.isActive) return false;
      if (!q) return true;

      return normalize(
        [
          patient.firstName,
          patient.lastName,
          patient.rut,
          patient.phone ?? "",
          patient.email ?? "",
        ].join(" "),
      ).includes(q);
    });
  }, [patients, query, state]);

  const summary = useMemo(
    () => ({
      total: patients.length,
      active: patients.filter((patient) => patient.isActive).length,
      prescriptions: patients.reduce(
        (sum, patient) => sum + Number(patient._count?.prescriptions ?? 0),
        0,
      ),
      sales: patients.reduce(
        (sum, patient) => sum + Number(patient._count?.sales ?? 0),
        0,
      ),
    }),
    [patients],
  );

  return (
    <div className="module-v2">
      <PageHeader
        eyebrow="Atención clínica"
        title="Pacientes"
        description="Ficha de pacientes, recetas, ventas y coberturas."
        actions={
          <>
            <button className="button button--secondary" onClick={() => void reload()}>
              <RefreshCcw size={17} />
              Actualizar
            </button>
            <button
              className="button button--primary"
              type="button"
              title="Formulario de paciente pendiente de conectar."
            >
              <UserPlus size={17} />
              Nuevo paciente
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
                <UsersRound size={19} />
              </span>
              <div>
                <span>Pacientes</span>
                <strong>{summary.total}</strong>
                <small>Registros cargados</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--blue">
                <UserCheck size={19} />
              </span>
              <div>
                <span>Activos</span>
                <strong>{summary.active}</strong>
                <small>Disponibles para atención</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--amber">
                <FileText size={19} />
              </span>
              <div>
                <span>Recetas asociadas</span>
                <strong>{summary.prescriptions}</strong>
                <small>Según fichas cargadas</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--violet">
                <ShoppingBag size={19} />
              </span>
              <div>
                <span>Ventas asociadas</span>
                <strong>{summary.sales}</strong>
                <small>Historial vinculado</small>
              </div>
            </article>
          </section>

          <section className="module-panel">
            <div className="module-panel__header module-panel__header--filters">
              <div>
                <span className="module-panel__eyebrow">Fichas</span>
                <h2>Pacientes registrados</h2>
              </div>

              <div className="module-filters">
                <label className="module-search">
                  <Search size={16} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Nombre, RUT, teléfono o correo..."
                  />
                </label>

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
                    key: "patient",
                    header: "Paciente",
                    render: (row) => (
                      <div className="cell-stack">
                        <strong>{row.firstName} {row.lastName}</strong>
                        <span>{row.rut}</span>
                      </div>
                    ),
                  },
                  { key: "phone", header: "Teléfono", render: (row) => row.phone ?? "—" },
                  { key: "email", header: "Correo", render: (row) => row.email ?? "—" },
                  {
                    key: "prescriptions",
                    header: "Recetas",
                    render: (row) => row._count?.prescriptions ?? 0,
                  },
                  {
                    key: "sales",
                    header: "Ventas",
                    render: (row) => row._count?.sales ?? 0,
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
                <span className="module-empty__icon"><UsersRound size={27} /></span>
                <strong>{patients.length ? "Sin resultados" : "Sin pacientes"}</strong>
                <p>
                  {patients.length
                    ? "Prueba otra búsqueda o modifica el filtro de estado."
                    : "Todavía no existen pacientes registrados."}
                </p>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
};