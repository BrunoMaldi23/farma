import { Barcode, Search, ShoppingCart } from "lucide-react";

import { PageHeader } from "../components/ui/PageHeader";

export const PosPage = () => (
  <>
    <PageHeader
      eyebrow="Punto de venta"
      title="POS"
      description="Interfaz preparada para búsqueda de productos, receta, FEFO y cobro."
    />

    <section className="pos-grid">
      <article className="panel pos-catalog">
        <div className="pos-search">
          <Search size={19} />
          <input placeholder="Buscar por nombre, SKU o código de barras..." />
          <button className="icon-button" aria-label="Escanear código">
            <Barcode size={21} />
          </button>
        </div>

        <div className="pos-placeholder">
          <ShoppingCart size={42} strokeWidth={1.4} />
          <strong>Catálogo POS listo para conectar</strong>
          <span>
            En el próximo bloque visual agregaremos selección de productos,
            paciente, receta, convenio y checkout.
          </span>
        </div>
      </article>

      <aside className="panel pos-summary">
        <span className="panel__eyebrow">Venta actual</span>
        <h2>Resumen</h2>

        <div className="pos-summary__empty">
          <span>No hay productos agregados.</span>
        </div>

        <div className="pos-total">
          <span>Total</span>
          <strong>$0</strong>
        </div>

        <button className="button button--primary button--block" disabled>
          Cobrar
        </button>
      </aside>
    </section>
  </>
);
