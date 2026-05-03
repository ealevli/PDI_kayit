import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import RecordList from './pages/RecordList';
import Reports from './pages/Reports';
import ConectoReports from './pages/ConectoReports';
import Top5Analysis from './pages/Top5Analysis';
import ConectoTop3 from './pages/ConectoTop3';
import Settings from './pages/Settings';
import App_Mechanic from './App_Mechanic';
import Imalat from './pages/Imalat';
import ImalatReports from './pages/ImalatReports';
import ExcelImport from './pages/ExcelImport';
import PDIFormPage from './pages/PDIFormPage';
import DynamikFormYonetim from './pages/DynamikFormYonetim';
import PDISessionList from './pages/PDISessionList';

const DummyPage = ({ title }: { title: string }) => (
    <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px' }}>
        <h1 style={{ fontWeight: 800 }}>{title}</h1>
        <p style={{ color: '#666' }}>Bu sayfa yakında eklenecektir.</p>
    </div>
);

function App() {
    return (
        <Router>
            <Routes>
                {/* Landing Page */}
                <Route path="/" element={<LandingPage />} />

                {/* Mechanic / Operator Route */}
                <Route path="/mechanic" element={<App_Mechanic />} />

                {/* Usta Route - PDI dijital form */}
                <Route path="/usta" element={<PDIFormPage />} />

                {/* Admin Routes with Sidebar Layout */}
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="conecto" element={<ConectoReports />} />
                    <Route path="top5" element={<Top5Analysis />} />
                    <Route path="conecto-top3" element={<ConectoTop3 />} />
                    <Route path="records" element={<RecordList />} />
                    <Route path="imalat" element={<Imalat />} />
                    <Route path="imalat-rapor" element={<ImalatReports />} />
                    <Route path="pdi-sessions" element={<PDISessionList />} />
                    <Route path="dinamik-form" element={<DynamikFormYonetim />} />
                    <Route path="kullanicilar" element={<DummyPage title="Kullanıcı Yönetimi" />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="gecmis-veri" element={<ExcelImport />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
