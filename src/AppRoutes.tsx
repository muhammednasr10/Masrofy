import { Navigate, Route, Routes } from "react-router-dom";
import AccountPage from "@/app/(app)/account/page";
import AdminCategoriesRedirectPage from "@/app/(app)/admin/categories/page";
import AdminSettingsPage from "@/app/(app)/admin/settings/page";
import CategoriesPage from "@/app/(app)/categories/page";
import DashboardPage from "@/app/(app)/dashboard/page";
import ExpensesPage from "@/app/(app)/expenses/page";
import FriendsPage from "@/app/(app)/friends/page";
import InvestmentsPage from "@/app/(app)/investments/page";
import AppLayout from "@/app/(app)/layout";
import PlanPage from "@/app/(app)/plan/page";
import ReportsPage from "@/app/(app)/reports/page";
import SavingsPage from "@/app/(app)/savings/page";
import WalletsPage from "@/app/(app)/wallets/page";
import ForgotPasswordPage from "@/app/(auth)/forgot-password/page";
import LoginPage from "@/app/(auth)/login/page";
import RegisterPage from "@/app/(auth)/register/page";
import ResetPasswordPage from "@/app/(auth)/reset-password/page";
import AuthCallbackPage from "@/app/auth/callback/AuthCallbackPage";
import HomePage from "@/app/page";
import PrivacyPage from "@/app/privacy/page";
import TermsPage from "@/app/terms/page";
import { AdminGuard, GuestOnly, RequireAuth } from "@/components/auth/RouteGuards";
import { Outlet } from "react-router-dom";

function ProtectedApp() {
  return (
    <RequireAuth>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </RequireAuth>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route
        path="/login"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route
        path="/register"
        element={
          <GuestOnly>
            <RegisterPage />
          </GuestOnly>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <GuestOnly>
            <ForgotPasswordPage />
          </GuestOnly>
        }
      />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedApp />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/wallets" element={<WalletsPage />} />
        <Route path="/plan" element={<PlanPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/investments" element={<InvestmentsPage />} />
        <Route path="/savings" element={<SavingsPage />} />
        <Route path="/friends" element={<FriendsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route
          path="/admin/settings"
          element={
            <AdminGuard>
              <AdminSettingsPage />
            </AdminGuard>
          }
        />
        <Route path="/admin/categories" element={<AdminCategoriesRedirectPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
