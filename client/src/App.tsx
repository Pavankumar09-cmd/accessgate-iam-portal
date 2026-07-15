import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardShell } from './components/DashboardShell';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotResetPassword } from './pages/ForgotResetPassword';
import { Dashboard } from './pages/Dashboard';
import { Users } from './pages/Users';
import { Roles } from './pages/Roles';
import { Audits } from './pages/Audits';
import { Sessions } from './pages/Sessions';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotResetPassword />} />
          <Route path="/reset-password" element={<ForgotResetPassword />} />

          {/* Protected Console Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardShell>
                  <Dashboard />
                </DashboardShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute permission="users:read">
                <DashboardShell>
                  <Users />
                </DashboardShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles"
            element={
              <ProtectedRoute permission="users:read">
                <DashboardShell>
                  <Roles />
                </DashboardShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit"
            element={
              <ProtectedRoute permission="audit:read">
                <DashboardShell>
                  <Audits />
                </DashboardShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions"
            element={
              <ProtectedRoute>
                <DashboardShell>
                  <Sessions />
                </DashboardShell>
              </ProtectedRoute>
            }
          />

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
