import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';

import Dashboard from './pages/Dashboard';
import ReportFound from './pages/ReportFound';
import ReportLost from './pages/ReportLost';

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/" />;
}

function PublicRoute({ children }) {
  const { currentUser } = useAuth();
  return !currentUser ? children : <Navigate to="/dashboard" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <Routes>
            <Route path="/" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />

            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            <Route path="/report-found" element={
              <PrivateRoute>
                <ReportFound />
              </PrivateRoute>
            } />
            <Route path="/report-lost" element={
              <PrivateRoute>
                <ReportLost />
              </PrivateRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App;
