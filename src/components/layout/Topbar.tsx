import { LogOut, Menu, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

export const Topbar = ({ onOpenMenu }: { onOpenMenu: () => void }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button
          className="icon-button topbar__menu-button"
          onClick={onOpenMenu}
          aria-label="Abrir menú"
        >
          <Menu size={21} />
        </button>

        <div className="topbar__search">
          <Search size={18} />
          <input
            type="search"
            placeholder="Buscar en el sistema..."
            aria-label="Buscar"
          />
        </div>
      </div>

      <div className="topbar__user">
        <div className="topbar__avatar">{initials || "FG"}</div>
        <div className="topbar__user-copy">
          <strong>
            {user?.firstName} {user?.lastName}
          </strong>
          <span>{user?.role}</span>
        </div>

        <button
          className="icon-button"
          onClick={handleLogout}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <LogOut size={19} />
        </button>
      </div>
    </header>
  );
};
