
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import RecordList from './pages/RecordList';
import Reports from './pages/Reports';
import MechanicForm from './App_Mechanic'; // Renamed previous App as MechanicForm

// Temporary Wrapper for Settings
const Settings = () => (
  <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px' }}>
    <h1 style={{ fontWeight: 800 }}>Ayarlar</h1>
    <p style={{ color: '#666' }}>Sistem ayarları ve kullanıcı yönetimi yakında burada olacak.</p>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Mechanic / Operator Route */}
        <Route path="/mechanic" element={<MechanicForm />} />

        {/* Admin Routes with Sidebar Layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="records" element={<RecordList />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
