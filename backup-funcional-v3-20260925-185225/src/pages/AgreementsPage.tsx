import {
  BadgePercent,
  Building2,
  Layers3,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { PageLoader } from "../components/feedback/PageLoader";
import { PageHeader } from "../components/ui/PageHeader";
import { ResponsiveTable } from "../components/ui/ResponsiveTable";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useResource } from "../hooks/useResource";

type AgreementRow = {
  id: string;
  code: string;
  name: string;
  type: string;
  isActive: boolean;
  plans: Array<{ id: string }>;
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const AgreementsPage = () => {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("ALL");

  const selector = useCallback(
    (payload: any) => payload.agreements as AgreementRow[],
    [],
  );

  const { data, loading, error } = useResource<AgreementRow[]>(
    "/agreements",
    selector,
  );

  const agreements = data ?? [];

  const types = useMemo(
    () =>
      Array.from(new Set(agreements.map((agreement) => agreement.type))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [agreements],
  );

  const filtered = useMemo(() => {
    const q = normalize(query.trim());

    return agreements.filter((agreement) => {
      if (type !== "ALL" && agreement.type !== type) return false;
      if (!q) return true;

      return normalize(
        [agreement.code, agreement.name, agreement.type].join(" "),
      ).includes(q);
    });
  }, [agreements, query, type]);

  const summary = useMemo(
    () => ({
      total: agreements.length,
      active: agreements.filter((agreement) => agreement.isActive).length,
      plans: agreements.reduce((sum, agreement) => sum + agreement.plans.length, 0),
      types: new Set(agreements.map((agreement) => agreement.type)).size,
    }),
    [agreements],
  );

  return (
    <div className="module-v2">
      <PageHeader
        eyebrow="Beneficios"
        title="Convenios y coberturas"
        description="Isapres, seguros, Cenabast y convenios institucionales."
      />

      {loading ? <PageLoader /> : null}
      {error ? <div className="alert alert--error">{error}</div> : null}

      {!loading ? (
        <>
          <section className="module-v2__kpis">
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--green">
                <ShieldCheck size={19} />
              </span>
              <div>
                <span>Convenios</span>
                <strong>{summary.total}</strong>
                <small>Configurados</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--blue">
                <Building2 size={19} />
              </span>
              <div>
                <span>Activos</span>
                <strong>{summary.active}</strong>
                <small>Disponibles para aplicar</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--amber">
                <Layers3 size={19} />
              </span>
              <div>
                <span>Planes</span>
                <strong>{summary.plans}</strong>
                <small>Beneficios asociados</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--violet">
                <BadgePercent size={19} />
              </span>
              <div>
                <span>Tipos</span>
                <strong>{summary.types}</strong>
                <small>Categorías de convenio</small>
              </div>
            </article>
          </section>

          <section className="module-panel">
            <div className="module-panel__header module-panel__header--filters">
              <div>
                <span className="module-panel__eyebrow">Beneficios</span>
                <h2>Convenios configurados</h2>
              </div>

              <div className="module-filters">
                <label className="module-search">
                  <Search size={16} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Código, convenio o tipo..."
                  />
                </label>

                <select
                  className="module-select"
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                >
                  <option value="ALL">Todos los tipos</option>
                  {types.map((value) => (
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
                  { key: "code", header: "Código", render: (row) => row.code },
                  { key: "name", header: "Convenio", render: (row) => row.name },
                  { key: "type", header: "Tipo", render: (row) => row.type },
                  {
                    key: "plans",
                    header: "Planes",
                    render: (row) => row.plans?.length ?? 0,
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
                <span className="module-empty__icon"><ShieldCheck size={27} /></span>
                <strong>{agreements.length ? "Sin resultados" : "Sin convenios"}</strong>
                <p>
                  {agreements.length
                    ? "Prueba otra búsqueda o cambia el filtro de tipo."
                    : "Aún no hay convenios configurados."}
                </p>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
};