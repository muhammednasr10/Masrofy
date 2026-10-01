import { Navigate } from "react-router-dom";

export default function AdminCategoriesRedirectPage() {
  return <Navigate to="/admin/settings" replace />;
}
