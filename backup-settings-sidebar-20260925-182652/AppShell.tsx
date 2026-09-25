import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const COLLAPSE_KEY = "farmacia_sidebar_collapsed";

export const AppShell = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === "1",
  );

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className={`app-shell ${collapsed ? "app-shell--collapsed" : ""}`}>
      <Sidebar
        open={menuOpen}
        collapsed={collapsed}
        onClose={() => setMenuOpen(false)}
        onToggleCollapse={() => setCollapsed((value) => !value)}
      />

      <div className="app-shell__workspace">
        <Topbar onOpenMenu={() => setMenuOpen(true)} />

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
