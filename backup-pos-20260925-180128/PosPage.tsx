import {
  Barcode,
  Boxes,
  ChevronRight,
  Minus,
  PackageSearch,
  Pill,
  Plus,
  ReceiptText,
  Search,
  ShoppingCart,
  Trash2,
  UserRound,
  WalletCards,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { api, getApiErrorMessage } from "../lib/api";

type Product = {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  salePrice: string | number;
  prescriptionType?: string;
  requiresPrescription: boolean;
  isControlled: boolean;
  isActive: boolean;
  category?: {
    name: string;
  } | null;
  laboratory?: {
    name: string;
  } | null;
};

type StockRow = {
  id: string;
  quantity: number;
  reservedQuantity: number;
  batch: {
    product: {
      id: string;
    };
  };
};

type CashSession = {
  id: string;
  status: string;
  cashRegister?: {
    name: string;
  } | null;
};

type CartItem = {
  product: Product;
  quantity: number;
  stock: number;
};

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export const PosPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockRows, setStockRows] = useState<StockRow[]>([]);
  const [cashSessions, setCashSessions] = useState<CashSession[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("TODAS");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPos = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [productsResponse, stockResponse, cashResponse] = await Promise.all([
        api.get("/products?limit=100"),
        api.get("/inventory/stock?limit=500"),
        api.get("/cash/sessions?limit=50"),
      ]);

      setProducts(productsResponse.data.items ?? []);
      setStockRows(stockResponse.data.items ?? []);
      setCashSessions(cashResponse.data.sessions ?? []);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPos();
  }, [loadPos]);

  const stockByProduct = useMemo(() => {
    const result = new Map<string, number>();

    stockRows.forEach((row) => {
      const productId = row.batch?.product?.id;

      if (!productId) {
        return;
      }

      const available = Math.max(
        0,
        Number(row.quantity) - Number(row.reservedQuantity),
      );

      result.set(
        productId,
        (result.get(productId) ?? 0) + available,
      );
    });

    return result;
  }, [stockRows]);

  const categories = useMemo(() => {
    const values = Array.from(
      new Set(
        products
          .map((product) => product.category?.name)
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort((a, b) => a.localeCompare(b, "es"));

    return ["TODAS", ...values];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = normalize(query);

    return products.filter((product) => {
      if (!product.isActive) {
        return false;
      }

      if (
        category !== "TODAS" &&
        product.category?.name !== category
      ) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchable = normalize(
        [
          product.name,
          product.sku,
          product.barcode ?? "",
          product.laboratory?.name ?? "",
          product.category?.name ?? "",
        ].join(" "),
      );

      return searchable.includes(normalizedQuery);
    });
  }, [products, query, category]);

  const openCash = useMemo(
    () =>
      cashSessions.find(
        (session) =>
          session.status === "OPEN" ||
          session.status === "ABIERTA",
      ) ?? null,
    [cashSessions],
  );

  const totalUnits = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum +
          Number(item.product.salePrice) *
            item.quantity,
        0,
      ),
    [cart],
  );

  const addToCart = (product: Product) => {
    const availableStock = stockByProduct.get(product.id) ?? 0;

    if (availableStock <= 0) {
      return;
    }

    setCart((current) => {
      const existing = current.find(
        (item) => item.product.id === product.id,
      );

      if (existing) {
        if (existing.quantity >= availableStock) {
          return current;
        }

        return current.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );
      }

      return [
        ...current,
        {
          product,
          quantity: 1,
          stock: availableStock,
        },
      ];
    });
  };

  const updateQuantity = (
    productId: string,
    nextQuantity: number,
  ) => {
    setCart((current) =>
      current
        .map((item) => {
          if (item.product.id !== productId) {
            return item;
          }

          return {
            ...item,
            quantity: Math.min(
              Math.max(nextQuantity, 0),
              item.stock,
            ),
          };
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const removeItem = (productId: string) => {
    setCart((current) =>
      current.filter(
        (item) => item.product.id !== productId,
      ),
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <div className="pos-v2">
      <header className="pos-v2__header">
        <div>
          <span className="pos-v2__eyebrow">
            Punto de venta
          </span>
          <h1>POS</h1>
          <p>
            Venta rápida con inventario por lote y control FEFO.
          </p>
        </div>

        <div
          className={`pos-v2__cash ${
            openCash ? "pos-v2__cash--open" : ""
          }`}
        >
          <WalletCards size={17} />
          <div>
            <span>Estado de caja</span>
            <strong>
              {openCash
                ? openCash.cashRegister?.name ??
                  "Caja abierta"
                : "Sin caja abierta"}
            </strong>
          </div>
        </div>
      </header>

      {error ? (
        <div className="alert alert--error">{error}</div>
      ) : null}

      <section className="pos-v2__layout">
        <div className="pos-v2__catalog">
          <div className="pos-v2__toolbar">
            <div className="pos-v2__search">
              <Search size={18} />

              <input
                type="search"
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Buscar producto, SKU o código de barras..."
                autoFocus
              />

              <span className="pos-v2__search-code">
                <Barcode size={18} />
              </span>
            </div>

            <div className="pos-v2__category-scroll">
              {categories.map((value) => (
                <button
                  type="button"
                  key={value}
                  className={`pos-v2__category ${
                    category === value
                      ? "pos-v2__category--active"
                      : ""
                  }`}
                  onClick={() => setCategory(value)}
                >
                  {value === "TODAS"
                    ? "Todos"
                    : value}
                </button>
              ))}
            </div>
          </div>

          <div className="pos-v2__catalog-heading">
            <div>
              <h2>Productos</h2>
              <span>
                {filteredProducts.length} disponibles en catálogo
              </span>
            </div>

            <button
              type="button"
              className="pos-v2__reload"
              onClick={() => void loadPos()}
            >
              Actualizar
            </button>
          </div>

          {loading ? (
            <div className="pos-v2__loading">
              Cargando productos...
            </div>
          ) : filteredProducts.length ? (
            <div className="pos-v2__products">
              {filteredProducts.map((product) => {
                const stock =
                  stockByProduct.get(product.id) ?? 0;

                const cartQuantity =
                  cart.find(
                    (item) =>
                      item.product.id === product.id,
                  )?.quantity ?? 0;

                return (
                  <article
                    className={`pos-product ${
                      stock <= 0
                        ? "pos-product--out"
                        : ""
                    }`}
                    key={product.id}
                  >
                    <div className="pos-product__top">
                      <div className="pos-product__icon">
                        <Pill size={21} />
                      </div>

                      <div className="pos-product__badges">
                        {product.isControlled ? (
                          <span className="pos-product__badge pos-product__badge--controlled">
                            Controlado
                          </span>
                        ) : product.requiresPrescription ? (
                          <span className="pos-product__badge pos-product__badge--rx">
                            Receta
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="pos-product__body">
                      <span className="pos-product__category">
                        {product.category?.name ??
                          "Producto"}
                      </span>

                      <h3>{product.name}</h3>

                      <small>
                        {product.laboratory?.name ??
                          product.sku}
                      </small>
                    </div>

                    <div className="pos-product__meta">
                      <div>
                        <span>Stock</span>
                        <strong
                          className={
                            stock <= 0
                              ? "pos-product__stock--out"
                              : ""
                          }
                        >
                          {stock}
                        </strong>
                      </div>

                      <strong className="pos-product__price">
                        {clp.format(
                          Number(product.salePrice),
                        )}
                      </strong>
                    </div>

                    <button
                      type="button"
                      className="pos-product__add"
                      disabled={
                        stock <= 0 ||
                        cartQuantity >= stock
                      }
                      onClick={() =>
                        addToCart(product)
                      }
                    >
                      <Plus size={16} />
                      {stock <= 0
                        ? "Sin stock"
                        : cartQuantity
                          ? "Agregar otro"
                          : "Agregar"}
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="pos-v2__empty">
              <PackageSearch size={36} />
              <strong>
                No encontramos productos
              </strong>
              <span>
                Prueba otro término o cambia el filtro.
              </span>
            </div>
          )}
        </div>

        <aside className="pos-v2__cart">
          <div className="pos-v2__cart-header">
            <div>
              <span className="pos-v2__eyebrow">
                Venta actual
              </span>
              <h2>Resumen</h2>
            </div>

            <div className="pos-v2__cart-count">
              <ShoppingCart size={16} />
              <span>{totalUnits}</span>
            </div>
          </div>

          <button
            type="button"
            className="pos-v2__customer"
          >
            <span className="pos-v2__customer-icon">
              <UserRound size={17} />
            </span>

            <div>
              <strong>Venta directa</strong>
              <span>Agregar paciente</span>
            </div>

            <ChevronRight size={16} />
          </button>

          <div className="pos-v2__cart-items">
            {cart.length ? (
              cart.map((item) => (
                <div
                  className="pos-cart-item"
                  key={item.product.id}
                >
                  <div className="pos-cart-item__main">
                    <div className="pos-cart-item__icon">
                      <Pill size={17} />
                    </div>

                    <div className="pos-cart-item__info">
                      <strong>
                        {item.product.name}
                      </strong>
                      <span>
                        {clp.format(
                          Number(
                            item.product.salePrice,
                          ),
                        )}{" "}
                        c/u
                      </span>
                    </div>

                    <button
                      type="button"
                      className="pos-cart-item__remove"
                      onClick={() =>
                        removeItem(item.product.id)
                      }
                      aria-label="Eliminar producto"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="pos-cart-item__bottom">
                    <div className="pos-quantity">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.product.id,
                            item.quantity - 1,
                          )
                        }
                      >
                        <Minus size={14} />
                      </button>

                      <strong>{item.quantity}</strong>

                      <button
                        type="button"
                        disabled={
                          item.quantity >= item.stock
                        }
                        onClick={() =>
                          updateQuantity(
                            item.product.id,
                            item.quantity + 1,
                          )
                        }
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <strong>
                      {clp.format(
                        Number(item.product.salePrice) *
                          item.quantity,
                      )}
                    </strong>
                  </div>
                </div>
              ))
            ) : (
              <div className="pos-v2__cart-empty">
                <div>
                  <ShoppingCart size={26} />
                </div>
                <strong>Tu venta está vacía</strong>
                <span>
                  Selecciona productos para comenzar.
                </span>
              </div>
            )}
          </div>

          <div className="pos-v2__cart-footer">
            {cart.length ? (
              <button
                type="button"
                className="pos-v2__clear"
                onClick={clearCart}
              >
                Vaciar venta
              </button>
            ) : null}

            <div className="pos-v2__totals">
              <div>
                <span>Productos</span>
                <strong>{totalUnits}</strong>
              </div>

              <div>
                <span>Subtotal</span>
                <strong>
                  {clp.format(subtotal)}
                </strong>
              </div>

              <div className="pos-v2__total">
                <span>Total</span>
                <strong>
                  {clp.format(subtotal)}
                </strong>
              </div>
            </div>

            <button
              type="button"
              className="pos-v2__checkout"
              disabled={
                !cart.length ||
                !openCash
              }
              title={
                !openCash
                  ? "Debes abrir una caja antes de cobrar"
                  : undefined
              }
            >
              <ReceiptText size={18} />
              <span>
                {openCash
                  ? "Continuar al pago"
                  : "Abrir caja para cobrar"}
              </span>
              <ChevronRight size={17} />
            </button>

            <p className="pos-v2__checkout-note">
              El cobro definitivo se conectará con pago,
              convenio, receta y DTE.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
};