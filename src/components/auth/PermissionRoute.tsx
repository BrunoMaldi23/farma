import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const PermissionRoute = ({ permission }: { permission: string }) => {
  const { hasPermission } = useAuth();

  if (!hasPermission(permission)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
};
