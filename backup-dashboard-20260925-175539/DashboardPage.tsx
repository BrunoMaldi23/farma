import {
  AlertTriangle,
  Boxes,
  CircleDollarSign,
  ClipboardCheck,
  PackageX,
  ReceiptText,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { useCallback } from "react";

import { EmptyState } from "../components/feedback/EmptyState";
import { PageLoader } from "../components/feedback/PageLoader";
import { PageHeader } from "../components/ui/PageHeader";
import { StatCard } from "../components/ui/StatCard";
import { useResource } from "../hooks/useResource";

type Dashboard = {
  today: {
    sales: number;
    revenue: number;
  };
  counters: {
    activeProducts: number;
    activePatients: number;
    lowStock: number;
    expiringBatches: number;
    openCashSessions: number;
    activePrescriptions: number;
    pendingAlerts: number;
  };
  lowStock: Array<{
    id: string;
    sku: string;
    name: string;
    minimumStock: number;
    stock: number;
  }>;
};

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export const DashboardPage = () => {
  const selector = useCallback((payload: any) => payload.dashboard as Dashboard, []);
  const { data, loading, error, reload } = useResource<Dashboard>(
    "/reports/dashboard",
    selector,
  );

  if (loading) return <PageLoader label="Cargando dashboard..." />;

  return (
    <>
      <PageHeader
        eyebrow="Resumen operacional"
        title="Dashboard"
        description="Visión general de ventas, stock, pacientes y operación de farmacia."
        actions={
          <button className="button button--secondary" onClick={() => void reload()}>
            Actualizar
          </button>
        }
      />

      {error ? <div className="alert alert--error">{error}</div> : null}

      {data ? (
        <>
          <section className="stats-grid">
            <StatCard
              title="Ventas de hoy"
              value={data.today.sales}
              subtitle={clp.format(data.today.revenue)}
              icon={ReceiptText}
            />
            <StatCard
              title="Productos activos"
              value={data.counters.activeProducts}
              icon={Boxes}
            />
            <StatCard
              title="Pacientes activos"
              value={data.counters.activePatients}
              icon={UsersRound}
            />
            <StatCard
              title="Cajas abiertas"
              value={data.counters.openCashSessions}
              icon={WalletCards}
            />
            <StatCard
              title="Stock bajo"
              value={data.counters.lowStock}
              icon={PackageX}
            />
            <StatCard
              title="Lotes por vencer"
              value={data.counters.expiringBatches}
              icon={AlertTriangle}
            />
            <StatCard
              title="Recetas activas"
              value={data.counters.activePrescriptions}
              icon={ClipboardCheck}
            />
            <StatCard
              title="Alertas pendientes"
              value={data.counters.pendingAlerts}
              icon={CircleDollarSign}
            />
          </section>

          <section className="content-grid content-grid--2">
            <article className="panel">
              <div className="panel__header">
                <div>
                  <span className="panel__eyebrow">Inventario</span>
                  <h2>Productos con stock bajo</h2>
                </div>
              </div>

              {data.lowStock.length ? (
                <div className="compact-list">
                  {data.lowStock.map((item) => (
                    <div className="compact-list__row" key={item.id}>
                      <div>
                        <strong>{item.name}</strong>
                        <span>{item.sku}</span>
                      </div>
                      <div className="compact-list__meta">
                        <strong>{item.stock}</strong>
                        <span>Mín. {item.minimumStock}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Inventario estable"
                  description="No hay productos bajo el stock mínimo configurado."
                />
              )}
            </article>

            <article className="panel panel--accent">
              <span className="panel__eyebrow">Estado general</span>
              <h2>Backend conectado correctamente</h2>
              <p>
                El dashboard consume la API real y está listo para recibir los
                datos operacionales de la farmacia.
              </p>
              <div className="health-line">
                <span className="health-dot" />
                API disponible
              </div>
            </article>
          </section>
        </>
      ) : null}
    </>
  );
};
