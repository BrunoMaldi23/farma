import {
  Database,
  Eye,
  EyeOff,
  RefreshCcw,
  Search,
  Settings2,
  ShieldCheck,
  Store,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { PageLoader } from "../components/feedback/PageLoader";
import { PageHeader } from "../components/ui/PageHeader";
import { useResource } from "../hooks/useResource";

type Setting = {
  id: string;
  key: string;
  value: string;
  description: string | null;
  isPublic: boolean;
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const getSettingGroup = (key: string) => {
  if (key.startsWith("pharmacy.")) return "Identidad";
  if (key.startsWith("security.")) return "Seguridad";
  if (key.startsWith("inventory.")) return "Inventario";
  return "Sistema";
};

export const SettingsPage = () => {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("ALL");

  const selector = useCallback(
    (payload: any) => payload.settings as Setting[],
    [],
  );

  const { data, loading, error, reload } = useResource<Setting[]>(
    "/settings",
    selector,
  );

  const settings = data ?? [];

  const groups = useMemo(
    () =>
      Array.from(
        new Set(settings.map((setting) => getSettingGroup(setting.key))),
      ).sort((a, b) => a.localeCompare(b, "es")),
    [settings],
  );

  const filtered = useMemo(() => {
    const q = normalize(query.trim());

    return settings.filter((setting) => {
      const settingGroup = getSettingGroup(setting.key);

      if (group !== "ALL" && settingGroup !== group) return false;
      if (!q) return true;

      return normalize(
        [
          setting.key,
          setting.value,
          setting.description ?? "",
          settingGroup,
        ].join(" "),
      ).includes(q);
    });
  }, [settings, query, group]);

  const summary = useMemo(
    () => ({
      total: settings.length,
      public: settings.filter((setting) => setting.isPublic).length,
      internal: settings.filter((setting) => !setting.isPublic).length,
      groups: new Set(
        settings.map((setting) => getSettingGroup(setting.key)),
      ).size,
    }),
    [settings],
  );

  return (
    <div className="module-v2 settings-v2">
      <PageHeader
        eyebrow="Sistema"
        title="Configuración"
        description="Parámetros generales de la farmacia y del sistema."
        actions={
          <button
            type="button"
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
                <Settings2 size={19} />
              </span>
              <div>
                <span>Parámetros</span>
                <strong>{summary.total}</strong>
                <small>Configuraciones cargadas</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--blue">
                <Eye size={19} />
              </span>
              <div>
                <span>Públicos</span>
                <strong>{summary.public}</strong>
                <small>Visibles para el sistema</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--amber">
                <EyeOff size={19} />
              </span>
              <div>
                <span>Internos</span>
                <strong>{summary.internal}</strong>
                <small>Configuración restringida</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--violet">
                <Database size={19} />
              </span>
              <div>
                <span>Grupos</span>
                <strong>{summary.groups}</strong>
                <small>Áreas configuradas</small>
              </div>
            </article>
          </section>

          <section className="settings-overview">
            <article className="settings-overview__item settings-overview__item--active">
              <span><Store size={18} /></span>
              <div>
                <strong>Identidad</strong>
                <small>Datos generales de la farmacia</small>
              </div>
            </article>

            <article className="settings-overview__item">
              <span><Settings2 size={18} /></span>
              <div>
                <strong>Operación</strong>
                <small>Parámetros funcionales</small>
              </div>
            </article>

            <article className="settings-overview__item">
              <span><ShieldCheck size={18} /></span>
              <div>
                <strong>Seguridad</strong>
                <small>Controles y visibilidad</small>
              </div>
            </article>

            <article className="settings-overview__item">
              <span><Database size={18} /></span>
              <div>
                <strong>Sistema</strong>
                <small>Parámetros técnicos</small>
              </div>
            </article>
          </section>

          <section className="module-panel">
            <div className="module-panel__header module-panel__header--filters">
              <div>
                <span className="module-panel__eyebrow">
                  Parámetros
                </span>
                <h2>Configuración general</h2>
              </div>

              <div className="module-filters">
                <label className="module-search">
                  <Search size={16} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar clave, valor o descripción..."
                  />
                </label>

                <select
                  className="module-select"
                  value={group}
                  onChange={(event) => setGroup(event.target.value)}
                >
                  <option value="ALL">Todos los grupos</option>
                  {groups.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filtered.length ? (
              <div className="settings-list">
                {filtered.map((setting) => (
                  <article className="settings-row" key={setting.id}>
                    <div className="settings-row__icon">
                      {setting.isPublic ? (
                        <Eye size={18} />
                      ) : (
                        <EyeOff size={18} />
                      )}
                    </div>

                    <div className="settings-row__main">
                      <div className="settings-row__heading">
                        <div>
                          <span className="settings-row__group">
                            {getSettingGroup(setting.key)}
                          </span>
                          <strong>{setting.key}</strong>
                        </div>

                        <span
                          className={`settings-visibility ${
                            setting.isPublic
                              ? "settings-visibility--public"
                              : "settings-visibility--internal"
                          }`}
                        >
                          {setting.isPublic ? "Público" : "Interno"}
                        </span>
                      </div>

                      <div className="settings-row__value">
                        <span>Valor</span>
                        <strong>{setting.value}</strong>
                      </div>

                      <p>
                        {setting.description ??
                          "Sin descripción configurada."}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="module-empty">
                <span className="module-empty__icon">
                  <Settings2 size={27} />
                </span>
                <strong>
                  {settings.length
                    ? "Sin resultados"
                    : "Sin configuraciones"}
                </strong>
                <p>
                  {settings.length
                    ? "Prueba otro término o cambia el grupo seleccionado."
                    : "No existen parámetros configurados en el sistema."}
                </p>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
};