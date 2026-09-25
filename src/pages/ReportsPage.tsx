import {
  Download,
  FileSpreadsheet,
  FileText,
  PackageSearch,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";

import { API_URL } from "../lib/api";
import { PageHeader } from "../components/ui/PageHeader";

const download = async (path: string, filename: string) => {
  const token = localStorage.getItem("farmacia_access_token");

  const response = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error("No fue posible descargar el reporte");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const ReportsPage = () => (
  <div className="module-v2">
    <PageHeader
      eyebrow="Análisis"
      title="Reportes"
      description="Descarga información operacional para análisis y respaldo."
    />

    <section className="reports-v2__intro">
      <div>
        <span className="reports-v2__intro-icon">
          <ShieldCheck size={22} />
        </span>
        <div>
          <strong>Centro de reportes</strong>
          <p>
            Exporta información de ventas e inventario en formatos listos para análisis,
            respaldo y auditoría.
          </p>
        </div>
      </div>
    </section>

    <section className="reports-v2__grid">
      <article className="report-card report-card--v2">
        <div className="report-card__top">
          <span className="report-card__icon">
            <ReceiptText size={22} />
          </span>
          <span className="report-card__tag">Comercial</span>
        </div>

        <h2>Reporte de ventas</h2>
        <p>Ventas, vendedor, paciente, descuentos y coberturas.</p>

        <div className="report-card__meta">
          <span>Formatos disponibles</span>
          <strong>Excel · PDF</strong>
        </div>

        <div className="report-card__actions">
          <button
            className="button button--secondary"
            onClick={() => void download("/reports/sales.xlsx", "reporte-ventas.xlsx")}
          >
            <FileSpreadsheet size={17} />
            Excel
          </button>

          <button
            className="button button--secondary"
            onClick={() => void download("/reports/sales.pdf", "reporte-ventas.pdf")}
          >
            <FileText size={17} />
            PDF
          </button>
        </div>
      </article>

      <article className="report-card report-card--v2">
        <div className="report-card__top">
          <span className="report-card__icon">
            <PackageSearch size={22} />
          </span>
          <span className="report-card__tag">Inventario</span>
        </div>

        <h2>Reporte de inventario</h2>
        <p>Stock, categoría, laboratorio y productos en nivel crítico.</p>

        <div className="report-card__meta">
          <span>Formato disponible</span>
          <strong>Excel</strong>
        </div>

        <div className="report-card__actions">
          <button
            className="button button--secondary"
            onClick={() =>
              void download("/reports/inventory.xlsx", "reporte-inventario.xlsx")
            }
          >
            <Download size={17} />
            Excel
          </button>
        </div>
      </article>
    </section>
  </div>
);