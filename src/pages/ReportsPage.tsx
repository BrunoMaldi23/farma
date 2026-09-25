import {
  Download,
  FileSpreadsheet,
  FileText,
  PackageSearch,
  ReceiptText,
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
  <>
    <PageHeader
      eyebrow="Análisis"
      title="Reportes"
      description="Descarga información operacional para análisis y respaldo."
    />

    <section className="reports-grid">
      <article className="report-card">
        <span className="report-card__icon">
          <ReceiptText size={22} />
        </span>
        <h2>Ventas</h2>
        <p>Ventas, vendedor, paciente, descuentos y coberturas.</p>
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

      <article className="report-card">
        <span className="report-card__icon">
          <PackageSearch size={22} />
        </span>
        <h2>Inventario</h2>
        <p>Stock, categoría, laboratorio y productos en nivel crítico.</p>
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
  </>
);
