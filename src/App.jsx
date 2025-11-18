import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TenantDashboard from './pages/TenantDashboard';
import OptInPage from './pages/OptInPage';
import Unauthorized from './pages/Unauthorized';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/opt-in/:token" element={<OptInPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Routes - Admin Only */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute roles={['global_admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes - Tenant Users */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute roles={['tenant_admin', 'operator']}>
              <TenantDashboard />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              isAdmin() ? (
                <Navigate to="/admin" replace />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
