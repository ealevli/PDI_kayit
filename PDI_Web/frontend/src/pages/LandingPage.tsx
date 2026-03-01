import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShieldCheck, ClipboardList, Wrench } from 'lucide-react';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f4f4f4',
            fontFamily: 'Segoe UI, sans-serif'
        }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.5rem', margin: '0', fontWeight: '800', letterSpacing: '-1px' }}>PDI DIGITAL</h1>
                <p style={{ color: '#666', fontSize: '1.1rem' }}>Pre-Delivery Inspection Portal</p>
            </div>

            <div style={{ display: 'flex', gap: '20px', padding: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {/* OPERATÖR KARTI */}
                <div
                    onClick={() => navigate('/mechanic')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/mechanic'); }}
                    role="button"
                    tabIndex={0}
                    style={{ width: '240px', padding: '35px 20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', cursor: 'pointer', textAlign: 'center', transition: 'transform 0.2s', border: '2px solid transparent' }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-5px)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                    onFocus={(e) => (e.currentTarget.style.transform = 'translateY(-5px)')}
                    onBlur={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                    <div style={{ backgroundColor: '#f0f0f0', width: '65px', height: '65px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                        <User size={32} color="#000" />
                    </div>
                    <h2 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>OPERATÖR</h2>
                    <p style={{ color: '#777', fontSize: '0.85rem' }}>Yeni PDI kaydı oluşturun ve saha verilerini girin.</p>
                    <div style={{ marginTop: '18px', color: '#000', fontWeight: '700', fontSize: '0.85rem' }}>GİRİŞ YAP →</div>
                </div>

                {/* USTA KARTI */}
                <div
                    onClick={() => navigate('/usta')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/usta'); }}
                    role="button"
                    tabIndex={0}
                    style={{ width: '240px', padding: '35px 20px', backgroundColor: '#1e40af', color: '#fff', borderRadius: '12px', boxShadow: '0 10px 30px rgba(30,64,175,0.3)', cursor: 'pointer', textAlign: 'center', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-5px)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                    onFocus={(e) => (e.currentTarget.style.transform = 'translateY(-5px)')}
                    onBlur={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                    <div style={{ backgroundColor: '#1d4ed8', width: '65px', height: '65px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                        <Wrench size={32} color="#fff" />
                    </div>
                    <h2 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>USTA</h2>
                    <p style={{ color: '#bfdbfe', fontSize: '0.85rem' }}>PDI kayıt girişi ve kontrol listesi işlemlerinizi yapın.</p>
                    <div style={{ marginTop: '18px', color: '#fff', fontWeight: '700', fontSize: '0.85rem' }}>GİRİŞ YAP →</div>
                </div>

                {/* YÖNETİCİ KARTI */}
                <div
                    onClick={() => navigate('/admin')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/admin'); }}
                    role="button"
                    tabIndex={0}
                    style={{ width: '240px', padding: '35px 20px', backgroundColor: '#000', color: '#fff', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', cursor: 'pointer', textAlign: 'center', transition: 'transform 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-5px)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                    onFocus={(e) => (e.currentTarget.style.transform = 'translateY(-5px)')}
                    onBlur={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                    <div style={{ backgroundColor: '#333', width: '65px', height: '65px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                        <ShieldCheck size={32} color="#fff" />
                    </div>
                    <h2 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>YÖNETİCİ</h2>
                    <p style={{ color: '#aaa', fontSize: '0.85rem' }}>Dashboard, raporlar ve veri düzenleme paneline erişin.</p>
                    <div style={{ marginTop: '18px', color: '#fff', fontWeight: '700', fontSize: '0.85rem' }}>SİSTEME GİT →</div>
                </div>
            </div>

            <div style={{ marginTop: '50px', display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.6 }}>
                <ClipboardList size={16} />
                <span style={{ fontSize: '0.8rem' }}>Daimler Truck Digital Design System v1.0</span>
            </div>
        </div>
    );
};

export default LandingPage;
