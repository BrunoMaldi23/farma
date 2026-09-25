import {
  FileText,
  Search,
  Stethoscope,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { PageLoader } from "../components/feedback/PageLoader";
import { PageHeader } from "../components/ui/PageHeader";
import { ResponsiveTable } from "../components/ui/ResponsiveTable";
import { useResource } from "../hooks/useResource";

type DoctorRow = {
  id: string;
  rut: string;
  firstName: string;
  lastName: string;
  specialty: string | null;
  registration: string | null;
  _count: { prescriptions: number };
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const DoctorsPage = () => {
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("ALL");

  const selector = useCallback((payload: any) => payload.items as DoctorRow[], []);
  const { data, loading, error } = useResource<DoctorRow[]>(
    "/doctors?limit=50",
    selector,
  );

  const doctors = data ?? [];

  const specialties = useMemo(
    () =>
      Array.from(
        new Set(doctors.map((doctor) => doctor.specialty).filter(Boolean)),
      ).sort((a, b) => a!.localeCompare(b!, "es")),
    [doctors],
  );

  const filtered = useMemo(() => {
    const q = normalize(query.trim());

    return doctors.filter((doctor) => {
      if (specialty !== "ALL" && doctor.specialty !== specialty) return false;
      if (!q) return true;

      return normalize(
        [
          doctor.firstName,
          doctor.lastName,
          doctor.rut,
          doctor.specialty ?? "",
          doctor.registration ?? "",
        ].join(" "),
      ).includes(q);
    });
  }, [doctors, query, specialty]);

  const summary = useMemo(
    () => ({
      total: doctors.length,
      specialties: new Set(doctors.map((doctor) => doctor.specialty).filter(Boolean)).size,
      registered: doctors.filter((doctor) => Boolean(doctor.registration)).length,
      prescriptions: doctors.reduce(
        (sum, doctor) => sum + Number(doctor._count?.prescriptions ?? 0),
        0,
      ),
    }),
    [doctors],
  );

  return (
    <div className="module-v2">
      <PageHeader
        eyebrow="Atención clínica"
        title="Médicos"
        description="Profesionales asociados a las recetas registradas."
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
                <span>Profesionales</span>
                <strong>{summary.total}</strong>
                <small>Médicos cargados</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--blue">
                <Stethoscope size={19} />
              </span>
              <div>
                <span>Especialidades</span>
                <strong>{summary.specialties}</strong>
                <small>Áreas registradas</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--amber">
                <UserCheck size={19} />
              </span>
              <div>
                <span>Con registro</span>
                <strong>{summary.registered}</strong>
                <small>Profesionales identificados</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--violet">
                <FileText size={19} />
              </span>
              <div>
                <span>Recetas asociadas</span>
                <strong>{summary.prescriptions}</strong>
                <small>Prescripciones vinculadas</small>
              </div>
            </article>
          </section>

          <section className="module-panel">
            <div className="module-panel__header module-panel__header--filters">
              <div>
                <span className="module-panel__eyebrow">Profesionales</span>
                <h2>Médicos registrados</h2>
              </div>

              <div className="module-filters">
                <label className="module-search">
                  <Search size={16} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Nombre, RUT o registro..."
                  />
                </label>

                <select
                  className="module-select"
                  value={specialty}
                  onChange={(event) => setSpecialty(event.target.value)}
                >
                  <option value="ALL">Todas las especialidades</option>
                  {specialties.map((value) => (
                    <option key={value} value={value!}>
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
                    key: "name",
                    header: "Profesional",
                    render: (row) => (
                      <div className="cell-stack">
                        <strong>{row.firstName} {row.lastName}</strong>
                        <span>{row.rut}</span>
                      </div>
                    ),
                  },
                  { key: "rut", header: "RUT", render: (row) => row.rut },
                  {
                    key: "specialty",
                    header: "Especialidad",
                    render: (row) => row.specialty ?? "—",
                  },
                  {
                    key: "registration",
                    header: "Registro",
                    render: (row) => row.registration ?? "—",
                  },
                  {
                    key: "rx",
                    header: "Recetas",
                    render: (row) => row._count?.prescriptions ?? 0,
                  },
                ]}
              />
            ) : (
              <div className="module-empty">
                <span className="module-empty__icon"><Stethoscope size={27} /></span>
                <strong>{doctors.length ? "Sin resultados" : "Sin médicos"}</strong>
                <p>
                  {doctors.length
                    ? "Prueba otra búsqueda o cambia la especialidad."
                    : "Todavía no hay profesionales asociados a recetas."}
                </p>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
};