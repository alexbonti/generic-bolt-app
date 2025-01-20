import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Home from './pages/Home';
import Services from './pages/Services';
import Tickets from './pages/Tickets';
import NewTicket from './pages/NewTicket';
import TicketDetail from './pages/TicketDetail';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

function App() {
  const { loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="services" element={<Services />} />
          
          <Route
            path="tickets"
            element={
              <PrivateRoute>
                <Tickets />
              </PrivateRoute>
            }
          />
          
          <Route
            path="tickets/new"
            element={
              <PrivateRoute>
                <NewTicket />
              </PrivateRoute>
            }
          />
          
          <Route
            path="tickets/:id"
            element={
              <PrivateRoute>
                <TicketDetail />
              </PrivateRoute>
            }
          />

          <Route
            path="profile/:id"
            element={<Profile />}
          />
          
          <Route
            path="admin/*"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
