import {
  Banknote,
  CircleDollarSign,
  Clock3,
  ReceiptText,
  WalletCards,
} from "lucide-react";
import { useCallback, useMemo } from "react";

import { PageLoader } from "../components/feedback/PageLoader";
import { PageHeader } from "../components/ui/PageHeader";
import { ResponsiveTable } from "../components/ui/ResponsiveTable";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useResource } from "../hooks/useResource";

type CashSession = {
  id: string;
  openedAt: string;
  status: string;
  openingAmount: string | number;
  expectedAmount: string | number | null;
  countedAmount: string | number | null;
  cashRegister: { name: string };
  openedBy: { username: string };
  _count: { sales: number; movements: number };
};

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const isOpen = (status: string) =>
  ["OPEN", "ABIERTA", "ABIERTO"].includes(status.toUpperCase());

export const CashPage = () => {
  const selector = useCallback(
    (payload: any) => payload.sessions as CashSession[],
    [],
  );

  const { data, loading, error, reload } = useResource<CashSession[]>(
    "/cash/sessions?limit=50",
    selector,
  );

  const sessions = data ?? [];

  const summary = useMemo(() => {
    const openSessions = sessions.filter((session) => isOpen(session.status));
    const opening = openSessions.reduce(
      (sum, session) => sum + Number(session.openingAmount ?? 0),
      0,
    );
    const expected = openSessions.reduce(
      (sum, session) =>
        sum + Number(session.expectedAmount ?? session.openingAmount ?? 0),
      0,
    );
    const sales = openSessions.reduce(
      (sum, session) => sum + Number(session._count?.sales ?? 0),
      0,
    );

    return {
      openCount: openSessions.length,
      opening,
      expected,
      sales,
    };
  }, [sessions]);

  return (
    <div className="module-v2">
      <PageHeader
        eyebrow="Tesorería"
        title="Caja"
        description="Sesiones de caja, aperturas, cierres y control operacional."
        actions={
          <button
            className="button button--secondary"
            onClick={() => void reload()}
          >
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
                <WalletCards size={19} />
              </span>
              <div>
                <span>Cajas abiertas</span>
                <strong>{summary.openCount}</strong>
                <small>Sesiones activas</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--blue">
                <Banknote size={19} />
              </span>
              <div>
                <span>Monto inicial</span>
                <strong>{clp.format(summary.opening)}</strong>
                <small>Fondos de apertura</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--amber">
                <ReceiptText size={19} />
              </span>
              <div>
                <span>Ventas de sesión</span>
                <strong>{summary.sales}</strong>
                <small>Operaciones registradas</small>
              </div>
            </article>

            <article className="module-kpi">
              <span className="module-kpi__icon module-kpi__icon--violet">
                <CircleDollarSign size={19} />
              </span>
              <div>
                <span>Efectivo esperado</span>
                <strong>{clp.format(summary.expected)}</strong>
                <small>Según sesiones abiertas</small>
              </div>
            </article>
          </section>

          <section className="module-panel">
            <div className="module-panel__header">
              <div>
                <span className="module-panel__eyebrow">Sesiones</span>
                <h2>Control de caja</h2>
                <p>Aperturas, responsables y estado actual de cada caja.</p>
              </div>
              <span className="module-panel__count">
                <Clock3 size={14} />
                {sessions.length} sesiones
              </span>
            </div>

            {sessions.length ? (
              <ResponsiveTable
                rows={sessions}
                getKey={(row) => row.id}
                columns={[
                  {
                    key: "register",
                    header: "Caja",
                    render: (row) => (
                      <div className="cell-stack">
                        <strong>{row.cashRegister.name}</strong>
                        <span>{row._count?.movements ?? 0} movimientos</span>
                      </div>
                    ),
                  },
                  {
                    key: "opened",
                    header: "Apertura",
                    render: (row) =>
                      new Date(row.openedAt).toLocaleString("es-CL"),
                  },
                  {
                    key: "user",
                    header: "Usuario",
                    render: (row) => row.openedBy.username,
                  },
                  {
                    key: "amount",
                    header: "Monto inicial",
                    render: (row) => clp.format(Number(row.openingAmount)),
                  },
                  {
                    key: "expected",
                    header: "Esperado",
                    render: (row) =>
                      clp.format(
                        Number(row.expectedAmount ?? row.openingAmount ?? 0),
                      ),
                  },
                  {
                    key: "sales",
                    header: "Ventas",
                    render: (row) => row._count?.sales ?? 0,
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
                  <WalletCards size={27} />
                </span>
                <strong>Sin sesiones de caja</strong>
                <p>Cuando se abra una caja, aparecerá aquí con su detalle operacional.</p>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
};