import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/admin/AdminDashboard';
import CustomerManagement from './pages/admin/CustomerManagement';
import Reports from './pages/admin/Reports';
import SmartInsight from './pages/admin/SmartInsight';
import StaffDashboard from './pages/staff/StaffDashboard';
import CustomerList from './pages/staff/CustomerList';
import StaffReports from './pages/staff/StaffReports';
import AddReport from './pages/staff/AddReport';
import Profile from './pages/staff/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import CustomerProfile from './pages/CustomerProfile';
import AuditLogs from './pages/admin/AuditLogs';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:resetToken" element={<ResetPassword />} />
          <Route path="/admin" element={<ProtectedRoute role={['admin', 'manager']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/customers" element={<ProtectedRoute role={['admin', 'manager']}><CustomerManagement /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute role={['admin', 'manager']}><Reports /></ProtectedRoute>} />
          <Route path="/admin/insights" element={<ProtectedRoute role={['admin', 'manager']}><SmartInsight /></ProtectedRoute>} />
          <Route path="/admin/audit" element={<ProtectedRoute role="admin"><AuditLogs /></ProtectedRoute>} />
          
          <Route path="/customer/:id" element={<ProtectedRoute role={['admin', 'manager', 'staff']}><CustomerProfile /></ProtectedRoute>} />

          <Route path="/staff" element={<ProtectedRoute role="staff"><StaffDashboard /></ProtectedRoute>} />
          <Route path="/staff/customers" element={<ProtectedRoute role="staff"><CustomerList /></ProtectedRoute>} />
          <Route path="/staff/reports" element={<ProtectedRoute role="staff"><StaffReports /></ProtectedRoute>} />
          <Route path="/staff/add-report" element={<ProtectedRoute role="staff"><AddReport /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute role={['admin', 'manager', 'staff']}><Profile /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
