import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './theme/ThemeProvider';
import { AppLayout } from './components/Layout/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { Templates } from './pages/Templates';
import { TemplateDetail } from './pages/TemplateDetail';
import { Favorites } from './pages/Favorites';
import { Settings } from './pages/Settings';
import { AdminTemplates } from './pages/AdminTemplates';
import { AuthProvider } from './contexts/auth/AuthProvider';
import { ToastProvider } from './contexts/ToastContext';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Router>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                
                {/* Protected routes with layout */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Home />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/templates"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Templates />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/templates/:id"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <TemplateDetail />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/favorites"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Favorites />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <Settings />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/admin/templates"
                  element={
                    <ProtectedRoute>
                      <AppLayout>
                        <AdminTemplates />
                      </AppLayout>
                    </ProtectedRoute>
                  }
                />
                
                {/* Redirect to home for unknown routes */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
