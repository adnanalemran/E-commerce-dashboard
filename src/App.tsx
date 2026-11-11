import AppLayout from "@/components/layout/app-layout";
import {
  GuestRoute,
  ProtectedRoute,
  RoleRoute,
} from "@/components/shared/route-guards";
import CategoriesPage from "@/pages/main/catalog/categories";
import SubcategoriesPage from "@/pages/main/catalog/subcategories";
import ProductsPage from "@/pages/main/products";
import ProductEditorPage from "@/pages/main/products/editor";
import EcommercePage from "@/pages/main/dashboard/ecommerce";
import { Error404Page } from "@/pages/main/pages";
import ProfilePage from "@/pages/main/profile";
import UsersPage from "@/pages/main/users";
import {
  AuthLayout,
  ForgotPasswordPage,
  ResetPasswordPage,
  SignInPage,
  SignUpPage,
  VerifyEmailPage,
} from "@/pages/others/auth";
import { ADMIN_ROLES, STAFF_ROLES } from "@/utils/roles";
import { Route, Routes } from "react-router";

export default function App() {
  return (
    <Routes>
      {/* Dashboard Layout (signed-in users only) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<EcommercePage />} />

          {/* Catalog (admins & managers) */}
          <Route element={<RoleRoute roles={STAFF_ROLES} />}>
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/new" element={<ProductEditorPage />} />
            <Route path="/products/:id/edit" element={<ProductEditorPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/subcategories" element={<SubcategoriesPage />} />
          </Route>

          {/* User management (admins) */}
          <Route element={<RoleRoute roles={ADMIN_ROLES} />}>
            <Route path="/users" element={<UsersPage />} />
          </Route>

          {/* Account */}
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Auth Layout */}
      <Route element={<AuthLayout />}>
        {/* Signed-out users only */}
        <Route element={<GuestRoute />}>
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Email links from the backend: `${CORS_ORIGIN}/auth/...?token=` */}
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
      </Route>

      {/* Full-width / Error / Status Pages */}
      <Route path="/error-404" element={<Error404Page />} />

      {/* Fallback Route */}
      <Route path="*" element={<Error404Page />} />
    </Routes>
  );
}
