import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CustomCursor } from './components/CustomCursor';
import { Navbar } from './components/Navbar';

// Page imports
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Animals from './pages/Animals';
import Customers from './pages/Customers';
import Sales from './pages/Sales';
import Expenses from './pages/Expenses';
import Payments from './pages/Payments';
import Inventory from './pages/Inventory';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

export const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        {/* Custom PWA visual helpers */}
        <CustomCursor />

        <Routes>
          {/* Admin Direct Login Panel */}
          <Route path="/login" element={<Login />} />

          {/* Secure Farming Console routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-milk-50 transition-colors duration-500 overflow-x-hidden relative">
                  <Navbar />
                  
                  {/* Router Subpage Container */}
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/animals" element={<Animals />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/sales" element={<Sales />} />
                    <Route path="/expenses" element={<Expenses />} />
                    <Route path="/payments" element={<Payments />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                    
                    {/* Fallback to Dashboard */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AppProvider>
  );
};
export default App;
