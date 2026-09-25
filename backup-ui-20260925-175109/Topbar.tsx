import {
  ChevronRight,
  LogOut,
  Menu,
  Search,
} from "lucide-react";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { navigation } from "./navigation";

const findRouteLabel = (pathname: string): string => {
  for (const section of navigation) {
    for (const item of section.items) {
      if (item.to === pathname) {
        return item.label;
      }
    }
  }

  return pathname === "/" ? "Dashboard" : "FarmaGestión";
};

const getRoleLabel = (
  role:
    | string
    | {
        code?: string;
        name?: string;
      }
    | null
    | undefined,
) => {
  if (!role) {
    return "Usuario";
  }

  if (typeof role === "string") {
    return role;
  }

  return role.name ?? role.code ?? "Usuario";
};

export const Topbar = ({
  onOpenMenu,
}: {
  onOpenMenu: () => void;
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initials =
    `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  const currentLabel = useMemo(
    () => findRouteLabel(location.pathname),
    [location.pathname],
  );

  const roleLabel = getRoleLabel(user?.role);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button
          type="button"
          className="topbar__menu-button"
          onClick={onOpenMenu}
          aria-label="Abrir menú"
        >
          <Menu size={21} />
        </button>

        <div className="topbar__context">
          <span>FarmaGestión</span>
          <ChevronRight size={13} />
          <strong>{currentLabel}</strong>
        </div>

        <div className="topbar__search">
          <Search size={17} />

          <input
            type="search"
            placeholder="Buscar en el sistema..."
            aria-label="Buscar"
          />

          <kbd>Ctrl K</kbd>
        </div>
      </div>

      <div className="topbar__right">
        <div
          className="topbar__api-status"
          title="Backend disponible"
        >
          <span />
          <strong>En línea</strong>
        </div>

        <div className="topbar__divider" />

        <div className="topbar__user">
          <div className="topbar__avatar">
            {initials || "FG"}
          </div>

          <div className="topbar__user-copy">
            <strong>
              {user?.firstName} {user?.lastName}
            </strong>

            <span>{roleLabel}</span>
          </div>

          <button
            type="button"
            className="topbar__logout"
            onClick={handleLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};
