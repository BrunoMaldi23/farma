import { ChevronLeft, Pill, X } from "lucide-react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { navigation } from "./navigation";

export const Sidebar = ({
  open,
  collapsed,
  onClose,
  onToggleCollapse,
}: {
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}) => {
  const { hasPermission } = useAuth();

  return (
    <>
      <button
        className={`sidebar-backdrop ${open ? "sidebar-backdrop--visible" : ""}`}
        onClick={onClose}
        aria-label="Cerrar menú"
      />

      <aside
        className={[
          "sidebar",
          open ? "sidebar--open" : "",
          collapsed ? "sidebar--collapsed" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="sidebar__brand">
          <div className="sidebar__brand-mark">
            <Pill size={24} />
          </div>

          <div className="sidebar__brand-copy">
            <strong>FarmaGestión</strong>
            <span>Farmacia privada</span>
          </div>

          <button
            className="icon-button sidebar__mobile-close"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar__nav">
          {navigation.map((section) => {
            const visibleItems = section.items.filter((item) =>
              hasPermission(item.permission),
            );

            if (!visibleItems.length) {
              return null;
            }

            return (
              <section className="sidebar__section" key={section.label}>
                <span className="sidebar__section-title">{section.label}</span>

                {visibleItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === "/"}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
                      }
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon size={19} />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </section>
            );
          })}
        </nav>

        <button
          type="button"
          className="sidebar__collapse"
          onClick={onToggleCollapse}
        >
          <ChevronLeft
            size={18}
            className={collapsed ? "sidebar__collapse-icon--rotated" : ""}
          />
          <span>{collapsed ? "Expandir" : "Contraer menú"}</span>
        </button>
      </aside>
    </>
  );
};
