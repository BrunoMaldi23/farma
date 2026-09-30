import { Building2, Plus, RefreshCcw, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { PageLoader } from "../components/feedback/PageLoader";
import { ActionModal, type ActionField } from "../components/ui/ActionModal";
import { PageHeader } from "../components/ui/PageHeader";
import { ResponsiveTable } from "../components/ui/ResponsiveTable";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useResource } from "../hooks/useResource";
import { nullable, runApiAction } from "../lib/actionHelpers";
import { api } from "../lib/api";

type Laboratory = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
};

const norm = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const LaboratoriesPage = () => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Laboratory | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const selector = useCallback((payload: any) => payload.items as Laboratory[], []);
  const laboratoriesRes = useResource<Laboratory[]>(
    "/laboratories?limit=100",
    selector,
  );

  const laboratories = laboratoriesRes.data ?? [];

  const filtered = useMemo(() => {
    const q = norm(query.trim());

    if (!q) {
      return laboratories;
    }

    return laboratories.filter((laboratory) =>
      norm(
        [
          laboratory.code,
          laboratory.name,
          laboratory.description ?? "",
        ].join(" "),
      ).includes(q),
    );
  }, [laboratories, query]);

  const fields: ActionField[] = [
    { name: "code", label: "Código", required: true },
    { name: "name", label: "Nombre", required: true },
    { name: "description", label: "Descripción", type: "textarea" },
    { name: "isActive", label: "Activo", type: "checkbox" },
  ];

  const close = () => {
    setOpen(false);
    setEditing(null);
    setActionError("");
  };

  const save = async (values: Record<string, any>) => {
    const payload = {
      code: String(values.code),
      name: String(values.name),
      description: nullable(values.description),
      isActive: Boolean(values.isActive),
    };

    await runApiAction(
      () =>
        editing
          ? api.patch(`/laboratories/${editing.id}`, payload)
          : api.post("/laboratories", payload),
      setBusy,
      setActionError,
      async () => {
        await laboratoriesRes.reload();
        close();
      },
    );
  };

  const remove = async (laboratory: Laboratory) => {
    if (!confirm(`¿Eliminar el laboratorio ${laboratory.name}?`)) {
      return;
    }

    setActionError("");

    try {
      await api.delete(`/laboratories/${laboratory.id}`);
      await laboratoriesRes.reload();
    } catch (error: any) {
      setActionError(
        error?.response?.data?.error?.message ??
          error?.message ??
          "No fue posible eliminar el laboratorio",
      );
    }
  };

  return (
    <div className="module-v2">
      <PageHeader
        eyebrow="Catálogo"
        title="Laboratorios"
        description="Mantén los laboratorios farmacéuticos disponibles para asociarlos a productos."
        actions={
          <div className="module-toolbar-actions">
            <button
              className="button button--secondary"
              onClick={() => void laboratoriesRes.reload()}
            >
              <RefreshCcw size={17} />
              Actualizar
            </button>
            <button
              className="button button--primary"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus size={17} />
              Nuevo laboratorio
            </button>
          </div>
        }
      />

      {laboratoriesRes.loading ? <PageLoader /> : null}
      {laboratoriesRes.error || actionError ? (
        <div className="alert alert--error">
          {laboratoriesRes.error || actionError}
        </div>
      ) : null}

      {!laboratoriesRes.loading ? (
        <>
          <section className="module-v2__kpis">
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--green">
                <Building2 size={19} />
              </span>
              <div>
                <span>Laboratorios</span>
                <strong>{laboratories.length}</strong>
                <small>Registrados</small>
              </div>
            </article>
            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--blue">
                <Building2 size={19} />
              </span>
              <div>
                <span>Activos</span>
                <strong>
                  {laboratories.filter((laboratory) => laboratory.isActive).length}
                </strong>
                <small>Disponibles</small>
              </div>
            </article>
          </section>

          <section className="module-panel">
            <div className="module-panel__header module-panel__header--filters">
              <div>
                <span className="module-panel__eyebrow">Registro</span>
                <h2>Laboratorios farmacéuticos</h2>
              </div>
              <label className="module-search">
                <Search size={16} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Código, nombre o descripción..."
                />
              </label>
            </div>

            {filtered.length ? (
              <ResponsiveTable
                rows={filtered}
                getKey={(row) => row.id}
                columns={[
                  { key: "code", header: "Código", render: (row) => row.code },
                  {
                    key: "name",
                    header: "Laboratorio",
                    render: (row) => (
                      <div className="cell-stack">
                        <strong>{row.name}</strong>
                        <span>{row.description ?? "Sin descripción"}</span>
                      </div>
                    ),
                  },
                  {
                    key: "status",
                    header: "Estado",
                    render: (row) => (
                      <StatusBadge value={row.isActive ? "ACTIVE" : "INACTIVE"} />
                    ),
                  },
                  {
                    key: "actions",
                    header: "Acciones",
                    render: (row) => (
                      <div className="row-actions">
                        <button
                          className="row-action"
                          onClick={() => {
                            setEditing(row);
                            setOpen(true);
                          }}
                        >
                          Editar
                        </button>
                        <button
                          className="row-action row-action--danger"
                          onClick={() => void remove(row)}
                        >
                          Eliminar
                        </button>
                      </div>
                    ),
                  },
                ]}
              />
            ) : (
              <div className="module-empty">
                <span className="module-empty__icon">
                  <Building2 size={27} />
                </span>
                <strong>Sin laboratorios</strong>
                <p>Agrega laboratorios para asociarlos a productos.</p>
              </div>
            )}
          </section>
        </>
      ) : null}

      <ActionModal
        open={open}
        title={editing ? "Editar laboratorio" : "Nuevo laboratorio"}
        fields={fields}
        initialValues={editing ?? { isActive: true }}
        busy={busy}
        error={actionError}
        onClose={close}
        onSubmit={save}
      />
    </div>
  );
};
