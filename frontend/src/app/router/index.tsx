import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from '@/app/layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleBasedRoute } from './RoleBasedRoute';

import DashboardPage from '@/features/dashboard/pages/DashboardPage';
import ProjectsPage from '@/features/projects/pages/ProjectsPage';
import ProjectDetailPage from '@/features/projects/pages/ProjectDetailPage';
import DepartmentsPage from '@/features/departments/pages/DepartmentsPage';
import DepartmentDetailPage from '@/features/departments/pages/DepartmentDetailPage';
import SettingsPage from '@/features/settings/pages/SettingsPage';
import MyTasksTablePage from '@/features/tasks/pages/MyTasksTablePage';
import MyEmployeesDashboardPage from '@/features/analytics/pages/MyEmployeesDashboardPage';
import DepartmentMembersSettingsPage from '@/features/departments/pages/DepartmentMembersSettingsPage';
import PermissionSettingsPage from '@/features/permissions/pages/PermissionSettingsPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { ChangePasswordPage } from '@/features/auth/pages/ChangePasswordPage';
import { AcceptInvitePage } from '@/features/auth/pages/AcceptInvitePage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import { InvitationsPage } from '@/features/invitations/pages/InvitationsPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/accept-invite" element={<AcceptInvitePage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route
              path="/invitations"
              element={(
                <RoleBasedRoute roles={['admin']}>
                  <InvitationsPage />
                </RoleBasedRoute>
              )}
            />
            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/departments/:id" element={<DepartmentDetailPage />} />
            <Route path="/departments/:id/settings/members" element={<DepartmentMembersSettingsPage />} />
            <Route path="/departments/:id/settings/permissions" element={<PermissionSettingsPage />} />
            <Route path="/projects/:id/settings/permissions" element={<PermissionSettingsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/my-tasks" element={<MyTasksTablePage />} />
            <Route
              path="/employees"
              element={(
                <RoleBasedRoute roles={['admin', 'manager']}>
                  <MyEmployeesDashboardPage />
                </RoleBasedRoute>
              )}
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
